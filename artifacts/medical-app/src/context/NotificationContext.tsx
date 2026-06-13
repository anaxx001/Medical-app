import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase";

export interface Notification {
  id: string;
  user_id: string;
  type: "like" | "comment" | "share" | "welcome" | "moderator_guide" | "tour_guide";
  content: string;
  post_id?: string;
  triggered_by_user_id?: string;
  read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  homeBadgeCount: number;
  newsBadgeCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (id: string) => void;
  clearNewsBadge: () => void;
  subscribeToNotifications: (userId: string) => () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [homeBadgeCount, setHomeBadgeCount] = useState(0);
  const [newsBadgeCount, setNewsBadgeCount] = useState(0);

  // Fetch initial notifications
  useEffect(() => {
    async function fetchNotifications() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;
        if (data) {
          setNotifications(data as Notification[]);
          updateBadgeCounts(data as Notification[]);
        }
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    }

    fetchNotifications();
  }, []);

  const updateBadgeCounts = useCallback((notifs: Notification[]) => {
    const unread = notifs.filter((n) => !n.read);
    const homeNotifs = unread.filter((n) => ["like", "comment", "share"].includes(n.type));
    const newsNotifs = unread.filter((n) => n.type === "welcome");
    
    setHomeBadgeCount(homeNotifs.length);
    setNewsBadgeCount(newsNotifs.length);
  }, []);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    updateBadgeCounts([notification, ...notifications]);
  }, [notifications, updateBadgeCounts]);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    updateBadgeCounts(updated);
  }, [notifications, updateBadgeCounts]);

  const clearNewsBadge = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => (n.type === "welcome" ? { ...n, read: true } : n))
    );
    const updated = notifications.map((n) => (n.type === "welcome" ? { ...n, read: true } : n));
    updateBadgeCounts(updated);
  }, [notifications, updateBadgeCounts]);

  const subscribeToNotifications = useCallback((userId: string) => {
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification;
          addNotification(newNotif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, addNotification]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        homeBadgeCount,
        newsBadgeCount,
        addNotification,
        markAsRead,
        clearNewsBadge,
        subscribeToNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotificationContext must be used within NotificationProvider");
  }
  return context;
}
