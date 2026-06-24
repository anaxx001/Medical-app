import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowLeft, Send, Paperclip } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "me" | "peer";
  content: string;
  timestamp: string;
  reactions?: Record<string, string[]>; // emoji -> array of user ids who reacted
}

export default function ChatPage({ params }: { params: { userId: string } }) {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  
  // normal vs structured revision modal study mode toggle (Section 9 Brief)
  const [studyMode, setStudyMode] = useState<"normal" | "structured">("normal");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [peerProfile, setPeerProfile] = useState<any>(null);

  // Load the real peer profile and verify there's an accepted chat pair
  // before showing a composer — mirrors the DB-level gate on direct_messages,
  // so a user can't land on a stale/unauthorized chat link and see a fake UI.
  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      const { data: peer } = await supabase
        .from("profiles")
        .select("id, username, full_name, profession, institution, avatar_url")
        .eq("id", params.userId)
        .maybeSingle();

      if (peer) {
        setPeerProfile(peer);
      }

      const { data: pair } = await supabase
        .from("accepted_chat_pairs")
        .select("id")
        .or(
          `and(user_a.eq.${user.id},user_b.eq.${params.userId}),and(user_a.eq.${params.userId},user_b.eq.${user.id})`
        )
        .maybeSingle();

      setHasAccess(!!pair);
      setLoading(false);
    }
    init();
  }, [params.userId]);

  // Load real message history once we know who we're talking to and that
  // there's an accepted pair, then subscribe to realtime for new messages.
  useEffect(() => {
    if (!currentUserId || !hasAccess) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function loadMessages() {
      const { data } = await supabase
        .from("direct_messages")
        .select("id, sender_id, content, reactions, created_at, is_read")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${params.userId}),and(sender_id.eq.${params.userId},receiver_id.eq.${currentUserId})`
        )
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      const mapped: ChatMessage[] = (data || []).map((m: any) => ({
        id: m.id,
        sender: m.sender_id === currentUserId ? "me" : "peer",
        content: m.content,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        reactions: m.reactions || {},
      }));
      setMessages(mapped);

      // Mark any unread messages from the peer as read now that we've opened the thread.
      const unreadIds = (data || [])
        .filter((m: any) => m.sender_id === params.userId && !m.is_read)
        .map((m: any) => m.id);
      if (unreadIds.length > 0) {
        await supabase.from("direct_messages").update({ is_read: true }).in("id", unreadIds);
      }
    }

    loadMessages();

    // Realtime: append any new message in either direction for this pair.
    channel = supabase
      .channel(`dm-${[currentUserId, params.userId].sort().join("-")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const m = payload.new;
          const belongsToThisPair =
            (m.sender_id === currentUserId && m.receiver_id === params.userId) ||
            (m.sender_id === params.userId && m.receiver_id === currentUserId);
          if (!belongsToThisPair) return;

          setMessages((prev) => {
            if (prev.some((existing) => existing.id === m.id)) return prev;
            return [
              ...prev,
              {
                id: m.id,
                sender: m.sender_id === currentUserId ? "me" : "peer",
                content: m.content,
                timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                reactions: m.reactions || {},
              },
            ];
          });

          // If the incoming message is from the peer, mark it read immediately
          // since the thread is currently open.
          if (m.sender_id === params.userId) {
            supabase.from("direct_messages").update({ is_read: true }).eq("id", m.id);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUserId, hasAccess, params.userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputVal;
    if (!textToSend.trim() || !currentUserId || !hasAccess) return;

    setInputVal("");

    const { data, error } = await supabase
      .from("direct_messages")
      .insert({
        sender_id: currentUserId,
        receiver_id: params.userId,
        content: textToSend,
      })
      .select("id, created_at")
      .single();

    if (error || !data) {
      console.error("Failed to send message:", error);
      alert("Your message couldn't be sent. Please try again.");
      setInputVal(textToSend);
      return;
    }

    // Add using the real DB id so the realtime INSERT event for this same row
    // (which will arrive a moment later) gets deduped instead of double-added.
    setMessages((prev) => [
      ...prev,
      {
        id: data.id,
        sender: "me",
        content: textToSend,
        timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        reactions: {},
      },
    ]);
  };

  const addReaction = async (msgId: string, emoji: string) => {
    if (!currentUserId) return;
    const message = messages.find((m) => m.id === msgId);
    if (!message) return;

    const current = message.reactions || {};
    const usersForEmoji = current[emoji] || [];
    const alreadyReacted = usersForEmoji.includes(currentUserId);
    const updatedUsers = alreadyReacted
      ? usersForEmoji.filter((id) => id !== currentUserId)
      : [...usersForEmoji, currentUserId];
    const updatedReactions = { ...current, [emoji]: updatedUsers };

    setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: updatedReactions } : m)));
    await supabase.from("direct_messages").update({ reactions: updatedReactions }).eq("id", msgId);
  };

  // Preformed medical student study prompts (Section 9 Study Mode)
  const structuralPrompts = [
    "Test me on drug-clearing equations:",
    "Explain this case study diagnosis:",
    "Review this anatomy viva dissection guide:"
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", fontWeight: 500 }}>Loading chat...</p>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--bg)", padding: "24px", textAlign: "center", gap: "12px" }}>
        <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)" }}>
          You don't have an active chat with {peerProfile?.full_name || peerProfile?.username || "this person"} yet.
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "320px" }}>
          A chat only opens up once a request between you two has been sent and accepted.
        </p>
        <Link href="/messages" style={{ color: "#0D9488", fontWeight: 700, fontSize: "13px", textDecoration: "none", marginTop: "8px" }}>
          ← Back to Messages
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", fontFamily: "var(--font-sans, sans-serif)", color: "var(--text)" }}>
      
      {/* CONTEXT-AWARE HEADER (Section 9) */}
      <div style={{ 
        padding: "16px 20px", 
        borderBottom: "1px solid var(--border)", 
        background: "var(--surface)", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center" 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/messages" style={{ color: "var(--text-muted)", display: "flex" }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />
              <strong style={{ fontSize: "15px" }}>{peerProfile?.full_name || peerProfile?.username || "Medical Student"}</strong>
              <span style={{ fontSize: "11px", background: "rgba(13,148,136,0.1)", color: "#0D9488", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                {peerProfile?.profession || "Peer Student"}
              </span>
            </div>
            {peerProfile?.institution && (
              <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                Active on <strong style={{ color: "#0D9488" }}>[{peerProfile.institution}]</strong>
              </span>
            )}
          </div>
        </div>

        {/* Study Mode toggle switch (Normal vs Structured Q&A) */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: studyMode === "structured" ? "#0D9488" : "var(--text-muted)" }}>
            Structured Q&A Mode
          </span>
          <button 
            onClick={() => setStudyMode(studyMode === "normal" ? "structured" : "normal")}
            style={{ 
              background: studyMode === "structured" ? "#0D9488" : "var(--border)", 
              borderRadius: "20px", 
              width: "44px", 
              height: "24px", 
              border: "none", 
              cursor: "pointer", 
              position: "relative",
              transition: "background 0.2s" 
            }}
          >
            <motion.div 
              layout 
              style={{ 
                width: "18px", 
                height: "18px", 
                borderRadius: "50%", 
                background: "white", 
                position: "absolute", 
                left: studyMode === "structured" ? "22px" : "4px", 
                top: "3px" 
              }} 
            />
          </button>
        </div>
      </div>

      {/* MESSAGES CONSOLE */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", background: "var(--bg)" }}>
        
        {/* Structured Revision prompt guide at the top if active */}
        {studyMode === "structured" && (
          <div style={{ background: "rgba(13,148,136,0.06)", border: "1px solid rgba(13,148,136,0.15)", borderRadius: "12px", padding: "14px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11.5px", fontWeight: 700, textTransform: "uppercase", color: "#0D9488", letterSpacing: "1px", display: "block", marginBottom: "4px" }}>
              Structured study templates active
            </span>
            <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.4 }}>
              Select a quick peer calculation parameter prompt below to immediately trigger quiz feedback checking loops.
            </p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
              {structuralPrompts.map((p, i) => (
                <button 
                  key={i} 
                  onClick={() => { setInputVal(p); handleSendMessage(undefined, p); }}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "4px 10px", fontSize: "11.5px", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const isPeer = m.sender === "peer";
          const activeReactions = Object.entries(m.reactions || {}).filter(([, users]) => users.length > 0);
          return (
            <div 
              key={m.id}
              style={{ 
                display: "flex", 
                justifyContent: isPeer ? "flex-start" : "flex-end", 
                alignItems: "flex-start",
                gap: "10px" 
              }}
            >
              <div style={{ maxWidth: "75%" }}>
                <div style={{
                  background: isPeer ? "var(--surface)" : "var(--gradient)",
                  color: isPeer ? "var(--text)" : "white",
                  border: isPeer ? "1px solid var(--border)" : "none",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                  fontSize: "13.5px",
                  lineHeight: 1.4
                }}>
                  {m.content}
                </div>

                {/* Info & Micro Reactions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", padding: "0 4px" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{m.timestamp}</span>
                  
                  {isPeer && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      <button onClick={() => addReaction(m.id, "💡")} style={{ background: "none", border: "none", fontSize: "11px", cursor: "pointer" }}>💡</button>
                      <button onClick={() => addReaction(m.id, "❓")} style={{ background: "none", border: "none", fontSize: "11px", cursor: "pointer" }}>❓</button>
                      {activeReactions.map(([emoji, users]) => (
                        <span key={emoji} style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "4px", padding: "1px 4px", fontSize: "10px" }}>
                          {emoji} {users.length > 1 ? users.length : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* CHAT INPUT PANEL */}
      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
        <form onSubmit={handleSendMessage} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          
          <button type="button" style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}>
            <Paperclip size={20} />
          </button>

          <input
            type="text"
            placeholder={studyMode === "structured" ? "Structured revision parameters loaded..." : `Type a message to ${(peerProfile?.full_name || peerProfile?.username || "your peer").split(" ")[0]}...`}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: "var(--surface-muted)",
              color: "var(--text)",
              fontFamily: "var(--font-body)",
              fontSize: "13.5px",
              outline: "none"
            }}
          />

          <button type="submit" style={{ background: "var(--gradient)", border: "none", width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "white", cursor: "pointer" }}>
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
}
