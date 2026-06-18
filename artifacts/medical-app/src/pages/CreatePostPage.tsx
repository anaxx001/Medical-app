import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
  Image,
  Link,
  Send,
  X,
  Plus,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MAX_CHARS = 2000;
const SUGGESTED_TAGS = [
  "Research", "Study Tips", "Mental Health", "Clinical", "Anatomy",
  "Pharmacology", "Pathology", "Exam Prep", "Career", "Wellness",
];

export default function CreatePostPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastColor, setToastColor] = useState<"success" | "warning" | "danger">("success");
  const [images, setImages] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHARS;

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    if (customTag.trim() && !tags.includes(customTag.trim()) && tags.length < 5) {
      setTags([...tags, customTag.trim()]);
      setCustomTag("");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setToastMessage("Please log in to upload images");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToastMessage("Image must be under 5MB");
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from("post-images")
      .upload(fileName, file);

    if (error) {
      setToastMessage("Failed to upload image");
      setToastColor("danger");
      setShowToast(true);
      setIsLoading(false);
      return;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(fileName);
    setImages([...images, data.publicUrl]);
    setIsLoading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    if (isOverLimit) {
      setToastMessage(`Content exceeds ${MAX_CHARS} character limit`);
      setToastColor("warning");
      setShowToast(true);
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.from("posts").insert({
      author_id: user.id,
      title: title.trim() || null,
      content: content.trim(),
      tags,
      images,
      link_url: linkUrl || null,
      post_type: "general",
    });

    setIsLoading(false);

    if (error) {
      setToastMessage("Failed to create post. Try again.");
      setToastColor("danger");
      setShowToast(true);
      return;
    }

    setToastMessage("Post published successfully!");
    setToastColor("success");
    setShowToast(true);

    // Reset form
    setContent("");
    setTitle("");
    setTags([]);
    setImages([]);
    setLinkUrl("");

    // Navigate back after short delay
    setTimeout(() => {
      navigate("/feed");
    }, 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", paddingBottom: "80px" }}>
      {/* Header */}
      <header style={{
        height: "64px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/feed")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              color: "var(--text)",
              borderRadius: "8px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ArrowLeft size={22} />
          </button>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "18px",
            color: "var(--text)",
            margin: 0,
          }}>
            Create Post
          </h1>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isLoading || isOverLimit}
          style={{
            padding: "8px 20px",
            borderRadius: "10px",
            background: !content.trim() || isLoading || isOverLimit ? "var(--border)" : "var(--gradient)",
            color: !content.trim() || isLoading || isOverLimit ? "var(--text-muted)" : "white",
            border: "none",
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "14px",
            cursor: !content.trim() || isLoading || isOverLimit ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "opacity 0.2s",
          }}
        >
          {isLoading ? (
            <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Send size={16} />
          )}
          Post
        </button>
      </header>

      {/* Content */}
      <div style={{ padding: "16px", maxWidth: "720px", margin: "0 auto" }}>
        {/* Title (optional) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "16px",
              fontFamily: "var(--font-display)",
              fontWeight: 600,
              outline: "none",
              marginBottom: "12px",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#0D9488"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          style={{ position: "relative" }}
        >
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What\'s on your mind? Share research insights, study tips, or ask the community..."
            rows={6}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: "14px",
              fontFamily: "var(--font-body)",
              lineHeight: 1.6,
              resize: "vertical",
              outline: "none",
              marginBottom: "12px",
              transition: "border-color 0.2s",
              boxSizing: "border-box",
            }}
            onFocus={(e) => { e.target.style.borderColor = "#0D9488"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
          <div style={{
            position: "absolute",
            bottom: "20px",
            right: "12px",
            fontSize: "12px",
            color: isOverLimit ? "#EF4444" : "var(--text-muted)",
            fontWeight: isOverLimit ? 600 : 400,
          }}>
            {charCount}/{MAX_CHARS}
          </div>
        </motion.div>

        {/* Character limit warning */}
        <AnimatePresence>
          {isOverLimit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#EF4444",
                fontSize: "13px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <AlertCircle size={16} />
              <span>Content is {charCount - MAX_CHARS} characters over the limit</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Link Input */}
        <AnimatePresence>
          {showLinkInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
                overflow: "hidden",
              }}
            >
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Paste URL here..."
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <button
                onClick={() => setShowLinkInput(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  color: "var(--text-muted)",
                  borderRadius: "8px",
                }}
              >
                <X size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image Previews */}
        <AnimatePresence>
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex",
                gap: "8px",
                overflowX: "auto",
                paddingBottom: "8px",
                marginBottom: "12px",
              }}
            >
              {images.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  style={{ position: "relative", flexShrink: 0 }}
                >
                  <img
                    src={img}
                    alt="Upload preview"
                    style={{
                      width: "96px",
                      height: "96px",
                      objectFit: "cover",
                      borderRadius: "12px",
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: "-4px",
                      right: "-4px",
                      width: "20px",
                      height: "20px",
                      background: "#EF4444",
                      color: "white",
                      border: "none",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ marginBottom: "16px" }}
        >
          <p style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: "8px",
            fontFamily: "var(--font-display)",
          }}>
            Tags {tags.length > 0 && <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>({tags.length}/5)</span>}
          </p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginBottom: "8px",
          }}>
            {SUGGESTED_TAGS.map((tag) => (
              <motion.button
                key={tag}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "99px",
                  border: tags.includes(tag) ? "1px solid #0D9488" : "1px solid var(--border)",
                  background: tags.includes(tag) ? "rgba(13, 148, 136, 0.1)" : "var(--surface)",
                  color: tags.includes(tag) ? "#0D9488" : "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: 600,
                  fontFamily: "var(--font-display)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tag}
              </motion.button>
            ))}
          </div>
          {tags.length < 5 && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag..."
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "99px",
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontSize: "13px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
                onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              />
              <button
                onClick={addCustomTag}
                disabled={!customTag.trim()}
                style={{
                  padding: "8px",
                  borderRadius: "50%",
                  background: !customTag.trim() ? "var(--border)" : "var(--gradient)",
                  color: !customTag.trim() ? "var(--text-muted)" : "white",
                  border: "none",
                  cursor: !customTag.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            paddingTop: "8px",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleImageUpload}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            disabled={images.length >= 4 || isLoading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: images.length >= 4 || isLoading ? "not-allowed" : "pointer",
              opacity: images.length >= 4 || isLoading ? 0.5 : 1,
              fontFamily: "var(--font-display)",
            }}
          >
            <Image size={16} />
            <span>Image {images.length > 0 && `(${images.length}/4)`}</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowLinkInput(!showLinkInput)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "10px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-display)",
            }}
          >
            <Link size={16} />
            <span>Link</span>
          </motion.button>
        </motion.div>

        {/* Post Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "rgba(13, 148, 136, 0.06)",
            borderRadius: "12px",
            padding: "16px",
            marginTop: "24px",
            border: "1px solid rgba(13, 148, 136, 0.15)",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <Sparkles size={16} color="#0D9488" style={{ marginTop: "2px", flexShrink: 0 }} />
            <div>
              <p style={{
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--text)",
                margin: "0 0 6px 0",
                fontFamily: "var(--font-display)",
              }}>
                Post Tips
              </p>
              <ul style={{
                margin: 0,
                paddingLeft: "16px",
                fontSize: "12px",
                color: "var(--text-muted)",
                lineHeight: 1.7,
              }}>
                <li>Share original research insights or study strategies</li>
                <li>Tag your post so others can find it easily</li>
                <li>Keep it respectful and supportive</li>
                <li>Add images to make your post more engaging</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: toastColor === "success" ? "#10B981" : toastColor === "warning" ? "#F59E0B" : "#EF4444",
              color: "white",
              padding: "12px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            {toastColor === "success" ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
