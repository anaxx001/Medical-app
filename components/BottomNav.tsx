"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, Plus, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const COMMUNITIES = [
  { slug: "announcements",   name: "Announcements",       icon: "📢" },
  { slug: "general",         name: "General Discussion",  icon: "💬" },
  { slug: "study-materials", name: "Study Materials",     icon: "📁" },
  { slug: "anatomy",         name: "Anatomy",             icon: "🧠" },
  { slug: "physiology",      name: "Physiology",          icon: "⚗️" },
  { slug: "biochemistry",    name: "Biochemistry",        icon: "🔬" },
  { slug: "pathology",       name: "Pathology & Micro",   icon: "🦠" },
  { slug: "pharmacology",    name: "Pharmacology",        icon: "💊" },
  { slug: "radiography",     name: "Radiography",         icon: "🔭" },
  { slug: "nursing",         name: "Nursing",             icon: "💉" },
  { slug: "medicine",        name: "Medicine",            icon: "🩺" },
  { slug: "dentistry",       name: "Dentistry",           icon: "🦷" },
  { slug: "pharmacy",        name: "Pharmacy",            icon: "💊" },
  { slug: "physiotherapy",   name: "Physiotherapy",       icon: "🏃" },
  { slug: "exams",           name: "MBBS / Professional", icon: "📝" },
  { slug: "past-questions",  name: "Past Questions Bank", icon: "📋" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
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
  }, [supabase]);

  // FIX: Updated isHome to watch the '/feed' path
  const isHome        = pathname === "/" || pathname === "/feed" || pathname === "/dashboard";
  const isCommunities = pathname.startsWith("/c/");
  const isMessages    = pathname === "/messages";
  const isProfile     = username ? pathname === `/profile/${username}` : false;

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
      router.push(`/c/${createCommunity}`);
    } catch (err: any) {
      setPostError(err.message || "Failed to post.");
    } finally {
      setPosting(false);
    }
  }

  return (
    <>
           {/* --- MODAL OVERLAYS --- */}
      {showCreate && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 64, background: "var(--surface)", zIndex: 100, padding: "20px" }}>
          <h2 style={{ fontFamily: "var(--font-display)" }}>Create Post</h2>
          <select onChange={(e) => setCreateCommunity(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px" }}>
            <option value="">Select a Community</option>
            {COMMUNITIES.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <input placeholder="Title" value={createTitle} onChange={e => setCreateTitle(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px" }} />
          <textarea placeholder="Body" value={createBody} onChange={e => setCreateBody(e.target.value)} style={{ width: "100%", height: "100px", padding: "10px" }} />
          <button onClick={handlePost} disabled={posting} style={{ width: "100%", padding: "12px", background: "var(--blue)", color: "white", border: "none", borderRadius: "8px" }}>
            {posting ? "Posting..." : "Submit"}
          </button>
          <button onClick={() => setShowCreate(false)} style={{ marginTop: "10px", width: "100%", background: "none", border: "none" }}>Cancel</button>
        </div>
      )

      {showCommunities && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 64, background: "var(--surface)", zIndex: 100, padding: "20px", overflowY: "auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)" }}>Communities</h2>
          {COMMUNITIES.map(c => (
            <Link key={c.slug} href={`/c/${c.slug}`} onClick={() => setShowCommunities(false)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "15px", textDecoration: "none", color: "var(--text)" }}>
              <span>{c.icon}</span> {c.name}
            </Link>
          ))}
          <button onClick={() => setShowCommunities(false)} style={{ marginTop: "20px", width: "100%", padding: "10px" }}>Close</button>
        </div>
      )}>

        {/* FIX: Home / Feed Link */}
        <Link href="/feed" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isHome ? "var(--blue)" : "var(--text-muted)" }}>
          <Home size={22} strokeWidth={isHome ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isHome ? 700 : 400 }}>Feed</span>
        </Link>

        {/* Communities */}
        <button onClick={() => { setShowCommunities(true); setShowCreate(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", background: "none", border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: "10px", color: isCommunities ? "var(--blue)" : "var(--text-muted)" }}>
          <Users size={22} strokeWidth={isCommunities ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isCommunities ? 700 : 400 }}>Groups</span>
        </button>

        {/* Create */}
        <button onClick={() => { setShowCreate(true); setShowCommunities(false); }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--gradient)", border: "none", cursor: "pointer", width: "50px", height: "50px", borderRadius: "50%", boxShadow: "0 4px 16px rgba(45,135,200,0.4)", marginBottom: "8px" }}>
          <Plus size={26} color="white" strokeWidth={2.5} />
        </button>

        {/* Messages */}
        <Link href="/messages" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isMessages ? "var(--blue)" : "var(--text-muted)" }}>
          <MessageCircle size={22} strokeWidth={isMessages ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isMessages ? 700 : 400 }}>Messages</span>
        </Link>

        {/* Profile */}
        <Link href={username ? `/profile/${username}` : "#"} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px", textDecoration: "none", padding: "6px 14px", borderRadius: "10px", color: isProfile ? "var(--blue)" : "var(--text-muted)" }}>
          <User size={22} strokeWidth={isProfile ? 2.5 : 1.8} />
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", fontWeight: isProfile ? 700 : 400 }}>Profile</span>
        </Link>

      </nav>

      <div style={{ height: "64px" }} />
    </>
  );
}
