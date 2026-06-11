import AppShell from "@/components/AppShell";

export default function GroupsPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", marginBottom: "24px" }}>
          Groups
        </h1>
        
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          background: "var(--surface)",
          borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          padding: "40px",
          textAlign: "center",
        }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "64px" }}>🚀</div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
            }}>
              Coming Soon
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", maxWidth: "300px" }}>
              Groups functionality is coming soon. Check back later to connect with study groups and communities!
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}