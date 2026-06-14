import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { createClient } from "@/lib/supabase";

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

      // If approved, the community now exists in `communities` — send the
      // user straight there instead of leaving them on the waiting screen.
      if (data.status === "approved") {
        setLocation(`/community/${data.slug}`);
      }
    }

    load();

    // Live updates: if an admin approves/rejects/requests info while the
    // user is sitting on this page, reflect it without a manual refresh.
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          {/* Status banner */}
          {request.status === "pending" && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-amber-700">
                  Pending Review
                </span>
              </div>
              <p className="mt-2 text-sm text-amber-800">
                Our admin team is reviewing your request. This usually takes
                less than 24 hours — we'll notify you as soon as there's a
                decision.
              </p>
            </div>
          )}

          {request.status === "info_requested" && (
            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-blue-700">
                  More Info Needed
                </span>
              </div>
              <p className="mt-2 text-sm text-blue-800">
                An admin has a question before they can decide:
              </p>
              {request.admin_message && (
                <p className="mt-2 rounded-md bg-white p-3 text-sm text-slate-700">
                  "{request.admin_message}"
                </p>
              )}
              <p className="mt-2 text-sm text-blue-800">
                Reply via Messages and an admin will continue the review.
              </p>
            </div>
          )}

          {request.status === "rejected" && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                <span className="text-sm font-semibold uppercase tracking-wide text-red-700">
                  Not Approved
                </span>
              </div>
              {request.rejection_reason && (
                <p className="mt-2 text-sm text-red-800">
                  Reason: {request.rejection_reason}
                </p>
              )}
              <button
                onClick={() => setLocation("/start-community")}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Edit and resubmit
              </button>
            </div>
          )}

          {/* Review timeline */}
          <div className="mb-8">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Review Timeline
            </h2>

            <ol className="space-y-4">
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
            </ol>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">
            r/{request.name}
          </h1>
          <p className="mt-1 text-slate-600">{request.display_name}</p>

          {/* Submission summary */}
          <div className="mt-6 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
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
            className="mt-6 flex w-full items-center justify-between rounded-lg border border-slate-200 p-4 text-left hover:border-teal-400"
          >
            <span className="font-medium text-slate-900">
              Preview community page
            </span>
            <span className="text-slate-400">{showPreview ? "−" : "+"}</span>
          </button>

          {showPreview && (
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                Read-only preview — not yet live
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
                    {request.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      {request.display_name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      r/{request.name} ·{" "}
                      {request.is_private ? "Private" : "Public"}
                    </p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-600">
                  {request.description}
                </p>

                {request.tags && request.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {request.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 text-sm text-slate-500">
                  1 member · 0 posts
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
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
  return (
    <li className="flex items-start gap-3">
      <div
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold ${
          state === "done"
            ? "border-teal-600 bg-teal-600 text-white"
            : state === "active"
            ? "border-amber-500 bg-amber-50 text-amber-600"
            : "border-slate-300 bg-white text-slate-400"
        }`}
      >
        {state === "done" ? "✓" : ""}
      </div>
      <div>
        <p
          className={`text-sm font-semibold ${
            state === "active" ? "text-amber-600" : "text-slate-900"
          }`}
        >
          {label}
        </p>
        <p className="text-sm text-slate-500">{sublabel}</p>
      </div>
    </li>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}