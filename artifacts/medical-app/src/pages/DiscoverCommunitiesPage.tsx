import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { Users, TrendingUp, Plus } from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  member_count?: number;
  weekly_visitors?: number;
  topic?: string;
}

const HEALTH_TOPICS = [
  "All",
  "Health",
  "Education",
  "Student Life",
  "Radiology",
  "Nursing",
  "Medicine",
  "Pharmacy",
  "Physiotherapy",
  "Dentistry",
  "Pharmacology",
  "Anatomy",
];

export default function DiscoverCommunitiesPage() {
  const supabase = createClient();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [joinedCommunities, setJoinedCommunities] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUserId(user?.id);

        // Fetch all communities
        const { data: communitiesData } = await supabase
          .from("communities")
          .select("*")
          .order("member_count", { ascending: false });

        setCommunities(communitiesData || []);

        // Fetch user's joined communities
        if (user?.id) {
          const { data: memberData } = await supabase
            .from("community_members")
            .select("community_id")
            .eq("user_id", user.id);

          setJoinedCommunities(new Set((memberData || []).map((m: any) => m.community_id)));
        }
      } catch (err) {
        console.error("Error fetching communities:", err);
        setError("Failed to load communities. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter communities by selected topic
  useEffect(() => {
    if (selectedTopic === "All") {
      setFilteredCommunities(communities);
    } else {
      setFilteredCommunities(
        communities.filter((c) => c.topic === selectedTopic || c.name.toLowerCase().includes(selectedTopic.toLowerCase()))
      );
    }
  }, [selectedTopic, communities]);

  async function handleJoinCommunity(communityId: string) {
    if (!currentUserId) {
      window.location.href = "/login";
      return;
    }

    try {
      if (joinedCommunities.has(communityId)) {
        const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("user_id", currentUserId)
          .eq("community_id", communityId);
        if (error) throw error;

        const updated = new Set(joinedCommunities);
        updated.delete(communityId);
        setJoinedCommunities(updated);
      } else {
        const { error } = await supabase
          .from("community_members")
          .insert({ user_id: currentUserId, community_id: communityId });
        if (error) throw error;

        setJoinedCommunities(new Set([...joinedCommunities, communityId]));
      }
    } catch (err) {
      console.error("Join/leave community error:", err);
      setError("Failed to update community membership.");
    }
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "28px",
            color: "var(--text)",
            marginBottom: "8px",
          }}>
            Discover Communities
          </h1>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            Find and join health-focused communities for Nigerian medical students
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", marginBottom: "16px", borderRadius: "var(--radius-sm)", background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Topic Filter Chips */}
        <div style={{ marginBottom: "32px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {HEALTH_TOPICS.map((topic) => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              style={{
                padding: "8px 16px",
                borderRadius: "99px",
                border: "1px solid var(--border)",
                background: selectedTopic === topic ? "var(--gradient)" : "var(--surface-2)",
                color: selectedTopic === topic ? "white" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontWeight: selectedTopic === topic ? 600 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {topic}
            </button>
          ))}
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  height: "280px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : filteredCommunities.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "64px 20px",
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "18px",
              color: "var(--text)",
              marginBottom: "8px",
            }}>
              No communities yet
            </h2>
            <p style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-muted)",
              marginBottom: "20px",
            }}>
              Be the first to create a community in this topic!
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
              }}
            >
              <Plus size={16} /> Start a Community
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
            {filteredCommunities.map((community) => {
              const isJoined = joinedCommunities.has(community.id);
              return (
                <div
                  key={community.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius)",
                    padding: "20px",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    transition: "all 0.2s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#0D9488";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  {/* Icon & Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "10px",
                      background: "var(--gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "24px",
                      flexShrink: 0,
                    }}>
                      {community.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "14px",
                        color: "var(--text)",
                        margin: "0 0 2px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {community.name}
                      </h3>
                      <p style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        margin: 0,
                      }}>
                        r/{community.slug}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {community.description && (
                    <p style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                      lineHeight: 1.5,
                      margin: 0,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}>
                      {community.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    paddingTop: "8px",
                    borderTop: "1px solid var(--border)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}>
                      <Users size={14} />
                      <span>{community.member_count || 0} members</span>
                    </div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}>
                      <TrendingUp size={14} />
                      <span>{community.weekly_visitors || 0} visitors</span>
                    </div>
                  </div>

                  {/* Join Button */}
                  <button
                    onClick={() => handleJoinCommunity(community.id)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "none",
                      background: isJoined ? "var(--surface-2)" : "var(--gradient)",
                      color: isJoined ? "var(--text)" : "white",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (!isJoined) {
                        e.currentTarget.style.opacity = "0.9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isJoined) {
                        e.currentTarget.style.opacity = "1";
                      }
                    }}
                  >
                    {isJoined ? "✓ Joined" : "Join Community"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
