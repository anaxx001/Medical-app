import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
  Bookmark,
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Loader2,
} from "lucide-react";
import AnimatedPage from "@/components/animations/AnimatedPage";
import StaggerChildren from "@/components/animations/StaggerChildren";

interface SavedPost {
  id: string;
  post_id: string;
  created_at: string;
  post: {
    id: string;
    title: string;
    content: string;
    author_id: string;
    created_at: string;
    community_id: string | null;
    author: {
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    community: {
      name: string;
      slug: string;
    } | null;
    likes_count: number;
    comments_count: number;
  };
}

export default function SavedPostsPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSavedPosts() {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/login");
          return;
        }
        setUserId(user.id);

        // Fetch saved posts with post details
        const { data, error } = await supabase
          .from("saved_posts")
          .select(`
            id,
            post_id,
            created_at,
            post:posts(
              id,
              title,
              content,
              author_id,
              created_at,
              community_id,
              author:profiles!posts_author_id_fkey(username, full_name, avatar_url),
              community:communities(name, slug)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching saved posts:", error);
          setSavedPosts([]);
          return;
        }

        // Get like and comment counts for each post
        const postsWithCounts = await Promise.all(
          (data || []).map(async (saved: any) => {
            const post = saved.post;
            if (!post) return null;

            const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
              supabase
                .from("post_reactions")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id)
                .eq("type", "like"),
              supabase
                .from("comments")
                .select("id", { count: "exact", head: true })
                .eq("post_id", post.id),
            ]);

            return {
              ...saved,
              post: {
                ...post,
                likes_count: likesCount || 0,
                comments_count: commentsCount || 0,
              },
            };
          })
        );

        setSavedPosts(postsWithCounts.filter(Boolean) as SavedPost[]);
      } catch (err) {
        console.error("Saved posts error:", err);
        setSavedPosts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedPosts();
  }, []);

  async function unsavePost(savedId: string) {
    try {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", savedId);

      if (error) throw error;

      setSavedPosts((prev) => prev.filter((sp) => sp.id !== savedId));
    } catch (err) {
      console.error("Error unsaving post:", err);
    }
  }

  function formatTimeAgo(timestamp: string) {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  function truncateContent(content: string, maxLength: number = 150) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  }

  if (loading) {
    return (
      <AnimatedPage>
        <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto", paddingBottom: "80px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "8px",
                color: "var(--text-primary)",
              }}
            >
              <ArrowLeft size={24} />
            </button>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
              Saved Posts
            </h1>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "120px", background: "var(--surface)", borderRadius: "16px", animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        </div>
      </AnimatedPage>
    );
  }

  return (
    <AnimatedPage>
      <div style={{ padding: "16px", maxWidth: "800px", margin: "0 auto", paddingBottom: "80px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "var(--text-primary)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
              Saved Posts
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              {savedPosts.length} {savedPosts.length === 1 ? "post" : "posts"} saved
            </p>
          </div>
        </div>

        {savedPosts.length === 0 ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 20px",
            textAlign: "center",
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "24px",
              background: "var(--surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "20px",
              border: "1px dashed var(--border)",
            }}>
              <Bookmark size={36} color="var(--text-muted)" />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "8px" }}>
              No saved posts yet
            </h3>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px", lineHeight: 1.5 }}>
              Posts you save from your feed or communities will appear here for easy access.
            </p>
            <button
              onClick={() => navigate("/")}
              style={{
                marginTop: "20px",
                padding: "10px 24px",
                borderRadius: "10px",
                background: "#0D9488",
                color: "white",
                border: "none",
                fontWeight: 600,
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              Browse Feed
            </button>
          </div>
        ) : (
          <StaggerChildren>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {savedPosts.map((saved) => (
                <div
                  key={saved.id}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    overflow: "hidden",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Post Header */}
                  <div
                    style={{ padding: "16px 16px 8px" }}
                    onClick={() => navigate(`/post/${saved.post.id}`)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: saved.post.author?.avatar_url
                          ? `url(${saved.post.author.avatar_url}) center/cover`
                          : "linear-gradient(135deg, #0D9488, #14B8A6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontSize: "14px",
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {!saved.post.author?.avatar_url && (
                          saved.post.author?.full_name?.[0] || saved.post.author?.username?.[0] || "?"
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px" }}>
                          {saved.post.author?.full_name || saved.post.author?.username || "Unknown"}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {formatTimeAgo(saved.post.created_at)}
                          {saved.post.community && (
                            <span> · <span style={{ color: "#0D9488" }}>c/{saved.post.community.name}</span></span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          unsavePost(saved.id);
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "6px",
                          borderRadius: "8px",
                          color: "#0D9488",
                          transition: "background 0.2s",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(13, 148, 136, 0.1)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                        title="Remove from saved"
                      >
                        <Bookmark size={18} fill="#0D9488" />
                      </button>
                    </div>

                    {/* Post Content */}
                    <h3 style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      marginBottom: "6px",
                      lineHeight: 1.4,
                    }}>
                      {saved.post.title}
                    </h3>
                    <p style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}>
                      {truncateContent(saved.post.content)}
                    </p>
                  </div>

                  {/* Post Actions */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 16px 12px",
                    gap: "16px",
                    borderTop: "1px solid var(--border)",
                    marginTop: "8px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "13px" }}>
                      <Heart size={16} />
                      <span>{saved.post.likes_count}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)", fontSize: "13px" }}>
                      <MessageCircle size={16} />
                      <span>{saved.post.comments_count}</span>
                    </div>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      Saved {formatTimeAgo(saved.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </StaggerChildren>
        )}
      </div>
    </AnimatedPage>
  );
}
