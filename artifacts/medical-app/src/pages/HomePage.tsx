import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import { createClient } from "@/lib/supabase";
import { formatDateShort } from "@/lib/formatters";
import { POST_SELECT_FIELDS } from "@/lib/constants";
import { normalizePosts } from "@/lib/posts";
import { PenSquare, TrendingUp, Clock, Flame, ChevronRight, Megaphone, ChevronDown, ChevronUp, Calendar, Search, User, Users, GraduationCap, MessageSquare } from "lucide-react";
import { Link, useLocation } from "wouter";

const filters = [
  { key: "hot", label: "Hot", icon: Flame },
  { key: "new", label: "New", icon: Clock },
  { key: "top", label: "Top", icon: TrendingUp },
];

const communityCategories = [
  {
    label: "Official",
    communities: [
      { name: "Announcements", slug: "announcements", icon: Megaphone },
      { name: "General", slug: "general", icon: MessageSquare },
      { name: "Study Materials", slug: "materials", icon: GraduationCap },
    ],
  },
  {
    label: "Subjects",
    communities: [
      { name: "Anatomy", slug: "anatomy", icon: "🧠" },
      { name: "Physiology", slug: "physiology", icon: "⚗️" },
      { name: "Biochemistry", slug: "biochemistry", icon: "🔬" },
    ],
  },
];

