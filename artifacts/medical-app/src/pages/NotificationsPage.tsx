import { useState, useEffect } from "react";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  Bell, Check, Trash2, Calendar, Sparkles, BookOpen, 
  HelpCircle, ShieldCheck, Moon, Heart, ChevronRight 
} from "lucide-react";

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Digest preferences
  const [digestMode, setDigestMode] = useState<"immediate" | "batch" | "exam">("immediate");
  const [quietHours, setQuietHours] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        setNotifications(data);
      } else {
        // Fallback mock notifications matching strategic pillars (Section 18)
        setNotifications([
          {
            id: "n-1",
            title: "Adaobi commented on your pharmacology query",
            content: "Adaobi: 'Try concentrating on Volume of Distribution relationship...'",
            category: "Community Post Reply",
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: "n-2",
            title: "Study Circle Invitation expiring soon",
            content: "Adaobi's 'Cardio Cram Circle' starts in less than 2 hours. Tap to enter.",
            category: "Study Circle Activity",
            is_read: false,
            created_at: new Date().toISOString()
          },
          {
            id: "n-3",
            title: "Your Pharmacology Exam is in 36 Days",
            content: "Time to review 42 saved flashcards under cram active recall checklist.",
            category: "Exam Reminder",
            is_read: true,
            created_at: new Date().toISOString()
          }
        ]);
      }
      setLoading(false);
    }
    loadNotifications();
  }, []);

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...m, is_read: true } as any)));
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false)
      .catch(() => {});
  };

  const deleteNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .catch(() => {});
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>COMMUNITY FEEDBACK</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
            Notifications Central
          </h1>
        </div>
        
        {notifications.length > 0 && (
          <button 
            onClick={markAllRead}
            style={{ background: "none", border: "none", color: "#0D9488", fontSize: "13.5px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Check size={16} /> Mark all read
          </button>
        )}
      </div>

      {/* DIGEST CONTROLS (Section 18) */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", marginBottom: "28px" }}>
        <h3 style={{ margin: "0 0 14px", fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700 }}>
          Study Focus Controls & Digests
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr md:1fr 1fr", gap: "12px", marginBottom: "16px" }} className="grid-cols-1 md:grid-cols-3">
          <button 
            onClick={() => setDigestMode("immediate")}
            style={{ 
              background: digestMode === "immediate" ? "rgba(13,148,136,0.06)" : "transparent",
              border: "1px solid " + (digestMode === "immediate" ? "#0D9488" : "var(--border)"),
              borderRadius: "10px", padding: "10px", cursor: "pointer", textAlign: "left" 
            }}
          >
            <strong style={{ display: "block", fontSize: "13px", color: digestMode === "immediate" ? "#0D9488" : "var(--text)" }}>Immediate Delivery</strong>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Deliver comments & messages as they occur.</span>
          </button>

          <button 
            onClick={() => setDigestMode("batch")}
            style={{ 
              background: digestMode === "batch" ? "rgba(13,148,136,0.06)" : "transparent",
              border: "1px solid " + (digestMode === "batch" ? "#0D9488" : "var(--border)"),
              borderRadius: "10px", padding: "10px", cursor: "pointer", textAlign: "left" 
            }}
          >
            <strong style={{ display: "block", fontSize: "13px", color: digestMode === "batch" ? "#0D9488" : "var(--text)" }}>Batch Digest</strong>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Hold notifications during active study sprints.</span>
          </button>

          <button 
            onClick={() => setDigestMode("exam")}
            style={{ 
              background: digestMode === "exam" ? "rgba(13,148,136,0.06)" : "transparent",
              border: "1px solid " + (digestMode === "exam" ? "#0D9488" : "var(--border)"),
              borderRadius: "10px", padding: "10px", cursor: "pointer", textAlign: "left" 
            }}
          >
            <strong style={{ display: "block", fontSize: "13px", color: digestMode === "exam" ? "#0D9488" : "var(--text)" }}>Exam Mode Quiet</strong>
            <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>Mute all channels except urgent active exams countdown.</span>
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "14px" }}>
          <div>
            <strong style={{ display: "block", fontSize: "13.5px" }}>Silent Quiet Hours</strong>
            <span style={{ display: "block", fontSize: "11.5px", color: "var(--text-muted)" }}>Auto-mute channels during Pomodoro focus sessions.</span>
          </div>
          <button 
            onClick={() => setQuietHours(!quietHours)}
            style={{ 
              background: quietHours ? "#0D9488" : "var(--surface-muted)", 
              color: quietHours ? "white" : "var(--text)", 
              border: "1px solid var(--border)", 
              borderRadius: "8px", 
              padding: "6px 12px", 
              fontSize: "12.5px", 
              fontWeight: 650, 
              cursor: "pointer",
              transition: "all 0.2s" 
            }}
          >
            {quietHours ? "Quiet Active 🌙" : "Toggle Mode"}
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LISTING */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Syncing feed alerts...</p>
      ) : notifications.length === 0 ? (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
          <Bell size={32} color="var(--text-muted)" style={{ marginBottom: "12px" }} />
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Your workspace is completely quiet</h3>
          <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)" }}>When peers react or comment on your study posts, answers appear here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {notifications.map((n) => (
            <div 
              key={n.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "14px",
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                opacity: n.is_read ? 0.75 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,0.01)"
              }}
            >
              <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 }}>
                <div style={{ 
                  width: "32px", height: "32px", borderRadius: "50%", 
                  background: n.category === "Exam Reminder" ? "#FFF1F2" : "rgba(13,148,136,0.08)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px"
                }}>
                  {n.category === "Exam Reminder" ? "📅" : "💬"}
                </div>

                <div>
                  <h4 style={{ margin: 0, fontSize: "14.5px", fontWeight: n.is_read ? 600 : 750 }}>
                    {n.title}
                  </h4>
                  <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {n.content}
                  </p>
                  <span style={{ display: "block", fontSize: "10px", color: "#0D9488", fontWeight: 700, textTransform: "uppercase", marginTop: "6px" }}>
                    {n.category}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => deleteNotification(n.id)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "6px" }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
