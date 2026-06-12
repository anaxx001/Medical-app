import { useState } from "react";
import AppShell from "@/components/AppShell";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun, Bell, Eye, EyeOff, Monitor } from "lucide-react";

export default function AppSettingsPage() {
  const { darkMode, toggleDarkMode } = useTheme();

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("medstudent-notifications");
    return saved ? JSON.parse(saved) : {
      notify_replies: true,
      notify_upvotes: true,
      notify_mentions: true,
      notify_messages: true,
    };
  });

  const [privacy, setPrivacy] = useState(() => {
    const saved = localStorage.getItem("medstudent-privacy");
    return saved ? JSON.parse(saved) : {
      online_status_visible: true,
      show_study_year: true,
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

  const Row = ({ label, sub, enabled, onToggle }: {
    label: string; sub?: string; enabled: boolean; onToggle: () => void;
  }) => (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "14px 0",
      borderBottom: "1px solid var(--border)",
    }}>
      <div>
        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: 0 }}>{label}</p>
        {sub && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>{sub}</p>}
      </div>
      <Toggle enabled={enabled} onToggle={onToggle} />
    </div>
  );

  const SectionTitle = ({ children }: { children: string }) => (
    <p style={{
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: "11px",
      color: "var(--text-muted)",
      letterSpacing: "1px",
      textTransform: "uppercase",
      margin: "0 0 4px 0",
    }}>{children}</p>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>

        {/* Header */}
        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "22px",
          color: "var(--text)",
          marginBottom: "24px",
        }}>
          App Settings
        </h1>

        {/* APPEARANCE */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <SectionTitle>Appearance</SectionTitle>

          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 0",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {darkMode ? <Moon size={18} color="#0D9488" /> : <Sun size={18} color="#0D9488" />}
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: 0 }}>
                  {darkMode ? "Dark Mode" : "Light Mode"}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                  {darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
          padding: "20px",
          marginBottom: "16px",
        }}>
          <SectionTitle>Notifications</SectionTitle>
          <Row
            label="Replies"
            sub="When someone replies to your post"
            enabled={notifications.notify_replies}
            onToggle={() => handleNotificationChange("notify_replies", !notifications.notify_replies)}
          />
          <Row
            label="Upvotes"
            sub="When someone upvotes your post"
            enabled={notifications.notify_upvotes}
            onToggle={() => handleNotificationChange("notify_upvotes", !notifications.notify_upvotes)}
          />
          <Row
            label="Mentions"
            sub="When someone mentions you"
            enabled={notifications.notify_mentions}
            onToggle={() => handleNotificationChange("notify_mentions", !notifications.notify_mentions)}
          />
          <Row
            label="Messages"
            sub="When you receive a direct message"
            enabled={notifications.notify_messages}
            onToggle={() => handleNotificationChange("notify_messages", !notifications.notify_messages)}
          />
        </div>

        {/* PRIVACY */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "20px",
          marginBottom: "16px",
        }}>
          <SectionTitle>Privacy</SectionTitle>
          <Row
            label="Show Online Status"
            sub="Let others see when you're active"
            enabled={privacy.online_status_visible}
            onToggle={() => handlePrivacyChange("online_status_visible", !privacy.online_status_visible)}
          />
          <Row
            label="Show Study Year"
            sub="Display your level on your profile"
            enabled={privacy.show_study_year}
            onToggle={() => handlePrivacyChange("show_study_year", !privacy.show_study_year)}
          />
        </div>

      </div>
    </AppShell>
  );
}