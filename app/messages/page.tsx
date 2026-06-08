"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Plus } from "lucide-react"; // Added Plus here
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
  const router = useRouter();
  const [dms, setDms] = useState<DM[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

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
          last_message: msg.body,
          last_at: msg.created_at,
          unread: !msg.read_at && msg.receiver_id === user.id,
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
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px 24px", position: "relative" }}>
        
        {/* Header Block */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => router.back()} style={{ background: "var(--surface)", border: "1px solid var(--border)", cursor: "pointer", padding: "8px", borderRadius: "10px", display: "flex", alignItems: "center", color: "var(--text)" }}>
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)", margin: 0 }}>Messages</h1>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{dms.length} Active conversation{dms.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", marginBottom: "16px", boxShadow: "var(--shadow-sm)" }}>
          <Search size={15} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search conversations..."
            style={{ border: "none", background: "none", outline: "none", fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", width: "100%" }}
          />
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2].map(i => (
              <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--radius)", height: "70px", border: "1px solid var(--border)", opacity: 0.6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>💬</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "6px" }}>No messages yet</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>Start a conversation from someone&apos;s profile card.</p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow-sm)", marginBottom: "80px" }}>
            {filtered.map((dm, i) => (
              <a
                key={dm.other_user_id}
                href={`/messages/${dm.other_user_id}`}
                style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "14px 16px", textDecoration: "none",
                  borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none",
                  background: dm.unread ? "rgba(45,135,200,0.04)" : "transparent",
                  transition: "background 0.15s",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Avatar name={dm.other_name} avatar={dm.other_avatar} />
                  {dm.unread && (
                    <div style={{ position: "absolute", top: 0, right: 0, width: "10px", height: "10px", borderRadius: "50%", background: "var(--blue)", border: "2px solid var(--surface)" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: dm.unread ? 700 : 600, fontSize: "13.5px", color: "var(--text)", margin: 0 }}>{dm.other_name}</p>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dm.last_message}</p>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* FAB Button */}
        <a 
          href="/users" 
          style={{ 
            position: "fixed", 
            bottom: "85px", 
            right: "20px", 
            width: "56px", 
            height: "56px", 
            borderRadius: "50%", 
            background: "var(--blue)", 
            color: "white", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            boxShadow: "0 4px 12px rgba(45,135,200,0.4)",
            cursor: "pointer",
            zIndex: 40
          }}
        >
          <Plus size={28} />
        </a>
      </div>
    </AppShell>
  );
}
