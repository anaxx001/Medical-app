import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  MoreHorizontal,
  Repeat,
  Trash2,
  Flag,
  X,
} from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    author_id: string;
    created_at: string;
    community_id: string | null;
    is_repost?: boolean;
    original_post_id?: string | null;
    repost_caption?: string | null;
    author?: {
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    community?: {
      name: string;
      slug: string;
    } | null;
    likes_count?: number;
    comments_count?: number;
    original_post?: {
      id: string;
      title: string;
      content: string;
      author: {
        username: string;
        full_name: string | null;
        avatar_url: string | null;
      };
    } | null;
  };
  onDelete?: (postId: string) => void;
  showCommunity?: boolean;
}

export default function PostCard({ post, onDelete, showCommunity = true }: PostCardProps) {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reposted, setReposted] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes_count || 0);
  const [saveCount, setSaveCount] = useState(0);
  const [repostCount, setRepostCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostCaption, setRepostCaption] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkUserInteractions() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      // Check if liked
      const { data: likeData } = await supabase
        .from("post_reactions")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .eq("type", "like")
        .maybeSingle();
      setLiked(!!likeData);

      // Check if saved
      const { data: saveData } = await supabase
        .from("saved_posts")
        .select("id")
        .eq("post_id", post.id)
        .eq("user_id", user.id)
        .maybeSingle();
      setSaved(!!saveData);

      // Check if reposted
      const { data: repostData } = await supabase
        .from("posts")
        .select("id")
        .eq("original_post_id", post.id)
        .eq("author_id", user.id)
        .eq("is_repost", true)
        .maybeSingle();
      setReposted(!!repostData);

      // Get repost count
      const { count } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("original_post_id", post.id)
        .eq("is_repost", true);
      setRepostCount(count || 0);
    }

    checkUserInteractions();
  }, [post.id]);

  async function toggleLike() {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (liked) {
        await supabase
          .from("post_reactions")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", userId)
          .eq("type", "like");
        setLikeCount((prev) => Math.max(0, prev - 1));
      } else {
        await supabase
          .from("post_reactions")
          .insert({ post_id: post.id, user_id: userId, type: "like" });
        setLikeCount((prev) => prev + 1);
      }
      setLiked(!liked);
    } catch (err) {
      console.error("Like error:", err);
    }
  }

  async function toggleSave() {
    if (!userId) {
      navigate("/login");
      return;
    }

    try {
      if (saved) {
        await supabase
          .from("saved_posts")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("saved_posts")
          .insert({ post_id: post.id, user_id: userId });
      }
      setSaved(!saved);
    } catch (err) {
      console.error("Save error:", err);
    }
  }

  async function handleRepost() {
    if (!userId) {
      navigate("/login");
      return;
    }

    if (reposted) {
      // Already reposted — show message or navigate to their repost
      return;
    }

    setShowRepostModal(true);
  }

  async function submitRepost() {
    if (!userId || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("posts").insert({
        title: post.title,
        content: post.content,
        author_id: userId,
        community_id: post.community_id,
        is_repost: true,
        original_post_id: post.id,
        repost_caption: repostCaption.trim() || null,
      });

      if (error) throw error;

      setReposted(true);
      setRepostCount((prev) => prev + 1);
      setShowRepostModal(false);
      setRepostCaption("");
    } catch (err) {
      console.error("Repost error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!userId || userId !== post.author_id) return;

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      onDelete?.(post.id);
    } catch (err) {
      console.error("Delete error:", err);
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

  function truncateContent(content: string, maxLength: number = 200) {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  }

  const isAuthor = userId === post.author_id;
  const displayPost = post.is_repost && post.original_post ? post.original_post : post;
  const reposterName = post.is_repost ? post.author?.full_name || post.author?.username : null;

  return (
    <>
      <div
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
        {/* Repost indicator */}
        {post.is_repost && (
          <div style={{
            padding: "8px 16px 0",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontWeight: 500,
          }}>
            <Repeat size={14} />
            <span>{reposterName} reposted</span>
            {post.repost_caption && (
              <span style={{ color: "var(--text-primary)", fontStyle: "italic" }}>
                — "{post.repost_caption}"
              </span>
            )}
          </div>
        )}

        {/* Post Header */}
        <div style={{ padding: "16px 16px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${displayPost.author?.username}`);
              }}
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: displayPost.author?.avatar_url
                  ? `url(${displayPost.author.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #0D9488, #14B8A6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: "16px",
                fontWeight: 600,
                flexShrink: 0,
                cursor: "pointer",
              }}
            >
              {!displayPost.author?.avatar_url && (
                displayPost.author?.full_name?.[0] || displayPost.author?.username?.[0] || "?"
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/profile/${displayPost.author?.username}`);
                }}
                style={{
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  fontSize: "14px",
                  cursor: "pointer",
                }}
              >
                {displayPost.author?.full_name || displayPost.author?.username || "Unknown"}
              </p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                {formatTimeAgo(displayPost.created_at)}
                {showCommunity && displayPost.community && (
                  <span>
                    {" · "}
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/c/${displayPost.community?.slug}`);
                      }}
                      style={{ color: "#0D9488", cursor: "pointer" }}
                    >
                      c/{displayPost.community.name}
                    </span>
                  </span>
                )}
              </p>
            </div>

            {/* Menu button */}
            <div style={{ position: "relative" }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              {showMenu && (
                <>
                  <div
                    onClick={() => setShowMenu(false)}
                    style={{
                      position: "fixed",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      zIndex: 40,
                    }}
                  />
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    right: 0,
                    background: "var(--surface)",
                    borderRadius: "12px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    zIndex: 50,
                    minWidth: "160px",
                    overflow: "hidden",
                  }}>
                    {isAuthor && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete();
                          setShowMenu(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          width: "100%",
                          padding: "10px 14px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#EF4444",
                          fontSize: "14px",
                          textAlign: "left",
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Report functionality
                        setShowMenu(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "10px 14px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "var(--text-primary)",
                        fontSize: "14px",
                        textAlign: "left",
                      }}
                    >
                      <Flag size={16} />
                      Report
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Post Content */}
          <div onClick={() => navigate(`/post/${post.id}`)}>
            <h3 style={{
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "6px",
              lineHeight: 1.4,
            }}>
              {displayPost.title}
            </h3>
            <p style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              lineHeight: 1.5,
            }}>
              {truncateContent(displayPost.content)}
            </p>
          </div>
        </div>

        {/* Post Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 16px 12px",
          gap: "4px",
          borderTop: "1px solid var(--border)",
          marginTop: "8px",
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: liked ? "rgba(239, 68, 68, 0.1)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: liked ? "#EF4444" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <Heart size={18} fill={liked ? "#EF4444" : "none"} />
            <span>{likeCount}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/post/${post.id}`);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <MessageCircle size={18} />
            <span>{post.comments_count || 0}</span>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRepost();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: reposted ? "rgba(16, 185, 129, 0.1)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: reposted ? "#10B981" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <Repeat size={18} />
            <span>{repostCount}</span>
          </button>

          <div style={{ flex: 1 }} />

          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSave();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: saved ? "rgba(13, 148, 136, 0.1)" : "transparent",
              border: "none",
              cursor: "pointer",
              color: saved ? "#0D9488" : "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
              transition: "all 0.2s",
            }}
          >
            <Bookmark size={18} fill={saved ? "#0D9488" : "none"} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: displayPost.title,
                  text: displayPost.content,
                  url: window.location.origin + `/post/${post.id}`,
                });
              } else {
                navigator.clipboard.writeText(window.location.origin + `/post/${post.id}`);
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Repost Modal */}
      {showRepostModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          padding: "16px",
        }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "20px",
            padding: "24px",
            width: "100%",
            maxWidth: "480px",
            maxHeight: "80vh",
            overflow: "auto",
            border: "1px solid var(--border)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                Repost
              </h3>
              <button
                onClick={() => {
                  setShowRepostModal(false);
                  setRepostCaption("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Original post preview */}
            <div style={{
              background: "var(--background)",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "16px",
              border: "1px solid var(--border)",
            }}>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "6px" }}>
                Original post by {displayPost.author?.username}
              </p>
              <p style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "14px", marginBottom: "4px" }}>
                {displayPost.title}
              </p>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {truncateContent(displayPost.content, 100)}
              </p>
            </div>

            {/* Caption input */}
            <textarea
              value={repostCaption}
              onChange={(e) => setRepostCaption(e.target.value)}
              placeholder="Add a caption (optional)..."
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--text-primary)",
                fontSize: "14px",
                resize: "vertical",
                minHeight: "80px",
                fontFamily: "inherit",
                outline: "none",
              }}
              maxLength={280}
            />
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right", marginTop: "4px" }}>
              {repostCaption.length}/280
            </p>

            <button
              onClick={submitRepost}
              disabled={isSubmitting}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "12px",
                borderRadius: "12px",
                background: "#0D9488",
                color: "white",
                border: "none",
                fontWeight: 600,
                fontSize: "15px",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                  Reposting...
                </>
              ) : (
                <>
                  <Repeat size={18} />
                  Repost
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
