import { createClient } from "@/lib/supabase";
import { SupportTicket, SupportTicketFormData } from "./types";

const supabase = createClient();

// Submit a support ticket
export async function submitSupportTicket(
  userId: string,
  userName: string,
  ticketData: SupportTicketFormData
): Promise<SupportTicket | null> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .insert([
        {
          user_id: userId,
          user_name: userName,
          department: ticketData.department,
          subject: ticketData.subject,
          message: ticketData.message,
          status: "open",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error submitting support ticket:", error);
      return null;
    }

    return data as SupportTicket;
  } catch (err) {
    console.error("Unexpected error submitting support ticket:", err);
    return null;
  }
}

// Get all support tickets (admin only)
export async function getAllSupportTickets(): Promise<SupportTicket[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }

    return (data || []) as SupportTicket[];
  } catch (err) {
    console.error("Unexpected error fetching support tickets:", err);
    return [];
  }
}

// Get support tickets by department
export async function getTicketsByDepartment(department: string): Promise<SupportTicket[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("department", department)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching tickets by department:", error);
      return [];
    }

    return (data || []) as SupportTicket[];
  } catch (err) {
    console.error("Unexpected error fetching tickets by department:", err);
    return [];
  }
}

// Get user's own support tickets
export async function getUserSupportTickets(userId: string): Promise<SupportTicket[]> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user support tickets:", error);
      return [];
    }

    return (data || []) as SupportTicket[];
  } catch (err) {
    console.error("Unexpected error fetching user support tickets:", err);
    return [];
  }
}

// Update ticket status (admin only)
export async function updateTicketStatus(
  ticketId: string,
  status: "open" | "in-progress" | "resolved" | "closed"
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("support_tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", ticketId);

    if (error) {
      console.error("Error updating ticket status:", error);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Unexpected error updating ticket status:", err);
    return false;
  }
}
