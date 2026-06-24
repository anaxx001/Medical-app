import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, FileText, Plus, Search, Trash2, X, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function NotesPage() {
  const supabase = createClient();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Note creation form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("General");

  useEffect(() => {
    async function loadNotes() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          const { data, error } = await supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });
          if (!error && data) {
            setNotes(data);
          }
        }
      } catch (err) {
        console.error("Error loading notes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadNotes();
  }, []);

  async function handleCreateNote(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      alert("Please log in to save notes.");
      return;
    }
    if (!title.trim() || !content.trim()) return;

    const newNote = {
      title,
      content,
      category,
      user_id: userId,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from("notes").insert(newNote).select();
    if (error) {
      alert("Failed to save note: " + error.message);
      return;
    }

    if (data && data[0]) {
      setNotes(prev => [data[0], ...prev]);
    } else {
      // local fallback if select doesn't return
      setNotes(prev => [{ id: Math.random().toString(), ...newNote }, ...prev]);
    }

    setTitle("");
    setContent("");
    setCategory("General");
    setShowForm(false);
  }

  async function handleDeleteNote(id: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", id);
    if (error) {
      alert("Failed to delete note: " + error.message);
      return;
    }
    setNotes(prev => prev.filter(n => n.id !== id));
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
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>STUDENT NOTEBOOKS</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
              My Study Notes
            </h1>
          </div>
          
          <button 
            onClick={() => setShowForm(true)}
            style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Create Note
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreateNote} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Add New Study Note</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Title</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} 
                placeholder="e.g., Autonomic Nervous System drug targets" 
                required 
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Category</label>
                <select 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                >
                  <option value="General">General Study Info</option>
                  <option value="Pharmacology">Pharmacology</option>
                  <option value="Anatomy">Anatomy</option>
                  <option value="Physiology">Physiology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Surgery">Surgery</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Note Content</label>
              <textarea 
                value={content} 
                onChange={e => setContent(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", minHeight: "100px", fontFamily: "var(--font-body)" }} 
                placeholder="Write down high-yield mnemonics, pathways, clinical points..." 
                required 
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
                Save Member Note
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading study notebooks...</p>
        ) : notes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {notes.map((note) => (
              <div 
                key={note.id}
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "20px", borderRadius: "14px", position: "relative" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ background: "rgba(13,148,136,0.08)", color: "#0D9488", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                    {note.category}
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      onClick={() => handleDeleteNote(note.id)}
                      style={{ background: "none", border: "none", color: "#E8445A", cursor: "pointer", padding: "4px" }}
                      title="Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ margin: "0 0 8px", fontSize: "15.5px", fontWeight: 800 }}>{note.title}</h3>
                <p style={{ margin: 0, fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.4 }}>{note.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface-muted)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
            <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.7 }} />
            <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600 }}>No study notes yet</p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-muted)" }}>Write down high-yield mnemonics to boost your medical exam prep.</p>
            <button 
              onClick={() => setShowForm(true)}
              style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Add First Note
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
