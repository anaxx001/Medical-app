import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase";
import { useParams, Link } from "wouter";
import { Settings, MapPin, BookOpen } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  profession?: string;
  bio?: string;
  institution?: string;
  role: string;
  created_at: string;
}

const roleColors: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
  admin: { bg: "#FFF8EC", color: "#F5A623" },
  moderator: { bg: "#EBF5FF", color: "#2D87C8" },
  exco: { bg: "#F5F0FF", color: "#9B6DFF" },
  student: { bg: "#EDFFF5", color: "#3DBE7A" },
};

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  exco: "Exco",
  student: "Student",
};

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<"posts" | "about">("posts");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);

      const { data: postsData } = await supabase
        .from("posts")
        .select(`
          id, title, content, file_url, file_type,
          is_announcement, is_pinned, upvotes, downvotes, created_at,
          author:profiles!author_id(id, username, full_name, avatar_url, profession),
          community:communities!community_id(id, name, slug, icon),
          comment_count:comments(count)
        `)
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(20);

      setPosts(
        // @ts-ignore
        (postsData || []).map((p: any) => ({
          ...p,
          comment_count: p.comment_count?.[0]?.count || 0,
          user_vote: null,
        }))
      );
      setLoading(false);
    }
    fetchProfile();
  }, [username]);

  function getInitials(name: string) {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "M";
  }

  if (loading) return <AppShell><div style={{ maxWidth: "720px", margin: "0 auto" }}><p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Loading profile...</p></div></AppShell>;
  if (!profile) return <AppShell><div style={{ maxWidth: "720px", margin: "0 auto" }}><p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>User not found.</p></div></AppShell>;

  const isOwn = currentUserId === profile.id;

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {/* Profile Header */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", color: "white", fontFamily: "var(--font-display)", fontWeight: 800, flexShrink: 0, overflow: "hidden" }}>
              {profile.avatar_url ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" /> : getInitials(profile.full_name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)" }}>{profile.full_name}</h1>
                {profile.role && roleColors[profile.role] && (
                  <span style={{ padding: "2px 8px", borderRadius: "99px", background: roleColors[profile.role].bg, color: roleColors[profile.role].color, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px" }}>
                    {roleLabels[profile.role] || profile.role}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>u/{profile.username}</p>
              {profile.profession && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "4px" }}>
                  <BookOpen size={13} color="var(--blue)" />
                  <span style={{ fontSize: "12.5px", color: "var(--blue)", fontFamily: "var(--font-body)" }}>{profile.profession}</span>
                </div>
              )}
              {profile.institution && (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={13} color="var(--text-muted)" />
                  <span style={{ fontSize: "12.5px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{profile.institution}</span>
                </div>
              )}
            </div>
            {isOwn && (
              <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "99px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px" }}>
                <Settings size={13} /> Edit
              </Link>
            )}
          </div>

          {profile.bio && <p style={{ fontSize: "13.5px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: "14px" }}>{profile.bio}</p>}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
          {(["posts", "about"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: "99px", border: "none", background: tab === t ? "var(--gradient)" : "var(--surface)", color: tab === t ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer", textTransform: "capitalize" }}>
              {t === "posts" ? `Posts (${posts.length})` : "About"}
            </button>
          ))}
        </div>

        {tab === "posts" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>No posts yet.</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )}
          </div>
        )}

        {tab === "about" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px" }}>
            {[
              { label: "Full Name", value: profile.full_name },
              { label: "Username", value: `u/${profile.username}` },
              { label: "Profession", value: profile.profession || "Not specified" },
              { label: "Institution", value: profile.institution || "Not specified" },
              { label: "Joined", value: new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", gap: "12px", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text-muted)", minWidth: "110px" }}>{label}</span>
                <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-body)" }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
