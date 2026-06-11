import { Link, useLocation } from "wouter";
import { X, Newspaper, LayoutDashboard, BookOpen, BrainCircuit, FileText, ClipboardList, MessageSquareText, Settings, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

const navItems = [
  { href: "/", icon: Newspaper, label: "Home" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/flashcards", icon: BookOpen, label: "Flashcards" },
  { href: "/quiz", icon: BrainCircuit, label: "Quiz" },
  { href: "/notes", icon: FileText, label: "Notes" },
  { href: "/past-questions", icon: ClipboardList, label: "Past Questions" },
  { href: "/chatbot", icon: MessageSquareText, label: "AI Chatbot" },
];

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const supabase = createClient();
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("username, role")
        .eq("id", user.id)
        .single();
      if (data) {
        setUsername(data.username);
        setRole(data.role);
      }
    }
    getProfile();
  }, []);

  return (
    <aside style={{ width: "240px", minHeight: "100vh", background: "var(--surface)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, zIndex: 60, boxShadow: "var(--shadow)", transform: isOpen ? "translateX(0)" : "translateX(-100%)", transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }}>
      <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🩺</div>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MedStudent</span>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", borderRadius: "6px", color: "var(--text-muted)", display: "flex" }}>
          <X size={18} />
        </button>
      </div>

      <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: "4px", overflowY: "auto" }}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "var(--radius-sm)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: isActive ? 600 : 400, fontSize: "14.5px", color: isActive ? "white" : "var(--text-muted)", background: isActive ? "var(--gradient)" : "transparent", boxShadow: isActive ? "0 4px 14px rgba(45,135,200,0.25)" : "none" }}>
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          );
        })}

        {(role === "admin" || role === "super_admin") && (
          <Link href="/admin" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "var(--radius-sm)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "14.5px", color: "var(--text-muted)", background: "transparent" }}>
            🛡️ Admin Panel
          </Link>
        )}

        {role === "moderator" && (
          <Link href="/moderator" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 14px", borderRadius: "var(--radius-sm)", textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 400, fontSize: "14.5px", color: "var(--text-muted)", background: "transparent" }}>
            🔰 Mod Panel
          </Link>
        )}
      </nav>

      <div style={{ padding: "12px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "4px" }}>
        {username && (
          <Link href={`/profile/${username}`} onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "var(--radius-sm)", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px" }}>
            <UserCircle size={17} />
            My Profile
          </Link>
        )}
        <Link href="/settings" onClick={onClose} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "var(--radius-sm)", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px" }}>
          <Settings size={17} />
          Settings
        </Link>
        <p style={{ fontSize: "11px", color: "var(--text-light)", textAlign: "center", marginTop: "6px" }}>Built for medical students 🌿</p>
      </div>
    </aside>
  );
}
