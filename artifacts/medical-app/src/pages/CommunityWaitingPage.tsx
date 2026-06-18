import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { createClient } from "@/lib/supabase";
import { Clock, ArrowLeft, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import AppShell from "@/components/AppShell";

type RequestStatus = "pending" | "info_requested" | "approved" | "rejected";

interface CommunityRequest {
  id: string;
  name: string;
  slug: string;
  display_name: string;
  description: string;
  category: string;
  is_private: boolean;
  tags: string[] | null;
  justification: string;
  estimated_size: string;
  status: RequestStatus;
  admin_message: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const sizeLabels: Record<string, string> = {
  under_50: "Under 50 (Class group)",
  "50_200": "50–200 (Departmental)",
  "200_plus": "200+ (Inter-university)",
};

export default function CommunityWaitingPage() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [request, setRequest] = useState<CommunityRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data, error } = await supabase
        .from("community_requests")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !data) {
        setLocation("/start-community");
        return;
      }

      setRequest(data as CommunityRequest);
      setLoading(false);

      if (data.status === "approved") {
        setLocation(`/community/${data.slug}`);
      }
    }

    load();

    channel = supabase
      .channel(`community_request_${params.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "community_requests",
          filter: `id=eq.${params.id}`,
        },
        (payload) => {
          const updated = payload.new as CommunityRequest;
          setRequest(updated);

          if (updated.status === "approved") {
            setLocation(`/community/${updated.slug}`);
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [params.id, setLocation, supabase]);

  if (loading || !request) {
    return (
      <AppShell>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--text-muted)" }}>
            <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid var(--border)", borderTop: "2px solid #0D9488", animation: "spin 0.8s linear infinite" }} />
            <span style={{ fontSize: "14px" }}>Loading...</span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  const statusConfig = {
    pending: {
      icon: <Clock size={16} />,
      label: "Pending Review",
      color: "#B45309",
      bg: "rgba(251,191,36,0.08)",
      border: "rgba(251,191,36,0.3)",
      text: "Our admin team is reviewing your request. This usually takes less than 24 hours — we'll notify you as soon as there's a decision.",
    },
    info_requested: {
      icon: <AlertCircle size={16} />,
      label: "More Info Needed",
      color: "#1D4ED8",
      bg: "rgba(59,130,246,0.08)",
      border: "rgba(59,130,246,0.3)",
      text: "An admin has a question before they can decide.",
    },
    approved: {
      icon: <CheckCircle2 size={16} />,
      label: "Approved",
      color: "#0D9488",
      bg: "rgba(13,148,136,0.08)",
      border: "rgba(13,148,136,0.3)",
      text: "Your community has been approved! Redirecting you now...",
    },
    rejected: {
      icon: <AlertCircle size={16} />,
      label: "Not Approved",
      color: "#DC2626",
      bg: "rgba(220,38,38,0.08)",
      border: "rgba(220,38,38,0.3)",
      text: "Your community request was not approved.",
    },
  };

  const status = statusConfig[request.status];

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", padding: "24px 16px" }}>
        <button
          onClick={() => setLocation("/start-community")}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "13px",
            fontWeight: 600,
            marginBottom: "20px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}>
          {/* Status banner */}
          <div style={{
            padding: "16px 20px",
            background: status.bg,
            borderBottom: `1px solid ${status.border}`,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ color: status.color }}>{status.icon}</span>
              <span style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: status.color,
              }}>
                {status.label}
              </span>
            </div>
            <p style={{ fontSize: "13px", color: status.color, lineHeight: 1.6, margin: 0 }}>
              {status.text}
            </p>
            {request.status === "info_requested" && request.admin_message && (
              <div style={{
                marginTop: "10px",
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}>
                <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 4px", fontWeight: 600 }}>
                  Admin message:
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0, fontStyle: "italic" }}>
                  "{request.admin_message}"
                </p>
              </div>
            )}
            {request.status === "rejected" && request.rejection_reason && (
              <div style={{
                marginTop: "10px",
                padding: "12px",
                background: "var(--surface)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
              }}>
                <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 4px", fontWeight: 600 }}>
                  Reason:
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
                  {request.rejection_reason}
                </p>
              </div>
            )}
            {request.status === "rejected" && (
              <button
                onClick={() => setLocation("/start-community")}
                style={{
                  marginTop: "12px",
                  padding: "10px 20px",
                  borderRadius: "var(--radius-sm)",
                  background: "#DC2626",
                  color: "white",
                  border: "none",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Edit and Resubmit
              </button>
            )}
          </div>

          {/* Review timeline */}
          <div style={{ padding: "20px" }}>
            <h2 style={{
              fontSize: "12px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--text-muted)",
              margin: "0 0 16px",
            }}>
              Review Timeline
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <TimelineStep
                label="Submitted"
                sublabel="Request received"
                state="done"
              />
              <TimelineStep
                label="In Review"
                sublabel="Admin checking details"
                state={
                  request.status === "pending" ||
                  request.status === "info_requested"
                    ? "active"
                    : "done"
                }
              />
              <TimelineStep
                label="Decision"
                sublabel="Approved or returned"
                state={
                  request.status === "approved" ||
                  request.status === "rejected"
                    ? "done"
                    : "upcoming"
                }
              />
            </div>
          </div>

          {/* Community info */}
          <div style={{ padding: "0 20px 20px" }}>
            <h1 style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "var(--text)",
              margin: "0 0 4px",
            }}>
              c/{request.name}
            </h1>
            <p style={{ fontSize: "15px", color: "var(--text-muted)", margin: "0 0 16px" }}>
              {request.display_name}
            </p>

            {/* Summary grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
              padding: "16px",
              background: "var(--bg)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)",
            }}>
              <SummaryRow label="Category" value={request.category} />
              <SummaryRow
                label="Visibility"
                value={request.is_private ? "Private" : "Public"}
              />
              <SummaryRow
                label="Estimated Size"
                value={sizeLabels[request.estimated_size] ?? request.estimated_size}
              />
              <SummaryRow
                label="Submitted"
                value={new Date(request.created_at).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              />
            </div>

            {/* Preview toggle */}
            <button
              onClick={() => setShowPreview((v) => !v)}
              style={{
                width: "100%",
                marginTop: "16px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                color: "var(--text)",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#0D9488"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <span>Preview community page</span>
              <span style={{ color: "var(--text-muted)", fontSize: "18px" }}>
                {showPreview ? "−" : "+"}
              </span>
            </button>

            {showPreview && (
              <div style={{
                marginTop: "12px",
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                overflow: "hidden",
              }}>
                <div style={{
                  padding: "8px 16px",
                  background: "var(--bg)",
                  borderBottom: "1px solid var(--border)",
                  fontSize: "11px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "var(--text-muted)",
                }}>
                  Read-only preview — not yet live
                </div>
                <div style={{ padding: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "12px",
                      background: "var(--gradient)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      fontWeight: 700,
                      color: "white",
                    }}>
                      {request.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                        {request.display_name}
                      </h3>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                        c/{request.name} · {request.is_private ? "Private" : "Public"}
                      </p>
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "12px 0 0", lineHeight: 1.5 }}>
                    {request.description}
                  </p>

                  {request.tags && request.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px" }}>
                      {request.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "999px",
                            background: "rgba(13,148,136,0.08)",
                            color: "#0D9488",
                            fontSize: "12px",
                            fontWeight: 600,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "12px 0 0" }}>
                    1 member · 0 posts
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TimelineStep({
  label,
  sublabel,
  state,
}: {
  label: string;
  sublabel: string;
  state: "done" | "active" | "upcoming";
}) {
  const circleStyle = {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
    fontWeight: 700,
    flexShrink: 0,
    border: state === "done"
      ? "2px solid #0D9488"
      : state === "active"
      ? "2px solid #F59E0B"
      : "2px solid var(--border)",
    background: state === "done"
      ? "#0D9488"
      : state === "active"
      ? "rgba(245,158,11,0.1)"
      : "var(--surface)",
    color: state === "done"
      ? "white"
      : state === "active"
      ? "#F59E0B"
      : "var(--text-muted)",
  };

  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
      <div style={circleStyle}>
        {state === "done" ? "✓" : ""}
      </div>
      <div>
        <p style={{
          fontSize: "14px",
          fontWeight: 700,
          color: state === "active" ? "#F59E0B" : "var(--text)",
          margin: "0 0 2px",
        }}>
          {label}
        </p>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          {sublabel}
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "var(--text-muted)",
        margin: "0 0 4px",
      }}>
        {label}
      </p>
      <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
        {value}
      </p>
    </div>
  );
}
