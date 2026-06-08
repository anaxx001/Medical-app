import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
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

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "16px" }}>Messages</h1>

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

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: "68px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.6 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>💬</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--text-muted)" }}>
              {dms.length === 0 ? "No messages yet" : "No results"}
            </p>
            <p style={{ fontSize: "13px", color: "var(--text-light)", marginTop: "6px" }}>Messages from other users will appear here</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {filtered.map((dm, i) => (
              <div
                key={dm.id}
                style={{ display: "flex", alignItems: "center", gap: "12px", padding: "14px 16px", cursor: "pointer", borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none", background: dm.unread ? "rgba(45,135,200,0.03)" : "transparent" }}
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
    </AppShell>
  );
}
