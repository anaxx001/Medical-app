import type { Post } from "@/components/PostCard";

/**
 * Normalize a raw Supabase post row (with aggregated comment_count)
 * into the shape expected by PostCard.
 */
export function normalizePost(raw: Record<string, unknown>): Post {
  return {
    ...(raw as unknown as Post),
    comment_count:
      (raw.comment_count as { count: number }[])?.[0]?.count || 0,
    user_vote: (raw.user_vote as Post["user_vote"]) || null,
  };
}

/**
 * Normalize an array of raw post rows.
 */
export function normalizePosts(rows: Record<string, unknown>[]): Post[] {
  return rows.map(normalizePost);
}
