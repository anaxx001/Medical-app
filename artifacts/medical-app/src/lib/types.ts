// Support Ticket types
export type TicketDepartment = "Complaints" | "Suggestions" | "Moderator/Admin Nominations" | "Technical Feedback";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  department: TicketDepartment;
  subject: string;
  message: string;
  status: "open" | "in-progress" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

export interface SupportTicketFormData {
  department: TicketDepartment;
  subject: string;
  message: string;
}

export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  status: string | null;
  institution: string | null;
  university: string | null;
  profession: string | null;
  course: string | null;
  study_year: string | null;
  role: string;
  is_verified?: boolean;
  is_private?: boolean;
  created_at: string;
}
