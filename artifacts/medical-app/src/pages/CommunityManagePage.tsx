import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import {
  Shield, Lock, Unlock, Pin, PinOff, Trash2, UserX, UserCheck,
  Crown, ArrowLeft, Settings, Users, FileText, AlertTriangle,
  Save, X, Search, CheckCircle2, AlertCircle, Send, Mail,
  UserPlus, Ban, ChevronRight, Clock, Eye
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
  profile_image_url?: string;
  cover_image_url?: string;
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
  joined_at: string;
  muted?: boolean;
  user?: { username: string; full_name: string | null; avatar_url?: string };
}

interface Moderator {
  id: string;
  user_id: string;
  role: "admin" | "moderator";
  assigned_at: string;
  assigned_by?: string;
  user?: { username: string; full_name: string | null; avatar_url?: string };
}

interface Invite {
  id: string;
  invitee_id: string;
  role: "admin" | "moderator";
  status: "pending" | "accepted" | "declined";
  created_at: string;
  invitee?: { username: string; full_name: string | null; avatar_url?: string };
}

export default function CommunityManagePage() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [moderators, setModerators] = useState<Moderator[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [isAppAdmin, setIsAppAdmin] = useState(false);

  const [tab, setTab] = useState<"posts" | "members" | "moderators" | "invites" | "settings">("posts");
  const [searchPosts, setSearchPosts] = useState("");
  const [searchMembers, setSearchMembers] = useState("");

  // Settings
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Transfer
  const [transferTo, setTransferTo] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferError, setTransferError] = useState("");

  // Invite
  const [inviteUsername, setInviteUsername] = useState("");
  const [inviteRole, setInviteRole] = useState<"moderator" | "admin">("moderator");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);

  // Leave/Delete modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    async function init() {
      setLoading(true); setError("");
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }
        setCurrentUserId(user.id);

        // Global role
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
        const globalRole = profile?.role || "student";
        const appAdmin = ["super_admin", "app_admin", "admin"].includes(globalRole);
        setIsAppAdmin(appAdmin);

        // Community
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

        // Check admin
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

        await loadAllData(comm.id);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slug]);

  async function loadAllData(communityId: string) {
    // Posts
    const { data: postsData } = await supabase
      .from("posts")
      .select(`id, title, content, author_id, upvotes, comment_count, created_at, is_pinned, is_announcement, author:author_id(username, full_name)`)
      .eq("community_id", communityId)
      .order("created_at", { ascending: false });
    setPosts(postsData || []);

    // Members (from community_members joined with profiles)
    const { data: membersData } = await supabase
      .from("community_members")
      .select(`id, user_id, joined_at, muted, user:user_id(username, full_name, avatar_url)`)
      .eq("community_id", communityId)
      .order("joined_at", { ascending: false });
    setMembers(membersData || []);

    // Moderators
    const { data: modsData } = await supabase
      .from("community_moderators")
      .select(`id, user_id, role, assigned_at, assigned_by, user:user_id(username, full_name, avatar_url)`)
      .eq("community_id", communityId)
      .order("assigned_at", { ascending: false });
    setModerators(modsData || []);

    // Pending invites
    const { data: invitesData } = await supabase
      .from("community_invites")
      .select(`id, invitee_id, role, status, created_at, invitee:invitee_id(username, full_name, avatar_url)`)
      .eq("community_id", communityId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });
    setInvites(invitesData || []);
  }

  // ── Posts ──
  async function togglePostPin(postId: string, current: boolean) {
    await supabase.from("posts").update({ is_pinned: !current }).eq("id", postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !current } : p));
  }

  async function removePost(postId: string) {
    if (!confirm("Delete this post permanently?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  // ── Members ──
  async function removeMember(memberId: string, userId: string) {
    if (!community) return;
    if (userId === community.creator_id) {
      alert("You cannot remove the community creator. Transfer ownership first.");
      return;
    }
    if (!confirm("Remove this member from the community?")) return;
    await supabase.from("community_members").delete().eq("id", memberId);
    setMembers(prev => prev.filter(m => m.id !== memberId));
  }

  async function toggleMemberMute(memberId: string, current: boolean) {
    await supabase.from("community_members").update({ muted: !current }).eq("id", memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, muted: !current } : m));
  }

  // ── Invites ──
  async function sendInvite() {
    if (!community || !inviteUsername.trim()) return;
    setInviteError(""); setInviteSuccess(""); setSendingInvite(true);

    try {
      // Find user
      const cleanName = inviteUsername.trim().replace(/^@/, "");
      const { data: targetUser, error: userErr } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("username", cleanName)
        .single();

      if (userErr || !targetUser) {
        setInviteError("User not found. Make sure the username is correct.");
        setSendingInvite(false);
        return;
      }

      if (targetUser.id === currentUserId) {
        setInviteError("You cannot invite yourself.");
        setSendingInvite(false);
        return;
      }

      // Check if already moderator/admin
      const alreadyMod = moderators.some(m => m.user_id === targetUser.id);
      if (alreadyMod) {
        setInviteError("This user is already a moderator or admin.");
        setSendingInvite(false);
        return;
      }

      // Check existing pending invite
      const { data: existing } = await supabase
        .from("community_invites")
        .select("id")
        .eq("community_id", community.id)
        .eq("invitee_id", targetUser.id)
        .eq("status", "pending")
        .single();

      if (existing) {
        setInviteError("An invite is already pending for this user.");
        setSendingInvite(false);
        return;
      }

      // Create invite
      const { data: invite, error: inviteErr } = await supabase
        .from("community_invites")
        .insert({
          community_id: community.id,
          inviter_id: currentUserId,
          invitee_id: targetUser.id,
          role: inviteRole,
          status: "pending",
        })
        .select("id")
        .single();

      if (inviteErr) throw inviteErr;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: targetUser.id,
        type: "community_invite",
        title: "Community Invite",
        message: `You were invited to be a ${inviteRole} of c/${community.slug}`,
        reference_id: invite.id,
        reference_type: "community_invite",
        metadata: {
          community_id: community.id,
          community_name: community.name,
          community_slug: community.slug,
          role: inviteRole,
          inviter_id: currentUserId,
        },
      });

      setInviteSuccess(`Invite sent to @${targetUser.username}!`);
      setInviteUsername("");

      // Refresh invites
      const { data: invitesData } = await supabase
        .from("community_invites")
        .select(`id, invitee_id, role, status, created_at, invitee:invitee_id(username, full_name, avatar_url)`)
        .eq("community_id", community.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      setInvites(invitesData || []);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invite.");
    } finally {
      setSendingInvite(false);
    }
  }

  async function cancelInvite(inviteId: string) {
    if (!confirm("Cancel this invite?")) return;
    await supabase.from("community_invites").delete().eq("id", inviteId);
    setInvites(prev => prev.filter(i => i.id !== inviteId));
  }

  // ── Moderators ──
  async function demoteModerator(modId: string, userId: string) {
    if (!community) return;
    if (userId === community.creator_id) {
      alert("Cannot remove the community creator. Transfer ownership first.");
      return;
    }
    if (!confirm("Remove this moderator?")) return;
    await supabase.from("community_moderators").delete().eq("id", modId);
    setModerators(prev => prev.filter(m => m.id !== modId));
  }

  // ── Settings ──
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

  async function transferOwnership() {
    if (!community || !transferTo.trim()) return;
    setTransferError("");

    const cleanName = transferTo.trim().replace(/^@/, "");
    const { data: targetUser } = await supabase
      .from("profiles")
      .select("id, username")
      .eq("username", cleanName)
      .single();

    if (!targetUser) {
      setTransferError("User not found.");
      return;
    }

    if (targetUser.id === currentUserId) {
      setTransferError("You already own this community.");
      return;
    }

    if (!confirm(`Transfer ownership to @${targetUser.username}? You will become a regular moderator.`)) return;

    // Update community creator
    await supabase.from("communities").update({
      creator_id: targetUser.id,
      created_by: targetUser.id,
    }).eq("id", community.id);

    // Ensure new owner is admin
    await supabase.from("community_moderators").upsert({
      community_id: community.id,
      user_id: targetUser.id,
      role: "admin",
      assigned_by: currentUserId,
    }, { onConflict: "community_id,user_id" });

    // Demote current owner to moderator
    await supabase.from("community_moderators").upsert({
      community_id: community.id,
      user_id: currentUserId,
      role: "moderator",
      assigned_by: currentUserId,
    }, { onConflict: "community_id,user_id" });

    setCommunity({ ...community, creator_id: targetUser.id, created_by: targetUser.id });
    setShowTransfer(false);
    setTransferTo("");

    // Refresh
    await loadAllData(community.id);
    alert(`Ownership transferred to @${targetUser.username}.`);
  }

  async function deleteCommunity() {
    if (!community) return;
    if (!confirm("DELETE this community and ALL its posts? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;

    await supabase.from("posts").delete().eq("community_id", community.id);
    await supabase.from("community_members").delete().eq("community_id", community.id);
    await supabase.from("community_moderators").delete().eq("community_id", community.id);
    await supabase.from("community_invites").delete().eq("community_id", community.id);
    await supabase.from("community_announcements").delete().eq("community_id", community.id);
    await supabase.from("community_rules").delete().eq("community_id", community.id);
    await supabase.from("communities").delete().eq("id", community.id);

    navigate("/dashboard");
  }

  // ── Leave as Creator ──
  async function handleLeaveAsCreator() {
    if (!community) return;
    setShowLeaveModal(true);
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px", textAlign: "center" }}>
          <div style={{
            width: "32px", height: "32px", borderRadius: "50%",
            border: "3px solid var(--border)", borderTop: "3px solid #0D9488",
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>Loading management...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AppShell>
    );
  }

  if (error || !community) {
    return (
      <AppShell>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 20px" }}>
          <div style={{
            background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: "var(--radius)", padding: "24px", textAlign: "center",
          }}>
            <AlertTriangle size={40} style={{ color: "#ef4444", marginBottom: "12px" }} />
            <h2 style={{ color: "#ef4444", margin: "0 0 8px", fontSize: "18px" }}>{error || "Not found"}</h2>
            <button onClick={() => navigate(`/c/${slug}`)} style={{
              padding: "10px 20px", background: "var(--gradient)", color: "white",
              border: "none", borderRadius: "99px", cursor: "pointer", fontWeight: 700,
            }}>Go Back</button>
          </div>
        </div>
      </AppShell>
    );
  }

  const isCreator = community.creator_id === currentUserId || community.created_by === currentUserId;

  const cardStyle: React.CSSProperties = {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "16px", marginBottom: "12px",
  };

  const tabBtn = (active: boolean, label: string, icon: any) => (
    <button onClick={() => setTab(label.toLowerCase() as any)}
      style={{
        padding: "10px 16px", borderRadius: "var(--radius-sm)",
        border: active ? "2px solid #0D9488" : "1px solid var(--border)",
        background: active ? "rgba(13,148,136,0.08)" : "var(--surface)",
        color: active ? "#0D9488" : "var(--text-muted)",
        fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px",
        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
        whiteSpace: "nowrap", transition: "all 0.2s",
      }}>
      {icon} {label}
    </button>
  );

  const filteredPosts = posts.filter(p =>
    (p.title?.toLowerCase() ?? "").includes(searchPosts.toLowerCase()) ||
    (p.content?.toLowerCase() ?? "").includes(searchPosts.toLowerCase())
  );

  const filteredMembers = members.filter(m =>
    (m.user?.username?.toLowerCase() ?? "").includes(searchMembers.toLowerCase()) ||
    (m.user?.full_name?.toLowerCase() ?? "").includes(searchMembers.toLowerCase())
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        {/* Leave Modal */}
        {showLeaveModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
            padding: "20px",
          }} onClick={() => setShowLeaveModal(false)}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "24px", maxWidth: "420px", width: "100%",
            }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", margin: "0 0 8px" }}>
                Leave Community?
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 20px" }}>
                You are the creator of this community. You must transfer ownership or delete the community to leave.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <button onClick={() => { setShowLeaveModal(false); setShowTransfer(true); setTab("settings"); }}
                  style={{
                    padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--gradient)",
                    color: "white", border: "none", fontWeight: 700, cursor: "pointer", fontSize: "14px",
                  }}>
                  Transfer Ownership
                </button>
                <button onClick={() => { setShowLeaveModal(false); setTab("settings"); }}
                  style={{
                    padding: "12px", borderRadius: "var(--radius-sm)", background: "rgba(239,68,68,0.1)",
                    color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", fontWeight: 700,
                    cursor: "pointer", fontSize: "14px",
                  }}>
                  Delete Community
                </button>
                <button onClick={() => setShowLeaveModal(false)}
                  style={{
                    padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--surface-2)",
                    color: "var(--text)", border: "1px solid var(--border)", fontWeight: 700,
                    cursor: "pointer", fontSize: "14px",
                  }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <button onClick={() => navigate(`/c/${slug}`)} style={{
            background: "none", border: "none", color: "var(--text-muted)",
            cursor: "pointer", fontSize: "13px", marginBottom: "12px",
            display: "flex", alignItems: "center", gap: "6px", fontWeight: 600,
          }}>
            <ArrowLeft size={16} /> Back to c/{slug}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: community.profile_image_url
                ? `url(${community.profile_image_url}) center/cover no-repeat`
                : "var(--gradient)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "24px", overflow: "hidden", flexShrink: 0,
            }}>
              {!community.profile_image_url && community.icon}
            </div>
            <div>
              <h1 style={{
                fontSize: "22px", fontWeight: 800, color: "var(--text)",
                margin: 0, display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap",
              }}>
                {community.name}
                <span style={{
                  padding: "3px 10px", background: "rgba(13,148,136,0.1)",
                  color: "#0D9488", fontSize: "11px", fontWeight: 700,
                  borderRadius: "4px", textTransform: "uppercase",
                }}>
                  {isCreator ? "Owner" : isCommunityAdmin ? "Admin" : "Moderator"}
                </span>
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "4px 0 0" }}>
                c/{community.slug} • {members.length} members • {posts.length} posts
                {community.is_locked && (
                  <span style={{
                    marginLeft: "8px", padding: "2px 8px",
                    background: "rgba(239,68,68,0.1)", color: "#ef4444",
                    fontSize: "11px", fontWeight: 700, borderRadius: "4px",
                  }}>🔒 LOCKED</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "24px", paddingBottom: "4px" }}>
          {tabBtn(tab === "posts", "Posts", <FileText size={16} />)}
          {tabBtn(tab === "members", "Members", <Users size={16} />)}
          {tabBtn(tab === "moderators", "Moderators", <Shield size={16} />)}
          {tabBtn(tab === "invites", `Invites${invites.length > 0 ? ` (${invites.length})` : ""}`, <Mail size={16} />)}
          {tabBtn(tab === "settings", "Settings", <Settings size={16} />)}
        </div>

        {/* ── POSTS TAB ── */}
        {tab === "posts" && (
          <div>
            <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input type="text" placeholder="Search posts..." value={searchPosts} onChange={e => setSearchPosts(e.target.value)}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredPosts.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", textAlign: "center", margin: 0 }}>No posts found</p>
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                          {post.title || "Untitled"}
                          {post.is_pinned && <span style={{ marginLeft: "6px", fontSize: "11px", color: "#0D9488" }}>📌</span>}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          By @{post.author?.username || "unknown"} • {post.upvotes || 0} upvotes • {post.comment_count || 0} comments • {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                        <button onClick={() => togglePostPin(post.id, post.is_pinned)}
                          style={{
                            padding: "8px 12px", background: post.is_pinned ? "rgba(13,148,136,0.08)" : "var(--surface-2)",
                            color: post.is_pinned ? "#0D9488" : "var(--text-muted)", border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                          }}>
                          {post.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                          {post.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        <button onClick={() => removePost(post.id)}
                          style={{
                            padding: "8px 12px", background: "rgba(239,68,68,0.08)",
                            color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                            borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                          }}>
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {tab === "members" && (
          <div>
            <div style={{ ...cardStyle, padding: "10px 14px", display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              <input type="text" placeholder="Search members..." value={searchMembers} onChange={e => setSearchMembers(e.target.value)}
                style={{ flex: 1, background: "none", border: "none", outline: "none", color: "var(--text)", fontSize: "14px", fontFamily: "var(--font-body)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredMembers.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", textAlign: "center", margin: 0 }}>No members found</p>
                </div>
              ) : (
                filteredMembers.map(member => {
                  const isThisCreator = member.user_id === community.creator_id;
                  const isMod = moderators.some(m => m.user_id === member.user_id);
                  return (
                    <div key={member.id} style={cardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                          <div style={{
                            width: "40px", height: "40px", borderRadius: "50%",
                            background: "var(--gradient)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: "14px", flexShrink: 0,
                            overflow: "hidden",
                          }}>
                            {member.user?.avatar_url ? (
                              <img src={member.user.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              member.user?.full_name?.[0]?.toUpperCase() || member.user?.username?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                              {member.user?.full_name || member.user?.username}
                              {isThisCreator && <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(13,148,136,0.1)", color: "#0D9488", borderRadius: "4px", fontWeight: 700 }}>OWNER</span>}
                              {isMod && !isThisCreator && <span style={{ fontSize: "10px", padding: "1px 6px", background: "rgba(155,109,255,0.1)", color: "#9B6DFF", borderRadius: "4px", fontWeight: 700 }}>MOD</span>}
                            </p>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                              @{member.user?.username} • Joined {new Date(member.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          {!isThisCreator && isCommunityAdmin && (
                            <>
                              {!isMod && (
                                <button onClick={() => { setInviteUsername(member.user?.username || ""); setInviteRole("moderator"); setTab("invites"); }}
                                  style={{
                                    padding: "8px 12px", background: "rgba(155,109,255,0.08)",
                                    color: "#9B6DFF", border: "1px solid rgba(155,109,255,0.3)",
                                    borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                                    cursor: "pointer", display: "flex", alignItems: "center", gap: "4px",
                                  }}>
                                  <Shield size={14} /> Promote
                                </button>
                              )}
                              <button onClick={() => toggleMemberMute(member.id, member.muted || false)}
                                style={{
                                  padding: "8px", background: member.muted ? "rgba(13,148,136,0.08)" : "var(--surface-2)",
                                  color: member.muted ? "#0D9488" : "var(--text-muted)", border: "1px solid var(--border)",
                                  borderRadius: "var(--radius-sm)", cursor: "pointer",
                                }}>
                                {member.muted ? <Eye size={14} /> : <Ban size={14} />}
                              </button>
                              <button onClick={() => removeMember(member.id, member.user_id)}
                                style={{
                                  padding: "8px", background: "rgba(239,68,68,0.08)",
                                  color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                                  borderRadius: "var(--radius-sm)", cursor: "pointer",
                                }}>
                                <UserX size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── MODERATORS TAB ── */}
        {tab === "moderators" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {moderators.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", textAlign: "center", margin: 0 }}>No moderators yet.</p>
                </div>
              ) : (
                moderators.map(mod => {
                  const isThisCreator = mod.user_id === community.creator_id;
                  return (
                    <div key={mod.id} style={cardStyle}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{
                            width: "40px", height: "40px", borderRadius: "50%",
                            background: "var(--gradient)", display: "flex",
                            alignItems: "center", justifyContent: "center",
                            color: "white", fontWeight: 700, fontSize: "14px", overflow: "hidden",
                          }}>
                            {mod.user?.avatar_url ? (
                              <img src={mod.user.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              mod.user?.full_name?.[0]?.toUpperCase() || mod.user?.username?.[0]?.toUpperCase() || "?"
                            )}
                          </div>
                          <div>
                            <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                              @{mod.user?.username || "unknown"}
                              <span style={{
                                padding: "2px 8px", background: mod.role === "admin" ? "rgba(13,148,136,0.1)" : "rgba(155,109,255,0.1)",
                                color: mod.role === "admin" ? "#0D9488" : "#9B6DFF",
                                fontSize: "11px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase",
                              }}>{mod.role}</span>
                              {isThisCreator && <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>👑 Creator</span>}
                            </p>
                            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                              Assigned {new Date(mod.assigned_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {isCommunityAdmin && !isThisCreator && (
                          <button onClick={() => demoteModerator(mod.id, mod.user_id)}
                            style={{
                              padding: "8px 12px", background: "rgba(239,68,68,0.08)",
                              color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
                              borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                              cursor: "pointer",
                            }}>
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── INVITES TAB ── */}
        {tab === "invites" && (
          <div>
            {/* Send Invite */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", margin: "0 0 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={16} /> Invite Moderator / Admin
              </h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <input
                    type="text"
                    value={inviteUsername}
                    onChange={e => setInviteUsername(e.target.value)}
                    placeholder="@username"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border)", background: "var(--surface-2)",
                      color: "var(--text)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
                <select
                  value={inviteRole}
                  onChange={e => setInviteRole(e.target.value as "moderator" | "admin")}
                  style={{
                    padding: "10px 12px", borderRadius: "var(--radius-sm)",
                    border: "1px solid var(--border)", background: "var(--surface-2)",
                    color: "var(--text)", fontSize: "14px", outline: "none", cursor: "pointer",
                  }}
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={sendInvite}
                  disabled={sendingInvite || !inviteUsername.trim()}
                  style={{
                    padding: "10px 18px", borderRadius: "var(--radius-sm)",
                    background: "var(--gradient)", color: "white", border: "none",
                    fontWeight: 700, cursor: sendingInvite ? "not-allowed" : "pointer",
                    opacity: sendingInvite || !inviteUsername.trim() ? 0.6 : 1,
                    display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap",
                  }}
                >
                  <Send size={14} /> {sendingInvite ? "Sending..." : "Send Invite"}
                </button>
              </div>
              {inviteError && <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, margin: "0 0 8px" }}>{inviteError}</p>}
              {inviteSuccess && <p style={{ color: "#0D9488", fontSize: "13px", fontWeight: 600, margin: "0 0 8px", display: "flex", alignItems: "center", gap: "6px" }}><CheckCircle2 size={14} /> {inviteSuccess}</p>}
            </div>

            {/* Pending Invites */}
            <h3 style={{ fontSize: "15px", fontWeight: 800, color: "var(--text)", margin: "0 0 12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} /> Pending Invites ({invites.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {invites.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", textAlign: "center", margin: 0 }}>No pending invites.</p>
                </div>
              ) : (
                invites.map(invite => (
                  <div key={invite.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                          width: "36px", height: "36px", borderRadius: "50%",
                          background: "var(--gradient)", display: "flex",
                          alignItems: "center", justifyContent: "center",
                          color: "white", fontWeight: 700, fontSize: "13px", overflow: "hidden",
                        }}>
                          {invite.invitee?.avatar_url ? (
                            <img src={invite.invitee.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            invite.invitee?.full_name?.[0]?.toUpperCase() || invite.invitee?.username?.[0]?.toUpperCase() || "?"
                          )}
                        </div>
                        <div>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                            @{invite.invitee?.username || "unknown"}
                            <span style={{
                              marginLeft: "8px", padding: "2px 8px",
                              background: invite.role === "admin" ? "rgba(13,148,136,0.1)" : "rgba(155,109,255,0.1)",
                              color: invite.role === "admin" ? "#0D9488" : "#9B6DFF",
                              fontSize: "11px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase",
                            }}>{invite.role}</span>
                          </p>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                            Invited {new Date(invite.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => cancelInvite(invite.id)}
                        style={{
                          padding: "8px 12px", background: "var(--surface-2)",
                          color: "var(--text-muted)", border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700,
                          cursor: "pointer",
                        }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === "settings" && (
          <div>
            {/* Basic Settings */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Settings size={18} /> Community Settings
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Name</label>
                  <input type="text" value={editName} onChange={e => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Description</label>
                  <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", color: "var(--text)", fontSize: "14px", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "6px" }}>Icon (emoji)</label>
                  <input type="text" value={editIcon} onChange={e => setEditIcon(e.target.value)}
                    style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box" }} />
                </div>
                <button onClick={saveSettings} disabled={savingSettings}
                  style={{
                    padding: "12px", background: savingSettings ? "var(--border)" : "var(--gradient)",
                    color: "white", border: "none", borderRadius: "var(--radius-sm)",
                    fontWeight: 700, fontSize: "14px", cursor: savingSettings ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  }}>
                  <Save size={16} /> {savingSettings ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>

            {/* Danger Zone */}
            <div style={cardStyle}>
              <h3 style={{ fontSize: "16px", fontWeight: 800, color: "var(--text)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} style={{ color: "#ef4444" }} /> Danger Zone
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Lock/Unlock */}
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
                }}>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>
                      {community.is_locked ? "Unlock Community" : "Lock Community"}
                    </p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                      {community.is_locked ? "Allow new posts and comments" : "Prevent new posts and comments"}
                    </p>
                  </div>
                  <button onClick={toggleCommunityLock}
                    style={{
                      padding: "10px 16px", background: community.is_locked ? "rgba(13,148,136,0.08)" : "rgba(239,68,68,0.08)",
                      color: community.is_locked ? "#0D9488" : "#ef4444", border: "none",
                      borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: "6px",
                    }}>
                    {community.is_locked ? <Unlock size={16} /> : <Lock size={16} />}
                    {community.is_locked ? "Unlock" : "Lock"}
                  </button>
                </div>

                {/* Transfer Ownership */}
                {isCreator && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)",
                  }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" }}>Transfer Ownership</p>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>Give full control to another member</p>
                    </div>
                    <button onClick={() => setShowTransfer(!showTransfer)}
                      style={{
                        padding: "10px 16px", background: "rgba(155,109,255,0.08)",
                        color: "#9B6DFF", border: "1px solid rgba(155,109,255,0.3)",
                        borderRadius: "var(--radius-sm)", fontWeight: 700, cursor: "pointer",
                      }}>
                      Transfer
                    </button>
                  </div>
                )}

                {showTransfer && (
                  <div style={{
                    padding: "14px", background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)", display: "flex", flexDirection: "column", gap: "10px",
                  }}>
                    <input type="text" placeholder="@username" value={transferTo} onChange={e => setTransferTo(e.target.value)}
                      style={{
                        width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)", background: "var(--surface)",
                        color: "var(--text)", fontSize: "14px", outline: "none", boxSizing: "border-box",
                      }} />
                    {transferError && <p style={{ color: "#ef4444", fontSize: "13px", fontWeight: 600, margin: 0 }}>{transferError}</p>}
                    <button onClick={transferOwnership}
                      style={{
                        padding: "10px 16px", background: "#9B6DFF", color: "white",
                        border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
                        cursor: "pointer", fontSize: "14px",
                      }}>
                      Confirm Transfer
                    </button>
                  </div>
                )}

                {/* Delete */}
                {isAppAdmin && (
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px", background: "rgba(239,68,68,0.05)",
                    borderRadius: "var(--radius-sm)", border: "1px solid rgba(239,68,68,0.15)",
                  }}>
                    <div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#ef4444", margin: "0 0 4px" }}>Delete Community</p>
                      <p style={{ fontSize: "12px", color: "#ef4444", margin: 0 }}>This cannot be undone. All posts will be lost.</p>
                    </div>
                    <button onClick={deleteCommunity}
                      style={{
                        padding: "10px 16px", background: "#ef4444", color: "white",
                        border: "none", borderRadius: "var(--radius-sm)", fontWeight: 700,
                        cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
                      }}>
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
