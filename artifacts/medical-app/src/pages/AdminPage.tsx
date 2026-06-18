import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Shield, TrendingUp, Search, Check, X, Flag, Download,
  VolumeX, Volume2, Ban, UserX, Unlock, Lock, Eye, Trash2, ChevronDown,
} from "lucide-react";

interface Profile {
  id: string; username: string; full_name: string | null;
  profession: string; role: string; created_at: string;
  is_suspended?: boolean; is_muted?: boolean; is_banned?: boolean;
  institution?: string; study_year?: string;
}

interface Community {
  id: string; name: string; slug: string; icon?: string;
  description?: string; member_count: number; post_count: number;
  created_at: string; creator_id?: string; created_by?: string;
  is_official?: boolean; is_featured?: boolean; is_locked?: boolean; user_created?: boolean;
}

interface Report {
  id: string; type?: string; target_id?: string; reported_by_id?: string;
  reason?: string; created_at: string; status?: string; content?: string;
  content_preview?: string; violation_category?: string;
  originating_community_id?: string; reporter?: { username: string };
}

interface AuditLog {
  id: string; admin_id: string; action: string; target_type: string;
  target_id: string; details?: any; created_at: string;
  admin?: { username: string; full_name: string | null };
}

interface CommunityRequest {
  id: string; community_name: string; description: string; icon?: string;
  topic?: string; status: string; created_at: string; user_id: string;
  rejection_reason?: string; reviewed_by?: string; reviewed_at?: string;
  stated_purpose?: string; requester?: { username: string; full_name: string | null };
}

interface Post {
  id: string; title: string | null; content: string; upvotes: number;
  comment_count: number; created_at: string; is_pinned: boolean;
  is_announcement: boolean; is_reported?: boolean; is_flagged?: boolean;
  author_id?: string; community_id?: string;
  author?: { username: string; full_name: string | null };
  community?: { name: string; icon?: string };
}

interface Stats {
  users: number; posts: number; comments: number; communities: number;
  active_today: number; pending_reports: number; new_this_week: number;
}

const isAppAdmin = (role: string) => role === "app_admin" || role === "admin";

const roleColors: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
  app_admin:   { bg: "#FFF8EC", color: "#F5A623" },
  admin:       { bg: "#FFF8EC", color: "#F5A623" },
  moderator:   { bg: "#EBF5FF", color: "#2D87C8" },
  exco:        { bg: "#F5F0FF", color: "#9B6DFF" },
  student:     { bg: "#EDFFF5", color: "#3DBE7A" },
};

type Tab = "overview" | "users" | "posts" | "communities" | "reports" | "audit" | "community_requests" | "security_vault" | "news_moderators" | "pending_review";

const SkeletonLoader = ({ width = "100%", height = "20px", count = 1 }: any) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width, height,
          background: "linear-gradient(90deg, var(--surface-2) 25%, var(--surface) 50%, var(--surface-2) 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.5s infinite",
          borderRadius: "var(--radius-sm)",
          marginBottom: "8px",
        }}
      />
    ))}
  </>
);

