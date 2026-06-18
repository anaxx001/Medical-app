import { useState, useEffect } from "react";
import { Newspaper, Pin, ChevronRight, AlertCircle, Play, Link2, MapPin, Filter } from "lucide-react";
import AppShell from "@/components/AppShell";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { formatDateFull, timeAgo } from "@/lib/formatters";
import { Link } from "wouter";

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
  };
}



function getRoleBadge(role: string | undefined): { label: string; color: string } {
  if (!role) return { label: "Unknown", color: "#6B7280" };
  const normalized = role.toLowerCase().replace(/_/g, "");
  if (normalized.includes("superadmin") || normalized === "appadmin") {
    return { label: "Admin", color: "#0D9488" };
  }
  if (normalized.includes("admin")) {
    return { label: "Admin", color: "#0D9488" };
  }
  if (normalized.includes("moderator")) {
    return { label: "Moderator", color: "#F59E0B" };
  }
  return { label: "Student", color: "#6B7280" };
}

function isPinExpired(pinExpiresAt: string | null): boolean {
  if (!pinExpiresAt) return false;
  return new Date(pinExpiresAt) < new Date();
}

function getYouTubeThumbnail(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return "External Link";
  }
}

export default function NewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [allUniversities, setAllUniversities] = useState<{slug: string, name: string, count: number}[]>([]);
  const [uniSearch, setUniSearch] = useState("");
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [userUniversity, setUserUniversity] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, university")
            .eq("id", user.id)
            .single();

          if (profile?.role) setUserRole(profile.role);
          if (profile?.university) setUserUniversity(profile.university);

          const { data: perms } = await supabase
            .from("user_permissions")
            .select("permissions")
            .eq("user_id", user.id)
            .single();

          if (perms?.permissions) setUserPermissions(perms.permissions);
        }

        let query = supabase
          .from("news_posts")
          .select(`
            id, title, excerpt, body, type, media_url, media_thumbnail,
            university_tags, is_pinned, pin_expires_at, status,
            created_by, created_at, updated_at,
            author:profiles!news_posts_created_by_fkey(full_name, username, role)
          `)
          .eq("status", "published")
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: false });

        if (selectedUniversity !== "all") {
          query = query.contains("university_tags", [selectedUniversity]);
        }

        const { data, error } = await query;

        if (error) throw error;

        const validPosts = (data as any[]).map(post => ({
          ...post,
          is_pinned: post.is_pinned && !isPinExpired(post.pin_expires_at),
        }));

        validPosts.sort((a, b) => {
          if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });

        setPosts(validPosts);
      } catch (err) {
        console.error("News load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedUniversity]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-uni-filter]")) {
        setShowUniDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []););

  const canCreateNews = userPermissions.includes("news:create") || 
    ["super_admin", "app_admin", "admin"].some(r => userRole?.toLowerCase().includes(r.replace("_", "")));

  const canPin = userPermissions.includes("news:pin");

  const filteredPosts = posts;

  const renderMediaPreview = (post: NewsPost) => {
    if (post.type === "video" && post.media_url) {
      const thumbnail = post.media_thumbnail || getYouTubeThumbnail(post.media_url) || null;
      return (
        <div style={{
          position: "relative",
          width: "100%",
          height: "160px",
          borderRadius: "8px",
          overflow: "hidden",
          background: "#000",
          marginBottom: "12px",
          cursor: "pointer",
        }}>
          {thumbnail ? (
            <img 
              src={thumbnail} 
              alt="" 
              style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Play size={32} color="white" />
            </div>
          )}
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "48px",
            height: "48px",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Play size={20} color="white" fill="white" />
          </div>
        </div>
      );
    }

    if (post.type === "link" && post.media_url) {
      return (
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "10px 12px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          marginBottom: "12px",
        }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "rgba(13, 148, 136, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Link2 size={18} color="#0D9488" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {post.title}
            </p>
            <p style={{ fontSize: "11px", color: "#0D9488", margin: 0 }}>
              {getDomain(post.media_url)}
            </p>
          </div>
          <ChevronRight size={16} color="var(--text-muted)" />
        </div>
      );
    }

    return null;
  };

  const renderUniversityTags = (tags: string[]) => {
    if (!tags || tags.length === 0) return null;

    return (
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
        {tags.map(tag => {
          const uni = allUniversities.find(u => u.slug === tag) || { slug: tag, name: tag.toUpperCase().replace(/-/g, " ") };
          return (
            <span key={tag} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "3px",
              fontSize: "11px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              padding: "2px 8px",
              borderRadius: "99px",
              background: tag === "global" ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
              color: tag === "global" ? "#0D9488" : "var(--text-muted)",
              border: "1px solid var(--border)",
            }}>
              <MapPin size={10} />
              {uni?.name || tag}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
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

          {canCreateNews && (
            <Link href="/news/create">
              <button style={{
                padding: "8px 16px",
                borderRadius: "8px",
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

        {/* University Filter */}
        <div data-uni-filter style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <Filter size={14} color="var(--text-muted)" />
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>
              Filter by University
            </span>
            {selectedUniversity !== "all" && (
              <button
                onClick={() => setSelectedUniversity("all")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#0D9488",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-display)",
                }}
              >
                Clear
              </button>
            )}
          </div>

          {/* Searchable Dropdown */}
          <div style={{ position: "relative" }}>
            <input
              type="text"
              value={uniSearch}
              onChange={(e) => {
                setUniSearch(e.target.value);
                setShowUniDropdown(true);
              }}
              onFocus={() => setShowUniDropdown(true)}
              placeholder={selectedUniversity === "all" ? "Search universities..." : allUniversities.find(u => u.slug === selectedUniversity)?.name || selectedUniversity}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />

            {showUniDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                marginTop: "4px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "10px",
                maxHeight: "200px",
                overflowY: "auto",
                zIndex: 20,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}>
                <button
                  onClick={() => { setSelectedUniversity("all"); setUniSearch(""); setShowUniDropdown(false); }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    textAlign: "left",
                    background: selectedUniversity === "all" ? "rgba(13, 148, 136, 0.08)" : "transparent",
                    border: "none",
                    borderBottom: "1px solid var(--border)",
                    color: selectedUniversity === "all" ? "#0D9488" : "var(--text)",
                    fontSize: "13px",
                    fontWeight: selectedUniversity === "all" ? 700 : 600,
                    fontFamily: "var(--font-display)",
                    cursor: "pointer",
                  }}
                >
                  All Universities ({posts.length} posts)
                </button>

                {allUniversities
                  .filter(uni => uni.slug !== "global" && (uniSearch === "" || uni.name.toLowerCase().includes(uniSearch.toLowerCase()) || uni.slug.toLowerCase().includes(uniSearch.toLowerCase())))
                  .map(uni => (
                    <button
                      key={uni.slug}
                      onClick={() => { setSelectedUniversity(uni.slug); setUniSearch(""); setShowUniDropdown(false); }}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        textAlign: "left",
                        background: selectedUniversity === uni.slug ? "rgba(13, 148, 136, 0.08)" : "transparent",
                        border: "none",
                        borderBottom: "1px solid var(--border)",
                        color: selectedUniversity === uni.slug ? "#0D9488" : "var(--text)",
                        fontSize: "13px",
                        fontWeight: selectedUniversity === uni.slug ? 700 : 500,
                        fontFamily: "var(--font-display)",
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span>{uni.name}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>{uni.count} posts</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Quick chips for top universities */}
          <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedUniversity("all")}
              style={{
                padding: "4px 10px",
                borderRadius: "99px",
                border: selectedUniversity === "all" ? "1px solid #0D9488" : "1px solid var(--border)",
                background: selectedUniversity === "all" ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
                color: selectedUniversity === "all" ? "#0D9488" : "var(--text-muted)",
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
              }}
            >
              All
            </button>
            {allUniversities.slice(0, 5).map(uni => (
              <button
                key={uni.slug}
                onClick={() => setSelectedUniversity(uni.slug)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "99px",
                  border: selectedUniversity === uni.slug ? "1px solid #0D9488" : "1px solid var(--border)",
                  background: selectedUniversity === uni.slug ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
                  color: selectedUniversity === uni.slug ? "#0D9488" : "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                }}
              >
                {uni.name}
              </button>
            ))}
            {allUniversities.length > 5 && (
              <button
                onClick={() => setShowUniDropdown(true)}
                style={{
                  padding: "4px 10px",
                  borderRadius: "99px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                }}
              >
                +{allUniversities.length - 5} more
              </button>
            )}
          </div>
        </div>

        {/* Info banner for students */}
        {!canCreateNews && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "rgba(13, 148, 136, 0.08)",
            border: "1px solid rgba(13, 148, 136, 0.2)",
            borderRadius: "8px",
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
        {!loading && filteredPosts.length === 0 && (
          <EmptyState
            emoji="📰"
            title="No news yet"
            description={
              selectedUniversity !== "all"
                ? `No news for ${NIGERIAN_UNIVERSITIES.find(u => u.slug === selectedUniversity)?.name || selectedUniversity}. Try "All" or check back later.`
                : "Campus announcements and updates will appear here. Check back soon!"
            }
          />
        )}

        {/* News feed */}
        {!loading && filteredPosts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredPosts.map((post) => {
              const roleBadge = getRoleBadge(post.author?.role);
              const isRecent = new Date(post.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

              return (
                <Link key={post.id} href={`/news/${post.id}`} style={{ textDecoration: "none" }}>
                  <div style={{
                    background: "var(--surface)",
                    borderRadius: "12px",
                    border: `1px solid ${post.is_pinned ? "rgba(13,148,136,0.4)" : "var(--border)"}`,
                    padding: "16px 18px",
                    cursor: "pointer",
                    transition: "border-color 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(13, 148, 136, 0.3)";
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = post.is_pinned ? "rgba(13,148,136,0.4)" : "var(--border)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >

                    {/* Pinned badge */}
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
                        marginBottom: "10px",
                      }}>
                        <Pin size={10} />
                        PINNED
                      </div>
                    )}

                    {/* University tags */}
                    {renderUniversityTags(post.university_tags)}

                    {/* Media preview */}
                    {renderMediaPreview(post)}

                    <h3 style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "var(--text)",
                      margin: "0 0 8px 0",
                      lineHeight: 1.3,
                    }}>
                      {post.title}
                    </h3>

                    {/* Excerpt */}
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
                      {post.excerpt || post.body}
                    </p>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "var(--gradient)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          color: "white",
                          fontWeight: 700,
                          fontFamily: "var(--font-display)",
                        }}>
                          {post.author?.full_name?.[0] ?? "M"}
                        </div>

                        <span style={{ fontSize: "12px", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 500 }}>
                          {post.author?.full_name ?? "MedStudent Team"}
                        </span>

                        <span style={{
                          fontSize: "10px",
                          background: `${roleBadge.color}15`,
                          color: roleBadge.color,
                          padding: "1px 6px",
                          borderRadius: "99px",
                          fontWeight: 600,
                          fontFamily: "var(--font-display)",
                          textTransform: "capitalize",
                        }}>
                          {roleBadge.label}
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
                        <span style={{ fontSize: "12px" }}>
                          {isRecent ? timeAgo(post.created_at) : formatDateFull(post.created_at)}
                        </span>
                        <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
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
