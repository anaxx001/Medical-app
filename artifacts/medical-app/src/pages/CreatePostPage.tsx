import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import { X, Paperclip, ChevronUp, ChevronDown, Image, Link as LinkIcon, List } from "lucide-react";

interface Community {
  name: string;
  slug: string;
  icon: string;
}

export default function CreatePostPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [showCommunityPicker, setShowCommunityPicker] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setUserId(user.id);

      // Fetch only communities the user has joined
      const { data } = await supabase
        .from("community_members")
        .select("community:communities(name, slug, icon)")
        .eq("user_id", user.id);

      if (data) {
        const list = data
          .map((d: any) => d.community)
          .filter(Boolean) as Community[];
        setCommunities(list);
      }
    }
    load();
  }, []);

  async function handleSubmit() {
    if (!title.trim()) { setError("Please add a title."); return; }
    if (!selectedCommunity) { setError("Please select a community."); return; }
    if (!userId) { navigate("/login"); return; }
    setLoading(true);
    setError("");

    try {
      const { data: community } = await supabase
        .from("communities")
        .select("id")
        .eq("slug", selectedCommunity.slug)
        .single();
      if (!community) throw new Error("Community not found.");

      let file_url = null;
      let file_type = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `posts/${userId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("materials")
          .upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("materials")
          .getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_type = ext === "pdf" ? "pdf" : "image";
      }

      const { error: insertError } = await supabase.from("posts").insert({
        community_id: community.id,
        author_id: userId,
        title: title.trim(),
        content: content.trim() || null,
        file_url,
        file_type,
      });
      if (insertError) throw insertError;

      navigate(`/c/${selectedCommunity.slug}`);
    } catch (err: any) {
      setError(err.message || "Failed to post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "var(--bg)",
      zIndex: 100,
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--font-body)",
    }}>

      {/* Top bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
      }}>
        {/* X button */}
        <button
          onClick={() => navigate("/")}
          style={{
            width: "36px", height: "36px",
            borderRadius: "50%",
            border: "1px solid var(--border)",
            background: "transparent",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          <X size={18} />
        </button>

        {/* Community selector pill */}
        <button
          onClick={() => setShowCommunityPicker(!showCommunityPicker)}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "8px 16px",
            borderRadius: "99px",
            border: "1px solid var(--border)",
            background: "transparent",
            color: "var(--text)",
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            minWidth: "160px",
            justifyContent: "center",
          }}
        >
          {selectedCommunity
            ? <>{selectedCommunity.icon} {selectedCommunity.name}</>
            : "Select a community"
          }
          {showCommunityPicker ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* Post button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !selectedCommunity}
          style={{
            padding: "8px 18px",
            borderRadius: "99px",
            border: "none",
            background: title.trim() && selectedCommunity ? "var(--gradient)" : "var(--border)",
            color: title.trim() && selectedCommunity ? "white" : "var(--text-muted)",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: title.trim() && selectedCommunity ? "pointer" : "not-allowed",
            opacity: loading ? 0.7 : 1,
            transition: "all 0.2s",
          }}
        >
          {loading ? "Posting..." : "Post"}
        </button>
      </div>

      {/* Community dropdown */}
      {showCommunityPicker && (
        <div style={{
          position: "absolute",
          top: "62px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "280px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          boxShadow: "var(--shadow-md)",
          zIndex: 200,
          maxHeight: "320px",
          overflowY: "auto",
        }}>
          {communities.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
              You haven't joined any communities yet.
            </div>
          ) : (
            communities.map((c) => (
              <button
                key={c.slug}
                onClick={() => { setSelectedCommunity(c); setShowCommunityPicker(false); }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px 16px",
                  background: selectedCommunity?.slug === c.slug ? "rgba(13,148,136,0.08)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                  fontWeight: selectedCommunity?.slug === c.slug ? 700 : 500,
                  fontSize: "14px",
                  textAlign: "left",
                }}
              >
                <span style={{ fontSize: "18px" }}>{c.icon}</span>
                {c.name}
              </button>
            ))
          )}
        </div>
      )}

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px" }}>

        {/* Title input */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "22px",
            color: "var(--text)",
            marginBottom: "16px",
            boxSizing: "border-box",
          }}
        />

        {/* Body text */}
        <textarea
          placeholder="body text (optional)"
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            width: "100%",
            minHeight: "200px",
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: "var(--font-body)",
            fontSize: "15px",
            color: "var(--text)",
            resize: "none",
            lineHeight: "1.6",
            boxSizing: "border-box",
          }}
        />

        {/* Attached file preview */}
        {file && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 14px",
            background: "var(--surface)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            marginTop: "12px",
          }}>
            <Paperclip size={14} color="#0D9488" />
            <span style={{ fontSize: "13px", color: "var(--text)", flex: 1 }}>{file.name}</span>
            <button
              onClick={() => setFile(null)}
              style={{ background: "none", border: "none", color: "#E8445A", cursor: "pointer", padding: 0 }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <p style={{
            fontSize: "13px", color: "#E8445A",
            background: "#FFF0F2", padding: "10px",
            borderRadius: "var(--radius-sm)", marginTop: "14px",
          }}>
            {error}
          </p>
        )}
      </div>

      {/* Bottom toolbar */}
      <div style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "10px 16px 24px 16px",
        display: "flex",
        alignItems: "center",
        gap: "20px",
      }}>
        {/* Image/file upload */}
        <label style={{ cursor: "pointer", color: "var(--text-muted)", display: "flex" }}>
          <Image size={22} />
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={e => setFile(e.target.files?.[0] || null)}
            style={{ display: "none" }}
          />
        </label>

        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
          <LinkIcon size={22} />
        </button>

        <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
          <List size={22} />
        </button>
      </div>
    </div>
  );
}