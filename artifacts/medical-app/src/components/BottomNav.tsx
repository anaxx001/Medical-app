import { Link, useLocation } from "wouter";
import { Home, Users, PenSquare, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export default function BottomNav() {
  const [location] = useLocation();
  const supabase = createClient();
  const [username, setUsername] = useState<string | null>(null);
  const [animatingLabel, setAnimatingLabel] = useState<string | null>(null);

  useEffect(() => {
    async function getLoggedUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          if (data?.username) setUsername(data.username);
        }
      } catch (err) {
        console.error("Supabase connection error:", err);
      }
    }
    getLoggedUser();
  }, []);

  const isHome = location === "/" || location === "/feed" || location === "/dashboard";
  const isCreate = location === "/create";
  const isMessages = location === "/messages";
  const isProfile = username ? location === `/profile/${username}` : false;

  const navItems = [
    { href: "/", icon: Home, label: "Home", isActive: isHome },
    { href: "/groups", icon: Users, label: "Groups", isActive: location.startsWith("/c/") },
    { href: "/create", icon: PenSquare, label: "Create", isActive: isCreate },
    { href: "/messages", icon: MessageCircle, label: "Messages", isActive: isMessages },
    { href: username ? `/profile/${username}` : "/login", icon: User, label: "Profile", isActive: isProfile },
  ];

  const handleNavClick = (label: string) => {
    setAnimatingLabel(label);
    setTimeout(() => setAnimatingLabel(null), 300);
  };

  return (
    <>
      <style>{`
        @keyframes navTap {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            transform: scale(1);
          }
        }

        .nav-tap-animate {
          animation: navTap 0.3s ease-in-out;
        }
      `}</style>
      <nav style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "56px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 50,
        width: "100vw",
      }}>
        {navItems.map(({ href, icon: Icon, label, isActive }) => (
          <Link
            key={label}
            href={href}
            onClick={() => handleNavClick(label)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              textDecoration: "none",
              padding: "8px 16px",
              borderRadius: "8px",
              color: isActive ? "#0D9488" : "var(--text-muted)",
              fontSize: "11px",
              fontFamily: "var(--font-display)",
              fontWeight: isActive ? 600 : 400,
              cursor: "pointer",
              transition: "color 0.2s, background-color 0.2s",
            }}
          >
            <Icon
              size={20}
              strokeWidth={isActive ? 2.5 : 1.8}
              fill={isActive ? "#0D9488" : "none"}
              className={animatingLabel === label ? "nav-tap-animate" : ""}
              style={{
                transition: "all 0.2s",
              }}
            />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
