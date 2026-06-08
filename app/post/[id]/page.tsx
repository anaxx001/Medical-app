"use client";

import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useParams, useRouter } from "next/navigation";
import { Send, Trash2 } from "lucide-react";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
    profession?: string;
  };
}

// Helper: Calculates time elapsed since comment creation
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

// Helper: Extracts up to two initials from user's full name
function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function PostDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  // Fetch current user authenticated state
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, [supabase.auth]);

  // Fetch individual post data based on URL parameter id
  const fetchPost = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("posts")
        .select(`
          id, title, content, file_url, file_type,
          is_announcement, is_pinned, upvotes, downvotes,
          created_at,
          author:profiles!author_id (
            id, username, full_name, avatar_url, profession
          ),
          community:communities!community_id (
            id, name, slug, icon
          ),
          comment_count:comments(count)
        `)
        .eq("id", id)
        .single();
      if (data) {
        setPost({
          ...data,
          comment_count: data.comment_count?.[0]?.count || 0,
          user_vote: null,
        });
      }
    } finally {
      setLoading(false);
    }
  }, [id, supabase]);

  // Fetch associated thread comments 
  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        id, content, created_at,
        author:profiles!author_id (
          id, username, full_name, avatar_url, profession
        )
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (data) setComments(data as any);
  }, [id, supabase]);

  // Handle side effects of dynamic route identification
  useEffect(() => {
    if (!id) return;
    fetchPost();
    fetchComments();
  }, [id, fetchPost, fetchComments]);

  // Action: Insert new user comment to database
  async function handleComment() {
    if (!newComment.trim() || !currentUserId) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("comments").insert({
        post_id: id,
        author_id: currentUserId,
        content: newComment.trim(),
      });
      if (error) throw error;
      setNewComment("");
      fetchComments();
    } finally {
      setSubmitting(false);
    }
  }

  // Action: Remove specific comment owned by current user
  async function handleDeleteComment(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(c => c.filter(x => x.id !== commentId));
  }

  if (loading) return (
    <AppShell>
      <div style={{ maxWidth:"680px", margin:"0 auto" }}>
        <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", height:"200px", border:"1px solid var(--border)", opacity:0.6 }} />
      </div>
    </AppShell>
  );

  if (!post) return (
    <AppShell>
      <div style={{ maxWidth:"680px", margin:"0 auto", textAlign:"center", padding:"60px 20px" }}>
        <div style={{ fontSize:"48px", marginBottom:"12px" }}>🔍</div>
        <h2 style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"18px", color:"var(--text)", marginBottom:"8px" }}>Post not found</h2>
        <button onClick={() => router.push("/")} style={{ padding:"10px 24px", borderRadius:"99px", border:"none", background:"var(--gradient)", color:"white", fontFamily:"var(--font-display)", fontWeight:600, cursor:"pointer" }}>
          Go Home
        </button>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth:"680px", margin:"0 auto", display:"flex", flexDirection:"column", gap:"16px" }}>

        {/* Post */}
        <PostCard post={post} currentUserId={currentUserId} />

        {/* Comment input */}
        <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"16px", boxShadow:"var(--shadow)" }}>
          <p style={{ fontFamily:"var(--font-display)", fontWeight:700, fontSize:"14px", color:"var(--text)", marginBottom:"10px" }}>
            {comments.length} Comment{comments.length !== 1 ? "s" : ""}
          </p>
          {currentUserId ? (
            <div style={{ display:"flex", gap:"10px", alignItems:"flex-end" }}>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={3}
                style={{ flex:1, padding:"11px 14px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--surface-2)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none", resize:"none", lineHeight:1.5 }}
              />
              <button
                onClick={handleComment}
                disabled={submitting || !newComment.trim()}
                style={{ padding:"11px 16px", borderRadius:"var(--radius-sm)", border:"none", background: newComment.trim() ? "var(--gradient)" : "var(--border)", color: newComment.trim() ? "white" : "var(--text-light)", cursor: newComment.trim() ? "pointer" : "not-allowed", display:"flex", alignItems:"center", justifyContent:"center", boxShadow: newComment.trim() ? "0 2px 10px rgba(45,135,200,0.3)" : "none", flexShrink:0 }}
              >
                <Send size={16} />
              </button>
            </div>
          ) : (
            <p style={{ fontSize:"13.5px", color:"var(--text-muted)", textAlign:"center", padding:"12px" }}>
              <a href="/login" style={{ color:"var(--blue)", fontWeight:600, textDecoration:"none" }}>Log in</a> to join the discussion
            </p>
          )}
        </div>

        {/* Comments list */}
        {comments.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ background:"var(--surface)", borderRadius:"var(--radius)", border:"1px solid var(--border)", padding:"14px 16px", boxShadow:"var(--shadow)" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:"var(--gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11px", color:"white", fontFamily:"var(--font-display)", fontWeight:700, flexShrink:0, overflow:"hidden" }}>
                      {comment.author.avatar_url
                        ? <img src={comment.author.avatar_url} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
                        : getInitials(comment.author.full_name || comment.author.username)}
                    </div>
                    <div>
                      <span style={{ fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)" }}>
                        u/{comment.author.username}
                      </span>
                      {comment.author.profession && (
                        <span style={{ fontSize:"11px", color:"var(--text-light)", marginLeft:"6px" }}>
                          · {comment.author.profession}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
                    <span style={{ fontSize:"11.5px", color:"var(--text-light)" }}>
                      {timeAgo(comment.created_at)}
                    </span>
                    {currentUserId === comment.author.id && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text-light)", display:"flex", padding:"2px" }}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
                <p style={{ fontSize:"13.5px", color:"var(--text)", fontFamily:"var(--font-body)", lineHeight:1.6 }}>
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
