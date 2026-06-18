import { Link, useLocation } from "wouter";
import { Home, Newspaper, PenSquare, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";

interface UnreadCounts {
  messages: number;
  notifications: number;
  news: number;
}

export default function BottomNav() {
  const [location] = useLocation();
  const supabase = createClient();
  const [username, setUsername] = useState<string | null>(null);
  const [animatingLabel, setAnimatingLabel] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    messages: 0,
    notifications: 0,
    news: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);

  // Get logged in user
  useEffect(() => {
    async function getLoggedUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
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

  // Fetch unread counts
  useEffect(() => {
    if (!userId) return;

    async function fetchUnreadCounts() {
      try {
        // Unread messages
        const { count: msgCount } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("recipient_id", userId)
          .eq("read", false);

        // Unread notifications
        const { count: notifCount } = await supabase
          .from("notifications")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("read", false);

        // New news posts (last 24h that user hasn't viewed)
        const lastViewed = localStorage.getItem("news_last_viewed");
        let newsQuery = supabase
          .from("news_posts")
          .select("*", { count: "exact", head: true });

        if (lastViewed) {
          newsQuery = newsQuery.gt("created_at", lastViewed);
        } else {
          // First time — show last 3 posts as "new"
          const { count } = await supabase
            .from("news_posts")
            .select("*", { count: "exact", head: true })
            .order("created_at", { ascending: false })
            .limit(3);
          newsQuery = supabase
            .from("news_posts")
            .select("*", { count: "exact", head: true })
            .order("created_at", { ascending: false })
            .limit(3);
        }

        const { count: newsCount } = await newsQuery;

        setUnreadCounts({
          messages: msgCount || 0,
          notifications: notifCount || 0,
          news: newsCount || 0,
        });
      } catch (err) {
        console.error("Error fetching unread counts:", err);
      }
    }

    fetchUnreadCounts();

    // Realtime subscription for messages
    const messageSubscription = supabase
      .channel("bottom-nav-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    // Realtime subscription for notifications
    const notifSubscription = supabase
      .channel("bottom-nav-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => fetchUnreadCounts()
      )
      .subscribe();

    // Poll every 30 seconds as fallback
    const interval = setInterval(fetchUnreadCounts, 30000);

    return () => {
      messageSubscription.unsubscribe();
      notifSubscription.unsubscribe();
      clearInterval(interval);
    };
  }, [userId]);

  // Mark news as viewed when on news page
  useEffect(() => {
    if (location === "/news") {
      localStorage.setItem("news_last_viewed", new Date().toISOString());
      setUnreadCounts((prev) => ({ ...prev, news: 0 }));
    }
  }, [location]);

  const isHome = location === "/" || location === "/feed" || location === "/dashboard";
  const isNews = location === "/news";
  const isCreate = location === "/create";
  const isMessages = location === "/messages";
  const isProfile = username ? location === `/profile/${username}` : false;

  const navItems = [
    { 
      href: "/", 
      icon: Home, 
      label: "Home", 
      isActive: isHome,
      badge: 0,
    },
    { 
      href: "/news", 
      icon: Newspaper, 
      label: "News", 
      isActive: isNews,
      badge: unreadCounts.news,
    },
    { 
      href: "/create", 
      icon: PenSquare, 
      label: "Create", 
      isActive: isCreate,
      badge: 0,
    },
    { 
      href: "/messages", 
      icon: MessageCircle, 
      label: "Messages", 
      isActive: isMessages,
      badge: unreadCounts.messages,
    },
    { 
      href: username ? `/profile/${username}` : "/login", 
      icon: User, 
      label: "Profile", 
      isActive: isProfile,
      badge: unreadCounts.notifications,
    },
  ];

  const handleNavClick = (label: string) => {
    setAnimatingLabel(label);
    setTimeout(() => setAnimatingLabel(null), 300);
  };

  return (
    <>
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
        {navItems.map(({ href, icon: Icon, label, isActive, badge }) => (
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
              position: "relative",
            }}
          >
            <div style={{ position: "relative" }}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.8}
                fill={isActive ? "#0D9488" : "none"}
                className={animatingLabel === label ? "nav-tap-animate" : ""}
                style={{ transition: "all 0.2s" }}
              />
              {badge > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-6px",
                    right: "-8px",
                    background: "#EF4444",
                    color: "white",
                    fontSize: "10px",
                    fontWeight: 700,
                    minWidth: "16px",
                    height: "16px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 4px",
                    animation: "badge-pulse 2s infinite",
                  }}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </div>
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Badge pulse animation */}
      <style>{`
        @keyframes badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        .nav-tap-animate {
          animation: nav-tap 0.3s ease;
        }
        @keyframes nav-tap {
          0% { transform: scale(1); }
          50% { transform: scale(0.85); }
          100% { transform: scale(1); }
        }
      `}</style>
    </>
  );
}
