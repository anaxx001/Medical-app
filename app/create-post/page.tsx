"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { X, Image as ImageIcon, FileText, Paperclip } from "lucide-react";

const communities = [
  { name: "Announcements", slug: "announcements", icon: "📢" },
  { name: "General Discussion", slug: "general", icon: "💬" },
  { name: "Study Materials", slug: "materials", icon: "📁" },
  { name: "Anatomy", slug: "anatomy", icon: "🧠" },
  { name: "Physiology", slug: "physiology", icon: "⚗️" },
  { name: "Biochemistry", slug: "biochemistry", icon: "🔬" },
  { name: "Pathology & Microbiology", slug: "pathology", icon: "🦠" },
  { name: "Pharmacology", slug: "pharmacology", icon: "💊" },
  { name: "Radiography", slug: "radiography", icon: "🔭" },
  { name: "Nursing", slug: "nursing", icon: "💉" },
  { name: "Medicine", slug: "medicine", icon: "🩺" },
  { name: "Dentistry", slug: "dentistry", icon: "🦷" },
  { name: "Pharmacy", slug: "pharmacy", icon: "💊" },
  { name: "Physiotherapy", slug: "physiotherapy", icon: "🏃" },
  { name: "MBBS & Exams", slug: "exams", icon: "📝" },
  { name: "Past Questions", slug: "past-questions", icon: "📋" },
];

export default function CreatePostPage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("student");

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile) setUserRole(profile.role);
    }
    getUser();
  }, [router, supabase]);

  async function handleSubmit() {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!selectedSlug) { setError("Please select a community."); return; }
    if (!userId) { router.push("/login"); return; }
    setLoading(true);
    setError("");

    try {
      // Get community id
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", selectedSlug)
        .single();
      if (!community) throw new Error("Community not found.");

      // Upload file if any
      let file_url = null;
      let file_type = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `posts/${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_type = ext;
      }

      // Create post
      const isAnnouncement =
        selectedSlug === "announcements" &&
        ["admin", "super_admin", "moderator"].includes(userRole);

      const { error: postError } = await supabase.from("posts").insert({
        title: title.trim(),
        content: content.trim() || null,
        community_id: community.id,
        author_id: userId,
        file_url,
        file_type,
        is_announcement: isAnnouncement,
      });
      if (postError) throw postError;
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  }

  // Helper boolean for valid state
  const isReadyToPost = title.trim() !== "" && selectedSlug !== "";

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 100px)", padding: "16px" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <X size={26} onClick={() => router.back()} style={{ cursor: "pointer", color: "var(--text)" }} />
            <h2 style={{ fontSize: "18px", margin: 0, fontFamily: "var(--font-display)", color: "var(--text)" }}>New post</h2>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={loading || !isReadyToPost}
            style={{ 
              background: isReadyToPost ? "var(--blue)" : "var(--surface-2)", 
              color: isReadyToPost ? "white" : "var(--text-muted)", 
              border: "none", 
              padding: "6px 16px", 
              borderRadius: "20px", 
              fontWeight: 700, 
              fontSize: "14px",
              cursor: isReadyToPost ? "pointer" : "not-allowed",
              transition: "all 0.2s"
            }}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{ background: "#FFF0F2", color: "#E8445A", padding: "10px", borderRadius: "8px", fontSize: "13px", marginBottom: "16px" }}>
            {error}
          </div>
        )}

        {/* Horizontal Community Selector (Facebook Style "Audience" Selector) */}
        <div style={{ marginBottom: "20px" }}>
          <p style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600, marginBottom: "8px", textTransform: "uppercase" }}>Posting to</p>
          <div style={{ 
            display: "flex", 
            gap: "8px", 
            overflowX: "auto", 
            paddingBottom: "8px",
            msOverflowStyle: "none", 
            scrollbarWidth: "none" 
          }}>
            {communities.map(({ name, slug, icon }) => {
              const isSelected = selectedSlug === slug;
              return (
                <button
                  key={slug}
                  onClick={() => setSelectedSlug(slug)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "99px",
                    border: `1px solid ${isSelected ? "var(--blue)" : "var(--border)"}`,
                    background: isSelected ? "rgba(45,135,200,0.1)" : "var(--surface)",
                    color: isSelected ? "var(--blue-dark)" : "var(--text)",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: isSelected ? 600 : 500,
                    transition: "all 0.1s"
                  }}
                >
                  <span>{icon}</span> {name}
                </button>
              )
            })}
          </div>
        </div>

        {/* Seamless Inputs */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: "8px" }}>
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
            style={{ 
              width: "100%", 
              background: "none", 
              border: "none", 
              color: "var(--text)", 
              fontSize: "24px", 
              fontFamily: "var(--font-display)",
              fontWeight: 700, 
              outline: "none" 
            }}
          />
          
          <textarea
            placeholder="What's on your mind? (Add details or context)"
            value={content}
            onChange={e => setContent(e.target.value)}
            style={{ 
              width: "100%", 
              flex: 1,
              background: "none", 
              border: "none", 
              color: "var(--text)", 
              fontSize: "16px", 
              fontFamily: "var(--font-body)",
              outline: "none", 
              resize: "none",
              minHeight: "150px"
            }}
          />
        </div>

        {/* Selected File Preview */}
        {file && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderRadius: "8px", background: "var(--surface)", border: "1px solid var(--border)", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", overflow: "hidden" }}>
              <Paperclip size={18} color="var(--blue)" />
              <span style={{ fontSize: "14px", color: "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
            </div>
            <X size={18} onClick={() => setFile(null)} style={{ cursor: "pointer", color: "var(--text-muted)" }} />
          </div>
        )}

        {/* Bottom Action Icons (Upload Triggers) */}
        <div style={{ display: "flex", gap: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <ImageIcon size={24} color="#45BD62" />
            <input
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
          </label>
          <label style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={24} color="#F5A623" />
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={e => setFile(e.target.files?.[0] || null)}
              style={{ display: "none" }}
            />
          </label>
        </div>

      </div>
    </AppShell>
  );
}
