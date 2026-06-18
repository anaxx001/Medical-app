import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import type { Community } from "@/lib/types";
import { 
  Users, TrendingUp, Plus, Search, Flame, Sparkles, 
  GraduationCap, Stethoscope, Brain, HeartPulse, Microscope,
  ChevronRight, Lock, Globe, Hash
} from "lucide-react";

const HEALTH_TOPICS = [
  { label: "All", icon: Sparkles },
  { label: "Medicine", icon: Stethoscope },
  { label: "Nursing", icon: HeartPulse },
  { label: "Pharmacy", icon: Microscope },
  { label: "Radiology", icon: Brain },
  { label: "Dentistry", icon: GraduationCap },
  { label: "Student Life", icon: Users },
  { label: "Research", icon: Flame },
];

const TOPIC_COLORS: Record<string, string> = {
  Medicine: "#0D9488",
  Nursing: "#E8445A", 
  Pharmacy: "#9B6DFF",
  Radiology: "#2D87C8",
  Dentistry: "#F5A623",
  "Student Life": "#3DBE7A",
  Research: "#E8445A",
};

export default function DiscoverCommunitiesPage() {
  const supabase = createClient();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set());
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);

        const { data: communitiesData } = await supabase
          .from("communities")
          .select("*")
          .order("member_count", { ascending: false });

        setCommunities(communitiesData || []);

        if (user?.id) {
          const { data: memberData } = await supabase
            .from("community_members")
            .select("community_id")
            .eq("user_id", user.id);

          setJoinedCommunities(new Set((memberData || []).map((m: any) => m.community_id)));
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter communities by topic + search
  useEffect(() => {
    let result = communities;

    if (selectedTopic !== "All") {
      result = result.filter((c) => 
        c.topic === selectedTopic || 
        c.name.toLowerCase().includes(selectedTopic.toLowerCase()) ||
        c.category?.toLowerCase().includes(selectedTopic.toLowerCase())
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q)
      );
    }

    setFilteredCommunities(result);
  }, [selectedTopic, searchQuery, communities]);

  async function handleJoinCommunity(communityId: string) {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }

    if (joinedCommunities.has(communityId)) {
      await supabase
        .from("community_members")
        .delete()
        .eq("user_id", currentUserId)
        .eq("community_id", communityId);

      const updated = new Set(joinedCommunities);
      updated.delete(communityId);
      setJoinedCommunities(updated);

      // Decrement count locally
      setCommunities(prev => prev.map(c => 
        c.id === communityId ? { ...c, member_count: Math.max(0, (c.member_count || 0) - 1) } : c
      ));
    } else {
      await supabase
        .from("community_members")
        .insert({ user_id: currentUserId, community_id: communityId });

      setJoinedCommunities(new Set([...joinedCommunities, communityId]));

      // Increment count locally
      setCommunities(prev => prev.map(c => 
        c.id === communityId ? { ...c, member_count: (c.member_count || 0) + 1 } : c
      ));

      // Send welcome notification
      const community = communities.find(c => c.id === communityId);
      if (community) {
        await supabase.from("notifications").insert({
          user_id: currentUserId,
          type: "community_welcome",
          title: `Welcome to ${community.name}!`,
          message: `You joined c/${community.slug}. Post questions, share notes, and connect with fellow students.`,
          reference_id: communityId,
          reference_type: "community",
        });
      }
    }
  }

  const getTopicColor = (community: Community) => {
    const topic = community.topic || community.category || "All";
    return TOPIC_COLORS[topic] || "#0D9488";
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Hero Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "var(--gradient)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Users size={22} color="white" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "28px",
                color: "var(--text)",
                margin: 0,
              }}>
                Discover Communities
              </h1>
            </div>
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-muted)",
            margin: "4px 0 0 52px",
            maxWidth: "480px",
            lineHeight: 1.5,
          }}>
            Find your people. Join health-focused communities built by and for Nigerian medical students.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{
          position: "relative",
          marginBottom: "24px",
          maxWidth: "500px",
        }}>
          <Search size={18} style={{ 
            position: "absolute", 
            left: "16px", 
            top: "50%", 
            transform: "translateY(-50%)", 
            color: "var(--text-muted)",
            pointerEvents: "none",
          }} />
          <input
            type="text"
            placeholder="Search communities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "14px 16px 14px 48px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "15px",
              fontFamily: "var(--font-body)",
              outline: "none",
              transition: "border-color 0.2s, box-shadow 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#0D9488";
              e.target.style.boxShadow = "0 0 0 3px rgba(13,148,136,0.1)";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "var(--border)";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>

        {/* Topic Filter Chips */}
        <div style={{ 
          marginBottom: "32px", 
          display: "flex", 
          gap: "8px", 
          flexWrap: "wrap",
        }}>
          {HEALTH_TOPICS.map((topic) => {
            const isActive = selectedTopic === topic.label;
            const Icon = topic.icon;
            return (
              <button
                key={topic.label}
                onClick={() => setSelectedTopic(topic.label)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "99px",
                  border: isActive ? "2px solid #0D9488" : "1px solid var(--border)",
                  background: isActive ? "var(--gradient)" : "var(--surface)",
                  color: isActive ? "white" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "13px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isActive ? "0 2px 8px rgba(13,148,136,0.2)" : "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "#0D9488";
                    e.currentTarget.style.color = "#0D9488";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.color = "var(--text-muted)";
                  }
                }}
              >
                <Icon size={14} />
                {topic.label}
              </button>
            );
          })}
        </div>

        {/* Results Count */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            {filteredCommunities.length} community{filteredCommunities.length !== 1 ? "ies" : "y"} found
            {selectedTopic !== "All" && ` in ${selectedTopic}`}
          </p>
          <a
            href="/communities/create"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 18px",
              borderRadius: "99px",
              background: "var(--gradient)",
              color: "white",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "13px",
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
          >
            <Plus size={16} /> Start a Community
          </a>
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
            gap: "20px" 
          }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  height: "260px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  opacity: 0.5,
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ 
              fontSize: "56px", 
              marginBottom: "20px",
              opacity: 0.6,
            }}>🔍</div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
              margin: "0 0 8px 0",
            }}>
              No communities found
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "15px",
              color: "var(--text-muted)",
              margin: "0 0 24px 0",
              maxWidth: "360px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : selectedTopic !== "All" 
                  ? `No ${selectedTopic} communities yet. Be the first to create one!`
                  : "No communities yet. Start the first one and build your network!"
              }
            </p>
            <a
              href="/communities/create"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "12px 24px",
                borderRadius: "99px",
                background: "var(--gradient)",
                color: "white",
                textDecoration: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(13,148,136,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <Plus size={18} /> Start a Community
            </a>
          </div>
        ) : (
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", 
            gap: "20px" 
          }}>
            {filteredCommunities.map((community, index) => {
              const isJoined = joinedCommunities.has(community.id);
              const topicColor = getTopicColor(community);
              const isHovered = hoveredCard === community.id;

              return (
                <div
                  key={community.id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${isHovered ? topicColor + "40" : "var(--border)"}`,
                    borderRadius: "var(--radius)",
                    overflow: "hidden",
                    boxShadow: isHovered ? `0 8px 32px ${topicColor}15` : "var(--shadow)",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    animation: `fadeInUp 0.5s ease ${index * 0.05}s both`,
                  }}
                  onMouseEnter={() => setHoveredCard(community.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => window.location.href = `/c/${community.slug}`}
                >
                  {/* Card Header with accent bar */}
                  <div style={{
                    height: "4px",
                    background: topicColor,
                    opacity: isHovered ? 1 : 0.6,
                    transition: "opacity 0.3s",
                  }} />

                  <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    {/* Icon & Name Row */}
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", marginBottom: "14px" }}>
                      <div style={{
                        width: "52px",
                        height: "52px",
                        borderRadius: "14px",
                        background: community.profile_image_url
                          ? `url(${community.profile_image_url}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${topicColor}20, ${topicColor}08)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "26px",
                        flexShrink: 0,
                        border: `2px solid ${topicColor}20`,
                        transition: "transform 0.3s",
                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                      }}>
                        {!community.profile_image_url && (community.icon || "🏥")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 700,
                          fontSize: "16px",
                          color: "var(--text)",
                          margin: "0 0 4px 0",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          transition: "color 0.2s",
                        }}>
                          {community.name}
                        </h3>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                        }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "3px" }}>
                            {community.is_private ? <Lock size={11} /> : <Globe size={11} />}
                            c/{community.slug}
                          </span>
                          {community.topic && (
                            <>
                              <span>•</span>
                              <span style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "3px",
                                color: topicColor,
                                fontWeight: 600,
                              }}>
                                <Hash size={11} />
                                {community.topic}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.6,
                      margin: "0 0 16px 0",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      flex: 1,
                    }}>
                      {community.description || "A community for health students to connect, share, and learn together."}
                    </p>

                    {/* Stats Row */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "16px",
                      paddingTop: "14px",
                      borderTop: "1px solid var(--border)",
                      marginBottom: "14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Users size={14} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>
                          {(community.member_count || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>members</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <TrendingUp size={14} style={{ color: "var(--text-muted)" }} />
                        <span style={{ fontSize: "13px", color: "var(--text)", fontWeight: 600 }}>
                          {(community.weekly_visitors || 0).toLocaleString()}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>this week</span>
                      </div>
                    </div>

                    {/* Join Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinCommunity(community.id);
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        border: isJoined ? "1px solid var(--border)" : "none",
                        background: isJoined ? "var(--surface-2)" : topicColor,
                        color: isJoined ? "var(--text)" : "white",
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "14px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                      }}
                      onMouseEnter={(e) => {
                        if (!isJoined) {
                          e.currentTarget.style.filter = "brightness(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.filter = "brightness(1)";
                      }}
                    >
                      {isJoined ? (
                        <>
                          <Sparkles size={16} />
                          Joined
                        </>
                      ) : (
                        <>
                          <ChevronRight size={16} />
                          Join Community
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </AppShell>
  );
}