export default function HomePage() {
  const supabase = createClient();
  const [location] = useLocation();
  const getInitialFilter = () => {
    if (location === "/popular") return "hot";
    if (location === "/recent") return "new";
    if (location === "/my-posts") return "my-posts";
    return "hot";
  };
  const [posts, setPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<Post[]>([]);
  const [isAnnouncementsExpanded, setIsAnnouncementsExpanded] = useState(false);
  const [filter, setFilter] = useState(getInitialFilter);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedProfiles, setSearchedProfiles] = useState<any[]>([]);
  const [searchedCommunities, setSearchedCommunities] = useState<any[]>([]);
  const [isSearchingAll, setIsSearchingAll] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id);
    });
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedProfiles([]);
      setSearchedCommunities([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearchingAll(true);
      try {
        const { data: matchedProfiles } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, university")
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(5);
        
        const { data: matchedCommunities } = await supabase
          .from("communities")
          .select("id, name, slug, description, category")
          .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .limit(5);

        setSearchedProfiles(matchedProfiles || []);
        setSearchedCommunities(matchedCommunities || []);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setIsSearchingAll(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  useEffect(() => {
    if (location === "/popular") {
      setFilter("hot");
    } else if (location === "/recent") {
      setFilter("new");
    } else if (location === "/my-posts") {
      setFilter("my-posts");
    }
  }, [location]);

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      try {
        let query = supabase
          .from("posts")
          .select(POST_SELECT_FIELDS);

        if (filter === "my-posts" && currentUserId) {
          query = query.eq("author_id", currentUserId);
        }

        if (filter === "new") {
          query = query.order("created_at", { ascending: false });
        } else if (filter === "top") {
          query = query.order("upvotes", { ascending: false });
        } else if (filter === "my-posts") {
          query = query.order("created_at", { ascending: false });
        } else {
          query = query
            .order("is_announcement", { ascending: false })
            .order("is_pinned", { ascending: false })
            .order("upvotes", { ascending: false })
            .order("created_at", { ascending: false });
        }

        const { data, error } = await query.limit(30);
        if (error) throw error;

        const officialAnnouncements = (data || []).filter((p: any) => p.is_announcement === true);
        setAnnouncements(officialAnnouncements as any);

        const votesMap: Record<string, "up" | "down"> = {};
        if (currentUserId && data?.length) {
          const { data: votes } = await supabase
            .from("post_votes")
            .select("post_id, vote_type")
            .in("post_id", data.map((p: any) => p.id));
          if (votes) {
            votes.forEach((v: any) => { votesMap[v.post_id] = v.vote_type; });
          }
        }

        setPosts(
          normalizePosts(
            (data || []).map((p: any) => ({ ...p, user_vote: votesMap[p.id] || null }))
          )
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [filter, currentUserId]);



  const displayedPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.content?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 0 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 18px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--surface)", marginBottom: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.02)" }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Find anything"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: "none", border: "none", width: "100%", outline: "none", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px" }}
          />
        </div>

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {announcements.length > 0 && (
              <div style={{ background: "linear-gradient(135deg, rgba(45,135,200,0.08), rgba(155,109,255,0.04))", border: "1px solid var(--border)", borderRadius: "var(--radius)", overflow: "hidden", marginBottom: "16px", boxShadow: "var(--shadow)" }}>
                <div onClick={() => setIsAnnouncementsExpanded(!isAnnouncementsExpanded)} style={{ padding: "14px 16px", display: "flex", gap: "12px", alignItems: "center", cursor: "pointer", userSelect: "none" }}>
                  <div style={{ background: "var(--blue)", borderRadius: "50%", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}><Megaphone size={16} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h4 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", margin: 0, color: "var(--text)" }}>{announcements[0].title || "Official Announcement"}</h4>
                      <span style={{ fontSize: "10px", color: "white", background: "var(--blue)", padding: "2px 6px", borderRadius: "99px", fontWeight: 700 }}>Latest</span>
                    </div>
                    {!isAnnouncementsExpanded && <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0 0", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{announcements[0].content}</p>}
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>{isAnnouncementsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                </div>
                {isAnnouncementsExpanded && (
                  <div style={{ borderTop: "1px solid var(--border)", background: "rgba(0,0,0,0.01)", maxHeight: "260px", overflowY: "auto", padding: "12px 16px 16px" }}>
                    <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "0 0 10px 0" }}>Announcement Feed history</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {announcements.map((ann) => (
                        <div key={ann.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <h5 style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text)" }}>{ann.title}</h5>
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "var(--text-muted)" }}><Calendar size={11} />{formatDateShort(ann.created_at)}</div>
                          </div>
                          <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.5 }}>{ann.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", boxShadow: "var(--shadow)" }}>
              <Link href="/create" style={{ flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-light)", fontFamily: "var(--font-body)", fontSize: "14px", textDecoration: "none", display: "block" }}>Share something with the community...</Link>
              <Link href="/create" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "var(--radius-sm)", background: "var(--gradient)", color: "white", textDecoration: "none", flexShrink: 0 }}><PenSquare size={16} /></Link>
            </div>

            {searchQuery.trim() !== "" && (() => {
              // Extract posts that match search query
              const matchingPosts = posts.filter(post => 
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (post.content?.toLowerCase() || "").includes(searchQuery.toLowerCase())
              );

              const hasAnyResults = searchedProfiles.length > 0 || searchedCommunities.length > 0 || matchingPosts.length > 0;

              return (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", marginBottom: "20px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
                    <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "14px", color: "var(--text)", margin: 0 }}>
                      🔍 Unified Search Results for "{searchQuery}"
                    </h3>
                    <button 
                      onClick={() => setSearchQuery("")}
                      style={{ background: "rgba(0,0,0,0.05)", border: "none", borderRadius: "50%", padding: "4px", fontSize: "11px", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      Clear
                    </button>
                  </div>

                  {!hasAnyResults ? (
                    <div style={{ textAlign: "center", padding: "24px", color: "var(--text-muted)" }}>
                      <p style={{ fontSize: "13.5px", margin: 0 }}>No matching students, communities, or posts found.</p>
                      <p style={{ fontSize: "11px", marginTop: "4px" }}>Try tweaking terms or seeking a clinical topic.</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      
                      {/* USER MATCHES */}
                      {searchedProfiles.map((p) => (
                        <Link key={p.id} href={`/profile/${p.username}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: "var(--surface-muted)", textDecoration: "none", border: "1px solid var(--border)", transition: "all 0.2s" }} className="hover:border-teal-500">
                          <span style={{ fontSize: "10px", background: "rgba(13,148,136,0.12)", color: "#0d9488", padding: "2px 8px", borderRadius: "99px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Student
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: 0 }}>
                            {p.avatar_url ? (
                              <img src={p.avatar_url} style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
                            ) : (
                              <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "#0d9488", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "11px" }}>
                                {p.username?.[0]?.toUpperCase()}
                              </div>
                            )}
                            <div style={{ minWidth: 0 }}>
                              <strong style={{ fontSize: "12.5px", color: "var(--text)", display: "block" }}>@{p.username} ({p.full_name || "Peer Student"})</strong>
                              <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block" }}>{p.university || "UI College of Medicine"}</span>
                            </div>
                          </div>
                        </Link>
                      ))}

                      {/* COMMUNITY MATCHES */}
                      {searchedCommunities.map((c) => (
                        <Link key={c.id} href={`/c/${c.slug}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: "var(--surface-muted)", textDecoration: "none", border: "1px solid var(--border)", transition: "all 0.2s" }} className="hover:border-teal-500">
                          <span style={{ fontSize: "10px", background: "rgba(124,58,237,0.12)", color: "#7C3AED", padding: "2px 8px", borderRadius: "99px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Circle
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: "12.5px", color: "var(--text)", display: "block" }}>🏫 {c.name}</strong>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{c.description || "Active community circle"}</span>
                          </div>
                          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </Link>
                      ))}

                      {/* POST MATCHES */}
                      {matchingPosts.map((post) => (
                        <Link key={post.id} href={`/post/${post.id}`} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 14px", borderRadius: "10px", background: "var(--surface-muted)", textDecoration: "none", border: "1px solid var(--border)", transition: "all 0.2s" }} className="hover:border-teal-500">
                          <span style={{ fontSize: "10px", background: "rgba(225,29,72,0.12)", color: "#E11D48", padding: "2px 8px", borderRadius: "99px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Post
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <strong style={{ fontSize: "12.5px", color: "var(--text)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{post.title}</strong>
                            <span style={{ fontSize: "10.5px", color: "var(--text-muted)", display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{post.content?.substring(0, 100)}...</span>
                          </div>
                          <ChevronRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                        </Link>
                      ))}

                    </div>
                  )}
                </div>
              );
            })()}

            <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
              {filters.map(({ key, label, icon: Icon }) => (
                <button key={key} onClick={() => setFilter(key)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "99px", border: "none", background: filter === key ? "var(--gradient)" : "var(--surface)", color: filter === key ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer", transition: "all 0.2s ease" }}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>

            {loading ? (
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "14px" }}>Loading posts...</p>
            ) : displayedPosts.length === 0 ? (
              <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "14px" }}>No posts found</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {displayedPosts.map(post => (
                  <div key={post.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                    <PostCard post={post} currentUserId={currentUserId} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ width: "220px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "12px" }} className="desktop-sidebar">
            {communityCategories.map(({ label, communities }) => (
              <div key={label} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "12px 14px 8px", borderBottom: "1px solid var(--border)" }}><p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase" }}>{label}</p></div>
                <div style={{ padding: "6px 8px" }}>
                  {communities.map(({ name, slug, icon: Icon }) => (
                    <Link key={slug} href={`/c/${slug}`} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 8px", borderRadius: "8px", textDecoration: "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "14px", display: "flex", alignItems: "center", justifyItems: "center" }}>
                          {typeof Icon === "string" ? Icon : <Icon size={14} style={{ color: "var(--teal)" }} />}
                        </span>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: "12.5px", color: "var(--text)" }}>{name}</span>
                      </div>
                      <ChevronRight size={12} color="var(--text-light)" />
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
