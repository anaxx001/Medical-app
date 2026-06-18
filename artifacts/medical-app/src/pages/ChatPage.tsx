import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Send, Check, CheckCheck, MoreVertical, Search, Paperclip,
  FileText, Smile, Reply, X, Trash2, Edit2, Forward, Pin, VolumeX,
  Shield, Clock, ChevronDown, Mic, Camera, Phone, Video, Copy,
  CheckSquare, Square, User, MessageCircle, ChevronUp,
  Play, Pause, Download, Image as ImageIcon
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────
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
  reply_to_sender_name?: string | null;
  reactions?: Record<string, string[]>;
  file_url?: string | null;
  file_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  vanish_at?: string | null;
};

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  is_online?: boolean;
  last_seen?: string | null;
};

type UserForForward = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
};

// ─── Telegram Design Tokens ─────────────────────────────────────────
const TG = {
  bg: "#ffffff",
  chatBg: "#e6ebee",
  bubbleOut: "#effdde",
  bubbleIn: "#ffffff",
  bubbleShadow: "0 1px 2px rgba(16,35,47,0.15)",
  textPrimary: "#000000",
  textSecondary: "#8a8a8a",
  accent: "#3390ec",
  danger: "#df3f40",
  success: "#4dcd5e",
  panelBg: "#f1f1f1",
  headerBg: "#ffffff",
  headerBorder: "#e0e0e0",
  divider: "#e0e0e0",
  tickRead: "#4fc3f7",
  tickSent: "#a0a0a0",
  dateChip: "rgba(0,0,0,0.08)",
  dateChipText: "#8a8a8a",
  replyBar: "#3390ec",
  pinnedBg: "#fff9c4",
  selectionBg: "rgba(51,144,236,0.15)",
  selectionBorder: "#3390ec",
};

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡", "🎉", "🔥", "👏", "💯"];

function formatBytes(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function timeAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function Avatar({ name, avatar, size = 40, isOnline }: { name: string; avatar: string | null; size?: number; isOnline?: boolean }) {
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #74b9ff, #0984e3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, color: "#fff", fontWeight: 600, overflow: "hidden" }}>
        {avatar ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : name?.[0]?.toUpperCase() || "U"}
      </div>
      {isOnline && (
        <div style={{ position: "absolute", bottom: 0, right: 0, width: size * 0.28, height: size * 0.28, borderRadius: "50%", background: TG.success, border: "2.5px solid white" }} />
      )}
    </div>
  );
}

function MessageTicks({ isRead }: { isRead: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", marginLeft: "2px" }}>
      {isRead ? <CheckCheck size={14} color={TG.tickRead} strokeWidth={2.5} /> : <Check size={14} color={TG.tickSent} strokeWidth={2.5} />}
    </span>
  );
}

function TypingIndicator() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      style={{ display: "flex", alignItems: "center", padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: TG.bubbleIn, boxShadow: TG.bubbleShadow, gap: "4px", marginBottom: "4px" }}>
      {[0, 1, 2].map((i) => (
        <motion.div key={i} animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
          style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#a0a0a0" }} />
      ))}
    </motion.div>
  );
}

