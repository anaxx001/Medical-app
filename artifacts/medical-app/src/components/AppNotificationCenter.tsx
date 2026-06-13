import { useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { useNotificationContext } from "@/context/NotificationContext";

/**
 * Background component that subscribes to real-time notifications
 * and manages notification triggers (likes, comments, shares on user's posts)
 */
export function AppNotificationCenter() {
  const supabase = createClient();
  const { addNotification, subscribeToNotifications } = useNotificationContext();

  useEffect(() => {
    async function setupListeners() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Subscribe to real-time notifications
        const unsubscribe = subscribeToNotifications(user.id);

        // Listen for changes to post_likes (auto-trigger notification)
        const likeChannel = supabase
          .channel(`post_likes:user_posts:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "post_likes",
            },
            async (payload) => {
              // Check if this like is on user's post
              const likeData = payload.new as any;
              const { data: post } = await supabase
                .from("posts")
                .select("id, author_id")
                .eq("id", likeData.post_id)
                .single();

              if (post?.author_id === user.id && likeData.user_id !== user.id) {
                // Get liker's info
                const { data: liker } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", likeData.user_id)
                  .single();

                // Insert notification
                await supabase.from("notifications").insert({
                  user_id: user.id,
                  type: "like",
                  content: `${liker?.username || "Someone"} liked your post`,
                  post_id: likeData.post_id,
                  triggered_by_user_id: likeData.user_id,
                  read: false,
                });
              }
            }
          )
          .subscribe();

        // Listen for changes to comments (auto-trigger notification)
        const commentChannel = supabase
          .channel(`comments:user_posts:${user.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "comments",
            },
            async (payload) => {
              const commentData = payload.new as any;
              const { data: post } = await supabase
                .from("posts")
                .select("id, author_id")
                .eq("id", commentData.post_id)
                .single();

              if (post?.author_id === user.id && commentData.user_id !== user.id) {
                const { data: commenter } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", commentData.user_id)
                  .single();

                await supabase.from("notifications").insert({
                  user_id: user.id,
                  type: "comment",
                  content: `${commenter?.username || "Someone"} commented on your post`,
                  post_id: commentData.post_id,
                  triggered_by_user_id: commentData.user_id,
                  read: false,
                });
              }
            }
          )
          .subscribe();

        return () => {
          unsubscribe();
          supabase.removeChannel(likeChannel);
          supabase.removeChannel(commentChannel);
        };
      } catch (err) {
        console.error("Error setting up notification listeners:", err);
      }
    }

    setupListeners();
  }, [supabase, subscribeToNotifications, addNotification]);

  return null; // This component doesn't render anything
}