export default function AdminPage() {
  const supabase = createClient();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats>({
    users: 0, posts: 0, comments: 0, communities: 0,
    active_today: 0, pending_reports: 0, new_this_week: 0,
  });

  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [error, setError] = useState("");

  // Request actions
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // News moderation
  const [moderators, setModerators] = useState<any[]>([]);
  const [pendingDrafts, setPendingDrafts] = useState<any[]>([]);
  const [pendingDraftCount, setPendingDraftCount] = useState(0);
  const [assigningModerator, setAssigningModerator] = useState(false);
  const [moderatorSearch, setModeratorSearch] = useState("");
  const [moderatorSearchResults, setModeratorSearchResults] = useState<Profile[]>([]);
  const [selectedUserForMod, setSelectedUserForMod] = useState<Profile | null>(null);
  const [modPermissions, setModPermissions] = useState<string[]>(["news:create", "news:edit_own"]);
  const [modScope, setModScope] = useState<string[]>(["global"]);
  const [modActionLoading, setModActionLoading] = useState(false);

  // Filters
  const [searchUsers, setSearchUsers] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterProfession, setFilterProfession] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [searchPosts, setSearchPosts] = useState("");
  const [filterReportType, setFilterReportType] = useState("");
  const [filterReportStatus, setFilterReportStatus] = useState("");
  const [filterAuditAdmin, setFilterAuditAdmin] = useState("");
  const [filterAuditAction, setFilterAuditAction] = useState(""); // FIX: Added missing state
  const [filterRequestStatus, setFilterRequestStatus] = useState("pending");
  const [searchCommunities, setSearchCommunities] = useState("");

  // Vault
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [vaultJustification, setVaultJustification] = useState("");
  const [vaultShowPassword, setVaultShowPassword] = useState(false);
  const [vaultLoading, setVaultLoading] = useState(false);
  const [vaultError, setVaultError] = useState("");
  const [vaultAudits, setVaultAudits] = useState<any[]>([]);
  const [vaultAuditsLoading, setVaultAuditsLoading] = useState(false);

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // User posts modal
  const [userPostsModal, setUserPostsModal] = useState<{ open: boolean; userId: string; username: string }>({
    open: false, userId: "", username: "",
  });
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userPostsLoading, setUserPostsLoading] = useState(false);

  const usersPerPage = 20;

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: profile, error: profileErr } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

        if (profileErr || !profile || !["admin", "app_admin", "moderator", "super_admin"].includes(profile.role)) {
          navigate("/"); return;
        }

        setCurrentRole(profile.role);
        setCurrentUserId(user.id);
        await fetchAllData(profile.role, user.id);
      } catch (err) {
        console.error("Auth check failed:", err);
        setError("Authentication failed. Please try again.");
      }
    }
    checkAuth();
  }, []);

  async function fetchAllData(role?: string, userId?: string) {
    const effectiveRole = role || currentRole;
    const effectiveUserId = userId || currentUserId;
    setLoading(true); setError("");

    try {
      const isSuper = effectiveRole === "super_admin";
      const isAdmin = isAppAdmin(effectiveRole);
      const isMod = effectiveRole === "moderator";

      const countPromises = [
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("communities").select("*", { count: "exact", head: true }),
      ];

      const usersQuery = supabase
        .from("profiles")
        .select("id, username, full_name, profession, role, created_at, is_suspended, is_muted, is_banned, institution, study_year")
        .order("created_at", { ascending: false })
        .range(0, usersPerPage - 1);

      const postsQuery = supabase
        .from("posts")
        .select(`
          id, title, content, upvotes, comment_count, created_at,
          is_pinned, is_announcement, is_reported, is_flagged,
          author:author_id(username, full_name),
          community:community_id(name, icon)
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      const communitiesQuery = (isAdmin || isSuper)
        ? supabase.from("communities").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [] });

      const reportsQuery = (isAdmin || isSuper || isMod)
        ? supabase.from("reports").select(`*`).order("created_at", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] });

      const auditQuery = isSuper
        ? supabase.from("audit_logs").select(`*, admin:admin_id(username, full_name)`).order("created_at", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] });

      const requestsQuery = (isAdmin || isSuper)
        ? supabase.from("community_requests")
            .select(`*, requester:user_id(username, full_name)`)
            .order("created_at", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] });

      const moderatorsQuery = (isAdmin || isSuper)
        ? supabase.from("user_permissions").select(`*, user:profiles(id, username, full_name, role)`).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [] });

      const pendingDraftsQuery = (isAdmin || isSuper)
        ? supabase.from("news_posts").select(`*, author:profiles!news_posts_created_by_fkey(full_name, username, role)`).eq("status", "draft").order("created_at", { ascending: false })
        : Promise.resolve({ data: [] });

      const [
        userCountRes, postCountRes, commentCountRes, communityCountRes,
        usersRes, postsRes, communitiesRes, reportsRes, auditRes, requestsRes,
        moderatorsRes, pendingDraftsRes,
      ] = await Promise.all([
        ...countPromises, usersQuery, postsQuery, communitiesQuery,
        reportsQuery, auditQuery, requestsQuery, moderatorsQuery, pendingDraftsQuery,
      ]);

      if (usersRes.error) console.error("Users error:", usersRes.error);
      if (postsRes.error) console.error("Posts error:", postsRes.error);
      if ((communitiesRes as any).error) console.error("Communities error:", (communitiesRes as any).error);
      if ((reportsRes as any).error) console.error("Reports error:", (reportsRes as any).error);
      if ((auditRes as any).error) console.error("Audit error:", (auditRes as any).error);
      if ((requestsRes as any).error) console.error("Requests error:", (requestsRes as any).error);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const newThisWeek = (usersRes.data || []).filter((u: any) => new Date(u.created_at) > weekAgo).length;
      const pendingReports = (reportsRes.data || []).filter((r: any) => r.status === "pending" || r.status === "open").length;
      const pendingRequests = (requestsRes.data || []).filter((r: any) => r.status === "pending").length;

      setStats({
        users: userCountRes.count || 0,
        posts: postCountRes.count || 0,
        comments: commentCountRes.count || 0,
        communities: communityCountRes.count || 0,
        active_today: 0,
        pending_reports: pendingReports,
        new_this_week: newThisWeek,
      });

      setUsers(usersRes.data || []);
      setUserTotalCount(userCountRes.count || 0);
      setPosts(postsRes.data || []);
      setCommunities((communitiesRes.data as Community[]) || []);
      setReports((reportsRes.data as Report[]) || []);
      setAuditLog((auditRes.data as AuditLog[]) || []);
      setCommunityRequests((requestsRes.data as CommunityRequest[]) || []);
      setPendingRequestCount(pendingRequests);
      setModerators((moderatorsRes.data as any[]) || []);
      setPendingDrafts((pendingDraftsRes.data as any[]) || []);
      setPendingDraftCount((pendingDraftsRes.data as any[])?.length || 0);

      const activity: any[] = [];
      (usersRes.data || []).slice(0, 5).forEach((u: any) => {
        activity.push({ type: "user", message: `New user: ${u.full_name || u.username}`, timestamp: u.created_at });
      });
      (postsRes.data || []).slice(0, 5).forEach((p: any) => {
        activity.push({ type: "post", message: `New post: "${p.title?.substring(0, 40) || "Untitled"}..."`, timestamp: p.created_at });
      });
      (reportsRes.data || []).slice(0, 5).forEach((r: any) => {
        activity.push({ type: "report", message: `Report: ${r.violation_category || r.type || "unknown"}`, timestamp: r.created_at });
      });

      setRecentActivity(
        activity
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      );
    } catch (err: any) {
      console.error("Error fetching admin data:", err);
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsersPage(page: number) {
    const from = (page - 1) * usersPerPage;
    const to = from + usersPerPage - 1;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, profession, role, created_at, is_suspended, is_muted, is_banned, institution, study_year")
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) console.error("fetchUsersPage error:", error);
    if (!error && data) setUsers(data);
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    if (error) { alert("Failed to update role: " + error.message); return; }
    await logAudit("Changed role to " + newRole, "user", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  }

  async function toggleUserSuspend(userId: string, currentStatus: boolean) {
    const { error } = await supabase.from("profiles").update({ is_suspended: !currentStatus }).eq("id", userId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!currentStatus ? "Suspended user" : "Unsuspended user", "user", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_suspended: !currentStatus } : u)));
  }

  async function toggleUserMute(userId: string, currentStatus: boolean) {
    const { error } = await supabase.from("profiles").update({ is_muted: !currentStatus }).eq("id", userId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!currentStatus ? "Muted user" : "Unmuted user", "user", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_muted: !currentStatus } : u)));
  }

  async function toggleUserBan(userId: string, currentStatus: boolean) {
    if (!confirm(currentStatus ? "Unban this user?" : "PERMANENTLY ban this user? This is irreversible.")) return;
    const { error } = await supabase.from("profiles").update({ is_banned: !currentStatus }).eq("id", userId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!currentStatus ? "Permanently banned user" : "Unbanned user", "user", userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentStatus } : u)));
  }

  async function deleteUserAccount(userId: string) {
    if (!confirm("DELETE this user account permanently? All their data will be removed.")) return;
    if (!confirm("Are you absolutely sure? This cannot be undone.")) return;
    await supabase.from("comments").delete().eq("author_id", userId);
    await supabase.from("posts").delete().eq("author_id", userId);
    await supabase.from("community_members").delete().eq("user_id", userId);
    await supabase.from("community_moderators").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("id", userId);
    await logAudit("Deleted user account", "user", userId);
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  }

  async function fetchUserPosts(userId: string, username: string) {
    setUserPostsModal({ open: true, userId, username });
    setUserPostsLoading(true);
    const { data, error } = await supabase
      .from("posts")
      .select(`id, title, content, upvotes, comment_count, created_at, is_pinned, is_announcement, community:community_id(name, icon)`)
      .eq("author_id", userId)
      .order("created_at", { ascending: false });
    if (error) console.error("fetchUserPosts error:", error);
    setUserPosts(data || []);
    setUserPostsLoading(false);
  }

  async function logAudit(action: string, targetType: string, targetId: string, details?: any) {
    try {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action,
        target_type: targetType,
        target_id: targetId,
        details,
      });
    } catch (e) { console.error("Audit log failed:", e); }
  }

  async function handleApproveRequest(requestId: string) {
    setRequestActionLoading(requestId);
    try {
      const { data: req } = await supabase.from("community_requests").select("*").eq("id", requestId).single();
      if (!req) return;
      const { error: createErr } = await supabase.from("communities").insert({
        name: req.community_name,
        slug: req.community_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        description: req.description,
        icon: req.icon,
        topic: req.topic,
        created_by: req.user_id,
        user_created: true,
      });
      if (createErr) { alert("Failed to create community: " + createErr.message); return; }
      await supabase.from("community_requests").update({ status: "approved", reviewed_by: currentUserId, reviewed_at: new Date().toISOString() }).eq("id", requestId);
      await logAudit("Approved community request", "community_request", requestId);
      setCommunityRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "approved", reviewed_by: currentUserId, reviewed_at: new Date().toISOString() } : r)));
      setPendingRequestCount((c) => c - 1);
    } finally { setRequestActionLoading(null); }
  }

  async function handleRejectRequest(requestId: string) {
    if (!rejectionReason.trim()) { alert("Please provide a rejection reason."); return; }
    setRequestActionLoading(requestId);
    try {
      await supabase.from("community_requests").update({
        status: "rejected", rejection_reason: rejectionReason,
        reviewed_by: currentUserId, reviewed_at: new Date().toISOString(),
      }).eq("id", requestId);
      await logAudit("Rejected community request: " + rejectionReason, "community_request", requestId);
      setCommunityRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, status: "rejected", rejection_reason: rejectionReason, reviewed_by: currentUserId, reviewed_at: new Date().toISOString() } : r)));
      setPendingRequestCount((c) => c - 1);
      setRejectingId(null);
      setRejectionReason("");
    } finally { setRequestActionLoading(null); }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Deleted post", "post", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function handleTogglePin(postId: string, current: boolean) {
    const { error } = await supabase.from("posts").update({ is_pinned: !current }).eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!current ? "Pinned post" : "Unpinned post", "post", postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_pinned: !current } : p)));
  }

  async function handleToggleAnnouncement(postId: string, current: boolean) {
    const { error } = await supabase.from("posts").update({ is_announcement: !current }).eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!current ? "Made announcement" : "Removed announcement", "post", postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_announcement: !current } : p)));
  }

  async function handleToggleLockCommunity(communityId: string, current: boolean) {
    const { error } = await supabase.from("communities").update({ is_locked: !current }).eq("id", communityId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!current ? "Locked community" : "Unlocked community", "community", communityId);
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, is_locked: !current } : c)));
  }

  async function handleToggleFeatureCommunity(communityId: string, current: boolean) {
    const { error } = await supabase.from("communities").update({ is_featured: !current }).eq("id", communityId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!current ? "Featured community" : "Unfeatured community", "community", communityId);
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, is_featured: !current } : c)));
  }

  async function handleDeleteCommunity(communityId: string) {
    if (!confirm("Delete this community and all its posts?")) return;
    if (!confirm("Are you sure? This cannot be undone.")) return;
    await supabase.from("comments").delete().eq("community_id", communityId);
    await supabase.from("posts").delete().eq("community_id", communityId);
    await supabase.from("community_members").delete().eq("community_id", communityId);
    await supabase.from("community_moderators").delete().eq("community_id", communityId);
    await supabase.from("communities").delete().eq("id", communityId);
    await logAudit("Deleted community", "community", communityId);
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
  }

  async function handleResolveReport(reportId: string) {
    const { error } = await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Resolved report", "report", reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)));
  }

  async function handleDismissReport(reportId: string) {
    const { error } = await supabase.from("reports").update({ status: "dismissed" }).eq("id", reportId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Dismissed report", "report", reportId);
    setReports((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r)));
  }

  async function unlockVault() {
    setVaultLoading(true); setVaultError("");
    try {
      const { data, error } = await supabase.rpc("verify_vault_password", { password: vaultPassword });
      if (error || !data) { setVaultError("Incorrect password or access denied."); return; }
      setVaultUnlocked(true);
      setVaultPassword("");
      await logAudit("Unlocked security vault", "vault", currentUserId, { justification: vaultJustification });
      fetchVaultAudits();
    } catch (e) { setVaultError("Vault verification failed."); }
    finally { setVaultLoading(false); }
  }

  async function fetchVaultAudits() {
    setVaultAuditsLoading(true);
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`*, admin:admin_id(username, full_name)`)
      .or("action.eq.Deleted user account,action.eq.Permanently banned user,action.eq.Unlocked security vault")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error("Vault audits error:", error);
    setVaultAudits(data || []);
    setVaultAuditsLoading(false);
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchUsers || u.username.toLowerCase().includes(searchUsers.toLowerCase()) || (u.full_name || "").toLowerCase().includes(searchUsers.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesProfession = !filterProfession || u.profession === filterProfession;
    return matchesSearch && matchesRole && matchesProfession;
  });

  const filteredPosts = posts.filter((p) => {
    const matchesSearch = !searchPosts || (p.title || "").toLowerCase().includes(searchPosts.toLowerCase()) || p.content.toLowerCase().includes(searchPosts.toLowerCase());
    return matchesSearch;
  });

  const filteredCommunities = communities.filter((c) => {
    const matchesSearch = !searchCommunities || c.name.toLowerCase().includes(searchCommunities.toLowerCase());
    return matchesSearch;
  });

  const filteredReports = reports.filter((r) => {
    const matchesType = !filterReportType || r.type === filterReportType;
    const matchesStatus = !filterReportStatus || r.status === filterReportStatus;
    return matchesType && matchesStatus;
  });

  const filteredAuditLog = auditLog.filter((log) => {
    const matchesAdmin = !filterAuditAdmin || log.admin?.username === filterAuditAdmin;
    const matchesAction = !filterAuditAction || log.action.toLowerCase().includes(filterAuditAction.toLowerCase());
    return matchesAdmin && matchesAction;
  });

  const filteredRequests = communityRequests.filter((r) => {
    const matchesStatus = !filterRequestStatus || r.status === filterRequestStatus;
    return matchesStatus;
  });

  async function searchUsersForModerator(query: string) {
    if (!query.trim()) { setModeratorSearchResults([]); return; }
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name, role, university")
      .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
      .limit(10);
    setModeratorSearchResults(data || []);
  }

  async function assignModerator() {
    if (!selectedUserForMod) return;
    setModActionLoading(true);

    const { error } = await supabase.from("user_permissions").upsert({
      user_id: selectedUserForMod.id,
      role: "moderator",
      permissions: modPermissions,
      scope: modScope,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert("Failed: " + error.message);
    } else {
      await logAudit("Assigned moderator role", "user_permissions", selectedUserForMod.id, { permissions: modPermissions, scope: modScope });
      setAssigningModerator(false);
      setSelectedUserForMod(null);
      setModeratorSearch("");
      setModeratorSearchResults([]);
      // Refresh moderators
      const { data } = await supabase.from("user_permissions").select(`*, user:profiles(id, username, full_name, role)`).order("updated_at", { ascending: false });
      setModerators(data || []);
    }
    setModActionLoading(false);
  }

  async function revokeModerator(userId: string) {
    if (!confirm("Revoke moderator permissions?")) return;
    const { error } = await supabase.from("user_permissions").delete().eq("user_id", userId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Revoked moderator role", "user_permissions", userId);
    setModerators(prev => prev.filter(m => m.user_id !== userId));
  }

  async function publishDraft(postId: string) {
    const { error } = await supabase.from("news_posts").update({ status: "published" }).eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Published draft", "news_post", postId);
    setPendingDrafts(prev => prev.filter(d => d.id !== postId));
    setPendingDraftCount(prev => prev - 1);
  }

  async function rejectDraft(postId: string) {
    const { error } = await supabase.from("news_posts").update({ status: "archived" }).eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit("Rejected draft", "news_post", postId);
    setPendingDrafts(prev => prev.filter(d => d.id !== postId));
    setPendingDraftCount(prev => prev - 1);
  }

  const isSuper = currentRole === "super_admin";
  const isAdmin = isAppAdmin(currentRole);
  const isMod = currentRole === "moderator";

  const tabs: { id: Tab; label: string; icon: any; badge?: number; adminOnly?: boolean; superOnly?: boolean }[] = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Users", icon: Shield },
    { id: "posts", label: "Posts", icon: Eye },
    { id: "communities", label: "Communities", icon: Lock, adminOnly: true },
    { id: "reports", label: "Reports", icon: Flag, badge: stats.pending_reports },
    { id: "community_requests", label: "Requests", icon: Check, badge: pendingRequestCount, adminOnly: true },
    { id: "audit", label: "Audit Log", icon: Download, superOnly: true },
    { id: "security_vault", label: "Security Vault", icon: Lock, superOnly: true },
    { id: "news_moderators", label: "News Moderators", icon: Shield, adminOnly: true },
    { id: "pending_review", label: "Pending Review", icon: Check, badge: pendingDraftCount, adminOnly: true },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <Shield size={28} style={{ color: "var(--accent)" }} />
          <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0 }}>Admin Dashboard</h1>
          <span style={{
            padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, textTransform: "uppercase",
            background: roleColors[currentRole]?.bg || "#f0f0f0", color: roleColors[currentRole]?.color || "#666",
          }}>
            {currentRole.replace("_", " ")}
          </span>
        </div>

        {error && (
          <div style={{ padding: "16px", borderRadius: "12px", background: "#FFF0F2", color: "#E8445A", marginBottom: "24px" }}>
            {error}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}>
          {tabs.filter((t) => (!t.adminOnly || isAdmin) && (!t.superOnly || isSuper)).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px",
                borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500,
                background: tab === t.id ? "var(--accent)" : "transparent",
                color: tab === t.id ? "#fff" : "var(--text-secondary)",
                transition: "all 0.2s",
              }}
            >
              <t.icon size={16} />
              {t.label}
              {t.badge ? <span style={{ background: "#E8445A", color: "#fff", borderRadius: "10px", padding: "2px 8px", fontSize: "11px" }}>{t.badge}</span> : null}
            </button>
          ))}
        </div>

        {loading ? (
          <div>
            <SkeletonLoader width="100%" height="60px" count={4} />
            <SkeletonLoader width="100%" height="40px" count={8} />
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <div>
                {/* Stats Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                  {[
                    { label: "Total Users", value: stats.users, icon: Shield, color: "#2D87C8" },
                    { label: "Total Posts", value: stats.posts, icon: Eye, color: "#3DBE7A" },
                    { label: "Comments", value: stats.comments, icon: TrendingUp, color: "#9B6DFF" },
                    { label: "Communities", value: stats.communities, icon: Lock, color: "#F5A623" },
                    { label: "New This Week", value: stats.new_this_week, icon: TrendingUp, color: "#E8445A" },
                    { label: "Pending Reports", value: stats.pending_reports, icon: Flag, color: "#E8445A" },
                  ].map((s) => (
                    <div key={s.label} style={{ padding: "20px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                        <s.icon size={18} style={{ color: s.color }} />
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>{s.label}</span>
                      </div>
                      <div style={{ fontSize: "28px", fontWeight: 700, color: "var(--text)" }}>{s.value.toLocaleString()}</div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div style={{ padding: "20px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h3 style={{ margin: "0 0 16px 0", fontSize: "16px" }}>Recent Activity</h3>
                  {recentActivity.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>No recent activity</p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {recentActivity.map((a, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "10px", background: "var(--surface-2)" }}>
                          <div style={{
                            width: "8px", height: "8px", borderRadius: "50%",
                            background: a.type === "report" ? "#E8445A" : a.type === "post" ? "#3DBE7A" : "#2D87C8",
                          }} />
                          <span style={{ flex: 1, fontSize: "14px" }}>{a.message}</span>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                            {new Date(a.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "users" && (
              <div>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchUsers}
                      onChange={(e) => setSearchUsers(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="">All Roles</option>
                    <option value="student">Student</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                    <option value="app_admin">App Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <select value={filterProfession} onChange={(e) => setFilterProfession(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="">All Professions</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Pharmacy">Pharmacy</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Allied Health">Allied Health</option>
                  </select>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "12px" }}>User</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Role</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Profession</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Status</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Joined</th>
                        <th style={{ textAlign: "right", padding: "12px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px" }}>
                            <div style={{ fontWeight: 600 }}>{u.username}</div>
                            <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{u.full_name || "—"}</div>
                          </td>
                          <td style={{ padding: "12px" }}>
                            <span style={{
                              padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                              background: roleColors[u.role]?.bg || "#f0f0f0", color: roleColors[u.role]?.color || "#666",
                            }}>
                              {u.role.replace("_", " ")}
                            </span>
                          </td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)" }}>{u.profession || "—"}</td>
                          <td style={{ padding: "12px" }}>
                            {u.is_banned ? <span style={{ color: "#E8445A", fontWeight: 600 }}>Banned</span> :
                             u.is_suspended ? <span style={{ color: "#F5A623", fontWeight: 600 }}>Suspended</span> :
                             u.is_muted ? <span style={{ color: "#9B6DFF", fontWeight: 600 }}>Muted</span> :
                             <span style={{ color: "#3DBE7A" }}>Active</span>}
                          </td>
                          <td style={{ padding: "12px", color: "var(--text-secondary)", fontSize: "13px" }}>
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                              <button onClick={() => fetchUserPosts(u.id, u.username)} title="View Posts" style={{ padding: "6px", borderRadius: "6px", border: "none", background: "var(--surface-2)", cursor: "pointer" }}>
                                <Eye size={14} />
                              </button>
                              {(isAdmin || isSuper) && (
                                <>
                                  <button onClick={() => toggleUserMute(u.id, !!u.is_muted)} title={u.is_muted ? "Unmute" : "Mute"} style={{ padding: "6px", borderRadius: "6px", border: "none", background: u.is_muted ? "#EBF5FF" : "var(--surface-2)", cursor: "pointer", color: u.is_muted ? "#2D87C8" : "inherit" }}>
                                    {u.is_muted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                  </button>
                                  <button onClick={() => toggleUserSuspend(u.id, !!u.is_suspended)} title={u.is_suspended ? "Unsuspend" : "Suspend"} style={{ padding: "6px", borderRadius: "6px", border: "none", background: u.is_suspended ? "#FFF8EC" : "var(--surface-2)", cursor: "pointer", color: u.is_suspended ? "#F5A623" : "inherit" }}>
                                    {u.is_suspended ? <Unlock size={14} /> : <Lock size={14} />}
                                  </button>
                                  <button onClick={() => toggleUserBan(u.id, !!u.is_banned)} title={u.is_banned ? "Unban" : "Ban"} style={{ padding: "6px", borderRadius: "6px", border: "none", background: u.is_banned ? "#EDFFF5" : "var(--surface-2)", cursor: "pointer", color: u.is_banned ? "#3DBE7A" : "inherit" }}>
                                    {u.is_banned ? <UserX size={14} /> : <Ban size={14} />}
                                  </button>
                                  {isSuper && (
                                    <>
                                      <select
                                        value={u.role}
                                        onChange={(e) => updateUserRole(u.id, e.target.value)}
                                        style={{ padding: "4px 8px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)", fontSize: "12px" }}
                                      >
                                        <option value="student">Student</option>
                                        <option value="moderator">Moderator</option>
                                        <option value="admin">Admin</option>
                                        <option value="app_admin">App Admin</option>
                                        <option value="super_admin">Super Admin</option>
                                      </select>
                                      <button onClick={() => deleteUserAccount(u.id)} title="Delete Account" style={{ padding: "6px", borderRadius: "6px", border: "none", background: "#FFF0F2", cursor: "pointer", color: "#E8445A" }}>
                                        <Trash2 size={14} />
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {userTotalCount > usersPerPage && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
                    <button onClick={() => { setUserPage((p) => Math.max(1, p - 1)); fetchUsersPage(Math.max(1, userPage - 1)); }} disabled={userPage === 1} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: userPage === 1 ? "not-allowed" : "pointer" }}>Previous</button>
                    <span style={{ padding: "8px 16px" }}>Page {userPage} of {Math.ceil(userTotalCount / usersPerPage)}</span>
                    <button onClick={() => { setUserPage((p) => p + 1); fetchUsersPage(userPage + 1); }} disabled={userPage >= Math.ceil(userTotalCount / usersPerPage)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: userPage >= Math.ceil(userTotalCount / usersPerPage) ? "not-allowed" : "pointer" }}>Next</button>
                  </div>
                )}
              </div>
            )}

            {tab === "posts" && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ position: "relative", maxWidth: "400px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input
                      type="text"
                      placeholder="Search posts..."
                      value={searchPosts}
                      onChange={(e) => setSearchPosts(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredPosts.map((p) => (
                    <div key={p.id} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "15px" }}>{p.title || "Untitled Post"}</div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            by {p.author?.username || "Unknown"} in {p.community?.name || "Unknown"} · {new Date(p.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {p.is_pinned && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#FFF8EC", color: "#F5A623", fontSize: "11px", fontWeight: 600 }}>Pinned</span>}
                          {p.is_announcement && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#EBF5FF", color: "#2D87C8", fontSize: "11px", fontWeight: 600 }}>Announcement</span>}
                          {p.is_reported && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#FFF0F2", color: "#E8445A", fontSize: "11px", fontWeight: 600 }}>Reported</span>}
                        </div>
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.5 }}>
                        {p.content.substring(0, 200)}{p.content.length > 200 ? "..." : ""}
                      </div>
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>▲ {p.upvotes} · 💬 {p.comment_count}</span>
                        <div style={{ flex: 1 }} />
                        {(isAdmin || isSuper) && (
                          <>
                            <button onClick={() => handleTogglePin(p.id, p.is_pinned)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--surface-2)", cursor: "pointer", fontSize: "13px" }}>
                              {p.is_pinned ? "Unpin" : "Pin"}
                            </button>
                            <button onClick={() => handleToggleAnnouncement(p.id, p.is_announcement)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--surface-2)", cursor: "pointer", fontSize: "13px" }}>
                              {p.is_announcement ? "Unannounce" : "Announce"}
                            </button>
                            <button onClick={() => handleDeletePost(p.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#FFF0F2", cursor: "pointer", fontSize: "13px", color: "#E8445A" }}>
                              <Trash2 size={14} style={{ display: "inline", marginRight: "4px" }} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "communities" && (isAdmin || isSuper) && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ position: "relative", maxWidth: "400px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input
                      type="text"
                      placeholder="Search communities..."
                      value={searchCommunities}
                      onChange={(e) => setSearchCommunities(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                  {filteredCommunities.map((c) => (
                    <div key={c.id} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                        {c.icon ? <img src={c.icon} alt="" style={{ width: "40px", height: "40px", borderRadius: "10px", objectFit: "cover" }} /> : <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--surface-2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Lock size={18} style={{ color: "var(--text-secondary)" }} /></div>}
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>/{c.slug} · {c.member_count} members · {c.post_count} posts</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
                        {c.is_official && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#EBF5FF", color: "#2D87C8", fontSize: "11px", fontWeight: 600 }}>Official</span>}
                        {c.is_featured && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#FFF8EC", color: "#F5A623", fontSize: "11px", fontWeight: 600 }}>Featured</span>}
                        {c.is_locked && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#FFF0F2", color: "#E8445A", fontSize: "11px", fontWeight: 600 }}>Locked</span>}
                        {c.user_created && <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#EDFFF5", color: "#3DBE7A", fontSize: "11px", fontWeight: 600 }}>User-Created</span>}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleToggleLockCommunity(c.id, !!c.is_locked)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: "pointer", fontSize: "13px" }}>
                          {c.is_locked ? <Unlock size={14} style={{ display: "inline", marginRight: "4px" }} /> : <Lock size={14} style={{ display: "inline", marginRight: "4px" }} />}
                          {c.is_locked ? "Unlock" : "Lock"}
                        </button>
                        <button onClick={() => handleToggleFeatureCommunity(c.id, !!c.is_featured)} style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: "pointer", fontSize: "13px" }}>
                          {c.is_featured ? "Unfeature" : "Feature"}
                        </button>
                        <button onClick={() => handleDeleteCommunity(c.id)} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "#FFF0F2", cursor: "pointer", color: "#E8445A" }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "reports" && (isAdmin || isSuper || isMod) && (
              <div>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <select value={filterReportType} onChange={(e) => setFilterReportType(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="">All Types</option>
                    <option value="post">Post</option>
                    <option value="comment">Comment</option>
                    <option value="user">User</option>
                    <option value="community">Community</option>
                  </select>
                  <select value={filterReportStatus} onChange={(e) => setFilterReportStatus(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="open">Open</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredReports.map((r) => (
                    <div key={r.id} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <Flag size={16} style={{ color: "#E8445A" }} />
                          <span style={{ fontWeight: 600, textTransform: "uppercase", fontSize: "12px" }}>{r.type || "Unknown"}</span>
                          <span style={{
                            padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
                            background: r.status === "resolved" ? "#EDFFF5" : r.status === "dismissed" ? "var(--surface-2)" : "#FFF0F2",
                            color: r.status === "resolved" ? "#3DBE7A" : r.status === "dismissed" ? "var(--text-secondary)" : "#E8445A",
                          }}>
                            {r.status || "pending"}
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ fontSize: "14px", fontWeight: 500 }}>Reason: {r.reason || "No reason provided"}</div>
                        {r.violation_category && <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>Category: {r.violation_category}</div>}
                        {r.content_preview && <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px", fontStyle: "italic" }}>"{r.content_preview}"</div>}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Reported by: {r.reporter?.username || "Unknown"}</span>
                        <div style={{ flex: 1 }} />
                        {(isAdmin || isSuper) && r.status !== "resolved" && r.status !== "dismissed" && (
                          <>
                            <button onClick={() => handleResolveReport(r.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "#EDFFF5", cursor: "pointer", fontSize: "13px", color: "#3DBE7A" }}>
                              <Check size={14} style={{ display: "inline", marginRight: "4px" }} /> Resolve
                            </button>
                            <button onClick={() => handleDismissReport(r.id)} style={{ padding: "6px 12px", borderRadius: "6px", border: "none", background: "var(--surface-2)", cursor: "pointer", fontSize: "13px" }}>
                              <X size={14} style={{ display: "inline", marginRight: "4px" }} /> Dismiss
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "audit" && isSuper && (
              <div>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input
                      type="text"
                      placeholder="Filter by admin username..."
                      value={filterAuditAdmin}
                      onChange={(e) => setFilterAuditAdmin(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                  <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
                    <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
                    <input
                      type="text"
                      placeholder="Filter by action..."
                      value={filterAuditAction}
                      onChange={(e) => setFilterAuditAction(e.target.value)}
                      style={{ width: "100%", padding: "10px 10px 10px 36px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead>
                      <tr style={{ borderBottom: "2px solid var(--border)" }}>
                        <th style={{ textAlign: "left", padding: "12px" }}>Admin</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Action</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Target</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Details</th>
                        <th style={{ textAlign: "left", padding: "12px" }}>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLog.map((log) => (
                        <tr key={log.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "12px", fontWeight: 500 }}>{log.admin?.username || "System"}</td>
                          <td style={{ padding: "12px" }}>{log.action}</td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>{log.target_type}:{log.target_id.substring(0, 8)}...</td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-secondary)" }}>
                            {log.details ? JSON.stringify(log.details).substring(0, 50) : "—"}
                          </td>
                          <td style={{ padding: "12px", fontSize: "13px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "community_requests" && (isAdmin || isSuper) && (
              <div>
                <div style={{ marginBottom: "16px" }}>
                  <select value={filterRequestStatus} onChange={(e) => setFilterRequestStatus(e.target.value)} style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}>
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredRequests.map((req) => (
                    <div key={req.id} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "15px" }}>{req.community_name}</div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            Requested by {req.requester?.username || "Unknown"} · {new Date(req.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span style={{
                          padding: "4px 10px", borderRadius: "12px", fontSize: "11px", fontWeight: 600,
                          background: req.status === "approved" ? "#EDFFF5" : req.status === "rejected" ? "#FFF0F2" : "#FFF8EC",
                          color: req.status === "approved" ? "#3DBE7A" : req.status === "rejected" ? "#E8445A" : "#F5A623",
                        }}>
                          {req.status}
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.5 }}>
                        {req.description}
                      </div>
                      {req.topic && <div style={{ fontSize: "13px", marginBottom: "8px" }}>Topic: {req.topic}</div>}
                      {req.stated_purpose && <div style={{ fontSize: "13px", marginBottom: "8px", fontStyle: "italic" }}>Purpose: {req.stated_purpose}</div>}

                      {req.status === "pending" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          {rejectingId === req.id ? (
                            <div style={{ flex: 1, display: "flex", gap: "8px" }}>
                              <input
                                type="text"
                                placeholder="Rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text)" }}
                              />
                              <button onClick={() => handleRejectRequest(req.id)} disabled={requestActionLoading === req.id} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#E8445A", color: "#fff", cursor: "pointer" }}>
                                {requestActionLoading === req.id ? "..." : "Confirm Reject"}
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectionReason(""); }} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: "pointer" }}>Cancel</button>
                            </div>
                          ) : (
                            <>
                              <button onClick={() => handleApproveRequest(req.id)} disabled={requestActionLoading === req.id} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#3DBE7A", color: "#fff", cursor: "pointer" }}>
                                {requestActionLoading === req.id ? "..." : <><Check size={14} style={{ display: "inline", marginRight: "4px" }} /> Approve</>}
                              </button>
                              <button onClick={() => setRejectingId(req.id)} style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#FFF0F2", color: "#E8445A", cursor: "pointer" }}>
                                <X size={14} style={{ display: "inline", marginRight: "4px" }} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {req.status === "rejected" && req.rejection_reason && (
                        <div style={{ padding: "8px 12px", borderRadius: "8px", background: "#FFF0F2", color: "#E8445A", fontSize: "13px" }}>
                          Rejection reason: {req.rejection_reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "security_vault" && isSuper && (
              <div>
                {!vaultUnlocked ? (
                  <div style={{ maxWidth: "400px", margin: "0 auto", padding: "40px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--border)", textAlign: "center" }}>
                    <Lock size={48} style={{ color: "var(--accent)", marginBottom: "16px" }} />
                    <h3 style={{ margin: "0 0 8px 0" }}>Security Vault</h3>
                    <p style={{ color: "var(--text-secondary)", marginBottom: "24px" }}>This area contains sensitive actions. Authentication required.</p>
                    <input
                      type={vaultShowPassword ? "text" : "password"}
                      placeholder="Vault password"
                      value={vaultPassword}
                      onChange={(e) => setVaultPassword(e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: "12px" }}
                    />
                    <input
                      type="text"
                      placeholder="Justification for access..."
                      value={vaultJustification}
                      onChange={(e) => setVaultJustification(e.target.value)}
                      style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", marginBottom: "12px" }}
                    />
                    <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", fontSize: "13px", cursor: "pointer" }}>
                      <input type="checkbox" checked={vaultShowPassword} onChange={(e) => setVaultShowPassword(e.target.checked)} />
                      Show password
                    </label>
                    {vaultError && <div style={{ color: "#E8445A", marginBottom: "12px", fontSize: "14px" }}>{vaultError}</div>}
                    <button onClick={unlockVault} disabled={vaultLoading} style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "none", background: "var(--accent)", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
                      {vaultLoading ? "Verifying..." : "Unlock Vault"}
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                      <Unlock size={24} style={{ color: "#3DBE7A" }} />
                      <h3 style={{ margin: 0 }}>Vault Access Log</h3>
                      <button onClick={() => setVaultUnlocked(false)} style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: "pointer" }}>
                        Lock Vault
                      </button>
                    </div>

                    {vaultAuditsLoading ? (
                      <SkeletonLoader count={5} />
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {vaultAudits.map((a) => (
                          <div key={a.id} style={{ padding: "16px", borderRadius: "12px", background: "var(--surface)", border: "1px solid var(--border)", borderLeft: "4px solid #E8445A" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                              <span style={{ fontWeight: 600 }}>{a.action}</span>
                              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{new Date(a.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                              By: {a.admin?.username || "Unknown"} · Target: {a.target_type}:{a.target_id}
                            </div>
                            {a.details?.justification && (
                              <div style={{ marginTop: "8px", padding: "8px", borderRadius: "6px", background: "var(--surface-2)", fontSize: "13px" }}>
                                Justification: {a.details.justification}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {tab === "news_moderators" && (isAdmin || isSuper) && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <h3 style={{ margin: 0, fontSize: "18px" }}>News Moderators</h3>
                  <button
                    onClick={() => setAssigningModerator(true)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      background: "var(--accent)",
                      color: "white",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                  >
                    + Assign Moderator
                  </button>
                </div>

                {assigningModerator && (
                  <div style={{
                    padding: "20px",
                    borderRadius: "12px",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    marginBottom: "20px",
                  }}>
                    <h4 style={{ margin: "0 0 12px 0" }}>Assign New Moderator</h4>

                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Search User</label>
                      <input
                        type="text"
                        value={moderatorSearch}
                        onChange={(e) => { setModeratorSearch(e.target.value); searchUsersForModerator(e.target.value); }}
                        placeholder="Search by username or name..."
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-sm)",
                          border: "1px solid var(--border)",
                          background: "var(--surface-2)",
                          color: "var(--text)",
                          fontSize: "14px",
                        }}
                      />
                      {moderatorSearchResults.length > 0 && (
                        <div style={{
                          marginTop: "8px",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-sm)",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}>
                          {moderatorSearchResults.map(u => (
                            <div
                              key={u.id}
                              onClick={() => { setSelectedUserForMod(u); setModeratorSearchResults([]); setModeratorSearch(u.username); }}
                              style={{
                                padding: "10px 14px",
                                cursor: "pointer",
                                borderBottom: "1px solid var(--border)",
                                background: selectedUserForMod?.id === u.id ? "rgba(13, 148, 136, 0.1)" : "transparent",
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{u.full_name || u.username}</div>
                              <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>@{u.username} · {u.role}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedUserForMod && (
                      <>
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Permissions</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {["news:create", "news:edit_own", "news:edit_any", "news:pin", "news:publish"].map(p => (
                              <label key={p} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                                cursor: "pointer",
                                background: modPermissions.includes(p) ? "rgba(13, 148, 136, 0.1)" : "var(--surface-2)",
                              }}>
                                <input
                                  type="checkbox"
                                  checked={modPermissions.includes(p)}
                                  onChange={() => setModPermissions(prev => 
                                    prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
                                  )}
                                />
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>{p.replace("news:", "")}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>University Scope</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                            {NIGERIAN_UNIVERSITIES.map(u => (
                              <label key={u.slug} style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "6px 12px",
                                borderRadius: "var(--radius-sm)",
                                border: "1px solid var(--border)",
                                cursor: "pointer",
                                background: modScope.includes(u.slug) ? "rgba(13, 148, 136, 0.1)" : "var(--surface-2)",
                              }}>
                                <input
                                  type="checkbox"
                                  checked={modScope.includes(u.slug)}
                                  onChange={() => setModScope(prev => 
                                    prev.includes(u.slug) ? prev.filter(x => x !== u.slug) : [...prev, u.slug]
                                  )}
                                />
                                <span style={{ fontSize: "12px", fontWeight: 500 }}>{u.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={assignModerator}
                            disabled={modActionLoading}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "var(--radius-sm)",
                              border: "none",
                              background: "var(--accent)",
                              color: "white",
                              fontWeight: 600,
                              cursor: modActionLoading ? "not-allowed" : "pointer",
                              opacity: modActionLoading ? 0.7 : 1,
                            }}
                          >
                            {modActionLoading ? "Assigning..." : "Assign Moderator"}
                          </button>
                          <button
                            onClick={() => { setAssigningModerator(false); setSelectedUserForMod(null); setModeratorSearch(""); }}
                            style={{
                              padding: "10px 20px",
                              borderRadius: "var(--radius-sm)",
                              border: "1px solid var(--border)",
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {moderators.filter(m => m.role === "moderator").map((mod) => (
                    <div key={mod.user_id} style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "15px" }}>{mod.user?.full_name || mod.user?.username || "Unknown"}</div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>@{mod.user?.username} · {mod.user?.role}</div>
                        </div>
                        <button
                          onClick={() => revokeModerator(mod.user_id)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid #EF4444",
                            background: "rgba(239, 68, 68, 0.05)",
                            color: "#EF4444",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          Revoke
                        </button>
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "8px" }}>
                        {mod.permissions?.map((p: string) => (
                          <span key={p} style={{
                            padding: "3px 8px",
                            borderRadius: "99px",
                            background: "rgba(13, 148, 136, 0.1)",
                            color: "#0D9488",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}>
                            {p.replace("news:", "")}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                        {mod.scope?.map((s: string) => (
                          <span key={s} style={{
                            padding: "3px 8px",
                            borderRadius: "99px",
                            background: "var(--surface-2)",
                            color: "var(--text-secondary)",
                            fontSize: "11px",
                          }}>
                            {NIGERIAN_UNIVERSITIES.find(u => u.slug === s)?.name || s}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  {moderators.filter(m => m.role === "moderator").length === 0 && (
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>No moderators assigned yet.</p>
                  )}
                </div>
              </div>
            )}

            {tab === "pending_review" && (isAdmin || isSuper) && (
              <div>
                <h3 style={{ margin: "0 0 20px 0", fontSize: "18px" }}>Pending Drafts ({pendingDraftCount})</h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {pendingDrafts.map((draft) => (
                    <div key={draft.id} style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "15px" }}>{draft.title}</div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "4px" }}>
                            By {draft.author?.full_name || draft.author?.username || "Unknown"} · {new Date(draft.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "99px",
                          background: "#FFF8EC",
                          color: "#F5A623",
                          fontSize: "11px",
                          fontWeight: 600,
                        }}>
                          Draft
                        </span>
                      </div>
                      <div style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", lineHeight: 1.5 }}>
                        {draft.excerpt || draft.body?.substring(0, 200)}{draft.body?.length > 200 ? "..." : ""}
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => publishDraft(draft.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                            background: "#3DBE7A",
                            color: "white",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <Check size={14} style={{ display: "inline", marginRight: "4px" }} /> Publish
                        </button>
                        <button
                          onClick={() => rejectDraft(draft.id)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                            background: "#FFF0F2",
                            color: "#E8445A",
                            fontSize: "13px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} style={{ display: "inline", marginRight: "4px" }} /> Reject
                        </button>
                        <button
                          onClick={() => navigate(`/news/${draft.id}`)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border)",
                            background: "var(--surface-2)",
                            color: "var(--text)",
                            fontSize: "13px",
                            cursor: "pointer",
                          }}
                        >
                          Preview
                        </button>
                      </div>
                    </div>
                  ))}
                  {pendingDrafts.length === 0 && (
                    <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "40px" }}>No drafts pending review. All caught up!</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {/* User Posts Modal */}
        {userPostsModal.open && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "24px" }} onClick={() => setUserPostsModal({ open: false, userId: "", username: "" })}>
            <div style={{ background: "var(--surface)", borderRadius: "16px", maxWidth: "700px", width: "100%", maxHeight: "80vh", overflow: "auto", padding: "24px" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ margin: 0 }}>Posts by {userPostsModal.username}</h3>
                <button onClick={() => setUserPostsModal({ open: false, userId: "", username: "" })} style={{ padding: "8px", borderRadius: "8px", border: "none", background: "var(--surface-2)", cursor: "pointer" }}><X size={18} /></button>
              </div>
              {userPostsLoading ? (
                <SkeletonLoader count={3} />
              ) : userPosts.length === 0 ? (
                <p style={{ color: "var(--text-secondary)" }}>No posts found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {userPosts.map((p) => (
                    <div key={p.id} style={{ padding: "12px", borderRadius: "10px", background: "var(--surface-2)" }}>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{p.title || "Untitled"}</div>
                      <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "8px" }}>{p.content.substring(0, 150)}{p.content.length > 150 ? "..." : ""}</div>
                      <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>▲ {p.upvotes} · 💬 {p.comment_count} · {new Date(p.created_at).toLocaleDateString()}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
