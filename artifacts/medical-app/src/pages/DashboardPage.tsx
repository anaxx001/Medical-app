import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import { BookOpen, BrainCircuit, FileText, ClipboardList, MessageSquareText, Flame, Trophy, Clock, TrendingUp } from "lucide-react";

const featureCards = [
  { href: "/flashcards", icon: BookOpen, label: "Flashcards", description: "Review key concepts fast", color: "#2D87C8", bg: "#EBF5FF" },
  { href: "/quiz", icon: BrainCircuit, label: "Quiz", description: "Test your knowledge", color: "#3DBE7A", bg: "#EDFFF5" },
  { href: "/notes", icon: FileText, label: "Notes", description: "Structured study notes", color: "#F5A623", bg: "#FFF8EC" },
  { href: "/past-questions", icon: ClipboardList, label: "Past Questions", description: "Practice exam questions", color: "#9B6DFF", bg: "#F5F0FF" },
  { href: "/chatbot", icon: MessageSquareText, label: "AI Chatbot", description: "Ask anything medical", color: "#E8445A", bg: "#FFF0F2" },
];

const stats = [
  { icon: Flame, label: "Day Streak", value: "—", color: "#F5A623" },
  { icon: Trophy, label: "Points", value: "—", color: "#9B6DFF" },
  { icon: Clock, label: "Study Time", value: "—", color: "#2D87C8" },
  { icon: TrendingUp, label: "Progress", value: "—", color: "#3DBE7A" },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", marginBottom: "4px" }}>Your Dashboard</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Track your progress and access study tools.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "16px", border: "1px solid var(--border)", boxShadow: "var(--shadow)", textAlign: "center" }}>
              <Icon size={24} color={color} style={{ margin: "0 auto 8px" }} />
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>{value}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{label}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", marginBottom: "14px" }}>Study Tools</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "14px" }}>
          {featureCards.map(({ href, icon: Icon, label, description, color, bg }) => (
            <Link key={href} href={href} style={{ display: "flex", flexDirection: "column", padding: "20px 16px", borderRadius: "var(--radius)", background: "var(--surface)", border: "1px solid var(--border)", textDecoration: "none", transition: "box-shadow 0.2s ease, transform 0.2s ease", boxShadow: "var(--shadow)" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <Icon size={22} color={color} />
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "4px" }}>{label}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>{description}</p>
            </Link>
          ))}
        </div>

        <div style={{ marginTop: "28px", background: "linear-gradient(135deg, rgba(45,135,200,0.08), rgba(61,190,122,0.06))", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "32px", marginBottom: "10px" }}>🎓</div>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "6px" }}>Ready to study?</p>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Flashcards, quizzes, notes, and past questions are all live. Pick a tool and get started.</p>
        </div>
      </div>
    </AppShell>
  );
}
