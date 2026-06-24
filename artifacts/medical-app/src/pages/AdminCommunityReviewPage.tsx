import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { CheckCircle, XCircle, MessageCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import AppShell from "@/components/AppShell";

type RequestStatus = "pending" | "info_requested" | "approved" | "rejected";

// ─── Role check ───────────────────────────────────────────────────────────────
// Matches the actual `profiles.role` values stored in the database.
// These are lowercase snake_case — NOT title-case strings like "Super Admin".
const REVIEWER_ROLES = ["super_admin", "admin", "app_admin"] as const;
type ReviewerRole = (typeof REVIEWER_ROLES)[number];

function isReviewer(role: string | null | undefined): role is ReviewerRole {
  return REVIEWER_ROLES.includes(role as ReviewerRole);
}
// ─────────────────────────────────────────────────────────────────────────────

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
  stated_purpose?: string | null;
  estimated_size: string;
  status: RequestStatus;
  admin_message: string | null;
  rejection_reason: string | null;
  created_at: string;
  created_by: string;
  // joined from profiles
  creator_name?: string;
  creator_avatar?: string | null;
}

const sizeLabels: Record<string, string> = {
  under_400: "Under 400 (class group)",
  "400_1800": "400-1800 (departmental)",
  "2k_plus": "2k+ (inter-university)",
  under_50: "Under 50 (Class group)",
  "50_200": "50–200 (Departmental)",
  "200_plus": "200+ (Inter-university)",
};

const STATUS_STYLES: Record<
  RequestStatus,
  { label: string; color: string; bg: string; border: string }
> = {
  pending: {
    label: "Pending",
    color: "#B45309",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.35)",
  },
  info_requested: {
    label: "Info Requested",
    color: "#1D4ED8",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.35)",
  },
  approved: {
    label: "Approved",
    color: "#0D9488",
    bg: "rgba(13,148,136,0.08)",
    border: "rgba(13,148,136,0.35)",
  },
  rejected: {
    label: "Rejected",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.08)",
    border: "rgba(220,38,38,0.35)",
  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RequestStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "12px",
        fontWeight: 600,
        fontFamily: "var(--font-display)",
        color: s.color,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: "6px",
        padding: "3px 8px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

