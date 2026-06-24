import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Send, Image as ImageIcon, Link as LinkIcon, BarChart2, Hash, HeartPulse } from "lucide-react";

export default function CommunityCreatePostPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const [, setLocation] = useLocation();

  const [community, setCommunity] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [postType, setPostType] = useState<"discussion" | "question" | "resource" | "support">("discussion");
  const [loading, setLoading] = useState(false);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user);

      const { data } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", params.slug)
        .single();
      
      setCommunity(data);
      setIsFetchingCommunity(false);
    };
    init();
  }, [params.slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !community || !user) return;

    setLoading(true);

    try {
      await supabase.from("posts").insert({
        title,
        content,
        is_anonymous: isAnonymous,
        category: postType,
        community_id: community.id,
        author_id: user.id
      });

      setLocation(`/c/${params.slug}`);
    } catch {
      setLocation(`/c/${params.slug}`);
    } finally {
      setLoading(false);
    }
  };

  if (isFetchingCommunity) return <div style={{ padding: "20px", textAlign: "center" }}>Loading...</div>;
  if (!community) return <div style={{ padding: "20px" }}>Community not found.</div>;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href={`/c/${params.slug}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to {community.name}
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Create Post</h1>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Post to <strong>{community.name}</strong></p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <input 
              type="text" 
              placeholder="Give your post a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", outline: "none", boxSizing: "border-box", fontSize: "16px", fontWeight: 600 }}
            />
          </div>

          <div>
            <textarea 
              rows={8}
              placeholder="What do you want to share?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box", fontSize: "15px" }}
            />
          </div>

          {/* Social Tools Toolbar */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", padding: "12px", background: "var(--bg)", borderRadius: "12px", border: "1px solid var(--border)" }}>
             <button type="button" style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "var(--text)", fontWeight: 500, fontSize: "13px", padding: "6px 10px", borderRadius: "8px" }} className="hover:bg-teal-500/10 hover:text-teal-600">
                <ImageIcon size={16} /> Image
             </button>
             <button type="button" style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "var(--text)", fontWeight: 500, fontSize: "13px", padding: "6px 10px", borderRadius: "8px" }} className="hover:bg-teal-500/10 hover:text-teal-600">
                <LinkIcon size={16} /> Link
             </button>
             <button type="button" style={{ background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "var(--text)", fontWeight: 500, fontSize: "13px", padding: "6px 10px", borderRadius: "8px" }} className="hover:bg-teal-500/10 hover:text-teal-600">
                <BarChart2 size={16} /> Poll
             </button>
          </div>

          {/* Post Type tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", marginRight: "4px" }}>Tag:</span>
              {[
                  { id: "discussion", label: "Discussion", icon: Hash },
                  { id: "question", label: "Question", icon: Hash },
                  { id: "resource", label: "Resource Share", icon: Hash },
                  { id: "support", label: "Vent / Support", icon: HeartPulse }
              ].map(pt => (
                  <button 
                    key={pt.id} 
                    type="button"
                    onClick={() => setPostType(pt.id as any)}
                    style={{ 
                        display: "flex", alignItems: "center", gap: "4px",
                        padding: "6px 12px", borderRadius: "16px", border: "1px solid var(--border)",
                        background: postType === pt.id ? "var(--text)" : "transparent",
                        color: postType === pt.id ? "var(--bg)" : "var(--text-muted)",
                        fontSize: "12px", fontWeight: 600, cursor: "pointer"
                    }}
                  >
                      <pt.icon size={12} /> {pt.label}
                  </button>
              ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input 
              type="checkbox"
              id="anonymous-checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ width: "16px", height: "16px", cursor: "pointer" }}
            />
            <label htmlFor="anonymous-checkbox" style={{ fontSize: "13px", cursor: "pointer", fontWeight: 500, color: "var(--text-muted)" }}>
              Post Anonymously (Useful for mental health or sensitive topics)
            </label>
          </div>

          <button 
            type="submit"
            disabled={loading || !title || !content}
            style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "var(--text)", color: "var(--bg)", fontWeight: 700, fontSize: "15px", cursor: loading || !title || !content ? "not-allowed" : "pointer", opacity: loading || !title || !content ? 0.6 : 1, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
          >
            {loading ? "Publishing..." : <>Publish Post <Send size={16} /></>}
          </button>
        </form>
      </div>

    </div>
  );
}
