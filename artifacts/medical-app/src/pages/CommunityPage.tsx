import { useState, useEffect } from "react";
import { Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { 
    ArrowLeft, Users, MessageSquare, BookOpen, ShieldCheck, 
    Calendar, FileText, LayoutGrid, Plus, MoreHorizontal, 
    Settings, ArrowBigUp, ArrowBigDown, Edit2, Trash2, 
    AlertTriangle, X, Send, MoreVertical
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CommunityPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const [community, setCommunity] = useState<any>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("feed");
  const [isJoined, setIsJoined] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [posts, setPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const [editingPost, setEditingPost] = useState<any>(null);
  const [reportingPost, setReportingPost] = useState<any>(null);
  const [reportReason, setReportReason] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user);
      
      let currentUserRole = "user";
      if (userData?.user) {
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", userData.user.id).single();
          if (profile) {
              currentUserRole = profile.role;
              setUserRole(profile.role);
          }
      }
      
      const { data: commData } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", params.slug)
        .single();
        
      if (commData) {
        setCommunity(commData);
        // Get real member count
        const { count } = await supabase
          .from("community_members")
          .select("*", { count: "exact" })
          .eq("community_id", commData.id);
        setMemberCount(count || 0);

        if (userData?.user) {
            const { data: memberData } = await supabase
              .from("community_members")
              .select("*")
              .eq("community_id", commData.id)
              .eq("user_id", userData.user.id)
              .maybeSingle();
            if (memberData) setIsJoined(true);
        }

        const { data: postData } = await supabase
          .from("posts")
          .select("*, profiles(username, avatar_url)")
          .eq("community_id", commData.id)
          .order("created_at", { ascending: false });
        
        setPosts(postData || []);
        
        const { data: memberList } = await supabase
          .from("community_members")
          .select("*, profiles(username, avatar_url, role, full_name)")
          .eq("community_id", commData.id);
        
        setMembers(memberList || []);
      }
      setLoading(false);
    };
    fetchCommunityData();
  }, [params.slug]);

  const toggleJoin = async () => {
    if (!user || !community) return;
    
    if (isJoined) {
        await supabase
          .from("community_members")
          .delete()
          .eq("community_id", community.id)
          .eq("user_id", user.id);
        setIsJoined(false);
        setMemberCount(prev => Math.max(0, prev - 1));
        setMembers(prev => prev.filter(m => m.user_id !== user.id));
    } else {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        const newMember = {
            community_id: community.id,
            user_id: user.id,
            role: "member",
            profiles: profile || null
        };
        await supabase
          .from("community_members")
          .insert({
              community_id: community.id,
              user_id: user.id,
              role: "member"
          });
        setIsJoined(true);
        setMemberCount(prev => prev + 1);
        setMembers(prev => [...prev, newMember]);
    }
  };

  const handleCreatePost = async () => {
      if (!newPostContent.trim() || !community || !user) return;
      setIsPosting(true);
      const { data, error } = await supabase.from("posts").insert({
          community_id: community.id,
          author_id: user.id,
          title: newPostContent.substring(0, 50) + (newPostContent.length > 50 ? "..." : ""),
          content: newPostContent,
          votes: 0
      }).select("*, profiles(username, avatar_url)").single();

      if (data && !error) {
          setPosts([data, ...posts]);
          setNewPostContent("");
      } else {
          alert("Failed to post. " + (error?.message || ""));
      }
      setIsPosting(false);
  };

  const handleVote = async (postId: string, voteType: "up" | "down", e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) {
          alert("Please login to vote.");
          return;
      }

      // Optimistic update
      const oldPosts = [...posts];
      const updatedPostsOptimistic = posts.map(p => {
          if (p.id === postId) {
              let newCount = p.vote_count || 0;
              let newUserVote = p.user_vote;
              
              if (p.user_vote === voteType) {
                  // Removing vote
                  newCount -= (voteType === "up" ? 1 : -1);
                  newUserVote = null;
              } else if (p.user_vote) {
                  // Switching vote
                  newCount += (voteType === "up" ? 2 : -2);
                  newUserVote = voteType;
              } else {
                  // New vote
                  newCount += (voteType === "up" ? 1 : -1);
                  newUserVote = voteType;
              }
              return { ...p, vote_count: newCount, user_vote: newUserVote };
          }
          return p;
      });
      setPosts(updatedPostsOptimistic);

      try {
          // Check for existing vote
          const { data: existing } = await supabase
              .from("post_votes")
              .select("*")
              .eq("post_id", postId)
              .eq("user_id", user.id)
              .maybeSingle();
          
          if (existing) {
              if (existing.vote_type === voteType) {
                  // Remove vote
                  await supabase.from("post_votes").delete().eq("id", existing.id);
              } else {
                  // Update vote
                  await supabase.from("post_votes").update({ vote_type: voteType }).eq("id", existing.id);
              }
          } else {
              // New vote
              await supabase.from("post_votes").insert({
                  post_id: postId,
                  user_id: user.id,
                  vote_type: voteType
              });
          }
      } catch (err) {
          console.error("Vote failed", err);
          setPosts(oldPosts); // Rollback
      }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm("Are you sure you want to delete this post?")) {
          const { error } = await supabase.from("posts").delete().eq("id", postId);
          if (!error) {
              setPosts(posts.filter(p => p.id !== postId));
              setOpenMenuId(null);
          }
      }
  };

  const handleEditPost = async () => {
      if (!editingPost || !editingPost.content.trim()) return;
      const { error } = await supabase
          .from("posts")
          .update({ content: editingPost.content, title: editingPost.content.substring(0, 50) })
          .eq("id", editingPost.id);
      
      if (!error) {
          setPosts(posts.map(p => p.id === editingPost.id ? { ...p, content: editingPost.content, title: editingPost.content.substring(0, 50) } : p));
          setEditingPost(null);
      }
  };

  const handleReportPost = async () => {
      if (!reportingPost || !reportReason.trim()) return;
      const { error } = await supabase.from("report_posts").insert({
          post_id: reportingPost.id,
          reporter_id: user?.id,
          community_id: community.id,
          reason: reportReason,
          status: "pending"
      });
      
      if (!error) {
          alert("Post reported successfully. Community moderators will review it.");
          setReportingPost(null);
          setReportReason("");
      }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading community...</div>;
  if (!community) return <div style={{ padding: "20px" }}>Community not found.</div>;

  const isSuperAdmin = userRole === "super_admin" || userRole === "app_admin" || userRole === "admin";
  const isDefaultOrOfficial = !community.creator_id || community.creator_id === "student-obi-id";
  
  const isAdmin = user && (
    community.creator_id === user.id || 
    (isSuperAdmin && isDefaultOrOfficial)
  );

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "24px 16px 80px" }}>
        <Link href="/communities/discover" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", marginBottom: "20px" }}>
          <ArrowLeft size={16} /> Back
        </Link>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden", marginBottom: "24px" }}>
        {/* Banner */}
        <div style={{ height: "120px", background: community.banner_url ? `url(${community.banner_url}) center/cover no-repeat` : "linear-gradient(135deg, #0f766e 0%, #064e3b 100%)", position: "relative" }}>
        </div>
        
        <div style={{ padding: "0 28px 28px", position: "relative" }}>
            {/* Avatar */}
            <img 
               src={community.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${community.name}&backgroundColor=0d9488`} 
               alt={community.name}
               style={{ width: "80px", height: "80px", borderRadius: "20px", border: "4px solid var(--surface)", marginTop: "-40px", background: "white", objectFit: "cover" }} 
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: "12px" }}>
                <div>
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "0 0 8px" }}>
                    {community.name}
                    </h1>
                    <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5, maxWidth: "600px" }}>
                    {community.description}
                    </p>
                    <div style={{marginTop: "16px", color: "var(--text-muted)", fontSize: "13px", display: "flex", gap: "16px"}}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px"}}><Users size={14} /> {memberCount} verified members</span>
                        {community.category && <span style={{ display: "flex", alignItems: "center", gap: "4px"}}><LayoutGrid size={14} /> {community.category}</span>}
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {isAdmin && (
                        <Link href={`/c/${community.slug}/manage`} style={{ textDecoration: "none" }}>
                            <button style={{ background: "transparent", border: "1px dashed var(--border)", color: "var(--text)", padding: "8px 16px", borderRadius: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: 600, fontSize: "14px" }}>
                                <Settings size={16} /> Manage
                            </button>
                        </Link>
                    )}
                    <button 
                        onClick={toggleJoin}
                        style={{ 
                            background: isJoined ? "transparent" : "var(--text)", 
                            color: isJoined ? "var(--text)" : "var(--bg)",
                            border: isJoined ? "1px solid var(--border)" : "none", 
                            padding: "8px 20px", 
                            borderRadius: "10px", 
                            cursor: "pointer", 
                            fontWeight: 600,
                            fontSize: "14px",
                            transition: "all 0.2s"
                        }}
                    >
                        {isJoined ? "Joined" : "Join"}
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", borderBottom: "1px solid var(--border)", marginBottom: "24px", overflowX: "auto" }}>
        {[
            { id: "feed", icon: MessageSquare, label: "Feed" },
            { id: "materials", icon: FileText, label: "Materials" },
            { id: "flashcards", icon: LayoutGrid, label: "Flashcards" },
            { id: "members", icon: Users, label: "Members" },
            { id: "events", icon: Calendar, label: "Events" }
        ].map(tab => (
            <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                    padding: "12px 4px",
                    border: "none",
                    background: "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: activeTab === tab.id ? "var(--text)" : "var(--text-muted)",
                    fontWeight: activeTab === tab.id ? 700 : 500,
                    cursor: "pointer",
                    borderBottom: activeTab === tab.id ? "2px solid #0D9488" : "none",
                    whiteSpace: "nowrap"
                }}
            >
                <tab.icon size={16} /> {tab.label}
            </button>
        ))}
      </div>
      
      <div style={{ minHeight: "200px" }}>
        {activeTab === "feed" && (
            <div>
                {isJoined && (
                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", marginBottom: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            👤
                        </div>
                        <input 
                           type="text" 
                           placeholder="Create a post in this community..."
                           value={newPostContent}
                           onChange={(e) => setNewPostContent(e.target.value)}
                           onKeyDown={(e) => e.key === "Enter" && handleCreatePost()}
                           style={{ flex: 1, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "20px", padding: "10px 16px", fontSize: "14px", color: "var(--text)", outline: "none" }}
                        />
                        <button onClick={handleCreatePost} disabled={isPosting || !newPostContent.trim()} style={{ background: "var(--text)", color: "var(--bg)", border: "none", padding: "8px 16px", borderRadius: "16px", fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", cursor: (isPosting || !newPostContent.trim()) ? "not-allowed" : "pointer", opacity: (isPosting || !newPostContent.trim()) ? 0.6 : 1 }}>
                            <Plus size={16} /> {isPosting ? "Posting..." : "Post"}
                        </button>
                        <Link href={`/c/${community.slug}/create`} style={{ textDecoration: "none" }}>
                            <button style={{ background: "transparent", color: "var(--text)", border: "1px dashed var(--border)", padding: "8px 16px", borderRadius: "16px", fontWeight: 600, display: "flex", alignItems: "center", cursor: "pointer", whiteSpace: "nowrap" }}>
                                Full Editor
                            </button>
                        </Link>
                    </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {posts.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px", background: "var(--surface)", borderRadius: "16px", border: "1px dashed var(--border)"}}>
                            <p style={{ color: "var(--text-muted)" }}>No posts yet in this community.</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} style={{ position: "relative" }}>
                                <Link href={`/post/${post.id}`} style={{ textDecoration: "none" }}>
                                    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "transform 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}>
                                        <div style={{ display: "flex", gap: "16px" }}>
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "var(--bg)", padding: "8px 4px", borderRadius: "10px", minWidth: "40px", height: "fit-content", border: "1px solid var(--border)" }}>
                                                <button 
                                                    onClick={(e) => handleVote(post.id, "up", e)}
                                                    style={{ background: "transparent", border: "none", padding: "4px", borderRadius: "6px", cursor: "pointer", color: post.user_vote === "up" ? "var(--accent)" : "var(--text-muted)", transition: "all 0.2s" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(13, 148, 136, 0.1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <ArrowBigUp size={24} fill={post.user_vote === "up" ? "currentColor" : "none"} />
                                                </button>
                                                <span style={{ fontSize: "14px", fontWeight: 800, color: post.user_vote ? "var(--accent)" : "var(--text)" }}>{post.vote_count || 0}</span>
                                                <button 
                                                    onClick={(e) => handleVote(post.id, "down", e)}
                                                    style={{ background: "transparent", border: "none", padding: "4px", borderRadius: "6px", cursor: "pointer", color: post.user_vote === "down" ? "#EF4444" : "var(--text-muted)", transition: "all 0.2s" }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)"}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                                >
                                                    <ArrowBigDown size={24} fill={post.user_vote === "down" ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                        <img 
                                                            src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${post.profiles?.username || "user"}`}
                                                            alt=""
                                                            style={{ width: "24px", height: "24px", borderRadius: "50%", background: "var(--bg)" }}
                                                        />
                                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>{post.profiles?.username || "Unknown"}</span>
                                                        <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>• {new Date(post.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    
                                                    <div style={{ position: "relative" }}>
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === post.id ? null : post.id); }}
                                                            style={{ background: "transparent", border: "none", padding: "4px", borderRadius: "50%", cursor: "pointer", color: "var(--text-muted)" }}
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        
                                                        {openMenuId === post.id && (
                                                            <div style={{ position: "absolute", top: "100%", right: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "8px", zIndex: 10, width: "160px", boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)" }}>
                                                                {user?.id === post.author_id ? (
                                                                    <>
                                                                        <button 
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingPost(post); setOpenMenuId(null); }}
                                                                            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px", border: "none", background: "transparent", borderRadius: "8px", color: "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                                                                        >
                                                                            <Edit2 size={14} /> Edit Post
                                                                        </button>
                                                                        <button 
                                                                            onClick={(e) => handleDeletePost(post.id, e)}
                                                                            style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px", border: "none", background: "transparent", borderRadius: "8px", color: "#EF4444", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                                                                        >
                                                                            <Trash2 size={14} /> Delete Post
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button 
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setReportingPost(post); setOpenMenuId(null); }}
                                                                        style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "8px", border: "none", background: "transparent", borderRadius: "8px", color: "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                                                                    >
                                                                        <AlertTriangle size={14} /> Report Post
                                                                    </button>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <h3 style={{ margin: "0 0 8px", fontSize: "17px", fontWeight: 800, color: "var(--text)", lineHeight: 1.3 }}>{post.title}</h3>
                                                <p style={{ margin: 0, fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{post.content}</p>
                                                
                                                <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>
                                                        <MessageSquare size={14} />
                                                        {post.comments_count || 0} comments
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}
        {activeTab === "materials" && <p style={{color: "var(--text-muted)", textAlign: "center"}}>Resource library coming soon.</p>}
        {activeTab === "flashcards" && <p style={{color: "var(--text-muted)", textAlign: "center"}}>Flashcard decks coming soon.</p>}
        {activeTab === "members" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
                {members.length === 0 ? (
                    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No members found.</div>
                ) : (
                    members.map(member => {
                        const mRole = member.role || "member";
                        const isCreator = member.user_id === community.creator_id;
                        const effectiveRole = isCreator ? "admin" : mRole;
                        const displayRole = effectiveRole === "admin" ? "Community Admin" : (effectiveRole === "moderator" ? "Community Moderator" : "Student");
                        const badgeColor = effectiveRole === "admin" ? "var(--accent)" : (effectiveRole === "moderator" ? "#2D87C8" : "var(--text-muted)");
                        const badgeBg = effectiveRole === "admin" ? "rgba(13, 148, 136, 0.1)" : (effectiveRole === "moderator" ? "#EBF5FF" : "var(--surface-muted)");

                        return (
                            <Link key={member.user_id} href={`/profile/${member.profiles?.username || member.user_id}`} style={{ textDecoration: "none" }}>
                                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", padding: "16px", display: "flex", alignItems: "center", gap: "16px", cursor: "pointer", transition: "all 0.2s" }} className="hover:border-teal-500">
                                    <img 
                                        src={member.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${member.profiles?.username || "user"}`}
                                        alt={member.profiles?.username || "User"}
                                        style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--bg)", border: "1px solid var(--border)", objectFit: "cover" }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text)", display: "flex", alignItems: "center", gap: "6px" }}>
                                            {member.profiles?.username || member.profiles?.full_name || "Unknown User"}
                                            {effectiveRole === "admin" && <ShieldCheck size={14} style={{ color: "var(--accent)" }} />}
                                        </div>
                                        <div style={{ 
                                            display: "inline-block", 
                                            fontSize: "11px", 
                                            fontWeight: 700, 
                                            textTransform: "uppercase", 
                                            padding: "2px 6px", 
                                            borderRadius: "6px", 
                                            background: badgeBg,
                                            color: badgeColor,
                                            marginTop: "6px"
                                        }}>
                                            {displayRole}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })
                )}
            </div>
        )}
        {activeTab === "events" && <p style={{color: "var(--text-muted)", textAlign: "center"}}>Events calendar coming soon.</p>}
      </div>

      <AnimatePresence>
          {editingPost && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
              >
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column" }}
                  >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", flexShrink: 0 }}>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Edit Post</h3>
                          <button onClick={() => setEditingPost(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                              <X size={20} />
                          </button>
                      </div>
                      <div style={{ flex: 1, minHeight: 0 }}>
                        <textarea 
                            value={editingPost.content}
                            onChange={(e) => setEditingPost({ ...editingPost, content: e.target.value })}
                            style={{ width: "100%", padding: "16px", borderRadius: "12px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", minHeight: "200px", outline: "none", fontSize: "14px", lineHeight: 1.6, boxSizing: "border-box" }}
                        />
                      </div>
                      <div style={{ marginTop: "24px", flexShrink: 0 }}>
                        <button 
                            onClick={handleEditPost}
                            style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "none", background: "var(--accent)", color: "white", fontWeight: 700, cursor: "pointer", fontSize: "15px", boxShadow: "0 4px 12px rgba(13, 148, 136, 0.2)" }}
                        >
                            Save Changes
                        </button>
                        <button 
                            onClick={() => setEditingPost(null)}
                            style={{ width: "100%", marginTop: "10px", padding: "10px", borderRadius: "12px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontWeight: 600, cursor: "pointer", fontSize: "14px" }}
                        >
                            Cancel
                        </button>
                      </div>
                  </motion.div>
              </motion.div>
          )}

          {reportingPost && (
              <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
              >
                  <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "24px", padding: "24px", width: "100%", maxWidth: "450px" }}
                  >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                          <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800 }}>Report Content</h3>
                          <button onClick={() => setReportingPost(null)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-muted)" }}>
                              <X size={20} />
                          </button>
                      </div>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Tell us why this post should be reviewed by moderators.</p>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                          {["Harassment", "Spam", "Misinformation", "Inappropriate content", "Other"].map(reason => (
                              <button 
                                  key={reason}
                                  onClick={() => setReportReason(reason)}
                                  style={{ padding: "10px", borderRadius: "8px", border: reportReason === reason ? "1px solid var(--accent)" : "1px solid var(--border)", background: reportReason === reason ? "rgba(13, 148, 136, 0.1)" : "transparent", color: reportReason === reason ? "var(--accent)" : "var(--text)", fontSize: "13px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}
                              >
                                  {reason}
                              </button>
                          ))}
                      </div>

                      <button 
                          onClick={handleReportPost}
                          disabled={!reportReason}
                          style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "none", background: "rgb(239, 68, 68)", color: "white", fontWeight: 700, cursor: !reportReason ? "not-allowed" : "pointer", opacity: !reportReason ? 0.6 : 1 }}
                      >
                          Submit Report
                      </button>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
