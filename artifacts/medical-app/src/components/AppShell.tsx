import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Sidebar from "./Sidebar";
import OnboardingModal from "./OnboardingModal";
import BottomNav from "./BottomNav";
import { Menu, Bell } from "lucide-react";
import { getPrefs, getGreeting, UserPrefs } from "@/lib/userPrefs";
import { createClient } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const supabase = createClient();
  const { darkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [visible, setVisible] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  useEffect(() => {
    async function checkAuthAndPrefs() {
      try {
        // Check if user has an active Supabase session
        const { data: { session } } = await supabase.auth.getSession();
        
        // If user is authenticated, skip onboarding
        if (session?.user) {
          setPrefs(getPrefs() || null);
          setLoaded(true);
          return;
        }

        // If no session, check for saved local prefs
        const saved = getPrefs();
        const isAuthPage = location === "/login" || location === "/signup";
        
        // Only show onboarding if no saved prefs AND not on auth page
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

  // Fetch unread notification count with proper real-time listener
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function setupNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Fetch initial count
        const { data } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_read", false);

        if (data) {
          setUnreadNotificationCount(data.length);
        }

        // Set up real-time listener
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
              // Refetch count on any change
              const { data: updatedData } = await supabase
                .from("notifications")
                .select("id")
                .eq("user_id", user.id)
                .eq("is_read", false);

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
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [location]);

  function handleOnboardingComplete() {
    setPrefs(getPrefs());
    setShowOnboarding(false);
  }

  const isDashboard = location === "/";
  const greeting = prefs
    ? getGreeting(prefs.profession).replace(
        "Good day,",
        prefs.name ? `Good day, ${prefs.name} —` : "Good day,"
      )
    : "Good day 👋";

  // Show loading spinner instead of white screen
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
            borderTop: "3px solid var(--blue)",
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
    }} className="dark:bg-slate-950">
      {showOnboarding && (
        <OnboardingModal onComplete={handleOnboardingComplete} />
      )}

      {/* Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 55,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{
        marginLeft: 0,
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        width: "100%",
        maxWidth: "100vw",
        paddingBottom: "80px",
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
        }} className="dark:bg-slate-800 dark:border-slate-700">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px",
                color: "var(--text)",
              }}
              className="dark:text-slate-100"
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
                }} className="dark:text-slate-100">
                  {greeting}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-light)" }} className="dark:text-slate-400">
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
              }}
              className="dark:text-slate-100"
            >
              <Bell size={22} />
              {unreadNotificationCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "2px",
                  right: "2px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "#E8445A",
                  border: "2px solid var(--surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "700",
                  color: "white",
                  fontFamily: "var(--font-display)",
                }} className="dark:border-slate-800">
                  {unreadNotificationCount > 99 ? "99+" : unreadNotificationCount}
                </span>
              )}
            </Link>

            <Link
              href={prefs?.username ? `/profile/${prefs.username}` : "/login"}
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
              }}
            >
              {prefs?.name ? prefs.name[0].toUpperCase() : "M"}
            </Link>
          </div>
        </header>

        {/* Page content with animation */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }} className="dark:bg-slate-950">
          <div style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(12px)",
            transition: "opacity 0.25s ease, transform 0.25s ease",
          }}>
            {children}
          </div>
        </div>
      </main>

      {/* Bottom nav — pinned to bottom */}
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
