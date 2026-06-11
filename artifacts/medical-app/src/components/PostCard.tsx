import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, ArrowDown, MessageSquare, Share2, Pin, Megaphone, MoreVertical, Bookmark, Flag, Copy, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase";

export interface Post {
  id: string;
  title: string;
  content?: string;
  file_url?: string;
  file_type?: string;
  is_announcement: boolean;
  is_pinned: boolean;
  upvotes: number;
  downvotes: number;
  created_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    profession?: string;
  };
  community: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  };
  comment_count?: number;
  user_vote?: "up" | "down" | null;
}

interface Props {
  post: Post;
  currentUserId?: string;
}

export default function PostCard({ post, currentUserId }: Props) {
  const supabase = createClient();
  const [votes, setVotes] = useState(post.upvotes - post.downvotes);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(post.user_vote || null);
  const [showMenu, setShowMenu] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  async function handleVote(type: "up" | "down") {
    if (!currentUserId) return;
    if (userVote === type) {
      await supabase.from("post_votes").delete().match({ post_id: post.id, user_id: currentUserId });
      setVotes(v => type === "up" ? v - 1 : v + 1);
      setUserVote(null);
    } else {
      if (userVote) {
        await supabase.from("post_votes").delete().match({ post_id: post.id, user_id: currentUserId });
        setVotes(v => userVote === "up" ? v - 1 : v + 1);
      }
      await supabase.from("post_votes").insert({ post_id: post.id, user_id: currentUserId, vote_type: type });
      setVotes(v => type === "up" ? v + 1 : v - 1);
      setUserVote(type);
    }
  }

  async function handleSave() {
    if (!currentUserId) return;
    if (isSaved) {
      await supabase.from("saved_posts").delete().match({ post_id: post.id, user_id: currentUserId });
      setIsSaved(false);
    } else {
      await supabase.from("saved_posts").insert({ post_id: post.id, user_id: currentUserId });
      setIsSaved(true);
    }
  }

  async function handleCopyText() {
    await navigator.clipboard.writeText(post.content || post.title);
    setShowMenu(false);
  }

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ago`;
    if (h > 0) return `${h}h ago`;
    if (m > 0) return `${m}m ago`;
    return "just now";
  }

  function getInitials(name: string) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }

  const isAuthor = currentUserId === post.author.id;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      borderLeft: "3px solid #0D9488",
      position: "relative",
    }}>
      {/* Top bar with menu */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 14px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 8px",
            borderRadius: "6px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            transition: "background-color 0.2s",
          }}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Three-dot menu */}
      {showMenu && (
        <div style={{
          position: "absolute",
          top: "32px",
          right: "10px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 10,
          minWidth: "180px",
        }}>
          {isAuthor ? (
            <>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={() => setShowMenu(false)}>
                Edit post
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "#E8445A",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }} onClick={() => setShowMenu(false)}>
                Delete post
              </button>
            </>
          ) : (
            <>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={() => setShowMenu(false)}>
                Follow post
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={() => setShowMenu(false)}>
                Share to
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={handleCopyText}>
                Copy text
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={() => setShowMenu(false)}>
                Hide post
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "var(--text)",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
                borderBottom: "1px solid var(--border)",
              }} onClick={() => setShowMenu(false)}>
                Report
              </button>
              <button style={{
                width: "100%",
                padding: "10px 16px",
                border: "none",
                background: "transparent",
                color: "#E8445A",
                fontSize: "13px",
                cursor: "pointer",
                textAlign: "left",
              }} onClick={() => setShowMenu(false)}>
                Block account
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Content */}
      <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Announcement/Pinned Badge */}
        {(post.is_announcement || post.is_pinned) && (
          <div style={{
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            gap: "5px",
            fontSize: "10px",
            fontWeight: 600,
            color: post.is_announcement ? "var(--blue)" : "var(--green)",
          }}>
            {post.is_announcement ? <Megaphone size={12} /> : <Pin size={12} />}
            {post.is_announcement ? "Announcement" : "Pinned"}
          </div>
        )}

        {/* Community Name (Teal) */}
        <Link href={`/c/${post.community.slug}`} style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          textDecoration: "none",
          marginBottom: "4px",
        }}>
          <span style={{ fontSize: "13px" }}>{post.community.icon}</span>
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "12px",
            color: "#0D9488",
          }}>
            {post.community.name}
          </span>
        </Link>

        {/* Post Title (Bold) */}
        <Link href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--text)",
            marginBottom: "6px",
            margin: "0 0 6px 0",
            lineHeight: 1.4,
          }}>
            {post.title}
          </h3>
        </Link>

        {/* Preview Text (2 lines) */}
        {post.content && (
          <p style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            lineHeight: 1.5,
            marginBottom: "8px",
            margin: "0 0 8px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {post.content}
          </p>
        )}

        {/* File Attachment */}
        {post.file_url && (
          <a href={post.file_url} target="_blank" rel="noopener noreferrer" style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            padding: "4px 8px",
            borderRadius: "4px",
            background: "rgba(13, 148, 136, 0.1)",
            color: "#0D9488",
            fontSize: "12px",
            textDecoration: "none",
            marginBottom: "8px",
            width: "fit-content",
          }}>
            📎 {post.file_type === "pdf" ? "PDF" : "File"}
          </a>
        )}

        {/* Bottom Row: Author Info + Actions */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          flexWrap: "wrap",
          fontSize: "12px",
          marginBottom: "8px",
        }}>
          {/* Author Info */}
          <Link href={`/profile/${post.author.username}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}>
            <div style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              background: "var(--gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "9px",
              color: "white",
              flexShrink: 0,
              overflow: "hidden",
            }}>
              {post.author.avatar_url
                ? <img src={post.author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                : getInitials(post.author.full_name || post.author.username)}
            </div>
            <span style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
            }}>
              u/{post.author.username}
            </span>
            {post.author.profession && (
              <span style={{
                fontSize: "11px",
                color: "#0D9488",
                fontWeight: 600,
                background: "rgba(13, 148, 136, 0.1)",
                padding: "2px 6px",
                borderRadius: "12px",
              }}>
                {post.author.profession}
              </span>
            )}
          </Link>

          {/* Time Ago */}
          <span style={{
            fontSize: "11px",
            color: "var(--text-light)",
          }}>
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* Reddit-style Vote and Action Buttons */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          marginTop: "8px",
        }}>
          {/* Upvote Button */}
          <button
            onClick={() => handleVote("up")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1px solid ${userVote === "up" ? "#FFA500" : "var(--border)"}`,
              background: userVote === "up" ? "rgba(255, 165, 0, 0.1)" : "transparent",
              color: userVote === "up" ? "#FFA500" : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              cursor: currentUserId ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <ArrowUp size={14} strokeWidth={userVote === "up" ? 2.5 : 1.8} />
            {votes > 0 ? votes : "Vote"}
          </button>

          {/* Downvote Button */}
          <button
            onClick={() => handleVote("down")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1px solid ${userVote === "down" ? "#0084FF" : "var(--border)"}`,
              background: userVote === "down" ? "rgba(0, 132, 255, 0.1)" : "transparent",
              color: userVote === "down" ? "#0084FF" : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              cursor: currentUserId ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <ArrowDown size={14} strokeWidth={userVote === "down" ? 2.5 : 1.8} />
          </button>

          {/* Comments Button */}
          <Link href={`/post/${post.id}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            textDecoration: "none",
            cursor: "pointer",
            transition: "all 0.2s",
          }}>
            <MessageSquare size={14} />
            {post.comment_count || 0}
          </Link>

          {/* Save/Bookmark Button */}
          <button
            onClick={handleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1px solid ${isSaved ? "#0D9488" : "var(--border)"}`,
              background: isSaved ? "rgba(13, 148, 136, 0.1)" : "transparent",
              color: isSaved ? "#0D9488" : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Bookmark size={14} fill={isSaved ? "#0D9488" : "none"} />
            Save
          </button>

          {/* Share Button */}
          <button
            onClick={() => navigator.share?.({ title: post.title, url: window.location.origin + `/post/${post.id}` })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
              background: "transparent",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <Share2 size={14} />
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
