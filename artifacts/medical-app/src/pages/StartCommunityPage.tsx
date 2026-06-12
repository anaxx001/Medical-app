import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Globe,
  Lock,
  Shield,
  Sparkles,
} from "lucide-react";

const HEALTH_TOPICS = [
  "Medicine",
  "Nursing",
  "Radiology",
  "Pharmacy",
  "Physiotherapy",
  "Dentistry",
  "Medical Lab Science",
  "Public Health",
  "Student Life",
  "General Health",
];

type CommunityType = "public" | "restricted" | "private";

const COMMUNITY_TYPES: {
  value: CommunityType;
  label: string;
  description: string;
  icon: typeof Globe;
}[] = [
  {
    value: "public",
    label: "Public",
    description: "Anyone can view, post, and comment in this community.",
    icon: Globe,
  },
  {
    value: "restricted",
    label: "Restricted",
    description: "Anyone can view, but only approved members can post.",
    icon: Shield,
  },
  {
    value: "private",
    label: "Private",
    description: "Only approved members can view and participate.",
    icon: Lock,
  },
];

const NAME_MAX = 21;
const DESC_MAX = 500;

export default function StartCommunityPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  // Step 1
  const [purpose, setPurpose] = useState("");
  const [topic, setTopic] = useState("");
  // Step 2
  const [communityType, setCommunityType] = useState<CommunityType>("public");
  // Step 3
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUserId(user.id);
    }
    load();
  }, []);

  const canContinueStep1 = purpose.trim().length > 0 && topic !== "";
  const canContinueStep2 = !!communityType;
  const canSubmit =
    name.trim().length > 0 &&
    name.trim().length <= NAME_MAX &&
    description.trim().length <= DESC_MAX;

  function goNext() {
    setError("");
    if (step === 1 && !canContinueStep1) {
      setError("Please describe your purpose and select a health topic.");
      return;
    }
    if (step === 2 && !canContinueStep2) {
      setError("Please choose a community type.");
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function goBack() {
    setError("");
    if (step === 1) {
      navigate("/communities/discover");
      return;
    }
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleSubmit() {
    if (!canSubmit) {
      setError("Please add a valid name (max 21 characters).");
      return;
    }
    if (!userId) {
      navigate("/login");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { error: insertError } = await supabase
        .from("community_requests")
        .insert({
          requester_id: userId,
          purpose: purpose.trim(),
          topic,
          community_type: communityType,
          name: name.trim(),
          description: description.trim() || null,
          status: "pending",
        });
      if (insertError) throw insertError;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Shared styles ──
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontFamily: "var(--font-display)",
    fontWeight: 700,
    fontSize: "14px",
    color: "var(--text)",
    marginBottom: "8px",
  };

  const helpStyle: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    color: "var(--text-muted)",
    marginBottom: "16px",
    lineHeight: 1.5,
  };

  if (success) {
    return (
      <AppShell>
        <div
          style={{
            maxWidth: "560px",
            margin: "0 auto",
            textAlign: "center",
            padding: "48px 20px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "var(--gradient)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
            }}
          >
            <Check size={36} color="white" />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "24px",
              color: "var(--text)",
              marginBottom: "12px",
            }}
          >
            Submitted for review
          </h1>
          <p style={{ ...helpStyle, fontSize: "15px", marginBottom: "28px" }}>
            Thanks! Your request to start <strong>{name.trim()}</strong> has been
            submitted. Our team will review it and let you know once it&apos;s
            approved.
          </p>
          <div
            style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}
          >
            <button
              onClick={() => navigate("/communities/discover")}
              style={{
                padding: "12px 22px",
                borderRadius: "99px",
                border: "none",
                background: "var(--gradient)",
                color: "white",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Browse Communities
            </button>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "12px 22px",
                borderRadius: "99px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Back Home
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <button
            onClick={goBack}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              padding: "4px 0",
              marginBottom: "12px",
            }}
          >
            <ArrowLeft size={16} /> {step === 1 ? "Cancel" : "Back"}
          </button>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "26px",
              color: "var(--text)",
              marginBottom: "6px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Sparkles size={24} color="#0D9488" /> Start a Community
          </h1>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: 0,
            }}
          >
            Build a space for Nigerian health students to learn and connect.
          </p>
        </div>

        {/* Step indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "28px" }}>
          {[1, 2, 3].map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "13px",
                  background: step >= s ? "var(--gradient)" : "var(--surface-2)",
                  color: step >= s ? "white" : "var(--text-muted)",
                  border: step >= s ? "none" : "1px solid var(--border)",
                  transition: "all 0.2s",
                }}
              >
                {step > s ? <Check size={15} /> : s}
              </div>
              {s < 3 && (
                <div
                  style={{
                    flex: 1,
                    height: "2px",
                    margin: "0 8px",
                    background: step > s ? "var(--teal)" : "var(--border)",
                    transition: "all 0.2s",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "24px",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          {/* STEP 1 — Purpose + Topic */}
          {step === 1 && (
            <div>
              <label style={labelStyle}>Why do you want to start this community?</label>
              <p style={helpStyle}>
                Tell us the purpose so reviewers understand what this community is for.
              </p>
              <textarea
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. A space for radiology students to share imaging cases and study tips..."
                rows={4}
                style={{
                  width: "100%",
                  resize: "vertical",
                  marginBottom: "24px",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              />

              <label style={labelStyle}>Health topic</label>
              <p style={helpStyle}>Pick the topic that best fits your community.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {HEALTH_TOPICS.map((t) => {
                  const active = topic === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTopic(t)}
                      style={{
                        padding: "9px 16px",
                        borderRadius: "99px",
                        border: active ? "1.5px solid #0D9488" : "1px solid var(--border)",
                        background: active ? "var(--gradient)" : "var(--surface-2)",
                        color: active ? "white" : "var(--text-muted)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Community type */}
          {step === 2 && (
            <div>
              <label style={labelStyle}>Community type</label>
              <p style={helpStyle}>Choose who can see and participate in your community.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {COMMUNITY_TYPES.map((ct) => {
                  const active = communityType === ct.value;
                  const Icon = ct.icon;
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setCommunityType(ct.value)}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "14px",
                        textAlign: "left",
                        padding: "16px",
                        borderRadius: "var(--radius-sm)",
                        border: active ? "1.5px solid #0D9488" : "1px solid var(--border)",
                        background: active ? "rgba(13,148,136,0.06)" : "var(--surface-2)",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: active ? "var(--gradient)" : "var(--surface-3)",
                          color: active ? "white" : "var(--text-muted)",
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontFamily: "var(--font-display)",
                            fontWeight: 700,
                            fontSize: "14px",
                            color: "var(--text)",
                            margin: "0 0 2px 0",
                          }}
                        >
                          {ct.label}
                        </p>
                        <p
                          style={{
                            fontFamily: "var(--font-body)",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {ct.description}
                        </p>
                      </div>
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          flexShrink: 0,
                          border: active ? "none" : "2px solid var(--border)",
                          background: active ? "var(--gradient)" : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {active && <Check size={13} color="white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3 — Name + Description */}
          {step === 3 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={labelStyle}>Community name</label>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-body)",
                    color: name.length > NAME_MAX ? "var(--error)" : "var(--text-light)",
                  }}
                >
                  {name.length}/{NAME_MAX}
                </span>
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, NAME_MAX))}
                placeholder="e.g. Radiology Hub"
                maxLength={NAME_MAX}
                style={{ width: "100%", marginBottom: "20px", fontFamily: "var(--font-body)", fontSize: "14px" }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <label style={labelStyle}>Description</label>
                <span
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-body)",
                    color: description.length > DESC_MAX ? "var(--error)" : "var(--text-light)",
                  }}
                >
                  {description.length}/{DESC_MAX}
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                placeholder="What is this community about? What should members expect?"
                rows={5}
                maxLength={DESC_MAX}
                style={{
                  width: "100%",
                  resize: "vertical",
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  lineHeight: 1.6,
                }}
              />

              {/* Summary */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    margin: "0 0 8px 0",
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  Summary
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  <span style={summaryChip}>{topic}</span>
                  <span style={summaryChip}>
                    {COMMUNITY_TYPES.find((c) => c.value === communityType)?.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p
              style={{
                fontSize: "13px",
                color: "var(--error)",
                background: "rgba(220,38,38,0.08)",
                padding: "10px 12px",
                borderRadius: "var(--radius-sm)",
                marginTop: "18px",
              }}
            >
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
            <button
              onClick={goBack}
              style={{
                flex: "0 0 auto",
                padding: "12px 20px",
                borderRadius: "99px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              {step === 1 ? "Cancel" : "Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={step === 1 ? !canContinueStep1 : !canContinueStep2}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "99px",
                  border: "none",
                  background:
                    (step === 1 ? canContinueStep1 : canContinueStep2)
                      ? "var(--gradient)"
                      : "var(--border)",
                  color:
                    (step === 1 ? canContinueStep1 : canContinueStep2)
                      ? "white"
                      : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor:
                    (step === 1 ? canContinueStep1 : canContinueStep2)
                      ? "pointer"
                      : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                Continue <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: "99px",
                  border: "none",
                  background: canSubmit ? "var(--gradient)" : "var(--border)",
                  color: canSubmit ? "white" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const summaryChip: React.CSSProperties = {
  padding: "4px 12px",
  borderRadius: "99px",
  background: "var(--teal-soft)",
  color: "var(--teal-dark)",
  fontFamily: "var(--font-display)",
  fontWeight: 600,
  fontSize: "12px",
};
