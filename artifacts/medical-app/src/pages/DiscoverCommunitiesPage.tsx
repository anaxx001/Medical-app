import { useState, useEffect } from "react";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { Search, Filter, Users, Globe, Lock } from "lucide-react";

export default function DiscoverCommunitiesPage() {
  const supabase = createClient();
  const [channels, setChannels] = useState<any[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchCommunities = async () => {
      const { data, error } = await supabase.from("communities").select("*");
      if (data) {
        // Fetch member count for each community
        const communitiesWithCounts = await Promise.all(data.map(async (c: any) => {
            const { count } = await supabase.from("community_members").select("*", { count: "exact" }).eq("community_id", c.id);
            return {
                ...c,
                members_count: count || 0
            };
        }));
        setChannels(communitiesWithCounts);
        setFilteredChannels(communitiesWithCounts);
      }
      setLoading(false);
    };
    fetchCommunities();
  }, []);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setFilteredChannels(
      channels.filter((c) =>
        c.name.toLowerCase().includes(term.toLowerCase()) ||
        c.category?.toLowerCase().includes(term.toLowerCase())
      )
    );
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px 80px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 800, marginBottom: "24px" }}>Discover Communities</h1>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
          <input
            type="text"
            placeholder="Search communities by name or topic..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 12px 12px 40px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              fontSize: "14px"
            }}
          />
        </div>
        <button style={{ padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--surface)", display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={18} /> Filter
        </button>
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading communities...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
          {filteredChannels.map((c) => (
            <Link key={c.id} href={`/c/${c.slug}`} style={{ textDecoration: "none" }}>
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "20px",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px", background: "rgba(13,148,136,0.1)", color: "#0D9488" }}>
                    {c.category || "General"}
                  </span>
                  {c.is_private ? <Lock size={14} color="var(--text-muted)" /> : <Globe size={14} color="var(--text-muted)" />}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                   <img 
                      src={c.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${c.name}&backgroundColor=0d9488`} 
                      alt={c.name}
                      style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover", background: "var(--bg)" }} 
                   />
                   <h3 style={{ margin: "0", fontSize: "18px", fontWeight: 700, color: "var(--text)" }}>{c.name}</h3>
                </div>
                <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--text-muted)", flex: 1 }}>{c.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "12px", color: "var(--text-muted)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Users size={14} /> {c.members_count || 0} members</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
