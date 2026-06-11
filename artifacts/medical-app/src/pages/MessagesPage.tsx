import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Search, Send, X, UserSearch } from "lucide-react";
import AppShell from "@/components/AppShell";

type DM = {
  id: string;
  other_user_id: string;
  other_name: string;
  other_avatar: string | null;
  last_message: string;
  last_at: string;
  unread: boolean;
};

type Tab = "messages" | "requests" | "threads";

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ name, avatar, size = 44 }: { name: string; avatar: string | null; size?: number }) {
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: "50%",
      flexShrink: 0,
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
  );
}

function ComposeModal({ onClose, onSelect }: { onClose: () => void; onSelect: (userId: string) => void }) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      setSearching(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, profession")
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      setResults(data || []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 200,
          backdropFilter: "blur(4px)",
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: "var(--surface)",
        borderRadius: "20px 20px 0 0",
        zIndex: 201,
        padding: "20px 16px",
        maxHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.2)",
      }}>
        {/* Handle bar */}
        <div style={{
          width: "40px",
          height: "4px",
          background: "var(--border)",
          borderRadius: "99px",
          margin: "0 auto 16px",
        }} />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
        }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--text)",
          }}>
            New Message
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface-2)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text-muted)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Search input */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "12px",
          border: "1.5px solid var(--border)",
          background: "var(--surface-2)",
          marginBottom: "16px",
        }}>
          <UserSearch size={16} color="var(--text-muted)" />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text)",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Results */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {searching && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px" }}>
              Searching...
            </p>
          )}
          {!searching && query && results.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "13px", padding: "20px" }}>
              No users found for "{query}"
            </p>
          )}
          {!searching && !query && (
            <p style={{ textAlign: "center", color: "var(--text-light)", fontSize: "13px", padding: "20px" }}>
              Type a name or username to search
            </p>
          )}
          {results.map(user => (
            <div
              key={user.id}
              onClick={() => onSelect(user.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 8px",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <Avatar name={user.full_name || user.username} avatar={user.avatar_url} size={40} />
              <div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "var(--text)",
                  marginBottom: "2px",
                }}>
                  {user.full_name || user.username}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  u/{user.username}
                  {user.profession && ` · ${user.profession}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [dms, setDms] = useState<DM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("messages");
  const [showCompose, setShowCompose] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      const seen = new Set<string>();
      const conversations: DM[] = [];

      for (const msg of data) {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (seen.has(otherId)) continue;
        seen.add(otherId);

        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name, avatar_url")
          .eq("id", otherId)
          .single();

        conversations.push({
          id: msg.id,
          other_user_id: otherId,
          other_name: profile?.full_name || profile?.username || "Unknown",
          other_avatar: profile?.avatar_url || null,
          last_message: msg.content || "",
          last_at: msg.created_at,
          unread: !msg.is_read && msg.receiver_id === user.id,
        });
      }

      setDms(conversations);
      setLoading(false);
    }
    init();
  }, []);

  const filtered = dms.filter(d =>
    d.other_name.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "messages", label: "Messages" },
    { key: "requests", label: "Requests" },
    { key: "threads", label: "Threads" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}>

        {/* Header */}
        <div style={{ marginBottom: "8px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "26px",
            color: "var(--text)",
            marginBottom: "16px",
          }}>
            Chat
          </h1>

          {/* Tabs */}
          <div style={{
            display: "flex",
            borderBottom: "1.5px solid var(--border)",
            marginBottom: "16px",
          }}>
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  padding: "10px 16px",
                  border: "none",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: activeTab === key ? 600 : 400,
                  color: activeTab === key ? "var(--teal, #0D9488)" : "var(--text-muted)",
                  cursor: "pointer",
                  borderBottom: activeTab === key ? "2px solid var(--teal, #0D9488)" : "2px solid transparent",
                  marginBottom: "-1.5px",
                  transition: "all 0.2s ease",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 14px",
          borderRadius: "99px",
          border: "1.5px solid var(--border)",
          background: "var(--surface)",
          marginBottom: "16px",
          boxShadow: "var(--shadow-xs)",
        }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search conversations"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text)",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: "72px",
                borderRadius: "var(--radius)",
                background: "var(--surface-2)",
                border: "1px solid var(--border)",
              }} className="skeleton" />
            ))}
          </div>
        ) : activeTab === "messages" && filtered.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            minHeight: "360px",
            textAlign: "center",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--teal-soft, #F0FDFA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              marginBottom: "20px",
            }}>
              💬
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
              marginBottom: "8px",
            }}>
              {dms.length === 0 ? "Welcome to chat!" : "No results"}
            </h2>
            <p style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "24px",
              maxWidth: "280px",
              lineHeight: 1.6,
            }}>
              {dms.length === 0
                ? "Start a conversation by tapping the button below"
                : `No conversations matching "${search}"`}
            </p>
            {dms.length === 0 && (
              <button
                onClick={() => setShowCompose(true)}
                style={{
                  padding: "12px 24px",
                  borderRadius: "99px",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Send size={16} /> Start a conversation
              </button>
            )}
          </div>
        ) : activeTab === "requests" ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            minHeight: "360px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>📬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)", marginBottom: "8px" }}>No requests yet</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "280px" }}>Message requests from new contacts will appear here</p>
          </div>
        ) : activeTab === "threads" ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            minHeight: "360px",
            textAlign: "center",
          }}>
            <div style={{ fontSize: "56px", marginBottom: "16px" }}>🧵</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)", marginBottom: "8px" }}>No threads yet</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "280px" }}>Threaded conversations will appear here</p>
          </div>
        ) : (
          <div style={{
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            overflow: "hidden",
            boxShadow: "var(--shadow-sm)",
          }}>
            {filtered.map((dm, i) => (
              <div
                key={dm.id}
                onClick={() => navigate(`/messages/${dm.other_user_id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 16px",
                  cursor: "pointer",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border-light)" : "none",
                  background: dm.unread ? "var(--teal-soft, #F0FDFA)" : "var(--surface)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface-hover)"}
                onMouseLeave={e => e.currentTarget.style.background = dm.unread ? "var(--teal-soft, #F0FDFA)" : "var(--surface)"}
              >
                <Avatar name={dm.other_name} avatar={dm.other_avatar} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "3px",
                  }}>
                    <p style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: dm.unread ? 700 : 600,
                      fontSize: "14px",
                      color: "var(--text)",
                    }}>
                      {dm.other_name}
                    </p>
                    <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                      {timeAgo(dm.last_at)}
                    </span>
                  </div>
                  <p style={{
                    fontSize: "13px",
                    color: dm.unread ? "var(--text)" : "var(--text-muted)",
                    fontFamily: "var(--font-body)",
                    fontWeight: dm.unread ? 500 : 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {dm.last_message}
                  </p>
                </div>
                {dm.unread && (
                  <div style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    background: "#0D9488",
                    flexShrink: 0,
                  }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Compose Button */}
      <button
        onClick={() => setShowCompose(true)}
        style={{
          position: "fixed",
          bottom: "80px",
          right: "20px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "var(--gradient)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(13,148,136,0.35)",
          transition: "all 0.2s ease",
          color: "white",
          zIndex: 100,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(13,148,136,0.45)";
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(13,148,136,0.35)";
        }}
      >
        <Send size={22} />
      </button>

      {/* Compose Modal */}
      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onSelect={(userId) => {
            setShowCompose(false);
            navigate(`/messages/${userId}`);
          }}
        />
      )}
    </AppShell>
  );
}