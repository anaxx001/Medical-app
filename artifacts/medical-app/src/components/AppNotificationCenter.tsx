import { useEffect } from "react";
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
    let likeChannel: ReturnType<typeof supabase.channel> | null = null;
    let commentChannel: ReturnType<typeof supabase.channel> | null = null;
    let unsubscribe: (() => void) | null = null;

    async function setupListeners() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Subscribe to real-time notifications for THIS user only
        unsubscribe = subscribeToNotifications(user.id);

        // IMPORTANT: post_likes.user_id and comments.user_id are the
        // LIKER/COMMENTER, not the post author. Filtering on
        // `user_id=eq.${user.id}` (the old code) only ever matched your
        // OWN likes/comments on someone else's post — never the case we
        // actually care about: someone else acting on YOUR post.
        //
        // Fix: scope the filter to the IDs of posts this user authored,
        // using the `post_id` column instead.
        const { data: myPosts, error: postsError } = await supabase
          .from("posts")
          .select("id")
          .eq("author_id", user.id);

        if (postsError) {
          console.error("Error fetching user's posts for notification scope:", postsError);
          return;
        }

        const myPostIds = (myPosts ?? []).map((p) => p.id);

        // Nothing to listen for if the user has no posts yet.
        if (myPostIds.length === 0) {
          return;
        }

        const postIdFilter = `post_id=in.(${myPostIds.join(",")})`;

        // Listen for likes on user's posts
        likeChannel = supabase
          .channel(`user:${user.id}:likes`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "post_likes",
              filter: postIdFilter,
            },
            async (payload) => {
              const likeData = payload.new as any;

              // Don't notify when the user likes their own post
              if (likeData.user_id === user.id) return;

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
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              console.error("Like channel error");
            }
          });

        // Listen for comments on user's posts
        commentChannel = supabase
          .channel(`user:${user.id}:comments`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "comments",
              filter: postIdFilter,
            },
            async (payload) => {
              const commentData = payload.new as any;

              // Don't notify when the user comments on their own post
              if (commentData.user_id === user.id) return;

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
          )
          .subscribe((status) => {
            if (status === "CHANNEL_ERROR") {
              console.error("Comment channel error");
            }
          });
      } catch (err) {
        console.error("Error setting up notification listeners:", err);
      }
    }

    setupListeners();

    return () => {
      unsubscribe?.();
      if (likeChannel) supabase.removeChannel(likeChannel);
      if (commentChannel) supabase.removeChannel(commentChannel);
    };
  }, [supabase, subscribeToNotifications, addNotification]);

  return null; // This component doesn't render anything
}
