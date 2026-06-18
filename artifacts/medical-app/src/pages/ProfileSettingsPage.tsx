import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { 
  Save, Lock, LogOut, Upload, X, User, GraduationCap, 
  Building2, BookOpen, Check, AlertCircle, Camera, Loader2
} from "lucide-react";
import { savePrefs, Profession } from "@/lib/userPrefs";

const professions: Profession[] = [
  "Medical Doctor", "Radiographer", "Nurse", "Anatomist",
  "Pharmacist", "Physiotherapist", "Dentist", "Other",
];

type Tab = "profile" | "images" | "profession" | "password";

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

  // Image upload states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>("");
  const [uploadingImages, setUploadingImages] = useState(false);

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
        setCurrentAvatarUrl(data.avatar_url || "");
        setCurrentCoverUrl(data.cover_url || "");
        setAvatarPreview(data.avatar_url || null);
        setCoverPreview(data.cover_url || null);
      }
      setLoading(false);
    }
    loadProfile();
  }, []);

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Avatar must be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images allowed");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Cover image must be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images allowed");
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  async function uploadImages() {
    if (!avatarFile && !coverFile) {
      setError("Please select at least one image");
      return;
    }

    setUploadingImages(true);
    setError("");
    setSuccess("");

    try {
      let newAvatarUrl = currentAvatarUrl;
      let newCoverUrl = currentCoverUrl;

      if (avatarFile) {
        const fileName = `avatars/${userId}-${Date.now()}.${avatarFile.type.split('/')[1]}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("avatars")
          .getPublicUrl(fileName);

        newAvatarUrl = publicUrl.publicUrl;
      }

      if (coverFile) {
        const fileName = `covers/${userId}-${Date.now()}.${coverFile.type.split('/')[1]}`;
        const { error: uploadError } = await supabase.storage
          .from("covers")
          .upload(fileName, coverFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: publicUrl } = supabase.storage
          .from("covers")
          .getPublicUrl(fileName);

        newCoverUrl = publicUrl.publicUrl;
      }

      const updateData: any = {};
      if (avatarFile) updateData.avatar_url = newAvatarUrl;
      if (coverFile) updateData.cover_url = newCoverUrl;

      const { error: updateError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (updateError) throw updateError;

      setCurrentAvatarUrl(newAvatarUrl);
      setCurrentCoverUrl(newCoverUrl);
      setAvatarFile(null);
      setCoverFile(null);
      setSuccess("Images uploaded successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  }

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
      <div style={{ maxWidth: "560px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
        <Loader2 size={32} style={{ color: "var(--text-muted)", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
        <p style={{ color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppShell>
  );

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
    background: "var(--surface-2)",
    fontFamily: "var(--font-body)",
    fontSize: "14px",
    color: "var(--text)",
    outline: "none",
    boxSizing: "border-box" as const,
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const tabs = [
    { key: "profile" as Tab, label: "Profile", icon: User },
    { key: "images" as Tab, label: "Images", icon: Camera },
    { key: "profession" as Tab, label: "Profession", icon: GraduationCap },
    { key: "password" as Tab, label: "Password", icon: Lock },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "26px",
            color: "var(--text)",
            margin: "0 0 6px 0",
          }}>
            Profile Settings
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            Manage your profile, images, profession, and security.
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          {tabs.map(t => {
            const isActive = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSuccess(""); setError(""); }}
                style={{
                  padding: "10px 18px",
                  borderRadius: "99px",
                  border: isActive ? "2px solid #0D9488" : "1px solid var(--border)",
                  background: isActive ? "var(--gradient)" : "var(--surface)",
                  color: isActive ? "white" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: isActive ? 700 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Toast */}
        {(success || error) && (
          <div style={{
            padding: "14px 18px",
            borderRadius: "var(--radius-sm)",
            background: success ? "rgba(13,148,136,0.08)" : "rgba(232,68,90,0.08)",
            color: success ? "#0D9488" : "#E8445A",
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            marginBottom: "20px",
            border: `1px solid ${success ? "rgba(13,148,136,0.2)" : "rgba(232,68,90,0.2)"}`,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            animation: "fadeIn 0.3s ease",
          }}>
            {success ? <Check size={16} /> : <AlertCircle size={16} />}
            {success || error}
          </div>
        )}

        <div style={{
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "28px",
          boxShadow: "var(--shadow)",
        }}>
          {/* PROFILE TAB */}
          {tab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { label: "Full Name", value: fullName, setter: setFullName, placeholder: "Your full name", icon: User },
                { label: "Username", value: username, setter: setUsername, placeholder: "your_username", icon: BookOpen },
                { label: "Institution", value: institution, setter: setInstitution, placeholder: "Your university", icon: Building2 },
              ].map(({ label, value, setter, placeholder, icon: Icon }) => (
                <div key={label}>
                  <label style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "13px",
                    color: "var(--text)",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}>
                    <Icon size={14} style={{ color: "var(--text-muted)" }} />
                    {label}
                  </label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={e => setter(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0D9488";
                      e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--text)",
                  marginBottom: "8px",
                }}>
                  Bio
                </label>
                <textarea
                  placeholder="Tell the community about yourself..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#0D9488";
                    e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "var(--border)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "6px" }}>
                  {bio.length}/500 characters
                </p>
              </div>

              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  transition: "opacity 0.2s",
                  alignSelf: "flex-start",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* IMAGES TAB */}
          {tab === "images" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                Upload your profile picture and cover image. Max 5MB each. Square images work best for avatars.
              </p>

              {/* Avatar Upload */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--text)",
                  marginBottom: "12px",
                }}>
                  Profile Picture
                </label>
                <div style={{
                  position: "relative",
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  border: "2px dashed var(--border)",
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => document.getElementById("avatar-input")?.click()}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0D9488"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={32} color="var(--text-muted)" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  style={{ display: "none" }}
                  id="avatar-input"
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <label
                    htmlFor="avatar-input"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "var(--text)",
                    }}
                  >
                    <Upload size={14} /> Choose Image
                  </label>
                  {avatarFile && (
                    <button
                      onClick={() => { setAvatarFile(null); setAvatarPreview(currentAvatarUrl); }}
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(232,68,90,0.08)",
                        color: "#E8445A",
                        cursor: "pointer",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Cover Upload */}
              <div>
                <label style={{
                  display: "block",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--text)",
                  marginBottom: "12px",
                }}>
                  Cover Image
                </label>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "160px",
                  borderRadius: "var(--radius-sm)",
                  border: "2px dashed var(--border)",
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
                onClick={() => document.getElementById("cover-input")?.click()}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = "#0D9488"}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Camera size={32} color="var(--text-muted)" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverSelect}
                  style={{ display: "none" }}
                  id="cover-input"
                />
                <div style={{ display: "flex", gap: "8px" }}>
                  <label
                    htmlFor="cover-input"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)",
                      background: "var(--surface-2)",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "var(--text)",
                    }}
                  >
                    <Upload size={14} /> Choose Image
                  </label>
                  {coverFile && (
                    <button
                      onClick={() => { setCoverFile(null); setCoverPreview(currentCoverUrl); }}
                      style={{
                        padding: "8px 12px",
                        border: "none",
                        borderRadius: "var(--radius-sm)",
                        background: "rgba(232,68,90,0.08)",
                        color: "#E8445A",
                        cursor: "pointer",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "12px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <X size={14} /> Clear
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={uploadImages}
                disabled={uploadingImages || (!avatarFile && !coverFile)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: uploadingImages ? "not-allowed" : "pointer",
                  opacity: uploadingImages || (!avatarFile && !coverFile) ? 0.6 : 1,
                  alignSelf: "flex-start",
                  transition: "opacity 0.2s",
                }}
              >
                {uploadingImages ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Upload size={15} />}
                {uploadingImages ? "Uploading..." : "Upload Images"}
              </button>
            </div>
          )}

          {/* PROFESSION TAB */}
          {tab === "profession" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
                Select your medical discipline. This helps us tailor content and connect you with relevant communities.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                {professions.map((p) => {
                  const isSelected = profession === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProfession(p)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: "var(--radius-sm)",
                        border: `2px solid ${isSelected ? "#0D9488" : "var(--border)"}`,
                        background: isSelected ? "rgba(13,148,136,0.08)" : "var(--surface-2)",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "var(--font-display)",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: "14px",
                        color: isSelected ? "#0D9488" : "var(--text)",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isSelected && <Check size={16} />}
                      {p}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={15} />}
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          )}

          {/* PASSWORD TAB */}
          {tab === "password" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { label: "New Password", value: newPassword, setter: setNewPassword },
                { label: "Confirm Password", value: confirmPassword, setter: setConfirmPassword },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label style={{
                    display: "block",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "13px",
                    color: "var(--text)",
                    marginBottom: "8px",
                  }}>
                    {label}
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={value}
                    onChange={e => setter(e.target.value)}
                    style={inputStyle}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#0D9488";
                      e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "var(--border)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>
              ))}

              <button
                onClick={updatePassword}
                disabled={saving}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "14px 24px",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: "pointer",
                  alignSelf: "flex-start",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
              >
                {saving ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Lock size={15} />}
                {saving ? "Updating..." : "Update Password"}
              </button>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", marginTop: "8px" }}>
                <button
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "14px 24px",
                    borderRadius: "var(--radius-sm)",
                    border: "1px solid #E8445A",
                    background: "transparent",
                    color: "#E8445A",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(232,68,90,0.05)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <LogOut size={15} />
                  Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </AppShell>
  );
}
