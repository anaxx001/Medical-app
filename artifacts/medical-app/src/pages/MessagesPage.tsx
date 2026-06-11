import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Search, Send } from "lucide-react";
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
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, color: "white", fontFamily: "var(--font-display)", fontWeight: 700, overflow: "hidden" }}>
      {avatar ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : name?.[0]?.toUpperCase() || "M"}
    </div>
  );
}

export default function MessagesPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [dms, setDms] = useState<DM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("messages");

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

  const handleCompose = () => {
    navigate("/messages/new");
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}>
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "16px" }}>Chat</h1>

          {/* Tab Navigation */}
          <div style={{ display: "flex", gap: "0px", borderBottom: "1px solid var(--border)", marginBottom: "16px" }}>
            {(["messages", "requests", "threads"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: "12px 16px",
                  border: "none",
                  background: "transparent",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  fontWeight: activeTab === tab ? 600 : 500,
                  color: activeTab === tab ? "var(--text)" : "var(--text-muted)",
                  cursor: "pointer",
                  borderBottom: activeTab === tab ? "2px solid var(--blue)" : "none",
                  marginBottom: "-1px",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--surface)", marginBottom: "16px" }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search conversations"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", width: "100%" }}
          />
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: "68px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.6 }} />)}
          </div>
        ) : activeTab === "messages" && filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", minHeight: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.7 }}>💬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)", marginBottom: "8px" }}>Welcome to chat!</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "24px", maxWidth: "300px" }}>
              {dms.length === 0 ? "Start a conversation by sending a message to a user" : "No results found"}
            </p>
          </div>
        ) : activeTab === "requests" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", minHeight: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.7 }}>📬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)", marginBottom: "8px" }}>No requests yet</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px" }}>Message requests from new contacts will appear here</p>
          </div>
        ) : activeTab === "threads" ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", minHeight: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.7 }}>🧵</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)", marginBottom: "8px" }}>No threads yet</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px" }}>Threaded conversations will appear here</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {filtered.map((dm, i) => (
              <div
                key={dm.id}
                onClick={() => navigate(`/messages/${dm.other_user_id}`)}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", backgroundColor: "var(--surface)", transition: "background-color 0.2s ease" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--surface-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--surface)")}
              >
                <Avatar name={dm.other_name} avatar={dm.other_avatar} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: dm.unread ? 700 : 600, fontSize: "14px", color: "var(--text)" }}>{dm.other_name}</p>
                    <span style={{ fontSize: "11px", color: "var(--text-light)" }}>{timeAgo(dm.last_at)}</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dm.last_message}</p>
                </div>
                {dm.unread && <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--blue)", flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Compose Button */}
      <button
        onClick={handleCompose}
        style={{
          position: "fixed",
          bottom: "32px",
          right: "32px",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "#17a2b8",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 4px 12px rgba(23, 162, 184, 0.3)",
          transition: "all 0.2s ease",
          color: "white",
          zIndex: 100,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#138496";
          e.currentTarget.style.boxShadow = "0 6px 16px rgba(23, 162, 184, 0.4)";
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "#17a2b8";
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(23, 162, 184, 0.3)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Send size={24} />
      </button>
    </AppShell>
  );
}
