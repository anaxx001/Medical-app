import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Send, Check, MoreVertical, Search, Image,
  File, Smile, Reply, X, Trash2, Edit2, Forward,
  Pin, VolumeX, Shield, Clock, ChevronDown
} from "lucide-react";

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_id?: string | null;
  reply_to_content?: string | null;
  reactions?: Record<string, string[]>;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  vanish_at?: string | null;
};

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_online?: boolean;
};

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "🎉", "💯"];

function Avatar({
  name, avatar, size = 40, isOnline
}: {
  name: string; avatar: string | null; size?: number; isOnline?: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--gradient)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.36, color: "white",
        fontFamily: "var(--font-display)", fontWeight: 700, overflow: "hidden",
      }}>
        {avatar
          ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          : name?.[0]?.toUpperCase() || "M"}
      </div>
      {isOnline && (
        <div style={{
          position: "absolute", bottom: 1, right: 1,
          width: size * 0.25, height: size * 0.25,
          borderRadius: "50%", background: "#22c55e",
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
  const [otherTyping, setOtherTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Init
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

      const { data: msgs } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });

      setMessages((msgs || []).filter((m: Message) => {
        if (m.vanish_at && new Date(m.vanish_at) < new Date()) return false;
        return true;
      }));
      setLoading(false);

      await supabase.from("direct_messages")
        .update({ is_read: true })
        .eq("sender_id", otherUserId)
        .eq("receiver_id", user.id)
        .eq("is_read", false);
    }
    init();
  }, [otherUserId]);

  // Realtime
  useEffect(() => {
    if (!currentUser) return;
    const channel = supabase
      .channel(`chat:${[currentUser.id, otherUserId].sort().join("_")}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages", filter: `receiver_id=eq.${currentUser.id}` },
        (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === otherUserId) {
            setMessages(prev => [...prev, msg]);
            supabase.from("direct_messages").update({ is_read: true }).eq("id", msg.id);
          }
        })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "direct_messages" },
        (payload) => {
          const updated = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updated.id ? updated : m));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "direct_messages" },
        (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId === otherUserId) {
          setOtherTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      })
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, otherUserId]);

  // Scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, otherTyping]);

  // Scroll button visibility
  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
  }

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  // Typing
  function handleTyping(value: string) {
    setInput(value);
    if (!channelRef.current || !currentUser) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUser.id } });
  }

  // Auto-resize textarea
  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    handleTyping(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  // Send
  async function sendMessage() {
    if (!input.trim() || !currentUser || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const vanishAt = vanishMode
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    const optimistic: Message = {
      id: crypto.randomUUID(),
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id || null,
      reply_to_content: replyTo?.content || null,
      vanish_at: vanishAt,
    };

    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);
    setEditingMsg(null);

    if (editingMsg) {
      const { error } = await supabase.from("direct_messages")
        .update({ content, is_edited: true })
        .eq("id", editingMsg.id);
      if (error) setMessages(prev => prev.filter(m => m.id !== optimistic.id));
    } else {
      const { error } = await supabase.from("direct_messages").insert({
        sender_id: currentUser.id,
        receiver_id: otherUserId,
        content,
        is_read: false,
        reply_to_id: replyTo?.id || null,
        reply_to_content: replyTo?.content || null,
        vanish_at: vanishAt,
      });
      if (error) {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInput(content);
      }
    }
    setSending(false);
  }

  // File upload
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const fileType = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext) ? "image"
      : ["mp4", "mov", "webm"].includes(ext) ? "video"
      : ["mp3", "wav", "m4a", "aac"].includes(ext) ? "audio"
      : "document";

    const path = `dm/${currentUser.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("materials").upload(path, file);
    if (error) { console.error("Upload error:", error); return; }

    const { data: { publicUrl } } = supabase.storage.from("materials").getPublicUrl(path);

    await supabase.from("direct_messages").insert({
      sender_id: currentUser.id,
      receiver_id: otherUserId,
      content: file.name,
      file_url: publicUrl,
      file_type: fileType,
      file_name: file.name,
      is_read: false,
    });
  }

  // Delete message
  async function deleteMessage(msg: Message, forEveryone: boolean) {
    setSelectedMsg(null);
    if (forEveryone) {
      await supabase.from("direct_messages")
        .update({ is_deleted: true, content: "This message was deleted" })
        .eq("id", msg.id);
    } else {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  }

  // React to message
  async function reactToMessage(msgId: string, emoji: string) {
    setShowEmojiPicker(null);
    const msg = messages.find(m => m.id === msgId);
    if (!msg || !currentUser) return;
    const reactions = { ...(msg.reactions || {}) };
    const users = reactions[emoji] || [];
    if (users.includes(currentUser.id)) {
      reactions[emoji] = users.filter(u => u !== currentUser.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji] = [...users, currentUser.id];
    }
    await supabase.from("direct_messages").update({ reactions }).eq("id", msgId);
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, reactions } : m));
  }

  // Pin message
  async function pinMessage(msg: Message) {
    setPinnedMsg(msg);
    setSelectedMsg(null);
  }

  // Forward message
  function forwardMessage(msg: Message) {
    setSelectedMsg(null);
    navigate("/messages");
  }

  const displayName = otherUser?.full_name || otherUser?.username || "User";
  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;
  const mediaMessages = messages.filter(m => m.file_type === "image" || m.file_type === "video");

  function renderFileMessage(msg: Message) {
    if (msg.file_type === "image") return (
      <img src={msg.file_url!} alt={msg.file_name || "image"}
        style={{ maxWidth: "220px", maxHeight: "200px", borderRadius: "12px", display: "block" }} />
    );
    if (msg.file_type === "video") return (
      <video controls style={{ maxWidth: "220px", borderRadius: "12px" }}>
        <source src={msg.file_url!} />
      </video>
    );
    if (msg.file_type === "audio") return (
      <audio controls style={{ width: "200px" }}>
        <source src={msg.file_url!} />
      </audio>
    );
    return (
      <a href={msg.file_url!} target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: "8px", color: "inherit", textDecoration: "none" }}>
        <File size={20} />
        <span style={{ fontSize: "13px", textDecoration: "underline" }}>{msg.file_name}</span>
      </a>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg)", maxWidth: "600px", margin: "0 auto", position: "relative" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)", boxShadow: "var(--shadow-xs)", position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--teal)", display: "flex", alignItems: "center", padding: "4px" }}>
          <ArrowLeft size={22} />
        </button>
        <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={38} isOnline={otherUser?.is_online} />
        <div style={{ flex: 1 }} onClick={() => navigate(`/profile/${otherUser?.username}`)}>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", lineHeight: 1.2, cursor: "pointer" }}>{displayName}</p>
          <p style={{ fontSize: "11px", color: otherUser?.is_online ? "#22c55e" : "var(--text-light)" }}>
            {otherTyping ? "typing..." : otherUser?.is_online ? "Active now" : "Offline"}
          </p>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "6px" }}>
          <Search size={18} />
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "6px" }}>
            <MoreVertical size={18} />
          </button>
          {showMenu && (
            <div style={{ position: "absolute", right: 0, top: "100%", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)", zIndex: 100, minWidth: "180px", overflow: "hidden" }}>
              {[
                { icon: <Image size={15} />, label: "Media Gallery", action: () => { setShowMediaGallery(true); setShowMenu(false); } },
                { icon: <VolumeX size={15} />, label: isMuted ? "Unmute Chat" : "Mute Chat", action: () => { setIsMuted(!isMuted); setShowMenu(false); } },
                { icon: <Clock size={15} />, label: vanishMode ? "Disable Vanish Mode" : "Vanish Mode", action: () => { setVanishMode(!vanishMode); setShowMenu(false); } },
                { icon: <Shield size={15} />, label: "Block & Report", action: () => setShowMenu(false) },
              ].map((item, i) => (
                <button key={i} onClick={item.action} style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: i === 3 ? "var(--error)" : "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", textAlign: "left" }}
                  onMouseOver={e => (e.currentTarget.style.background = "var(--surface-hover)")}
                  onMouseOut={e => (e.currentTarget.style.background = "none")}>
                  {item.icon}{item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {showSearch && (
        <div style={{ padding: "8px 14px", background: "var(--surface-2)", borderBottom: "1px solid var(--border)" }}>
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "20px", border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", outline: "none" }}
            autoFocus />
        </div>
      )}

      {/* Vanish Mode Banner */}
      {vanishMode && (
        <div style={{ padding: "6px 14px", background: "rgba(139,92,246,0.1)", borderBottom: "1px solid rgba(139,92,246,0.2)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Clock size={13} color="#8b5cf6" />
          <span style={{ fontSize: "12px", color: "#8b5cf6", fontWeight: 600 }}>Vanish mode on — messages disappear in 24h</span>
        </div>
      )}

      {/* Pinned Message */}
      {pinnedMsg && (
        <div style={{ padding: "8px 14px", background: "var(--teal-soft)", borderBottom: "1px solid var(--border-glow)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Pin size={13} color="var(--teal)" />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "10px", color: "var(--teal)", fontWeight: 600, marginBottom: "1px" }}>PINNED</p>
            <p style={{ fontSize: "12px", color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.content}</p>
          </div>
          <button onClick={() => setPinnedMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
        </div>
      )}

      {/* Media Gallery Modal */}
      {showMediaGallery && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.8)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px", gap: "12px" }}>
            <button onClick={() => setShowMediaGallery(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}><X size={22} /></button>
            <h3 style={{ color: "white", fontFamily: "var(--font-display)", fontWeight: 700 }}>Shared Media</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", padding: "0 2px" }}>
            {mediaMessages.map(m => (
              <div key={m.id} style={{ aspectRatio: "1", overflow: "hidden", background: "var(--surface-3)" }}>
                {m.file_type === "image" && <img src={m.file_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {m.file_type === "video" && <video src={m.file_url!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
            ))}
            {mediaMessages.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>No shared media yet</div>
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={messagesContainerRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "6px" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "3px solid var(--border)", borderTop: "3px solid var(--teal)", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : filteredMessages.length === 0 && !searchQuery ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px 20px" }}>
            <div style={{ fontSize: "48px", marginBottom: "12px" }}>👋</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", color: "var(--text)", marginBottom: "6px" }}>Say hello to {displayName}!</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>This is the beginning of your conversation.</p>
          </div>
 ) : (
          filteredMessages.map((msg) => {
            const isMine = msg.sender_id === currentUser?.id;
            const isDeleted = msg.is_deleted;
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
                {/* Reply preview */}
                {msg.reply_to_content && (
                  <div style={{ maxWidth: "72%", padding: "4px 10px", borderRadius: "8px", background: "var(--surface-3)", borderLeft: "3px solid var(--teal)", marginBottom: "3px", fontSize: "11px", color: "var(--text-muted)" }}>
                    {msg.reply_to_content.slice(0, 60)}{msg.reply_to_content.length > 60 ? "..." : ""}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", flexDirection: isMine ? "row-reverse" : "row" }}>
                  {!isMine && <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={26} />}
                  <div
                    onDoubleClick={() => !isDeleted && setReplyTo(msg)}
                    onContextMenu={e => { e.preventDefault(); setSelectedMsg(msg); }}
                    style={{
                      maxWidth: "72%", padding: "10px 14px",
                      borderRadius: isMine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                      background: isDeleted ? "var(--surface-3)" : isMine ? "var(--gradient)" : "var(--surface)",
                      border: isMine ? "none" : "1px solid var(--border)",
                      boxShadow: "var(--shadow-xs)", cursor: "pointer",
                    }}>
                    {msg.file_url ? renderFileMessage(msg) : (
                      <p style={{ fontSize: "14px", color: isDeleted ? "var(--text-muted)" : isMine ? "white" : "var(--text)", lineHeight: 1.5, wordBreak: "break-word", fontStyle: isDeleted ? "italic" : "normal" }}>
                        {msg.content}
                      </p>
                    )}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", marginTop: "4px" }}>
                      {msg.is_edited && <span style={{ fontSize: "9px", color: isMine ? "rgba(255,255,255,0.6)" : "var(--text-light)" }}>edited</span>}
                      {msg.vanish_at && <Clock size={9} color={isMine ? "rgba(255,255,255,0.6)" : "var(--text-light)"} />}
                      <span style={{ fontSize: "10px", color: isMine ? "rgba(255,255,255,0.7)" : "var(--text-light)" }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMine && !isDeleted && (
                        <Check size={12} color={msg.is_read ? "#22c55e" : "rgba(255,255,255,0.7)"} strokeWidth={2.5} />
                      )}
                    </div>
                  </div>
                </div>

                {/* Reactions */}
                {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                  <div style={{ display: "flex", gap: "4px", marginTop: "3px", flexWrap: "wrap", justifyContent: isMine ? "flex-end" : "flex-start", paddingLeft: isMine ? 0 : "32px" }}>
                    {Object.entries(msg.reactions).map(([emoji, users]) => (
                      users.length > 0 && (
                        <button key={emoji} onClick={() => reactToMessage(msg.id, emoji)}
                          style={{ display: "flex", alignItems: "center", gap: "3px", padding: "2px 7px", borderRadius: "12px", border: `1px solid ${users.includes(currentUser?.id) ? "var(--teal)" : "var(--border)"}`, background: users.includes(currentUser?.id) ? "var(--teal-soft)" : "var(--surface)", cursor: "pointer", fontSize: "12px" }}>
                          <span>{emoji}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{users.length}</span>
                        </button>
                      )
                    ))}
                  </div>
                )}

                {/* Emoji picker for this message */}
                {showEmojiPicker === msg.id && (
                  <div style={{ display: "flex", gap: "6px", padding: "8px 10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", boxShadow: "var(--shadow-md)", marginTop: "4px" }}>
                    {EMOJIS.map(e => (
                      <button key={e} onClick={() => reactToMessage(msg.id, e)}
                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", lineHeight: 1 }}>{e}</button>
                    ))}
                    <button onClick={() => setShowEmojiPicker(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={14} /></button>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
            <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={26} />
            <div style={{ padding: "10px 14px", borderRadius: "18px 18px 18px 4px", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", gap: "4px", alignItems: "center" }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--text-muted)", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={scrollToBottom} style={{ position: "absolute", bottom: "80px", right: "16px", width: "36px", height: "36px", borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>
          <ChevronDown size={18} color="var(--teal)" />
        </button>
      )}

      {/* Message action menu (long press / right click) */}
      {selectedMsg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.3)" }} onClick={() => setSelectedMsg(null)}>
          <div style={{ position: "absolute", bottom: "100px", left: "50%", transform: "translateX(-50%)", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", boxShadow: "var(--shadow-lg)", minWidth: "200px", overflow: "hidden" }}
            onClick={e => e.stopPropagation()}>
            {[
              { icon: <Reply size={15} />, label: "Reply", action: () => { setReplyTo(selectedMsg); setSelectedMsg(null); } },
              { icon: <Smile size={15} />, label: "React", action: () => { setShowEmojiPicker(selectedMsg.id); setSelectedMsg(null); } },
              { icon: <Pin size={15} />, label: "Pin Message", action: () => pinMessage(selectedMsg) },
              { icon: <Forward size={15} />, label: "Forward", action: () => forwardMessage(selectedMsg) },
              ...(selectedMsg.sender_id === currentUser?.id ? [
                { icon: <Edit2 size={15} />, label: "Edit", action: () => { setEditingMsg(selectedMsg); setInput(selectedMsg.content); setSelectedMsg(null); } },
                { icon: <Trash2 size={15} />, label: "Delete for me", action: () => deleteMessage(selectedMsg, false) },
                { icon: <Trash2 size={15} />, label: "Delete for everyone", action: () => deleteMessage(selectedMsg, true) },
              ] : []),
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "13px 16px", background: "none", border: "none", cursor: "pointer", color: item.label.includes("Delete") ? "var(--error)" : "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                {item.icon}{item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div style={{ padding: "8px 14px", background: "var(--surface-2)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, borderLeft: "3px solid var(--teal)", paddingLeft: "10px" }}>
            <p style={{ fontSize: "11px", color: "var(--teal)", fontWeight: 600, marginBottom: "2px" }}>Replying to message</p>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
        </div>
      )}

      {/* Edit mode bar */}
      {editingMsg && (
        <div style={{ padding: "8px 14px", background: "var(--surface-2)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "10px" }}>
          <Edit2 size={14} color="var(--teal)" />
          <p style={{ flex: 1, fontSize: "12px", color: "var(--text-muted)" }}>Editing message</p>
          <button onClick={() => { setEditingMsg(null); setInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={16} /></button>
        </div>
      )}

      {/* Input Bar */}
      <div style={{ padding: "10px 14px", background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "flex-end", gap: "8px" }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
        <button onClick={() => fileInputRef.current?.click()}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "8px", flexShrink: 0 }}>
          <Image size={20} />
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleTextareaChange}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={editingMsg ? "Edit message..." : "Type a message..."}
          rows={1}
          style={{ flex: 1, padding: "10px 14px", borderRadius: "20px", border: "1.5px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", maxHeight: "120px", lineHeight: 1.5, transition: "border-color 0.2s ease" }}
          onFocus={e => e.target.style.borderColor = "var(--teal)"}
          onBlur={e => e.target.style.borderColor = "var(--border)"}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          style={{ width: "42px", height: "42px", borderRadius: "50%", border: "none", background: input.trim() ? "var(--gradient)" : "var(--border)", color: input.trim() ? "white" : "var(--text-light)", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.2s ease", boxShadow: input.trim() ? "0 4px 12px rgba(13,148,136,0.35)" : "none" }}>
          <Send size={17} />
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}