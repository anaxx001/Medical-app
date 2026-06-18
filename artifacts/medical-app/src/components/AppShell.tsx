import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Sidebar from "./Sidebar";
import OnboardingModal from "./OnboardingModal";
import BottomNav from "./BottomNav";
import { AppTour } from "./AppTour";
import { Menu, Bell, Zap } from "lucide-react";
import { getPrefs, getGreeting, UserPrefs } from "@/lib/userPrefs";
import { createClient } from "@/lib/supabase";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const supabase = createClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [currentUserUsername, setCurrentUserUsername] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    async function checkAuthAndPrefs() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          setPrefs(getPrefs() || null);

          try {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, full_name, avatar_url, role")
              .eq("id", session.user.id)
              .single();

            if (profileData) {
              setCurrentUserUsername(profileData.username || null);
              setCurrentUserName(profileData.full_name || profileData.username || null);
              setCurrentUserAvatar(profileData.avatar_url || null);
              setCurrentUserRole(profileData.role || null);
            }
          } catch (err) {
            console.error("Error fetching profile:", err);
          }

          setLoaded(true);
          return;
        }

        const saved = getPrefs();
        const isAuthPage = location === "/login" || location === "/signup";

        if (!saved && !isAuthPage) {
          setShowOnboarding(true);
        } else {
          setPrefs(saved);
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
      } finally {
        setLoaded(true);
      }
    }

    checkAuthAndPrefs();
  }, []);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function setupNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("read", false);

        if (data) {
          setUnreadNotificationCount(data.length);
        }

        const channel = supabase
          .channel(`notifications-${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${user.id}`,
            },
            async () => {
              const { data: updatedData } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", user.id)
                .eq("read", false);

              if (updatedData) {
                setUnreadNotificationCount(updatedData.length);
              }
            }
          )
          .subscribe();

        unsubscribe = () => {
          supabase.removeChannel(channel);
        };
      } catch (err) {
        console.error("Error setting up notifications:", err);
      }
    }

    setupNotifications();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 1024);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [location]);

  function handleOnboardingComplete() {
    setPrefs(getPrefs());
    setShowOnboarding(false);
  }

  const isDashboard = location === "/";
  const greeting = currentUserName
    ? `Good day, ${currentUserName.split(" ")[0]} 👋`
    : prefs
    ? getGreeting(prefs.profession).replace(
        "Good day,",
        prefs.name ? `Good day, ${prefs.name} —` : "Good day,"
      )
    : "Good day 👋";

  function getAvatarLetter() {
    if (currentUserName) return currentUserName[0].toUpperCase();
    if (prefs?.name) return prefs.name[0].toUpperCase();
    return "?";
  }

  if (!loaded) {
    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTop: "3px solid #0D9488",
            animation: "spin 1s linear infinite",
          }} />
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "14px" }}>
            Loading MedStudent...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      background: "var(--bg)",
      position: "relative",
    }}>
      {/* App Tour */}
      <AppTour />

      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 55,
            
          }}
        />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        userRole={currentUserRole}
      />

      <main style={{
        marginLeft: isDesktop ? "280px" : 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        paddingBottom: "80px",
        background: "var(--bg)",
      }}>

        {/* Header */}
        <header style={{
          height: "64px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          position: "sticky",
          top: 0,
          zIndex: 30,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                color: "var(--text)",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Menu size={22} />
            </button>
            {isDashboard && (
              <div>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--text)",
                }}>
                  {greeting}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-light)" }}>
                  Keep pushing — every page counts.
                </p>
              </div>
            )}
          </div>

          {/* Right side — bell + avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Link
              href="/notifications"
              style={{
                position: "relative",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textDecoration: "none",
                borderRadius: "8px",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <Bell size={22} className={unreadNotificationCount > 0 ? "bell-shake" : ""} />
              {unreadNotificationCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  minWidth: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#F97316",
                  border: "2px solid var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  padding: "0 4px",
                }}>
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </Link>

            <Link
              href={currentUserUsername ? `/profile/${currentUserUsername}` : "/login"}
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "var(--gradient)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 700,
                textDecoration: "none",
                overflow: "hidden",
                flexShrink: 0,
                border: "2px solid transparent",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0D9488"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
            >
              {currentUserAvatar ? (
                <img src={currentUserAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                getAvatarLetter()
              )}
            </Link>
          </div>
        </header>

        {/* Page content with animation */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", background: "var(--bg)" }}>
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(12px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}>
            {children}
          </div>
        </div>
      </main>

      {/* Bottom nav */}
      <div style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        width: "100vw",
      }}>
        <BottomNav />
      </div>

    </div>
  );
}
