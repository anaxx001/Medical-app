import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, useParams } from "wouter";
import { ArrowLeft, Send, Check } from "lucide-react";
import AppShell from "@/components/AppShell";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_online?: boolean;
};

function Avatar({ name, avatar, size = 40, isOnline }: { name: string; avatar: string | null; size?: number; isOnline?: boolean }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.36,
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        overflow: "hidden",
      }}>
        {avatar
          ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          : name?.[0]?.toUpperCase() || "M"}
      </div>
      {isOnline && (
        <div style={{
          position: "absolute",
          bottom: 1,
          right: 1,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: "#22c55e",
          border: "2px solid var(--surface)",
        }} />
      )}
    </div>
  );
}

export default function ChatPage() {
  const supabase = createClient();
  const params = useParams<{ userId: string }>();
  const [, navigate] = useLocation();
  const otherUserId = params.userId;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  // Fetch current user and other user profile
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_online")
        .eq("id", otherUserId)
        .single();

      setOtherUser(profile);

      // Fetch messages
      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
      setLoading(false);

      // Mark messages as read
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
    }
    init();
  }, [otherUserId]);

  // Realtime subscription for messages and typing
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel(`chat:${[currentUser.id, otherUserId].sort().join("_")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "direct_messages",
      }, (payload) => {
        const msg = payload.new as Message;
        const isRelevant =
          (msg.sender_id === currentUser.id && msg.receiver_id === otherUserId) ||
          (msg.sender_id === otherUserId && msg.receiver_id === currentUser.id);
        if (isRelevant) {
          setMessages(prev => [...prev, msg]);
          // Mark as read if received
          if (msg.sender_id === otherUserId) {
            supabase.from("direct_messages")
              .update({ is_read: true })
              .eq("id", msg.id);
          }
        }
      })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId === otherUserId) {
          setOtherTyping(true);
          setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUser, otherUserId]);

  // Auto scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // Send typing indicator
  function handleTyping(value: string) {
    setInput(value);
    if (!channelRef.current || !currentUser) return;
    channelRef.current.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: currentUser.id },
    });
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
  }

  // Send message
  async function sendMessage() {
    if (!input.trim() || !currentUser || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      content,
      is_read: false,
    });

    if (error) {
      console.error("Send error:", error);
      setInput(content); // restore on error
    }
    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const displayName = otherUser?.full_name || otherUser?.username || "User";

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100vh",
      background: "var(--bg)",
      maxWidth: "600px",
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "12px 16px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        boxShadow: "var(--shadow-xs)",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <button
          onClick={() => navigate("/messages")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--teal)",
            display: "flex",
            alignItems: "center",
            padding: "4px",
          }}
        >
          <ArrowLeft size={22} />
        </button>

        <Avatar
          name={displayName}
          avatar={otherUser?.avatar_url || null}
          size={40}
          isOnline={otherUser?.is_online}
        />

        <div style={{ flex: 1 }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "15px",
            color: "var(--text)",
            lineHeight: 1.2,
          }}>
            {displayName}
          </p>
          <p style={{
            fontSize: "11px",
            color: otherUser?.is_online ? "#22c55e" : "var(--text-light)",
          }}>
            {otherTyping ? "typing..." : otherUser?.is_online ? "Active now" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "3px solid var(--border)",
              borderTop: "3px solid var(--teal)",
              animation: "spin 0.8s linear infinite",
            }} />
          </div>
        ) : messages.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            textAlign: "center",
            padding: "40px 20px",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👋</div>
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "16px",
              color: "var(--text)",
              marginBottom: "6px",
            }}>
              Say hello to {displayName}!
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              This is the beginning of your conversation.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: isMine ? "flex-end" : "flex-start",
                  alignItems: "flex-end",
                  gap: "6px",
                }}
              >
                {!isMine && (
                  <Avatar
                    name={displayName}
                    avatar={otherUser?.avatar_url || null}
                    size={28}
                  />
                )}
                <div style={{
                  maxWidth: "72%",
                  padding: "10px 14px",
                  borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMine ? "var(--gradient)" : "var(--surface)",
                  border: isMine ? "none" : "1px solid var(--border)",
                  boxShadow: "var(--shadow-xs)",
                }}>
                  <p style={{
                    fontSize: "14px",
                    color: isMine ? "white" : "var(--text)",
                    lineHeight: 1.5,
                    wordBreak: "break-word",
                  }}>
                    {msg.content}
                  </p>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: "3px",
                    marginTop: "4px",
                  }}>
                    <span style={{
                      fontSize: "10px",
                      color: isMine ? "rgba(255,255,255,0.7)" : "var(--text-light)",
                    }}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && (
                      <Check
                        size={12}
                        color={msg.is_read ? "#22c55e" : "rgba(255,255,255,0.7)"}
                        strokeWidth={2.5}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
            <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={28} />
            <div style={{
              padding: "10px 14px",
              borderRadius: "18px 18px 18px 4px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              display: "flex",
              gap: "4px",
              alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "var(--text-muted)",
                  animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Bar */}
      <div style={{
        padding: "12px 16px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "flex-end",
        gap: "10px",
      }}>
        <textarea
          value={input}
          onChange={e => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1.5px solid var(--border)",
            background: "var(--surface-2)",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--text)",
            outline: "none",
            resize: "none",
            maxHeight: "120px",
            lineHeight: 1.5,
            transition: "border-color 0.2s ease",
          }}
          onFocus={e => e.target.style.borderColor = "var(--teal)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          style={{
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            border: "none",
            background: input.trim() ? "var(--gradient)" : "var(--border)",
            color: input.trim() ? "white" : "var(--text-light)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: input.trim() ? "pointer" : "not-allowed",
            flexShrink: 0,
            transition: "all 0.2s ease",
            boxShadow: input.trim() ? "0 4px 12px rgba(13,148,136,0.35)" : "none",
          }}
        >
          <Send size={18} />
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}