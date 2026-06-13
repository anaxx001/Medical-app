import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, ArrowDown, MessageSquare, Share2, Pin, Megaphone, MoreVertical, Bookmark, FileText, Download, Music } from "lucide-react";
import { createClient } from "@/lib/supabase";
import UserAvatar from "./UserAvatar";

type MediaKind = "image" | "audio" | "video" | "document";

const MEDIA_EXTENSIONS: Record<MediaKind, string[]> = {
  image: ["png", "jpg", "jpeg", "webp", "gif"],
  audio: ["mp3", "wav", "m4a", "aac"],
  video: ["mp4", "mov", "webm"],
  document: ["pdf", "docx", "txt"],
};

function getFileName(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const last = clean.split("/").pop() || "file";
  try {
    return decodeURIComponent(last);
  } catch {
    return last;
  }
}

function resolveMediaKind(fileUrl: string, fileType?: string): MediaKind {
  const t = fileType?.toLowerCase();
  if (t === "image" || t === "audio" || t === "video" || t === "document") return t;
  if (t === "pdf") return "document";
  const ext = getFileName(fileUrl).split(".").pop()?.toLowerCase() || "";
  for (const kind of Object.keys(MEDIA_EXTENSIONS) as MediaKind[]) {
    if (MEDIA_EXTENSIONS[kind].includes(ext)) return kind;
  }
  return "document";
}

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

  const isAuthor = currentUserId === post.author.id;

  return (
    <div style={{
      background: "var(--surface)",
      borderRadius: "8px",
      border: "1px solid var(--border)",
      boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
      overflow: "visible",
      display: "flex",
      flexDirection: "column",
      borderLeft: "3px solid #0D9488",
      position: "relative",
    }}>
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

        {/* Community + Three Dot Menu Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "4px",
        }}>
          <Link href={`/c/${post.community.slug}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "5px",
            textDecoration: "none",
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

          {/* Three dot menu button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                color: "var(--text-muted)",
              }}
            >
              <MoreVertical size={16} />
            </button>

            {/* Dropdown Menu */}
            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  onClick={() => setShowMenu(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 98,
                  }}
                />
                <div style={{
                  position: "absolute",
                  top: "28px",
                  right: 0,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "10px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  zIndex: 99,
                  minWidth: "200px",
                  overflow: "hidden",
                }}>
                  {isAuthor ? (
                    <>
                      <button style={menuItemStyle} onClick={() => setShowMenu(false)}>
                        ✏️ &nbsp; Edit post
                      </button>
                      <button style={{ ...menuItemStyle, color: "#E8445A", borderTop: "1px solid var(--border)" }} onClick={() => setShowMenu(false)}>
                        🗑️ &nbsp; Delete post
                      </button>
                    </>
                  ) : (
                    <>
                      <button style={menuItemStyle} onClick={() => setShowMenu(false)}>
                        🔔 &nbsp; Follow post
                      </button>
                      <button style={menuItemStyle} onClick={() => { handleSave(); setShowMenu(false); }}>
                        🔖 &nbsp; {isSaved ? "Unsave" : "Save post"}
                      </button>
                      <button style={menuItemStyle} onClick={() => setShowMenu(false)}>
                        ↗️ &nbsp; Share to
                      </button>
                      <button style={menuItemStyle} onClick={handleCopyText}>
                        📋 &nbsp; Copy text
                      </button>
                      <button style={menuItemStyle} onClick={() => setShowMenu(false)}>
                        🙈 &nbsp; Hide post
                      </button>
                      <button style={{ ...menuItemStyle, borderTop: "1px solid var(--border)" }} onClick={() => setShowMenu(false)}>
                        🚩 &nbsp; Report
                      </button>
                      <button style={{ ...menuItemStyle, color: "#E8445A" }} onClick={() => setShowMenu(false)}>
                        🚫 &nbsp; Block account
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Post Title */}
        <Link href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
          <h3 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--text)",
            margin: "0 0 6px 0",
            lineHeight: 1.4,
          }}>
            {post.title}
          </h3>
        </Link>

        {/* Preview Text */}
        {post.content && (
          <p style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            fontFamily: "var(--font-body)",
            lineHeight: 1.5,
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
        {post.file_url && (() => {
          const kind = resolveMediaKind(post.file_url, post.file_type);
          const fileName = getFileName(post.file_url);

          if (kind === "image") {
            return (
              <img
                src={post.file_url}
                alt={fileName}
                loading="lazy"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "480px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  marginBottom: "8px",
                }}
              />
            );
          }

          if (kind === "video") {
            return (
              <video
                src={post.file_url}
                controls
                preload="metadata"
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "480px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "#000",
                  marginBottom: "8px",
                }}
              />
            );
          }

          if (kind === "audio") {
            return (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "rgba(13, 148, 136, 0.06)",
                marginBottom: "8px",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "rgba(13, 148, 136, 0.12)",
                  color: "#0D9488",
                  flexShrink: 0,
                }}>
                  <Music size={18} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: 0, flex: 1 }}>
                  <span style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}>
                    {fileName}
                  </span>
                  <audio src={post.file_url} controls preload="metadata" style={{ width: "100%", height: "32px" }} />
                </div>
              </div>
            );
          }

          return (
            <a
              href={post.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                borderRadius: "20px",
                border: "1px solid rgba(13, 148, 136, 0.3)",
                background: "rgba(13, 148, 136, 0.1)",
                color: "#0D9488",
                fontSize: "12px",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                textDecoration: "none",
                marginBottom: "8px",
                maxWidth: "100%",
              }}
            >
              <FileText size={14} style={{ flexShrink: 0 }} />
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {fileName}
              </span>
              <Download size={14} style={{ flexShrink: 0 }} />
            </a>
          );
        })()}

        {/* Author Row */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}>
          <Link href={`/profile/${post.author.username}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            textDecoration: "none",
          }}>
            <UserAvatar 
              avatarUrl={post.author.avatar_url}
              fullName={post.author.full_name}
              size={20}
            />
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
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
          <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
            {timeAgo(post.created_at)}
          </span>
        </div>

        {/* Action Buttons Row — Reddit style */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
          paddingTop: "8px",
          borderTop: "1px solid var(--border)",
        }}>
          {/* Upvote */}
          <button
            onClick={() => handleVote("up")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1.5px solid ${userVote === "up" ? "#F97316" : "var(--border)"}`,
              background: userVote === "up" ? "rgba(249,115,22,0.1)" : "transparent",
              color: userVote === "up" ? "#F97316" : "var(--text-muted)",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              cursor: currentUserId ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <ArrowUp size={14} strokeWidth={userVote === "up" ? 2.5 : 1.8} />
            {votes > 0 ? votes : "Vote"}
          </button>

          {/* Downvote */}
          <button
            onClick={() => handleVote("down")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 10px",
              borderRadius: "20px",
              border: `1.5px solid ${userVote === "down" ? "#0084FF" : "var(--border)"}`,
              background: userVote === "down" ? "rgba(0,132,255,0.1)" : "transparent",
              color: userVote === "down" ? "#0084FF" : "var(--text-muted)",
              fontSize: "12px",
              cursor: currentUserId ? "pointer" : "default",
              transition: "all 0.2s",
            }}
          >
            <ArrowDown size={14} strokeWidth={userVote === "down" ? 2.5 : 1.8} />
          </button>

          {/* Comments */}
          <Link href={`/post/${post.id}`} style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "6px 12px",
            borderRadius: "20px",
            border: "1.5px solid var(--border)",
            background: "transparent",
            color: "var(--text-muted)",
            fontSize: "12px",
            fontFamily: "var(--font-display)",
            fontWeight: 500,
            textDecoration: "none",
            transition: "all 0.2s",
          }}>
            <MessageSquare size={14} />
            {post.comment_count || 0}
          </Link>

          {/* Save */}
          <button
            onClick={handleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: `1.5px solid ${isSaved ? "#0D9488" : "var(--border)"}`,
              background: isSaved ? "rgba(13,148,136,0.1)" : "transparent",
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

          {/* Share */}
          <button
            onClick={() => navigator.share?.({ title: post.title, url: window.location.origin + `/post/${post.id}` })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              padding: "6px 12px",
              borderRadius: "20px",
              border: "1.5px solid var(--border)",
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

const menuItemStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 16px",
  border: "none",
  background: "transparent",
  color: "var(--text)",
  fontSize: "13px",
  cursor: "pointer",
  textAlign: "left",
  fontFamily: "var(--font-body)",
  display: "block",
};
