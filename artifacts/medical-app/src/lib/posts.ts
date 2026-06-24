import type { Post } from "@/components/PostCard";

/**
 * Normalize a raw Supabase post row (with aggregated comment_count / likes_count)
 * into the shape expected by PostCard.
 *
 * Important: PostCard's prop type expects `comments_count` and `likes_count`
 * (matching its render code), not `comment_count` — using the wrong name here
 * silently shows "0 comments" on every post card, since the field PostCard
 * actually reads is never populated.
 */
export function normalizePost(raw: Record<string, unknown>): Post {
  return {
    ...(raw as unknown as Post),
    comments_count:
      (raw.comment_count as { count: number }[])?.[0]?.count || 0,
    likes_count:
      (raw.likes_count as { count: number }[])?.[0]?.count || 0,
    user_vote: (raw.user_vote as Post["user_vote"]) || null,
  };
}

/**
 * Normalize an array of raw post rows.
 */
export function normalizePosts(rows: Record<string, unknown>[]): Post[] {
  return rows.map(normalizePost);
}
