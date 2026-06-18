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

        // Subscribe to real-time notifications for THIS user only
        const unsubscribe = subscribeToNotifications(user.id);

        // Listen for likes on user's posts — filter server-side by user_id
        const likeChannel = supabase
          .channel(`user:${user.id}:likes`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "post_likes",
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              const likeData = payload.new as any;

              // Verify this like is on a post authored by current user
              const { data: post } = await supabase
                .from("posts")
                .select("author_id")
                .eq("id", likeData.post_id)
                .single();

              if (post?.author_id === user.id && likeData.user_id !== user.id) {
                const { data: liker } = await supabase
                  .from("profiles")
                  .select("username")
                  .eq("id", likeData.user_id)
                  .single();

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
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              console.error("Like channel error");
            }
          });

        // Listen for comments on user's posts
        const commentChannel = supabase
          .channel(`user:${user.id}:comments`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "comments",
              filter: `user_id=eq.${user.id}`,
            },
            async (payload) => {
              const commentData = payload.new as any;

              const { data: post } = await supabase
                .from("posts")
                .select("author_id")
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
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              console.error("Comment channel error");
            }
          });

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
