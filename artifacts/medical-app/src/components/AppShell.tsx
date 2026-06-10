import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import Sidebar from "./Sidebar";
import OnboardingModal from "./OnboardingModal";
import BottomNav from "./BottomNav";
import { Menu } from "lucide-react";
import { getPrefs, getGreeting, UserPrefs } from "@/lib/userPrefs";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prefs, setPrefs] = useState<UserPrefs | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = getPrefs();
    if (!saved) setShowOnboarding(true);
    else setPrefs(saved);
    setLoaded(true);
  }, []);

  function handleOnboardingComplete() {
    setPrefs(getPrefs());
    setShowOnboarding(false);
  }

  const isDashboard = location === "/";
  const greeting = prefs ? getGreeting(prefs.profession).replace("Good day,", prefs.name ? `Good day, ${prefs.name} —` : "Good day,") : "Good day 👋";

  if (!loaded) return null;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 55, backdropFilter: "blur(2px)" }} />}

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main style={{ marginLeft: "clamp(0px, 240px, 240px)", flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%", paddingBottom: "64px" }}>
        <header style={{ height: "64px", background: "var(--surface)", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", position: "sticky", top: 0, zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px", color: "var(--text)" }}>
              <Menu size={22} />
            </button>
            {isDashboard && (
              <div>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>{greeting}</p>
                <p style={{ fontSize: "11px", color: "var(--text-light)" }}>Keep pushing — every page counts.</p>
              </div>
            )}
          </div>

          <Link
            href={prefs?.username ? `/profile/${prefs.username}` : "/login"}
            style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, textDecoration: "none" }}
          >
            {prefs?.name ? prefs.name[0].toUpperCase() : "M"}
          </Link>
        </header>

        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>{children}</div>
      </main>

      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50 }}>
        <BottomNav />
      </div>
    </div>
  );
}
