import { Link, useLocation } from "wouter";
import { Home, Users, Plus, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

const COMMUNITIES = [
  { slug: "announcements", name: "Announcements", icon: "📢" },
  { slug: "general", name: "General Discussion", icon: "💬" },
  { slug: "study-materials", name: "Study Materials", icon: "📁" },
  { slug: "anatomy", name: "Anatomy", icon: "🧠" },
  { slug: "physiology", name: "Physiology", icon: "⚗️" },
  { slug: "biochemistry", name: "Biochemistry", icon: "🔬" },
  { slug: "pathology", name: "Pathology & Micro", icon: "🦠" },
  { slug: "pharmacology", name: "Pharmacology", icon: "💊" },
  { slug: "radiography", name: "Radiography", icon: "🔭" },
  { slug: "nursing", name: "Nursing", icon: "💉" },
  { slug: "medicine", name: "Medicine", icon: "🩺" },
  { slug: "dentistry", name: "Dentistry", icon: "🦷" },
  { slug: "pharmacy", name: "Pharmacy", icon: "💊" },
  { slug: "physiotherapy", name: "Physiotherapy", icon: "🏃" },
  { slug: "exams", name: "MBBS / Professional", icon: "📝" },
  { slug: "past-questions", name: "Past Questions Bank", icon: "📋" },
];

export default function BottomNav() {
  const [location, navigate] = useLocation();
  const supabase = createClient();

  const [username, setUsername] = useState<string | null>(null);
  const [showCommunities, setShowCommunities] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createBody, setCreateBody] = useState("");
  const [createTitle, setCreateTitle] = useState("");
  const [createCommunity, setCreateCommunity] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");

  useEffect(() => {
    async function getLoggedUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          if (data?.username) setUsername(data.username);
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
      }
    }
    getLoggedUser();
  }, []);

  const isHome = location === "/" || location === "/feed" || location === "/dashboard";
  const isCommunities = location.startsWith("/c/");
  const isMessages = location === "/messages";
  const isProfile = username ? location === `/profile/${username}` : false;

  async function handlePost() {
    if (!createCommunity) { setPostError("Select a community."); return; }
    if (!createBody.trim() && !createTitle.trim()) { setPostError("Write something first."); return; }
    setPosting(true);
    setPostError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in.");
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", createCommunity)
        .single();
      if (!community) throw new Error("Community not found.");
      const { error } = await supabase.from("posts").insert({
        community_id: community.id,
        author_id: user.id,
        title: createTitle.trim() || null,
        body: createBody.trim() || null,
        type: "text",
      });
      if (error) throw error;
      setShowCreate(false);
      setCreateTitle("");
      setCreateBody("");
      setCreateCommunity("");
      navigate(`/c/${createCommunity}`);
    } catch (err: any) {
      setPostError(err.message || "Failed to post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
      {showCreate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 64, background: "var(--surface)", zIndex: 100, padding: "20px", overflowY: "auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "16px" }}>Create Post</h2>
          <select onChange={(e) => setCreateCommunity(e.target.value)} value={createCommunity} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", boxSizing: "border-box" }}>
            <option value="">Select a Community</option>
            {COMMUNITIES.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
          </select>
          <input placeholder="Title" value={createTitle} onChange={e => setCreateTitle(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", boxSizing: "border-box" }} />
          <textarea placeholder="Body" value={createBody} onChange={e => setCreateBody(e.target.value)} style={{ width: "100%", height: "100px", padding: "10px", marginBottom: "10px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", boxSizing: "border-box", resize: "vertical" }} />
          {postError && <p style={{ color: "#E8445A", fontSize: "13px", marginBottom: "10px" }}>{postError}</p>}
          <button onClick={handlePost} disabled={posting} style={{ width: "100%", padding: "12px", background: "var(--gradient)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-display)", fontWeight: 700, cursor: posting ? "not-allowed" : "pointer", marginBottom: "10px" }}>
            {posting ? "Posting..." : "Submit"}
          </button>
          <button onClick={() => setShowCreate(false)} style={{ width: "100%", background: "none", border: "1px solid var(--border)", padding: "10px", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-display)", cursor: "pointer" }}>Cancel</button>
        </div>
      )}

      {showCommunities && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 64, background: "var(--surface)", zIndex: 100, padding: "20px", overflowY: "auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", marginBottom: "16px" }}>Communities</h2>
          {COMMUNITIES.map(c => (
            <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setShowCommunities(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px", textDecoration: "none", color: "var(--text)", borderBottom: "1px solid var(--border)" }}>
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
          <button onClick={() => setShowCommunities(false)} style={{ marginTop: "20px", width: "100%", padding: "10px", background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontFamily: "var(--font-display)", cursor: "pointer" }}>Close</button>
        </div>
      )}

      <nav style={{ height: "64px", background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-around", padding: "0 8px", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)" }}>
        <Link href="/" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isHome ? "var(--blue)" : "var(--text-muted)" }}>
          <Home size={22} strokeWidth={isHome ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isHome ? 700 : 400 }}>Feed</span>
        </Link>

        <button onClick={() => { setShowCommunities(true); setShowCreate(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "10px", color: isCommunities ? "var(--blue)" : "var(--text-muted)" }}>
          <Users size={22} strokeWidth={isCommunities ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isCommunities ? 700 : 400 }}>Groups</span>
        </button>

        <button onClick={() => { setShowCreate(true); setShowCommunities(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--gradient)", border: "none", cursor: "pointer", width: "50px", height: "50px", borderRadius: "50%", boxShadow: "0 4px 16px rgba(45,135,200,0.4)", marginBottom: "8px" }}>
          <Plus size={26} color="white" strokeWidth={2.5} />
        </button>

        <Link href="/messages" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isMessages ? "var(--blue)" : "var(--text-muted)" }}>
          <MessageCircle size={22} strokeWidth={isMessages ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isMessages ? 700 : 400 }}>Messages</span>
        </Link>

        <Link href={username ? `/profile/${username}` : "/login"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isProfile ? "var(--blue)" : "var(--text-muted)" }}>
          <User size={22} strokeWidth={isProfile ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isProfile ? 700 : 400 }}>Profile</span>
        </Link>
      </nav>

      <div style={{ height: "64px" }} />
    </>
  );
}
