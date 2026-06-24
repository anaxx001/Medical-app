import { useState } from "react";
import { useLocation, Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";

export default function CreateNewsPage() {
  const supabase = createClient();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [simplified, setSimplified] = useState("");
  const [category, setCategory] = useState("Nigeria pediatric policy");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError("Please fill in high-priority title and content fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: insertError } = await supabase.from("news_posts").insert({
        title,
        content,
        excerpt: content.substring(0, 160) + "...",
        body: content,
        type: "news",
        simplified_content: simplified || undefined,
        category,
        status: "published",
        university_tags: ["global"],
        created_by: user?.id || "anonymous",
        created_at: new Date().toISOString()
      });

      if (insertError) throw insertError;
      setLocation("/news");
    } catch (err: any) {
      setError(err.message || "Failed to submit official news bulletin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/news" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to News
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, margin: "0 0 6px" }}>Publish Official Student News</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Releasing peer guidelines, study links, or West-African clinical developments.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Bulletin Title</label>
            <input 
              type="text" 
              placeholder="e.g. RTS,S Malaria Immunization Rollouts across Oyo State"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Select News Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            >
              <option value="Nigeria pediatric policy">Nigeria Pediatric Policy</option>
              <option value="Global Health Breakthroughs">Global Health Breakthroughs</option>
              <option value="Anatomy syllabus revisions">Anatomy Syllabus Revisions</option>
              <option value="Mental Wellness peer bulletins">Mental Wellness Peer Bulletins</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Standard Article Body</label>
            <textarea 
              rows={6}
              placeholder="Releasing official health policy details, guidelines or statistics..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Docu simplified version (Explain Like I'm a 2nd Year)</label>
            <textarea 
              rows={4}
              placeholder="Provide a simplified summary, breaking down the jargon into key clinical exam takeaways..."
              value={simplified}
              onChange={(e) => setSimplified(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box" }}
            />
          </div>

          {error && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#fef2f2", border: "1px solid #fee2e2", padding: "10px 12px", borderRadius: "10px" }}>
              <AlertCircle size={16} color="#ef4444" />
              <span style={{ fontSize: "12.5px", color: "#b91c1c", fontWeight: 500 }}>{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 750, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Syncing bullet..." : "Publish News Bulletin ✨"}
          </button>
        </form>
      </div>

    </div>
  );
}
