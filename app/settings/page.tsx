"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Camera, Save, Lock, LogOut, ChevronLeft } from "lucide-react";
import { savePrefs, Profession } from "@/lib/userPrefs";

const professions: Profession[] = [
  "Medical Doctor","Radiographer","Nurse","Anatomist",
  "Pharmacist","Physiotherapist","Dentist","Other",
];

const professionIcons: Record<Profession, string> = {
  "Medical Doctor":"🩺","Radiographer":"🔬","Nurse":"💉",
  "Anatomist":"🧬","Pharmacist":"💊","Physiotherapist":"🏃",
  "Dentist":"🦷","Other":"📚",
};

const defaultAvatars = ["🧑‍⚕️","👩‍⚕️","🧑‍🔬","👨‍🔬","🧑‍💻","👩‍💻","🦸","🦸‍♀️","🧑‍🎓","👩‍🎓"];

type Tab = "profile" | "profession" | "password";

export default function SettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Profile fields
  const [userId, setUserId] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [institution, setInstitution] = useState("");
  const [profession, setProfession] = useState<Profession>("Other");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");

  // Password fields
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
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
        setAvatarUrl(data.avatar_url || "");
      }
      setLoading(false);
    }
    loadProfile();
  }, [router, supabase]);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setError("");
    setTimeout(() => setSuccess(""), 3000);
  }

  function showError(msg: string) {
    setError(msg);
    setSuccess("");
  }

  async function handleSaveProfile() {
    if (!fullName.trim() || !username.trim()) {
      showError("Name and username are required.");
      return;
    }
    setSaving(true);
    try {
      let finalAvatarUrl = avatarUrl;

      // Upload new avatar if selected
      if (avatarFile) {
        const ext = avatarFile.name.split(".").pop();
        const path = `avatars/${userId}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("materials") // Make sure this bucket is correct or change to 'avatars'
          .upload(path, avatarFile, { upsert: true });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(path);
        finalAvatarUrl = urlData.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim(),
          username: username.toLowerCase().trim(),
          bio: bio.trim() || null,
          institution: institution.trim() || null,
          avatar_url: finalAvatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;
      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      showSuccess("Profile updated successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveProfession() {
    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profession, updated_at: new Date().toISOString() })
        .eq("id", userId);
      if (updateError) throw updateError;
      
      savePrefs({ profession, name: fullName });
      showSuccess("Profession updated!");
    } catch (err: any) {
      showError(err.message || "Failed to update profession.");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword() {
    if (!newPassword || !confirmPassword) {
      showError("Please fill in both fields.");
      return;
    }
    if (newPassword.length < 8) {
      showError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showError("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const { error: pwError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (pwError) throw pwError;
      setNewPassword("");
      setConfirmPassword("");
      showSuccess("Password changed successfully!");
    } catch (err: any) {
      showError(err.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function handleAvatarFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  function handleEmojiAvatar(emoji: string) {
    setAvatarUrl(`emoji:${emoji}`);
    setAvatarFile(null);
    setAvatarPreview("");
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "profile", label: "Profile" },
    { key: "profession", label: "Profession" },
    { key: "password", label: "Account" },
  ];

  if (loading) return (
    <AppShell>
      <div style={{ maxWidth:"560px", margin:"0 auto" }}>
        <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", height:"300px", border:"1px solid var(--border)", opacity:0.6 }} />
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth:"560px", margin:"0 auto", paddingBottom: "40px" }}>
        
        {/* Header with Back Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text)", display: "flex", alignItems: "center" }}>
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"22px", color:"var(--text)", margin: 0 }}>Settings</h1>
            <p style={{ fontSize:"13px", color:"var(--text-muted)", margin: 0 }}>Manage your preferences</p>
          </div>
        </div>

        {/* Updated Pill-style Tabs */}
        <div style={{ display:"flex", background: "var(--surface)", padding: "4px", borderRadius: "99px", border: "1px solid var(--border)", marginBottom:"24px" }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(""); setSuccess(""); }}
              style={{ 
                flex: 1, 
                padding:"10px 18px", 
                borderRadius:"99px", 
                border:"none", 
                background: tab === key ? "var(--surface-2)" : "transparent", 
                color: tab === key ? "var(--text)" : "var(--text-muted)", 
                fontFamily:"var(--font-display)", 
                fontWeight:600, 
                fontSize:"13px", 
                cursor:"pointer", 
                transition:"all 0.2s ease" 
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Success / Error Messages */}
          {success && (
            <div style={{ padding:"12px 16px", borderRadius:"12px", background:"#EDFFF5", border:"1px solid var(--green-light)", color:"var(--green-dark)", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px" }}>
              ✅ {success}
            </div>
          )}
          {error && (
            <div style={{ padding:"12px 16px", borderRadius:"12px", background:"#FFF0F2", border:"1px solid #FFB3BE", color:"#E8445A", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px" }}>
              ⚠️ {error}
            </div>
          )}

          {/* --- PROFILE TAB --- */}
          {tab === "profile" && (
            <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"24px", display:"flex", flexDirection:"column", gap:"20px" }}>

              {/* Avatar Section */}
              <div>
                <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"12px" }}>
                  Profile Picture
                </label>
                <div style={{ display:"flex", alignItems:"center", gap:"16px", marginBottom:"16px" }}>
                  <div style={{ width:"72px", height:"72px", borderRadius:"50%", background:"var(--gradient)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", flexShrink:0, fontSize:"26px", border: "2px solid var(--surface)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                    {avatarPreview
                      ? <img src={avatarPreview} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                      : avatarUrl?.startsWith("http")
                        ? <img src={avatarUrl} style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                        : avatarUrl?.startsWith("emoji:")
                          ? avatarUrl.replace("emoji:", "")
                          : <span style={{ color:"white", fontFamily:"var(--font-display)", fontWeight:800, fontSize:"24px" }}>{getInitials(fullName || username)}</span>
                    }
                  </div>
                  <label style={{ display:"flex", alignItems:"center", gap:"6px", padding:"10px 16px", borderRadius:"99px", border:"1px solid var(--border)", background:"var(--surface-2)", cursor:"pointer", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", transition: "background 0.2s" }}>
                    <Camera size={16} />
                    Upload photo
                    <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display:"none" }} />
                  </label>
                </div>

                <p style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"8px", fontWeight: 500 }}>Or pick a default emoji:</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"8px" }}>
                  {defaultAvatars.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiAvatar(emoji)}
                      style={{ width:"44px", height:"44px", borderRadius:"50%", border:`2px solid ${avatarUrl === `emoji:${emoji}` ? "var(--blue)" : "var(--border)"}`, background: avatarUrl === `emoji:${emoji}` ? "rgba(45,135,200,0.1)" : "var(--surface)", fontSize:"20px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.15s ease" }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>Full Name</label>
                  <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }} />
                </div>
                <div>
                  <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }} />
                </div>
              </div>

              <div>
                <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none", resize:"vertical" }} />
              </div>

              <div>
                <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>Institution</label>
                <input type="text" value={institution} onChange={e => setInstitution(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }} />
              </div>

              <button onClick={handleSaveProfile} disabled={saving} style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"none", background:"var(--gradient)", color:"white", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"15px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1, display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginTop: "8px" }}>
                <Save size={18} /> {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {/* --- PROFESSION TAB --- */}
          {tab === "profession" && (
            <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"24px", display:"flex", flexDirection:"column", gap:"20px" }}>
              <p style={{ fontSize:"13.5px", color:"var(--text-muted)", margin: 0 }}>This determines how you're addressed across the app.</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
                {professions.map(p => {
                  const isSelected = profession === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProfession(p)}
                      style={{ display:"flex", alignItems:"center", gap:"10px", padding:"14px", borderRadius:"12px", border:`2px solid ${isSelected ? "var(--blue)" : "var(--border)"}`, background: isSelected ? "rgba(45,135,200,0.05)" : "var(--surface)", cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}
                    >
                      <span style={{ fontSize:"22px" }}>{professionIcons[p]}</span>
                      <span style={{ fontFamily:"var(--font-display)", fontWeight: isSelected ? 700 : 500, fontSize:"13px", color: isSelected ? "var(--blue)" : "var(--text)" }}>{p}</span>
                    </button>
                  );
                })}
              </div>
              <button onClick={handleSaveProfession} disabled={saving} style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"none", background:"var(--gradient)", color:"white", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"15px", cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.8 : 1, marginTop: "8px" }}>
                {saving ? "Saving..." : "Save Profession"}
              </button>
            </div>
          )}

          {/* --- PASSWORD TAB --- */}
          {tab === "password" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"24px" }}>
              
              <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"24px", display:"flex", flexDirection:"column", gap:"16px" }}>
                <h3 style={{ margin: 0, fontSize: "16px", fontFamily: "var(--font-display)" }}>Change Password</h3>
                <div>
                  <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>New Password</label>
                  <input type="password" placeholder="Min. 8 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }} />
                </div>
                <div>
                  <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"6px" }}>Confirm New Password</label>
                  <input type="password" placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ width:"100%", padding:"12px 14px", borderRadius:"10px", border:"1px solid var(--border)", background:"var(--surface)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }} />
                </div>
                <button onClick={handleChangePassword} disabled={saving} style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"none", background:"var(--surface-2)", color:"var(--text)", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"15px", cursor: saving ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", marginTop: "8px" }}>
                  <Lock size={16} /> {saving ? "Updating..." : "Update Password"}
                </button>
              </div>

              {/* Logout Area */}
              <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"24px" }}>
                <button onClick={handleLogout} style={{ width:"100%", padding:"14px", borderRadius:"10px", border:"1px solid #FFB3BE", background:"#FFF0F2", color:"#E8445A", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"15px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", transition: "all 0.2s" }}>
                  <LogOut size={16} /> Log Out
                </button>
              </div>
              
            </div>
          )}
          
        </div>
      </div>
    </AppShell>
  );
}
