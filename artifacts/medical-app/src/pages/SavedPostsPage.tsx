import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark, Trash2, BookOpen, AlertCircle } from "lucide-react";

export default function SavedPostsPage() {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSaved() {
      const { data } = await supabase
        .from("saved_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setSaved(data);
      } else {
        // Fallback mock saved cards
        setSaved([
          {
            id: "s-1",
            title: "Volume of Distribution (Vd) calculations summary",
            content: "Equation: t1/2 = (0.693 * Vd) / Cl. Clearances decrease with age or renal impairment.",
            category: "Flashcards",
            created_at: new Date().toISOString()
          },
          {
            id: "s-2",
            title: "New RTS,S Malaria pediatric deployments in Southwest Nigeria",
            content: "Advisory boards authorize campaign targeting high transmission malaria vectors. Vaccine has high pediatric trial feedback.",
            category: "News Study",
            created_at: new Date().toISOString()
          }
        ]);
      }
      setLoading(false);
    }
    loadSaved();
  }, []);

  const handleRemove = async (id: string) => {
    setSaved((prev) => prev.filter((item) => item.id !== id));
    await supabase.from("saved_posts").delete().eq("id", id).catch(() => {});
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Hub
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>PERSONAL STUDY DECK</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0", letterSpacing: "-0.5px" }}>
              My Saved Items
            </h1>
          </div>
          <Bookmark size={24} color="#0D9488" />
        </div>

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Synchronizing bookmarks...</p>
        ) : saved.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <span style={{ fontSize: "32px" }}>📂</span>
            <h3 style={{ margin: "12px 0 4px", fontSize: "16px", fontWeight: 700 }}>Your active review study deck is empty</h3>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Bookmark important research bulletins or AI recall questions to view them here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {saved.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: "var(--surface-muted)",
                  border: "1px solid var(--border)",
                  borderRadius: "14px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px"
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      Saved on {new Date(item.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  <h3 style={{ margin: "0 0 6px", fontSize: "15px", fontWeight: 750 }}>{item.title}</h3>
                  <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.4 }}>{item.content}</p>
                </div>

                <button 
                  onClick={() => handleRemove(item.id)}
                  style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
}
