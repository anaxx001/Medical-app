import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useLocation } from "wouter";
import {
  Users,
  FileText,
  MessageSquare,
  Trash2,
  ChevronDown,
  TrendingUp,
  AlertCircle,
  Shield,
  LogOut,
  Eye,
  Lock,
  Download,
  Filter,
  Search,
  Check,
  X,
  Flag,
  Award,
  Clock,
  GitPullRequest,
} from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  profession: string;
  role: string;
  created_at: string;
  is_suspended?: boolean;
  post_count?: number;
}

interface Community {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  member_count: number;
  post_count: number;
  created_at: string;
  creator_id: string;
  is_official?: boolean;
  is_featured?: boolean;
}

interface Report {
  id: string;
  type: "post" | "comment" | "user";
  target_id: string;
  reported_by_id: string;
  reason: string;
  created_at: string;
  status: "pending" | "resolved";
  content?: string;
  reported_user?: Profile;
  reporter?: Profile;
}

interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
  admin?: Profile;
}

interface CommunityRequest {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category?: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  requester_id: string;
  requester?: {
    username: string;
    full_name: string;
  };
  rejection_reason?: string;
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

const roleColors: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
  admin: { bg: "#FFF8EC", color: "#F5A623" },
  moderator: { bg: "#EBF5FF", color: "#2D87C8" },
  exco: { bg: "#F5F0FF", color: "#9B6DFF" },
  student: { bg: "#EDFFF5", color: "#3DBE7A" },
};

