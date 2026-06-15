import { useState, useEffect, FormEvent } from "react";
import { useParams, useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import {
  PenSquare, Send, Eye, EyeOff, ArrowLeft, Hash, Shield,
  AlertCircle, CheckCircle2, Image as ImageIcon, X
} from "lucide-react";
import type { Community } from "@/lib/types";

export default function CommunityCreatePostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isMember, setIsMember] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    async function fetchCommunity() {
      setFetchLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      const { data: comm } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", slug)
        .single();

      if (!comm) {
        setError("Community not found");
        setFetchLoading(false);
        return;
      }
      setCommunity(comm);

      // Check membership
      if (user) {
        const { data: membership } = await supabase
          .from("community_members")
          .select("id")
          .eq("community_id", comm.id)
          .eq("user_id", user.id)
          .single();
        setIsMember(!!membership);
      }

      // Fetch rules
      const { data: rulesData } = await supabase
        .from("community_rules")
        .select("*")
        .eq("community_id", comm.id)
        .order("order_index", { ascending: true });
      setRules(rulesData || []);

      setFetchLoading(false);
    }
    fetchCommunity();
  }, [slug, supabase]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) {
      setError("Please enter a title or content.");
      return;
    }
    if (!community) return;
    if (!isMember) {
      setError("You must join this community to post.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { error: insertError } = await supabase.from("posts").insert({
        title: title.trim() || null,
        content: content.trim(),
        author_id: user.id,
        community_id: community.id,
        is_anonymous: isAnonymous,
        upvotes: 0,
        comment_count: 0,
      });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate(`/c/${slug}`);
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "3px solid var(--border)", borderTop: "3px solid #0D9488",
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading community...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  if (error && !community) {
    return (
      <AppShell>
        <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius)", padding: "24px", textAlign: "center",
          }}>
            <AlertCircle size={40} style={{ color: "#ef4444", marginBottom: "12px" }} />
            <h2 style={{ color: "#ef4444", margin: "0 0 8px", fontSize: "18px" }}>{error}</h2>
            <button onClick={() => navigate("/")} style={{
              padding: "10px 20px", background: "var(--gradient)", color: "white",
              border: "none", borderRadius: "99px", cursor: "pointer", fontWeight: 700,
            }}>Go Home</button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 0 40px" }}>
        {/* Back + Community Header */}
        <div style={{ marginBottom: "20px" }}>
          <button onClick={() => navigate(`/c/${slug}`)} style={{
            background: "none", border: "none", color: "var(--text-muted)",
            cursor: "pointer", fontSize: "13px", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px", fontWeight: 600,
          }}>
            <ArrowLeft size={16} /> Back to c/{slug}
          </button>

          {community && (
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 16px", background: "var(--surface)",
              border: "1px solid var(--border)", borderRadius: "var(--radius)",
            }}>
              <div style={{
                width: "44px", height: "44px", borderRadius: "12px",
                background: community.profile_image_url
                  ? `url(${community.profile_image_url}) center/cover no-repeat`
                  : "var(--gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "22px", overflow: "hidden", flexShrink: 0,
              }}>
                {!community.profile_image_url && community.icon}
              </div>
              <div>
                <h1 style={{
                  fontFamily: "var(--font-display)", fontWeight: 800,
                  fontSize: "16px", color: "var(--text)", margin: 0,
                }}>
                  Create Post in {community.name}
                </h1>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  c/{community.slug} • {community.is_private ? "Private" : "Public"}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rules Reminder */}
        {rules.length > 0 && showRules && (
          <div style={{
            background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.15)",
            borderRadius: "var(--radius)", padding: "14px 16px", marginBottom: "16px",
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Shield size={14} style={{ color: "#0D9488" }} />
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#0D9488" }}>Community Rules</span>
              </div>
              <button onClick={() => setShowRules(false)} style={{
                background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)",
              }}>
                <X size={14} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {rules.slice(0, 3).map((rule: any, idx: number) => (
                <p key={rule.id} style={{
                  fontSize: "12px", color: "var(--text-muted)", margin: 0,
                }}>
                  <span style={{ color: "#0D9488", fontWeight: 700 }}>{idx + 1}.</span> {rule.title}
                </p>
              ))}
              {rules.length > 3 && (
                <p style={{ fontSize: "11px", color: "var(--text-light)", margin: "4px 0 0" }}>
                  +{rules.length - 3} more rules
                </p>
              )}
            </div>
          </div>
        )}

        {/* Success */}
        {success && (
          <div style={{
            background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.2)",
            borderRadius: "var(--radius)", padding: "16px", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <CheckCircle2 size={20} style={{ color: "#0D9488" }} />
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0D9488", margin: 0 }}>
              Post created! Redirecting...
            </p>
          </div>
        )}

        {/* Error */}
        {error && !success && (
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius)", padding: "12px 16px", marginBottom: "16px",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
            <p style={{ fontSize: "13px", color: "#ef4444", margin: 0, fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {/* Post Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              style={{
                width: "100%", padding: "14px 16px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--text)", fontFamily: "var(--font-display)",
                fontSize: "18px", fontWeight: 800, outline: "none",
              }}
            />
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={6}
              style={{
                width: "100%", padding: "14px 16px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface)",
                color: "var(--text)", fontFamily: "var(--font-body)",
                fontSize: "15px", lineHeight: 1.6, outline: "none", resize: "vertical",
              }}
            />
          </div>

          {/* Anonymous Toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 14px", background: "var(--surface)",
            border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: isAnonymous ? "var(--gradient)" : "var(--surface-2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid var(--border)",
              }}>
                {isAnonymous ? <EyeOff size={16} color="white" /> : <Eye size={16} style={{ color: "var(--text-muted)" }} />}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                  Post Anonymously
                </p>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                  Your name won't be shown. Community admins can still see your identity.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              style={{
                width: "48px", height: "26px", borderRadius: "99px",
                border: "none", cursor: "pointer", position: "relative",
                background: isAnonymous ? "var(--gradient)" : "var(--surface-2)",
                transition: "background 0.2s", padding: 0,
              }}
            >
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: "white", position: "absolute", top: "3px",
                left: isAnonymous ? "25px" : "3px",
                transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%", padding: "14px", borderRadius: "99px",
              background: "var(--gradient)", color: "white", border: "none",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px",
              cursor: loading || success ? "not-allowed" : "pointer",
              opacity: loading || success ? 0.7 : 1, transition: "opacity 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
            }}
          >
            <Send size={16} />
            {loading ? "Posting..." : "Post to Community"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
