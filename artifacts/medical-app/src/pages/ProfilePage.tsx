import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import UserAvatar from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase";
import { useParams, Link } from "wouter";
import { Settings, MapPin, BookOpen, Clock, MessageCircle, Bookmark } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  profession?: string;
  bio?: string;
  institution?: string;
  course?: string;
  study_year?: string;
  role: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  post_id: string;
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

type TabType = "posts" | "saved" | "history" | "comments";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [historyPosts, setHistoryPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [tab, setTab] = useState<TabType>("posts");
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (!profileData) {
        setLoading(false);
        return;
      }
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
        .limit(50);

      // @ts-ignore
      setPosts((postsData || []).map((p: any) => ({
        ...p,
        comment_count: p.comment_count?.[0]?.count || 0,
        user_vote: null,
      })));

      const totalVotes = (postsData || []).reduce(
        (sum: number, p: any) => sum + (p.upvotes || 0),
        0
      );
      setTotalUpvotes(totalVotes);

      if (user?.id === profileData.id) {
        const { data: saved } = await supabase
          .from("saved_posts")
          .select(`
            id,
            post:posts(
              id, title, content, file_url, file_type,
              is_announcement, is_pinned, upvotes, downvotes, created_at,
              author:profiles!author_id(id, username, full_name, avatar_url, profession),
              community:communities!community_id(id, name, slug, icon),
              comment_count:comments(count)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        // @ts-ignore
        setSavedPosts((saved || []).map((s: any) => ({
          ...s.post,
          comment_count: s.post?.comment_count?.[0]?.count || 0,
          user_vote: null,
        })));

        const { data: history } = await supabase
          .from("post_history")
          .select(`
            id,
            post:posts(
              id, title, content, file_url, file_type,
              is_announcement, is_pinned, upvotes, downvotes, created_at,
              author:profiles!author_id(id, username, full_name, avatar_url, profession),
              community:communities!community_id(id, name, slug, icon),
              comment_count:comments(count)
            )
          `)
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(50);

        // @ts-ignore
        setHistoryPosts((history || []).map((h: any) => ({
          ...h.post,
          comment_count: h.post?.comment_count?.[0]?.count || 0,
          user_vote: null,
        })));
      }

      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, content, created_at, post_id")
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setComments(commentsData || []);

      const { count: followers } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", profileData.id);

      const { count: following } = await supabase
        .from("followers")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", profileData.id);

      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      if (user?.id && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from("followers")
          .select("*")
          .eq("follower_id", user.id)
          .eq("following_id", profileData.id)
          .single();
        setIsFollowing(!!followData);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile. Please try again.");
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleFollowToggle() {
    if (!currentUserId || !profile) return;
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.id);
        if (error) throw error;
        setIsFollowing(false);
        setFollowerCount(Math.max(0, followerCount - 1));
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({ follower_id: currentUserId, following_id: profile.id });
        if (error) throw error;
        setIsFollowing(true);
        setFollowerCount(followerCount + 1);
      }
    } catch (err) {
      console.error("Follow toggle error:", err);
      setError("Failed to update follow status.");
    }
  }

  const isOwn = currentUserId === profile?.id;

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ height: "200px", background: "var(--surface-2)" }} />
            <div style={{ padding: "20px 24px" }}>
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "var(--surface-2)", marginTop: "-60px", marginBottom: "16px" }} />
              <div style={{ width: "200px", height: "24px", background: "var(--surface-2)", borderRadius: "4px", marginBottom: "8px" }} />
              <div style={{ width: "120px", height: "16px", background: "var(--surface-2)", borderRadius: "4px" }} />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "16px" }}>
            User not found.
          </p>
        </div>
      </AppShell>
    );
  }

  const tabs = [
    { id: "posts" as TabType, label: "Posts", count: posts.length, icon: <BookOpen size={14} /> },
    ...(isOwn
      ? [
          { id: "saved" as TabType, label: "Saved", count: savedPosts.length, icon: <Bookmark size={14} /> },
          { id: "history" as TabType, label: "History", count: historyPosts.length, icon: <Clock size={14} /> },
        ]
      : []),
    { id: "comments" as TabType, label: "Comments", count: comments.length, icon: <MessageCircle size={14} /> },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>
        {error && (
          <div style={{ padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* HEADER */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
          <div style={{ height: "200px", background: "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)" }} />
          <div style={{ padding: "20px 24px", marginTop: "-80px" }}>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <UserAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} size={120} />
              <div style={{ flex: 1, marginTop: "40px" }}>
                {isOwn ? (
                  <Link
                    href="/profile-settings"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "99px",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      textDecoration: "none", color: "var(--text)",
                      fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12px",
                    }}
                  >
                    <Settings size={13} /> Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    style={{
                      padding: "8px 20px", borderRadius: "99px",
                      border: "1px solid var(--border)",
                      background: isFollowing ? "var(--surface-2)" : "#1ABC9C",
                      color: isFollowing ? "var(--text)" : "#fff",
                      fontFamily: "var(--font-display)", fontWeight: 600,
                      fontSize: "13px", cursor: "pointer",
                    }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            <div style={{ marginTop: "24px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", margin: "0 0 4px 0" }}>
                {profile.full_name}
              </h1>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: "0 0 12px 0" }}>
                u/{profile.username}
              </p>

              {profile.role && roleColors[profile.role] && (
                <div style={{ marginBottom: "12px" }}>
                  <span style={{
                    padding: "4px 10px", borderRadius: "99px",
                    background: roleColors[profile.role].bg,
                    color: roleColors[profile.role].color,
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11px",
                  }}>
                    {roleLabels[profile.role] || profile.role}
                  </span>
                </div>
              )}

              <div style={{ display: "flex", gap: "16px", marginBottom: "8px", flexWrap: "wrap" }}>
                {profile.institution && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                      {profile.institution}
                    </span>
                  </div>
                )}
                {profile.profession && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <BookOpen size={14} color="var(--text-muted)" />
                    <span style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                      {profile.profession}
                    </span>
                  </div>
                )}
              </div>

              {(profile.course || profile.study_year) && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: "0 0 8px 0" }}>
                  {[profile.course, profile.study_year].filter(Boolean).join(", ")}
                </p>
              )}

              {profile.bio && (
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.6, margin: "12px 0 0 0" }}>
                  {profile.bio}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "24px", paddingTop: "16px" }}>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followerCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Followers</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followingCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Following</div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "#1ABC9C" }}>{posts.length}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>Total Posts</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", color: "#F97316" }}>{totalUpvotes}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>Total Upvotes</div>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "16px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
              {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>Member Since</div>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px", border: "none",
                borderBottom: tab === t.id ? "3px solid #1ABC9C" : "3px solid transparent",
                background: "transparent",
                color: tab === t.id ? "#1ABC9C" : "var(--text-muted)",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center",
                gap: "6px", whiteSpace: "nowrap",
              }}
            >
              {t.icon} {t.label} <span style={{ fontSize: "11px", opacity: 0.7 }}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {tab === "posts" && (
            posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <BookOpen size={32} color="var(--text-muted)" />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "12px" }}>No posts yet.</p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {tab === "saved" && (
            savedPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <Bookmark size={32} color="var(--text-muted)" />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "12px" }}>No saved posts yet.</p>
              </div>
            ) : (
              savedPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {tab === "history" && (
            historyPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <Clock size={32} color="var(--text-muted)" />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "12px" }}>No history yet.</p>
              </div>
            ) : (
              historyPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {tab === "comments" && (
            comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <MessageCircle size={32} color="var(--text-muted)" />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "12px" }}>No comments yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {comments.map(comment => (
                  <div
                    key={comment.id}
                    onClick={() => { window.location.href = "/post/" + comment.post_id; }}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderLeft: "3px solid #1ABC9C",
                      borderRadius: "var(--radius)",
                      padding: "16px",
                      cursor: "pointer",
                      }}
                  >
                    <p style={{ fontSize: "14px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6, margin: "0 0 8px 0" }}>
                      {comment.content}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MessageCircle size={12} color="var(--text-muted)" />
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                        {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>
    </AppShell>
  );
}
