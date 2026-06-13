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
