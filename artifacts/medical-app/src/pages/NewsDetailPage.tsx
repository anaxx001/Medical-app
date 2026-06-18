import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, Pin, Edit3, Trash2, MapPin, Play, Link2, 
  ExternalLink, Calendar, Clock, Share2, AlertCircle, ChevronRight 
} from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { formatDateFull, timeAgo } from "@/lib/formatters";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string | null;
  body: string;
  type: "news" | "video" | "link";
  media_url: string | null;
  media_thumbnail: string | null;
  university_tags: string[];
  is_pinned: boolean;
  pin_expires_at: string | null;
  status: "draft" | "published" | "archived";
  created_by: string;
  created_at: string;
  updated_at: string;
  author?: {
    full_name: string;
    username: string;
    role: string;
    avatar_url: string | null;
  };
}



function getRoleBadge(role: string | undefined): { label: string; color: string } {
  if (!role) return { label: "Unknown", color: "#6B7280" };
  const normalized = role.toLowerCase().replace(/_/g, "");
  if (normalized.includes("superadmin") || normalized === "appadmin") {
    return { label: "Admin", color: "#0D9488" };
  }
  if (normalized.includes("admin")) return { label: "Admin", color: "#0D9488" };
  if (normalized.includes("moderator")) return { label: "Moderator", color: "#F59E0B" };
  return { label: "Student", color: "#6B7280" };
}

function isPinExpired(pinExpiresAt: string | null): boolean {
  if (!pinExpiresAt) return false;
  return new Date(pinExpiresAt) < new Date();
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "External Link";
  }
}

