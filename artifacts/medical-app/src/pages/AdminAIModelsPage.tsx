import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Shield, Power, PowerOff, Activity, Brain, FlaskConical,
  AlertTriangle, CheckCircle2, RefreshCw, BarChart3, Clock,
  Users, MessageSquare, TrendingUp, AlertOctagon, Info
} from "lucide-react";

interface AIModel {
  id: string;
  model_name: string;
  display_name: string;
  description: string;
  enabled: boolean;
  icon: string;
  color: string;
  daily_limit: number;
  created_at: string;
  updated_at: string;
}

interface ModelUsage {
  model_name: string;
  total_messages: number;
  unique_users: number;
  avg_response_time?: number;
}

const MODEL_CONFIG = {
  docu: {
    display_name: "Docu",
    description: "Research & Study Co-Pilot — Literature reviews, methodology guidance, concept explanations",
    icon: "📚",
    color: "#0D9488",
    lucide: Brain,
  },
  pulse: {
    display_name: "Pulse",
    description: "Clinical Cases — Case discussions, differential diagnoses, clinical reasoning",
    icon: "🫀",
    color: "#E8445A",
    lucide: Activity,
  },
  scrub: {
    display_name: "Scrub",
    description: "Procedural Skills — Step-by-step guides, technique explanations, skill building",
    icon: "🧪",
    color: "#9B6DFF",
    lucide: FlaskConical,
  },
};

