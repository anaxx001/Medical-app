import { Link, useLocation } from "wouter";
import {
  X,
  Home,
  User,
  Bookmark,
  History,
  PenSquare,
  Users,
  Settings,
  Moon,
  Sun,
  Circle,
  HelpCircle,
  Lock,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
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
  const [darkMode, setDarkMode] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch user profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .eq("id", user.id)
          .single();

        if (profileData) {
          setProfile({
            ...profileData,
            followers_count: 0,
            following_count: 0,
          });
        }

        // Fetch user's communities
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
    { href: "/profile", icon: User, label: "My Profile" },
    { href: "/saved", icon: Bookmark, label: "Saved Posts" },
    { href: "/history", icon: History, label: "History" },
    { href: "/create", icon: PenSquare, label: "Create Post" },
  ];

  const isActive = (href: string) => location === href;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

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
          background: "var(--surface)",
          borderRight: "1px solid var(--border)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowY: "auto",
        }}
      >
        {/* TOP SECTION — User Profile */}
        <div style={{ padding: "20px 16px", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", margin: 0 }}>
              MedStudent
            </h2>
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
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.color = "var(--text-muted)";
              }}
            >
              <X size={20} />
            </button>
          </div>

          {loading ? (
            <div style={{ height: "100px", background: "var(--surface-2)", borderRadius: "10px" }} />
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
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(45, 135, 200, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--surface-2)";
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: "var(--gradient)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "18px",
                  overflow: "hidden",
                }}
              >
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  getInitials(profile.full_name)
                )}
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)", margin: "0 0 4px 0" }}>
                  {profile.full_name}
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                  u/{profile.username}
                </p>
                <div style={{ display: "flex", gap: "12px", fontSize: "12px" }}>
                  <div style={{ color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>0</span> Followers
                  </div>
                  <div style={{ color: "var(--text-muted)" }}>
                    <span style={{ fontWeight: 600, color: "var(--text)" }}>0</span> Following
                  </div>
                </div>
              </div>
            </Link>
          ) : null}
        </div>

        {/* NAVIGATION LINKS */}
        <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: "4px", overflow: "auto" }}>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "12px 14px",
                borderRadius: "10px",
                textDecoration: "none",
                fontFamily: "var(--font-display)",
                fontWeight: isActive(href) ? 600 : 500,
                fontSize: "14px",
                color: isActive(href) ? "#0D9488" : "var(--text-muted)",
                background: isActive(href) ? "rgba(13, 148, 136, 0.1)" : "transparent",
                transition: "all 0.2s ease",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                if (!isActive(href)) {
                  e.currentTarget.style.background = "var(--surface-2)";
                  e.currentTarget.style.color = "var(--text)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(href)) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon size={18} strokeWidth={isActive(href) ? 2.5 : 2} style={{ flexShrink: 0 }} />
              {label}
            </Link>
          ))}

          {/* My Communities */}
          {communities.length > 0 && (
            <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
              <p style={{ fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", margin: "0 0 8px 14px", letterSpacing: "0.5px" }}>
                My Communities
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {communities.slice(0, 5).map((community) => (
                  <Link
                    key={community.id}
                    href={`/c/${community.slug}`}
                    onClick={onClose}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      background: "transparent",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--surface-2)";
                      e.currentTarget.style.color = "var(--text)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--text-muted)";
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{community.icon}</span>
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      r/{community.slug}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* SETTINGS SECTION */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
          <Link
            href="/settings"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--text-muted)",
              background: "transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Settings size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Settings
          </Link>

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            {darkMode ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Online Status Toggle */}
          <button
            onClick={() => setOnlineStatus(!onlineStatus)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--text-muted)",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Circle
              size={18}
              strokeWidth={2}
              style={{
                flexShrink: 0,
                fill: onlineStatus ? "#3DBE7A" : "#DDE8F0",
              }}
            />
            {onlineStatus ? "Online" : "Invisible"}
          </button>
        </div>

        {/* BOTTOM SECTION */}
        <div style={{ padding: "12px 8px" }}>
          <a
            href="#help"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--text-muted)",
              background: "transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <HelpCircle size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Help & Support
          </a>

          <a
            href="#privacy"
            onClick={onClose}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              textDecoration: "none",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "var(--text-muted)",
              background: "transparent",
              transition: "all 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-2)";
              e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--text-muted)";
            }}
          >
            <Lock size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Privacy Policy
          </a>

          <button
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "12px 14px",
              borderRadius: "10px",
              border: "none",
              background: "transparent",
              fontFamily: "var(--font-display)",
              fontWeight: 500,
              fontSize: "14px",
              color: "#EF4444",
              cursor: "pointer",
              transition: "all 0.2s ease",
              width: "100%",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <LogOut size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
            Log Out
          </button>
        </div>
      </div>
    </>
  );
}
