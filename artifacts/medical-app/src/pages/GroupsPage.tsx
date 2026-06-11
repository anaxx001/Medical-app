import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { Search } from "lucide-react";
import AppShell from "@/components/AppShell";

type Community = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  member_count?: number;
};

export default function GroupsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data } = await supabase
        .from("communities")
        .select("*")
        .order("name", { ascending: true });

      if (data) {
        setCommunities(data);
      }
      setLoading(false);
    }
    init();
  }, []);

  const filtered = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "8px" }}>Communities</h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>Join communities to connect with peers and share knowledge</p>
        </div>

        {/* Search Bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--surface)", marginBottom: "24px" }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search communities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", width: "100%" }}
          />
        </div>

        {/* Communities Grid */}
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: "200px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", opacity: 0.6 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔍</div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "16px", color: "var(--text)", marginBottom: "8px" }}>No communities found</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Try adjusting your search</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {filtered.map(community => (
              <div
                key={community.id}
                onClick={() => navigate(`/m/${community.slug}`)}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  overflow: "hidden",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#0D9488";
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 16px rgba(13, 148, 136, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Banner */}
                <div style={{
                  height: "100px",
                  background: "linear-gradient(135deg, rgba(13, 148, 136, 0.1), rgba(61, 190, 122, 0.08))",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                }}>
                  {community.icon}
                </div>

                {/* Content */}
                <div style={{ padding: "16px" }}>
                  <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", margin: "0 0 4px 0" }}>
                    {community.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 12px 0", lineHeight: 1.4 }}>
                    {community.description || "No description yet"}
                  </p>

                  {/* Member count and slug */}
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", fontSize: "12px", color: "var(--text-light)" }}>
                    <span>👥 Members</span>
                    <span style={{ marginLeft: "auto" }}>r/{community.slug}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
