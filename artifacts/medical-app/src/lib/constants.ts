/**
 * Shared constants used across multiple pages/components.
 */

/** Background + text color for each user role badge. */
export const ROLE_COLORS: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
  admin: { bg: "#FFF8EC", color: "#F5A623" },
  moderator: { bg: "#EBF5FF", color: "#2D87C8" },
  exco: { bg: "#F5F0FF", color: "#9B6DFF" },
  student: { bg: "#EDFFF5", color: "#3DBE7A" },
};

/** Human-readable labels for each role. */
export const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  moderator: "Moderator",
  exco: "Exco",
  student: "Student",
};

/**
 * Supabase select string for posts with author, community, and comment count.
 * Used by HomePage, CommunityPage, PostDetailPage, ProfilePage.
 */
export const POST_SELECT_FIELDS = `
  id, title, content, file_url, file_type,
  is_announcement, is_pinned, upvotes, downvotes, created_at,
  author:profiles!author_id(id, username, full_name, avatar_url, profession),
  community:communities!community_id(id, name, slug, icon),
  comment_count:comments(count)
`;