export default function AdminAIModelsPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [models, setModels] = useState<AIModel[]>([]);
  const [usageStats, setUsageStats] = useState<ModelUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingModel, setTogglingModel] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (!profile || !["admin", "app_admin", "super_admin"].includes(profile.role)) {
          navigate("/");
          return;
        }

        setCurrentRole(profile.role);
        setCurrentUserId(user.id);
        await fetchData();
      } catch (err) {
        console.error("Auth check failed:", err);
        setError("Authentication failed.");
      }
    }
    checkAuth();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch model settings
      const { data: modelsData, error: modelsErr } = await supabase
        .from("ai_model_settings")
        .select("*")
        .order("model_name");

      if (modelsErr) throw modelsErr;

      // Ensure all models exist
      const existingModels = (modelsData || []) as AIModel[];
      const modelNames = ["docu", "pulse", "scrub"];

      for (const name of modelNames) {
        if (!existingModels.find(m => m.model_name === name)) {
          const config = MODEL_CONFIG[name as keyof typeof MODEL_CONFIG];
          const { data: newModel } = await supabase
            .from("ai_model_settings")
            .insert({
              model_name: name,
              display_name: config.display_name,
              description: config.description,
              enabled: true,
              daily_limit: 50,
            })
            .select()
            .single();
          if (newModel) existingModels.push(newModel as AIModel);
        }
      }

      setModels(existingModels.sort((a, b) => a.model_name.localeCompare(b.model_name)));

      // Fetch usage stats (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: usageData } = await supabase
        .from("chat_messages")
        .select("model, user_id")
        .gte("created_at", weekAgo.toISOString());

      const stats: Record<string, { total: number; users: Set<string> }> = {};
      (usageData || []).forEach((msg: any) => {
        const model = msg.model || "docu";
        if (!stats[model]) stats[model] = { total: 0, users: new Set() };
        stats[model].total++;
        stats[model].users.add(msg.user_id);
      });

      setUsageStats(
        Object.entries(stats).map(([model_name, data]) => ({
          model_name,
          total_messages: data.total,
          unique_users: data.users.size,
        })) as ModelUsage[]
      );
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load AI model data");
    } finally {
      setLoading(false);
    }
  }

  async function toggleModel(modelName: string, currentEnabled: boolean) {
    setTogglingModel(modelName);
    setError("");
    setSuccess("");

    try {
      const { error: updateErr } = await supabase
        .from("ai_model_settings")
        .update({ 
          enabled: !currentEnabled,
          updated_at: new Date().toISOString(),
        })
        .eq("model_name", modelName);

      if (updateErr) throw updateErr;

      // Log to audit
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action: `${!currentEnabled ? "Enabled" : "Disabled"} AI model: ${modelName}`,
        target_type: "ai_model",
        target_id: modelName,
      });

      setModels(prev => prev.map(m => 
        m.model_name === modelName ? { ...m, enabled: !currentEnabled } : m
      ));

      setSuccess(`${MODEL_CONFIG[modelName as keyof typeof MODEL_CONFIG]?.display_name || modelName} has been ${!currentEnabled ? "enabled" : "disabled"}.`);
      setShowConfirmModal(null);
    } catch (err: any) {
      setError(err.message || "Failed to toggle model");
    } finally {
      setTogglingModel(null);
    }
  }

  async function updateDailyLimit(modelName: string, newLimit: number) {
    try {
      const { error } = await supabase
        .from("ai_model_settings")
        .update({ daily_limit: newLimit })
        .eq("model_name", modelName);

      if (error) throw error;

      setModels(prev => prev.map(m => 
        m.model_name === modelName ? { ...m, daily_limit: newLimit } : m
      ));

      setSuccess(`Daily limit for ${MODEL_CONFIG[modelName as keyof typeof MODEL_CONFIG]?.display_name || modelName} updated to ${newLimit}.`);
    } catch (err: any) {
      setError(err.message || "Failed to update limit");
    }
  }

  const getUsageForModel = (modelName: string) => {
    return usageStats.find(u => u.model_name === modelName) || { total_messages: 0, unique_users: 0 };
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{
            width: "40px", height: "40px",
            borderRadius: "50%",
            border: "3px solid var(--border)",
            borderTop: "3px solid #0D9488",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 20px",
          }} />
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading AI controls...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  const allEnabled = models.every(m => m.enabled);
  const anyDisabled = models.some(m => !m.enabled);

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "24px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "var(--gradient)", display: "flex",
              alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={22} color="white" />
            </div>
            <div>
              <h1 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: "26px",
                color: "var(--text)",
                margin: 0,
              }}>
                AI Model Controls
              </h1>
            </div>
          </div>
          <p style={{
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text-muted)",
            margin: "4px 0 0 56px",
            lineHeight: 1.5,
          }}>
            Manage research co-pilot availability, usage limits, and kill-switch controls. 
            Disabling a model prevents all users (except admins) from accessing it.
          </p>
        </div>

        {/* Status Banner */}
        <div style={{
          padding: "16px 20px",
          borderRadius: "12px",
          background: anyDisabled ? "rgba(232,68,90,0.06)" : "rgba(13,148,136,0.06)",
          border: `1px solid ${anyDisabled ? "rgba(232,68,90,0.2)" : "rgba(13,148,136,0.2)"}`,
          marginBottom: "28px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          {anyDisabled ? (
            <AlertOctagon size={22} style={{ color: "#E8445A", flexShrink: 0 }} />
          ) : (
            <CheckCircle2 size={22} style={{ color: "#0D9488", flexShrink: 0 }} />
          )}
          <div>
            <p style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "14px",
              color: anyDisabled ? "#E8445A" : "#0D9488",
              margin: "0 0 2px 0",
            }}>
              {anyDisabled 
                ? `${models.filter(m => !m.enabled).length} model(s) currently disabled` 
                : "All AI models are operational"}
            </p>
            <p style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              {anyDisabled
                ? "Users will see offline status and be redirected to available models."
                : "Docu, Pulse, and Scrub are all available to users."}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{
            padding: "14px 18px",
            borderRadius: "8px",
            background: "rgba(232,68,90,0.08)",
            border: "1px solid rgba(232,68,90,0.2)",
            color: "#E8445A",
            fontSize: "14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}
        {success && (
          <div style={{
            padding: "14px 18px",
            borderRadius: "8px",
            background: "rgba(13,148,136,0.08)",
            border: "1px solid rgba(13,148,136,0.2)",
            color: "#0D9488",
            fontSize: "14px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <CheckCircle2 size={16} />
            {success}
          </div>
        )}

        {/* Model Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {models.map((model) => {
            const config = MODEL_CONFIG[model.model_name as keyof typeof MODEL_CONFIG];
            const usage = getUsageForModel(model.model_name);
            const IconComponent = config?.lucide || Brain;

            return (
              <div
                key={model.id}
                style={{
                  background: "var(--surface)",
                  border: `1px solid ${model.enabled ? "var(--border)" : "rgba(232,68,90,0.3)"}`,
                  borderRadius: "12px",
                  overflow: "hidden",
                  transition: "all 0.3s",
                  opacity: model.enabled ? 1 : 0.85,
                }}
              >
                {/* Card Header */}
                <div style={{
                  padding: "20px 24px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px",
                  borderBottom: "1px solid var(--border)",
                  background: model.enabled 
                    ? `linear-gradient(135deg, ${config?.color}08, transparent)` 
                    : "rgba(0,0,0,0.03)",
                }}>
                  <div style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "14px",
                    background: model.enabled 
                      ? `linear-gradient(135deg, ${config?.color}20, ${config?.color}08)` 
                      : "rgba(0,0,0,0.06)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: `2px solid ${model.enabled ? config?.color + "30" : "var(--border)"}`,
                  }}>
                    <IconComponent 
                      size={24} 
                      style={{ color: model.enabled ? config?.color : "var(--text-muted)" }} 
                    />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "4px",
                      flexWrap: "wrap",
                    }}>
                      <h3 style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 700,
                        fontSize: "18px",
                        color: "var(--text)",
                        margin: 0,
                      }}>
                        {config?.display_name || model.display_name}
                      </h3>
                      <span style={{
                        padding: "4px 10px",
                        borderRadius: "99px",
                        fontSize: "11px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: model.enabled 
                          ? `${config?.color}15` 
                          : "rgba(232,68,90,0.1)",
                        color: model.enabled ? config?.color : "#E8445A",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}>
                        {model.enabled ? (
                          <><Power size={10} /> Online</>
                        ) : (
                          <><PowerOff size={10} /> Offline</>
                        )}
                      </span>
                    </div>
                    <p style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      margin: "0 0 10px 0",
                      lineHeight: 1.5,
                    }}>
                      {config?.description || model.description}
                    </p>

                    {/* Quick Stats */}
                    <div style={{
                      display: "flex",
                      gap: "16px",
                      flexWrap: "wrap",
                    }}>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                      }}>
                        <MessageSquare size={13} />
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{usage.total_messages}</span> msgs (7d)
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                      }}>
                        <Users size={13} />
                        <span style={{ fontWeight: 600, color: "var(--text)" }}>{usage.unique_users}</span> users
                      </div>
                      <div style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        fontSize: "13px",
                        color: "var(--text-muted)",
                      }}>
                        <TrendingUp size={13} />
                        Limit: <span style={{ fontWeight: 600, color: "var(--text)" }}>{model.daily_limit}</span>/day
                      </div>
                    </div>
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() => {
                      if (model.enabled) {
                        setShowConfirmModal(model.model_name);
                      } else {
                        toggleModel(model.model_name, model.enabled);
                      }
                    }}
                    disabled={togglingModel === model.model_name}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "99px",
                      border: model.enabled ? "1px solid rgba(232,68,90,0.3)" : "none",
                      background: model.enabled ? "rgba(232,68,90,0.08)" : config?.color,
                      color: model.enabled ? "#E8445A" : "white",
                      fontFamily: "var(--font-display)",
                      fontWeight: 700,
                      fontSize: "13px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (model.enabled) {
                        e.currentTarget.style.background = "rgba(232,68,90,0.15)";
                      } else {
                        e.currentTarget.style.filter = "brightness(1.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (model.enabled) {
                        e.currentTarget.style.background = "rgba(232,68,90,0.08)";
                      } else {
                        e.currentTarget.style.filter = "brightness(1)";
                      }
                    }}
                  >
                    {togglingModel === model.model_name ? (
                      <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                    ) : model.enabled ? (
                      <><PowerOff size={14} /> Disable</>
                    ) : (
                      <><Power size={14} /> Enable</>
                    )}
                  </button>
                </div>

                {/* Card Body - Daily Limit */}
                <div style={{
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                  }}>
                    <Clock size={16} style={{ color: "var(--text-muted)" }} />
                    <label style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontWeight: 500,
                    }}>
                      Daily message limit per user:
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={model.daily_limit}
                      onChange={(e) => updateDailyLimit(model.model_name, parseInt(e.target.value) || 50)}
                      style={{
                        width: "70px",
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        background: "rgba(0,0,0,0.03)",
                        color: "var(--text)",
                        fontSize: "14px",
                        fontWeight: 600,
                        textAlign: "center",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    color: "var(--text-muted)",
                  }}>
                    <Info size={12} />
                    Last updated: {new Date(model.updated_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm Disable Modal */}
        {showConfirmModal && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 200,
            padding: "20px",
          }} onClick={() => setShowConfirmModal(null)}>
            <div style={{
              background: "var(--surface)",
              border: "1px solid rgba(232,68,90,0.3)",
              borderRadius: "12px",
              padding: "28px",
              maxWidth: "440px",
              width: "100%",
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(232,68,90,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <AlertTriangle size={24} style={{ color: "#E8445A" }} />
              </div>

              <h3 style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "18px",
                color: "var(--text)",
                margin: "0 0 8px 0",
              }}>
                Disable {MODEL_CONFIG[showConfirmModal as keyof typeof MODEL_CONFIG]?.display_name}?
              </h3>

              <p style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                lineHeight: 1.6,
                margin: "0 0 20px 0",
              }}>
                This will immediately prevent all users from accessing this AI model. 
                Active conversations will show an error. Admins can still access all models.
              </p>

              <div style={{
                padding: "12px 16px",
                borderRadius: "10px",
                background: "rgba(232,68,90,0.05)",
                border: "1px solid rgba(232,68,90,0.15)",
                marginBottom: "20px",
              }}>
                <p style={{
                  fontSize: "13px",
                  color: "#E8445A",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}>
                  <Info size={14} />
                  This action is logged and cannot be undone without re-enabling.
                </p>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => setShowConfirmModal(null)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    background: "rgba(0,0,0,0.03)",
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => toggleModel(showConfirmModal, true)}
                  disabled={togglingModel === showConfirmModal}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "10px",
                    border: "none",
                    background: "#E8445A",
                    color: "white",
                    fontFamily: "var(--font-display)",
                    fontWeight: 700,
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                  }}
                >
                  {togglingModel === showConfirmModal ? (
                    <RefreshCw size={14} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <><PowerOff size={14} /> Disable Model</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div style={{
          marginTop: "32px",
          padding: "20px",
          borderRadius: "12px",
          background: "rgba(0,0,0,0.03)",
          border: "1px solid var(--border)",
        }}>
          <h4 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            color: "var(--text)",
            margin: "0 0 10px 0",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}>
            <Info size={16} style={{ color: "var(--text-muted)" }} />
            About Kill-Switch Controls
          </h4>
          <ul style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.8,
            margin: 0,
            paddingLeft: "20px",
          }}>
            <li>Disabling a model immediately blocks all non-admin API requests</li>
            <li>Users see an "Offline" badge and are prompted to try other models</li>
            <li>Daily limits reset at midnight UTC for each user</li>
            <li>All toggle actions are logged to the audit trail for accountability</li>
            <li>Admins retain full access to all models regardless of status</li>
          </ul>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}
