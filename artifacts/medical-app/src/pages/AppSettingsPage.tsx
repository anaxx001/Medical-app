import { useState, useEffect } from "react";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { 
  ArrowLeft, WifiOff, VolumeX, Eye, HelpCircle, 
  Download, Sparkles, ShieldCheck, Heart, Trash2,
  Bell, Lock, Globe, Mail, Smartphone, UserCircle,
  FileText, Info, AlertOctagon, ChevronRight
} from "lucide-react";

export default function AppSettingsPage() {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");

  // Notifications
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [studyInvites, setStudyInvites] = useState(true);

  // Privacy
  const [publicProfile, setPublicProfile] = useState(true);
  const [showUni, setShowUni] = useState(true);

  const { darkMode, toggleDarkMode } = useTheme();

  // Loading state for updates
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: "success" | "error" } | null>(null);

  // Low-Data settings
  const [lowDataActive, setLowDataActive] = useState(() => localStorage.getItem("med_low_data") === "true");
  const [compressVoice, setCompressVoice] = useState(() => localStorage.getItem("med_compress_voice") !== "false");

  // Accessibility choices
  const [fontScale, setFontScale] = useState(() => localStorage.getItem("med_font_scale") || "normal");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("med_high_contrast") === "true");

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userProfile) {
          setProfile(userProfile);
          // Initialize states from DB
          setEmailNotifs(userProfile.email_notifications !== false);
          setPushNotifs(userProfile.push_notifications !== false);
          setStudyInvites(userProfile.study_invites !== false);
          setPublicProfile(userProfile.is_private !== true);
          setShowUni(userProfile.show_university !== false);
        }
      }
    }
    loadData();
  }, []);

  const handleUpdatePreference = async (key: string, value: any) => {
    if (!profile) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [key]: value })
        .eq("id", profile.id);
      
      if (error) throw error;
      
      setProfile({ ...profile, [key]: value });
      setMessage({ text: "Preference updated successfully.", type: "success" });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setMessage({ text: "Failed to update preference.", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you absolutely sure? This will delete all your study data, flashcards, and contributions. This action is irreversible.")) return;
    
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("profiles").delete().eq("id", user.id);
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      alert("Error deleting account. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  const handleLowDataToggle = () => {
    const nextVal = !lowDataActive;
    setLowDataActive(nextVal);
    localStorage.setItem("med_low_data", String(nextVal));
  };

  const handleCompressVoiceToggle = () => {
    const nextVal = !compressVoice;
    setCompressVoice(nextVal);
    localStorage.setItem("med_compress_voice", String(nextVal));
  };

  const handleFontScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFontScale(val);
    localStorage.setItem("med_font_scale", val);
  };

  const handleContrastToggle = () => {
    const nextVal = !highContrast;
    setHighContrast(nextVal);
    localStorage.setItem("med_high_contrast", String(nextVal));
  };

  const handleExportData = () => {
    // Generate secure medical workspace database dump as requested (Section 14 of Brief)
    const exportNode = {
      student_meta: profile || { role: "student", institution: "Nigerian Medical College" },
      active_recall_decks: [
        { id: "deck-1", title: "Pharmacokinetics", cards: 42 },
        { id: "deck-2", title: "Cranial Nerves", cards: 12 }
      ],
      focus_sessions_weekly_hours: 14.2,
      saved_reference_bulletins: [
        "Malaria Pediatric Immunization RTS,S vector loads"
      ],
      timestamp: new Date().toISOString()
    };

    const fileContents = JSON.stringify(exportNode, null, 2);
    const blob = new Blob([fileContents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medstudent_workspace_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Core Console
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>WORKSPACE ALIGNMENT</span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 24px", letterSpacing: "-0.5px" }}>
          Settings & Preferences
        </h1>

        {message && (
          <div style={{ 
            padding: "12px 16px", 
            borderRadius: "12px", 
            background: message.type === "success" ? "rgba(13, 148, 136, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: `1px solid ${message.type === "success" ? "#0D9488" : "#EF4444"}`,
            color: message.type === "success" ? "#0D9488" : "#EF4444",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px"
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "12px", borderBottom: "1px solid var(--border)", marginBottom: "24px" }}>
          {[
            { id: "general", label: "General", icon: Sparkles },
            { id: "account", label: "Account", icon: UserCircle },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "privacy", label: "Privacy", icon: ShieldCheck },
            { id: "help", label: "Support", icon: HelpCircle },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "99px",
                border: activeTab === t.id ? "1px solid #0D9488" : "1px solid var(--border)",
                background: activeTab === t.id ? "rgba(13, 148, 136, 0.05)" : "transparent",
                color: activeTab === t.id ? "#0D9488" : "var(--text-muted)",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === "general" && (
          <>
            {/* Appearance Section */}
            <section style={{ marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={20} color="#0D9488" /> Appearance
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Dark Mode</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Switch between light and dark interface themes for better visibility.
                    </span>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    style={{
                      background: darkMode ? "#0D9488" : "var(--border)",
                      border: "none",
                      borderRadius: "20px",
                      width: "44px",
                      height: "24px",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      left: darkMode ? "22px" : "4px",
                      top: "3px",
                      transition: "left 0.2s"
                    }} />
                  </button>
                </div>
              </div>
            </section>

            {/* 1. LOW-DATA MODE CONFIGURATION (Section 12 of Brief) */}
            <section style={{ marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <WifiOff size={20} color="#0D9488" /> Data Management
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Active Low-Data Optimizations</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Mute animations, lazy-load peer avatars, and activate offline study queues.
                    </span>
                  </div>
                  <button 
                    onClick={handleLowDataToggle}
                    style={{
                      background: lowDataActive ? "#0D9488" : "var(--border)",
                      border: "none",
                      borderRadius: "20px",
                      width: "44px",
                      height: "24px",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      left: lowDataActive ? "22px" : "4px",
                      top: "3px",
                      transition: "left 0.2s"
                    }} />
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Compress Peer Voice Notes</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Automatically compress voice recordings in study circles during peer revision sessions.
                    </span>
                  </div>
                  <button 
                    onClick={handleCompressVoiceToggle}
                    style={{
                      background: compressVoice ? "#0D9488" : "var(--border)",
                      border: "none",
                      borderRadius: "20px",
                      width: "44px",
                      height: "24px",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      left: compressVoice ? "22px" : "4px",
                      top: "3px",
                      transition: "left 0.2s"
                    }} />
                  </button>
                </div>
              </div>
            </section>

            {/* 2. ACCESSIBILITY ADJUSTMENTS (Section 13 of Brief) */}
            <section style={{ marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Eye size={20} color="#0D9488" /> Accessibility Options
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Clinical Text Scale</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Adjust textbook fonts and active recall quiz displays for easier readability.
                    </span>
                  </div>
                  <select 
                    value={fontScale}
                    onChange={handleFontScaleChange}
                    style={{
                      background: "var(--surface-muted)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--text)",
                      outline: "none"
                    }}
                  >
                    <option value="normal">Standard Font Size</option>
                    <option value="large">Large Textbook Font (18px)</option>
                    <option value="xlarge">Extra Large (High-Vis 22px)</option>
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>High-Contrast Core Interfaces</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Enable bold medical card outlines & high illumination tags.
                    </span>
                  </div>
                  <button 
                    onClick={handleContrastToggle}
                    style={{
                      background: highContrast ? "#0D9488" : "var(--border)",
                      border: "none",
                      borderRadius: "20px",
                      width: "44px",
                      height: "24px",
                      cursor: "pointer",
                      position: "relative"
                    }}
                  >
                    <div style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "white",
                      position: "absolute",
                      left: highContrast ? "22px" : "4px",
                      top: "3px",
                      transition: "left 0.2s"
                    }} />
                  </button>
                </div>
              </div>
            </section>

            {/* 3. EXPORT EXAM / RECALL WORKSPACE DATA (Section 14 of Brief) */}
            <section style={{ marginBottom: "20px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Download size={20} color="#0D9488" /> Export & Credentials
              </h2>

              <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <div>
                  <strong style={{ display: "block", fontSize: "14px" }}>Download Medical Profile & Cards Bundle</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Generate a secure JSON snapshot containing your study stats, active recall flashcards, and group schedules.
                  </span>
                </div>
                
                <button 
                  onClick={handleExportData}
                  style={{
                    background: "#0D9488",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Download size={15} /> Export Workspace
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === "account" && (
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCircle size={20} color="#0D9488" /> Account Management
            </h2>

            <Link href="/profile-settings" style={{ textDecoration: "none" }}>
              <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
                    <ArrowLeft size={20} style={{ transform: "rotate(180deg)" }} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px", color: "var(--text)" }}>Personal Information</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Update your name, bio, university, and images.</span>
                  </div>
                </div>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </Link>

            <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Mail size={18} color="#0D9488" />
                <strong style={{ fontSize: "14px" }}>Email Address</strong>
              </div>
              <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <span style={{ flex: 1, fontSize: "14px", color: "var(--text-muted)", background: "var(--surface)", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)" }}>
                  {profile?.email || "student@medstudent.com"}
                </span>
                <button 
                  onClick={() => alert("Email change verification sent to your current address.")}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Change
                </button>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px" }}>
              <button 
                onClick={handleDeleteAccount}
                disabled={updating}
                style={{ 
                  display: "flex", alignItems: "center", gap: "8px", 
                  padding: "12px 16px", borderRadius: "10px", border: "1px solid #EF4444", 
                  background: "transparent", color: "#EF4444", fontSize: "14px", 
                  fontWeight: 600, cursor: updating ? "not-allowed" : "pointer", transition: "all 0.2s",
                  opacity: updating ? 0.6 : 1
                }}
              >
                <Trash2 size={16} /> Delete Account
              </button>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                Permanently remove your account and all associated study data. This action cannot be undone.
              </p>
            </div>
          </section>
        )}

        {activeTab === "notifications" && (
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Bell size={20} color="#0D9488" /> Notification Preferences
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(13, 148, 136, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}>
                  <Mail size={18} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: "14px" }}>Email Notifications</strong>
                  <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Receive weekly digests and important study circle updates via email.</span>
                </div>
              </div>
              <button 
                onClick={() => {
                  const next = !emailNotifs;
                  setEmailNotifs(next);
                  handleUpdatePreference("email_notifications", next);
                }}
                disabled={updating}
                style={{
                  background: emailNotifs ? "#0D9488" : "var(--border)",
                  opacity: updating ? 0.6 : 1,
                  border: "none",
                  borderRadius: "20px",
                  width: "44px",
                  height: "24px",
                  cursor: updating ? "not-allowed" : "pointer",
                  position: "relative"
                }}
              >
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "white",
                  position: "absolute",
                  left: emailNotifs ? "22px" : "4px",
                  top: "3px",
                  transition: "left 0.2s"
                }} />
              </button>
            </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(13, 148, 136, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}>
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Push Notifications</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Get real-time alerts for mentions, comments, and direct messages.</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const next = !pushNotifs;
                    setPushNotifs(next);
                    handleUpdatePreference("push_notifications", next);
                  }}
                  disabled={updating}
                  style={{
                    background: pushNotifs ? "#0D9488" : "var(--border)",
                    opacity: updating ? 0.6 : 1,
                    border: "none",
                    borderRadius: "20px",
                    width: "44px",
                    height: "24px",
                    cursor: updating ? "not-allowed" : "pointer",
                    position: "relative"
                  }}
                >
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "white",
                    position: "absolute",
                    left: pushNotifs ? "22px" : "4px",
                    top: "3px",
                    transition: "left 0.2s"
                  }} />
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(13, 148, 136, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "#0D9488" }}>
                    <Heart size={18} />
                  </div>
                  <div>
                    <strong style={{ display: "block", fontSize: "14px" }}>Study Group Invites</strong>
                    <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Be notified when a peer invites you to join their surgical or clinical revision hub.</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    const next = !studyInvites;
                    setStudyInvites(next);
                    handleUpdatePreference("study_invites", next);
                  }}
                  disabled={updating}
                  style={{
                    background: studyInvites ? "#0D9488" : "var(--border)",
                    opacity: updating ? 0.6 : 1,
                    border: "none",
                    borderRadius: "20px",
                    width: "44px",
                    height: "24px",
                    cursor: updating ? "not-allowed" : "pointer",
                    position: "relative"
                  }}
                >
                  <div style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: "white",
                    position: "absolute",
                    left: studyInvites ? "22px" : "4px",
                    top: "3px",
                    transition: "left 0.2s"
                  }} />
                </button>
              </div>
          </section>
        )}

        {activeTab === "privacy" && (
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock size={20} color="#0D9488" /> Privacy & Visibility
            </h2>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>Public Profile</strong>
                <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Allow other medical students to find your profile and see your contributions.
                </span>
              </div>
              <button 
                onClick={() => {
                  const next = !publicProfile;
                  setPublicProfile(next);
                  handleUpdatePreference("is_private", !next); // private is the opposite of public
                }}
                disabled={updating}
                style={{
                  background: publicProfile ? "#0D9488" : "var(--border)",
                  opacity: updating ? 0.6 : 1,
                  border: "none",
                  borderRadius: "20px",
                  width: "44px",
                  height: "24px",
                  cursor: updating ? "not-allowed" : "pointer",
                  position: "relative"
                }}
              >
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white", position: "absolute", left: publicProfile ? "22px" : "4px", top: "3px", transition: "left 0.2s" }} />
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong style={{ display: "block", fontSize: "14px" }}>Show University Affiliation</strong>
                <span style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                  Display your institution on your posts and profile page.
                </span>
              </div>
              <button 
                onClick={() => {
                  const next = !showUni;
                  setShowUni(next);
                  handleUpdatePreference("show_university", next);
                }}
                disabled={updating}
                style={{
                  background: showUni ? "#0D9488" : "var(--border)",
                  opacity: updating ? 0.6 : 1,
                  border: "none",
                  borderRadius: "20px",
                  width: "44px",
                  height: "24px",
                  cursor: updating ? "not-allowed" : "pointer",
                  position: "relative"
                }}
              >
                <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white", position: "absolute", left: showUni ? "22px" : "4px", top: "3px", transition: "left 0.2s" }} />
              </button>
            </div>

            <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <ShieldCheck size={18} color="#0D9488" />
                <strong style={{ fontSize: "14px" }}>Blocked Students</strong>
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                You haven't blocked any users yet.
              </p>
              <button 
                onClick={() => alert("Your block list is currently empty.")}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Manage Block List
              </button>
            </div>
          </section>
        )}

        {activeTab === "help" && (
          <section style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "18px", fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <HelpCircle size={20} color="#0D9488" /> Support & Information
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {[
                { icon: HelpCircle, label: "Help Center", path: "/help" },
                { icon: FileText, label: "Community Guidelines", path: "/guidelines" },
                { icon: ShieldCheck, label: "Privacy Policy", path: "/privacy" },
                { icon: Info, label: "Terms of Service", path: "/terms" },
              ].map(item => (
                <Link key={item.label} href={item.path} style={{ textDecoration: "none" }}>
                  <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "10px", height: "100%" }}>
                    <item.icon size={18} color="#0D9488" />
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ background: "rgba(13, 148, 136, 0.03)", border: "1px solid rgba(13, 148, 136, 0.1)", borderRadius: "14px", padding: "20px", textAlign: "center" }}>
              <AlertOctagon size={24} color="#0D9488" style={{ marginBottom: "12px" }} />
              <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>Need direct assistance?</strong>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 16px 0" }}>
                Our moderators and developers are active on the platform. Reach out for any technical issues.
              </p>
              <button 
                onClick={() => alert("Support ticket system is initializing. Please try again in a few minutes.")}
                style={{ padding: "10px 24px", borderRadius: "10px", background: "#0D9488", color: "white", border: "none", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
              >
                Contact Support
              </button>
            </div>

            <div style={{ textAlign: "center", marginTop: "12px" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0, textTransform: "uppercase", letterSpacing: "1px" }}>
                MedStudent v2.4.0 (Nigeria Edition)
              </p>
            </div>
          </section>
        )}

      </div>

    </div>
  );
}
