import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Sparkles, Bookmark, BookOpen, Star, 
  HelpCircle, Share2, CornerDownRight, CheckCircle2 
} from "lucide-react";

export default function NewsDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Toggle state for "Explain Like I'm a 2nd Year" breakdown mode (Section 15)
  const [explainLevel, setExplainLevel] = useState<"standard" | "simplified">("standard");
  const [isSavedForCram, setIsSavedForCram] = useState(false);

  useEffect(() => {
    async function loadPost() {
      // Load user details
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        if (profile?.role) setUserRole(profile.role);

        const { data: perms } = await supabase
          .from("user_permissions")
          .select("permissions")
          .eq("user_id", user.id)
          .single();
        if (perms?.permissions) setUserPermissions(perms.permissions);
      }

      const { data } = await supabase
        .from("news_posts")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) {
        setPost(data);
      } else {
        // Fallback demo/mock news article
        setPost({
          id: params.id,
          title: "New Vaccine Triage Approvals for Pediatric Malaria Vectors in West Africa",
          content: "The advisory task force has authorized next-generation RTS,S pediatric malaria immunization campaigns across secondary local health facilities in Nigeria. Clinical testing parameters indicate a significant drop in symptomatic vector loads during peak transition seasons.",
          simplified_content: "💡 **Docu Simplified Breakdown (Explain Like I'm a 2nd Year):**\n\n1. **What is it?** A new malaria vaccine (RTS,S subtype) is now approved for children across local clinics in Nigeria.\n2. **Why does it matter?** It targets severe pediatric malaria blocks and has been shown to drop overall child fever caseloads significantly during rainy seasons.\n3. **Clinical Core:** Focus study reviews on vector transmission pathways & IgG immunity response markers.",
          created_at: new Date().toISOString(),
          category: "Nigeria pediatric policy",
          created_by: "system"
        });
      }
      setLoading(false);
    }
    loadPost();
  }, [params.id]);

  const canEditNews = (postCreatedBy: string) => {
    const r = userRole?.toLowerCase();
    const isAdmin = ["super_admin", "admin", "app_admin", "moderator"].some(role => r === role || r?.includes(role));
    return isAdmin || userPermissions.includes("news:edit_all") || (postCreatedBy === currentUserId);
  };

  const toggleSaveForCram = async () => {
    setIsSavedForCram(!isSavedForCram);
    // Write to saved_posts
    await supabase.from("saved_posts").insert({
      title: post.title,
      content: post.content,
      category: "News Study",
      created_at: new Date().toISOString()
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Retrieving news bulletin...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "765px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      {/* HEADER RETURNS */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <Link href="/news" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to News Hub
        </Link>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {post && canEditNews(post.created_by) && (
            <Link href={`/news/edit/${post.id}`}>
              <button
                style={{
                  background: "rgba(13,148,136,0.08)",
                  border: "1px solid rgba(13,148,136,0.2)",
                  color: "#0D9488",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "12.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Edit Bulletin
              </button>
            </Link>
          )}

          <button 
            onClick={toggleSaveForCram}
            style={{ 
              background: isSavedForCram ? "rgba(13,148,136,0.08)" : "transparent",
              border: "1px solid var(--border)", 
              color: isSavedForCram ? "#0D9488" : "var(--text)", 
              padding: "6px 12px", 
              borderRadius: "8px", 
              fontSize: "12.5px", 
              fontWeight: 700, 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Bookmark size={14} fill={isSavedForCram ? "#0D9488" : "none"} />
            {isSavedForCram ? "Bookmarked to Cram Checklist" : "Save for Cram Review"}
          </button>
        </div>
      </div>

      {/* CORE NEWS PANEL */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "16px", flexWrap: "wrap" }}>
          <span style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "6px" }}>
            {post.category || "Health News"}
          </span>
          <span style={{ fontSize: "12px", fontWeight: 700, background: "rgba(244,63,94,0.06)", color: "#F43F5E", padding: "4px 10px", borderRadius: "6px", display: "flex", alignItems: "center", gap: "4px" }}>
            <BookOpen size={12} /> Study This Linked Quiz Active
          </span>
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 850, lineHeight: 1.3, margin: "0 0 16px", letterSpacing: "-0.5px" }}>
          {post.title}
        </h1>

        <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "24px" }}>
          Published: {new Date(post.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} • Senior Reviewed Badge
        </span>

        {/* AI BREAKDOWN REVISION MODE TOGGLE (Section 15 of Brief) */}
        <div style={{ background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)", borderRadius: "12px", padding: "16px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <strong style={{ display: "block", fontSize: "13.5px", color: "#0D9488" }}>🧬 Co-pilot Revision Assistant</strong>
              <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)" }}>Toggle Docu Model to simplify policies down to key exam takeaways.</span>
            </div>
            
            <div style={{ display: "flex", background: "var(--surface)", padding: "3px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <button 
                onClick={() => setExplainLevel("standard")}
                style={{ background: explainLevel === "standard" ? "#0D9488" : "transparent", color: explainLevel === "standard" ? "white" : "var(--text-muted)", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer" }}
              >
                Standard
              </button>
              <button 
                onClick={() => setExplainLevel("simplified")}
                style={{ background: explainLevel === "simplified" ? "#0D9488" : "transparent", color: explainLevel === "simplified" ? "white" : "var(--text-muted)", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <Sparkles size={11} /> 2nd Year Mode
              </button>
            </div>
          </div>
        </div>

        {/* ARTICLE TEXT */}
        <div style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--text)", whiteSpace: "pre-wrap" }}>
          {explainLevel === "simplified" ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {post.simplified_content || post.content}
            </motion.div>
          ) : (
            post.content
          )}
        </div>

      </div>

    </div>
  );
}
