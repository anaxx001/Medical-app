import AppShell from "@/components/AppShell";

interface Props {
  title: string;
  emoji: string;
  description: string;
}

export default function PlaceholderPage({ title, emoji, description }: Props) {
  return (
    <AppShell>
      <div style={{ maxWidth: "600px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "50vh", textAlign: "center" }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{emoji}</div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", marginBottom: "8px" }}>{title}</h1>
        <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", maxWidth: "320px", lineHeight: 1.6 }}>{description}</p>
        <div style={{ marginTop: "24px", padding: "12px 20px", borderRadius: "99px", background: "var(--gradient-soft)", border: "1px solid var(--border)", fontSize: "13px", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600 }}>
          Coming Soon
        </div>
      </div>
    </AppShell>
  );
}
