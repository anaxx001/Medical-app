import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useNavigate } from "wouter";
import {
  Settings,
  LogOut,
  Trash2,
  Moon,
  Sun,
  Monitor,
  Bell,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  FileText,
  AlertCircle,
  Check,
  X,
} from "lucide-react";

interface UserSettings {
  id: string;
  full_name: string;
  username: string;
  email: string;
  institution?: string;
  course_programme?: string;
  study_year?: string;
  avatar_url?: string;
  bio?: string;
}

interface NotificationSettings {
  push_enabled: boolean;
  notify_replies: boolean;
  notify_upvotes: boolean;
  notify_mentions: boolean;
  notify_messages: boolean;
}

interface PrivacySettings {
  online_status_visible: boolean;
  show_study_year: boolean;
}

type ThemeMode = "light" | "dark" | "os";
type FeedView = "card" | "compact";

const APP_VERSION = "1.0.0";

export default function SettingsPage() {
  const supabase = createClient();
  const navigate = useNavigate();

  // User settings
  const [user, setUser] = useState<UserSettings | null>(null);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [institution, setInstitution] = useState("");
  const [courseProgramme, setCourseProgramme] = useState("");
  const [studyYear, setStudyYear] = useState("");

  // Appearance
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const [feedView, setFeedView] = useState<FeedView>("card");

  // Notifications
  const [notifications, setNotifications] = useState<NotificationSettings>({
    push_enabled: true,
    notify_replies: true,
    notify_upvotes: true,
    notify_mentions: true,
    notify_messages: true,
  });

  // Privacy
  const [privacy, setPrivacy] = useState<PrivacySettings>({
    online_status_visible: true,
    show_study_year: true,
  });

  // UI State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [expandedSection, setExpandedSection] = useState<string | null>("account");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load settings
  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          navigate("/login");
          return;
        }

        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileError) throw profileError;

        setUser(profileData);
        setFullName(profileData?.full_name || "");
        setUsername(profileData?.username || "");
        setEmail(authUser.email || "");
        setInstitution(profileData?.institution || "");
        setCourseProgramme(profileData?.course_programme || "");
        setStudyYear(profileData?.study_year || "");

        // Load appearance settings from localStorage
        const savedTheme = (localStorage.getItem("theme_mode") as ThemeMode) || "light";
        const savedFeedView = (localStorage.getItem("feed_view") as FeedView) || "card";
        setThemeMode(savedTheme);
        setFeedView(savedFeedView);

        // Load notification settings from localStorage
        const savedNotifications = localStorage.getItem("notification_settings");
        if (savedNotifications) {
          setNotifications(JSON.parse(savedNotifications));
        }

        // Load privacy settings from localStorage
        const savedPrivacy = localStorage.getItem("privacy_settings");
        if (savedPrivacy) {
          setPrivacy(JSON.parse(savedPrivacy));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
        setMessage({ type: "error", text: "Failed to load settings" });
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  async function handleSaveBasicSettings() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          username: username.toLowerCase(),
          institution,
          course_programme: courseProgramme,
          study_year: studyYear,
        })
        .eq("id", user.id);

      if (error) throw error;

      setMessage({ type: "success", text: "Profile updated successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeEmail() {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ email });

      if (error) throw error;

      setMessage({ type: "success", text: "Verification email sent to new address" });
    } catch (error) {
      console.error("Error changing email:", error);
      setMessage({ type: "error", text: "Failed to change email" });
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    setPasswordError("");
    setPasswordSuccess("");

    if (!newPassword || !confirmPassword) {
      setPasswordError("Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) throw error;

      setPasswordSuccess("Password changed successfully");
      setNewPassword("");
      setConfirmPassword("");
      setChangePassword(false);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError("Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  function handleThemeChange(mode: ThemeMode) {
    setThemeMode(mode);
    localStorage.setItem("theme_mode", mode);

    // Apply theme (integrate with your theme system)
    if (mode === "dark") {
      document.documentElement.style.colorScheme = "dark";
    } else if (mode === "light") {
      document.documentElement.style.colorScheme = "light";
    } else {
      // Follow OS
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.style.colorScheme = prefersDark ? "dark" : "light";
    }

    setMessage({ type: "success", text: "Theme updated" });
  }

  function handleFeedViewChange(view: FeedView) {
    setFeedView(view);
    localStorage.setItem("feed_view", view);
    setMessage({ type: "success", text: "Feed view updated" });
  }

  function handleNotificationChange(key: keyof NotificationSettings, value: boolean) {
    const updated = { ...notifications, [key]: value };
    setNotifications(updated);
    localStorage.setItem("notification_settings", JSON.stringify(updated));
  }

  function handlePrivacyChange(key: keyof PrivacySettings, value: boolean) {
    const updated = { ...privacy, [key]: value };
    setPrivacy(updated);
    localStorage.setItem("privacy_settings", JSON.stringify(updated));
  }

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      setMessage({ type: "error", text: "Failed to log out" });
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setMessage({ type: "error", text: "Please type DELETE to confirm" });
      return;
    }

    setSaving(true);
    try {
      // Note: Deleting account requires a server-side function
      // For now, just sign out
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      setMessage({ type: "error", text: "Failed to delete account" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Loading settings...</p>
        </div>
      </AppShell>
    );
  }

  const tealGradient = "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)";

  const sectionStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    marginBottom: "16px",
    overflow: "hidden",
  };

  const sectionHeaderStyle = (isExpanded: boolean) => ({
    padding: "16px",
    background: isExpanded ? "var(--surface)" : "var(--surface)",
    border: "none",
    borderBottom: isExpanded ? "1px solid var(--border)" : "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "14px",
    color: "var(--text)",
    transition: "background 0.2s",
  });

  const contentStyle = {
    padding: "20px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "16px",
  };

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    border: "1px solid var(--border)",
    background: "var(--surface)",
    color: "var(--text)",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    fontSize: "12px",
    fontWeight: 600,
    color: "var(--text-muted)",
    fontFamily: "var(--font-display)",
    marginBottom: "4px",
  };

  const fieldStyle = {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  };

  const buttonStyle = (variant: "primary" | "secondary" | "danger" = "primary") => ({
    padding: "10px 16px",
    borderRadius: "6px",
    border: "none",
    fontFamily: "var(--font-body)",
    fontWeight: 600,
    fontSize: "13px",
    cursor: "pointer",
    transition: "all 0.2s",
    background:
      variant === "danger"
        ? "#E63946"
        : variant === "secondary"
          ? "var(--border)"
          : tealGradient,
    color: variant === "secondary" ? "var(--text)" : "#fff",
  });

  const toggleStyle = (enabled: boolean) => ({
    width: "48px",
    height: "24px",
    borderRadius: "12px",
    border: "none",
    background: enabled ? "#1ABC9C" : "var(--border)",
    cursor: "pointer",
    position: "relative" as const,
    padding: 0,
    display: "flex",
    alignItems: "center",
    paddingLeft: enabled ? "2px" : "26px",
    paddingRight: enabled ? "26px" : "2px",
    transition: "all 0.2s",
  });

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text)",
              margin: "0 0 8px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Settings size={28} color="#1ABC9C" />
            Settings
          </h1>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", margin: 0, fontSize: "13px" }}>
            Manage your account, appearance, and preferences
          </p>
        </div>

        {/* Message Toast */}
        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background:
                message.type === "success"
                  ? "rgba(61, 190, 122, 0.1)"
                  : "rgba(230, 57, 70, 0.1)",
              border:
                message.type === "success"
                  ? "1px solid #3DBE7A"
                  : "1px solid #E63946",
              color:
                message.type === "success"
                  ? "#2A8C5A"
                  : "#C2303E",
              fontFamily: "var(--font-body)",
              fontSize: "13px",
            }}
          >
            {message.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {/* ACCOUNT SETTINGS */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "account" ? null : "account")}
            style={sectionHeaderStyle(expandedSection === "account")}
          >
            <span>🔐 ACCOUNT SETTINGS</span>
            <span style={{ transform: expandedSection === "account" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "account" && (
            <div style={contentStyle}>
              {/* Display Name */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Display Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  style={inputStyle}
                />
              </div>

              {/* Username */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Email Address</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" style={{ ...inputStyle, flex: 1 }} />
                  <button onClick={handleChangeEmail} style={buttonStyle("primary")} disabled={saving}>
                    Update
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Password</label>
                {!changePassword ? (
                  <button
                    onClick={() => setChangePassword(true)}
                    style={{
                      ...buttonStyle("secondary"),
                      width: "100%",
                      justifyContent: "center",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Lock size={14} /> Change Password
                  </button>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password"
                      style={inputStyle}
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      style={inputStyle}
                    />
                    {passwordError && (
                      <p style={{ color: "#E63946", fontSize: "12px", margin: 0, fontFamily: "var(--font-body)" }}>
                        {passwordError}
                      </p>
                    )}
                    {passwordSuccess && (
                      <p style={{ color: "#3DBE7A", fontSize: "12px", margin: 0, fontFamily: "var(--font-body)" }}>
                        {passwordSuccess}
                      </p>
                    )}
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleChangePassword} style={{ ...buttonStyle("primary"), flex: 1 }} disabled={saving}>
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setChangePassword(false);
                          setNewPassword("");
                          setConfirmPassword("");
                          setPasswordError("");
                        }}
                        style={{ ...buttonStyle("secondary"), flex: 1 }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Institution */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Institution/School</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g., University of Lagos"
                  style={inputStyle}
                />
              </div>

              {/* Course/Programme */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Course/Programme</label>
                <input
                  type="text"
                  value={courseProgramme}
                  onChange={(e) => setCourseProgramme(e.target.value)}
                  placeholder="e.g., Medicine, Dentistry, Nursing"
                  style={inputStyle}
                />
              </div>

              {/* Study Year */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Study Year/Level</label>
                <select
                  value={studyYear}
                  onChange={(e) => setStudyYear(e.target.value)}
                  style={{ ...inputStyle, cursor: "pointer" }}
                >
                  <option value="">Select year...</option>
                  <option value="100L">100 Level</option>
                  <option value="200L">200 Level</option>
                  <option value="300L">300 Level</option>
                  <option value="400L">400 Level</option>
                  <option value="500L">500 Level</option>
                  <option value="600L">600 Level</option>
                  <option value="postgrad">Postgraduate</option>
                </select>
              </div>

              {/* Save Button */}
              <button onClick={handleSaveBasicSettings} style={{ ...buttonStyle("primary"), width: "100%" }} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}
        </div>

        {/* APPEARANCE */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "appearance" ? null : "appearance")}
            style={sectionHeaderStyle(expandedSection === "appearance")}
          >
            <span>🎨 APPEARANCE</span>
            <span style={{ transform: expandedSection === "appearance" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "appearance" && (
            <div style={contentStyle}>
              {/* Theme Mode */}
              <div>
                <label style={labelStyle}>Theme</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                  {(["light", "dark", "os"] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => handleThemeChange(mode)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: themeMode === mode ? "2px solid #1ABC9C" : "1px solid var(--border)",
                        background: themeMode === mode ? "rgba(26, 188, 156, 0.1)" : "var(--surface)",
                        color: "var(--text)",
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                    >
                      {mode === "light" && <Sun size={14} />}
                      {mode === "dark" && <Moon size={14} />}
                      {mode === "os" && <Monitor size={14} />}
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feed View */}
              <div>
                <label style={labelStyle}>Default Feed View</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {(["card", "compact"] as const).map((view) => (
                    <button
                      key={view}
                      onClick={() => handleFeedViewChange(view)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "6px",
                        border: feedView === view ? "2px solid #1ABC9C" : "1px solid var(--border)",
                        background: feedView === view ? "rgba(26, 188, 156, 0.1)" : "var(--surface)",
                        color: "var(--text)",
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)} View
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* NOTIFICATIONS */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "notifications" ? null : "notifications")}
            style={sectionHeaderStyle(expandedSection === "notifications")}
          >
            <span>🔔 NOTIFICATIONS</span>
            <span style={{ transform: expandedSection === "notifications" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "notifications" && (
            <div style={contentStyle}>
              {/* Push Notifications */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    Push Notifications
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                    Receive notifications on your device
                  </p>
                </div>
                <button
                  onClick={() => handleNotificationChange("push_enabled", !notifications.push_enabled)}
                  style={toggleStyle(notifications.push_enabled)}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", margin: "auto" }} />
                </button>
              </div>

              {/* Individual Notification Toggles */}
              {[
                { key: "notify_replies", label: "New Replies", icon: "💬" },
                { key: "notify_upvotes", label: "Upvotes", icon: "👍" },
                { key: "notify_mentions", label: "Mentions", icon: "@" },
                { key: "notify_messages", label: "Messages", icon: "✉️" },
              ].map(({ key, label, icon }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                  <div>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                      {icon} {label}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(key as keyof NotificationSettings, !notifications[key as keyof NotificationSettings])}
                    style={toggleStyle(notifications[key as keyof NotificationSettings])}
                  >
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", margin: "auto" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRIVACY */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "privacy" ? null : "privacy")}
            style={sectionHeaderStyle(expandedSection === "privacy")}
          >
            <span>🔒 PRIVACY</span>
            <span style={{ transform: expandedSection === "privacy" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "privacy" && (
            <div style={contentStyle}>
              {/* Online Status */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    Show Online Status
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                    Let others see when you're active
                  </p>
                </div>
                <button
                  onClick={() => handlePrivacyChange("online_status_visible", !privacy.online_status_visible)}
                  style={toggleStyle(privacy.online_status_visible)}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", margin: "auto" }} />
                </button>
              </div>

              {/* Study Year Visibility */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <div>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
                    Show Study Year on Profile
                  </p>
                  <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                    Display your study year publicly
                  </p>
                </div>
                <button
                  onClick={() => handlePrivacyChange("show_study_year", !privacy.show_study_year)}
                  style={toggleStyle(privacy.show_study_year)}
                >
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: "white", margin: "auto" }} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ABOUT */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "about" ? null : "about")}
            style={sectionHeaderStyle(expandedSection === "about")}
          >
            <span>ℹ️ ABOUT</span>
            <span style={{ transform: expandedSection === "about" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "about" && (
            <div style={contentStyle}>
              {/* Links */}
              {[
                { label: "Privacy Policy", url: "/privacy" },
                { label: "Terms of Use", url: "/terms" },
                { label: "Help & Support", url: "/help" },
              ].map(({ label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 0",
                    textDecoration: "none",
                    color: "#1ABC9C",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span>{label}</span>
                  <span>→</span>
                </a>
              ))}

              {/* Version */}
              <div style={{ paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  App Version: <strong>{APP_VERSION}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ACCOUNT ACTIONS */}
        <div style={sectionStyle}>
          <button
            onClick={() => setExpandedSection(expandedSection === "actions" ? null : "actions")}
            style={sectionHeaderStyle(expandedSection === "actions")}
          >
            <span>⚡ ACCOUNT ACTIONS</span>
            <span style={{ transform: expandedSection === "actions" ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
          </button>

          {expandedSection === "actions" && (
            <div style={contentStyle}>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                style={{
                  ...buttonStyle("primary"),
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <LogOut size={14} />
                Log Out
              </button>

              {/* Delete Account Button */}
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{
                  ...buttonStyle("danger"),
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                <Trash2 size={14} />
                Delete Account
              </button>
            </div>
          )}
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "24px",
                maxWidth: "400px",
                boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                <AlertCircle size={24} color="#E63946" />
                <h2
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "18px",
                    fontWeight: 700,
                    color: "var(--text)",
                    margin: 0,
                  }}
                >
                  Delete Account
                </h2>
              </div>

              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}
              >
                This action is permanent. All your data, posts, and comments will be deleted. To confirm, type "DELETE" below.
              </p>

              <input
                type="text"
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder='Type "DELETE" to confirm'
                style={{
                  ...inputStyle,
                  marginBottom: "16px",
                }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirm("");
                  }}
                  style={{ ...buttonStyle("secondary"), flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  style={{ ...buttonStyle("danger"), flex: 1 }}
                  disabled={saving || deleteConfirm !== "DELETE"}
                >
                  {saving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
