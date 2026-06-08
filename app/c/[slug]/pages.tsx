"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase/client";

interface Community {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export default function CommunityPage() {
  const { slug } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    async function loadCommunityData() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }
      setCurrentUserId(session.user.id);

      // 1. Fetch community details matching slug
      const { data: commData } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!commData) {
        router.push("/feed");
        return;
      }
      setCommunity(commData);

      // 2. Fetch posts belonging specifically to this community
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
        .eq("community_id", commData.id)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false });

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

    if (slug) loadCommunityData();
  }, [slug]);

  if (loading) return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "20px 16px" }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", height: "180px", border: "1px solid var(--border)", opacity: 0.6 }} />
      </div>
    </AppShell>
  );

  if (!community) return null;

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "0 16px 24px" }}>
        {/* Banner Header */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <span style={{ fontSize: "28px" }}>{community.icon}</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)", margin: 0 }}>
              {community.name}
            </h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: 0, lineHeight: 1.5 }}>
            {community.description || `Welcome to the official ${community.name} group workspace.`}
          </p>
        </div>

        {/* Posts Area */}
        {posts.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>✏️</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text-muted)" }}>No posts here yet. Start the conversation!</p>
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
