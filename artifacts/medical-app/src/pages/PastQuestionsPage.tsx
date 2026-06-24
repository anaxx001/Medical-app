import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Star, Sparkles, Plus, Trash2, X, FileQuestion } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function PastQuestionsPage() {
  const supabase = createClient();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [course, setCourse] = useState("");
  const [text, setText] = useState("");
  const [verifiedAnswer, setVerifiedAnswer] = useState("");

  useEffect(() => {
    async function loadPastQuestions() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);

        const { data, error } = await supabase
          .from("past_questions")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setQuestions(data);
        }
      } catch (err) {
        console.error("Error loading past questions:", err);
      } finally {
        setLoading(false);
      }
    }
    loadPastQuestions();
  }, []);

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!course.trim() || !text.trim()) return;

    const newQuestion = {
      course,
      text,
      verified_answer: verifiedAnswer || "Under clinical consultant verification review.",
      created_by: user?.id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from("past_questions").insert(newQuestion).select();
    if (error) {
      alert("Failed to submit past question: " + error.message);
      return;
    }

    if (data && data[0]) {
      setQuestions(prev => [data[0], ...prev]);
    } else {
      setQuestions(prev => [{ id: Math.random().toString(), ...newQuestion }, ...prev]);
    }

    setCourse("");
    setText("");
    setVerifiedAnswer("");
    setShowForm(false);
    alert("Question shared for medical study reviews!");
  }

  async function handleDeleteQuestion(id: string) {
    if (!confirm("Remove this question?")) return;
    const { error } = await supabase.from("past_questions").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== id));
  }

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Returns to Core Console
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>OFFICIAL SYLLABUS FILES</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
              Medical Past Questions
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Submit Question
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddQuestion} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Submit Past Exam Question</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Course & Exam Year</label>
              <input 
                type="text" 
                value={course} 
                onChange={e => setCourse(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} 
                placeholder="e.g., Gross Anatomy Part I (MBBS 2024)" 
                required 
              />
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Question Text</label>
              <textarea 
                value={text} 
                onChange={e => setText(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: "80px" }} 
                placeholder="Describe the clinical dissection question or MCQ set..." 
                required 
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Verified Keys / Answer Pointer (Optional)</label>
              <textarea 
                value={verifiedAnswer} 
                onChange={e => setVerifiedAnswer(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: "60px" }} 
                placeholder="e.g. Femoral nerve arises from dorsal divisions of anterior rami of L2-L4..." 
              />
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", cursor: "pointer", fontSize: "13px" }}
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#0D9488", color: "white", fontWeight: 600, cursor: "pointer", fontSize: "13px" }}
              >
                Publish Question
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading syllabus past questions...</p>
        ) : questions.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {questions.map((q) => (
              <div 
                key={q.id}
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "20px", borderRadius: "14px", position: "relative" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                    {q.course}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>MDCN Certified</span>
                    {user && (
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        style={{ background: "none", border: "none", color: "#E8445A", cursor: "pointer" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>

                <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 800, lineHeight: 1.4 }}>{q.text}</h3>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", background: "var(--surface)", border: "1px solid var(--border)", padding: "10px 12px", borderRadius: "8px", borderLeft: "4px solid #0D9488" }}>
                  <strong>Key Checklist:</strong> {q.verified_answer || q.verifiedAnswer}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface-muted)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
            <FileQuestion size={40} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.7 }} />
            <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600 }}>No past questions submitted yet</p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-muted)" }}>Submit high-yield dissection or board viva questions from previous MBBS and professional assessments.</p>
            <button 
              onClick={() => setShowForm(true)}
              style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Add First Question
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
