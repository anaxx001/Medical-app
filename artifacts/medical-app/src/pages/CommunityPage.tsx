import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { POST_SELECT_FIELDS } from "@/lib/constants";
import { normalizePosts } from "@/lib/posts";
import { useParams, Link } from "wouter";
import { PenSquare } from "lucide-react";

import type { Community } from "@/lib/types";

export default function CommunityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: communityData } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!communityData) { setLoading(false); return; }
      setCommunity(communityData);

      const { data: postsData } = await supabase
        .from("posts")
        .select(POST_SELECT_FIELDS)
        .eq("community_id", communityData.id)
        .order("upvotes", { ascending: false })
        .limit(30);

      setPosts(normalizePosts((postsData || []) as Record<string, unknown>[]));
      setLoading(false);
    }
    fetchData();
  }, [slug]);

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        {community && (
          <div style={{ background: "linear-gradient(135deg, rgba(45,135,200,0.08), rgba(61,190,122,0.06))", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px" }}>
                {community.icon}
              </div>
              <div>
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)", marginBottom: "2px" }}>
                  {community.name}
                </h1>
                {community.description && (
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>{community.description}</p>
                )}
              </div>
            </div>
            <Link href={`/create?community=${community.slug}`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px", borderRadius: "99px", background: "var(--gradient)", color: "white", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
              <PenSquare size={14} /> Post
            </Link>
          </div>
        )}

        {loading ? (
          <LoadingList count={3} height="140px" />
        ) : posts.length === 0 ? (
          <EmptyState emoji="🌱" title="No posts in this community yet." description="Be the first to share something!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map(post => <PostCard key={post.id} post={post} currentUserId={currentUserId} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}
