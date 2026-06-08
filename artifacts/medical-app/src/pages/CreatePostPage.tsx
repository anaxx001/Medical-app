import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { X, Paperclip } from "lucide-react";

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
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);
    }
    getUser();
  }, []);

  async function handleSubmit() {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!selectedSlug) { setError("Please select a community."); return; }
    if (!userId) { navigate("/login"); return; }
    setLoading(true);
    setError("");

    try {
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", selectedSlug)
        .single();
      if (!community) throw new Error("Community not found.");

      let file_url = null;
      let file_type = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `posts/${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage.from("materials").upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("materials").getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_type = ext === "pdf" ? "pdf" : "file";
      }

      const { error: insertError } = await supabase.from("posts").insert({
        community_id: community.id,
        author_id: userId,
        title: title.trim(),
        content: content.trim() || null,
        file_url,
        file_type,
      });
      if (insertError) throw insertError;

      navigate(`/c/${selectedSlug}`);
    } catch (err: any) {
      setError(err.message || "Failed to post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>Create Post</h1>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", display: "flex", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow)" }}>
          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Community</label>
            <select
              value={selectedSlug}
              onChange={e => setSelectedSlug(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            >
              <option value="">Select a community...</option>
              {communities.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Title</label>
            <input
              type="text"
              placeholder="What's on your mind?"
              value={title}
              onChange={e => setTitle(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "18px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Content (optional)</label>
            <textarea
              placeholder="Add more details..."
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={5}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>Attachment (optional)</label>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: "1px dashed var(--border)", background: "var(--surface-2)", cursor: "pointer", fontFamily: "var(--font-body)", fontSize: "13.5px", color: "var(--text-muted)" }}>
              <Paperclip size={16} />
              {file ? file.name : "Upload PDF or image"}
              <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} style={{ display: "none" }} />
            </label>
            {file && (
              <button onClick={() => setFile(null)} style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "6px", background: "none", border: "none", color: "#E8445A", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-display)" }}>
                <X size={12} /> Remove
              </button>
            )}
          </div>

          {error && <p style={{ fontSize: "13px", color: "#E8445A", marginBottom: "14px", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(45,135,200,0.3)", opacity: loading ? 0.8 : 1 }}
          >
            {loading ? "Posting..." : "Post →"}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
