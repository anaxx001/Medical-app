import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, Newspaper, Pin, Link2, Play, MapPin, 
  AlertCircle, Check, Loader2 
} from "lucide-react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";



type PostType = "news" | "video" | "link";

interface FormData {
  title: string;
  excerpt: string;
  body: string;
  type: PostType;
  mediaUrl: string;
  universityTags: string[];
  isPinned: boolean;
  pinExpiresAt: string;
  status: "draft" | "published";
}

export default function EditNewsPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allUniversities, setAllUniversities] = useState<{slug: string, name: string}[]>([]);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [form, setForm] = useState<FormData>({
    title: "",
    excerpt: "",
    body: "",
    type: "news",
    mediaUrl: "",
    universityTags: ["global"],
    isPinned: false,
    pinExpiresAt: "",
    status: "draft",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: perms } = await supabase
        .from("user_permissions")
        .select("permissions, role")
        .eq("user_id", user.id)
        .single();

      if (perms) {
        setUserPermissions(perms.permissions || []);
        setUserRole(perms.role);
      }

      const { data: post, error } = await supabase
        .from("news_posts")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !post) {
        navigate("/news");
        return;
      }

      const canEdit = 
        post.created_by === user.id || 
        perms?.permissions?.includes("news:edit_any") ||
        ["super_admin", "app_admin"].includes(perms?.role || "");

      if (!canEdit) {
        navigate(`/news/${id}`);
        return;
      }

      setForm({
        title: post.title || "",
        excerpt: post.excerpt || "",
        body: post.body || "",
        type: post.type || "news",
        mediaUrl: post.media_url || "",
        universityTags: post.university_tags || ["global"],
        isPinned: post.is_pinned || false,
        pinExpiresAt: post.pin_expires_at 
          ? new Date(post.pin_expires_at).toISOString().slice(0, 16) 
          : "",
        status: post.status || "draft",
      });

      setLoading(false);
    

    // Fetch all universities from profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("university")
      .not("university", "is", null);

    const uniSet = new Set<string>();
    uniSet.add("global");
    (profiles || []).forEach((p: any) => {
      if (p.university) uniSet.add(p.university.toLowerCase().trim());
    });

    const uniList = Array.from(uniSet).map(slug => ({
      slug,
      name: slug === "global" ? "All Universities" : slug.toUpperCase().replace(/-/g, " "),
    })).sort((a, b) => (a.slug === "global" ? -1 : a.name.localeCompare(b.name)));

    setAllUniversities(uniList);}

    if (id) init();
  }, [id]);

  const canPublish = userPermissions.includes("news:publish") || 
    ["super_admin", "app_admin"].includes(userRole || "");

  const canPin = userPermissions.includes("news:pin") || 
    ["super_admin", "app_admin"].includes(userRole || "");

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = "Title is required";
    if (form.title.length > 200) newErrors.title = "Title must be under 200 characters";
    if (!form.body.trim()) newErrors.body = "Body content is required";
    if (form.excerpt.length > 300) newErrors.excerpt = "Excerpt must be under 300 characters";

    if (form.type === "video" && !form.mediaUrl.trim()) {
      newErrors.mediaUrl = "Video URL is required";
    }
    if (form.type === "link" && !form.mediaUrl.trim()) {
      newErrors.mediaUrl = "Link URL is required";
    }

    if (form.universityTags.length === 0) {
      newErrors.universityTags = "Select at least one university";
    }

    if (form.isPinned && !form.pinExpiresAt && canPin) {
      newErrors.pinExpiresAt = "Set an expiry date for pinned posts";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (publishStatus: "draft" | "published") => {
    if (!validate() || !id || !currentUserId) return;

    setSaving(true);

    const payload = {
      title: form.title.trim(),
      excerpt: form.excerpt.trim() || form.body.slice(0, 160).trim() + (form.body.length > 160 ? "..." : ""),
      body: form.body.trim(),
      type: form.type,
      media_url: form.mediaUrl.trim() || null,
      media_thumbnail: form.type === "video" ? getYouTubeThumbnail(form.mediaUrl) : null,
      university_tags: form.universityTags,
      is_pinned: form.isPinned && canPin,
      pin_expires_at: form.isPinned && canPin && form.pinExpiresAt ? new Date(form.pinExpiresAt).toISOString() : null,
      status: publishStatus,
      updated_by: currentUserId,
    };

    const { error } = await supabase
      .from("news_posts")
      .update(payload)
      .eq("id", id);

    setSaving(false);

    if (error) {
      console.error("Update error:", error);
      setErrors({ submit: error.message });
      return;
    }

    navigate(`/news/${id}`);
  };

  const toggleUniversity = (slug: string) => {
    setForm(prev => {
      if (slug === "global") return { ...prev, universityTags: ["global"] };
      const withoutGlobal = prev.universityTags.filter(t => t !== "global");
      if (withoutGlobal.includes(slug)) {
        const filtered = withoutGlobal.filter(t => t !== slug);
        return { ...prev, universityTags: filtered.length ? filtered : ["global"] };
      }
      return { ...prev, universityTags: [...withoutGlobal, slug] };
    });
  };

  const getYouTubeThumbnail = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
  };

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "720px", margin: "0 auto", padding: "40px 0", textAlign: "center" }}>
          <Loader2 size={32} color="#0D9488" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "16px 0 40px" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate(`/news/${id}`)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
          >
            <ArrowLeft size={20} />
          </button>
          <Newspaper size={24} color="#0D9488" />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", margin: 0 }}>
            Edit News Post
          </h1>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Title */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
              Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., UNILAG Medical School Announces New Residency Program"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: errors.title ? "1px solid #EF4444" : "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
                fontFamily: "var(--font-display)",
                outline: "none",
              }}
            />
            {errors.title && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>{errors.title}</p>}
          </div>

          {/* Post Type */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
              Post Type
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[
                { key: "news" as PostType, label: "News Article", icon: Newspaper },
                { key: "video" as PostType, label: "Video", icon: Play },
                { key: "link" as PostType, label: "External Link", icon: Link2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setForm(prev => ({ ...prev, type: key, mediaUrl: "" }))}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    borderRadius: "8px",
                    border: form.type === key ? "1px solid #0D9488" : "1px solid var(--border)",
                    background: form.type === key ? "rgba(13, 148, 136, 0.08)" : "var(--surface)",
                    color: form.type === key ? "#0D9488" : "var(--text-muted)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Media URL */}
          {(form.type === "video" || form.type === "link") && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
                {form.type === "video" ? "Video URL *" : "Link URL *"}
              </label>
              <input
                type="url"
                value={form.mediaUrl}
                onChange={(e) => setForm(prev => ({ ...prev, mediaUrl: e.target.value }))}
                placeholder={form.type === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: errors.mediaUrl ? "1px solid #EF4444" : "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
              {errors.mediaUrl && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>{errors.mediaUrl}</p>}

              {form.mediaUrl && form.type === "video" && getYouTubeThumbnail(form.mediaUrl) && (
                <div style={{ marginTop: "10px", borderRadius: "8px", overflow: "hidden", width: "200px", height: "120px" }}>
                  <img src={getYouTubeThumbnail(form.mediaUrl)!} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
              )}
            </div>
          )}

          {/* Excerpt */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
              Excerpt <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(auto-generated if empty)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm(prev => ({ ...prev, excerpt: e.target.value }))}
              placeholder="Short preview shown in the news feed..."
              rows={2}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: errors.excerpt ? "1px solid #EF4444" : "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
                resize: "vertical",
                outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              {errors.excerpt && <p style={{ color: "#EF4444", fontSize: "12px", margin: 0 }}>{errors.excerpt}</p>}
              <span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "auto" }}>
                {form.excerpt.length}/300
              </span>
            </div>
          </div>

          {/* Body */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px", fontFamily: "var(--font-display)" }}>
              Body Content *
            </label>
            <textarea
              value={form.body}
              onChange={(e) => setForm(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Write the full article here..."
              rows={10}
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: "8px",
                border: errors.body ? "1px solid #EF4444" : "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: "14px",
                lineHeight: "1.6",
                resize: "vertical",
                outline: "none",
                fontFamily: "var(--font-body)",
              }}
            />
            {errors.body && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>{errors.body}</p>}
          </div>

          {/* University Tags */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", fontFamily: "var(--font-display)" }}>
              Target Universities *
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {allUniversities.map(uni => {
                const isSelected = form.universityTags.includes(uni.slug);
                return (
                  <button
                    key={uni.slug}
                    onClick={() => toggleUniversity(uni.slug)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      padding: "6px 12px",
                      borderRadius: "99px",
                      border: isSelected ? "1px solid #0D9488" : "1px solid var(--border)",
                      background: isSelected ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
                      color: isSelected ? "#0D9488" : "var(--text-muted)",
                      fontSize: "12px",
                      fontWeight: 600,
                      fontFamily: "var(--font-display)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <MapPin size={12} />
                    {uni.name}
                  </button>
                );
              })}
            </div>
            {errors.universityTags && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>{errors.universityTags}</p>}
          </div>

          {/* Pin Post */}
          {canPin && (
            <div style={{
              padding: "16px",
              background: "var(--surface)",
              borderRadius: "8px",
              border: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: form.isPinned ? "12px" : "0" }}>
                <Pin size={16} color="#0D9488" />
                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 2px", fontSize: "14px", fontWeight: 600, color: "var(--text)", fontFamily: "var(--font-display)" }}>
                    Pin this post
                  </p>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-muted)" }}>
                    Pinned posts appear at the top of the feed
                  </p>
                </div>
                <button
                  onClick={() => setForm(prev => ({ ...prev, isPinned: !prev.isPinned }))}
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "99px",
                    border: "none",
                    background: form.isPinned ? "#0D9488" : "var(--border)",
                    cursor: "pointer",
                    position: "relative",
                    transition: "background 0.2s",
                  }}
                >
                  <div style={{
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: "white",
                    position: "absolute",
                    top: "2px",
                    left: form.isPinned ? "22px" : "2px",
                    transition: "left 0.2s",
                  }} />
                </button>
              </div>

              {form.isPinned && (
                <div style={{ marginTop: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>
                    Pin expires at *
                  </label>
                  <input
                    type="datetime-local"
                    value={form.pinExpiresAt}
                    onChange={(e) => setForm(prev => ({ ...prev, pinExpiresAt: e.target.value }))}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: errors.pinExpiresAt ? "1px solid #EF4444" : "1px solid var(--border)",
                      background: "var(--surface)",
                      color: "var(--text)",
                      fontSize: "13px",
                      outline: "none",
                    }}
                  />
                  {errors.pinExpiresAt && <p style={{ color: "#EF4444", fontSize: "12px", margin: "4px 0 0" }}>{errors.pinExpiresAt}</p>}
                </div>
              )}
            </div>
          )}

          {/* Submit Error */}
          {errors.submit && (
            <div style={{
              padding: "12px 16px",
              background: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "8px",
              color: "#EF4444",
              fontSize: "13px",
            }}>
              {errors.submit}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
            <button
              onClick={() => navigate(`/news/${id}`)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
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
              onClick={() => handleSubmit("draft")}
              disabled={saving}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface)",
                color: "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "14px",
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
              Save as Draft
            </button>

            {canPublish && (
              <button
                onClick={() => handleSubmit("published")}
                disabled={saving}
                style={{
                  padding: "10px 24px",
                  borderRadius: "8px",
                  border: "none",
                  background: "var(--gradient)",
                  color: "white",
                  fontFamily: "var(--font-display)",
                  fontWeight: 700,
                  fontSize: "14px",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {saving && <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />}
                Update & Publish
              </button>
            )}
          </div>

          {!canPublish && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "right", margin: 0 }}>
              Your changes will be saved as a draft for admin review.
            </p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </AppShell>
  );
}