type Tab = "overview" | "users" | "posts" | "communities" | "reports" | "audit" | "community_requests";

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
    users: 0,
    posts: 0,
    comments: 0,
    communities: 0,
    active_today: 0,
    pending_reports: 0,
    new_this_week: 0,
  });

  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLog[]>([]);
  const [communityRequests, setCommunityRequests] = useState<CommunityRequest[]>([]);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Community request action state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

  // Filter states
  const [searchUsers, setSearchUsers] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterProfession, setFilterProfession] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [searchPosts, setSearchPosts] = useState("");
  const [filterReportType, setFilterReportType] = useState("");
  const [filterReportStatus, setFilterReportStatus] = useState("");
  const [filterAuditAdmin, setFilterAuditAdmin] = useState("");
  const [filterAuditAction, setFilterAuditAction] = useState("");
  const [filterRequestStatus, setFilterRequestStatus] = useState("pending");

  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || !["admin", "moderator", "super_admin"].includes(profile.role)) {
        navigate("/");
        return;
      }

      setCurrentRole(profile.role);
      setCurrentUserId(user.id);
      fetchAllData(profile.role, user.id);
    }

    checkAuth();
  }, []);

  async function fetchAllData(role?: string, userId?: string) {
    const effectiveRole = role || currentRole;
    const effectiveUserId = userId || currentUserId;

    setLoading(true);
    try {
      const [
        userCountRes,
        postCountRes,
        commentCountRes,
        communityCountRes,
        usersRes,
        postsRes,
        communitiesRes,
        reportsRes,
        auditRes,
        communityRequestsRes,
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("communities").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id, username, full_name, profession, role, created_at, is_suspended")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("posts")
          .select(
            `id, title, content, upvotes, comment_count, created_at, is_pinned, is_announcement, is_reported,
            author:author_id(username, full_name),
            community:community_id(name, icon)`
          )
          .order("created_at", { ascending: false })
          .limit(100),
        ["super_admin", "admin"].includes(effectiveRole)
          ? supabase
              .from("communities")
              .select("*")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        ["super_admin", "admin", "moderator"].includes(effectiveRole)
          ? supabase
              .from("reports")
              .select(`*, reported_user:target_id(username), reporter:reported_by_id(username)`)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }),
        effectiveRole === "super_admin"
          ? supabase
              .from("audit_logs")
              .select(`*, admin:admin_id(username, full_name)`)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }),
        ["super_admin", "admin"].includes(effectiveRole)
          ? supabase
              .from("community_requests")
              .select(`*, requester:requester_id(username, full_name)`)
              .order("created_at", { ascending: false })
              .limit(200)
          : Promise.resolve({ data: [] }),
      ]);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const newThisWeek = (usersRes.data || []).filter(
        (u: any) => new Date(u.created_at) > weekAgo
      ).length;

      const pendingReports = (reportsRes.data || []).filter((r: any) => r.status === "pending").length;
      const pendingRequests = (communityRequestsRes.data || []).filter(
        (r: any) => r.status === "pending"
      ).length;

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
      setPosts(postsRes.data || []);
      setCommunities((communitiesRes.data as Community[]) || []);
      setReports(reportsRes.data || []);
      setAuditLog(auditRes.data || []);
      setCommunityRequests((communityRequestsRes.data as CommunityRequest[]) || []);
      setPendingRequestCount(pendingRequests);

      const activity: any[] = [];

      (usersRes.data || []).slice(0, 5).forEach((u: any) => {
        activity.push({
          type: "user",
          message: `New user: ${u.full_name}`,
          timestamp: u.created_at,
        });
      });

      (postsRes.data || []).slice(0, 5).forEach((p: any) => {
        activity.push({
          type: "post",
          message: `New post: "${p.title?.substring(0, 40)}..."`,
          timestamp: p.created_at,
        });
      });

      (reportsRes.data || []).slice(0, 5).forEach((r: any) => {
        activity.push({
          type: "report",
          message: `Report: ${r.type}`,
          timestamp: r.created_at,
        });
      });

      setRecentActivity(
        activity
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 10)
      );
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: string) {
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);

    if (currentRole === "super_admin") {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action: `Changed role to ${newRole}`,
        target_type: "user",
        target_id: userId,
      });
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  }

  async function toggleUserSuspend(userId: string, currentStatus: boolean) {
    await supabase.from("profiles").update({ is_suspended: !currentStatus }).eq("id", userId);

    if (currentRole === "super_admin") {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action: !currentStatus ? "Suspended user" : "Unsuspended user",
        target_type: "user",
        target_id: userId,
      });
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, is_suspended: !currentStatus } : u))
    );
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post?")) return;

    await supabase.from("posts").delete().eq("id", postId);

    if (currentRole === "super_admin") {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action: "Deleted post",
        target_type: "post",
        target_id: postId,
      });
    }

    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }

  async function dismissReport(reportId: string) {
    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function deleteReportedContent(reportId: string, targetId: string) {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return;

    if (report.type === "post") {
      await supabase.from("posts").delete().eq("id", targetId);
    } else if (report.type === "comment") {
      await supabase.from("comments").delete().eq("id", targetId);
    }

    await supabase.from("reports").update({ status: "resolved" }).eq("id", reportId);
    setReports((prev) => prev.filter((r) => r.id !== reportId));
  }

  async function toggleCommunityOfficial(communityId: string, currentStatus: boolean) {
    await supabase.from("communities").update({ is_official: !currentStatus }).eq("id", communityId);
    setCommunities((prev) =>
      prev.map((c) => (c.id === communityId ? { ...c, is_official: !currentStatus } : c))
    );
  }

  async function approveCommunityRequest(request: CommunityRequest) {
    setRequestActionLoading(request.id);
    try {
      // Create the community
      const { error: createErr } = await supabase.from("communities").insert({
        name: request.name,
        description: request.description,
        icon: request.icon || "🏘️",
        creator_id: request.requester_id,
        member_count: 1,
        post_count: 0,
        is_official: false,
      });

      if (createErr) throw createErr;

      // Mark request approved
      await supabase
        .from("community_requests")
        .update({ status: "approved" })
        .eq("id", request.id);

      if (currentRole === "super_admin") {
        await supabase.from("audit_logs").insert({
          admin_id: currentUserId,
          action: `Approved community request: ${request.name}`,
          target_type: "community_request",
          target_id: request.id,
        });
      }

      setCommunityRequests((prev) =>
        prev.map((r) => (r.id === request.id ? { ...r, status: "approved" } : r))
      );
      setPendingRequestCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Error approving request:", err);
    } finally {
      setRequestActionLoading(null);
    }
  }

  async function rejectCommunityRequest(request: CommunityRequest) {
    if (!rejectionReason.trim()) return;
    setRequestActionLoading(request.id);
    try {
      await supabase
        .from("community_requests")
        .update({ status: "rejected", rejection_reason: rejectionReason.trim() })
        .eq("id", request.id);

      if (currentRole === "super_admin") {
        await supabase.from("audit_logs").insert({
          admin_id: currentUserId,
          action: `Rejected community request: ${request.name}`,
          target_type: "community_request",
          target_id: request.id,
        });
      }

      setCommunityRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? { ...r, status: "rejected", rejection_reason: rejectionReason.trim() }
            : r
        )
      );
      setPendingRequestCount((c) => Math.max(0, c - 1));
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setRequestActionLoading(null);
    }
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
    ]
      .map((row) => row.join(","))
      .join("\n");

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
      key: "community_requests",
      label: "🏗️ Community Requests",
      badge: pendingRequestCount,
    };

    if (currentRole === "super_admin") {
      return [
        { key: "overview", label: "📊 Overview", badge: 0 },
        { key: "users", label: "👥 Users", badge: 0 },
        { key: "posts", label: "📝 Posts", badge: 0 },
        { key: "communities", label: "🏘️ Communities", badge: 0 },
        { key: "reports", label: "🚩 Reports", badge: stats.pending_reports },
        { key: "audit", label: "📋 Audit Log", badge: 0 },
        { ...communityRequestTab },
      ];
    } else if (currentRole === "admin") {
      return [
        { key: "overview", label: "📊 Overview", badge: 0 },
        { key: "users", label: "👥 Users", badge: 0 },
        { key: "posts", label: "📝 Posts", badge: 0 },
        { key: "communities", label: "🏘️ Communities", badge: 0 },
        { key: "reports", label: "🚩 Reports", badge: stats.pending_reports },
        { ...communityRequestTab },
      ];
    } else {
      return [
        { key: "reports", label: "🚩 Reports", badge: stats.pending_reports },
        { key: "posts", label: "📝 Posts", badge: 0 },
      ];
    }
  };

  const usersPerPage = 20;
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchUsers.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesProfession = !filterProfession || u.profession === filterProfession;
    return matchesSearch && matchesRole && matchesProfession;
  });

  const paginatedUsers = filteredUsers.slice(
    (userPage - 1) * usersPerPage,
    userPage * usersPerPage
  );

  const filteredPosts = posts.filter((p) =>
    p.title.toLowerCase().includes(searchPosts.toLowerCase())
  );

  const filteredReports = reports.filter((r) => {
    const matchesType = !filterReportType || r.type === filterReportType;
    const matchesStatus = !filterReportStatus || r.status === filterReportStatus;
    return matchesType && matchesStatus;
  });

  const filteredAuditLog = auditLog.filter((log) => {
    const matchesAdmin = !filterAuditAdmin || log.admin?.username === filterAuditAdmin;
    const matchesAction =
      !filterAuditAction ||
      log.action.toLowerCase().includes(filterAuditAction.toLowerCase());
    return matchesAdmin && matchesAction;
  });

  const filteredRequests = communityRequests.filter((r) =>
    !filterRequestStatus || r.status === filterRequestStatus
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
    <div
      style={{
        ...cardStyle,
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        flex: 1,
        minWidth: "180px",
      }}
    >
      <div style={{ fontSize: "24px" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <p
          style={{
            fontSize: "12px",
            color: "var(--text-muted)",
            margin: 0,
            marginBottom: "4px",
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "28px",
            fontWeight: 800,
            color: "var(--text)",
            margin: 0,
            fontFamily: "var(--font-display)",
          }}
        >
          {value.toLocaleString()}
        </p>
        {growth !== undefined && (
          <p
            style={{
              fontSize: "11px",
              color: growth > 0 ? "#059669" : "#DC2626",
              margin: "4px 0 0 0",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <TrendingUp size={12} /> {growth > 0 ? "+" : ""}
            {growth}% this week
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
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              color: "var(--text)",
              margin: 0,
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Shield size={28} color="#F5A623" /> Admin Dashboard
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
            {currentRole === "super_admin" && "Super Admin"}
            {currentRole === "admin" && "Administrator"}
            {currentRole === "moderator" && "Moderator"} Panel
          </p>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            overflowX: "auto",
            marginBottom: "24px",
            paddingBottom: "8px",
          }}
        >
          {getTabs().map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as Tab);
                setUserPage(1);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: tab === t.key ? "2px solid #1ABC9C" : "1px solid var(--border)",
                background:
                  tab === t.key ? "rgba(26, 188, 156, 0.1)" : "var(--surface)",
                color: tab === t.key ? "#1ABC9C" : "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                position: "relative",
              }}
            >
              {t.label}
              {t.badge > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "18px",
                    height: "18px",
                    padding: "0 5px",
                    background: "#E8445A",
                    color: "#fff",
                    fontSize: "10px",
                    fontWeight: 800,
                    borderRadius: "9px",
                    lineHeight: 1,
                  }}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              {statCard(
                "👥",
                "Total Users",
                stats.users,
                Math.round((stats.new_this_week / stats.users) * 100) || 0
              )}
              {statCard("📝", "Total Posts", stats.posts, 0)}
              {statCard("💬", "Total Comments", stats.comments, 0)}
              {currentRole !== "moderator" &&
                statCard("🏘️", "Communities", stats.communities, 0)}
              {statCard("⏰", "Active Today", stats.active_today, 0)}
              {statCard("🚩", "Pending Reports", stats.pending_reports, 0)}
              {["super_admin", "admin"].includes(currentRole) &&
                statCard("🏗️", "Pending Requests", pendingRequestCount, 0)}
            </div>

            <div style={cardStyle}>
              <h2
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: "0 0 16px 0",
                }}
              >
                📜 Recent Activity
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentActivity.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                    No recent activity
                  </p>
                ) : (
                  recentActivity.map((activity, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        background: "var(--surface-2)",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: 0 }}>
                          {activity.type === "user" && "👤"}
                          {activity.type === "post" && "📝"}
                          {activity.type === "report" && "🚩"} {activity.message}
                        </p>
                      </div>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div style={{ position: "relative" }}>
                <Search
                  size={14}
                  style={{
                    position: "absolute",
                    left: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchUsers}
                  onChange={(e) => setSearchUsers(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 36px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontFamily: "var(--font-body)",
                  }}
                />
              </div>

              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                <option value="">All Roles</option>
                <option value="student">Student</option>
                <option value="exco">Exco</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>

              <select
                value={filterProfession}
                onChange={(e) => setFilterProfession(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                  cursor: "pointer",
                }}
              >
                <option value="">All Professions</option>
                <option value="Medicine">Medicine</option>
                <option value="Nursing">Nursing</option>
                <option value="Pharmacy">Pharmacy</option>
                <option value="Dentistry">Dentistry</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {paginatedUsers.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    No users found
                  </p>
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div key={user.id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--text)",
                              margin: 0,
                            }}
                          >
                            {user.full_name || user.username}
                          </p>
                          {user.is_suspended && (
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "#FEE2E2",
                                color: "#DC2626",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                              }}
                            >
                              SUSPENDED
                            </span>
                          )}
                          <span
                            style={{
                              padding: "2px 8px",
                              background: roleColors[user.role]?.bg,
                              color: roleColors[user.role]?.color,
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: "4px",
                            }}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            margin: "0 0 4px 0",
                          }}
                        >
                          @{user.username} • {user.profession} • Joined{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value)}
                          style={{
                            padding: "8px 10px",
                            border: "1px solid var(--border)",
                            borderRadius: "var(--radius-sm)",
                            background: "var(--surface-2)",
                            color: "var(--text)",
                            fontSize: "12px",
                            cursor: "pointer",
                          }}
                        >
                          <option value="student">Student</option>
                          <option value="exco">Exco</option>
                          <option value="moderator">Moderator</option>
                          {currentRole === "super_admin" && (
                            <option value="admin">Admin</option>
                          )}
                          {currentRole === "super_admin" && (
                            <option value="super_admin">Super Admin</option>
                          )}
                        </select>

                        <button
                          onClick={() =>
                            toggleUserSuspend(user.id, user.is_suspended || false)
                          }
                          style={{
                            padding: "8px 12px",
                            background: user.is_suspended ? "#D1FAE5" : "#FEE2E2",
                            color: user.is_suspended ? "#059669" : "#DC2626",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {user.is_suspended ? "Unsuspend" : "Suspend"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {filteredUsers.length > usersPerPage && (
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "center",
                  marginTop: "20px",
                }}
              >
                <button
                  onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                  disabled={userPage === 1}
                  style={{
                    padding: "8px 12px",
                    background: userPage === 1 ? "var(--border)" : "var(--surface)",
                    color: userPage === 1 ? "var(--text-muted)" : "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: userPage === 1 ? "not-allowed" : "pointer",
                  }}
                >
                  Previous
                </button>
                <span
                  style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "13px" }}
                >
                  Page {userPage} of {Math.ceil(filteredUsers.length / usersPerPage)}
                </span>
                <button
                  onClick={() =>
                    setUserPage((p) =>
                      p < Math.ceil(filteredUsers.length / usersPerPage) ? p + 1 : p
                    )
                  }
                  disabled={userPage >= Math.ceil(filteredUsers.length / usersPerPage)}
                  style={{
                    padding: "8px 12px",
                    background:
                      userPage >= Math.ceil(filteredUsers.length / usersPerPage)
                        ? "var(--border)"
                        : "var(--surface)",
                    color:
                      userPage >= Math.ceil(filteredUsers.length / usersPerPage)
                        ? "var(--text-muted)"
                        : "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor:
                      userPage >= Math.ceil(filteredUsers.length / usersPerPage)
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* POSTS TAB */}
        {tab === "posts" && (
          <div>
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <Search
                size={14}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Search posts..."
                value={searchPosts}
                onChange={(e) => setSearchPosts(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 36px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredPosts.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    No posts found
                  </p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div
                    key={post.id}
                    style={{
                      ...cardStyle,
                      borderColor: post.is_reported ? "#FCA5A5" : "var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--text)",
                              margin: 0,
                            }}
                          >
                            {post.title}
                          </p>
                          {post.is_reported && (
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "#FEE2E2",
                                color: "#DC2626",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                              }}
                            >
                              REPORTED
                            </span>
                          )}
                          {post.is_pinned && (
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "#EBF5FF",
                                color: "#2D87C8",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                              }}
                            >
                              PINNED
                            </span>
                          )}
                          {post.is_announcement && (
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "#FFF8EC",
                                color: "#F5A623",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                              }}
                            >
                              ANNOUNCEMENT
                            </span>
                          )}
                        </div>
                        <p
                          style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}
                        >
                          By @{post.author?.username} in {post.community?.name} •{" "}
                          {post.upvotes || 0} upvotes • {post.comment_count || 0} comments
                        </p>
                      </div>

                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() => deletePost(post.id)}
                          style={{
                            padding: "8px 12px",
                            background: "#FEE2E2",
                            color: "#DC2626",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMMUNITIES TAB */}
        {tab === "communities" && currentRole !== "moderator" && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {communities.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    No communities found
                  </p>
                </div>
              ) : (
                communities.map((community) => (
                  <div key={community.id} style={cardStyle}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <p style={{ fontSize: "16px" }}>{community.icon || "🏘️"}</p>
                          <p
                            style={{
                              fontSize: "14px",
                              fontWeight: 700,
                              color: "var(--text)",
                              margin: 0,
                            }}
                          >
                            {community.name}
                          </p>
                          {community.is_official && (
                            <span
                              style={{
                                padding: "2px 8px",
                                background: "#ECFDF5",
                                color: "#059669",
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                              }}
                            >
                              OFFICIAL
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            margin: "0 0 8px 0",
                          }}
                        >
                          {community.description}
                        </p>
                        <p
                          style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}
                        >
                          👥 {community.member_count} members • 📝 {community.post_count}{" "}
                          posts • Created{" "}
                          {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() =>
                          toggleCommunityOfficial(
                            community.id,
                            community.is_official || false
                          )
                        }
                        style={{
                          padding: "8px 12px",
                          background: community.is_official ? "#ECFDF5" : "#FEE2E2",
                          color: community.is_official ? "#059669" : "#DC2626",
                          border: "none",
                          borderRadius: "var(--radius-sm)",
                          fontSize: "12px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        {community.is_official ? "Unfeature" : "Feature"}
                      </button>
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <select
                value={filterReportType}
                onChange={(e) => setFilterReportType(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <option value="">All Types</option>
                <option value="post">Posts</option>
                <option value="comment">Comments</option>
                <option value="user">Users</option>
              </select>

              <select
                value={filterReportStatus}
                onChange={(e) => setFilterReportStatus(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredReports.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    No reports found
                  </p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report.id}
                    style={{
                      ...cardStyle,
                      borderColor:
                        report.status === "pending" ? "#FCA5A5" : "var(--border)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "12px",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text)",
                            margin: "0 0 4px 0",
                          }}
                        >
                          {report.type.toUpperCase()} — {report.reason}
                        </p>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            margin: "0 0 8px 0",
                          }}
                        >
                          Reported by @{report.reporter?.username} on{" "}
                          {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        {report.content && (
                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text)",
                              margin: "0 0 8px 0",
                              fontStyle: "italic",
                            }}
                          >
                            "{report.content.substring(0, 100)}..."
                          </p>
                        )}
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            background:
                              report.status === "pending" ? "#FEE2E2" : "#ECFDF5",
                            color:
                              report.status === "pending" ? "#DC2626" : "#059669",
                            fontSize: "11px",
                            fontWeight: 700,
                            borderRadius: "4px",
                          }}
                        >
                          {report.status.toUpperCase()}
                        </span>
                      </div>

                      {report.status === "pending" && (
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() =>
                              deleteReportedContent(report.id, report.target_id)
                            }
                            style={{
                              padding: "8px 12px",
                              background: "#FEE2E2",
                              color: "#DC2626",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => dismissReport(report.id)}
                            style={{
                              padding: "8px 12px",
                              background: "var(--surface-2)",
                              color: "var(--text)",
                              border: "none",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            Dismiss
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === "audit" && currentRole === "super_admin" && (
          <div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <select
                value={filterAuditAdmin}
                onChange={(e) => setFilterAuditAdmin(e.target.value)}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                <option value="">All Admins</option>
                {[...new Set(auditLog.map((log) => log.admin?.username))].map((admin) => (
                  <option key={admin} value={admin}>
                    {admin}
                  </option>
                ))}
              </select>

              <button
                onClick={downloadAuditCSV}
                style={{
                  padding: "10px 12px",
                  background: "linear-gradient(135deg, #1E978A 0%, #1ABC9C 100%)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  justifyContent: "center",
                }}
              >
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAuditLog.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    No audit logs found
                  </p>
                </div>
              ) : (
                filteredAuditLog.map((log) => (
                  <div key={log.id} style={{ ...cardStyle, padding: "12px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <p
                          style={{
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "var(--text)",
                            margin: "0 0 4px 0",
                          }}
                        >
                          @{log.admin?.username} • {log.action}
                        </p>
                        <p
                          style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}
                        >
                          {log.target_type.toUpperCase()} •{" "}
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "var(--text-muted)",
                          padding: "2px 8px",
                          background: "var(--surface-2)",
                          borderRadius: "4px",
                        }}
                      >
                        {log.target_id.substring(0, 8)}...
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMMUNITY REQUESTS TAB */}
        {tab === "community_requests" &&
          ["super_admin", "admin"].includes(currentRole) && (
            <div>
              {/* Filter bar */}
              <div style={{ marginBottom: "20px" }}>
                <select
                  value={filterRequestStatus}
                  onChange={(e) => setFilterRequestStatus(e.target.value)}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    fontSize: "13px",
                  }}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="">All</option>
                </select>
              </div>

              {filteredRequests.length === 0 ? (
                <div style={cardStyle}>
                  <p
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "13px",
                      textAlign: "center",
                    }}
                  >
                    {filterRequestStatus === "pending"
                      ? "No pending requests — you're all caught up."
                      : "No requests found."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      style={{
                        ...cardStyle,
                        borderColor:
                          req.status === "pending"
                            ? "#F5A623"
                            : req.status === "approved"
                            ? "#3DBE7A"
                            : "var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "16px",
                        }}
                      >
                        {/* Left: request info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "6px",
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontSize: "20px" }}>{req.icon || "🏘️"}</span>
                            <p
                              style={{
                                fontSize: "15px",
                                fontWeight: 700,
                                color: "var(--text)",
                                margin: 0,
                              }}
                            >
                              {req.name}
                            </p>
                            <span
                              style={{
                                padding: "2px 8px",
                                background: requestStatusColors[req.status]?.bg,
                                color: requestStatusColors[req.status]?.color,
                                fontSize: "11px",
                                fontWeight: 700,
                                borderRadius: "4px",
                                textTransform: "uppercase",
                              }}
                            >
                              {req.status}
                            </span>
                            {req.category && (
                              <span
                                style={{
                                  padding: "2px 8px",
                                  background: "var(--surface-2)",
                                  color: "var(--text-muted)",
                                  fontSize: "11px",
                                  borderRadius: "4px",
                                }}
                              >
                                {req.category}
                              </span>
                            )}
                          </div>

                          <p
                            style={{
                              fontSize: "13px",
                              color: "var(--text)",
                              margin: "0 0 8px 0",
                              lineHeight: 1.5,
                            }}
                          >
                            {req.description}
                          </p>

                          <p
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                              margin: 0,
                            }}
                          >
                            Requested by{" "}
                            <strong style={{ color: "var(--text)" }}>
                              @{req.requester?.username || "unknown"}
                            </strong>{" "}
                            ({req.requester?.full_name}) •{" "}
                            {new Date(req.created_at).toLocaleDateString()}
                          </p>

                          {req.status === "rejected" && req.rejection_reason && (
                            <p
                              style={{
                                fontSize: "12px",
                                color: "#E8445A",
                                margin: "8px 0 0 0",
                                padding: "8px 10px",
                                background: "#FFF0F2",
                                borderRadius: "var(--radius-sm)",
                              }}
                            >
                              Rejection reason: {req.rejection_reason}
                            </p>
                          )}

                          {/* Inline rejection form */}
                          {rejectingId === req.id && (
                            <div style={{ marginTop: "12px" }}>
                              <textarea
                                placeholder="Reason for rejection (required)..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={2}
                                style={{
                                  width: "100%",
                                  padding: "8px 10px",
                                  border: "1px solid var(--border)",
                                  borderRadius: "var(--radius-sm)",
                                  background: "var(--surface-2)",
                                  color: "var(--text)",
                                  fontFamily: "var(--font-body)",
                                  fontSize: "13px",
                                  resize: "vertical",
                                  boxSizing: "border-box",
                                }}
                              />
                              <div
                                style={{
                                  display: "flex",
                                  gap: "8px",
                                  marginTop: "8px",
                                }}
                              >
                                <button
                                  onClick={() => rejectCommunityRequest(req)}
                                  disabled={
                                    !rejectionReason.trim() ||
                                    requestActionLoading === req.id
                                  }
                                  style={{
                                    padding: "8px 14px",
                                    background:
                                      !rejectionReason.trim() ||
                                      requestActionLoading === req.id
                                        ? "var(--border)"
                                        : "#E8445A",
                                    color:
                                      !rejectionReason.trim() ||
                                      requestActionLoading === req.id
                                        ? "var(--text-muted)"
                                        : "#fff",
                                    border: "none",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor:
                                      !rejectionReason.trim() ||
                                      requestActionLoading === req.id
                                        ? "not-allowed"
                                        : "pointer",
                                  }}
                                >
                                  {requestActionLoading === req.id
                                    ? "Rejecting..."
                                    : "Confirm Rejection"}
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingId(null);
                                    setRejectionReason("");
                                  }}
                                  style={{
                                    padding: "8px 14px",
                                    background: "var(--surface-2)",
                                    color: "var(--text)",
                                    border: "1px solid var(--border)",
                                    borderRadius: "var(--radius-sm)",
                                    fontSize: "12px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: action buttons (pending only) */}
                        {req.status === "pending" && rejectingId !== req.id && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px",
                              flexShrink: 0,
                            }}
                          >
                            <button
                              onClick={() => approveCommunityRequest(req)}
                              disabled={requestActionLoading === req.id}
                              style={{
                                padding: "8px 16px",
                                background:
                                  requestActionLoading === req.id
                                    ? "var(--border)"
                                    : "#3DBE7A",
                                color:
                                  requestActionLoading === req.id
                                    ? "var(--text-muted)"
                                    : "#fff",
                                border: "none",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor:
                                  requestActionLoading === req.id
                                    ? "not-allowed"
                                    : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <Check size={13} />
                              {requestActionLoading === req.id
                                ? "Approving..."
                                : "Approve"}
                            </button>
                            <button
                              onClick={() => {
                                setRejectingId(req.id);
                                setRejectionReason("");
                              }}
                              style={{
                                padding: "8px 16px",
                                background: "#FFF0F2",
                                color: "#E8445A",
                                border: "1px solid #E8445A",
                                borderRadius: "var(--radius-sm)",
                                fontSize: "12px",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
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
