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

      const totalVotes = (postsData || []).reduce((sum: number, p: any) => sum + (p.upvotes || 0), 0);
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
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  async function handleFollowToggle() {
    if (!currentUserId || !profile) return;

    if (isFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowerCount(Math.max(0, followerCount - 1));
    } else {
      await supabase
        .from("followers")
        .insert({ follower_id: currentUserId, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  }

  const isOwn = currentUserId === profile?.id;

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px" }}>
          {/* Skeleton loader */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden" }}>
            <div style={{ height: "200px", background: "var(--surface-2)", animation: "pulse 1.5s infinite" }} />
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
    ...(isOwn ? [
      { id: "saved" as TabType, label: "Saved", count: savedPosts.length, icon: <Bookmark size={14} /> },
      { id: "history" as TabType, label: "History", count: historyPosts.length, icon: <Clock size={14} /> },
    ] : []),
    { id: "comments" as TabType, label: "Comments", count: comments.length, icon: <MessageCircle size={14} /> },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* HEADER */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", boxShadow: "var(--shadow)" }}>

          {/* Cover Banner */}
          <div style={{
            height: "200px",
            background: "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)",
            position: "relative",
          }} />

          <div style={{ padding: "20px 24px", position: "relative", marginTop: "-80px" }}>

            {/* Avatar + Action Button */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <UserAvatar avatarUrl={profile.avatar_url} fullName={profile.full_name} size={120} />
              <div style={{ flex: 1, marginTop: "40px" }}>
                {isOwn ? (
                  <Link href="/settings" style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    padding: "8px 14px", borderRadius: "99px",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    textDecoration: "none", color: "var(--text)",
                    fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12px",
                  }}>
                    <Settings size={13} /> Edit Profile
                  </Link>
                ) : (
                  <button onClick={handleFollowToggle} style={{
                    padding: "8px 20px", borderRadius: "99px",
                    border: "1px solid var(--border)",
                    background: isFollowing ? "var(--surface-2)" : "#1ABC9C",
                    color: isFollowing ? "var(--text)" : "#fff",
                    fontFamily: "var(--font-display)", fontWeight: 600,
                    fontSize: "13px", cursor: "pointer", transition: "all 0.2s",
                  }}>
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Name + Username + Role */}
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

              {/* Institution + Profession */}
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
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.6, marginTop: "12px", margin: 0 }}>
                  {profile.bio}
                </p>
              )}
            </div>

            {/* Followers / Following */}
            <div style={{ display: "flex", gap: "24px", paddingTop: "16px" }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followerCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Followers
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followingCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  Following
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px" }}>
          {[
            { value: posts.length, label: "Total Posts", color: "#1ABC9C" },
            { value: totalUpvotes, label: "Total Upvotes", color: "#F97316" },
            {
              value: new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
              label: "Member Since", color: "var(--text)", small: true
            },
          ].map((stat, i) => (
            <div key={i} style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "16px", textAlign: "center",
            }}>
              <div style={{
                fontFamily: "var(--font-display)", fontWeight: 700,
                fontSize: stat.small ? "14px" : "20px", color: stat.color,
              }}>
                {stat.value}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{
          display: "flex", gap: "4px",
          borderBottom: "1px solid var(--border)",
          overflowX: "auto",
        }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "12px 16px",
                border: "none",
                borderBottom: tab === t.id ? "3px solid #1ABC9C" : "3px solid transparent",
                background: "transparent",
                color: tab === t.id ? "#1ABC9C" : "var(--text-muted)",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center",
                gap: "6px", whiteSpace: "nowrap", transition: "all 0.2s",
              }}
            >
              {t.icon} {t.label}
              <span style={{ fontSize: "11px", opacity: 0.7 }}>({t.count})</span>
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

          {/* POSTS TAB */}
          {tab === "posts" && (
            posts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <BookOpen size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  No posts yet.
                </p>
              </div>
            ) : (
              posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {/* SAVED TAB */}
          {tab === "saved" && (
            savedPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <Bookmark size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  No saved posts yet.
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>
                  Bookmark posts to find them here later.
                </p>
              </div>
            ) : (
              savedPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {/* HISTORY TAB */}
          {tab === "history" && (
            historyPosts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <Clock size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>
                  No history yet.
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>
                  Posts you view will appear here.
                </p>
              </div>
            ) : (
              historyPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
            )
          )}

          {/* COMMENTS TAB */}
          {tab === "comments" && (
            comments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                <MessageCircle size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
                <p style={{ fontSize: "14px", color: "var(--text-  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
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

const tealGradient = "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)";

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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [tab, setTab] = useState<"posts" | "saved" | "history" | "comments">("posts");

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      // Fetch profile
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

      // Fetch user's posts
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

      setPosts(
        // @ts-ignore
        (postsData || []).map((p: any) => ({
          ...p,
          comment_count: p.comment_count?.[0]?.count || 0,
          user_vote: null,
        }))
      );

      // Calculate total upvotes
      const totalVotes = (postsData || []).reduce((sum: number, p: any) => sum + (p.upvotes || 0), 0);
      setTotalUpvotes(totalVotes);

      // Fetch saved posts if viewing own profile
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

        setSavedPosts(
          // @ts-ignore
          (saved || []).map((s: any) => ({
            ...s.post,
            comment_count: s.post?.comment_count?.[0]?.count || 0,
            user_vote: null,
          }))
        );
      }

      // Fetch post history if viewing own profile
      if (user?.id === profileData.id) {
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

        setHistoryPosts(
          // @ts-ignore
          (history || []).map((h: any) => ({
            ...h.post,
            comment_count: h.post?.comment_count?.[0]?.count || 0,
            user_vote: null,
          }))
        );
      }

      // Fetch user's comments
      const { data: commentsData } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          post_id,
          created_at,
          post:posts(
            id, title, content, file_url, file_type,
            is_announcement, is_pinned, upvotes, downvotes, created_at,
            author:profiles!author_id(id, username, full_name, avatar_url, profession),
            community:communities!community_id(id, name, slug, icon),
            comment_count:comments(count)
          )
        `)
        .eq("author_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setComments(commentsData || []);

      // Fetch follower/following counts
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

      // Check if current user is following this profile
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
    }
    fetchProfile();
  }, [username]);

  function getInitials(name: string) {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "M";
  }

  async function handleFollowToggle() {
    if (!currentUserId || !profile) return;

    if (isFollowing) {
      await supabase
        .from("followers")
        .delete()
        .eq("follower_id", currentUserId)
        .eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowerCount(Math.max(0, followerCount - 1));
    } else {
      await supabase
        .from("followers")
        .insert({
          follower_id: currentUserId,
          following_id: profile.id,
        });
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  }

  const isOwn = currentUserId === profile?.id;

  if (loading)
    return (
      <AppShell>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>Loading profile...</p>
        </div>
      </AppShell>
    );

  if (!profile)
    return (
      <AppShell>
        <div style={{ maxWidth: "820px", margin: "0 auto", padding: "20px" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)" }}>User not found.</p>
        </div>
      </AppShell>
    );

  return (
    <AppShell>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        {/* HEADER SECTION */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
          {/* Cover Photo */}
          <div
            style={{
              width: "100%",
              height: "200px",
              background: profile.cover_photo_url ? `url(${profile.cover_photo_url})` : tealGradient,
              backgroundSize: "cover",
              backgroundPosition: "center",
              position: "relative",
            }}
          >
            {isOwn && (
              <button
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "none",
                  background: "rgba(0, 0, 0, 0.6)",
                  color: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontFamily: "var(--font-body)",
                }}
              >
                <Camera size={14} /> Edit Cover
              </button>
            )}
          </div>

          {/* Profile Info Container */}
          <div style={{ padding: "0 24px 24px" }}>
            {/* Avatar and Header Info */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "16px", marginTop: "-50px", position: "relative", zIndex: 1 }}>
              {/* Avatar */}
              <div
                style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "50%",
                  background: profile.avatar_url ? "transparent" : tealGradient,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  color: "#fff",
                  fontWeight: 600,
                  border: "4px solid var(--surface)",
                  overflow: "hidden",
                  flexShrink: 0,
                  position: "relative",
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt={profile.full_name} />
                ) : (
                  <Users size={40} color="#fff" />
                )}
              </div>

              {/* Profile Header Info */}
              <div style={{ flex: 1, minWidth: 0, paddingTop: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                  <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", margin: 0 }}>
                    {profile.full_name}
                  </h1>
                  {profile.role && roleColors[profile.role] && (
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "99px",
                        background: roleColors[profile.role].bg,
                        color: roleColors[profile.role].color,
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "11px",
                      }}
                    >
                      {roleLabels[profile.role] || profile.role}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 10px 0", fontFamily: "var(--font-body)" }}>u/{profile.username}</p>

                {/* Metadata */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                  {profile.institution && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <MapPin size={14} color="#1ABC9C" />
                      <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-body)" }}>{profile.institution}</span>
                    </div>
                  )}
                  {profile.course_programme && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <BookOpen size={14} color="#1ABC9C" />
                      <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-body)" }}>
                        {profile.course_programme}
                      </span>
                    </div>
                  )}
                  {profile.study_year && (
                    <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-body)" }}>Year {profile.study_year}</span>
                  )}
                </div>

                {/* Bio */}
                {profile.bio && (
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                      margin: "10px 0 0 0",
                    }}
                  >
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "16px" }}>
                {isOwn ? (
                  <Link
                    href="/settings"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      textDecoration: "none",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <Settings size={14} /> Edit Profile
                  </Link>
                ) : (
                  <button
                    onClick={handleFollowToggle}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px 16px",
                      borderRadius: "6px",
                      border: isFollowing ? "1px solid var(--border)" : "none",
                      background: isFollowing ? "var(--surface)" : tealGradient,
                      color: isFollowing ? "var(--text)" : "#fff",
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>
            </div>

            {/* Follower/Following Counts */}
            <div style={{ display: "flex", gap: "24px", marginBottom: "16px", paddingBottom: "16px", borderBottom: "1px solid var(--border)" }}>
              <button
                onClick={() => alert(`${profile.full_name} has ${followerCount} followers`)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followerCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Followers</div>
              </button>
              <button
                onClick={() => alert(`${profile.full_name} is following ${followingCount} users`)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)" }}>
                  {followingCount}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>Following</div>
              </button>
            </div>
          </div>
        </div>

        {/* STATS ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <TrendingUp size={18} color="#1ABC9C" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)" }}>
                {posts.length}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>Total Posts</p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <TrendingUp size={18} color="#1ABC9C" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)" }}>
                {totalUpvotes}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>Upvotes Received</p>
          </div>

          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "16px",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "8px" }}>
              <Clock size={18} color="#1ABC9C" />
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>
                {new Date(profile.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
              </span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>Member Since</p>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "0" }}>
          {(["posts", "saved", "history", "comments"] as const).map(t => {
            const tabLabels = {
              posts: `Posts (${posts.length})`,
              saved: `Saved (${savedPosts.length})`,
              history: `History (${historyPosts.length})`,
              comments: `Comments (${comments.length})`,
            };

            const tabIcons = {
              posts: null,
              saved: <Bookmark size={14} />,
              history: <Clock size={14} />,
              comments: <MessageSquare size={14} />,
            };

            // Hide saved and history for non-own profiles
            if ((t === "saved" || t === "history") && !isOwn) return null;

            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "12px 16px",
                  borderRadius: "0",
                  border: "none",
                  borderBottom: tab === t ? "3px solid #1ABC9C" : "3px solid transparent",
                  background: "transparent",
                  color: tab === t ? "#1ABC9C" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: tab === t ? 700 : 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {tabIcons[t]}
                {tabLabels[t]}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "200px" }}>
          {tab === "posts" && (
            <>
              {posts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <TrendingUp size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>
                    No posts yet.
                  </p>
                </div>
              ) : (
                posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
              )}
            </>
          )}

          {tab === "saved" && (
            <>
              {savedPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <Bookmark size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>
                    No saved posts yet.
                  </p>
                </div>
              ) : (
                savedPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
              )}
            </>
          )}

          {tab === "history" && (
            <>
              {historyPosts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <Clock size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>
                    No viewing history yet.
                  </p>
                </div>
              ) : (
                historyPosts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)
              )}
            </>
          )}

          {tab === "comments" && (
            <>
              {comments.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
                  <MessageSquare size={32} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
                  <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>
                    No comments yet.
                  </p>
                </div>
              ) : (
                comments.map(comment => (
                  <div
                    key={comment.id}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: "16px",
                    }}
                  >
                    <div style={{ marginBottom: "12px" }}>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: "0 0 6px 0" }}>
                        On: <strong>{comment.post?.title || "Unknown Post"}</strong>
                      </p>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0 }}>
                        {new Date(comment.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    <p style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6, margin: 0 }}>
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
