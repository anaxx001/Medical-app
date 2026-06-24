import { useState, useEffect } from "react";
import { Link } from "wouter";
import { ArrowLeft, BookOpen, Download, Search, Plus, Trash2, X, FileText } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function MaterialsPage() {
  const supabase = createClient();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Form states for sharing study material
  const [showForm, setShowForm] = useState(false);
  const [filename, setFilename] = useState("");
  const [course, setCourse] = useState("Physiology");
  const [size, setSize] = useState("2.5 MB");

  useEffect(() => {
    async function loadMaterials() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser);
        
        const { data, error } = await supabase
          .from("study_materials")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (!error && data) {
          setMaterials(data);
        }
      } catch (e) {
        console.error("Error loading study materials:", e);
      } finally {
        setLoading(false);
      }
    }
    loadMaterials();
  }, []);

  async function handleShareMaterial(e: React.FormEvent) {
    e.preventDefault();
    if (!filename.trim()) return;

    const newMaterial = {
      filename,
      course,
      size,
      created_by: user?.id || null,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from("study_materials").insert(newMaterial).select();
    if (error) {
      alert("Failed to share study material: " + error.message);
      return;
    }

    if (data && data[0]) {
      setMaterials(prev => [data[0], ...prev]);
    } else {
      setMaterials(prev => [{ id: Math.random().toString(), ...newMaterial }, ...prev]);
    }

    setFilename("");
    setShowForm(false);
    alert("Study material successfully shared in the student cabinet!");
  }

  async function handleDeleteMaterial(id: string) {
    if (!confirm("Remove this study material?")) return;
    const { error } = await supabase.from("study_materials").delete().eq("id", id);
    if (error) {
      alert("Failed to delete: " + error.message);
      return;
    }
    setMaterials(prev => prev.filter(m => m.id !== id));
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
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>STUDY CABINET</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
              Lecture Slides & Textbooks
            </h1>
          </div>
          <button 
            onClick={() => setShowForm(true)}
            style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Upload Material
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleShareMaterial} style={{ background: "var(--background)", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Share Verified Study Material</h3>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}><X size={18} /></button>
            </div>

            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Document Filename / Study Guide Name</label>
              <input 
                type="text" 
                value={filename} 
                onChange={e => setFilename(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} 
                placeholder="e.g., Guyton_and_Hall_Physiology_Chapter_5.pdf" 
                required 
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Course Category</label>
                <select 
                  value={course} 
                  onChange={e => setCourse(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                >
                  <option value="Physiology">Physiology</option>
                  <option value="Gross Anatomy">Gross Anatomy</option>
                  <option value="Pharmacology">Pharmacology</option>
                  <option value="Pathology">Pathology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Clinical Skills">Clinical Skills</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Simulated File Size</label>
                <input 
                  type="text" 
                  value={size} 
                  onChange={e => setSize(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }} 
                  placeholder="e.g., 3.8 MB" 
                  required 
                />
              </div>
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
                Publish Document
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading study cabinet files...</p>
        ) : materials.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {materials.map((mat) => (
              <div 
                key={mat.id}
                style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "16px 20px", borderRadius: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}
              >
                <div>
                  <strong style={{ display: "block", fontSize: "13.5px" }}>{mat.filename}</strong>
                  <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {mat.course} • {mat.size} • Verified Standard
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button 
                    onClick={() => alert(`Downloading "${mat.filename}" (${mat.size}) safely from academic repository...`)}
                    style={{ background: "none", border: "1px solid var(--border)", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", color: "#0D9488" }}
                    title="Download Material"
                  >
                    <Download size={14} />
                  </button>
                  {user && (
                    <button 
                      onClick={() => handleDeleteMaterial(mat.id)}
                      style={{ background: "none", border: "1px solid var(--border)", padding: "8px", borderRadius: "8px", cursor: "pointer", display: "flex", color: "#E8445A" }}
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface-muted)", borderRadius: "14px", border: "1px dashed var(--border)" }}>
            <FileText size={40} style={{ color: "var(--text-muted)", marginBottom: "12px", opacity: 0.7 }} />
            <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 600 }}>No study materials uploaded yet</p>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-muted)" }}>Be the first to share verified PDFs, textbook summaries, or notes with other medical students.</p>
            <button 
              onClick={() => setShowForm(true)}
              style={{ background: "#0D9488", color: "white", padding: "8px 16px", borderRadius: "8px", border: "none", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
            >
              Upload Study Material
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
