import { useEffect, useState, FormEvent } from "react";
import { useLocation } from "wouter";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import {
  Camera, Users, Globe, Lock, Check, ChevronDown, ChevronUp,
  Info, AlertCircle, Hash, Shield, BookOpen, GraduationCap
} from "lucide-react";

type Category =
  | "Medicine"
  | "Nursing"
  | "Radiography"
  | "Pharmacy"
  | "Dentistry"
  | "Other";

type GroupSize = "under_400" | "400_1800" | "2k_plus" | "under_50" | "50_200" | "200_plus";

interface FormErrors {
  name?: string;
  displayName?: string;
  description?: string;
  category?: string;
  justification?: string;
  groupSize?: string;
  agreement?: string;
  submit?: string;
}

const categories: Category[] = [
  "Medicine",
  "Nursing",
  "Radiography",
  "Pharmacy",
  "Dentistry",
  "Other",
];

const categoryIcons: Record<Category, string> = {
  Medicine: "🩺",
  Nursing: "💉",
  Radiography: "🩻",
  Pharmacy: "💊",
  Dentistry: "🦷",
  Other: "📚",
};

const suggestedTags = [
  "UNILAG", "UI", "UNIBEN", "UNN", "OAU", "ABU", "LUTH",
  "100 Level", "200 Level", "300 Level", "400 Level", "Clinicals",
  "#Anatomy", "#Physiology", "#Biochemistry", "#Pathology", "#Pharmacology",
];

const groupSizeOptions: { value: GroupSize; label: string; hint: string; icon: string }[] = [
  { value: "under_400", label: "Under 400", hint: "class group", icon: "👨‍🎓" },
  { value: "400_1800", label: "400-1800", hint: "departmental", icon: "🏫" },
  { value: "2k_plus", label: "2k+", hint: "inter-university", icon: "🌍" },
];

