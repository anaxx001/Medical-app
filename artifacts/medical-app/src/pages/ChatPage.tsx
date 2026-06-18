import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, useParams } from "wouter";
import {
  ArrowLeft, Send, Check, CheckCheck, MoreVertical, Search, Paperclip,
  File, Smile, Reply, X, Trash2, Edit2, Forward,
  Pin, VolumeX, Shield, Clock, ChevronDown, Mic, Camera, Video, Phone
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

// WhatsApp design tokens
const WA = {
  headerGreen: "#008069",
  tealDark: "#005c4b",
  panelHeader: "#075e54",
  bgChat: "#e5ddd5",
  bgChatDark: "#0b141a",
  bubbleOut: "#d9fdd3",
  bubbleIn: "#ffffff",
  bubbleInDark: "#202c33",
  bubbleOutDark: "#005c4b",
  textPrimary: "#111b21",
  textSecondary: "#667781",
  tickBlue: "#53bdeb",
  tickGray: "#8696a0",
  accentGreen: "#00a884",
  inputBg: "#ffffff",
  panelBg: "#f0f2f5",
  divider: "#e9edef",
  linkBlue: "#027eb5",
  danger: "#ea0038",
};

const EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍", "👎", "🔥", "🎉", "💯"];

function Avatar({
  name, avatar, size = 40, isOnline,
}: {
  name: string; avatar: string | null; size?: number; isOnline?: boolean;
}) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "#cfd8dc",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.4, color: "#607d8b",
        fontWeight: 600, overflow: "hidden",
      }}>
        {avatar
          ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
          : name?.[0]?.toUpperCase() || "U"}
      </div>
      {isOnline && (
        <div style={{
          position: "absolute", bottom: -1, right: -1,
          width: size * 0.28, height: size * 0.28,
          borderRadius: "50%", background: WA.accentGreen,
          border: "2.5px solid white",
        }} />
      )}
    </div>
  );
}