function Avatar({ name, avatar, size = 40 }: { name: string; avatar: string | null; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.4,
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        overflow: "hidden",
      }}
    >
      {avatar ? (
        <img src={avatar} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
      ) : (
        name?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

export default function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [post, setPost] = useState<NewsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<NewsPost[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [allUniversities, setAllUniversities] = useState<{slug: string, name: string}[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUserId(user.id);

          const { data: perms } = await supabase
            .from("user_permissions")
            .select("permissions, role")
            .eq("user_id", user.id)
            .single();

          if (perms) {
            setUserPermissions(perms.permissions || []);
            setUserRole(perms.role);
          }
        }

        const { data: postData, error: postError } = await supabase
          .from("news_posts")
          .select(`
            id, title, excerpt, body, type, media_url, media_thumbnail,
            university_tags, is_pinned, pin_expires_at, status,
            created_by, created_at, updated_at,
            author:profiles!news_posts_created_by_fkey(full_name, username, role, avatar_url)
          `)
          .eq("id", id)
          .eq("status", "published")
          .single();

        if (postError || !postData) {
          setPost(null);
          setLoading(false);
          return;
        }

        const enrichedPost = {
          ...postData,
          is_pinned: postData.is_pinned && !isPinExpired(postData.pin_expires_at),
          author: Array.isArray(postData.author) ? postData.author[0] : postData.author,
        } as NewsPost;

        setPost(enrichedPost);

        const { data: related } = await supabase
          .from("news_posts")
          .select(`
            id, title, excerpt, type, media_thumbnail, university_tags, created_at,
            author:profiles!news_posts_created_by_fkey(full_name, role)
          `)
          .eq("status", "published")
          .neq("id", id)
          .overlaps("university_tags", enrichedPost.university_tags || [])
          .order("created_at", { ascending: false })
          .limit(3);

        setRelatedPosts((related as any[])?.map(r => ({
          ...r,
          author: Array.isArray(r.author) ? r.author[0] : r.author,
        })) || []);

      } catch (err) {
        console.error("Detail load error:", err);
      } finally {
        setLoading(false);
      }
    

    // Fetch all universities from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("university")
      .not("university", "is", null);

    const uniSet = new Set<string>();
    uniSet.add("global");
    (profiles || []).forEach((p: any) => {
      if (p.university) uniSet.add(p.university.toLowerCase().trim());
    });

    const uniList = Array.from(uniSet).map(slug => ({
      slug,
      name: slug === "global" ? "All Universities" : slug.toUpperCase().replace(/-/g, " "),
    })).sort((a, b) => (a.slug === "global" ? -1 : a.name.localeCompare(b.name)));

    setAllUniversities(uniList);}

    if (id) load();
  }, [id]);

  const canEdit = post && (
    currentUserId === post.created_by || 
    userPermissions.includes("news:edit_any") ||
    ["super_admin", "app_admin"].includes(userRole || "")
  );

  const canDelete = post && (
    userPermissions.includes("news:delete") ||
    userRole === "super_admin"
  );

  const handleDelete = async () => {
    if (!post || !canDelete) return;
    setDeleteLoading(true);

    const { error } = await supabase
      .from("news_posts")
      .delete()
      .eq("id", post.id);

    if (!error) {
      navigate("/news");
    } else {
      console.error("Delete failed:", error);
      setDeleteLoading(false);
      setDeleteConfirm(false);
    }
  };

  const renderMedia = () => {
    if (!post?.media_url) return null;

    if (post.type === "video") {
      const embedUrl = getYouTubeEmbedUrl(post.media_url);
      if (embedUrl) {
        return (
          <div style={{
            position: "relative",
            width: "100%",
            paddingBottom: "56.25%",
            borderRadius: "12px",
            overflow: "hidden",
            background: "#000",
            marginBottom: "24px",
          }}>
            <iframe
              src={embedUrl}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: "none",
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <div style={{
          width: "100%",
          height: "200px",
          borderRadius: "12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          marginBottom: "24px",
        }}>
          <Play size={32} color="#0D9488" />
          <a 
            href={post.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ color: "#0D9488", fontSize: "13px", fontWeight: 600 }}
          >
            Watch Video <ExternalLink size={12} style={{ display: "inline", marginLeft: "4px" }} />
          </a>
        </div>
      );
    }

    if (post.type === "link") {
      return (
        <a
          href={post.media_url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "16px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            marginBottom: "24px",
            textDecoration: "none",
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(13, 148, 136, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border)";
          }}
        >
          <div style={{
            width: "48px",
            height: "48px",
            borderRadius: "12px",
            background: "rgba(13, 148, 136, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Link2 size={20} color="#0D9488" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {post.title}
            </p>
            <p style={{ fontSize: "12px", color: "#0D9488", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
              {getDomain(post.media_url)}
              <ExternalLink size={12} />
            </p>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </a>
      );
    }

    return null;
  };

  const renderTags = () => {
    if (!post?.university_tags?.length) return null;
    return (
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "20px" }}>
        {post.university_tags.map(tag => {
          const uni = allUniversities.find(u => u.slug === tag);
          return (
            <span key={tag} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              padding: "4px 10px",
              borderRadius: "99px",
              background: tag === "global" ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
              color: tag === "global" ? "#0D9488" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
              <MapPin size={12} />
              {uni?.name || tag}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "20px 0" }}>
          <LoadingList count={1} />
        </div>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 0" }}>
          <EmptyState
            emoji="🔍"
            title="News not found"
            description="This post may have been removed or is not yet published."
          />
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={() => navigate("/news")}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              ← Back to News
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const roleBadge = getRoleBadge(post.author?.role);
  const isUpdated = new Date(post.updated_at).getTime() > new Date(post.created_at).getTime() + 60000;

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "16px 0 40px" }}>

        <button
          onClick={() => navigate("/news")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            fontSize: "13px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "20px",
            padding: "4px 0",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
        >
          <ArrowLeft size={16} />
          Back to News
        </button>

        {post.is_pinned && (
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            background: "rgba(13, 148, 136, 0.1)",
            color: "#0D9488",
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-display)",
            padding: "4px 10px",
            borderRadius: "99px",
            marginBottom: "12px",
          }}>
            <Pin size={12} />
            PINNED ANNOUNCEMENT
          </div>
        )}

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "28px",
          color: "var(--text)",
          margin: "0 0 16px 0",
          lineHeight: 1.2,
        }}>
          {post.title}
        </h1>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Avatar 
              name={post.author?.full_name || "M"} 
              avatar={post.author?.avatar_url || null} 
              size={36} 
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                  {post.author?.full_name || "MedStudent Team"}
                </span>
                <span style={{
                  fontSize: "10px",
                  background: `${roleBadge.color}15`,
                  color: roleBadge.color,
                  padding: "1px 6px",
                  borderRadius: "99px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                }}>
                  {roleBadge.label}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} />
                  {formatDateFull(post.created_at)}
                </span>
                {isUpdated && (
                  <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={12} />
                    Updated {timeAgo(post.updated_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            {canEdit && (
              <button
                onClick={() => navigate(`/news/edit/${post.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Edit3 size={14} />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setDeleteConfirm(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  border: "1px solid #EF4444",
                  background: "rgba(239, 68, 68, 0.05)",
                  color: "#EF4444",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>

        {deleteConfirm && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            padding: "20px",
          }}>
            <div style={{
              background: "var(--surface)",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
            }}>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", margin: "0 0 8px 0", color: "var(--text)" }}>
                Delete this post?
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 20px 0" }}>
                This action cannot be undone. The post "{post.title}" will be permanently removed.
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#EF4444",
                    color: "white",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: deleteLoading ? "not-allowed" : "pointer",
                    opacity: deleteLoading ? 0.7 : 1,
                  }}
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        {renderTags()}
        {renderMedia()}

        <div style={{ marginBottom: "32px" }}>
          <div
            style={{
              fontSize: "15px",
              lineHeight: "1.7",
              color: "var(--text)",
              fontFamily: "var(--font-body)",
            }}
            dangerouslySetInnerHTML={{ 
              __html: post.body.replace(/\n/g, "<br/>") 
            }}
          />
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 0",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          marginBottom: "32px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-muted)" }}>
            <AlertCircle size={14} />
            This post is for informational purposes. Verify details with your institution.
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text-muted)",
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: "pointer",
            }}
          >
            <Share2 size={14} />
            Copy Link
          </button>
        </div>

        {relatedPosts.length > 0 && (
          <div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--text)",
              margin: "0 0 16px 0",
            }}>
              More from {post.university_tags?.includes("global") ? "Campus News" : "your university"}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {relatedPosts.map(related => {
                const relatedBadge = getRoleBadge(related.author?.role);
                return (
                  <div
                    key={related.id}
                    onClick={() => navigate(`/news/${related.id}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 14px",
                      background: "var(--surface)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      transition: "border-color 0.2s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(13, 148, 136, 0.3)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
                  >
                    {related.media_thumbnail && (
                      <img 
                        src={related.media_thumbnail} 
                        alt="" 
                        style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} 
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {related.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          {related.author?.full_name || "MedStudent"}
                        </span>
                        <span style={{ fontSize: "10px", background: `${relatedBadge.color}15`, color: relatedBadge.color, padding: "1px 5px", borderRadius: "99px", fontWeight: 600 }}>
                          {relatedBadge.label}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
