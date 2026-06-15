import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import {
  Shield,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Trash2,
  UserX,
  UserCheck,
  Crown,
  ArrowLeft,
  Settings,
  Users,
  FileText,
  AlertTriangle,
  Save,
  X,
  Search,
  ChevronDown,
  VolumeX,
  Volume2,
  Ban,
} from "lucide-react";

interface Community {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_locked: boolean;
  is_official: boolean;
  creator_id: string;
  created_by: string;
  member_count: number;
  post_count: number;
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  author_id: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  is_pinned: boolean;
  is_announcement: boolean;
  author?: { username: string; full_name: string | null };
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  user?: { username: string; full_name: string | null; avatar_url?: string; is_muted?: boolean; is_banned?: boolean };
}

interface CommunityModerator {
  id: string;
  user_id: string;
  role: "admin" | "moderator";
  assigned_at: string;
  user?: { username: string; full_name: string | null };
}

export default function CommunityManagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [moderators, setModerators] = useState<CommunityModerator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState("");
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);

  // Tabs
  const [tab, setTab] = useState<"posts" | "members" | "moderators" | "settings">("posts");

  // Filters
  const [searchPosts, setSearchPosts] = useState("");
  const [searchMembers, setSearchMembers] = useState("");

  // Settings form
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer ownership
  const [transferTo, setTransferTo] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true); setError("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setCurrentUserId(user.id);

        // Get user global role
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        const globalRole = profile?.role || "student";
        setCurrentUserRole(globalRole);
        const appAdmin = globalRole === "super_admin" || globalRole === "app_admin" || globalRole === "admin";
        setIsAppAdmin(appAdmin);

        // Get community
        const { data: comm, error: commErr } = await supabase
          .from("communities")
          .select("*")
          .eq("slug", slug)
          .single();
        if (commErr || !comm) { setError("Community not found"); setLoading(false); return; }
        setCommunity(comm);
        setEditName(comm.name);
        setEditDescription(comm.description || "");
        setEditIcon(comm.icon || "🏘️");

        // Check if user is community admin
        const isCreator = comm.creator_id === user.id || comm.created_by === user.id;
        const { data: modCheck } = await supabase
          .from("community_moderators")
          .select("role")
          .eq("community_id", comm.id)
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        const isCommAdmin = isCreator || !!modCheck || appAdmin;
        setIsCommunityAdmin(isCommAdmin);

        if (!isCommAdmin && !appAdmin) {
          setError("You don't have permission to manage this community.");
          setLoading(false);
          return;
        }

        // Load posts
        const { data: postsData } = await supabase
          .from("posts")
          .select(`id, title, content, author_id, upvotes, comment_count, created_at, is_pinned, is_announcement, author:author_id(username, full_name)`)
          .eq("community_id", comm.id)
          .order("created_at", { ascending: false });
        setPosts(postsData || []);

        // Load members
        const { data: membersData } = await supabase
          .from("community_members")
          .select(`id, user_id, role, joined_at, user:user_id(username, full_name, avatar_url, is_muted, is_banned)`)
          .eq("community_id", comm.id)
          .order("joined_at", { ascending: false });
        setMembers(membersData || []);

        // Load community moderators
        const { data: modsData } = await supabase
          .from("community_moderators")
          .select(`id, user_id, role, assigned_at, user:user_id(username, full_name)`)
          .eq("community_id", comm.id)
          .order("assigned_at", { ascending: false });
        setModerators(modsData || []);
      } catch (err: any) {
        console.error("Error loading community manage:", err);
        setError(err.message || "Failed to load community");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug]);

  async function togglePostPin(postId: string, current: boolean) {
    await supabase.from("posts").update({ is_pinned: !current }).eq("id", postId);
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, is_pinned: !current } : p));
  }

  async function removePost(postId: string) {
    if (!confirm("Remove this post from the community? It will be permanently deleted.")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function toggleMemberBan(memberId: string, userId: string, current: boolean) {
    if (!current && !confirm("Ban this member from the community?")) return;
    await supabase.from("community_members").update({ role: current ? "member" : "banned" }).eq("id", memberId);
    setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: current ? "member" : "banned" } : m));
  }

  async function removeMember(memberId: string) {
    if (!confirm("Remove this member from the community?")) return;
    await supabase.from("community_members").delete().eq("id", memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  }

  async function promoteToModerator(userId: string) {
    if (!community) return;
    await supabase.from("community_moderators").upsert({
      community_id: community.id,
      user_id: userId,
      role: "moderator",
      assigned_by: currentUserId,
    }, { onConflict: "community_id,user_id" });
    // Refresh moderators
    const { data } = await supabase.from("community_moderators")
      .select(`id, user_id, role, assigned_at, user:user_id(username, full_name)`)
      .eq("community_id", community.id);
    setModerators(data || []);
  }

  async function demoteModerator(modId: string) {
    if (!confirm("Remove this moderator?")) return;
    await supabase.from("community_moderators").delete().eq("id", modId);
    setModerators((prev) => prev.filter((m) => m.id !== modId));
  }

  async function saveSettings() {
    if (!community) return;
    setSavingSettings(true);
    await supabase.from("communities").update({
      name: editName,
      description: editDescription,
      icon: editIcon,
    }).eq("id", community.id);
    setCommunity({ ...community, name: editName, description: editDescription, icon: editIcon });
    setSavingSettings(false);
  }

  async function toggleCommunityLock() {
    if (!community) return;
    const newLock = !community.is_locked;
    await supabase.from("communities").update({ is_locked: newLock }).eq("id", community.id);
    setCommunity({ ...community, is_locked: newLock });
  }

  async function deleteCommunity() {
    if (!community) return;
    if (!confirm("DELETE this community and ALL its posts? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;
    await supabase.from("posts").delete().eq("community_id", community.id);
    await supabase.from("community_members").delete().eq("community_id", community.id);
    await supabase.from("community_moderators").delete().eq("community_id", community.id);
    await supabase.from("communities").delete().eq("id", community.id);
    navigate("/dashboard");
  }

  async function transferOwnership() {
    if (!community || !transferTo) return;
    if (!confirm(`Transfer ownership to @${transferTo}? You will lose admin access unless you're an app admin.`)) return;

    // Find user by username
    const { data: targetUser } = await supabase.from("profiles").select("id").eq("username", transferTo.replace(/^@/, "")).single();
    if (!targetUser) { alert("User not found"); return; }

    await supabase.from("communities").update({ creator_id: targetUser.id, created_by: targetUser.id }).eq("id", community.id);
    await supabase.from("community_moderators").upsert({
      community_id: community.id,
      user_id: targetUser.id,
      role: "admin",
      assigned_by: currentUserId,
    }, { onConflict: "community_id,user_id" });

    setCommunity({ ...community, creator_id: targetUser.id });
    setShowTransfer(false);
    setTransferTo("");
    alert("Ownership transferred successfully.");
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "3px solid var(--border)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-muted)" }}>Loading community management...</p>
        </div>
      </AppShell>
    );
  }

  if (error || !community) {
    return (
      <AppShell>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{ background: "#FEE2E2", border: "1px solid #FECACA", borderRadius: "12px", padding: "24px", textAlign: "center" }}>
            <AlertTriangle size={40} color="#DC2626" style={{ marginBottom: "12px" }} />
            <h2 style={{ color: "#DC2626", margin: "0 0 8px 0" }}>{error || "Community not found"}</h2>
            <button onClick={() => navigate(`/c/${slug}`)} style={{ padding: "10px 20px", background: "#DC2626", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: 700 }}>
              <ArrowLeft size={16} style={{ verticalAlign: "middle", marginRight: "6px" }} /> Back to Community
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  const cardStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "16px" };
  const tabBtn = (active: boolean, label: string, icon: any) => (
    <button onClick={() => setTab(label.toLowerCase() as any)}
      style={{
        padding: "10px 16px", borderRadius: "var(--radius-sm)", border: active ? "2px solid #1ABC9C" : "1px solid var(--border)",
        background: active ? "rgba(26, 188, 156, 0.1)" : "var(--surface)", color: active ? "#1ABC9C" : "var(--text)",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
      }}>
      {icon} {label}
    </button>
  );

  const filteredPosts = posts.filter((p) =>
    (p.title?.toLowerCase() ?? "").includes(searchPosts.toLowerCase()) ||
    (p.content?.toLowerCase() ?? "").includes(searchPosts.toLowerCase())
  );

  const filteredMembers = members.filter((m) =>
    (m.user?.username?.toLowerCase() ?? "").includes(searchMembers.toLowerCase()) ||
    (m.user?.full_name?.toLowerCase() ?? "").includes(searchMembers.toLowerCase())
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <button onClick={() => navigate(`/c/${slug}`)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "13px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft size={16} /> Back to r/{slug}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "32px" }}>{community.icon}</span>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                {community.name}
                <span style={{ padding: "2px 10px", background: "#F5F0FF", color: "#9B6DFF", fontSize: "11px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase" }}>
                  {isCommunityAdmin ? "Community Admin" : "Community Moderator"}
                </span>
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>
                r/{community.slug} • {community.member_count} members • {community.post_count} posts
                {community.is_locked && <span style={{ marginLeft: "8px", padding: "2px 8px", background: "#FEE2E2", color: "#DC2626", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>🔒 LOCKED</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "24px", paddingBottom: "8px" }}>
          {tabBtn(tab === "posts", "Posts", <FileText size={16} />)}
          {tabBtn(tab === "members", "Members", <Users size={16} />)}
          {tabBtn(tab === "moderators", "Moderators", <Shield size={16} />)}
          {tabBtn(tab === "settings", "Settings", <Settings size={16} />)}
        </div>

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div>
            <div style={{ marginBottom: "16px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" placeholder="Search posts..." value={searchPosts} onChange={(e) => setSearchPosts(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredPosts.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", textAlign: "center" }}>No posts found</p></div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>{post.title || "Untitled"}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          By @{post.author?.username || "unknown"} • {post.upvotes || 0} upvotes • {post.comment_count || 0} comments • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button onClick={() => togglePostPin(post.id, post.is_pinned)}
                          style={{ padding: "8px 12px", background: post.is_pinned ? "#EBF5FF" : "var(--surface-2)", color: post.is_pinned ? "#2D87C8" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          {post.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                          {post.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        <button onClick={() => removePost(post.id)}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div>
            <div style={{ marginBottom: "16px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" placeholder="Search members..." value={searchMembers} onChange={(e) => setSearchMembers(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredMembers.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", textAlign: "center" }}>No members found</p></div>
              ) : (
                filteredMembers.map((member) => (
                  <div key={member.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                        <div style={{
                          width: "40px", height: "40px", borderRadius: "50%", background: "var(--gradient)",
                          display: "flex", alignItems: "center", justifyContent: "center", color: "white",
                          fontWeight: 700, fontSize: "14px", flexShrink: 0,
                        }}>
                          {member.user?.full_name?.[0]?.toUpperCase() || member.user?.username?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                            {member.user?.full_name || member.user?.username}
                            {member.role === "banned" && <span style={{ marginLeft: "8px", padding: "2px 8px", background: "#FEE2E2", color: "#DC2626", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>BANNED</span>}
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>@{member.user?.username} • Joined {new Date(member.joined_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        {isCommunityAdmin && (
                          <button onClick={() => promoteToModerator(member.user_id)}
                            style={{ padding: "8px 12px", background: "#F5F0FF", color: "#9B6DFF", border: "1px solid #9B6DFF", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Crown size={14} /> Make Mod
                          </button>
                        )}
                        <button onClick={() => toggleMemberBan(member.id, member.user_id, member.role === "banned")}
                          style={{ padding: "8px 12px", background: member.role === "banned" ? "#D1FAE5" : "#FEE2E2", color: member.role === "banned" ? "#059669" : "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          {member.role === "banned" ? <UserCheck size={14} /> : <UserX size={14} />}
                          {member.role === "banned" ? "Unban" : "Ban"}
                        </button>
                        <button onClick={() => removeMember(member.id)}
                          style={{ padding: "8px 12px", background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* MODERATORS TAB */}
        {tab === "moderators" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {moderators.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", textAlign: "center" }}>No community moderators yet.</p></div>
              ) : (
                moderators.map((mod) => (
                  <div key={mod.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                          @{mod.user?.username || "unknown"}
                          <span style={{ marginLeft: "8px", padding: "2px 8px", background: mod.role === "admin" ? "#FFF0F2" : "#F5F0FF", color: mod.role === "admin" ? "#E8445A" : "#9B6DFF", fontSize: "11px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase" }}>
                            {mod.role}
                          </span>
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0 0" }}>Assigned {new Date(mod.assigned_at).toLocaleDateString()}</p>
                      </div>
                      {isCommunityAdmin && mod.user_id !== currentUserId && (
                        <button onClick={() => demoteModerator(mod.id)}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SETTINGS TAB */}
        {tab === "settings" && (
          <div>
            <div style={cardStyle}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} /> Community Settings
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Description</label>
                  <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "14px", resize: "vertical", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Icon</label>
                  <input type="text" value={editIcon} onChange={(e) => setEditIcon(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "14px", boxSizing: "border-box" }} />
                </div>
                <button onClick={saveSettings} disabled={savingSettings}
                  style={{ padding: "12px", background: savingSettings ? "var(--border)" : "#1ABC9C", color: "white", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "14px", cursor: savingSettings ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <Save size={16} /> {savingSettings ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Lock size={18} /> Danger Zone
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "var(--surface-2)", borderRadius: "8px" }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>{community.is_locked ? "Unlock Community" : "Lock Community"}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{community.is_locked ? "Allow new posts and comments" : "Prevent new posts and comments"}</p>
                  </div>
                  <button onClick={toggleCommunityLock}
                    style={{ padding: "10px 16px", background: community.is_locked ? "#D1FAE5" : "#FEE2E2", color: community.is_locked ? "#059669" : "#DC2626", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                    {community.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
                    {community.is_locked ? "Unlock" : "Lock"}
                  </button>
                </div>

                {isCommunityAdmin && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "var(--surface-2)", borderRadius: "8px" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>Transfer Ownership</p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Give admin control to another member</p>
                    </div>
                    <button onClick={() => setShowTransfer(!showTransfer)}
                      style={{ padding: "10px 16px", background: "#F5F0FF", color: "#9B6DFF", border: "1px solid #9B6DFF", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>
                      Transfer
                    </button>
                  </div>
                )}

                {showTransfer && (
                  <div style={{ padding: "14px", background: "var(--surface-2)", borderRadius: "8px", display: "flex", gap: "8px" }}>
                    <input type="text" placeholder="@username" value={transferTo} onChange={(e) => setTransferTo(e.target.value)}
                      style={{ flex: 1, padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "14px" }} />
                    <button onClick={transferOwnership}
                      style={{ padding: "10px 16px", background: "#9B6DFF", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Confirm</button>
                  </div>
                )}

                {isAppAdmin && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px", background: "#FFF0F2", borderRadius: "8px", border: "1px solid #FECACA" }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#E8445A", margin: "0 0 4px 0" }}>Delete Community</p>
                      <p style={{ fontSize: "12px", color: "#E8445A", margin: 0 }}>This cannot be undone. All posts will be lost.</p>
                    </div>
                    <button onClick={deleteCommunity}
                      style={{ padding: "10px 16px", background: "#E8445A", color: "white", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppShell>
  );
}
