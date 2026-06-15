import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Shield,
  TrendingUp,
  Search,
  Check,
  X,
  Flag,
  Download,
  VolumeX,
  Volume2,
  Ban,
  UserX,
  Unlock,
  Lock,
  Eye,
  Trash2,
  ChevronDown,
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  profession: string;
  role: string;
  created_at: string;
  is_suspended?: boolean;
  is_muted?: boolean;
  is_banned?: boolean;
  institution?: string;
  study_year?: string;
}

interface Community {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  member_count: number;
  post_count: number;
  created_at: string;
  creator_id?: string;
  created_by?: string;
  is_official?: boolean;
  is_featured?: boolean;
  is_locked?: boolean;
  user_created?: boolean;
}

interface Report {
  id: string;
  type?: string;
  target_id?: string;
  reported_by_id?: string;
  reason?: string;
  created_at: string;
  status?: string;
  content?: string;
  content_preview?: string;
  violation_category?: string;
  originating_community_id?: string;
  reporter?: { username: string };
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  details?: any;
  created_at: string;
  admin?: { username: string; full_name: string | null };
}

interface CommunityRequest {
  id: string;
  community_name: string;
  description: string;
  icon?: string;
  topic?: string;
  status: string;
  created_at: string;
  user_id: string;
  rejection_reason?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  stated_purpose?: string;
  requester?: { username: string; full_name: string | null };
}

interface Post {
  id: string;
  title: string | null;
  content: string;
  upvotes: number;
  comment_count: number;
  created_at: string;
  is_pinned: boolean;
  is_announcement: boolean;
  is_reported?: boolean;
  is_flagged?: boolean;
  author_id?: string;
  community_id?: string;
  author?: { username: string; full_name: string | null };
  community?: { name: string; icon?: string };
}

interface Stats {
  users: number;
  posts: number;
  comments: number;
  communities: number;
  active_today: number;
  pending_reports: number;
  new_this_week: number;
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

type Tab = "overview" | "users" | "posts" | "communities" | "reports" | "audit" | "community_requests" | "security_vault";

const SkeletonLoader = ({ width = "100%", height = "20px", count = 1 }: any) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        style={{
          width,
          height,
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
      // Build queries based on role
      const isSuper = effectiveRole === "super_admin";
      const isAdmin = isAppAdmin(effectiveRole);
      const isMod = effectiveRole === "moderator";

      // Count queries (everyone)
      const countPromises = [
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("communities").select("*", { count: "exact", head: true }),
      ];

      // Users query
      const usersQuery = supabase
        .from("profiles")
        .select("id, username, full_name, profession, role, created_at, is_suspended, is_muted, is_banned, institution, study_year")
        .order("created_at", { ascending: false })
        .range(0, usersPerPage - 1);

      // Posts query
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

      // Communities query (admin+ only)
      const communitiesQuery = (isAdmin || isSuper)
        ? supabase.from("communities").select("*").order("created_at", { ascending: false })
        : Promise.resolve({ data: [] });

      // Reports query (admin+ and moderator)
      const reportsQuery = (isAdmin || isSuper || isMod)
        ? supabase.from("reports").select(`*`).order("created_at", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] });

      // Audit logs (super only)
      const auditQuery = isSuper
        ? supabase.from("audit_logs").select(`*, admin:admin_id(username, full_name)`).order("created_at", { ascending: false }).limit(100)
        : Promise.resolve({ data: [] });

