import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";

type RequestStatus = "pending" | "info_requested" | "approved" | "rejected";

interface Applicant {
  id: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  is_verified: boolean | null;
  rating: number | null;
  flag_count: number | null;
}

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
  created_by: string;
  created_at: string;
  reviewing_admin_id: string | null;
  reviewing_admin_name: string | null;
  reviewing_started_at: string | null;
  profiles: Applicant | null;
}

const sizeLabels: Record<string, string> = {
  under_50: "Under 50 (Class group)",
  "50_200": "50–200 (Departmental)",
  "200_plus": "200+ (Inter-university)",
};

const rejectReasons = [
  "Duplicate group already exists",
  "Inappropriate or unclear name",
  "Non-educational purpose",
  "Insufficient justification provided",
  "Violates community guidelines",
];

// Moderators can moderate existing communities but don't see this queue —
// only these two roles can approve/reject new community requests.
const reviewerRoles = ["Super Admin", "Admin"];

export default function AdminCommunityReviewPage() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const [currentAdminName, setCurrentAdminName] = useState<string>("Admin");

  const [requests, setRequests] = useState<CommunityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [selectedReason, setSelectedReason] = useState("");
  const [infoRequestId, setInfoRequestId] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState("");

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // --- Access control: Super Admins and Admins can review requests;
  // Moderators are redirected away ---
  useEffect(() => {
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLocation("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, username, full_name")
        .eq("id", user.id)
        .single();

      if (!profile || !reviewerRoles.includes(profile.role ?? "")) {
        setLocation("/");
        return;
      }

      setCurrentAdminId(user.id);
      setCurrentAdminName(profile.full_name || profile.username || "Admin");
      setCheckingAccess(false);
    }

    checkAccess();
  }, [setLocation, supabase]);

  // --- Load pending requests + applicant profile info ---
  useEffect(() => {
    if (checkingAccess) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const { data, error } = await supabase
        .from("community_requests")
        .select(
          `*, profiles:created_by ( id, username, full_name, role, is_verified, rating, flag_count )`
        )
        .in("status", ["pending", "info_requested"])
        .order("created_at", { ascending: true });

      if (!error && data) {
        setRequests(data as unknown as CommunityRequest[]);
        if (data.length > 0 && !selectedId) {
          setSelectedId(data[0].id);
        }
      }

      setLoading(false);
    }

    load();

    // Live updates so the queue + "currently reviewing" badges stay in
    // sync across admins without a manual refresh.
    channel = supabase
      .channel("community_requests_admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_requests" },
        () => load()
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkingAccess, selectedId, supabase]);

  const selected = requests.find((r) => r.id === selectedId) ?? null;

  // --- "Currently reviewing" lock: claim a request when opened ---
  useEffect(() => {
    if (!selected || !currentAdminId) return;

    // Don't steal it from another admin who's actively on it.
    const lockedByOther =
      selected.reviewing_admin_id &&
      selected.reviewing_admin_id !== currentAdminId &&
      selected.reviewing_started_at &&
      Date.now() - new Date(selected.reviewing_started_at).getTime() <
        5 * 60 * 1000;

    if (lockedByOther) return;

    supabase
      .from("community_requests")
      .update({
        reviewing_admin_id: currentAdminId,
        reviewing_admin_name: currentAdminName,
        reviewing_started_at: new Date().toISOString(),
      })
      .eq("id", selected.id)
      .then(() => {});
  }, [selected?.id, currentAdminId, currentAdminName, supabase]);

  // --- Approve: copy into `communities`, mark request approved ---
  const handleApprove = async (request: CommunityRequest) => {
    setActionLoading(request.id);
    setActionError(null);

    try {
      const { error: insertError } = await supabase.from("communities").insert({
        name: request.name,
        slug: request.slug,
        display_name: request.display_name,
        description: request.description,
        category: request.category,
        is_private: request.is_private,
        tags: request.tags,
        created_by: request.created_by,
      });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from("community_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Notify the creator. Adjust the table/columns to match however
      // your app currently sends push notifications.
      await supabase.from("notifications").insert({
        user_id: request.created_by,
        type: "community_approved",
        title: "Your community is live!",
        body: `r/${request.name} has been approved and is now live.`,
        link: `/community/${request.slug}`,
      });

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setSelectedId((prev) => (prev === request.id ? null : prev));
    } catch (err: any) {
      setActionError(err?.message || "Could not approve this request.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- Reject with a reason ---
  const handleReject = async (request: CommunityRequest, reason: string) => {
    setActionLoading(request.id);
    setActionError(null);

    try {
      const { error } = await supabase
        .from("community_requests")
        .update({ status: "rejected", rejection_reason: reason })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.created_by,
        type: "community_rejected",
        title: "Update on your community request",
        body: `r/${request.name} wasn't approved: ${reason}`,
        link: `/community/pending/${request.id}`,
      });

      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      setSelectedId((prev) => (prev === request.id ? null : prev));
      setRejectingId(null);
      setSelectedReason("");
    } catch (err: any) {
      setActionError(err?.message || "Could not reject this request.");
    } finally {
      setActionLoading(null);
    }
  };

  // --- Request more info, keeps it in the queue ---
  const handleRequestInfo = async (request: CommunityRequest, message: string) => {
    setActionLoading(request.id);
    setActionError(null);

    try {
      const { error } = await supabase
        .from("community_requests")
        .update({ status: "info_requested", admin_message: message })
        .eq("id", request.id);

      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: request.created_by,
        type: "community_info_requested",
        title: "Admin has a question about your community",
        body: message,
        link: `/community/pending/${request.id}`,
      });

      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: "info_requested", admin_message: message }
            : r
        )
      );
      setInfoRequestId(null);
      setInfoMessage("");
    } catch (err: any) {
      setActionError(err?.message || "Could not send this message.");
    } finally {
      setActionLoading(null);
    }
  };

  if (checkingAccess || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            Community Requests
          </h1>
          <p className="mt-1 text-slate-600">
            {requests.length} request{requests.length === 1 ? "" : "s"}{" "}
            waiting for review.
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            Nothing in the queue. New community requests will show up here.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
            {/* Queue list */}
            <div className="space-y-2">
              {requests.map((req) => {
                const isActive = req.id === selectedId;
                const lockedByOther =
                  req.reviewing_admin_id &&
                  req.reviewing_admin_id !== currentAdminId &&
                  req.reviewing_started_at &&
                  Date.now() - new Date(req.reviewing_started_at).getTime() <
                    5 * 60 * 1000;

                return (
                  <button
                    key={req.id}
                    onClick={() => setSelectedId(req.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isActive
                        ? "border-teal-600 bg-white shadow-sm"
                        : "border-slate-200 bg-white hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">
                        r/{req.name}
                      </span>
                      {req.status === "info_requested" && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          Info requested
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {req.display_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(req.created_at).toLocaleDateString("en-NG", {
                        dateStyle: "medium",
                      })}
                    </p>
                    {lockedByOther && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {req.reviewing_admin_name} is reviewing this
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                {/* Reviewing badge */}
                {selected.reviewing_admin_id &&
                  selected.reviewing_admin_id !== currentAdminId &&
                  selected.reviewing_started_at &&
                  Date.now() -
                    new Date(selected.reviewing_started_at).getTime() <
                    5 * 60 * 1000 && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                      {selected.reviewing_admin_name} is currently reviewing
                      this request.
                    </div>
                  )}

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">
                      r/{selected.name}
                    </h2>
                    <p className="text-slate-600">{selected.display_name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600">
                    {selected.category}
                  </span>
                </div>

                {/* Applicant profile shortcut */}
                {selected.profiles && (
                  <button
                    onClick={() =>
                      setLocation(`/u/${selected.profiles?.username ?? selected.created_by}`)
                    }
                    className="mt-4 flex w-full items-center gap-3 rounded-xl border border-slate-200 p-3 text-left hover:border-teal-300"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
                      {(selected.profiles.full_name ?? selected.profiles.username ?? "?")
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-slate-900">
                          {selected.profiles.full_name ?? selected.profiles.username}
                        </span>
                        {selected.profiles.is_verified && (
                          <span className="rounded-full bg-teal-50 px-1.5 py-0.5 text-[10px] font-semibold text-teal-700">
                            Verified
                          </span>
                        )}
                        {(selected.profiles.flag_count ?? 0) > 0 && (
                          <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                            {selected.profiles.flag_count} flag
                            {selected.profiles.flag_count === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        u/{selected.profiles.username}
                      </p>
                    </div>
                    {selected.profiles.rating != null && (
                      <span className="text-sm font-semibold text-slate-700">
                        ★ {selected.profiles.rating.toFixed(1)}
                      </span>
                    )}
                  </button>
                )}

                {/* Details */}
                <div className="mt-5 space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Description
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selected.description}
                    </p>
                  </div>

                  {selected.tags && selected.tags.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Tags
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Visibility
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {selected.is_private ? "Private" : "Public"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        Estimated Size
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {sizeLabels[selected.estimated_size] ??
                          selected.estimated_size}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-teal-100 bg-teal-50 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
                      Justification
                    </p>
                    <p className="mt-1 text-sm text-slate-700">
                      {selected.justification}
                    </p>
                  </div>

                  {selected.status === "info_requested" &&
                    selected.admin_message && (
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                          Info requested
                        </p>
                        <p className="mt-1 text-sm text-slate-700">
                          "{selected.admin_message}" — awaiting reply
                        </p>
                      </div>
                    )}
                </div>

                {actionError && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {actionError}
                  </div>
                )}

                {/* Quick actions */}
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    onClick={() => handleApprove(selected)}
                    disabled={actionLoading === selected.id}
                    className="rounded-lg bg-teal-600 px-4 py-3 font-medium text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {actionLoading === selected.id ? "Working..." : "Approve"}
                  </button>

                  <button
                    onClick={() => {
                      setRejectingId(
                        rejectingId === selected.id ? null : selected.id
                      );
                      setInfoRequestId(null);
                    }}
                    className={`rounded-lg border px-4 py-3 font-medium transition ${
                      rejectingId === selected.id
                        ? "border-red-600 bg-red-600 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-red-300"
                    }`}
                  >
                    Reject with Reason
                  </button>

                  <button
                    onClick={() => {
                      setInfoRequestId(
                        infoRequestId === selected.id ? null : selected.id
                      );
                      setRejectingId(null);
                    }}
                    className={`rounded-lg border px-4 py-3 font-medium transition ${
                      infoRequestId === selected.id
                        ? "border-amber-500 bg-amber-500 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:border-amber-300"
                    }`}
                  >
                    Request Info
                  </button>
                </div>

                {/* Reject reason picker */}
                {rejectingId === selected.id && (
                  <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-red-700">
                      Select a reason
                    </p>
                    <div className="space-y-2">
                      {rejectReasons.map((reason) => (
                        <button
                          key={reason}
                          onClick={() => setSelectedReason(reason)}
                          className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                            selectedReason === reason
                              ? "border-red-600 bg-white font-medium text-slate-900"
                              : "border-red-100 bg-white/60 text-slate-600"
                          }`}
                        >
                          {reason}
                          {selectedReason === reason && <span>✓</span>}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => handleReject(selected, selectedReason)}
                      disabled={!selectedReason || actionLoading === selected.id}
                      className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send Rejection
                    </button>
                  </div>
                )}

                {/* Request info message box */}
                {infoRequestId === selected.id && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-amber-700">
                      Message to creator
                    </p>
                    <textarea
                      rows={3}
                      value={infoMessage}
                      onChange={(e) => setInfoMessage(e.target.value)}
                      placeholder="e.g. Could you clarify how this differs from r/anatomyhub which already covers UNILAG 200L?"
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => handleRequestInfo(selected, infoMessage)}
                      disabled={!infoMessage.trim() || actionLoading === selected.id}
                      className="mt-2 w-full rounded-lg bg-amber-500 px-4 py-2 font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Send Message
                    </button>
                  </div>
                )}

                <p className="mt-4 text-xs text-slate-400">
                  Approve and Reject are final and notify the creator
                  immediately. Request Info keeps this in the queue for the
                  whole admin team.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}