// Read-receipt ticks, WhatsApp-style
function MessageTicks({ isRead }: { isRead: boolean }) {
  return <CheckCheck size={16} color={isRead ? WA.tickBlue : WA.tickGray} strokeWidth={2} />;
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
        alert(error.message);
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

  // Group consecutive messages by date for WhatsApp-style date chips
  function dateLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { day: "numeric", month: "long", year: "numeric" });
  }

  function renderFileMessage(msg: Message, isMine: boolean) {
    if (msg.file_type === "image") return (
      <img src={msg.file_url!} alt={msg.file_name || "image"}
        style={{ maxWidth: "260px", maxHeight: "240px", borderRadius: "8px", display: "block" }} />
    );
    if (msg.file_type === "video") return (
      <video controls style={{ maxWidth: "260px", borderRadius: "8px" }}>
        <source src={msg.file_url!} />
      </video>
    );
    if (msg.file_type === "audio") return (
      <audio controls style={{ width: "230px" }}>
        <source src={msg.file_url!} />
      </audio>
    );
    return (
      <a href={msg.file_url!} target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: "10px", color: "inherit", textDecoration: "none", padding: "4px 2px" }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: isMine ? "rgba(0,0,0,0.06)" : WA.panelBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <File size={18} color={WA.textSecondary} />
        </div>
        <span style={{ fontSize: "14px", color: WA.textPrimary }}>{msg.file_name}</span>
      </a>
    );
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      maxWidth: "600px", margin: "0 auto", position: "relative",
      fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: "4px", padding: "8px 10px",
        background: WA.headerGreen, position: "sticky", top: 0, zIndex: 10,
        color: "white",
      }}>
        <button onClick={() => navigate("/messages")}
          style={{ background: "none", border: "none", cursor: "pointer", color: "white", display: "flex", alignItems: "center", padding: "6px" }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, cursor: "pointer" }}
          onClick={() => navigate(`/profile/${otherUser?.username}`)}>
          <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={36} />
          <div>
            <p style={{ fontWeight: 600, fontSize: "16.5px", lineHeight: 1.2, color: "white" }}>{displayName}</p>
            <p style={{ fontSize: "12.5px", color: "rgba(255,255,255,0.85)" }}>
              {otherTyping ? "typing..." : otherUser?.is_online ? "online" : "offline"}
            </p>
          </div>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "8px" }}>
          <Video size={21} />
        </button>
        <button style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "8px" }}>
          <Phone size={19} />
        </button>
        <button onClick={() => setShowSearch(!showSearch)}
          style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "8px" }}>
          <Search size={19} />
        </button>
        <div style={{ position: "relative" }}>
          <button onClick={() => setShowMenu(!showMenu)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "8px" }}>
            <MoreVertical size={20} />
          </button>
          {showMenu && (
            <div style={{
              position: "absolute", right: 0, top: "100%", background: "white",
              borderRadius: "4px", boxShadow: "0 2px 10px rgba(0,0,0,0.25)", zIndex: 100,
              minWidth: "200px", overflow: "hidden", marginTop: "4px",
            }}>
              {[
                { icon: <Paperclip size={16} />, label: "Media, links, and docs", action: () => { setShowMediaGallery(true); setShowMenu(false); } },
                { icon: <VolumeX size={16} />, label: isMuted ? "Unmute notifications" : "Mute notifications", action: () => { setIsMuted(!isMuted); setShowMenu(false); } },
                { icon: <Clock size={16} />, label: vanishMode ? "Turn off disappearing messages" : "Disappearing messages", action: () => { setVanishMode(!vanishMode); setShowMenu(false); } },
                { icon: <Shield size={16} />, label: "Block & report", action: () => setShowMenu(false) },
              ].map((item, i) => (
                <button key={i} onClick={item.action}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "13px 16px",
                    background: "none", border: "none", cursor: "pointer",
                    color: i === 3 ? WA.danger : WA.textPrimary, fontSize: "14px", textAlign: "left",
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = "#f5f6f6")}
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
        <div style={{ padding: "8px 10px", background: WA.panelHeader, display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={16} color="white" style={{ marginLeft: "6px", flexShrink: 0 }} />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search messages"
            style={{
              width: "100%", padding: "8px 4px", border: "none", background: "transparent",
              fontSize: "15px", color: "white", outline: "none",
            }}
            autoFocus />
          <button onClick={() => { setShowSearch(false); setSearchQuery(""); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "white", padding: "4px" }}>
            <X size={18} />
          </button>
        </div>
      )}

      {/* Vanish / Disappearing Mode Banner */}
      {vanishMode && (
        <div style={{ padding: "8px 14px", background: "#fef6e0", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
          <Clock size={13} color="#54656f" />
          <span style={{ fontSize: "12.5px", color: "#54656f" }}>Disappearing messages are on — new messages disappear after 24 hours</span>
        </div>
      )}

      {/* Pinned Message */}
      {pinnedMsg && (
        <div style={{ padding: "8px 14px", background: WA.panelBg, borderBottom: `1px solid ${WA.divider}`, display: "flex", alignItems: "center", gap: "10px" }}>
          <Pin size={15} color={WA.textSecondary} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, borderLeft: `3px solid ${WA.accentGreen}`, paddingLeft: "8px" }}>
            <p style={{ fontSize: "11.5px", color: WA.accentGreen, fontWeight: 600, marginBottom: "1px" }}>Pinned message</p>
            <p style={{ fontSize: "13px", color: WA.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.content}</p>
          </div>
          <button onClick={() => setPinnedMsg(null)} style={{ background: "none", border: "none", cursor: "pointer", color: WA.textSecondary }}><X size={15} /></button>
        </div>
      )}

      {/* Media Gallery Modal */}
      {showMediaGallery && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "16px", gap: "16px", background: WA.panelHeader }}>
            <button onClick={() => setShowMediaGallery(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}><ArrowLeft size={22} /></button>
            <h3 style={{ color: "white", fontWeight: 600, fontSize: "16px" }}>Media, links, and docs</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", padding: "2px" }}>
            {mediaMessages.map(m => (
              <div key={m.id} style={{ aspectRatio: "1", overflow: "hidden", background: "#222" }}>
                {m.file_type === "image" && <img src={m.file_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                {m.file_type === "video" && <video src={m.file_url!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
            ))}
            {mediaMessages.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>No media, links, or docs shared yet</div>
            )}
          </div>
        </div>
      )}

      {/* Messages - WhatsApp wallpaper background */}
      <div ref={messagesContainerRef} onScroll={handleScroll}
        style={{
          flex: 1, overflowY: "auto", padding: "10px 5% 14px", display: "flex", flexDirection: "column", gap: "2px",
          backgroundColor: WA.bgChat,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill='%23d4cbc1' fill-opacity='0.4'%3E%3Cpath d='M20 20l5 8-5 8-5-8zM70 15l4 6-4 6-4-6zM45 50l5 7-5 7-5-7zM85 60l4 6-4 6-4-6zM15 70l5 7-5 7-5-7zM60 80l4 6-4 6-4-6z'/%3E%3C/g%3E%3C/svg%3E")`,
          position: "relative",
        }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
            <div style={{ width: "28px", height: "28px", borderRadius: "50%", border: "3px solid rgba(0,0,0,0.1)", borderTop: `3px solid ${WA.accentGreen}`, animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : filteredMessages.length === 0 && !searchQuery ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px 20px" }}>
            <div style={{
              background: "#fff9d6", borderRadius: "8px", padding: "10px 16px", maxWidth: "85%",
              boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
            }}>
              <p style={{ fontSize: "12.5px", color: "#54656f", lineHeight: 1.5 }}>
                🔒 Messages are secured. Say hello to {displayName} to start the conversation.
              </p>
            </div>
          </div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMine = msg.sender_id === currentUser?.id;
            const isDeleted = msg.is_deleted;
            const prevMsg = filteredMessages[idx - 1];
            const showDateChip = !prevMsg || dateLabel(prevMsg.created_at) !== dateLabel(msg.created_at);

            return (
              <div key={msg.id}>
                {showDateChip && (
                  <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
                    <span style={{
                      background: "#ffffff", color: "#54656f", fontSize: "12.5px",
                      padding: "5px 12px", borderRadius: "8px", boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                    }}>
                      {dateLabel(msg.created_at)}
                    </span>
                  </div>
                )}
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", marginBottom: "2px" }}>
                  <div
                    onDoubleClick={() => !isDeleted && setReplyTo(msg)}
                    onContextMenu={e => { e.preventDefault(); setSelectedMsg(msg); }}
                    style={{
                      maxWidth: "78%", padding: "6px 7px 8px 9px",
                      borderRadius: isMine ? "7.5px 7.5px 0 7.5px" : "7.5px 7.5px 7.5px 0",
                      background: isDeleted ? "#f0f2f5" : isMine ? WA.bubbleOut : WA.bubbleIn,
                      boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                      cursor: "pointer", position: "relative",
                    }}>
                    {/* Reply preview inside bubble */}
                    {msg.reply_to_content && (
                      <div style={{
                        padding: "6px 8px", borderRadius: "6px", background: "rgba(0,0,0,0.05)",
                        borderLeft: `4px solid ${WA.accentGreen}`, marginBottom: "5px", fontSize: "12.5px", color: WA.textSecondary,
                      }}>
                        {msg.reply_to_content.slice(0, 60)}{msg.reply_to_content.length > 60 ? "..." : ""}
                      </div>
                    )}
                    {msg.file_url ? renderFileMessage(msg, isMine) : (
                      <p style={{
                        fontSize: "14.2px", color: isDeleted ? WA.textSecondary : WA.textPrimary,
                        lineHeight: 1.45, wordBreak: "break-word", fontStyle: isDeleted ? "italic" : "normal",
                        paddingRight: "46px", marginBottom: "-2px",
                      }}>
                        {isDeleted && "🚫 "}{msg.content}
                      </p>
                    )}
                    <div style={{
                      display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px",
                      float: "right", marginTop: "2px", marginLeft: "6px", transform: "translateY(2px)",
                    }}>
                      {msg.is_edited && <span style={{ fontSize: "11px", color: WA.textSecondary }}>edited</span>}
                      {msg.vanish_at && <Clock size={11} color={WA.textSecondary} />}
                      <span style={{ fontSize: "11px", color: WA.textSecondary }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {isMine && !isDeleted && <MessageTicks isRead={msg.is_read} />}
                    </div>
                  </div>

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "-8px", marginBottom: "4px", flexWrap: "wrap", justifyContent: isMine ? "flex-end" : "flex-start", zIndex: 2 }}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => (
                        users.length > 0 && (
                          <button key={emoji} onClick={() => reactToMessage(msg.id, emoji)}
                            style={{
                              display: "flex", alignItems: "center", gap: "3px", padding: "2px 6px",
                              borderRadius: "12px", border: "none", background: "white",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
                              cursor: "pointer", fontSize: "12px",
                            }}>
                            <span>{emoji}</span>
                            {users.length > 1 && <span style={{ fontSize: "11px", color: WA.textSecondary }}>{users.length}</span>}
                          </button>
                        )
                      ))}
                    </div>
                  )}

                  {/* Emoji picker for this message */}
                  {showEmojiPicker === msg.id && (
                    <div style={{
                      display: "flex", gap: "6px", padding: "8px 10px", background: "white",
                      borderRadius: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.25)", marginTop: "4px",
                    }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => reactToMessage(msg.id, e)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: "19px", lineHeight: 1 }}>{e}</button>
                      ))}
                      <button onClick={() => setShowEmojiPicker(null)} style={{ background: "none", border: "none", cursor: "pointer", color: WA.textSecondary }}><X size={14} /></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: "4px" }}>
            <div style={{
              padding: "10px 16px", borderRadius: "7.5px 7.5px 7.5px 0", background: WA.bubbleIn,
              boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)", display: "flex", gap: "4px", alignItems: "center",
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#a8b6bd", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button onClick={scrollToBottom} style={{
          position: "absolute", bottom: "84px", right: "16px", width: "38px", height: "38px",
          borderRadius: "50%", background: "white", border: "none",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", zIndex: 5,
        }}>
          <ChevronDown size={20} color={WA.textSecondary} />
        </button>
      )}

      {/* Message action menu (long press / right click) */}
      {selectedMsg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 150, background: "rgba(0,0,0,0.3)" }} onClick={() => setSelectedMsg(null)}>
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, background: "white",
            borderRadius: "12px 12px 0 0", boxShadow: "0 -2px 10px rgba(0,0,0,0.2)", overflow: "hidden",
            maxWidth: "600px", margin: "0 auto",
          }}
            onClick={e => e.stopPropagation()}>
            <div style={{ width: "36px", height: "4px", background: "#d1d7db", borderRadius: "2px", margin: "8px auto" }} />
            {[
              { icon: <Reply size={18} />, label: "Reply", action: () => { setReplyTo(selectedMsg); setSelectedMsg(null); } },
              { icon: <Smile size={18} />, label: "React", action: () => { setShowEmojiPicker(selectedMsg.id); setSelectedMsg(null); } },
              { icon: <Pin size={18} />, label: "Pin", action: () => pinMessage(selectedMsg) },
              { icon: <Forward size={18} />, label: "Forward", action: () => forwardMessage(selectedMsg) },
              ...(selectedMsg.sender_id === currentUser?.id ? [
                { icon: <Edit2 size={18} />, label: "Edit", action: () => { setEditingMsg(selectedMsg); setInput(selectedMsg.content); setSelectedMsg(null); } },
                { icon: <Trash2 size={18} />, label: "Delete for me", action: () => deleteMessage(selectedMsg, false) },
                { icon: <Trash2 size={18} />, label: "Delete for everyone", action: () => deleteMessage(selectedMsg, true) },
              ] : []),
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: "16px", padding: "14px 20px",
                  background: "none", border: "none", cursor: "pointer",
                  color: item.label.includes("Delete") ? WA.danger : WA.textPrimary,
                  fontSize: "15px", textAlign: "left",
                }}>
                {item.icon}{item.label}
              </button>
            ))}
            <div style={{ height: "8px" }} />
          </div>
        </div>
      )}

      {/* Reply preview bar */}
      {replyTo && (
        <div style={{ padding: "8px 10px", background: WA.panelBg, display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ flex: 1, borderLeft: `4px solid ${WA.accentGreen}`, paddingLeft: "10px", background: "white", padding: "8px 10px", borderRadius: "6px" }}>
            <p style={{ fontSize: "12.5px", color: WA.accentGreen, fontWeight: 600, marginBottom: "2px" }}>Replying to message</p>
            <p style={{ fontSize: "13px", color: WA.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content}</p>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: WA.textSecondary }}><X size={18} /></button>
        </div>
      )}

      {/* Edit mode bar */}
      {editingMsg && (
        <div style={{ padding: "8px 14px", background: WA.panelBg, display: "flex", alignItems: "center", gap: "10px" }}>
          <Edit2 size={15} color={WA.accentGreen} />
          <p style={{ flex: 1, fontSize: "13px", color: WA.textSecondary }}>Editing message</p>
          <button onClick={() => { setEditingMsg(null); setInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: WA.textSecondary }}><X size={18} /></button>
        </div>
      )}

      {/* Input Bar - WhatsApp style */}
      <div style={{ padding: "8px 8px 10px", background: WA.panelBg, display: "flex", alignItems: "flex-end", gap: "6px" }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
        <div style={{
          flex: 1, display: "flex", alignItems: "flex-end", gap: "4px",
          background: WA.inputBg, borderRadius: "24px", padding: "6px 6px 6px 12px",
        }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}>
            <Smile size={23} />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={editingMsg ? "Edit message" : "Type a message"}
            rows={1}
            style={{
              flex: 1, padding: "8px 4px", border: "none", background: "transparent",
              fontSize: "15px", color: WA.textPrimary, outline: "none", resize: "none",
              maxHeight: "120px", lineHeight: 1.4, fontFamily: "inherit",
            }}
          />
          <button onClick={() => fileInputRef.current?.click()}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}>
            <Paperclip size={21} />
          </button>
          {!input.trim() && (
            <button style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}>
              <Camera size={21} />
            </button>
          )}
        </div>
        <button onClick={input.trim() ? sendMessage : undefined} disabled={sending}
          style={{
            width: "46px", height: "46px", borderRadius: "50%", border: "none",
            background: WA.accentGreen, color: "white",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0,
          }}>
          {input.trim() ? <Send size={19} /> : <Mic size={20} />}
        </button>
      </div>

      <style>{`
        @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
