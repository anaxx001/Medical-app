import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Save, Lock, LogOut } from "lucide-react";
import { savePrefs, Profession } from "@/lib/userPrefs";

const professions: Profession[] = [
  "Medical Doctor", "Radiographer", "Nurse", "Anatomist",
  "Pharmacist", "Physiotherapist", "Dentist", "Other",
];

type Tab = "profile" | "profession" | "password";

export default function ProfileSettingsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [profession, setProfession] = useState<Profession>("Other");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setFullName(data.full_name || "");
        setUsername(data.username || "");
        setBio(data.bio || "");
        setInstitution(data.institution || "");
        setProfession(data.profession || "Other");
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(""); setError(""); }, 3000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  async function saveProfile() {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ full_name: fullName, username, bio, institution, profession })
        .eq("id", userId);
      if (updateError) throw updateError;
      savePrefs({ profession, name: fullName, username });
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function updatePassword() {
    if (!newPassword || !confirmPassword) { setError("Fill in both fields."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match."); return; }
    if (newPassword.length < 8) { setError("Must be at least 8 characters."); return; }
    setSaving(true);
    setError("");
    try {
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) throw pwError;
      setSuccess("Password updated!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/login");
  }

  if (loading) return (
    <AppShell>
      <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading...</p>
    </AppShell>
  );

  const inputStyle = {
    width: "100%",
    padding: "11px 14px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box" as const,
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "560px", margin: "0 auto" }}>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "22px",
          color: "var(--text)",
          marginBottom: "20px",
        }}>
          Profile Settings
        </h1>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {(["profile", "profession", "password"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setSuccess(""); setError(""); }}
              style={{
                padding: "8px 16px",
                borderRadius: "99px",
                border: "none",
                background: tab === t ? "var(--gradient)" : "var(--surface)",
                color: tab === t ? "white" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                textTransform: "capitalize",
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Toast */}
        {(success || error) && (
          <div style={{
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: success ? "#EDFFF5" : "#FFF0F2",
            color: success ? "#059669" : "#E8445A",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            marginBottom: "16px",
            border: `1px solid ${success ? "#059669" : "#E8445A"}`,
          }}>
            {success || error}
          </div>
        )}

        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "24px",
          boxShadow: "var(--shadow)",
        }}>

          {/* PROFILE TAB */}
          {tab === "profile" && (
            <>
              {[
                { label: "Full Name", value: fullName, setter: setFullName, placeholder: "Your full name" },
                { label: "Username", value: username, setter: setUsername, placeholder: "your_username" },
                { label: "Institution", value: institution, setter: setInstitution, placeholder: "Your university" },
              ].map(({ label, value, setter, placeholder }) => (
                <div key={label} style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>
                  Bio
                </label>
                <textarea
                  placeholder="Tell the community about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}

          {/* PROFESSION TAB */}
          {tab === "profession" && (
            <>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Update your medical discipline.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "20px" }}>
                {professions.map((p) => {
                  const isSelected = profession === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProfession(p)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "var(--radius-sm)",
                        border: `2px solid ${isSelected ? "var(--teal)" : "var(--border)"}`,
                        background: isSelected ? "rgba(13,148,136,0.08)" : "var(--surface-2)",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--font-display)",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "13px",
                        color: isSelected ? "var(--teal)" : "var(--text)",
                        transition: "all 0.2s",
                      }}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                <Save size={15} />
                {saving ? "Saving..." : "Save"}
              </button>
            </>
          )}

          {/* PASSWORD TAB */}
          {tab === "password" && (
            <>
              {[
                { label: "New Password", value: newPassword, setter: setNewPassword },
                { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword },
              ].map(({ label, value, setter }) => (
                <div key={label} style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>
                    {label}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    style={inputStyle}
                  />
                </div>
              ))}

              <button
                onClick={updatePassword}
                disabled={saving}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "12px 20px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  marginBottom: "24px",
                }}
              >
                <Lock size={15} />
                {saving ? "Updating..." : "Update Password"}
              </button>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex", alignItems: "center", gap: "8px",
                    padding: "12px 20px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid #E8445A",
                    background: "transparent",
                    color: "#E8445A",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}