"use client";

import AppShell from "@/components/AppShell";
import Link from "next/link";
import {
  BookOpen,
  BrainCircuit,
  FileText,
  ClipboardList,
  MessageSquareText,
  Flame,
  Trophy,
  Clock,
  TrendingUp,
} from "lucide-react";

const featureCards = [
  {
    href: "/flashcards",
    icon: BookOpen,
    label: "Flashcards",
    description: "Review key concepts fast",
    color: "#2D87C8",
    bg: "#EBF5FF",
  },
  {
    href: "/quiz",
    icon: BrainCircuit,
    label: "Quiz",
    description: "Test your knowledge",
    color: "#3DBE7A",
    bg: "#EDFFF5",
  },
  {
    href: "/notes",
    icon: FileText,
    label: "Notes",
    description: "Structured study notes",
    color: "#F5A623",
    bg: "#FFF8EC",
  },
  {
    href: "/past-questions",
    icon: ClipboardList,
    label: "Past Questions",
    description: "Practice exam questions",
    color: "#9B6DFF",
    bg: "#F5F0FF",
  },
  {
    href: "/chatbot",
    icon: MessageSquareText,
    label: "AI Chatbot",
    description: "Ask anything medical",
    color: "#E8445A",
    bg: "#FFF0F2",
  },
];

const stats = [
  {
    icon: Flame,
    label: "Day Streak",
    value: "7",
    sub: "Keep it up!",
    color: "#F5A623",
    bg: "#FFF8EC",
  },
  {
    icon: Trophy,
    label: "Quiz Score",
    value: "84%",
    sub: "Last attempt",
    color: "#3DBE7A",
    bg: "#EDFFF5",
  },
  {
    icon: Clock,
    label: "Study Time",
    value: "3h 20m",
    sub: "Today",
    color: "#2D87C8",
    bg: "#EBF5FF",
  },
  {
    icon: TrendingUp,
    label: "Cards Reviewed",
    value: "142",
    sub: "This week",
    color: "#9B6DFF",
    bg: "#F5F0FF",
  },
];

export default function Dashboard() {
  return (
    <AppShell>
      <div className="fade-up" style={{ maxWidth: "960px" }}>

        {/* Hero banner */}
        <div
          style={{
            background: "var(--gradient)",
            borderRadius: "var(--radius)",
            padding: "32px 36px",
            marginBottom: "32px",
            position: "relative",
            overflow: "hidden",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {/* Background blobs */}
          <div
            style={{
              position: "absolute",
              top: "-40px",
              right: "-40px",
              width: "200px",
              height: "200px",
              background: "rgba(255,255,255,0.08)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "-60px",
              right: "120px",
              width: "150px",
              height: "150px",
              background: "rgba(255,255,255,0.06)",
              borderRadius: "50%",
            }}
          />

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "28px",
              color: "white",
              marginBottom: "8px",
              position: "relative",
            }}
          >
            Welcome back 🩺
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.82)",
              fontSize: "15px",
              fontFamily: "var(--font-body)",
              maxWidth: "480px",
              position: "relative",
            }}
          >
            Your medical journey continues. What are we studying today?
          </p>

          <div
            style={{
              marginTop: "20px",
              display: "flex",
              gap: "10px",
              position: "relative",
            }}
          >
            <Link
              href="/quiz"
              style={{
                background: "white",
                color: "var(--blue-dark)",
                padding: "10px 22px",
                borderRadius: "99px",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "13.5px",
                textDecoration: "none",
                boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              }}
            >
              Start Quiz →
            </Link>
            <Link
              href="/flashcards"
              style={{
                background: "rgba(255,255,255,0.18)",
                color: "white",
                padding: "10px 22px",
                borderRadius: "99px",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13.5px",
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.3)",
              }}
            >
              Review Cards
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div
          className="fade-up fade-up-delay-1"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          {stats.map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div
              key={label}
              style={{
                background: "var(--surface)",
                borderRadius: "var(--radius)",
                padding: "20px",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow)",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "10px",
                  background: bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "12px",
                }}
              >
                <Icon size={20} color={color} strokeWidth={2} />
              </div>
              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: "24px",
                  color: "var(--text)",
                  lineHeight: 1,
                  marginBottom: "4px",
                }}
              >
                {value}
              </p>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {label}
              </p>
              <p
                style={{
                  fontSize: "11.5px",
                  color: "var(--text-light)",
                  fontFamily: "var(--font-body)",
                }}
              >
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="fade-up fade-up-delay-2">
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--text)",
              marginBottom: "16px",
            }}
          >
            Study Tools
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "16px",
            }}
          >
            {featureCards.map(
              ({ href, icon: Icon, label, description, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  style={{
                    background: "var(--surface)",
                    borderRadius: "var(--radius)",
                    padding: "22px",
                    border: "1px solid var(--border)",
                    textDecoration: "none",
                    display: "block",
                    boxShadow: "var(--shadow)",
                    transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(-3px)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "var(--shadow-md)";
                    (e.currentTarget as HTMLElement).style.borderColor = color;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform =
                      "translateY(0)";
                    (e.currentTarget as HTMLElement).style.boxShadow =
                      "var(--shadow)";
                    (e.currentTarget as HTMLElement).style.borderColor =
                      "var(--border)";
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "14px",
                    }}
                  >
                    <Icon size={22} color={color} strokeWidth={2} />
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "var(--text)",
                      marginBottom: "4px",
                    }}
                  >
                    {label}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    {description}
                  </p>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}