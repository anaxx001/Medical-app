import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { Link } from "wouter";
import { Bookmark } from "lucide-react";

interface SavedPost {
  id: string;
  post: {
    id: string;
    title: string;
    content: string;
    created_at: string;
    community: {
      name: string;
      slug: string;
    };
    author: {
      full_name: string;
      username: string;
    };
  };
}

export default function SavedPostsPage() {
  const supabase = createClient();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("saved_posts")
        .select(`
          id,
          post:posts(
            id, title, content, created_at,
            community:communities(name, slug),
            author:profiles(full_name, username)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setPosts(data as any);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <Bookmark size={24} color="#0D9488" />
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "26px",
            color: "var(--text)",
            margin: 0,
          }}>
            Saved Posts
          </h1>
        </div>

        {/* Loading */}
        {loading && <LoadingList count={3} height="90px" />}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <EmptyState
            emoji="🔖"
            title="No saved posts yet"
            description="When you save a post it will appear here for easy access later."
          />
        )}

        {/* Posts list */}
        {!loading && posts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map(({ id, post }) => (
              <Link key={id} href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  padding: "16px 18px",
                  cursor: "pointer",
                  transition: "box-shadow 0.2s",
                }}>
                  <p style={{
                    fontSize: "11px",
                    color: "#0D9488",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    margin: "0 0 6px 0",
                  }}>
                    r/{post.community?.slug ?? "general"}
                  </p>
                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--text)",
                    margin: "0 0 6px 0",
                  }}>
                    {post.title}
                  </h3>
                  {post.content && (
                    <p style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      margin: "0 0 10px 0",
                      lineHeight: "1.5",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {post.content}
                    </p>
                  )}
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    by {post.author?.full_name ?? "Unknown"} · {new Date(post.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    </AppShell>
  );
}