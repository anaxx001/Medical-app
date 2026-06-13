import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Save, Lock, LogOut, Upload, X } from "lucide-react";
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

  // NEW: Image upload states
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>("");
  const [currentCoverUrl, setCurrentCoverUrl] = useState<string>("");
  const [uploadingImages, setUploadingImages] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setUserId(user.id);

        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (fetchError) throw fetchError;

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
      } catch (err) {
        console.error("Error loading profile settings:", err);
        setError("Failed to load profile settings.");
      } finally {
        setLoading(false);
      }
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

  // NEW: Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError("Avatar must be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images allowed");
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // NEW: Handle cover file selection
  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError("Cover image must be less than 5MB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Only JPEG, PNG, or WebP images allowed");
      return;
    }

    setCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // NEW: Upload images to Supabase Storage
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

      // Upload avatar
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

      // Upload cover
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

      // Update profile
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error);
    }
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
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px", flexWrap: "wrap" }}>
          {(["profile", "images", "profession", "password"] as Tab[]).map(t => (
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
              {t === "images" ? "🖼️ Images" : t}
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

          {/* NEW: IMAGES TAB */}
          {tab === "images" && (
            <>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
                Upload your profile picture and cover image. Max 5MB each.
              </p>

              {/* Avatar Upload */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "12px" }}>
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
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Upload size={32} color="var(--text-muted)" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  style={{ display: "none" }}
                  id="avatar-input"
                />
                <label
                  htmlFor="avatar-input"
                  style={{
                    display: "inline-block",
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
                  Choose Image
                </label>
                {avatarFile && (
                  <button
                    onClick={() => { setAvatarFile(null); setAvatarPreview(currentAvatarUrl); }}
                    style={{
                      marginLeft: "8px",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    <X size={14} style={{ display: "inline", marginRight: "4px" }} />
                    Clear
                  </button>
                )}
              </div>

              {/* Cover Upload */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "12px" }}>
                  Cover Image
                </label>
                <div style={{
                  position: "relative",
                  width: "100%",
                  height: "150px",
                  borderRadius: "var(--radius-sm)",
                  border: "2px dashed var(--border)",
                  background: "var(--surface-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  marginBottom: "12px",
                }}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Upload size={32} color="var(--text-muted)" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleCoverSelect}
                  style={{ display: "none" }}
                  id="cover-input"
                />
                <label
                  htmlFor="cover-input"
                  style={{
                    display: "inline-block",
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
                  Choose Image
                </label>
                {coverFile && (
                  <button
                    onClick={() => { setCoverFile(null); setCoverPreview(currentCoverUrl); }}
                    style={{
                      marginLeft: "8px",
                      padding: "8px 12px",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      background: "#FEE2E2",
                      color: "#DC2626",
                      cursor: "pointer",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    <X size={14} style={{ display: "inline", marginRight: "4px" }} />
                    Clear
                  </button>
                )}
              </div>

              <button
                onClick={uploadImages}
                disabled={uploadingImages || (!avatarFile && !coverFile)}
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
                  cursor: uploadingImages ? "not-allowed" : "pointer",
                  opacity: uploadingImages ? 0.6 : 1,
                }}
              >
                <Upload size={15} />
                {uploadingImages ? "Uploading..." : "Upload Images"}
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
