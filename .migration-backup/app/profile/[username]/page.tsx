"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Settings, MapPin, BookOpen, MessageSquare, Heart } from "lucide-react";
import Link from "next/link";

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

// Added interfaces for new history tabs
interface CommentHistory {
  id: string;
  content: string;
  created_at: string;
  post: { id: string; title: string };
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
  const { username } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  
  // Tab states
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<Post[]>([]);
  const [postCount, setPostCount] = useState(0);
  const [comments, setComments] = useState<CommentHistory[]>([]);
  const [activity, setActivity] = useState<Post[]>([]); // Upvoted posts

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setCurrentUserId(session.user.id);
      fetchProfileData();
    }
    if (username) init();
  }, [username, activeTab]); // Re-run when tab changes to fetch specific data

  async function fetchProfileData() {
    setLoading(true);
    try {
      // 1. Always fetch the profile first
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();
      
      if (!profileData) { router.push("/"); return; }
      setProfile(profileData);

      // 2. Fetch data based on the active tab
      if (activeTab === "posts") {
        const { data: postsData } = await supabase
          .from("posts")
          .select(`
            id, title, content, file_url, file_type,
            is_announcement, is_pinned, upvotes, downvotes,
            created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession),
            community:communities!community_id(id, name, slug, icon),
            comment_count:comments(count)
          `)
          .eq("author_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(20);
          
        setPostCount(postsData?.length || 0);
        setPosts(
          (postsData || []).map((p: any) => ({
            ...p,
            comment_count: Array.isArray(p.comment_count) 
              ? (p.comment_count[0]?.count || 0) 
              : (p.comment_count?.count || 0),
            user_vote: null,
          }))
        );
      } else if (activeTab === "comments") {
        const { data: commentsData } = await supabase
          .from("comments")
          .select(`id, content, created_at, post:posts(id, title)`)
          .eq("author_id", profileData.id)
          .order("created_at", { ascending: false })
          .limit(20);
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        setComments((commentsData as any) || []);
      } else if (activeTab === "activity") {
        // Fetch posts this user has upvoted
        const { data: votesData } = await supabase
          .from("post_votes")
          .select(`
            post_id,
            post:posts(
              id, title, content, file_url, file_type,
              is_announcement, is_pinned, upvotes, downvotes, created_at,
              author:profiles!author_id(id, username, full_name, avatar_url, profession),
              community:communities!community_id(id, name, slug, icon),
              comment_count:comments(count)
            )
          `)
          .eq("user_id", profileData.id)
          .eq("vote_type", "up")
          .limit(20);

        const upvotedPosts = (votesData || [])
          .map((v: any) => v.post)
          .filter(Boolean)
          .map((p: any) => ({
            ...p,
            comment_count: Array.isArray(p.comment_count) ? (p.comment_count[0]?.count || 0) : (p.comment_count?.count || 0),
            user_vote: "up", // We know they upvoted it
          }));
        setActivity(upvotedPosts);
      }
    } catch (err) {
      console.error("Error loading user profile content:", err);
    } finally {
      setLoading(false);
    }
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  function joinedDate(date: string) {
    return new Date(date).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
  }

  const isOwner = currentUserId === profile?.id;
  const roleStyle = roleColors[profile?.role || "student"];

  const tabs = [
    { id: "posts", label: "Posts", icon: <BookOpen size={16} /> },
    { id: "comments", label: "Comments", icon: <MessageSquare size={16} /> },
    { id: "activity", label: "Activity", icon: <Heart size={16} /> },
  ];

  if (loading && !profile) return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", height: "200px", border: "1px solid var(--border)", opacity: 0.6 }} />
      </div>
    </AppShell>
  );

  if (!profile) return null;

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "16px", paddingBottom: "30px" }}>
        
        {/* Profile Header Card */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ height: "90px", background: "var(--gradient)", position: "relative" }}>
            <div style={{ position: "absolute", top: "-30px", right: "-30px", width: "160px", height: "160px", background: "rgba(255,255,255,0.07)", borderRadius: "50%" }} />
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "12px" }}>
              
              {/* UPDATED: Avatar with white outline */}
              <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "var(--gradient)", border: "4px solid var(--surface)", display: "flex", alignItems: "center", justifyContent: "center", marginTop: "-45px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", overflow: "hidden", flexShrink: 0 }}>
                {profile.avatar_url?.startsWith("http")
                  ? <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : profile.avatar_url?.startsWith("emoji:")
                    ? <span style={{ fontSize: "32px" }}>{profile.avatar_url.replace("emoji:", "")}</span>
                    : <span style={{ color: "white", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "32px" }}>{getInitials(profile.full_name || profile.username)}</span>
                }
              </div>

              {isOwner && (
                <Link href="/settings" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "99px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px" }}>
                  <Settings size={13} />Edit Profile
                </Link>
              )}
            </div>
            
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)", margin: 0 }}>
                  {profile.full_name || profile.username}
                </h1>
                <span style={{ padding: "3px 10px", borderRadius: "99px", background: roleStyle?.bg, color: roleStyle?.color, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px" }}>
                  {roleLabels[profile.role] || "Student"}
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>u/{profile.username}</p>
            </div>
            
            {profile.bio && (
              <p style={{ fontSize: "14px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6, marginBottom: "12px" }}>{profile.bio}</p>
            )}
            
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
              {profile.profession && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <BookOpen size={13} color="var(--text-light)" />
                  <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{profile.profession}</span>
                </div>
              )}
              {profile.institution && (
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <MapPin size={13} color="var(--text-light)" />
                  <span style={{ fontSize: "12.5px", color: "var(--text-muted)" }}>{profile.institution}</span>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div style={{ display: "flex", gap: "16px", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "8px 12px",
                    background: activeTab === tab.id ? "var(--surface-2)" : "transparent",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    color: activeTab === tab.id ? "var(--text)" : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontFamily: "var(--font-display)",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    fontSize: "14px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {tab.icon} {tab.label}
                  {tab.id === "posts" && <span style={{ background: "var(--border)", padding: "2px 6px", borderRadius: "99px", fontSize: "11px" }}>{postCount}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Tab Content Area */}
        <div style={{ minHeight: "200px" }}>
          
          {loading && (
             <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>Loading...</p>
          )}

          {/* POSTS TAB */}
          {!loading && activeTab === "posts" && (
            posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "40px", marginBottom: "10px" }}>📭</div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--text-muted)" }}>No posts yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
              </div>
            )
          )}

          {/* COMMENTS TAB */}
          {!loading && activeTab === "comments" && (
            comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--text-muted)" }}>No comments yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {comments.map(comment => (
                  <div key={comment.id} style={{ background: "var(--surface)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)" }}>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Commented on <Link href={`/post/${comment.post?.id}`} style={{ color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>{comment.post?.title}</Link>
                    </p>
                    <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.5, margin: 0 }}>{comment.content}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ACTIVITY TAB */}
          {!loading && activeTab === "activity" && (
            activity.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--text-muted)" }}>No recent activity</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <h3 style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>Recently Upvoted</h3>
                {activity.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
              </div>
            )
          )}

        </div>
      </div>
    </AppShell>
  );
}
