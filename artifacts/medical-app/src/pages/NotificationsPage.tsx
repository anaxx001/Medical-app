import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Bell, X } from "lucide-react";
import AppShell from "@/components/AppShell";

type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: string;
  related_user_id?: string;
  related_user_name?: string;
  related_user_avatar?: string | null;
  is_read: boolean;
  created_at: string;
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(date).toLocaleDateString();
}

function isToday(date: string) {
  const now = new Date();
  const notifDate = new Date(date);
  return (
    notifDate.getDate() === now.getDate() &&
    notifDate.getMonth() === now.getMonth() &&
    notifDate.getFullYear() === now.getFullYear()
  );
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, color: "white", fontFamily: "var(--font-display)", fontWeight: 700, overflow: "hidden" }}>
      {avatar ? <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : name?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      // Enrich notifications with user data
      const enriched = await Promise.all(data.map(async (notif) => {
        if (notif.related_user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username, full_name, avatar_url")
            .eq("id", notif.related_user_id)
            .single();

          return {
            ...notif,
            related_user_name: profile?.full_name || profile?.username || "Unknown",
            related_user_avatar: profile?.avatar_url || null,
          };
        }
        return notif;
      }));

      setNotifications(enriched);
      setLoading(false);
    }
    init();
  }, []);

  // Group notifications by Today and Earlier
  const today = notifications.filter(n => isToday(n.created_at));
  const earlier = notifications.filter(n => !isToday(n.created_at));

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const renderNotificationItem = (notif: Notification) => (
    <div
      key={notif.id}
      onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderBottom: "1px solid var(--border)",
        backgroundColor: notif.is_read ? "transparent" : "rgba(13, 148, 136, 0.05)",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = notif.is_read ? "var(--surface-hover)" : "rgba(13, 148, 136, 0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notif.is_read ? "transparent" : "rgba(13, 148, 136, 0.05)";
      }}
    >
      {notif.related_user_avatar || notif.related_user_name ? (
        <Avatar name={notif.related_user_name || "U"} avatar={notif.related_user_avatar || null} size={40} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--surface)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--text-muted)" }}>
          <Bell size={18} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: notif.is_read ? 500 : 600, fontSize: "14px", color: "var(--text)", margin: "0 0 4px 0", lineHeight: 1.3 }}>
          {notif.message}
        </p>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {timeAgo(notif.created_at)}
        </span>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          handleDelete(notif.id);
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "var(--text-muted)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--text)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-muted)";
        }}
      >
        <X size={16} />
      </button>
    </div>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "20px" }}>Notifications</h1>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: "68px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.6 }} />)}
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", minHeight: "400px", textAlign: "center" }}>
            <div style={{ fontSize: "80px", marginBottom: "20px", opacity: 0.7 }}>🔔</div>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "var(--text)", marginBottom: "8px" }}>All caught up!</h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px" }}>
              You don't have any notifications right now. Check back later for updates from your community.
            </p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {/* Today Section */}
            {today.length > 0 && (
              <>
                <div style={{ padding: "12px 16px", background: "var(--surface-hover)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Today
                  </p>
                </div>
                {today.map(renderNotificationItem)}
              </>
            )}

            {/* Earlier Section */}
            {earlier.length > 0 && (
              <>
                <div style={{ padding: "12px 16px", background: "var(--surface-hover)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 10 }}>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Earlier
                  </p>
                </div>
                {earlier.map(renderNotificationItem)}
              </>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