function DateChip({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "12px 0", position: "sticky", top: "8px", zIndex: 3 }}>
      <span style={{ background: TG.dateChip, color: TG.dateChipText, fontSize: "12.5px", fontWeight: 500, padding: "4px 14px", borderRadius: "20px", backdropFilter: "blur(8px)" }}>{label}</span>
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ msg: Message; x: number; y: number } | null>(null);
  const [emojiPickerMsgId, setEmojiPickerMsgId] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIndex, setSearchIndex] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showMediaGallery, setShowMediaGallery] = useState(false);
  const [showForward, setShowForward] = useState(false);
  const [forwardMsg, setForwardMsg] = useState<Message | null>(null);
  const [usersForForward, setUsersForForward] = useState<UserForForward[]>([]);
  const [forwardSearch, setForwardSearch] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [vanishMode, setVanishMode] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [showPinned, setShowPinned] = useState(true);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);
  const typingTimeoutRef = useRef<any>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const searchRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // ─── Init ───────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setCurrentUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, is_online, last_seen")
        .eq("id", otherUserId).single();
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

      await supabase.from("direct_messages").update({ is_read: true })
        .eq("sender_id", otherUserId).eq("receiver_id", user.id).eq("is_read", false);
    }
    init();
  }, [otherUserId]);

  // ─── Realtime ─────────────────────────────────────────────────────
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
        (payload) => { setMessages(prev => prev.filter(m => m.id !== payload.old.id)); })
      .on("broadcast", { event: "typing" }, (payload) => {
        if (payload.payload.userId === otherUserId) {
          setOtherTyping(true);
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setOtherTyping(false), 3000);
        }
      }).subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [currentUser?.id, otherUserId]);

  // ─── Scroll ───────────────────────────────────────────────────────
  useEffect(() => { if (!showSearch) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, otherTyping, showSearch]);

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 300);
  }
  function scrollToBottom() { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }

  function handleTyping(value: string) {
    setInput(value);
    if (!channelRef.current || !currentUser) return;
    channelRef.current.send({ type: "broadcast", event: "typing", payload: { userId: currentUser.id } });
  }

  function handleTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    handleTyping(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  }

  // ─── Send / Edit ──────────────────────────────────────────────────
  async function sendMessage() {
    if (!input.trim() || !currentUser || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const vanishAt = vanishMode ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null;

    if (editingMsg) {
      const { error } = await supabase.from("direct_messages").update({ content, is_edited: true }).eq("id", editingMsg.id);
      if (error) { alert(error.message); setInput(content); }
      setEditingMsg(null);
      setSending(false);
      return;
    }

    const optimistic: Message = {
      id: crypto.randomUUID(), sender_id: currentUser.id, receiver_id: otherUserId,
      content, is_read: false, created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id || null, reply_to_content: replyTo?.content || null,
      reply_to_sender_name: replyTo ? otherUser?.full_name || otherUser?.username || "User" : null,
      vanish_at: vanishAt,
    };

    setMessages(prev => [...prev, optimistic]);
    setReplyTo(null);

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: currentUser.id, receiver_id: otherUserId, content, is_read: false,
      reply_to_id: replyTo?.id || null, reply_to_content: replyTo?.content || null, vanish_at: vanishAt,
    });

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
      alert(error.message);
    }
    setSending(false);
  }

  // ─── File upload ──────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    const fileType = ["jpg","jpeg","png","gif","webp","svg"].includes(ext) ? "image"
      : ["mp4","mov","webm","mkv"].includes(ext) ? "video"
      : ["mp3","wav","m4a","aac","ogg"].includes(ext) ? "audio" : "document";

    const path = `dm/${currentUser.id}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from("materials").upload(path, file);
    if (error) { console.error("Upload error:", error); return; }
    const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);

    await supabase.from("direct_messages").insert({
      sender_id: currentUser.id, receiver_id: otherUserId, content: file.name,
      file_url: urlData.publicUrl, file_type: fileType, file_name: file.name, file_size: file.size, is_read: false,
    });
  }

  // ─── Delete ───────────────────────────────────────────────────────
  async function deleteMessage(msg: Message, forEveryone: boolean) {
    setContextMenu(null);
    if (forEveryone) {
      await supabase.from("direct_messages").update({ is_deleted: true, content: "This message was deleted", file_url: null, file_type: null, file_name: null }).eq("id", msg.id);
    } else {
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
    if (selectionMode) {
      setSelectedIds(prev => { const next = new Set(prev); next.delete(msg.id); return next; });
    }
  }

  async function bulkDelete(forEveryone: boolean) {
    const ids = Array.from(selectedIds);
    if (forEveryone) {
      await Promise.all(ids.map(id => supabase.from("direct_messages").update({ is_deleted: true, content: "This message was deleted", file_url: null, file_type: null, file_name: null }).eq("id", id)));
    } else {
      setMessages(prev => prev.filter(m => !selectedIds.has(m.id)));
    }
    setSelectedIds(new Set());
    setSelectionMode(false);
  }

  // ─── React ────────────────────────────────────────────────────────
  async function reactToMessage(msgId: string, emoji: string) {
    setEmojiPickerMsgId(null);
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

  // ─── Pin ──────────────────────────────────────────────────────────
  async function pinMessage(msg: Message) { setPinnedMsg(msg); setContextMenu(null); setShowPinned(true); }

  // ─── Copy ─────────────────────────────────────────────────────────
  function copyMessage(msg: Message) { navigator.clipboard.writeText(msg.content); setContextMenu(null); }

  // ─── Forward ──────────────────────────────────────────────────────
  async function openForwardModal(msg: Message) {
    setForwardMsg(msg); setShowForward(true); setContextMenu(null);
    const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url").neq("id", currentUser?.id).limit(50);
    setUsersForForward(data || []);
  }

  async function forwardToUser(userId: string) {
    if (!forwardMsg || !currentUser) return;
    await supabase.from("direct_messages").insert({
      sender_id: currentUser.id, receiver_id: userId, content: forwardMsg.content,
      file_url: forwardMsg.file_url, file_type: forwardMsg.file_type, file_name: forwardMsg.file_name, file_size: forwardMsg.file_size, is_read: false,
    });
    setShowForward(false); setForwardMsg(null);
  }

  // ─── Selection ──────────────────────────────────────────────────────
  function toggleSelection(msgId: string) {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(msgId)) next.delete(msgId); else next.add(msgId); return next; });
  }
  function selectAll() { setSelectedIds(new Set(filteredMessages.map(m => m.id))); }

  // ─── Search ───────────────────────────────────────────────────────
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return messages.map((m, i) => ({ msg: m, index: i })).filter(({ msg }) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, messages]);

  useEffect(() => {
    if (searchMatches.length > 0 && searchIndex < searchMatches.length) {
      const el = searchRefs.current.get(searchMatches[searchIndex].msg.id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [searchIndex, searchMatches]);

  // ─── Click outside ────────────────────────────────────────────────
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) setContextMenu(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // ─── Date formatting ────────────────────────────────────────────────
  function dateLabel(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (sameDay(d, today)) return "Today";
    if (sameDay(d, yesterday)) return "Yesterday";
    return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
  }

  // ─── Render file message ──────────────────────────────────────────
  function renderFileMessage(msg: Message, isMine: boolean) {
    if (msg.file_type === "image") {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ position: "relative" }}>
          <img src={msg.file_url!} alt={msg.file_name || "image"}
            style={{ maxWidth: "280px", maxHeight: "280px", borderRadius: "10px", display: "block", cursor: "pointer" }}
            onClick={() => window.open(msg.file_url!, "_blank")} />
        </motion.div>
      );
    }
    if (msg.file_type === "video") {
      return <video controls style={{ maxWidth: "280px", borderRadius: "10px", display: "block" }}><source src={msg.file_url!} /></video>;
    }
    if (msg.file_type === "audio") {
      const isPlaying = playingAudio === msg.id;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: "220px", padding: "4px 2px" }}>
          <button onClick={() => {
            const audio = document.getElementById(`audio-${msg.id}`) as HTMLAudioElement;
            if (audio) {
              if (isPlaying) { audio.pause(); setPlayingAudio(null); }
              else { audio.play(); setPlayingAudio(msg.id); audio.onended = () => setPlayingAudio(null); }
            }
          }} style={{ width: 40, height: 40, borderRadius: "50%", border: "none", background: isMine ? "rgba(0,0,0,0.08)" : TG.panelBg, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            {isPlaying ? <Pause size={18} color={TG.textSecondary} /> : <Play size={18} color={TG.textSecondary} />}
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ height: "3px", background: isMine ? "rgba(0,0,0,0.1)" : "#e0e0e0", borderRadius: "2px", marginBottom: "4px" }}>
              <div style={{ height: "100%", width: isPlaying ? "60%" : "0%", background: TG.accent, borderRadius: "2px", transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: "12px", color: TG.textSecondary }}>{msg.file_name}</span>
          </div>
          <audio id={`audio-${msg.id}`} src={msg.file_url!} style={{ display: "none" }} />
        </div>
      );
    }
    return (
      <a href={msg.file_url!} target="_blank" rel="noopener noreferrer"
        style={{ display: "flex", alignItems: "center", gap: "12px", color: "inherit", textDecoration: "none", padding: "6px 4px", minWidth: "200px" }}>
        <div style={{ width: 44, height: 44, borderRadius: "10px", background: isMine ? "rgba(0,0,0,0.06)" : TG.panelBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <FileText size={20} color={TG.accent} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: "14px", color: TG.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{msg.file_name}</p>
          <p style={{ fontSize: "12px", color: TG.textSecondary }}>{formatBytes(msg.file_size)}</p>
        </div>
        <Download size={16} color={TG.textSecondary} />
      </a>
    );
  }

  const displayName = otherUser?.full_name || otherUser?.username || "User";
  const filteredMessages = searchQuery ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())) : messages;
  const mediaMessages = messages.filter(m => m.file_type === "image" || m.file_type === "video");
  const selectedCount = selectedIds.size;

  // ════════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", maxWidth: "720px", margin: "0 auto", position: "relative", fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif", background: TG.bg, overflow: "hidden" }}>

      {/* ─── HEADER ─────────────────────────────────────────────── */}
      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px", background: TG.headerBg, borderBottom: `1px solid ${TG.headerBorder}`, position: "sticky", top: 0, zIndex: 20, flexShrink: 0 }}>
        {selectionMode ? (
          <>
            <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: TG.textPrimary, display: "flex", alignItems: "center", padding: "6px" }}><X size={22} /></button>
            <span style={{ fontWeight: 600, fontSize: "16px", color: TG.textPrimary, flex: 1 }}>{selectedCount} selected</span>
            <button onClick={selectAll} style={{ background: "none", border: "none", cursor: "pointer", color: TG.accent, fontSize: "14px", fontWeight: 500, padding: "6px 10px" }}>Select all</button>
            <button onClick={() => bulkDelete(false)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.danger, padding: "6px" }} title="Delete for me"><Trash2 size={20} /></button>
            <button onClick={() => bulkDelete(true)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.danger, padding: "6px" }} title="Delete for everyone"><Trash2 size={20} /></button>
          </>
        ) : (
          <>
            <button onClick={() => navigate("/messages")} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textPrimary, display: "flex", alignItems: "center", padding: "6px" }}><ArrowLeft size={22} /></button>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, cursor: "pointer" }} onClick={() => navigate(`/profile/${otherUser?.username}`)}>
              <Avatar name={displayName} avatar={otherUser?.avatar_url || null} size={38} isOnline={otherUser?.is_online} />
              <div>
                <p style={{ fontWeight: 600, fontSize: "15.5px", lineHeight: 1.25, color: TG.textPrimary }}>{displayName}</p>
                <p style={{ fontSize: "12.5px", color: TG.textSecondary, lineHeight: 1.3 }}>
                  {otherTyping ? "typing..." : otherUser?.is_online ? "online" : otherUser?.last_seen ? `last seen ${timeAgo(otherUser.last_seen)}` : "offline"}
                </p>
              </div>
            </div>
            <button onClick={() => setShowSearch(!showSearch)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, padding: "8px" }}><Search size={20} /></button>
            <div style={{ position: "relative" }} ref={menuRef}>
              <button onClick={() => setShowMenu(!showMenu)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, padding: "8px" }}><MoreVertical size={20} /></button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div initial={{ opacity: 0, y: -5, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5, scale: 0.95 }} transition={{ duration: 0.15 }}
                    style={{ position: "absolute", right: 0, top: "100%", background: "white", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 100, minWidth: "220px", overflow: "hidden", marginTop: "6px", border: `1px solid ${TG.divider}` }}>
                    {[
                      { icon: <ImageIcon size={16} />, label: "Media, links, and docs", action: () => { setShowMediaGallery(true); setShowMenu(false); } },
                      { icon: <VolumeX size={16} />, label: isMuted ? "Unmute notifications" : "Mute notifications", action: () => { setIsMuted(!isMuted); setShowMenu(false); } },
                      { icon: <Clock size={16} />, label: vanishMode ? "Turn off disappearing messages" : "Disappearing messages", action: () => { setVanishMode(!vanishMode); setShowMenu(false); } },
                      { icon: <CheckSquare size={16} />, label: "Select messages", action: () => { setSelectionMode(true); setShowMenu(false); } },
                      { icon: <Shield size={16} />, label: "Block & report", action: () => setShowMenu(false) },
                    ].map((item, i) => (
                      <button key={i} onClick={item.action}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: TG.textPrimary, fontSize: "14px", textAlign: "left", transition: "background 0.15s" }}
                        onMouseOver={e => e.currentTarget.style.background = "#f5f5f5"}
                        onMouseOut={e => e.currentTarget.style.background = "none"}>
                        {item.icon}{item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        )}
      </motion.div>

      {/* ─── SEARCH BAR ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showSearch && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "10px 14px", background: TG.panelBg, display: "flex", alignItems: "center", gap: "10px", borderBottom: `1px solid ${TG.divider}`, overflow: "hidden" }}>
            <Search size={16} color={TG.textSecondary} />
            <input value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setSearchIndex(0); }} placeholder="Search messages"
              style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent", fontSize: "15px", color: TG.textPrimary, outline: "none" }} autoFocus />
            {searchMatches.length > 0 && <span style={{ fontSize: "13px", color: TG.textSecondary, whiteSpace: "nowrap" }}>{searchIndex + 1} / {searchMatches.length}</span>}
            {searchMatches.length > 1 && (
              <>
                <button onClick={() => setSearchIndex(p => p > 0 ? p - 1 : searchMatches.length - 1)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, padding: "4px" }}><ChevronUp size={16} /></button>
                <button onClick={() => setSearchIndex(p => (p + 1) % searchMatches.length)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, padding: "4px" }}><ChevronDown size={16} /></button>
              </>
            )}
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchIndex(0); }} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, padding: "4px" }}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── VANISH MODE BANNER ────────────────────────────────── */}
      <AnimatePresence>
        {vanishMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "8px 16px", background: "#fff8e1", display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", borderBottom: "1px solid #ffe082", overflow: "hidden" }}>
            <Clock size={13} color="#8a8a8a" />
            <span style={{ fontSize: "12.5px", color: "#8a8a8a" }}>Disappearing messages on — new messages vanish after 24h</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PINNED MESSAGE ─────────────────────────────────────── */}
      <AnimatePresence>
        {pinnedMsg && showPinned && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "8px 14px", background: TG.pinnedBg, borderBottom: `1px solid ${TG.divider}`, display: "flex", alignItems: "center", gap: "10px", overflow: "hidden", flexShrink: 0 }}>
            <Pin size={15} color={TG.textSecondary} style={{ flexShrink: 0 }} />
            <div style={{ flex: 1, borderLeft: `3px solid ${TG.accent}`, paddingLeft: "10px", minWidth: 0 }}>
              <p style={{ fontSize: "11.5px", color: TG.accent, fontWeight: 600, marginBottom: "2px" }}>Pinned message</p>
              <p style={{ fontSize: "13px", color: TG.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pinnedMsg.content}</p>
            </div>
            <button onClick={() => setShowPinned(false)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary, flexShrink: 0 }}><X size={15} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MEDIA GALLERY MODAL ────────────────────────────────── */}
      <AnimatePresence>
        {showMediaGallery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.92)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: "16px", background: "rgba(0,0,0,0.5)" }}>
              <button onClick={() => setShowMediaGallery(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "white" }}><ArrowLeft size={22} /></button>
              <h3 style={{ color: "white", fontWeight: 600, fontSize: "16px" }}>Media, links, and docs</h3>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "2px", padding: "2px", overflow: "auto" }}>
              {mediaMessages.map(m => (
                <div key={m.id} style={{ aspectRatio: "1", overflow: "hidden", background: "#1a1a1a", cursor: "pointer" }} onClick={() => window.open(m.file_url!, "_blank")}>
                  {m.file_type === "image" && <img src={m.file_url!} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {m.file_type === "video" && <video src={m.file_url!} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
              ))}
              {mediaMessages.length === 0 && <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>No media shared yet</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── FORWARD MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showForward && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
            onClick={() => setShowForward(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{ background: "white", borderRadius: "16px 16px 0 0", width: "100%", maxWidth: "720px", maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
              onClick={e => e.stopPropagation()}>
              <div style={{ padding: "16px 16px 12px", borderBottom: `1px solid ${TG.divider}` }}>
                <div style={{ width: "36px", height: "4px", background: "#d1d7db", borderRadius: "2px", margin: "0 auto 12px" }} />
                <h3 style={{ fontWeight: 600, fontSize: "17px", textAlign: "center" }}>Forward to...</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px", padding: "8px 12px", background: TG.panelBg, borderRadius: "20px" }}>
                  <Search size={16} color={TG.textSecondary} />
                  <input value={forwardSearch} onChange={e => setForwardSearch(e.target.value)} placeholder="Search users"
                    style={{ flex: 1, border: "none", background: "transparent", fontSize: "15px", outline: "none" }} />
                </div>
              </div>
              <div style={{ flex: 1, overflow: "auto", padding: "8px 0" }}>
                {usersForForward.filter(u => u.username?.toLowerCase().includes(forwardSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(forwardSearch.toLowerCase())).map(u => (
                  <button key={u.id} onClick={() => forwardToUser(u.id)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#f5f5f5"}
                    onMouseOut={e => e.currentTarget.style.background = "none"}>
                    <Avatar name={u.full_name || u.username} avatar={u.avatar_url} size={40} />
                    <div>
                      <p style={{ fontWeight: 500, fontSize: "15px", color: TG.textPrimary }}>{u.full_name || u.username}</p>
                      <p style={{ fontSize: "13px", color: TG.textSecondary }}>@{u.username}</p>
                    </div>
                  </button>
                ))}
                {usersForForward.filter(u => u.username?.toLowerCase().includes(forwardSearch.toLowerCase()) || u.full_name?.toLowerCase().includes(forwardSearch.toLowerCase())).length === 0 && (
                  <div style={{ textAlign: "center", padding: "40px 20px", color: TG.textSecondary }}>
                    <User size={40} color={TG.textSecondary} style={{ marginBottom: "8px" }} />
                    <p>No users found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MESSAGES AREA ──────────────────────────────────────── */}
      <div ref={messagesContainerRef} onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "8px 12px 12px", display: "flex", flexDirection: "column", gap: "1px", backgroundColor: TG.chatBg, position: "relative" }}>
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px", alignItems: "center", gap: "12px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "3px solid rgba(0,0,0,0.08)", borderTop: `3px solid ${TG.accent}`, animation: "spin 0.8s linear infinite" }} />
            <span style={{ color: TG.textSecondary, fontSize: "14px" }}>Loading messages...</span>
          </div>
        ) : filteredMessages.length === 0 && !searchQuery ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, textAlign: "center", padding: "40px 24px" }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "linear-gradient(135deg, #74b9ff, #0984e3)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
              <MessageCircle size={36} color="white" />
            </div>
            <h3 style={{ fontWeight: 600, fontSize: "18px", color: TG.textPrimary, marginBottom: "6px" }}>{displayName}</h3>
            <p style={{ fontSize: "14px", color: TG.textSecondary, lineHeight: 1.5, maxWidth: "280px" }}>Start a conversation with {displayName}. Messages are end-to-end encrypted.</p>
          </motion.div>
        ) : (
          filteredMessages.map((msg, idx) => {
            const isMine = msg.sender_id === currentUser?.id;
            const isDeleted = msg.is_deleted;
            const prevMsg = filteredMessages[idx - 1];
            const showDateChip = !prevMsg || dateLabel(prevMsg.created_at) !== dateLabel(msg.created_at);
            const isSelected = selectedIds.has(msg.id);
            const isCurrentSearchMatch = searchMatches[searchIndex]?.msg.id === msg.id;

            return (
              <div key={msg.id}>
                {showDateChip && <DateChip label={dateLabel(msg.created_at)} />}
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: 0.02 }}
                  style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start", marginBottom: "3px", padding: selectionMode ? "2px 0" : "0" }}>
                  <div
                    ref={el => { if (el) searchRefs.current.set(msg.id, el); }}
                    onClick={() => { if (selectionMode) toggleSelection(msg.id); }}
                    onDoubleClick={() => { if (!isDeleted && !selectionMode) setReplyTo(msg); }}
                    onContextMenu={e => { e.preventDefault(); if (!selectionMode && !isDeleted) setContextMenu({ msg, x: Math.min(e.clientX, window.innerWidth - 200), y: Math.min(e.clientY, window.innerHeight - 280) }); }}
                    style={{
                      maxWidth: "75%", padding: msg.file_url ? "4px" : "7px 10px 6px",
                      borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: isDeleted ? "#f0f0f0" : isMine ? TG.bubbleOut : TG.bubbleIn,
                      boxShadow: TG.bubbleShadow,
                      cursor: selectionMode ? "pointer" : isDeleted ? "default" : "pointer",
                      position: "relative",
                      border: isCurrentSearchMatch ? `2px solid ${TG.accent}` : isSelected ? `2px solid ${TG.selectionBorder}` : "2px solid transparent",
                      backgroundColor: isSelected ? TG.selectionBg : isMine ? TG.bubbleOut : TG.bubbleIn,
                      transition: "border 0.15s, background 0.15s",
                    }}>

                    {/* Selection checkbox */}
                    {selectionMode && (
                      <div style={{ position: "absolute", top: "-8px", [isMine ? "right" : "left"]: "-8px", zIndex: 5 }}>
                        {isSelected ? <CheckSquare size={18} color={TG.accent} /> : <Square size={18} color={TG.textSecondary} />}
                      </div>
                    )}

                    {/* Reply preview */}
                    {msg.reply_to_content && (
                      <div onClick={() => { const el = searchRefs.current.get(msg.reply_to_id || ""); el?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
                        style={{ padding: "6px 10px", borderRadius: "8px", background: isMine ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.03)", borderLeft: `3px solid ${TG.replyBar}`, marginBottom: "5px", fontSize: "12.5px", color: TG.textSecondary, cursor: "pointer" }}>
                        <p style={{ fontWeight: 600, color: TG.accent, fontSize: "12px", marginBottom: "2px" }}>{msg.reply_to_sender_name || "User"}</p>
                        <p style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{msg.reply_to_content.slice(0, 80)}{msg.reply_to_content.length > 80 ? "..." : ""}</p>
                      </div>
                    )}

                    {/* Content */}
                    {msg.file_url ? renderFileMessage(msg, isMine) : (
                      <p style={{ fontSize: "14.5px", color: isDeleted ? TG.textSecondary : TG.textPrimary, lineHeight: 1.5, wordBreak: "break-word", fontStyle: isDeleted ? "italic" : "normal", paddingRight: "52px" }}>
                        {isDeleted && <span style={{ marginRight: "4px" }}>🚫</span>}{msg.content}
                      </p>
                    )}

                    {/* Meta */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "5px", marginTop: "2px", float: "right", marginLeft: "8px" }}>
                      {msg.is_edited && <span style={{ fontSize: "11px", color: TG.textSecondary }}>edited</span>}
                      {msg.vanish_at && <Clock size={11} color={TG.textSecondary} />}
                      <span style={{ fontSize: "11.5px", color: TG.textSecondary }}>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      {isMine && !isDeleted && <MessageTicks isRead={msg.is_read} />}
                    </div>
                  </div>

                  {/* Reactions */}
                  {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                    <div style={{ display: "flex", gap: "4px", marginTop: "-6px", marginBottom: "4px", flexWrap: "wrap", justifyContent: isMine ? "flex-end" : "flex-start", zIndex: 2, padding: "0 4px" }}>
                      {Object.entries(msg.reactions).map(([emoji, users]) => users.length > 0 && (
                        <button key={emoji} onClick={() => reactToMessage(msg.id, emoji)}
                          style={{ display: "flex", alignItems: "center", gap: "3px", padding: "2px 7px", borderRadius: "12px", border: "none", background: "white", boxShadow: "0 1px 2px rgba(0,0,0,0.2)", cursor: "pointer", fontSize: "12px" }}>
                          <span>{emoji}</span>
                          {users.length > 1 && <span style={{ fontSize: "11px", color: TG.textSecondary }}>{users.length}</span>}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Emoji picker */}
                  {emojiPickerMsgId === msg.id && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      style={{ display: "flex", gap: "6px", padding: "8px 10px", background: "white", borderRadius: "24px", boxShadow: "0 2px 10px rgba(0,0,0,0.25)", marginTop: "4px" }}>
                      {EMOJIS.map(e => <button key={e} onClick={() => reactToMessage(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "19px", lineHeight: 1 }}>{e}</button>)}
                      <button onClick={() => setEmojiPickerMsgId(null)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary }}><X size={14} /></button>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        <AnimatePresence>{otherTyping && <TypingIndicator />}</AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* ─── SCROLL TO BOTTOM ─────────────────────────────────── */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            style={{ position: "absolute", bottom: "84px", right: "16px", width: "40px", height: "40px", borderRadius: "50%", background: "white", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 5 }}>
            <ChevronDown size={20} color={TG.textSecondary} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── CONTEXT MENU (right-click) ─────────────────────────── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div ref={contextMenuRef} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ position: "fixed", left: contextMenu.x, top: contextMenu.y, background: "white", borderRadius: "10px", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", zIndex: 150, minWidth: "180px", overflow: "hidden", border: `1px solid ${TG.divider}` }}>
            {[
              { icon: <Reply size={16} />, label: "Reply", action: () => { setReplyTo(contextMenu.msg); setContextMenu(null); } },
              { icon: <Smile size={16} />, label: "React", action: () => { setEmojiPickerMsgId(contextMenu.msg.id); setContextMenu(null); } },
              { icon: <Pin size={16} />, label: "Pin", action: () => pinMessage(contextMenu.msg) },
              { icon: <Forward size={16} />, label: "Forward", action: () => openForwardModal(contextMenu.msg) },
              { icon: <Copy size={16} />, label: "Copy", action: () => copyMessage(contextMenu.msg) },
              ...(contextMenu.msg.sender_id === currentUser?.id && !contextMenu.msg.is_deleted ? [
                { icon: <Edit2 size={16} />, label: "Edit", action: () => { setEditingMsg(contextMenu.msg); setInput(contextMenu.msg.content); setContextMenu(null); } },
                { icon: <Trash2 size={16} />, label: "Delete for me", action: () => deleteMessage(contextMenu.msg, false) },
                { icon: <Trash2 size={16} />, label: "Delete for everyone", action: () => deleteMessage(contextMenu.msg, true) },
              ] : []),
            ].map((item, i) => (
              <button key={i} onClick={item.action}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", background: "none", border: "none", cursor: "pointer", color: item.label.includes("Delete") ? TG.danger : TG.textPrimary, fontSize: "14px", textAlign: "left", transition: "background 0.15s" }}
                onMouseOver={e => e.currentTarget.style.background = "#f5f5f5"}
                onMouseOut={e => e.currentTarget.style.background = "none"}>
                {item.icon}{item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── REPLY BAR ──────────────────────────────────────────── */}
      <AnimatePresence>
        {replyTo && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "8px 12px", background: TG.panelBg, display: "flex", alignItems: "center", gap: "10px", borderTop: `1px solid ${TG.divider}`, overflow: "hidden" }}>
            <div style={{ flex: 1, borderLeft: `3px solid ${TG.accent}`, paddingLeft: "10px", background: "white", padding: "8px 10px", borderRadius: "6px" }}>
              <p style={{ fontSize: "12px", color: TG.accent, fontWeight: 600, marginBottom: "2px" }}>Replying to message</p>
              <p style={{ fontSize: "13px", color: TG.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary }}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── EDIT BAR ───────────────────────────────────────────── */}
      <AnimatePresence>
        {editingMsg && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ padding: "8px 14px", background: TG.panelBg, display: "flex", alignItems: "center", gap: "10px", borderTop: `1px solid ${TG.divider}`, overflow: "hidden" }}>
            <Edit2 size={15} color={TG.accent} />
            <p style={{ flex: 1, fontSize: "13px", color: TG.textSecondary }}>Editing message</p>
            <button onClick={() => { setEditingMsg(null); setInput(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: TG.textSecondary }}><X size={18} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── INPUT BAR ──────────────────────────────────────────── */}
      <div style={{ padding: "8px 10px 10px", background: TG.panelBg, display: "flex", alignItems: "flex-end", gap: "6px", flexShrink: 0, borderTop: `1px solid ${TG.divider}` }}>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*,.pdf,.docx,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
        <div style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "4px", background: TG.bg, borderRadius: "22px", padding: "6px 6px 6px 12px", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}><Smile size={22} /></button>
          <textarea ref={textareaRef} value={input} onChange={handleTextareaChange}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={editingMsg ? "Edit message" : "Type a message"} rows={1}
            style={{ flex: 1, padding: "8px 4px", border: "none", background: "transparent", fontSize: "15px", color: TG.textPrimary, outline: "none", resize: "none", maxHeight: "120px", lineHeight: 1.4, fontFamily: "inherit" }} />
          <button onClick={() => fileInputRef.current?.click()} style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}><Paperclip size={21} /></button>
          {!input.trim() && <button style={{ background: "none", border: "none", cursor: "pointer", color: "#54656f", padding: "6px", flexShrink: 0, alignSelf: "center" }}><Camera size={21} /></button>}
        </div>
        <button onClick={input.trim() ? sendMessage : undefined} disabled={sending}
          style={{ width: "46px", height: "46px", borderRadius: "50%", border: "none", background: input.trim() ? TG.accent : "#e0e0e0", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "default", flexShrink: 0, transition: "background 0.2s" }}>
          {input.trim() ? <Send size={19} /> : <Mic size={20} />}
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
