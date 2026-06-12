import { Link, useLocation } from "wouter";
import {
  X,
  Home,
  User,
  Bookmark,
  PenSquare,
  Users,
  Settings,
  Moon,
  Sun,
  Circle,
  HelpCircle,
  Lock,
  LogOut,
  Zap,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  profession?: string;
  avatar_url?: string;
  is_admin?: boolean;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();
  const supabase = createClient();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, full_name, profession, avatar_url, is_admin")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
        }

        const { data: communitiesData } = await supabase
          .from("communities")
          .select("id, name, slug, icon")
          .limit(8);

        if (communitiesData) {
          setCommunities(communitiesData);
        }
      } catch (err) {
        console.error("Error loading sidebar data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadUserData();
  }, []);

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: profile ? `/profile/${profile.username}` : "/login", icon: User, label: "My Profile" },
    { href: "/saved", icon: Bookmark, label: "Saved Posts" },
    { href: "/create", icon: PenSquare, label: "Create Post" },
    { href: "/chatbot", icon: Zap, label: "AI Chatbot" },
    { href: "/groups", icon: Users, label: "Groups" },
  ];

  const isActive = (href: string) => location === href;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const navLinkStyle = (active: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "12px 14px",
    borderRadius: "10px",
    textDecoration: "none",
    fontFamily: "var(--font-display)",
    fontWeight: active ? 600 : 500,
    fontSize: "14px",
    color: active ? "#0D9488" : "var(--text-muted)",
    background: active ? "rgba(13, 148, 136, 0.1)" : "transparent",
    transition: "all 0.2s ease",
    cursor: "pointer",
    border: "none",
    width: "100%",
    textAlign: "left",
  });

  return (
    <>
      {/* Slide-in drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          maxWidth: "85vw",
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }}
      >
        {/* Header — fixed, not scrollable */}
        <div style={{ padding: "16px 16px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <img src="/logo.png" width="28" height="28" style={{ borderRadius: "8px" }} alt="" />
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", margin: 0 }}>
                MedStudent
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px",
                color: "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "6px",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile card */}
          {loading ? (
            <div style={{ height: "76px", background: "var(--surface-2)", borderRadius: "10px", marginBottom: "12px" }} className="skeleton" />
          ) : profile ? (
            <Link
              href={`/profile/${profile.username}`}
              onClick={onClose}
              style={{
                display: "flex",
                gap: "12px",
                textDecoration: "none",
                borderRadius: "10px",
                padding: "12px",
                background: "var(--surface-2)",
                marginBottom: "12px",
                cursor: "pointer",
              }}
            >
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: "var(--gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: "white",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "16px",
                overflow: "hidden",
              }}>
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(profile.full_name || profile.username)
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: "0 0 2px 0" }}>
                  {profile.full_name || profile.username}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px 0" }}>
                  u/{profile.username}
                </p>
                {profile.profession && (
                  <span style={{
                    fontSize: "11px",
                    color: "#0D9488",
                    background: "rgba(13,148,136,0.1)",
                    padding: "2px 8px",
                    borderRadius: "99px",
                    fontWeight: 600,
                  }}>
                    {profile.profession}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link
              href="/login"
              onClick={onClose}
              style={{
                display: "block",
                padding: "12px",
                borderRadius: "10px",
                background: "var(--surface-2)",
                marginBottom: "12px",
                textAlign: "center",
                color: "#0D9488",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Scrollable nav area */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px", minHeight: 0 }}>
          <nav style={{ display: "flex", flexDirection: "column", gap: "4px", paddingTop: "4px" }}>
            {navItems.map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href} onClick={onClose} style={navLinkStyle(isActive(href))}>
                <Icon size={18} strokeWidth={isActive(href) ? 2.5 : 2} style={{ flexShrink: 0 }} />
                {label}
              </Link>
            ))}

            {/* Admin Panel — only if admin */}
            {profile?.is_admin && (
              <Link href="/admin" onClick={onClose} style={{ ...navLinkStyle(isActive("/admin")), color: isActive("/admin") ? "#0D9488" : "#F97316" }}>
                <ShieldCheck size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
                Admin Panel
              </Link>
            )}

            {/* My Communities */}
            {communities.length > 0 && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <p style={{ fontSize: "11px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase", margin: "0 0 6px 14px", letterSpacing: "0.5px" }}>
                  My Communities
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {communities.slice(0, 6).map((community) => (
                    <Link
                      key={community.id}
                      href={`/c/${community.slug}`}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        padding: "9px 14px",
                        borderRadius: "8px",
                        textDecoration: "none",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        background: "transparent",
                      }}
                    >
                      <span style={{ fontSize: "15px" }}>{community.icon}</span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        r/{community.slug}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom fixed section */}
        <div style={{ flexShrink: 0, padding: "8px", borderTop: "1px solid var(--border)" }}>
          <Link href="/settings" onClick={onClose} style={navLinkStyle(isActive("/settings"))}>
            <Settings size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Settings
          </Link>

          <button onClick={toggleTheme} style={navLinkStyle(false)}>
            {darkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <button onClick={() => setOnlineStatus(!onlineStatus)} style={navLinkStyle(false)}>
            <Circle size={18} strokeWidth={2} style={{ flexShrink: 0, fill: onlineStatus ? "#10B981" : "var(--border)" }} />
            {onlineStatus ? "Online" : "Invisible"}
          </button>

          <a href="#help" onClick={onClose} style={navLinkStyle(false)}>
            <HelpCircle size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Help & Support
          </a>

          <a href="#privacy" onClick={onClose} style={navLinkStyle(false)}>
            <Lock size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Privacy Policy
          </a>

          <button onClick={handleLogout} style={{ ...navLinkStyle(false), color: "#EF4444" }}>
            <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}