import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useTheme } from "@/context/ThemeContext";
import { 
  Moon, Sun, Bell, Eye, EyeOff, Monitor, Volume2, VolumeX,
  Shield, Info, ChevronRight, Smartphone, Mail, HeartPulse
} from "lucide-react";

export default function AppSettingsPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("medstudent-notifications");
    return saved ? JSON.parse(saved) : {
      notify_replies: true,
      notify_upvotes: true,
      notify_mentions: true,
      notify_messages: true,
      notify_news: true,
      notify_community_invites: true,
    };
  });

  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem("medstudent-privacy");
    return saved ? JSON.parse(saved) : {
      online_status_visible: true,
      show_study_year: true,
      show_institution: true,
      allow_dm_from_following: false,
    };
  });

  function handleNotificationChange(key: string, value: boolean) {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem("medstudent-notifications", JSON.stringify(updated));
  }

  function handlePrivacyChange(key: string, value: boolean) {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    localStorage.setItem("medstudent-privacy", JSON.stringify(updated));
  }

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: "48px",
        height: "26px",
        borderRadius: "99px",
        border: "none",
        background: enabled ? "#0D9488" : "var(--border)",
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: "3px",
        left: enabled ? "25px" : "3px",
        width: "20px",
        height: "20px",
        borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      }} />
    </button>
  );

  const Row = ({ 
    label, 
    sub, 
    enabled, 
    onToggle,
    icon: Icon,
    iconColor = "#0D9488",
  }: {
    label: string; 
    sub?: string; 
    enabled: boolean; 
    onToggle: () => void;
    icon?: React.ComponentType<{ size?: number; color?: string }>;
    iconColor?: string;
  }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        {Icon && (
          <div style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: `${iconColor}12`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Icon size={18} color={iconColor} />
          </div>
        )}
        <div>
          <p style={{ 
            fontFamily: "var(--font-display)", 
            fontWeight: 600, 
            fontSize: "14px", 
            color: "var(--text)", 
            margin: 0 
          }}>{label}</p>
          {sub && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>{sub}</p>}
        </div>
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );

  const SectionTitle = ({ children, icon: Icon }: { children: string; icon?: any }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "8px",
    }}>
      {Icon && <Icon size={16} color="var(--text-muted)" />}
      <p style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "11px",
        color: "var(--text-muted)",
        letterSpacing: "1.2px",
        textTransform: "uppercase",
        margin: 0,
      }}>{children}</p>
    </div>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "26px",
            color: "var(--text)",
            margin: "0 0 6px 0",
          }}>
            App Settings
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            Customize your experience, notifications, and privacy preferences.
          </p>
        </div>

        {/* APPEARANCE */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <SectionTitle icon={Monitor}>Appearance</SectionTitle>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: darkMode ? "#0D948812" : "#F5A62315",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {darkMode ? <Moon size={18} color="#0D9488" /> : <Sun size={18} color="#F5A623" />}
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: 0 }}>
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "3px 0 0 0" }}>
                  {darkMode ? "Easier on the eyes at night" : "Classic bright interface"}
                </p>
              </div>
            </div>
            <Toggle enabled={darkMode} onToggle={toggleDarkMode} />
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <SectionTitle icon={Bell}>Notifications</SectionTitle>
          <Row
            label="Replies"
            sub="When someone replies to your post"
            enabled={notifications.notify_replies}
            onToggle={() => handleNotificationChange("notify_replies", !notifications.notify_replies)}
            icon={Volume2}
            iconColor="#2D87C8"
          />
          <Row
            label="Upvotes"
            sub="When someone upvotes your post"
            enabled={notifications.notify_upvotes}
            onToggle={() => handleNotificationChange("notify_upvotes", !notifications.notify_upvotes)}
            icon={HeartPulse}
            iconColor="#E8445A"
          />
          <Row
            label="Mentions"
            sub="When someone mentions you in a post or comment"
            enabled={notifications.notify_mentions}
            onToggle={() => handleNotificationChange("notify_mentions", !notifications.notify_mentions)}
            icon={Mail}
            iconColor="#9B6DFF"
          />
          <Row
            label="Messages"
            sub="When you receive a direct message"
            enabled={notifications.notify_messages}
            onToggle={() => handleNotificationChange("notify_messages", !notifications.notify_messages)}
            icon={Smartphone}
            iconColor="#3DBE7A"
          />
          <Row
            label="News & Updates"
            sub="Important announcements and feature updates"
            enabled={notifications.notify_news}
            onToggle={() => handleNotificationChange("notify_news", !notifications.notify_news)}
            icon={Volume2}
            iconColor="#F5A623"
          />
          <Row
            label="Community Invites"
            sub="When you're invited to join a community"
            enabled={notifications.notify_community_invites}
            onToggle={() => handleNotificationChange("notify_community_invites", !notifications.notify_community_invites)}
            icon={Shield}
            iconColor="#0D9488"
          />
        </div>

        {/* PRIVACY */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px 24px",
          marginBottom: "20px",
        }}>
          <SectionTitle icon={Shield}>Privacy</SectionTitle>
          <Row
            label="Show Online Status"
            sub="Let others see when you're active"
            enabled={privacy.online_status_visible}
            onToggle={() => handlePrivacyChange("online_status_visible", !privacy.online_status_visible)}
            icon={Eye}
            iconColor="#3DBE7A"
          />
          <Row
            label="Show Study Year"
            sub="Display your level on your profile"
            enabled={privacy.show_study_year}
            onToggle={() => handlePrivacyChange("show_study_year", !privacy.show_study_year)}
            icon={Eye}
            iconColor="#2D87C8"
          />
          <Row
            label="Show Institution"
            sub="Display your university on your profile"
            enabled={privacy.show_institution}
            onToggle={() => handlePrivacyChange("show_institution", !privacy.show_institution)}
            icon={Eye}
            iconColor="#9B6DFF"
          />
          <Row
            label="DMs from Followers Only"
            sub="Only allow direct messages from people you follow"
            enabled={privacy.allow_dm_from_following}
            onToggle={() => handlePrivacyChange("allow_dm_from_following", !privacy.allow_dm_from_following)}
            icon={Shield}
            iconColor="#E8445A"
          />
        </div>

        {/* Data & Storage Info */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px 24px",
        }}>
          <SectionTitle icon={Info}>About</SectionTitle>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {[
              { label: "Terms of Service", href: "/terms" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Content Guidelines", href: "/guidelines" },
              { label: "Version", value: "v1.0.0-beta" },
            ].map((item) => (
              <div key={item.label} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 0",
                borderBottom: "1px solid var(--border)",
              }}>
                <span style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "var(--text)",
                }}>
                  {item.label}
                </span>
                {item.href ? (
                  <a href={item.href} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    color: "#0D9488",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}>
                    View <ChevronRight size={14} />
                  </a>
                ) : (
                  <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{item.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
