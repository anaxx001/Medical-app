import { useState } from "react";
import { useLocation, Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Send } from "lucide-react";

export default function CreatePostPage() {
  const supabase = createClient();
  const [, setLocation] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Pharmacology");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    setLoading(true);

    try {
      await supabase.from("posts").insert({
        title,
        content,
        category,
        is_anonymous: isAnonymous,
        created_at: new Date().toISOString()
      });

      setLocation("/");
    } catch {
      setLocation("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Feed
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Post to Community</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Start active-recall queries, upload textbook notes guidelines or ask diagnostic questions.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Post Title</label>
            <input 
              type="text" 
              placeholder="e.g. Clearance and half-life rate parameter issues..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Select Topic Category</label>
            <select 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
            >
              <option value="Pharmacology">Pharmacology</option>
              <option value="Gross Anatomy">Gross Anatomy</option>
              <option value="Physiology">Physiology</option>
              <option value="Clinical Pathology">Clinical Pathology</option>
              <option value="General Support">General Support</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Core Explanation</label>
            <textarea 
              rows={5}
              placeholder="Detail your question or study topic..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-muted)", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input 
              type="checkbox"
              id="anonymous-checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="anonymous-checkbox" style={{ fontSize: "13px", cursor: "pointer", fontWeight: 500 }}>
              Post Anonymously (Verified MDCN Mask)
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading || !title || !content}
            style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 750, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Posting..." : "Publish Feed Thread 📣"}
          </button>
        </form>
      </div>

    </div>
  );
}
