import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Bell, X, CheckCircle2, XCircle, Shield, Users, MessageCircle,
  Heart, Share2, UserPlus, Flag, Megaphone, BookOpen, Crown,
  AlertTriangle, Info, ChevronRight, Trash2, Loader2, Sparkles,
  Inbox, CheckCheck,
} from "lucide-react";
import AnimatedPage from "@/components/animations/AnimatedPage";
import StaggerChildren from "@/components/animations/StaggerChildren";

type NotificationCategory = "all" | "social" | "community" | "invites" | "system" | "moderation";

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_user_id?: string;
  related_user_name?: string;
  related_user_avatar?: string | null;
  related_post_id?: string;
  reference_id?: string;
  reference_type?: string;
  metadata?: any;
  read: boolean;
  created_at: string;
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: "linear-gradient(135deg, #0D9488, #14B8A6)", display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.4, color: "white",
      fontFamily: "var(--font-display)", fontWeight: 700, overflow: "hidden",
    }}>
      {avatar ? (
        <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      ) : (
        name?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

function NotificationIcon({ type }: { type: string }) {
  const iconStyle = { color: "var(--text-muted)" };
  switch (type) {
    case "community_invite": return <Shield size={20} style={{ color: "#9B6DFF" }} />;
    case "community_welcome": return <Users size={20} style={{ color: "#0D9488" }} />;
    case "community_new_member": return <UserPlus size={20} style={{ color: "#0D9488" }} />;
    case "community_announcement": return <Megaphone size={20} style={{ color: "#F59E0B" }} />;
    case "materials_upload": return <BookOpen size={20} style={{ color: "#3B82F6" }} />;
    case "app_admin_invite": return <Crown size={20} style={{ color: "#E8445A" }} />;
    case "mention": return <MessageCircle size={20} style={{ color: "#0D9488" }} />;
    case "upvote": return <Heart size={20} style={{ color: "#E8445A" }} />;
    case "reply": return <MessageCircle size={20} style={{ color: "#3B82F6" }} />;
    case "follow": return <UserPlus size={20} style={{ color: "#0D9488" }} />;
    case "share": return <Share2 size={20} style={{ color: "#9B6DFF" }} />;
    case "warning": return <AlertTriangle size={20} style={{ color: "#F59E0B" }} />;
    case "ban": return <Flag size={20} style={{ color: "#ef4444" }} />;
    case "system": return <Info size={20} style={{ color: "var(--text-muted)" }} />;
    case "welcome": return <Users size={20} style={{ color: "#0D9488" }} />;
    case "profile_like": return <Heart size={20} style={{ color: "#E8445A" }} />;
    case "profile_comment": return <MessageCircle size={20} style={{ color: "#3B82F6" }} />;
    case "profile_follow": return <UserPlus size={20} style={{ color: "#0D9488" }} />;
    default: return <Bell size={20} style={iconStyle} />;
  }
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<NotificationCategory>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const tabs: { key: NotificationCategory; label: string }[] = [
    { key: "all", label: "All" },
    { key: "social", label: "Social" },
    { key: "community", label: "Community" },
    { key: "invites", label: "Invites" },
    { key: "moderation", label: "Mod" },
    { key: "system", label: "System" },
  ];

  // Map notification types to categories
  function getCategory(type: string): NotificationCategory {
    const socialTypes = ["mention", "upvote", "reply", "follow", "share", "profile_like", "profile_comment", "profile_follow"];
    const communityTypes = ["community_announcement", "community_welcome", "community_new_member", "materials_upload"];
    const inviteTypes = ["community_invite", "app_admin_invite"];
    const modTypes = ["warning", "ban", "report"];
    if (socialTypes.includes(type)) return "social";
    if (communityTypes.includes(type)) return "community";
    if (inviteTypes.includes(type)) return "invites";
    if (modTypes.includes(type)) return "moderation";
    return "system";
  }

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

      // Enrich with user data for related users
      const userIds = [...new Set(data.filter(n => n.related_user_id).map(n => n.related_user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", userIds)
        : { data: [] };

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const enriched = data.map(notif => {
        const profile = notif.related_user_id ? profileMap.get(notif.related_user_id) : null;
        return {
          ...notif,
          related_user_name: profile?.full_name || profile?.username || notif.metadata?.inviter_name || "Unknown",
          related_user_avatar: profile?.avatar_url || null,
        };
      });

      setNotifications(enriched);
      setUnreadCount(enriched.filter(n => !n.read).length);
      setLoading(false);
    }
    init();
  }, []);

  const filteredNotifications = notifications.filter(notif => {
    if (activeTab === "all") return true;
    return getCategory(notif.type) === activeTab;
  });

  const handleMarkAsRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = filteredNotifications.filter(n => !n.read).map(n => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    const deleted = notifications.find(n => n.id === id);
    if (deleted && !deleted.read) setUnreadCount(prev => Math.max(0, prev - 1));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // ── Invite Actions ──
  const handleAcceptInvite = async (notif: Notification) => {
    if (!notif.reference_id || !notif.metadata) return;
    setProcessingIds(prev => new Set(prev).add(notif.id));

    try {
      const inviteId = notif.reference_id;
      const { data: invite } = await supabase
        .from("community_invites")
        .select("*")
        .eq("id", inviteId)
        .single();

      if (!invite || invite.status !== "pending") {
        await handleMarkAsRead(notif.id);
        return;
      }

      await supabase.from("community_invites").update({ status: "accepted" }).eq("id", inviteId);

      await supabase.from("community_moderators").upsert({
        community_id: invite.community_id,
        user_id: notif.user_id,
        role: invite.role,
        assigned_by: invite.inviter_id,
      }, { onConflict: "community_id,user_id" });

      await supabase.from("notifications").insert({
        user_id: invite.inviter_id,
        type: "community_invite_accepted",
        title: "Invite Accepted",
        message: `${notif.related_user_name || "A user"} accepted your ${invite.role} invite`,
        reference_id: invite.community_id,
        reference_type: "community",
        metadata: { community_id: invite.community_id, role: invite.role },
      });

      await handleMarkAsRead(notif.id);
    } finally {
      setProcessingIds(prev => { const next = new Set(prev); next.delete(notif.id); return next; });
    }
  };

  const handleDeclineInvite = async (notif: Notification) => {
    if (!notif.reference_id) return;
    setProcessingIds(prev => new Set(prev).add(notif.id));

    try {
      const inviteId = notif.reference_id;
      const { data: invite } = await supabase
        .from("community_invites")
        .select("inviter_id, community_id, role")
        .eq("id", inviteId)
        .single();

      await supabase.from("community_invites").update({ status: "declined" }).eq("id", inviteId);

      if (invite) {
        await supabase.from("notifications").insert({
          user_id: invite.inviter_id,
          type: "community_invite_declined",
          title: "Invite Declined",
          message: `${notif.related_user_name || "A user"} declined your ${invite.role} invite`,
          reference_id: invite.community_id,
          reference_type: "community",
          metadata: { community_id: invite.community_id, role: invite.role },
        });
      }

      await handleMarkAsRead(notif.id);
    } finally {
      setProcessingIds(prev => { const next = new Set(prev); next.delete(notif.id); return next; });
    }
  };

  // ── Navigation ──
  const handleNavigate = (notif: Notification) => {
    if (!notif.read) handleMarkAsRead(notif.id);

    switch (notif.type) {
      case "community_invite":
      case "community_welcome":
      case "community_announcement":
      case "community_new_member":
        if (notif.metadata?.community_slug) {
          navigate(`/c/${notif.metadata.community_slug}`);
        } else if (notif.reference_id) {
          navigate(`/c/${notif.reference_id}`);
        }
        break;
      case "materials_upload":
        navigate("/materials");
        break;
      case "mention":
      case "upvote":
      case "reply":
      case "share":
        if (notif.related_post_id) {
          navigate(`/post/${notif.related_post_id}`);
        }
        break;
      case "follow":
      case "profile_follow":
        if (notif.related_user_id) {
          navigate(`/profile/${notif.related_user_name}`);
        }
        break;
      case "profile_like":
      case "profile_comment":
        if (notif.related_post_id) {
          navigate(`/post/${notif.related_post_id}`);
        } else if (notif.related_user_id) {
          navigate(`/profile/${notif.related_user_name}`);
        }
        break;
      case "warning":
      case "ban":
        if (notif.metadata?.community_slug) {
          navigate(`/c/${notif.metadata.community_slug}`);
        }
        break;
      case "app_admin_invite":
        break;
      default:
        break;
    }
  };

  // ── Render Action Buttons ──
  const renderActions = (notif: Notification) => {
    const isProcessing = processingIds.has(notif.id);

    if (notif.type === "community_invite" || notif.type === "app_admin_invite") {
      return (
        <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
          <button
            onClick={(e) => { e.stopPropagation(); handleAcceptInvite(notif); }}
            disabled={isProcessing}
            style={{
              padding: "8px 16px", borderRadius: "10px",
              background: "linear-gradient(135deg, #0D9488, #14B8A6)", color: "white", border: "none",
              fontWeight: 600, fontSize: "12px", cursor: isProcessing ? "not-allowed" : "pointer",
              opacity: isProcessing ? 0.6 : 1, display: "flex", alignItems: "center", gap: "4px",
              transition: "all 0.2s",
            }}
          >
            <CheckCircle2 size={14} /> {isProcessing ? "..." : "Accept"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDeclineInvite(notif); }}
            disabled={isProcessing}
            style={{
              padding: "8px 16px", borderRadius: "10px",
              background: "var(--surface)", color: "var(--text-muted)",
              border: "1px solid var(--border)", fontWeight: 600, fontSize: "12px",
              cursor: isProcessing ? "not-allowed" : "pointer", opacity: isProcessing ? 0.6 : 1,
              transition: "all 0.2s",
            }}
          >
            <XCircle size={14} /> Decline
          </button>
        </div>
      );
    }

    if (notif.type === "community_announcement" || notif.type === "materials_upload") {
      return (
        <div style={{ marginTop: "8px" }}>
          <span style={{
            fontSize: "11px", padding: "4px 10px", borderRadius: "99px",
            background: notif.type === "materials_upload" ? "rgba(59,130,246,0.1)" : "rgba(245,158,11,0.1)",
            color: notif.type === "materials_upload" ? "#3B82F6" : "#F59E0B", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: "4px",
          }}>
            {notif.type === "materials_upload" ? <BookOpen size={11} /> : <Megaphone size={11} />}
            {notif.type === "materials_upload" ? "New Material" : "Announcement"}
          </span>
        </div>
      );
    }

    if (notif.type === "warning") {
      return (
        <div style={{ marginTop: "8px" }}>
          <span style={{
            fontSize: "11px", padding: "4px 10px", borderRadius: "99px",
            background: "rgba(245,158,11,0.1)", color: "#F59E0B", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: "4px",
          }}>
            <AlertTriangle size={11} /> Warning from {notif.metadata?.moderator_name || "Moderator"}
          </span>
        </div>
      );
    }

    if (notif.type === "ban") {
      return (
        <div style={{ marginTop: "8px" }}>
          <span style={{
            fontSize: "11px", padding: "4px 10px", borderRadius: "99px",
            background: "rgba(239,68,68,0.1)", color: "#ef4444", fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: "4px",
          }}>
            <Flag size={11} /> Action taken
          </span>
        </div>
      );
    }

    return null;
  };

  const renderNotificationItem = (notif: Notification) => {
    const hasActions = ["community_invite", "app_admin_invite", "community_announcement", "materials_upload", "warning", "ban"].includes(notif.type);
    const isClickable = !hasActions || notif.type === "community_announcement" || notif.type === "materials_upload" || notif.type === "warning" || notif.type === "ban";

    return (
      <div
        key={notif.id}
        style={{
          display: "flex", alignItems: "flex-start", gap: "12px",
          padding: "14px 16px",
          borderLeft: !notif.read ? "3px solid #0D9488" : "3px solid transparent",
          borderBottom: "1px solid var(--border)",
          backgroundColor: notif.read ? "transparent" : "rgba(13, 148, 136, 0.04)",
          transition: "all 0.2s ease",
          cursor: isClickable ? "pointer" : "default",
        }}
        onClick={() => isClickable && handleNavigate(notif)}
        onMouseEnter={(e) => {
          if (isClickable) {
            e.currentTarget.style.backgroundColor = notif.read
              ? "var(--surface-2, rgba(0,0,0,0.02))"
              : "rgba(13, 148, 136, 0.08)";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = notif.read ? "transparent" : "rgba(13, 148, 136, 0.04)";
        }}
      >
        {/* Icon or Avatar */}
        {notif.related_user_avatar || notif.related_user_name ? (
          <Avatar name={notif.related_user_name || "U"} avatar={notif.related_user_avatar || null} size={40} />
        ) : (
          <div style={{
            width: 40, height: 40, borderRadius: "50%", background: "var(--surface)",
            border: "1px solid var(--border)", display: "flex", alignItems: "center",
            justifyContent: "center", flexShrink: 0,
          }}>
            <NotificationIcon type={notif.type} />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
            <div style={{ flex: 1 }}>
              <p style={{
                fontWeight: notif.read ? 500 : 700,
                fontSize: "14px", color: "var(--text-primary)", margin: "0 0 4px", lineHeight: 1.4,
              }}>
                {notif.title && <span style={{ fontWeight: 800 }}>{notif.title}</span>}
                {notif.title && notif.message ? " — " : ""}
                {notif.message}
              </p>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {timeAgo(notif.created_at)}
              </span>
            </div>
            <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
              {!notif.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                  style={{
                    background: "none", border: "none", cursor: "pointer", padding: "4px",
                    color: "#0D9488", display: "flex", alignItems: "center",
                    justifyContent: "center", borderRadius: "6px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13,148,136,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  title="Mark as read"
                >
                  <CheckCheck size={16} />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(notif.id); }}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px",
                  color: "var(--text-muted)", display: "flex", alignItems: "center",
                  justifyContent: "center", borderRadius: "6px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#EF4444"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {renderActions(notif)}
        </div>
      </div>
    );
  };

  function timeAgo(timestamp: string) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  return (
    <AnimatedPage>
      <div style={{ padding: "16px", paddingBottom: "80px", maxWidth: "700px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "12px",
              background: "linear-gradient(135deg, #0D9488, #14B8A6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Bell size={20} color="white" />
            </div>
            <div>
              <h1 style={{
                fontWeight: 800, fontSize: "22px",
                color: "var(--text-primary)", margin: 0,
              }}>
                Notifications
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllAsRead}
              style={{
                fontWeight: 600, fontSize: "13px",
                color: "#0D9488", background: "rgba(13, 148, 136, 0.1)",
                border: "1px solid rgba(13, 148, 136, 0.3)", borderRadius: "10px",
                padding: "8px 14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13, 148, 136, 0.2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(13, 148, 136, 0.1)"; }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", overflowX: "auto", paddingBottom: "4px" }}>
          {tabs.map(tab => {
            const count = notifications.filter(n => !n.read && getCategory(n.type) === tab.key).length;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                style={{
                  fontWeight: activeTab === tab.key ? 600 : 500,
                  fontSize: "13px", padding: "8px 14px", borderRadius: "99px",
                  border: activeTab === tab.key ? "1px solid var(--border)" : "1px solid transparent",
                  background: activeTab === tab.key ? "var(--surface)" : "transparent",
                  color: activeTab === tab.key ? "var(--text-primary)" : "var(--text-muted)",
                  cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px",
                  transition: "all 0.2s ease",
                }}>
                {tab.label}
                {count > 0 && (
                  <span style={{
                    background: "#0D9488", color: "white", fontSize: "10px",
                    fontWeight: 700, padding: "1px 6px", borderRadius: "99px",
                  }}>{count}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                height: "80px", borderRadius: "12px",
                background: "var(--surface)", border: "1px solid var(--border)",
                animation: "pulse 1.5s infinite",
              }} />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", padding: "60px 20px", minHeight: "400px",
            textAlign: "center", background: "var(--surface)",
            borderRadius: "16px", border: "1px solid var(--border)",
          }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "24px",
              background: "var(--bg)", border: "1px dashed var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "20px",
            }}>
              <Inbox size={36} color="var(--text-muted)" />
            </div>
            <h2 style={{
              fontWeight: 700, fontSize: "18px", color: "var(--text-primary)", marginBottom: "8px",
            }}>
              No notifications
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "280px", lineHeight: 1.5 }}>
              {activeTab === "all"
                ? "You're all caught up! Check back later for updates."
                : `No ${activeTab} notifications yet.`}
            </p>
          </div>
        ) : (
          <StaggerChildren>
            <div style={{
              background: "var(--surface)", borderRadius: "16px",
              border: "1px solid var(--border)", overflow: "hidden",
            }}>
              {filteredNotifications.map(renderNotificationItem)}
            </div>
          </StaggerChildren>
        )}
      </div>
    </AnimatedPage>
  );
}
