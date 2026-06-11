import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Bell, X } from "lucide-react";
import AppShell from "@/components/AppShell";

type NotificationType = "all" | "mentions" | "upvotes" | "replies" | "system";

type Notification = {
  id: string;
  user_id: string;
  message: string;
  type: string;
  related_user_id?: string;
  related_user_name?: string;
  related_user_avatar?: string | null;
  related_post_id?: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        overflow: "hidden",
      }}
    >
      {avatar ? (
        <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      ) : (
        name?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationType>("all");
  const [unreadCount, setUnreadCount] = useState(0);

  const tabs: { key: NotificationType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "mentions", label: "Mentions" },
    { key: "upvotes", label: "Upvotes" },
    { key: "replies", label: "Replies" },
    { key: "system", label: "System" },
  ];

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!data) {
        setLoading(false);
        return;
      }

      // Enrich notifications with user data
      const enriched = await Promise.all(
        data.map(async (notif) => {
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
        })
      );

      setNotifications(enriched);
      const unread = enriched.filter((n) => !n.is_read).length;
      setUnreadCount(unread);
      setLoading(false);
    }
    init();
  }, []);

  // Filter notifications by tab
  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === "all") return true;
    if (activeTab === "mentions") return notif.type === "mention";
    if (activeTab === "upvotes") return notif.type === "upvote";
    if (activeTab === "replies") return notif.type === "reply";
    if (activeTab === "system") return notif.type === "system";
    return false;
  });

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications(notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    for (const id of unreadIds) {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    }

    setNotifications(notifications.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    const deleted = notifications.find((n) => n.id === id);
    if (deleted && !deleted.is_read) {
      setUnreadCount(Math.max(0, unreadCount - 1));
    }
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  const handleNavigateToPost = (postId: string) => {
    if (postId) {
      navigate(`/post/${postId}`);
    }
  };

  const renderNotificationItem = (notif: Notification) => (
    <div
      key={notif.id}
      onClick={() => {
        if (!notif.is_read) {
          handleMarkAsRead(notif.id);
        }
        if (notif.related_post_id) {
          handleNavigateToPost(notif.related_post_id);
        }
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        padding: "14px 16px",
        borderLeft: !notif.is_read ? "3px solid #0D9488" : "3px solid transparent",
        borderBottom: "1px solid var(--border)",
        backgroundColor: notif.is_read ? "transparent" : "rgba(13, 148, 136, 0.04)",
        cursor: notif.related_post_id ? "pointer" : "default",
        transition: "background-color 0.2s ease",
      }}
      onMouseEnter={(e) => {
        if (notif.related_post_id) {
          e.currentTarget.style.backgroundColor = notif.is_read
            ? "var(--surface-hover)"
            : "rgba(13, 148, 136, 0.08)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notif.is_read ? "transparent" : "rgba(13, 148, 136, 0.04)";
      }}
    >
      {notif.related_user_avatar || notif.related_user_name ? (
        <Avatar name={notif.related_user_name || "U"} avatar={notif.related_user_avatar || null} size={40} />
      ) : (
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            color: "var(--text-muted)",
          }}
        >
          <Bell size={18} />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: notif.is_read ? 500 : 600,
            fontSize: "14px",
            color: "var(--text)",
            margin: "0 0 4px 0",
            lineHeight: 1.4,
          }}
        >
          {notif.message}
        </p>
        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{timeAgo(notif.created_at)}</span>
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
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {/* Header with Notifications title and Mark all as read button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", margin: 0 }}>
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                color: "#0D9488",
                background: "rgba(13, 148, 136, 0.1)",
                border: "1px solid rgba(13, 148, 136, 0.3)",
                borderRadius: "6px",
                padding: "8px 12px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(13, 148, 136, 0.15)";
                e.currentTarget.style.borderColor = "rgba(13, 148, 136, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(13, 148, 136, 0.1)";
                e.currentTarget.style.borderColor = "rgba(13, 148, 136, 0.3)";
              }}
            >
              Mark all as read
            </button>
          )}
        </div>

        {/* Tabs for filtering: All, Mentions, Upvotes, Replies, System */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: activeTab === tab.key ? 600 : 500,
                fontSize: "13px",
                padding: "8px 12px",
                borderRadius: "6px",
                border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
                background: activeTab === tab.key ? "var(--surface)" : "transparent",
                color: activeTab === tab.key ? "var(--text)" : "var(--text-muted)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.key) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content: Loading, Empty State, or Notification Items */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "68px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              minHeight: "400px",
              textAlign: "center",
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}
          >
            {/* Bell icon emoji for empty state */}
            <div style={{ fontSize: "72px", marginBottom: "20px", opacity: 0.6 }}>🔔</div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--text)",
                marginBottom: "8px",
              }}
            >
              No notifications yet
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", maxWidth: "280px" }}>
              {activeTab === "all"
                ? "You're all caught up! Check back later for updates from your community."
                : `No ${activeTab} notifications yet.`}
            </p>
          </div>
        ) : (
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
            {filteredNotifications.map(renderNotificationItem)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
