import React, { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { Link } from "wouter";
import {
  BookOpen, BrainCircuit, FileText, ClipboardList,
  MessageSquareText, Flame, Trophy, Clock, TrendingUp,
  ChevronRight, Zap
} from "lucide-react";
import { createClient } from "@/lib/supabase";

const featureCards = [
  { href: "/flashcards", icon: BookOpen, label: "Flashcards", description: "Review key concepts fast", color: "#0D9488", bg: "#F0FDFA" },
  { href: "/quiz", icon: BrainCircuit, label: "Quiz", description: "Test your knowledge", color: "#7C3AED", bg: "#F5F3FF" },
  { href: "/notes", icon: FileText, label: "Notes", description: "Structured study notes", color: "#D97706", bg: "#FFFBEB" },
  { href: "/past-questions", icon: ClipboardList, label: "Past Questions", description: "Practice exam questions", color: "#DC2626", bg: "#FEF2F2" },
  { href: "/chatbot", icon: MessageSquareText, label: "AI Chatbot", description: "Ask anything medical", color: "#0891B2", bg: "#ECFEFF" },
];

const days = ["M", "T", "W", "T", "F", "S", "S"];

export default function DashboardPage() {
  const supabase = createClient();
  const [dayStreak, setDayStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [studyTime, setStudyTime] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userName, setUserName] = useState("");
  const [profession, setProfession] = useState("");
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const raw = window.localStorage.getItem("dashboardStats");
        if (raw) {
          const parsed = JSON.parse(raw);
          setDayStreak(Number(parsed.dayStreak) || 0);
          setPoints(Number(parsed.points) || 0);
          setStudyTime(Number(parsed.studyTime) || 0);
          setProgress(Number(parsed.progress) || 0);
        }
      } catch (e) {
        console.warn("Failed to load dashboardStats:", e);
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, username, profession")
            .eq("id", user.id)
            .single();
          if (profile) {
            setUserName(profile.full_name || profile.username || "");
            setProfession(profile.profession || "");
          }
        }
      } catch (e) {
        console.warn("Failed to load profile:", e);
      }

      setTimeout(() => setAnimating(true), 100);
    }
    loadData();
  }, []);

  const stats = [
    { icon: Flame, label: "Day Streak", value: dayStreak, suffix: "", color: "#F97316", bg: "#FFF7ED" },
    { icon: Trophy, label: "Points", value: points, suffix: "", color: "#7C3AED", bg: "#F5F3FF" },
    { icon: Clock, label: "Study Time", value: studyTime, suffix: "hrs", color: "#0D9488", bg: "#F0FDFA" },
    { icon: TrendingUp, label: "Progress", value: progress, suffix: "%", color: "#059669", bg: "#ECFDF5" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Welcome Header */}
        <div style={{
          marginBottom: "28px",
          padding: "24px",
          background: "var(--gradient)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-md)",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
          <div style={{ position: "absolute", bottom: "-30px", right: "60px", width: "80px", height: "80px", borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.75)", fontFamily: "var(--font-body)", fontWeight: 500, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Your Dashboard
            </p>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "white", marginBottom: "6px", lineHeight: 1.2 }}>
              {userName ? `Welcome back, ${userName.split(" ")[0]} 👋` : "Welcome back 👋"}
            </h1>
            {profession && (
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", fontFamily: "var(--font-body)" }}>
                {profession} · Keep pushing, every page counts.
              </p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", marginBottom: "28px" }}>
          {stats.map(({ icon: Icon, label, value, suffix, color, bg }, idx) => (
            <div key={label} style={{
              background: "var(--surface)",
              borderRadius: "var(--radius)",
              padding: "18px 16px",
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              alignItems: "center",
              gap: "14px",
              opacity: animating ? 1 : 0,
              transform: animating ? "translateY(0)" : "translateY(12px)",
              transition: `opacity 0.4s ease ${idx * 0.08}s, transform 0.4s ease ${idx * 0.08}s`,
            }}>
              <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", lineHeight: 1, marginBottom: "4px" }}>
                  {value}{suffix}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontWeight: 500 }}>
                  {label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Activity */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "20px", marginBottom: "28px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Zap size={16} color="#F97316" />
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Weekly Activity</h3>
            </div>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>This week</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "60px" }}>
            {days.map((day, i) => {
              const height = [20, 45, 30, 55, 40, 15, 0][i];
              const isToday = i === (new Date().getDay() + 6) % 7;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                  <div style={{
                    width: "100%",
                    height: `${Math.max(height, 4)}px`,
                    borderRadius: "4px",
                    background: height > 0 ? (isToday ? "#0D9488" : "rgba(13,148,136,0.3)") : "var(--surface-2)",
                  }} />
                  <span style={{ fontSize: "10px", color: isToday ? "#0D9488" : "var(--text-light)", fontFamily: "var(--font-body)", fontWeight: isToday ? 700 : 400 }}>
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Study Tools */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px", color: "var(--text)" }}>Study Tools</h2>
          <span style={{ fontSize: "12px", color: "#0D9488", fontFamily: "var(--font-body)", fontWeight: 600 }}>5 available</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", marginBottom: "28px" }}>
          {featureCards.map(({ href, icon: Icon, label, description, color, bg }, idx) => (
            <Link key={href} href={href} style={{
              display: "flex",
              flexDirection: "column",
              padding: "18px 14px",
              borderRadius: "var(--radius)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              textDecoration: "none",
              color: "inherit",
              boxShadow: "var(--shadow-xs)",
              transition: "all 0.2s ease",
              opacity: animating ? 1 : 0,
              transform: animating ? "translateY(0)" : "translateY(12px)",
            }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                <Icon size={20} color={color} />
              </div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "4px" }}>{label}</p>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.4 }}>{description}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", flexShrink: 0 }}>
              🎓
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "3px" }}>Ready to study?</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-body)", lineHeight: 1.4 }}>Pick a tool and start earning points</p>
            </div>
          </div>
          <Link href="/flashcards" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "10px 16px", borderRadius: "99px", background: "var(--gradient)", color: "white", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", flexShrink: 0, whiteSpace: "nowrap" }}>
            Start <ChevronRight size={14} />
          </Link>
        </div>

      </div>
    </AppShell>
  );
}