import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { createClient } from "@/lib/supabase";
import { submitSupportTicket } from "@/lib/supabase-queries";
import { SupportTicketFormData, TicketDepartment } from "@/lib/types";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

const DEPARTMENTS: TicketDepartment[] = [
  "Complaints",
  "Suggestions",
  "Moderator/Admin Nominations",
  "Technical Feedback",
];

interface SupportTicketFormProps {
  onSuccess?: () => void;
}

export default function SupportTicketForm({ onSuccess }: SupportTicketFormProps) {
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SupportTicketFormData>({
    defaultValues: {
      department: "Technical Feedback",
      subject: "",
      message: "",
    },
  });

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const supabase = createClient();

  async function onSubmit(data: SupportTicketFormData) {
    try {
      setSubmitError(null);
      setSuccessMessage(null);

      // Get current user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setSubmitError("You must be logged in to submit a support ticket.");
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", session.user.id)
        .single();

      const userName = profile?.full_name || session.user.email || "User";

      // Submit ticket
      const result = await submitSupportTicket(session.user.id, userName, data);

      if (result) {
        setSuccessMessage("✓ Support ticket submitted successfully! We'll review it soon.");
        reset();
        
        // Clear success message after 4 seconds
        setTimeout(() => {
          setSuccessMessage(null);
          if (onSuccess) onSuccess();
        }, 4000);
      } else {
        setSubmitError("Failed to submit support ticket. Please try again.");
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.");
      console.error("Error submitting support ticket:", err);
    }
  }

  return (
    <div style={{
      maxWidth: "600px",
      margin: "0 auto",
      padding: "24px",
      background: "var(--surface)",
      borderRadius: "var(--radius)",
      border: "1px solid var(--border)",
    }}>
      <h2 style={{
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: "20px",
        color: "var(--text)",
        marginBottom: "8px",
      }}>
        Submit a Support Ticket
      </h2>
      <p style={{
        fontSize: "14px",
        color: "var(--text-muted)",
        marginBottom: "24px",
      }}>
        Let us know how we can help. We review all submissions and will get back to you soon.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {/* Department Selector */}
        <div>
          <label style={{
            display: "block",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            marginBottom: "8px",
          }}>
            Department <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <Controller
            name="department"
            control={control}
            rules={{ required: "Please select a department" }}
            render={({ field }) => (
              <select
                {...field}
                style={{
                  width: "100%",
                  padding: "12px 12px",
                  fontSize: "14px",
                  border: `1px solid ${errors.department ? "#EF4444" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                  transition: "border-color 0.2s",
                }}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.department && (
            <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
              {errors.department.message}
            </p>
          )}
        </div>

        {/* Subject Field */}
        <div>
          <label style={{
            display: "block",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            marginBottom: "8px",
          }}>
            Subject <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <Controller
            name="subject"
            control={control}
            rules={{
              required: "Subject is required",
              minLength: { value: 5, message: "Subject must be at least 5 characters" },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="Brief subject of your ticket"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  border: `1px solid ${errors.subject ? "#EF4444" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
              />
            )}
          />
          {errors.subject && (
            <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Message Body */}
        <div>
          <label style={{
            display: "block",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            marginBottom: "8px",
          }}>
            Message <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <Controller
            name="message"
            control={control}
            rules={{
              required: "Message is required",
              minLength: { value: 10, message: "Message must be at least 10 characters" },
            }}
            render={({ field }) => (
              <textarea
                {...field}
                placeholder="Describe your issue, suggestion, or feedback in detail..."
                rows={6}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "14px",
                  border: `1px solid ${errors.message ? "#EF4444" : "var(--border)"}`,
                  borderRadius: "var(--radius)",
                  background: "var(--bg)",
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  boxSizing: "border-box",
                  resize: "vertical",
                  transition: "border-color 0.2s",
                }}
              />
            )}
          />
          {errors.message && (
            <p style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Error Message */}
        {submitError && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "var(--radius)",
            color: "#EF4444",
          }}>
            <AlertCircle size={18} />
            <span style={{ fontSize: "14px" }}>{submitError}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px",
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: "var(--radius)",
            color: "#10B981",
          }}>
            <CheckCircle size={18} />
            <span style={{ fontSize: "14px" }}>{successMessage}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px 20px",
            fontSize: "14px",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            background: isSubmitting ? "#999999" : "#0D9488",
            color: "white",
            border: "none",
            borderRadius: "var(--radius)",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            transition: "background 0.2s",
            opacity: isSubmitting ? 0.7 : 1,
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) e.currentTarget.style.background = "#0A7A6E";
          }}
          onMouseLeave={(e) => {
            if (!isSubmitting) e.currentTarget.style.background = "#0D9488";
          }}
        >
          <Send size={16} />
          {isSubmitting ? "Submitting..." : "Submit Ticket"}
        </button>
      </form>
    </div>
  );
}
