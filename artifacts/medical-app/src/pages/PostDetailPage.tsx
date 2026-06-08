import { useEffect, useState, useCallback } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase";
import { useParams, useLocation } from "wouter";
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

export default function PostDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);

    const { data: postData } = await supabase
      .from("posts")
      .select(`
        id, title, content, file_url, file_type,
        is_announcement, is_pinned, upvotes, downvotes, created_at,
        author:profiles!author_id(id, username, full_name, avatar_url, profession),
        community:communities!community_id(id, name, slug, icon),
        comment_count:comments(count)
      `)
      .eq("id", id)
      .single();

    if (postData) {
      let userVote = null;
      if (user) {
        const { data: voteData } = await supabase
          .from("post_votes")
          .select("vote_type")
          .eq("post_id", id)
          .eq("user_id", user.id)
          .single();
        if (voteData) userVote = voteData.vote_type;
      }
      // @ts-ignore
      setPost({ ...postData, comment_count: postData.comment_count?.[0]?.count || 0, user_vote: userVote });
    }

    const { data: commentsData } = await supabase
      .from("comments")
      .select(`
        id, content, created_at,
        author:profiles!author_id(id, username, full_name, avatar_url, profession)
      `)
      .eq("post_id", id)
      .order("created_at", { ascending: true });

    // @ts-ignore
    setComments(commentsData || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleSubmitComment() {
    if (!newComment.trim() || !currentUserId) return;
    setSubmitting(true);
    const { error } = await supabase.from("comments").insert({
      post_id: id,
      author_id: currentUserId,
      content: newComment.trim(),
    });
    if (!error) {
      setNewComment("");
      fetchData();
    }
    setSubmitting(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Delete this comment?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  }

  if (loading) return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "14px" }}>Loading post...</p>
      </div>
    </AppShell>
  );

  if (!post) return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "14px" }}>Post not found.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <PostCard post={post} currentUserId={currentUserId} />

        <div style={{ marginTop: "24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "16px" }}>
            {comments.length} Comment{comments.length !== 1 ? "s" : ""}
          </h3>

          {currentUserId && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px", marginBottom: "20px", display: "flex", gap: "10px", alignItems: "flex-end" }}>
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                rows={2}
                style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none" }}
              />
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                style={{ width: "38px", height: "38px", borderRadius: "10px", border: "none", background: newComment.trim() ? "var(--gradient)" : "var(--border)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", cursor: newComment.trim() ? "pointer" : "not-allowed", flexShrink: 0 }}
              >
                <Send size={15} />
              </button>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {comments.map(comment => (
              <div key={comment.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
                      {comment.author.avatar_url
                        ? <img src={comment.author.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                        : getInitials(comment.author.full_name || comment.author.username)}
                    </div>
                    <div>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>u/{comment.author.username}</span>
                      {comment.author.profession && <span style={{ fontSize: "11.5px", color: "var(--text-light)", marginLeft: "6px" }}>· {comment.author.profession}</span>}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text-light)" }}>{timeAgo(comment.created_at)}</span>
                  </div>
                  {currentUserId === comment.author.id && (
                    <button onClick={() => handleDeleteComment(comment.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", padding: "2px", display: "flex" }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>{comment.content}</p>
              </div>
            ))}
          </div>

          {comments.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>No comments yet. Be the first to reply!</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