function Avatar({
  name,
  avatar,
  size = 36,
}: {
  name: string;
  avatar: string | null | undefined;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: "var(--gradient)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.38,
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        overflow: "hidden",
      }}
    >
      {avatar ? (
        <img
          src={avatar}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          alt=""
        />
      ) : (
        name?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

// ─── Request card ─────────────────────────────────────────────────────────────

function RequestCard({
  req,
  onApprove,
  onReject,
  onRequestInfo,
  actionLoading,
}: {
  req: CommunityRequest;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onRequestInfo: (id: string, message: string) => void;
  actionLoading: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [panel, setPanel] = useState<"none" | "reject" | "info">("none");

  const isBusy = actionLoading === req.id;
  const purposeText = req.stated_purpose || req.justification || "";
  const purposeAdequate = purposeText.trim().length >= 50;

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        overflow: "hidden",
        transition: "box-shadow 0.2s ease",
      }}
    >
      {/* Card header -------------------------------------------------------- */}
      <div style={{ padding: "16px 20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {/* Community avatar placeholder */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "10px",
              background: "var(--gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 700,
              color: "white",
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            {req.display_name.charAt(0).toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flexWrap: "wrap",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                {req.display_name}
              </h3>
              <span
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                }}
              >
                r/{req.name}
              </span>
              <StatusBadge status={req.status} />
            </div>

            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
                lineHeight: 1.5,
              }}
            >
              {req.category} ·{" "}
              {req.is_private ? "Private" : "Public"} ·{" "}
              {sizeLabels[req.estimated_size] ?? req.estimated_size} ·{" "}
              {new Date(req.created_at).toLocaleDateString("en-NG", {
                dateStyle: "medium",
              })}
            </p>
          </div>

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "6px 8px",
              cursor: "pointer",
              color: "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {expanded ? (
              <>
                Less <ChevronUp size={14} />
              </>
            ) : (
              <>
                Details <ChevronDown size={14} />
              </>
            )}
          </button>
        </div>

        {/* Creator row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "12px",
          }}
        >
          <Avatar
            name={req.creator_name || "U"}
            avatar={req.creator_avatar}
            size={24}
          />
          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Submitted by{" "}
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>
              {req.creator_name || "Unknown"}
            </strong>
          </span>
        </div>
      </div>

      {/* Expanded details -------------------------------------------------- */}
      {expanded && (
        <div
          style={{
            padding: "0 20px 16px",
            borderTop: "1px solid var(--border)",
            paddingTop: "16px",
          }}
        >
          <p
            style={{
              fontSize: "13px",
              color: "var(--text)",
              lineHeight: 1.6,
              margin: "0 0 12px 0",
            }}
          >
            {req.description}
          </p>

          {req.tags && req.tags.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px",
                marginBottom: "12px",
              }}
            >
              {req.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#0D9488",
                    background: "rgba(13,148,136,0.08)",
                    border: "1px solid rgba(13,148,136,0.25)",
                    borderRadius: "999px",
                    padding: "3px 10px",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Academic Purpose Statement card */}
          {(() => {
            const purposeText = req.stated_purpose || req.justification || "";
            const isAdequate = purposeText.trim().length >= 50;
            return (
              <div
                style={{
                  background: isAdequate ? "rgba(13,148,136,0.04)" : "rgba(220,38,38,0.04)",
                  border: `1px solid ${isAdequate ? "rgba(13,148,136,0.25)" : "rgba(220,38,38,0.25)"}`,
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                  <p
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Academic Purpose Statement
                  </p>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: isAdequate ? "#0D9488" : "#DC2626",
                      background: isAdequate ? "rgba(13,148,136,0.1)" : "rgba(220,38,38,0.1)",
                      border: `1px solid ${isAdequate ? "rgba(13,148,136,0.3)" : "rgba(220,38,38,0.3)"}`,
                      borderRadius: "4px",
                      padding: "2px 7px",
                    }}
                  >
                    {isAdequate ? "✓ ADEQUATE" : "✗ INSUFFICIENT"}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text)",
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {purposeText || <em style={{ color: "var(--text-muted)" }}>No purpose statement provided.</em>}
                </p>
                {!isAdequate && (
                  <p style={{ fontSize: "11px", color: "#DC2626", marginTop: "6px", marginBottom: 0 }}>
                    Statement is under 50 characters — approval is disabled until the creator improves it.
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Action buttons ---------------------------------------------------- */}
      {(req.status === "pending" || req.status === "info_requested") && (
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            display: "flex",
            gap: "8px",
            flexWrap: "wrap",
            background: "var(--bg)",
          }}
        >
          {/* Approve */}
          <button
            disabled={isBusy || !purposeAdequate}
            onClick={() => onApprove(req.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#0D9488",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <CheckCircle size={15} />
            Approve
          </button>

          {/* Request info */}
          <button
            disabled={isBusy}
            onClick={() =>
              setPanel((p) => (p === "info" ? "none" : "info"))
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <MessageCircle size={15} />
            Request Info
          </button>

          {/* Reject */}
          <button
            disabled={isBusy}
            onClick={() =>
              setPanel((p) => (p === "reject" ? "none" : "reject"))
            }
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "var(--surface)",
              color: "#DC2626",
              border: "1px solid rgba(220,38,38,0.3)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--font-display)",
              cursor: isBusy ? "not-allowed" : "pointer",
              opacity: isBusy ? 0.6 : 1,
              transition: "opacity 0.15s ease",
            }}
          >
            <XCircle size={15} />
            Reject
          </button>
        </div>
      )}

      {/* Reject panel */}
      {panel === "reject" && (
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--border)",
            background: "rgba(220,38,38,0.04)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#DC2626",
              margin: "0 0 8px 0",
              fontFamily: "var(--font-display)",
            }}
          >
            Rejection reason (shown to the creator)
          </p>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="e.g. A very similar community already exists — consider joining r/anatomy-unilag instead."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              fontSize: "13px",
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              outline: "none",
              resize: "vertical",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
            }}
          />
          <div
            style={{ display: "flex", gap: "8px", marginTop: "8px" }}
          >
            <button
              disabled={isBusy || !rejectReason.trim()}
              onClick={() => {
                onReject(req.id, rejectReason.trim());
                setPanel("none");
              }}
              style={{
                padding: "8px 14px",
                background: "#DC2626",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor:
                  isBusy || !rejectReason.trim()
                    ? "not-allowed"
                    : "pointer",
                opacity: isBusy || !rejectReason.trim() ? 0.5 : 1,
              }}
            >
              Confirm Rejection
            </button>
            <button
              onClick={() => setPanel("none")}
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Request-info panel */}
      {panel === "info" && (
        <div
          style={{
            padding: "12px 20px 16px",
            borderTop: "1px solid var(--border)",
            background: "rgba(59,130,246,0.04)",
          }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "#1D4ED8",
              margin: "0 0 8px 0",
              fontFamily: "var(--font-display)",
            }}
          >
            Message to creator
          </p>
          <textarea
            rows={3}
            value={infoMsg}
            onChange={(e) => setInfoMsg(e.target.value)}
            placeholder="e.g. Could you clarify how this differs from r/med300 which already covers OAU 300L Medicine?"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "10px",
              fontSize: "13px",
              color: "var(--text)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              outline: "none",
              resize: "vertical",
              fontFamily: "var(--font-body)",
              lineHeight: 1.5,
            }}
          />
          <div
            style={{ display: "flex", gap: "8px", marginTop: "8px" }}
          >
            <button
              disabled={isBusy || !infoMsg.trim()}
              onClick={() => {
                onRequestInfo(req.id, infoMsg.trim());
                setPanel("none");
              }}
              style={{
                padding: "8px 14px",
                background: "#1D4ED8",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor:
                  isBusy || !infoMsg.trim() ? "not-allowed" : "pointer",
                opacity: isBusy || !infoMsg.trim() ? 0.5 : 1,
              }}
            >
              Send Message
            </button>
            <button
              onClick={() => setPanel("none")}
              style={{
                padding: "8px 14px",
                background: "transparent",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                fontFamily: "var(--font-display)",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = "pending" | "info_requested" | "approved" | "rejected" | "all";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "info_requested", label: "Info Requested" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function AdminCommunityReviewPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Auth + role guard ──────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/login");
        return;
      }

      // Fetch the caller's role from profiles using the real column values
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Guard: only super_admin and admin can access this page
      if (!isReviewer(profile?.role)) {
        navigate("/");
        return;
      }

      await loadRequests();
    }

    init();
  }, []);

  // ── Data loading ───────────────────────────────────────────────────────────
  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("community_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) {
      setLoading(false);
      return;
    }

    // Enrich each request with the creator's display name and avatar
    const enriched = await Promise.all(
      data.map(async (r) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, full_name, avatar_url")
          .eq("id", r.created_by)
          .single();

        return {
          ...r,
          creator_name:
            profile?.full_name || profile?.username || "Unknown",
          creator_avatar: profile?.avatar_url ?? null,
        } as CommunityRequest;
      })
    );

    setRequests(enriched);
    setLoading(false);
  }

  // ── Toast helper ───────────────────────────────────────────────────────────
  function showToast(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  }

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleApprove(id: string) {
    setActionLoading(id);

    const req = requests.find((r) => r.id === id);
    if (!req) {
      setActionLoading(null);
      return;
    }

    try {
      // 1. Insert the community row
      const { data: newComm, error: insertErr } = await supabase
        .from("communities")
        .insert({
          name: req.name,
          slug: req.slug,
          display_name: req.display_name,
          description: req.description,
          category: req.category,
          is_private: req.is_private,
          tags: req.tags,
          created_by: req.created_by,
          avatar_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${req.slug}`,
          icon_url: `https://api.dicebear.com/7.x/shapes/svg?seed=${req.slug}`,
          icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${req.slug}`,
          banner_url: "https://images.unsplash.com/photo-1530210124550-912dc1381cb8?w=1200&h=400&fit=cover"
        })
        .select("id")
        .single();

      if (insertErr) throw insertErr;

      // 1b. Add creator as admin member
      if (newComm) {
        await supabase.from("community_members").insert({
           community_id: newComm.id,
           user_id: req.created_by,
           role: "admin"
        });
      }

      // 2. Mark the request approved
      const { error: updateErr } = await supabase
        .from("community_requests")
        .update({ status: "approved" })
        .eq("id", id);

      if (updateErr) throw updateErr;

      // 3. Notify the creator
      await supabase.from("notifications").insert({
        user_id: req.created_by,
        type: "system",
        message: `🎉 Your community r/${req.name} has been approved and is now live!`,
        related_community_slug: req.slug,
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "approved" } : r))
      );
      showToast(`r/${req.name} approved and is now live.`);
    } catch (err: any) {
      showToast(err?.message || "Something went wrong.", false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setActionLoading(id);
    const req = requests.find((r) => r.id === id);

    try {
      const { error } = await supabase
        .from("community_requests")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", id);

      if (error) throw error;

      // Notify creator
      await supabase.from("notifications").insert({
        user_id: req?.created_by,
        type: "system",
        message: `Your community request r/${req?.name} was not approved. Reason: ${reason}`,
        related_request_id: id,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "rejected", rejection_reason: reason }
            : r
        )
      );
      showToast(`r/${req?.name} rejected.`);
    } catch (err: any) {
      showToast(err?.message || "Something went wrong.", false);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRequestInfo(id: string, message: string) {
    setActionLoading(id);
    const req = requests.find((r) => r.id === id);

    try {
      const { error } = await supabase
        .from("community_requests")
        .update({ status: "info_requested", admin_message: message })
        .eq("id", id);

      if (error) throw error;

      // Notify creator
      await supabase.from("notifications").insert({
        user_id: req?.created_by,
        type: "system",
        message: `An admin has a question about your community request r/${req?.name}. Check the waiting room for details.`,
        related_request_id: id,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: "info_requested", admin_message: message }
            : r
        )
      );
      showToast("Message sent to creator.");
    } catch (err: any) {
      showToast(err?.message || "Something went wrong.", false);
    } finally {
      setActionLoading(null);
    }
  }

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered =
    activeTab === "all"
      ? requests
      : requests.filter((r) => r.status === activeTab);

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <AppShell>
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "26px",
                color: "var(--text)",
                margin: 0,
              }}
            >
              🏘 Community Requests
            </h1>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                margin: "4px 0 0 0",
              }}
            >
              Review, approve, or reject community creation requests.
            </p>
          </div>

          {pendingCount > 0 && (
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "var(--font-display)",
                color: "#B45309",
                background: "rgba(251,191,36,0.12)",
                border: "1px solid rgba(251,191,36,0.4)",
                borderRadius: "8px",
                padding: "6px 12px",
              }}
            >
              {pendingCount} awaiting review
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: "flex",
            gap: "6px",
            marginBottom: "20px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === "all"
                ? requests.length
                : requests.filter((r) => r.status === tab.key).length;

            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: "13px",
                  padding: "7px 12px",
                  borderRadius: "6px",
                  border: isActive
                    ? "1px solid var(--border)"
                    : "1px solid transparent",
                  background: isActive ? "var(--surface)" : "transparent",
                  color: isActive ? "var(--text)" : "var(--text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      background: isActive
                        ? "var(--bg)"
                        : "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "999px",
                      padding: "1px 6px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: "88px",
                  borderRadius: "var(--radius)",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  opacity: 0.6,
                }}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "60px 20px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "56px", marginBottom: "16px", opacity: 0.5 }}>
              <Clock size={48} color="var(--text-muted)" />
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "17px",
                color: "var(--text)",
                margin: "0 0 6px 0",
              }}
            >
              No {activeTab === "all" ? "" : activeTab.replace("_", " ")}{" "}
              requests
            </h2>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                maxWidth: "260px",
              }}
            >
              {activeTab === "pending"
                ? "You're all caught up — no pending requests right now."
                : "Nothing to show here yet."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                onApprove={handleApprove}
                onReject={handleReject}
                onRequestInfo={handleRequestInfo}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            background: toast.ok ? "#0D9488" : "#DC2626",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            fontFamily: "var(--font-display)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            zIndex: 9999,
            whiteSpace: "nowrap",
          }}
        >
          {toast.msg}
        </div>
      )}
    </AppShell>
  );
}