      // Community requests (admin+ only)
      const requestsQuery = (isAdmin || isSuper)
        ? supabase.from("community_requests")
            .select(`*, requester:user_id(username, full_name)`)
            .order("created_at", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: [] });

      const [
        userCountRes, postCountRes, commentCountRes, communityCountRes,
        usersRes, postsRes, communitiesRes, reportsRes, auditRes, requestsRes,
      ] = await Promise.all([
        ...countPromises, usersQuery, postsQuery, communitiesQuery,
        reportsQuery, auditQuery, requestsQuery,
      ]);

      // Check for errors
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

      // Build activity feed
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

    // Delete in order: comments, posts, then profile
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
      .select(`id, title, content, upvotes, comment_count, created_at, is_pinned, is_announcement, is_reported, community:community_id(name)`)
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) console.error("fetchUserPosts error:", error);
    setUserPosts(data || []);
    setUserPostsLoading(false);
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    await logAudit("Deleted post", "post", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setUserPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function togglePostFlag(postId: string, currentStatus: boolean) {
    const { error } = await supabase.from("posts").update({ is_flagged: !currentStatus }).eq("id", postId);
    if (error) { alert("Failed: " + error.message); return; }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, is_flagged: !currentStatus } : p)));
  }

  async function dismissReport(reportId: string) {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function deleteReportedContent(reportId: string, targetId?: string) {
    const report = reports.find((r) => r.id === reportId);
    if (!report || !targetId) return;
    if (report.type === "post") {
      await supabase.from("posts").delete().eq("id", targetId);
    } else if (report.type === "comment") {
      await supabase.from("comments").delete().eq("id", targetId);
    }
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    await logAudit("Deleted reported content", report.type || "unknown", targetId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function toggleCommunityOfficial(communityId: string, currentStatus: boolean) {
    const { error } = await supabase.from("communities").update({ is_official: !currentStatus }).eq("id", communityId);
    if (error) { alert("Failed: " + error.message); return; }
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, is_official: !currentStatus } : c)));
  }

  async function toggleCommunityLock(communityId: string, currentStatus: boolean) {
    const { error } = await supabase.from("communities").update({ is_locked: !currentStatus }).eq("id", communityId);
    if (error) { alert("Failed: " + error.message); return; }
    await logAudit(!currentStatus ? "Locked community" : "Unlocked community", "community", communityId);
    setCommunities((prev) => prev.map((c) => (c.id === communityId ? { ...c, is_locked: !currentStatus } : c)));
  }

  async function deleteCommunity(communityId: string) {
    if (!confirm("DELETE this community and ALL its posts? This cannot be undone.")) return;
    if (!confirm("Are you absolutely sure?")) return;

    await supabase.from("comments").delete().in("post_id", 
      (await supabase.from("posts").select("id").eq("community_id", communityId)).data?.map((p: any) => p.id) || []
    );
    await supabase.from("posts").delete().eq("community_id", communityId);
    await supabase.from("community_members").delete().eq("community_id", communityId);
    await supabase.from("community_moderators").delete().eq("community_id", communityId);
    await supabase.from("communities").delete().eq("id", communityId);

    await logAudit("Deleted community", "community", communityId);
    setCommunities((prev) => prev.filter((c) => c.id !== communityId));
  }

  async function approveCommunityRequest(request: CommunityRequest) {
    setRequestActionLoading(request.id);
    try {
      const { error: createErr } = await supabase.from("communities").insert({
        name: request.community_name,
        description: request.description,
        icon: request.icon || "🏘️",
        creator_id: request.user_id,
        created_by: request.user_id,
        member_count: 1,
        post_count: 0,
        is_official: false,
        user_created: true,
      });
      if (createErr) throw createErr;

      await supabase.from("community_requests").update({ 
        status: "approved", 
        reviewed_by: currentUserId, 
        reviewed_at: new Date().toISOString() 
      }).eq("id", request.id);

      await logAudit(`Approved community request: ${request.community_name}`, "community_request", request.id);
      setCommunityRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "approved" } : r)));
      setPendingRequestCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      alert("Error approving: " + err.message);
    } finally {
      setRequestActionLoading(null);
    }
  }

  async function rejectCommunityRequest(request: CommunityRequest) {
    if (!rejectionReason.trim()) return;
    setRequestActionLoading(request.id);
    try {
      await supabase.from("community_requests").update({ 
        status: "rejected", 
        rejection_reason: rejectionReason.trim(),
        reviewed_by: currentUserId,
        reviewed_at: new Date().toISOString(),
      }).eq("id", request.id);

      await logAudit(`Rejected community request: ${request.community_name}`, "community_request", request.id);
      setCommunityRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status: "rejected", rejection_reason: rejectionReason.trim() } : r)));
      setPendingRequestCount((c) => Math.max(0, c - 1));
      setRejectingId(null); setRejectionReason("");
    } catch (err: any) {
      alert("Error rejecting: " + err.message);
    } finally {
      setRequestActionLoading(null);
    }
  }

  async function logAudit(action: string, targetType: string, targetId: string) {
    if (currentRole !== "super_admin" && !isAppAdmin(currentRole)) return;
    try {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action,
        target_type: targetType,
        target_id: targetId,
      });
    } catch (e) { console.error("Audit log failed:", e); }
  }

  async function downloadAuditCSV() {
    const csv = [
      ["Timestamp", "Admin", "Action", "Target Type", "Target ID"],
      ...auditLog.map((log) => [
        new Date(log.created_at).toLocaleString(),
        log.admin?.username || "Unknown",
        log.action,
        log.target_type,
        log.target_id,
      ]),
    ].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  }

  // Tab-based access control
  const getTabs = () => {
    const communityRequestTab = {
      key: "community_requests" as Tab,
      label: "🏗️ Community Requests",
      badge: pendingRequestCount,
    };

    if (currentRole === "super_admin") {
      return [
        { key: "overview" as Tab, label: "📊 Overview", badge: 0 },
        { key: "users" as Tab, label: "👥 Users", badge: 0 },
        { key: "posts" as Tab, label: "📝 Posts", badge: 0 },
        { key: "communities" as Tab, label: "🏘️ Communities", badge: 0 },
        { key: "reports" as Tab, label: "🚩 Reports", badge: stats.pending_reports },
        { key: "audit" as Tab, label: "📋 Audit Log", badge: 0 },
        { ...communityRequestTab },
        { key: "security_vault" as Tab, label: "🔐 Security Vault", badge: 0 },
      ];
    } else if (isAppAdmin(currentRole)) {
      return [
        { key: "overview" as Tab, label: "📊 Overview", badge: 0 },
        { key: "users" as Tab, label: "👥 Users", badge: 0 },
        { key: "posts" as Tab, label: "📝 Posts", badge: 0 },
        { key: "communities" as Tab, label: "🏘️ Communities", badge: 0 },
        { key: "reports" as Tab, label: "🚩 Reports", badge: stats.pending_reports },
        { ...communityRequestTab },
      ];
    } else {
      return [
        { key: "overview" as Tab, label: "📊 Overview", badge: 0 },
        { key: "reports" as Tab, label: "🚩 Reports", badge: stats.pending_reports },
        { key: "posts" as Tab, label: "📝 Posts", badge: 0 },
        { key: "communities" as Tab, label: "🏘️ Communities", badge: 0 },
      ];
    }
  };

  const filteredUsers = users.filter((u) => {
    const searchLower = searchUsers.toLowerCase();
    const matchesSearch =
      (u.username?.toLowerCase() ?? "").includes(searchLower) ||
      (u.full_name?.toLowerCase() ?? "").includes(searchLower) ||
      (u.institution?.toLowerCase() ?? "").includes(searchLower) ||
      (u.study_year?.toLowerCase() ?? "").includes(searchLower);
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesProfession = !filterProfession || u.profession === filterProfession;
    return matchesSearch && matchesRole && matchesProfession;
  });

  const filteredPosts = posts.filter((p) =>
    (p.title?.toLowerCase() ?? "").includes(searchPosts.toLowerCase()) ||
    (p.content?.toLowerCase() ?? "").includes(searchPosts.toLowerCase())
  );

  const filteredReports = reports.filter((r) => {
    const matchesType = !filterReportType || (r.type === filterReportType) || (r.violation_category === filterReportType);
    const matchesStatus = !filterReportStatus || r.status === filterReportStatus || (filterReportStatus === "open" && r.status === "pending");
    return matchesType && matchesStatus;
  });

  const filteredAuditLog = auditLog.filter((log) => {
    const matchesAdmin = !filterAuditAdmin || log.admin?.username === filterAuditAdmin;
    const matchesAction = !filterAuditAction || log.action.toLowerCase().includes(filterAuditAction.toLowerCase());
    return matchesAdmin && matchesAction;
  });

  const filteredRequests = communityRequests.filter((r) =>
    !filterRequestStatus || r.status === filterRequestStatus
  );

  const filteredCommunities = communities.filter((c) =>
    (c.name?.toLowerCase() ?? "").includes(searchCommunities.toLowerCase()) ||
    (c.description?.toLowerCase() ?? "").includes(searchCommunities.toLowerCase()) ||
    (c.slug?.toLowerCase() ?? "").includes(searchCommunities.toLowerCase())
  );

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
          <SkeletonLoader height="40px" width="200px" />
          <SkeletonLoader height="100px" width="100%" count={3} />
        </div>
      </AppShell>
    );
  }

  const cardStyle = {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "20px",
    marginBottom: "16px",
  };

  const statCard = (icon: React.ReactNode, label: string, value: number, growth?: number) => (
    <div style={{ ...cardStyle, display: "flex", alignItems: "flex-start", gap: "16px", flex: 1, minWidth: "180px" }}>
      <div style={{ fontSize: "24px" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginBottom: "4px" }}>{label}</p>
        <p style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", margin: 0, fontFamily: "var(--font-display)" }}>{value.toLocaleString()}</p>
        {growth !== undefined && (
          <p style={{ fontSize: "11px", color: growth > 0 ? "#059669" : "#DC2626", margin: "4px 0 0 0", display: "flex", alignItems: "center", gap: "4px" }}>
            <TrendingUp size={12} /> {growth > 0 ? "+" : ""}{growth}% this week
          </p>
        )}
      </div>
    </div>
  );

  const requestStatusColors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "#FFF8EC", color: "#F5A623" },
    approved: { bg: "#EDFFF5", color: "#3DBE7A" },
    rejected: { bg: "#FFF0F2", color: "#E8445A" },
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "20px" }}>
        {/* Error Banner */}
        {error && (
          <div style={{ ...cardStyle, background: "#FEE2E2", borderColor: "#FECACA", color: "#DC2626", marginBottom: "20px" }}>
            <p style={{ margin: 0, fontWeight: 600 }}>⚠️ {error}</p>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", margin: 0, marginBottom: "4px", display: "flex", alignItems: "center", gap: "12px" }}>
            <Shield size={28} color="#F5A623" /> Admin Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {currentRole === "super_admin" && "Super Admin"}
            {isAppAdmin(currentRole) && currentRole !== "super_admin" && "App Admin"}
            {currentRole === "moderator" && "Moderator"} Panel
          </p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", marginBottom: "24px", paddingBottom: "8px" }}>
          {getTabs().map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setUserPage(1); }}
              style={{
                padding: "10px 16px", borderRadius: "var(--radius-sm)",
                border: tab === t.key ? "2px solid #1ABC9C" : "1px solid var(--border)",
                background: tab === t.key ? "rgba(26, 188, 156, 0.1)" : "var(--surface)",
                color: tab === t.key ? "#1ABC9C" : "var(--text)",
                fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px",
                cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap",
                display: "flex", alignItems: "center", gap: "6px", position: "relative",
              }}
            >
              {t.label}
              {t.badge > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: "18px", height: "18px", padding: "0 5px", background: "#E8445A", color: "#fff", fontSize: "10px", fontWeight: 800, borderRadius: "9px", lineHeight: 1 }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {statCard("👥", "Total Users", stats.users, Math.round((stats.new_this_week / Math.max(stats.users, 1)) * 100) || 0)}
              {statCard("📝", "Total Posts", stats.posts, 0)}
              {statCard("💬", "Total Comments", stats.comments, 0)}
              {currentRole !== "moderator" && statCard("🏘️", "Communities", stats.communities, 0)}
              {statCard("⏰", "Active Today", stats.active_today, 0)}
              {statCard("🚩", "Pending Reports", stats.pending_reports, 0)}
              {isAppAdmin(currentRole) && statCard("🏗️", "Pending Requests", pendingRequestCount, 0)}
            </div>

            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0" }}>📜 Recent Activity</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentActivity.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No recent activity</p>
                ) : (
                  recentActivity.map((activity, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)" }}>
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>
                          {activity.type === "user" && "👤"}
                          {activity.type === "post" && "📝"}
                          {activity.type === "report" && "🚩"} {activity.message}
                        </p>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>{new Date(activity.timestamp).toLocaleDateString()}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Authority Matrix */}
            {(() => {
              const AUTHORITY_MATRIX: Record<string, { color: string; icon: string; permissions: string[] }> = {
                super_admin: { color: "#E8445A", icon: "🛡️", permissions: ["Global Wipes", "Master Decryption", "Permanent Bans", "Role Overrides"] },
                app_admin: { color: "#F5A623", icon: "⚙️", permissions: ["Community Approval", "Keyword Enforcement", "Workspace Locks", "Exam Freeze Controls"] },
                moderator: { color: "#2D87C8", icon: "🔎", permissions: ["Mute Members", "Review Reports", "Escalate Incidents", "Lock Communities"] },
                exco: { color: "#9B6DFF", icon: "📌", permissions: ["Pin Announcements", "Deploy Syllabus Templates"] },
              };
              return (
                <div style={{ ...cardStyle, marginTop: "24px" }}>
                  <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0" }}>🔐 Authority Matrix</h2>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
                    {Object.entries(AUTHORITY_MATRIX).map(([role, { color, icon, permissions }]) => (
                      <div key={role} style={{ border: `1px solid ${color}33`, borderRadius: "10px", padding: "14px", background: `${color}08`, opacity: currentRole === role || (role === "app_admin" && isAppAdmin(currentRole)) ? 1 : 0.6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                          <span style={{ fontSize: "18px" }}>{icon}</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color }}>{role.replace("_", " ")}</span>
                        </div>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                          {permissions.map((p) => (
                            <li key={p} style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ color, fontWeight: 700 }}>✓</span> {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input type="text" placeholder="Search users..." value={searchUsers} onChange={(e) => setSearchUsers(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
              </div>
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="exco">Exco</option>
                <option value="moderator">Moderator</option>
                <option value="app_admin">App Admin</option>
                <option value="admin">Admin (Legacy)</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <select value={filterProfession} onChange={(e) => setFilterProfession(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)", cursor: "pointer" }}>
                <option value="">All Professions</option>
                <option value="Medicine">Medicine</option>
                <option value="Nursing">Nursing</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredUsers.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No users found</p></div>
              ) : (
                filteredUsers.map((user) => (
                  <div key={user.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{user.full_name || user.username}</p>
                          {user.is_banned && <span style={{ padding: "2px 8px", background: "#7C2D12", color: "#FED7AA", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>BANNED</span>}
                          {user.is_suspended && <span style={{ padding: "2px 8px", background: "#FEE2E2", color: "#DC2626", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>SUSPENDED</span>}
                          {user.is_muted && <span style={{ padding: "2px 8px", background: "#FEF3C7", color: "#D97706", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>MUTED</span>}
                          <span style={{ padding: "2px 8px", background: roleColors[user.role]?.bg, color: roleColors[user.role]?.color, fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>{user.role?.toUpperCase()}</span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px 0" }}>
                          @{user.username} • {user.profession || "No profession"} • {user.institution || "No institution"} • Year {user.study_year || "?"} • Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        <button onClick={() => fetchUserPosts(user.id, user.username)} title="View posts"
                          style={{ padding: "8px 10px", background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Eye size={13} /> Posts
                        </button>

                        <select value={user.role || "student"} onChange={(e) => updateUserRole(user.id, e.target.value)}
                          style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", color: "var(--text)", fontSize: "12px", cursor: "pointer" }}>
                          <option value="student">Student</option>
                          <option value="exco">Exco</option>
                          <option value="moderator">Moderator</option>
                          {currentRole === "super_admin" && <option value="app_admin">App Admin</option>}
                          {currentRole === "super_admin" && <option value="super_admin">Super Admin</option>}
                        </select>

                        <button onClick={() => toggleUserMute(user.id, user.is_muted || false)} title={user.is_muted ? "Unmute" : "Mute"}
                          style={{ padding: "8px 10px", background: user.is_muted ? "#FEF3C7" : "var(--surface-2)", color: user.is_muted ? "#D97706" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          {user.is_muted ? <Volume2 size={13} /> : <VolumeX size={13} />}
                          {user.is_muted ? "Unmute" : "Mute"}
                        </button>

                        <button onClick={() => toggleUserSuspend(user.id, user.is_suspended || false)}
                          style={{ padding: "8px 10px", background: user.is_suspended ? "#D1FAE5" : "#FEE2E2", color: user.is_suspended ? "#059669" : "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                          {user.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>

                        {(currentRole === "super_admin" || isAppAdmin(currentRole)) && (
                          <button onClick={() => toggleUserBan(user.id, user.is_banned || false)} title={user.is_banned ? "Unban" : "Permanently Ban"}
                            style={{ padding: "8px 10px", background: user.is_banned ? "#ECFDF5" : "#7C2D12", color: user.is_banned ? "#059669" : "#FED7AA", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Ban size={13} /> {user.is_banned ? "Unban" : "Ban"}
                          </button>
                        )}

                        {currentRole === "super_admin" && (
                          <button onClick={() => deleteUserAccount(user.id)} title="Delete account"
                            style={{ padding: "8px 10px", background: "#450A0A", color: "#FECACA", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <UserX size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {userTotalCount > usersPerPage && (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "20px" }}>
                <button onClick={() => { const p = Math.max(1, userPage - 1); setUserPage(p); fetchUsersPage(p); }} disabled={userPage === 1}
                  style={{ padding: "8px 12px", background: userPage === 1 ? "var(--border)" : "var(--surface)", color: userPage === 1 ? "var(--text-muted)" : "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: userPage === 1 ? "not-allowed" : "pointer" }}>Previous</button>
                <span style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "13px" }}>Page {userPage} of {Math.ceil(userTotalCount / usersPerPage)}</span>
                <button onClick={() => { const maxP = Math.ceil(userTotalCount / usersPerPage); const p = userPage < maxP ? userPage + 1 : userPage; setUserPage(p); fetchUsersPage(p); }} disabled={userPage >= Math.ceil(userTotalCount / usersPerPage)}
                  style={{ padding: "8px 12px", background: userPage >= Math.ceil(userTotalCount / usersPerPage) ? "var(--border)" : "var(--surface)", color: userPage >= Math.ceil(userTotalCount / usersPerPage) ? "var(--text-muted)" : "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", cursor: userPage >= Math.ceil(userTotalCount / usersPerPage) ? "not-allowed" : "pointer" }}>Next</button>
              </div>
            )}
          </div>
        )}

        {/* USER POSTS MODAL */}
        {userPostsModal.open && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
            onClick={() => setUserPostsModal({ open: false, userId: "", username: "" })}>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", maxWidth: "700px", width: "100%", maxHeight: "80vh", overflow: "auto", padding: "24px" }}
              onClick={(e) => e.stopPropagation()}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "var(--text)" }}>📝 Posts by @{userPostsModal.username}</h2>
                <button onClick={() => setUserPostsModal({ open: false, userId: "", username: "" })}
                  style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--text-muted)" }}>×</button>
              </div>
              {userPostsLoading ? <SkeletonLoader count={3} height="60px" /> : userPosts.length === 0 ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center" }}>No posts found.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {userPosts.map((post) => (
                    <div key={post.id} style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <p style={{ margin: "0 0 4px 0", fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{post.title || "Untitled"}</p>
                      <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "var(--text-muted)" }}>{post.community?.name} • {post.upvotes || 0} upvotes • {post.comment_count || 0} comments</p>
                      <button onClick={() => deletePost(post.id)}
                        style={{ padding: "6px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div>
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" placeholder="Search posts by title or content..." value={searchPosts} onChange={(e) => setSearchPosts(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredPosts.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No posts found</p></div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} style={{ ...cardStyle, borderColor: post.is_reported ? "#FCA5A5" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{post.title || "Untitled"}</p>
                          {post.is_reported && <span style={{ padding: "2px 8px", background: "#FEE2E2", color: "#DC2626", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>REPORTED</span>}
                          {post.is_flagged && <span style={{ padding: "2px 8px", background: "#FFF8EC", color: "#F5A623", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>FLAGGED</span>}
                          {post.is_pinned && <span style={{ padding: "2px 8px", background: "#EBF5FF", color: "#2D87C8", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>PINNED</span>}
                          {post.is_announcement && <span style={{ padding: "2px 8px", background: "#FFF8EC", color: "#F5A623", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>ANNOUNCEMENT</span>}
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          By @{post.author?.username || "unknown"} in {post.community?.name || "unknown"} • {post.upvotes || 0} upvotes • {post.comment_count || 0} comments
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => togglePostFlag(post.id, post.is_flagged || false)}
                          style={{ padding: "8px 12px", background: post.is_flagged ? "#FFF8EC" : "var(--surface-2)", color: post.is_flagged ? "#F5A623" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          <Flag size={13} /> {post.is_flagged ? "Unflag" : "Flag"}
                        </button>
                        <button onClick={() => deletePost(post.id)}
                          style={{ padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMMUNITIES TAB */}
        {tab === "communities" && (
          <div>
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="text" placeholder="Search communities..." value={searchCommunities} onChange={(e) => setSearchCommunities(e.target.value)}
                style={{ width: "100%", padding: "10px 12px 10px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredCommunities.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No communities found</p></div>
              ) : (
                filteredCommunities.map((community) => (
                  <div key={community.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <p style={{ fontSize: "16px" }}>{community.icon || "🏘️"}</p>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{community.name}</p>
                          <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>r/{community.slug}</span>
                          {community.is_official && <span style={{ padding: "2px 8px", background: "#ECFDF5", color: "#059669", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>OFFICIAL</span>}
                          {community.is_featured && <span style={{ padding: "2px 8px", background: "#EBF5FF", color: "#2D87C8", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>FEATURED</span>}
                          {community.is_locked && <span style={{ padding: "2px 8px", background: "#FEE2E2", color: "#DC2626", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>LOCKED</span>}
                          {community.user_created && <span style={{ padding: "2px 8px", background: "#F5F0FF", color: "#9B6DFF", fontSize: "11px", fontWeight: 700, borderRadius: "4px" }}>USER CREATED</span>}
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>{community.description || "No description"}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          👥 {community.member_count || 0} members • 📝 {community.post_count || 0} posts • Created {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {(currentRole === "super_admin" || isAppAdmin(currentRole)) && (
                          <button onClick={() => toggleCommunityOfficial(community.id, community.is_official || false)}
                            style={{ padding: "8px 12px", background: community.is_official ? "#ECFDF5" : "var(--surface-2)", color: community.is_official ? "#059669" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>
                            {community.is_official ? "Unfeature" : "Feature"}
                          </button>
                        )}

                        <button onClick={() => toggleCommunityLock(community.id, community.is_locked || false)}
                          style={{ padding: "8px 12px", background: community.is_locked ? "#FEF3C7" : "var(--surface-2)", color: community.is_locked ? "#D97706" : "var(--text-muted)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                          {community.is_locked ? <Unlock size={13} /> : <Lock size={13} />}
                          {community.is_locked ? "Unlock" : "Lock"}
                        </button>

                        {(currentRole === "super_admin" || isAppAdmin(currentRole)) && (
                          <button onClick={() => deleteCommunity(community.id)}
                            style={{ padding: "8px 12px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {tab === "reports" && (
          <div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
              {(["All", "Open", "Resolved", "Escalated"] as const).map((f) => {
                const key = f.toLowerCase() === "all" ? "" : f.toLowerCase();
                const active = filterReportStatus === key;
                return (
                  <button key={f} onClick={() => setFilterReportStatus(key)}
                    style={{ padding: "7px 16px", borderRadius: "20px", border: active ? "none" : "1px solid var(--border)", background: active ? "var(--primary)" : "var(--surface)", color: active ? "#fff" : "var(--text)", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}>
                    {f}
                  </button>
                );
              })}
              <select value={filterReportType} onChange={(e) => setFilterReportType(e.target.value)}
                style={{ padding: "7px 12px", border: "1px solid var(--border)", borderRadius: "20px", background: "var(--surface)", color: "var(--text)", fontSize: "13px", cursor: "pointer", marginLeft: "auto" }}>
                <option value="">All Violations</option>
                <option value="cyberbullying">Cyberbullying</option>
                <option value="exam_leak">Exam Leak</option>
                <option value="harassment">Harassment</option>
                <option value="spam">Spam</option>
                <option value="misinformation">Misinformation</option>
                <option value="post">Post</option>
                <option value="comment">Comment</option>
                <option value="user">User</option>
              </select>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border)" }}>
                      {["Community", "Violation", "Preview", "Status", "Date", "Actions"].map((col) => (
                        <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReports.length === 0 ? (
                      <tr><td colSpan={6} style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No incidents found</td></tr>
                    ) : (
                      filteredReports.map((report) => {
                        const violationColor: Record<string, string> = { cyberbullying: "#E8445A", exam_leak: "#F5A623", harassment: "#E8445A", spam: "#9B6DFF", misinformation: "#2D87C8" };
                        const violation = report.violation_category || report.type || "—";
                        const vColor = violationColor[violation] ?? "var(--text-muted)";
                        const statusColor = report.status === "pending" || report.status === "open" ? { bg: "#FEE2E2", text: "#DC2626" } : report.status === "escalated" ? { bg: "#FFF8EC", text: "#F5A623" } : { bg: "#ECFDF5", text: "#059669" };
                        return (
                          <tr key={report.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 14px", color: "var(--text)", fontWeight: 600 }}>
                              {report.originating_community_id ? `r/${report.originating_community_id}` : "—"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ padding: "2px 8px", background: `${vColor}18`, color: vColor, borderRadius: "4px", fontWeight: 700, fontSize: "11px", textTransform: "capitalize" }}>
                                {violation.replace("_", " ")}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--text-muted)", maxWidth: "200px" }}>
                              <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {report.content_preview || report.content?.substring(0, 80) || report.reason || "—"}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ padding: "2px 8px", background: statusColor.bg, color: statusColor.text, borderRadius: "4px", fontWeight: 700, fontSize: "11px", textTransform: "uppercase" }}>
                                {report.status === "pending" ? "OPEN" : report.status?.toUpperCase()}
                              </span>
                            </td>
                            <td style={{ padding: "10px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{new Date(report.created_at).toLocaleDateString()}</td>
                            <td style={{ padding: "10px 14px" }}>
                              {(report.status === "pending" || report.status === "open") && (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button onClick={() => deleteReportedContent(report.id, report.target_id)}
                                    style={{ padding: "5px 10px", background: "#FEE2E2", color: "#DC2626", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Delete</button>
                                  <button onClick={() => dismissReport(report.id)}
                                    style={{ padding: "5px 10px", background: "var(--surface-2)", color: "var(--text)", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>Dismiss</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === "audit" && currentRole === "super_admin" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <select value={filterAuditAdmin} onChange={(e) => setFilterAuditAdmin(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", cursor: "pointer" }}>
                <option value="">All Admins</option>
                {[...new Set(auditLog.map((log) => log.admin?.username).filter(Boolean))].map((admin) => (
                  <option key={admin} value={admin}>{admin}</option>
                ))}
              </select>
              <button onClick={downloadAuditCSV}
                style={{ padding: "10px 12px", background: "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)", color: "white", border: "none", borderRadius: "var(--radius-sm)", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAuditLog.length === 0 ? (
                <div style={cardStyle}><p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No audit logs found</p></div>
              ) : (
                filteredAuditLog.map((log) => (
                  <div key={log.id} style={{ ...cardStyle, padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>@{log.admin?.username || "Unknown"} • {log.action}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{log.target_type.toUpperCase()} • {new Date(log.created_at).toLocaleString()}</p>
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", padding: "2px 8px", background: "var(--surface-2)", borderRadius: "4px" }}>{log.target_id?.substring(0, 8)}...</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMMUNITY REQUESTS TAB */}
        {tab === "community_requests" && (currentRole === "super_admin" || isAppAdmin(currentRole)) && (
          <div>
            <div style={{ marginBottom: "20px" }}>
              <select value={filterRequestStatus} onChange={(e) => setFilterRequestStatus(e.target.value)}
                style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--text)", fontFamily: "var(--font-body)", cursor: "pointer", fontSize: "13px" }}>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="">All</option>
              </select>
            </div>

            {filteredRequests.length === 0 ? (
              <div style={cardStyle}>
                <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                  {filterRequestStatus === "pending" ? "No pending requests — you're all caught up." : "No requests found."}
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {filteredRequests.map((req) => (
                  <div key={req.id} style={{ ...cardStyle, borderColor: req.status === "pending" ? "#F5A623" : req.status === "approved" ? "#3DBE7A" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "20px" }}>{req.icon || "🏘️"}</span>
                          <p style={{ fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: 0 }}>{req.community_name}</p>
                          <span style={{ padding: "2px 8px", background: requestStatusColors[req.status]?.bg, color: requestStatusColors[req.status]?.color, fontSize: "11px", fontWeight: 700, borderRadius: "4px", textTransform: "uppercase" }}>{req.status}</span>
                          {req.topic && <span style={{ padding: "2px 8px", background: "var(--surface-2)", color: "var(--text-muted)", fontSize: "11px", borderRadius: "4px" }}>{req.topic}</span>}
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 8px 0", lineHeight: 1.5 }}>{req.description}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          Requested by <strong style={{ color: "var(--text)" }}>@{req.requester?.username || "unknown"}</strong> ({req.requester?.full_name}) • {new Date(req.created_at).toLocaleDateString()}
                        </p>
                        {req.stated_purpose && <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "4px 0 0 0" }}>Purpose: {req.stated_purpose}</p>}
                        {req.status === "rejected" && req.rejection_reason && (
                          <p style={{ fontSize: "12px", color: "#E8445A", margin: "8px 0 0 0", padding: "8px 10px", background: "#FFF0F2", borderRadius: "var(--radius-sm)" }}>Rejection reason: {req.rejection_reason}</p>
                        )}

                        {rejectingId === req.id && (
                          <div style={{ marginTop: "12px" }}>
                            <textarea placeholder="Reason for rejection (required)..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={2}
                              style={{ width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface-2)", color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                              <button onClick={() => rejectCommunityRequest(req)} disabled={!rejectionReason.trim() || requestActionLoading === req.id}
                                style={{ padding: "8px 14px", background: !rejectionReason.trim() || requestActionLoading === req.id ? "var(--border)" : "#E8445A", color: !rejectionReason.trim() || requestActionLoading === req.id ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: !rejectionReason.trim() || requestActionLoading === req.id ? "not-allowed" : "pointer" }}>
                                {requestActionLoading === req.id ? "Rejecting..." : "Confirm Rejection"}
                              </button>
                              <button onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                                style={{ padding: "8px 14px", background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}>Cancel</button>
                            </div>
                          </div>
                        )}
                      </div>

                      {req.status === "pending" && rejectingId !== req.id && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                          <button onClick={() => approveCommunityRequest(req)} disabled={requestActionLoading === req.id}
                            style={{ padding: "8px 16px", background: requestActionLoading === req.id ? "var(--border)" : "#3DBE7A", color: requestActionLoading === req.id ? "var(--text-muted)" : "#fff", border: "none", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: requestActionLoading === req.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Check size={13} /> {requestActionLoading === req.id ? "Approving..." : "Approve"}
                          </button>
                          <button onClick={() => { setRejectingId(req.id); setRejectionReason(""); }}
                            style={{ padding: "8px 16px", background: "#FFF0F2", color: "#E8445A", border: "1px solid #E8445A", borderRadius: "var(--radius-sm)", fontSize: "12px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                            <X size={13} /> Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SECURITY VAULT TAB */}
        {tab === "security_vault" && currentRole === "super_admin" && (
          <div>
            {!vaultUnlocked ? (
              <div style={{ maxWidth: "480px", margin: "40px auto" }}>
                <div style={{ ...cardStyle, textAlign: "center" }}>
                  <div style={{ fontSize: "48px", marginBottom: "12px" }}>🔐</div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)", margin: "0 0 6px 0" }}>Security Vault</h2>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: "0 0 24px 0" }}>Access to encrypted message audits is restricted. Enter your master password and log your reason.</p>

                  {vaultError && (
                    <div style={{ background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "8px", padding: "10px 14px", marginBottom: "16px", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>⚠️ {vaultError}</div>
                  )}

                  <div style={{ marginBottom: "14px", textAlign: "left" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Master Security Password</label>
                    <div style={{ position: "relative" }}>
                      <input type={vaultShowPassword ? "text" : "password"} value={vaultPassword} onChange={(e) => setVaultPassword(e.target.value)} placeholder="Enter master password"
                        style={{ width: "100%", padding: "10px 42px 10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "14px", boxSizing: "border-box" }} />
                      <button onClick={() => setVaultShowPassword((v) => !v)}
                        style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "2px" }}>
                        {vaultShowPassword ? "🙈" : "👁️"}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: "20px", textAlign: "left" }}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px" }}>Justification Log Entry</label>
                    <textarea rows={3} value={vaultJustification} onChange={(e) => setVaultJustification(e.target.value)} placeholder="Why are you accessing the security vault? (min. 10 characters)"
                      style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "8px", background: "var(--bg)", color: "var(--text)", fontSize: "13px", resize: "vertical", boxSizing: "border-box" }} />
                    <div style={{ fontSize: "11px", color: vaultJustification.length >= 10 ? "#059669" : "var(--text-muted)", marginTop: "4px", textAlign: "right" }}>{vaultJustification.length}/10 min</div>
                  </div>

                  <button disabled={vaultLoading || vaultPassword.length === 0 || vaultJustification.length < 10}
                    onClick={async () => {
                      setVaultLoading(true); setVaultError("");
                      try {
                        const res = await fetch("/api/vault-auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: vaultPassword }) });
                        const json = await res.json();
                        if (!res.ok || !json.success) { setVaultError(json.message || "Incorrect password."); }
                        else {
                          await supabase.from("vault_access_logs").insert({ admin_id: currentUserId, justification: vaultJustification, accessed_at: new Date().toISOString() });
                          await supabase.from("audit_logs").insert({ admin_id: currentUserId, action: "vault_access", details: { justification: vaultJustification }, created_at: new Date().toISOString() });
                          setVaultAuditsLoading(true);
                          const { data } = await supabase.from("encrypted_message_audits").select("*").order("created_at", { ascending: false }).limit(200);
                          setVaultAudits(data ?? []); setVaultAuditsLoading(false); setVaultUnlocked(true); setVaultPassword("");
                        }
                      } catch { setVaultError("Network error — could not reach authentication server."); }
                      finally { setVaultLoading(false); }
                    }}
                    style={{ width: "100%", padding: "12px", background: vaultLoading || vaultPassword.length === 0 || vaultJustification.length < 10 ? "var(--border)" : "#E8445A", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 800, fontSize: "14px", cursor: vaultLoading || vaultPassword.length === 0 || vaultJustification.length < 10 ? "not-allowed" : "pointer" }}>
                    {vaultLoading ? "Authenticating…" : "🔓 Unlock Vault"}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--text)", margin: 0 }}>🔓 Encrypted Message Audits</h2>
                    <p style={{ fontSize: "12px", color: "#059669", margin: "4px 0 0 0", fontWeight: 600 }}>✓ Vault unlocked — session active</p>
                  </div>
                  <button onClick={() => { setVaultUnlocked(false); setVaultAudits([]); setVaultJustification(""); }}
                    style={{ padding: "10px 18px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "8px", fontWeight: 800, fontSize: "13px", cursor: "pointer" }}>🔐 Re-encrypt Vault</button>
                </div>
                <div style={{ ...cardStyle, padding: 0, overflow: "hidden" }}>
                  {vaultAuditsLoading ? <p style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>Loading audits…</p> : vaultAudits.length === 0 ? (
                    <p style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>No flagged messages found.</p>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ background: "var(--surface-2)", borderBottom: "2px solid var(--border)" }}>
                            {["Sender", "Recipient", "Keyword", "Encrypted Message", "Date", "Actions"].map((col) => (
                              <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "var(--text-muted)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {vaultAudits.map((audit) => (
                            <tr key={audit.id} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "10px 14px", fontWeight: 600, color: "var(--text)" }}>
                                {audit.sender_id ? (
                                  <span style={{ padding: "2px 8px", background: "#F5F0FF", color: "#9B6DFF", borderRadius: "4px", fontSize: "12px" }}>
                                    {audit.is_anonymous ? "Anonymous" : `@${audit.sender_username ?? audit.sender_id}`}
                                  </span>
                                ) : "—"}
                              </td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)" }}>{audit.recipient_id ? `@${audit.recipient_username ?? audit.recipient_id}` : "—"}</td>
                              <td style={{ padding: "10px 14px" }}>
                                <span style={{ padding: "2px 8px", background: "#FFF8EC", color: "#F5A623", borderRadius: "4px", fontWeight: 700, fontSize: "12px" }}>{audit.flagged_keyword ?? "—"}</span>
                              </td>
                              <td style={{ padding: "10px 14px", maxWidth: "260px" }}>
                                <code style={{ fontSize: "11px", background: "var(--surface-2)", padding: "3px 6px", borderRadius: "4px", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#E8445A" }}>{audit.encrypted_message ?? "—"}</code>
                              </td>
                              <td style={{ padding: "10px 14px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{audit.created_at ? new Date(audit.created_at).toLocaleDateString() : "—"}</td>
                              <td style={{ padding: "10px 14px" }}>
                                {audit.is_anonymous && (
                                  <button onClick={async () => {
                                    const reason = prompt("Enter reason for revealing this identity:");
                                    if (!reason || reason.trim().length < 5) { alert("Please provide a valid reason (min 5 characters)."); return; }
                                    await supabase.from("identity_reveal_logs").insert({ admin_id: currentUserId, target_message: audit.id, reason: reason.trim(), created_at: new Date().toISOString() });
                                    await supabase.from("audit_logs").insert({ admin_id: currentUserId, action: "identity_reveal", details: { target_message: audit.id, reason: reason.trim() }, created_at: new Date().toISOString() });
                                    alert(`Identity revealed and logged.\nSender ID: ${audit.sender_id}`);
                                  }}
                                    style={{ padding: "5px 10px", background: "#FEE2E2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "6px", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>👤 Reveal Identity</button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </AppShell>
  );
}
