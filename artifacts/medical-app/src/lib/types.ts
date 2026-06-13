/**
 * Shared TypeScript interfaces reused across pages and components.
 */

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  profession?: string;
  bio?: string;
  institution?: string;
  course?: string;
  study_year?: string;
  role: string;
  created_at: string;
  is_banned?: boolean;
  post_count?: number;
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  member_count?: number;
  weekly_visitors?: number;
  topic?: string;
  post_count?: number;
  created_at?: string;
  creator_id?: string;
  is_official?: boolean;
  is_featured?: boolean;
}
