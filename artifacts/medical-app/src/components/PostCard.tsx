import { useState } from "react";
import { Link } from "wouter";
import { ArrowUp, ArrowDown, MessageSquare, Share2, Pin, Megaphone } from "lucide-react";
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

  return (
    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: `1px solid ${post.is_announcement ? "var(--blue)" : post.is_pinned ? "var(--green)" : "var(--border)"}`, boxShadow: "var(--shadow)", overflow: "hidden", transition: "box-shadow 0.2s ease" }}>
      {(post.is_announcement || post.is_pinned) && (
        <div style={{ padding: "7px 16px", background: post.is_announcement ? "linear-gradient(90deg, #EBF5FF, #F0F6FA)" : "linear-gradient(90deg, #EDFFF5, #F0FAF5)", display: "flex", alignItems: "center", gap: "6px", borderBottom: `1px solid ${post.is_announcement ? "var(--blue-light)" : "var(--green-light)"}` }}>
          {post.is_announcement ? <Megaphone size={13} color="var(--blue)" /> : <Pin size={13} color="var(--green)" />}
          <span style={{ fontSize: "11.5px", fontFamily: "var(--font-display)", fontWeight: 600, color: post.is_announcement ? "var(--blue-dark)" : "var(--green-dark)" }}>
            {post.is_announcement ? "Announcement" : "Pinned"}
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "0" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 10px", gap: "4px", background: "var(--surface-2)", minWidth: "44px" }}>
          <button onClick={() => handleVote("up")} style={{ background: "none", border: "none", cursor: currentUserId ? "pointer" : "default", padding: "4px", borderRadius: "6px", display: "flex", color: userVote === "up" ? "var(--blue)" : "var(--text-light)", transition: "all 0.15s ease" }}>
            <ArrowUp size={18} strokeWidth={userVote === "up" ? 2.5 : 1.8} />
          </button>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", color: userVote === "up" ? "var(--blue)" : userVote === "down" ? "#E8445A" : "var(--text-muted)" }}>
            {votes}
          </span>
          <button onClick={() => handleVote("down")} style={{ background: "none", border: "none", cursor: currentUserId ? "pointer" : "default", padding: "4px", borderRadius: "6px", display: "flex", color: userVote === "down" ? "#E8445A" : "var(--text-light)", transition: "all 0.15s ease" }}>
            <ArrowDown size={18} strokeWidth={userVote === "down" ? 2.5 : 1.8} />
          </button>
        </div>

        <div style={{ flex: 1, padding: "14px 16px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
            <Link href={`/c/${post.community.slug}`} style={{ display: "flex", alignItems: "center", gap: "5px", textDecoration: "none" }}>
              <span style={{ fontSize: "14px" }}>{post.community.icon}</span>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12px", color: "var(--blue)" }}>
                {post.community.name}
              </span>
            </Link>
            <span style={{ color: "var(--text-light)", fontSize: "11px" }}>•</span>
            <span style={{ fontSize: "11.5px", color: "var(--text-light)", fontFamily: "var(--font-body)" }}>
              {timeAgo(post.created_at)}
            </span>
          </div>

          <Link href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
            <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "6px", lineHeight: 1.3 }}>
              {post.title}
            </h3>
          </Link>

          {post.content && (
            <p style={{ fontSize: "13.5px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.5, marginBottom: "10px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {post.content}
            </p>
          )}

          {post.file_url && (
            <a href={post.file_url} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "99px", background: "var(--gradient-soft)", border: "1px solid var(--border)", fontSize: "12px", color: "var(--blue)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600, marginBottom: "10px" }}>
              📎 {post.file_type === "pdf" ? "PDF" : "File"} attached
            </a>
          )}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
            <Link href={`/profile/${post.author.username}`} style={{ display: "flex", alignItems: "center", gap: "7px", textDecoration: "none" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                {post.author.avatar_url
                  ? <img src={post.author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                  : getInitials(post.author.full_name || post.author.username)}
              </div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
                u/{post.author.username}
              </span>
              {post.author.profession && (
                <span style={{ fontSize: "11px", color: "var(--text-light)", fontFamily: "var(--font-body)" }}>
                  · {post.author.profession}
                </span>
              )}
            </Link>

            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Link href={`/post/${post.id}`} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "99px", background: "transparent", border: "none", color: "var(--text-light)", textDecoration: "none", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 500, cursor: "pointer" }}>
                <MessageSquare size={14} />
                {post.comment_count || 0}
              </Link>
              <button
                onClick={() => navigator.share?.({ title: post.title, url: window.location.origin + `/post/${post.id}` })}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "99px", background: "transparent", border: "none", color: "var(--text-light)", fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 500, cursor: "pointer" }}
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
