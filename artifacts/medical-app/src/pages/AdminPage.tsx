import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { ROLE_COLORS } from "@/lib/constants";
import type { Profile, Community } from "@/lib/types";
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
} from "lucide-react";



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

interface Stats {
  users: number;
  posts: number;
  comments: number;
  communities: number;
  active_today: number;
  pending_reports: number;
  new_this_week: number;
}



type Tab = "overview" | "users" | "posts" | "communities" | "reports" | "audit";

type UserSort = "newest" | "oldest" | "name";

const STUDY_YEARS = [
  "Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
  "Professor", "Consultant",
];

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
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  // Filter states
  const [searchUsers, setSearchUsers] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterProfession, setFilterProfession] = useState("");
  const [filterInstitution, setFilterInstitution] = useState("");
  const [filterStudyYear, setFilterStudyYear] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [userSort, setUserSort] = useState<UserSort>("newest");
  const [userPage, setUserPage] = useState(1);
  const [searchPosts, setSearchPosts] = useState("");
  const [filterReportType, setFilterReportType] = useState("");
  const [filterReportStatus, setFilterReportStatus] = useState("");
  const [filterAuditAdmin, setFilterAuditAdmin] = useState("");
  const [filterAuditAction, setFilterAuditAction] = useState("");

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
      fetchAllData();
    }

    checkAuth();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [userCountRes, postCountRes, commentCountRes, communityCountRes, usersRes, postsRes, communitiesRes, reportsRes, auditRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("communities").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("id, username, full_name, profession, role, created_at, institution, study_year, is_banned")
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
        currentRole === "super_admin" || currentRole === "admin"
          ? supabase
              .from("communities")
              .select("*")
              .order("created_at", { ascending: false })
          : Promise.resolve({ data: [] }),
        currentRole === "super_admin" || currentRole === "admin" || currentRole === "moderator"
          ? supabase
              .from("reports")
              .select(`*, reported_user:target_id(username), reporter:reported_by_id(username)`)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }),
        currentRole === "super_admin"
          ? supabase
              .from("audit_logs")
              .select(`*, admin:admin_id(username, full_name)`)
              .order("created_at", { ascending: false })
              .limit(100)
          : Promise.resolve({ data: [] }),
      ]);

      // Calculate stats
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const newThisWeek = (usersRes.data || []).filter(
        (u: any) => new Date(u.created_at) > weekAgo
      ).length;

      setStats({
        users: userCountRes.count || 0,
        posts: postCountRes.count || 0,
        comments: commentCountRes.count || 0,
        communities: communityCountRes.count || 0,
        active_today: 0, // Would need session tracking
        pending_reports: (reportsRes.data || []).filter((r: any) => r.status === "pending").length,
        new_this_week: newThisWeek,
      });

      setUsers(usersRes.data || []);
      setPosts(postsRes.data || []);
      setCommunities((communitiesRes.data as Community[]) || []);
      setReports(reportsRes.data || []);
      setAuditLog(auditRes.data || []);

      // Build recent activity
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

      setRecentActivity(activity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10));
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
    await supabase.from("profiles").update({ is_banned: !currentStatus }).eq("id", userId);

    if (currentRole === "super_admin") {
      await supabase.from("audit_logs").insert({
        admin_id: currentUserId,
        action: !currentStatus ? "Suspended user" : "Unsuspended user",
        target_type: "user",
        target_id: userId,
      });
    }

    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_banned: !currentStatus } : u)));
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
    if (currentRole === "super_admin") {
      return [
        { key: "overview", label: "📊 Overview" },
        { key: "users", label: "👥 Users" },
        { key: "posts", label: "📝 Posts" },
        { key: "communities", label: "🏘️ Communities" },
        { key: "reports", label: "🚩 Reports" },
        { key: "audit", label: "📋 Audit Log" },
      ];
    } else if (currentRole === "admin") {
      return [
        { key: "overview", label: "📊 Overview" },
        { key: "users", label: "👥 Users" },
        { key: "posts", label: "📝 Posts" },
        { key: "communities", label: "🏘️ Communities" },
        { key: "reports", label: "🚩 Reports" },
      ];
    } else {
      // Moderator
      return [
        { key: "reports", label: "🚩 Reports" },
        { key: "posts", label: "📝 Posts" },
      ];
    }
  };

  const usersPerPage = 20;

  // Auto-suggest source: distinct, non-empty institutions of existing users.
  const institutionSuggestions = Array.from(
    new Set(users.map((u) => (u.institution || "").trim()).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const usersFiltersActive =
    !!searchUsers || !!filterRole || !!filterProfession ||
    !!filterInstitution || !!filterStudyYear || !!filterStatus ||
    userSort !== "newest";

  function clearUserFilters() {
    setSearchUsers("");
    setFilterRole("");
    setFilterProfession("");
    setFilterInstitution("");
    setFilterStudyYear("");
    setFilterStatus("");
    setUserSort("newest");
    setUserPage(1);
  }

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.username.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.full_name.toLowerCase().includes(searchUsers.toLowerCase());
    const matchesRole = !filterRole || u.role === filterRole;
    const matchesProfession = !filterProfession || u.profession === filterProfession;
    const matchesInstitution =
      !filterInstitution ||
      (u.institution || "").toLowerCase().includes(filterInstitution.toLowerCase());
    const matchesStudyYear = !filterStudyYear || u.study_year === filterStudyYear;
    const matchesStatus =
      !filterStatus ||
      (filterStatus === "suspended" ? !!u.is_banned : !u.is_banned);
    return matchesSearch && matchesRole && matchesProfession &&
      matchesInstitution && matchesStudyYear && matchesStatus;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (userSort === "name") {
      return (a.full_name || a.username).localeCompare(b.full_name || b.username);
    }
    const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return userSort === "oldest" ? diff : -diff;
  });

  const paginatedUsers = sortedUsers.slice(
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
    const matchesAction = !filterAuditAction || log.action.toLowerCase().includes(filterAuditAction.toLowerCase());
    return matchesAdmin && matchesAction;
  });

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
        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0, marginBottom: "4px" }}>
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
            <TrendingUp size={12} /> {growth > 0 ? "+" : ""}{growth}% this week
          </p>
        )}
      </div>
    </div>
  );

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
                background: tab === t.key ? "rgba(26, 188, 156, 0.1)" : "var(--surface)",
                color: tab === t.key ? "#1ABC9C" : "var(--text)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <div>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "32px" }}>
              {statCard("📝", "Total Posts", stats.posts, 0)}
              {statCard("🏘️", "Communities", stats.communities, 0)}
              {statCard("⏰", "Active Today", stats.active_today, 0)}
              {statCard("🚩", "Pending Flags", stats.pending_reports, 0)}
            </div>

            {/* Recent Activity */}
            <div style={cardStyle}>
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 16px 0" }}>
                📜 Recent Activity
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {recentActivity.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "13px" }}>No recent activity</p>
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
                          {activity.type === "user" && "👤"} {activity.type === "post" && "📝"} {activity.type === "report" && "🚩"}
                          {" "}{activity.message}
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
            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
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

              <input
                type="text"
                list="admin-institution-suggestions"
                placeholder="University / Institution"
                value={filterInstitution}
                onChange={(e) => { setFilterInstitution(e.target.value); setUserPage(1); }}
                style={{
                  padding: "10px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-sm)",
                  background: "var(--surface)",
                  color: "var(--text)",
                  fontFamily: "var(--font-body)",
                }}
              />
              <datalist id="admin-institution-suggestions">
                {institutionSuggestions.map((inst) => (
                  <option key={inst} value={inst} />
                ))}
              </datalist>

              <select
                value={filterStudyYear}
                onChange={(e) => { setFilterStudyYear(e.target.value); setUserPage(1); }}
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
                <option value="">All Study Years</option>
                {STUDY_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setUserPage(1); }}
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
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>

              <select
                value={userSort}
                onChange={(e) => { setUserSort(e.target.value as UserSort); setUserPage(1); }}
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
                <option value="newest">Sort: Newest First</option>
                <option value="oldest">Sort: Oldest First</option>
                <option value="name">Sort: Name (A–Z)</option>
              </select>
            </div>

            {usersFiltersActive && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
                <button
                  onClick={clearUserFilters}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "8px 14px",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} /> Clear All Filters
                </button>
              </div>
            )}

            {/* Users List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {paginatedUsers.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No users found</p>
                </div>
              ) : (
                paginatedUsers.map((user) => (
                  <div key={user.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
                            {user.full_name || user.username}
                          </p>
                          {user.is_banned && (
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
                              background: ROLE_COLORS[user.role]?.bg,
                              color: ROLE_COLORS[user.role]?.color,
                              fontSize: "11px",
                              fontWeight: 700,
                              borderRadius: "4px",
                            }}
                          >
                            {user.role.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 4px 0" }}>
                          @{user.username} • {user.profession}{user.study_year ? ` • ${user.study_year}` : ""}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          🏛️ {user.institution || "No institution"} • Registered {new Date(user.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
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
                          <option value="moderator">Moderator</option>
                          {currentRole === "super_admin" && <option value="admin">Admin</option>}
                          {currentRole === "super_admin" && <option value="super_admin">Super Admin</option>}
                        </select>

                        <button
                          onClick={() => toggleUserSuspend(user.id, user.is_banned || false)}
                          style={{
                            padding: "8px 12px",
                            background: user.is_banned ? "#D1FAE5" : "#FEE2E2",
                            color: user.is_banned ? "#059669" : "#DC2626",
                            border: "none",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {user.is_banned ? "Unsuspend" : "Suspend"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > usersPerPage && (
              <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "20px" }}>
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
                <span style={{ padding: "8px 12px", color: "var(--text-muted)", fontSize: "13px" }}>
                  Page {userPage} of {Math.ceil(filteredUsers.length / usersPerPage)}
                </span>
                <button
                  onClick={() => setUserPage((p) => (p < Math.ceil(filteredUsers.length / usersPerPage) ? p + 1 : p))}
                  disabled={userPage >= Math.ceil(filteredUsers.length / usersPerPage)}
                  style={{
                    padding: "8px 12px",
                    background: userPage >= Math.ceil(filteredUsers.length / usersPerPage) ? "var(--border)" : "var(--surface)",
                    color: userPage >= Math.ceil(filteredUsers.length / usersPerPage) ? "var(--text-muted)" : "var(--text)",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-sm)",
                    cursor: userPage >= Math.ceil(filteredUsers.length / usersPerPage) ? "not-allowed" : "pointer",
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
            {/* Search */}
            <div style={{ marginBottom: "20px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
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

            {/* Posts List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredPosts.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No posts found</p>
                </div>
              ) : (
                filteredPosts.map((post) => (
                  <div key={post.id} style={{ ...cardStyle, borderColor: post.is_reported ? "#FCA5A5" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
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
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          By @{post.author?.username} in {post.community?.name} • {post.upvotes || 0} upvotes • {post.comment_count || 0} comments
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
        {(tab === "communities" && currentRole !== "moderator") && (
          <div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {communities.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No communities found</p>
                </div>
              ) : (
                communities.map((community) => (
                  <div key={community.id} style={cardStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <p style={{ fontSize: "16px" }}>{community.icon || "🏘️"}</p>
                          <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
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
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                          {community.description}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          👥 {community.member_count} members • 📝 {community.post_count} posts • Created {new Date(community.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <button
                        onClick={() => toggleCommunityOfficial(community.id, community.is_official || false)}
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
            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
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

            {/* Reports List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {filteredReports.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No reports found</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div key={report.id} style={{ ...cardStyle, borderColor: report.status === "pending" ? "#FCA5A5" : "var(--border)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>
                          {report.type.toUpperCase()} — {report.reason}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 8px 0" }}>
                          Reported by @{report.reporter?.username} on {new Date(report.created_at).toLocaleDateString()}
                        </p>
                        {report.content && (
                          <p style={{ fontSize: "12px", color: "var(--text)", margin: "0 0 8px 0", fontStyle: "italic" }}>
                            "{report.content.substring(0, 100)}..."
                          </p>
                        )}
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            background: report.status === "pending" ? "#FEE2E2" : "#ECFDF5",
                            color: report.status === "pending" ? "#DC2626" : "#059669",
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
                            onClick={() => deleteReportedContent(report.id, report.target_id)}
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
            {/* Filters */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", marginBottom: "20px" }}>
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

            {/* Audit Log List */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filteredAuditLog.length === 0 ? (
                <div style={cardStyle}>
                  <p style={{ color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>No audit logs found</p>
                </div>
              ) : (
                filteredAuditLog.map((log) => (
                  <div key={log.id} style={{ ...cardStyle, padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: "13px", fontWeight: 700, color: "var(--text)", margin: "0 0 4px 0" }}>
                          @{log.admin?.username} • {log.action}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                          {log.target_type.toUpperCase()} • {new Date(log.created_at).toLocaleString()}
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
