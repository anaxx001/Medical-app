"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function FeedPage() {
  const supabase = createClient();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    async function initFeed() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setCurrentUserId(session.user.id);

      // Fetch latest global posts
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
        .order("created_at", { ascending: false })
        .limit(30);

      setPosts(
        (postsData || []).map((p: any) => ({
          ...p,
          comment_count: Array.isArray(p.comment_count)
            ? (p.comment_count[0]?.count || 0)
            : (p.comment_count?.count || 0),
          user_vote: null,
        }))
      );
      setLoading(false);
    }
    initFeed();
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px 24px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>
            Main Feed
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Latest discussions across MedStudent</p>
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--radius)", height: "140px", border: "1px solid var(--border)", opacity: 0.6 }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>🌱</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", color: "var(--text-muted)" }}>The feed is quiet. Be the first to post!</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map(post => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