export default function StartCommunityPage() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("Medicine");
  const [isPrivate, setIsPrivate] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [justification, setJustification] = useState("");
  const [groupSize, setGroupSize] = useState<GroupSize | "">("");
  const [agreedToGuidelines, setAgreedToGuidelines] = useState(false);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLocation("/login");
        return;
      }
      setAuthLoading(false);
    }
    checkAuth();
  }, [setLocation, supabase]);

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const validate = () => {
    const nextErrors: FormErrors = {};
    const slugRegex = /^[a-z0-9-]+$/;

    if (!name.trim()) {
      nextErrors.name = "Community name is required.";
    } else if (!slugRegex.test(name)) {
      nextErrors.name = "Use lowercase letters, numbers and hyphens only.";
    } else if (name.length < 3) {
      nextErrors.name = "Community name must be at least 3 characters.";
    }

    if (!displayName.trim()) {
      nextErrors.displayName = "Display name is required.";
    }

    if (!description.trim()) {
      nextErrors.description = "Description is required.";
    } else if (description.length < 20) {
      nextErrors.description = "Description should be at least 20 characters.";
    }

    if (!category) {
      nextErrors.category = "Please select a category.";
    }

    if (!justification.trim()) {
      nextErrors.justification = "Please describe the academic purpose and student benefit of this community.";
    } else if (justification.trim().length < 50) {
      nextErrors.justification =
        `Please add more detail — at least 50 characters (${justification.trim().length}/50 so far).`;
    }

    if (!groupSize) {
      nextErrors.groupSize = "Please choose an estimated community size.";
    }

    if (!agreedToGuidelines) {
      nextErrors.agreement = "You need to agree to the community guidelines.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLocation("/login");
        return;
      }

      const { data: existingCommunity } = await supabase
        .from("communities")
        .select("id")
        .or(`name.eq.${name},slug.eq.${name}`)
        .maybeSingle();

      if (existingCommunity) {
        setErrors({ name: "This community name already exists." });
        setLoading(false);
        return;
      }

      const { data: existingRequest } = await supabase
        .from("community_requests")
        .select("id")
        .or(`name.eq.${name},slug.eq.${name}`)
        .in("status", ["pending", "info_requested"])
        .maybeSingle();

      if (existingRequest) {
        setErrors({
          name: "A request for this community name is already pending review.",
        });
        setLoading(false);
        return;
      }

      const { data: request, error } = await supabase
        .from("community_requests")
        .insert({
          name,
          slug: name,
          display_name: displayName,
          description,
          category,
          is_private: isPrivate,
          tags,
          justification,
          stated_purpose: justification,
          size_estimate: groupSize,
          status: "pending",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      setLocation(`/community/pending/${request.id}`);
    } catch (error: any) {
      setErrors({
        submit: error?.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <AppShell>
        <div style={{
          minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "3px solid var(--border)", borderTop: "3px solid #0D9488",
            animation: "spin 0.8s linear infinite",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)", background: "var(--surface-2)",
    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px",
    outline: "none", transition: "border-color 0.2s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: "13px", fontWeight: 700,
    color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)",
  };

  const helperStyle: React.CSSProperties = {
    fontSize: "12px", color: "var(--text-muted)", marginTop: "4px",
  };

  const errorStyle: React.CSSProperties = {
    fontSize: "12px", color: "#ef4444", marginTop: "4px", fontWeight: 600,
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "0 0 40px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px",
            color: "var(--text)", marginBottom: "6px",
          }}>
            Create a Community
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5 }}>
            Build a study community for health science students across Nigeria.
          </p>
        </div>

        {/* Info Banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(13,148,136,0.08), rgba(45,135,200,0.06))",
          border: "1px solid rgba(13,148,136,0.2)", borderRadius: "var(--radius)",
          padding: "14px 16px", marginBottom: "24px", display: "flex", alignItems: "flex-start", gap: "10px",
        }}>
          <Info size={16} style={{ color: "#0D9488", marginTop: "2px", flexShrink: 0 }} />
          <p style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.5, margin: 0 }}>
            New communities are reviewed by an admin before they go live.
            <span style={{ color: "var(--text-muted)" }}> This usually takes less than 24 hours.</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* ── Community Name ── */}
          <div>
            <label style={labelStyle}>Community Name</label>
            <div style={{
              display: "flex", alignItems: "center", borderRadius: "var(--radius-sm)",
              border: errors.name && touched.name ? "1px solid #ef4444" : "1px solid var(--border)",
              background: "var(--surface-2)", overflow: "hidden",
            }}>
              <span style={{
                padding: "0 0 0 14px", color: "var(--text-muted)", fontSize: "14px",
                fontFamily: "var(--font-body)", fontWeight: 600,
              }}>c/</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                onBlur={() => setTouched(p => ({ ...p, name: true }))}
                placeholder="anatomy-101"
                style={{ ...inputStyle, border: "none", background: "transparent", flex: 1 }}
              />
            </div>
            {errors.name && touched.name && <p style={errorStyle}>{errors.name}</p>}
            <p style={helperStyle}>This will be your community URL: c/{name || "name"}</p>
          </div>

          {/* ── Display Name ── */}
          <div>
            <label style={labelStyle}>Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, displayName: true }))}
              placeholder="Anatomy 101"
              style={{
                ...inputStyle,
                border: errors.displayName && touched.displayName ? "1px solid #ef4444" : "1px solid var(--border)",
              }}
            />
            {errors.displayName && touched.displayName && <p style={errorStyle}>{errors.displayName}</p>}
          </div>

          {/* ── Description ── */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, description: true }))}
              placeholder="Describe the purpose of this community..."
              style={{
                ...inputStyle, resize: "vertical",
                border: errors.description && touched.description ? "1px solid #ef4444" : "1px solid var(--border)",
              }}
            />
            {errors.description && touched.description && <p style={errorStyle}>{errors.description}</p>}
            <p style={helperStyle}>{description.length}/20 min characters</p>
          </div>

          {/* ── Category ── */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>Category</label>
            <button
              type="button"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span>{categoryIcons[category]}</span>
                {category}
              </span>
              <ChevronDown size={16} style={{ color: "var(--text-muted)", transform: showCategoryDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showCategoryDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow)", zIndex: 10,
                overflow: "hidden",
              }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => { setCategory(cat); setShowCategoryDropdown(false); }}
                    style={{
                      width: "100%", padding: "10px 14px", border: "none", background: "none",
                      cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
                      fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)",
                      backgroundColor: category === cat ? "rgba(13,148,136,0.08)" : "transparent",
                    }}
                  >
                    <span>{categoryIcons[cat]}</span> {cat}
                  </button>
                ))}
              </div>
            )}
            {errors.category && <p style={errorStyle}>{errors.category}</p>}
          </div>

          {/* ── Tags ── */}
          <div style={{ position: "relative" }}>
            <label style={labelStyle}>
              Tags <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(school, level, subject)</span>
            </label>
            <button
              type="button"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)", background: "var(--surface-2)",
                color: tags.length > 0 ? "var(--text)" : "var(--text-light)",
                fontFamily: "var(--font-body)", fontSize: "14px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
                textAlign: "left", minHeight: "44px",
              }}
            >
              <span style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {tags.length > 0 ? tags.map(tag => (
                  <span key={tag} style={{
                    padding: "3px 10px", borderRadius: "99px",
                    background: "rgba(13,148,136,0.1)", color: "#0D9488",
                    fontSize: "12px", fontWeight: 600,
                  }}>{tag}</span>
                )) : "Select tags..."}
              </span>
              <ChevronDown size={16} style={{ color: "var(--text-muted)", flexShrink: 0, transform: showTagDropdown ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showTagDropdown && (
              <div style={{
                position: "absolute", top: "100%", left: 0, right: 0, marginTop: "4px",
                background: "var(--surface)", border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)", boxShadow: "var(--shadow)", zIndex: 10,
                padding: "8px", maxHeight: "200px", overflowY: "auto",
              }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {suggestedTags.map((tag) => {
                    const active = tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        style={{
                          padding: "5px 12px", borderRadius: "99px", border: active ? "none" : "1px solid var(--border)",
                          background: active ? "var(--gradient)" : "var(--surface-2)",
                          color: active ? "white" : "var(--text)", fontSize: "12px", fontWeight: 600,
                          cursor: "pointer", fontFamily: "var(--font-body)",
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* ── Academic Purpose ── */}
          <div>
            <label style={labelStyle}>Academic Purpose / Student Benefit</label>
            <div style={{
              background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border)", padding: "12px 14px", marginBottom: "10px",
            }}>
              <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px", fontWeight: 600 }}>
                Examples:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {[
                  "Histology revision for 300L Medicine",
                  "Anatomy mnemonics and dissection guides",
                  "Clinical OSCE prep and mock stations",
                  "Pharmacology board preparation",
                ].map(ex => (
                  <p key={ex} style={{ fontSize: "12px", color: "var(--text-light)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ color: "#0D9488" }}>•</span> {ex}
                  </p>
                ))}
              </div>
            </div>
            <textarea
              rows={4}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              onBlur={() => setTouched(p => ({ ...p, justification: true }))}
              placeholder="e.g. There's no active group for 200L Anatomy at UNILAG. I want a space to share dissection guides, past questions, and revision schedules ahead of exams."
              style={{
                ...inputStyle, resize: "vertical",
                border: errors.justification && touched.justification ? "1px solid #ef4444" : "1px solid var(--border)",
              }}
            />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "4px" }}>
              <p style={{ ...helperStyle, margin: 0 }}>Shown to admins only — helps your request get reviewed faster.</p>
              <span style={{
                fontSize: "11px", fontWeight: 700,
                color: justification.trim().length >= 50 ? "#0D9488" : "var(--text-muted)",
              }}>
                {justification.trim().length}/50 min
              </span>
            </div>
            {errors.justification && touched.justification && <p style={errorStyle}>{errors.justification}</p>}
          </div>

          {/* ── Visibility ── */}
          <div>
            <label style={labelStyle}>Visibility</label>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                style={{
                  flex: 1, padding: "14px", borderRadius: "var(--radius-sm)",
                  border: !isPrivate ? "2px solid #0D9488" : "1px solid var(--border)",
                  background: !isPrivate ? "rgba(13,148,136,0.06)" : "var(--surface-2)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Globe size={16} style={{ color: !isPrivate ? "#0D9488" : "var(--text-muted)" }} />
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px",
                    color: !isPrivate ? "var(--text)" : "var(--text-muted)",
                  }}>Public</span>
                  {!isPrivate && <Check size={14} style={{ color: "#0D9488", marginLeft: "auto" }} />}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  Visible to all app users once approved.
                </p>
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                style={{
                  flex: 1, padding: "14px", borderRadius: "var(--radius-sm)",
                  border: isPrivate ? "2px solid #0D9488" : "1px solid var(--border)",
                  background: isPrivate ? "rgba(13,148,136,0.06)" : "var(--surface-2)",
                  cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                  <Lock size={16} style={{ color: isPrivate ? "#0D9488" : "var(--text-muted)" }} />
                  <span style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px",
                    color: isPrivate ? "var(--text)" : "var(--text-muted)",
                  }}>Private</span>
                  {isPrivate && <Check size={14} style={{ color: "#0D9488", marginLeft: "auto" }} />}
                </div>
                <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                  Hidden from search — members join by invite only.
                </p>
              </button>
            </div>
          </div>

          {/* ── Group Size ── */}
          <div>
            <label style={labelStyle}>Estimated Community size</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {groupSizeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGroupSize(option.value)}
                  style={{
                    padding: "14px 10px", borderRadius: "var(--radius-sm)",
                    border: groupSize === option.value ? "2px solid #0D9488" : "1px solid var(--border)",
                    background: groupSize === option.value ? "rgba(13,148,136,0.06)" : "var(--surface-2)",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s",
                  }}
                >
                  <div style={{ fontSize: "20px", marginBottom: "4px" }}>{option.icon}</div>
                  <div style={{
                    fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px",
                    color: groupSize === option.value ? "var(--text)" : "var(--text-muted)",
                  }}>{option.label}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-light)", marginTop: "2px" }}>{option.hint}</div>
                  {groupSize === option.value && (
                    <div style={{ marginTop: "6px" }}>
                      <Check size={14} style={{ color: "#0D9488" }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {errors.groupSize && <p style={errorStyle}>{errors.groupSize}</p>}
          </div>

          {/* ── Agreement ── */}
          <div style={{
            background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
            border: errors.agreement ? "1px solid #ef4444" : "1px solid var(--border)",
            padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "10px",
          }}>
            <input
              type="checkbox"
              id="guidelines"
              checked={agreedToGuidelines}
              onChange={(e) => setAgreedToGuidelines(e.target.checked)}
              style={{
                width: "18px", height: "18px", accentColor: "#0D9488",
                marginTop: "2px", cursor: "pointer", flexShrink: 0,
              }}
            />
            <label htmlFor="guidelines" style={{
              fontSize: "13px", color: "var(--text)", lineHeight: 1.5, cursor: "pointer",
            }}>
              I agree to moderate this group according to the app's
              <span style={{ color: "#0D9488", fontWeight: 700 }}> community guidelines</span>.
            </label>
          </div>
          {errors.agreement && <p style={{ ...errorStyle, marginTop: "-12px" }}>{errors.agreement}</p>}

          {/* ── Submit Error ── */}
          {errors.submit && (
            <div style={{
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: "var(--radius-sm)", padding: "12px 14px", display: "flex", alignItems: "center", gap: "8px",
            }}>
              <AlertCircle size={16} style={{ color: "#ef4444", flexShrink: 0 }} />
              <p style={{ fontSize: "13px", color: "#ef4444", margin: 0, fontWeight: 600 }}>{errors.submit}</p>
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "14px", borderRadius: "99px",
              background: "var(--gradient)", color: "white", border: "none",
              fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
              transition: "opacity 0.2s", marginTop: "4px",
            }}
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
