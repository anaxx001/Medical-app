import { useState, useEffect } from "react";
import { Newspaper, Pin, ChevronRight, AlertCircle } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { formatDateFull } from "@/lib/formatters";
import { Link } from "wouter";

interface NewsPost {
  id: string;
  title: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  author: {
    full_name: string;
    username: string;
    role: string;
  };
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (profile?.role) setUserRole(profile.role);
        }

        const { data, error } = await supabase
          .from("posts")
          .select(`
            id, title, content, created_at, is_pinned,
            author:profiles(full_name, username, role)
          `)
          .eq("community_slug", "announcements")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (!error && data) setPosts(data as any);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const canPost = userRole === "superadmin" || userRole === "super_admin" || userRole === "app_admin" || userRole === "admin" || userRole === "moderator";



  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Newspaper size={26} color="#0D9488" strokeWidth={2} />
            <h1 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "26px",
              color: "var(--text)",
              margin: 0,
            }}>
              Campus News
            </h1>
          </div>

          {canPost && (
            <Link href="/create?community=announcements">
              <button style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: "var(--gradient)",
                color: "white",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
              }}>
                + Post News
              </button>
            </Link>
          )}
        </div>

        {/* Info banner for students */}
        {!canPost && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(13, 148, 136, 0.08)",
            border: "1px solid rgba(13, 148, 136, 0.2)",
            borderRadius: "var(--radius-sm)",
            padding: "12px 16px",
            marginBottom: "20px",
          }}>
            <AlertCircle size={16} color="#0D9488" />
            <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
              News and announcements are posted by verified campus moderators only.
            </p>
          </div>
        )}

        {/* Loading state */}
        {loading && <LoadingList count={3} />}

        {/* Empty state */}
        {!loading && posts.length === 0 && (
          <EmptyState
            emoji="📰"
            title="No news yet"
            description="Campus announcements and updates will appear here. Check back soon!"
          />
        )}

        {/* News feed */}
        {!loading && posts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {posts.map((post) => (
              <Link key={post.id} href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
                <div style={{
                  background: "var(--surface)",
                  borderRadius: "var(--radius)",
                  border: `1px solid ${post.is_pinned ? "rgba(13,148,136,0.4)" : "var(--border)"}`,
                  padding: "16px 18px",
                  cursor: "pointer",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}>

                  {post.is_pinned && (
                    <div style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "rgba(13,148,136,0.1)",
                      color: "#0D9488",
                      fontSize: "11px",
                      fontWeight: 700,
                      fontFamily: "var(--font-display)",
                      padding: "3px 8px",
                      borderRadius: "99px",
                      marginBottom: "8px",
                    }}>
                      <Pin size={10} />
                      PINNED
                    </div>
                  )}

                  <h3 style={{
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "15px",
                    color: "var(--text)",
                    margin: "0 0 6px 0",
                  }}>
                    {post.title}
                  </h3>

                  <p style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: "0 0 12px 0",
                    lineHeight: "1.5",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}>
                    {post.content}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "var(--gradient)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        color: "white",
                        fontWeight: 700,
                      }}>
                        {post.author?.full_name?.[0] ?? "M"}
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)" }}>
                        {post.author?.full_name ?? "MedStudent Team"}
                      </span>
                      <span style={{
                        fontSize: "10px",
                        background: "rgba(13,148,136,0.1)",
                        color: "#0D9488",
                        padding: "1px 6px",
                        borderRadius: "99px",
                        fontWeight: 600,
                        fontFamily: "var(--font-display)",
                        textTransform: "capitalize",
                      }}>
                        {post.author?.role ?? "moderator"}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--text-muted)" }}>
                      <span style={{ fontSize: "12px" }}>{formatDateFull(post.created_at)}</span>
                      <ChevronRight size={14} />
                    </div>
                  </div>
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