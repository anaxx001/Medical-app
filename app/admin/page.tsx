"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Users, FileText, MessageSquare, Trash2, ChevronDown } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  profession: string;
  role: string;
  created_at: string;
}

interface Stats {
  users: number;
  posts: number;
  comments: number;
}

const roles = ["student", "exco", "moderator", "admin", "super_admin"];

const roleColors: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: "#FFF0F2", color: "#E8445A" },
  admin: { bg: "#FFF8EC", color: "#F5A623" },
  moderator: { bg: "#EBF5FF", color: "#2D87C8" },
  exco: { bg: "#F5F0FF", color: "#9B6DFF" },
  student: { bg: "#EDFFF5", color: "#3DBE7A" },
};

type Tab = "overview" | "users" | "posts";

export default function AdminPage() {
  const supabase = createClient();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats>({ users: 0, posts: 0, comments: 0 });
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState("");
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (!profile || !["admin", "super_admin"].includes(profile.role)) {
        router.push("/");
        return;
      }
      setCurrentRole(profile.role);
      fetchAll();
    }
    checkAuth();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [
        { count: userCount },
        { count: postCount },
        { count: commentCount },
        { data: usersData },
        { data: postsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("posts").select("*", { count: "exact", head: true }),
        supabase.from("comments").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("posts").select(`
          id, title, is_announcement, is_pinned, upvotes, created_at,
          author:profiles!author_id(username),
          community:communities!community_id(name, icon)
        `).order("created_at", { ascending: false }).limit(50),
      ]);

      setStats({
        users: userCount || 0,
        posts: postCount || 0,
        comments: commentCount || 0,
      });
      setUsers(usersData || []);
      setPosts(postsData || []);
    } finally {
      setLoading(false);
    }
  }

  async function updateRole(userId: string, newRole: string) {
    setUpdatingId(userId);
    await supabase.from("profiles").update({ role: newRole }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    setUpdatingId(null);
  }

  async function deletePost(postId: string) {
    if (!confirm("Delete this post?")) return;
    await supabase.from("posts").delete().eq("id", postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }

  async function togglePin(postId: string, current: boolean) {
    await supabase.from("posts").update({ is_pinned: !current }).eq("id", postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: !current } : p));
  }

  async function toggleAnnouncement(postId: string, current: boolean) {
    await supabase.from("posts").update({ is_announcement: !current }).eq("id", postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_announcement: !current } : p));
  }

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "users", label: "Users" },
    { key: "posts", label: "Posts" },
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #E8445A, #F5A623)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🛡️</div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)" }}>Admin Dashboard</h1>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Full control over MedStudent</p>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {tabs.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{ padding: "8px 18px", borderRadius: "99px", border: "none", background: tab === key ? "linear-gradient(135deg, #E8445A, #F5A623)" : "var(--surface)", color: tab === key ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer", boxShadow: tab === key ? "0 2px 10px rgba(232,68,90,0.25)" : "var(--shadow)", transition: "all 0.2s ease" }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[1, 2, 3].map(i => <div key={i} style={{ background: "var(--surface)", borderRadius: "var(--radius)", height: "80px", border: "1px solid var(--border)", opacity: 0.6 }} />)}
          </div>
        ) : (
          <>
            {/* Overview tab */}
            {tab === "overview" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
                  {[
                    { icon: Users, label: "Total Users", value: stats.users, color: "#2D87C8", bg: "#EBF5FF" },
                    { icon: FileText, label: "Total Posts", value: stats.posts, color: "#3DBE7A", bg: "#EDFFF5" },
                    { icon: MessageSquare, label: "Total Comments", value: stats.comments, color: "#9B6DFF", bg: "#F5F0FF" },
                  ].map(({ icon: Icon, label, value, color, bg }) => (
                    <div key={label} style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "20px", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
                        <Icon size={20} color={color} />
                      </div>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "28px", color: "var(--text)", lineHeight: 1 }}>{value}</p>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", fontFamily: "var(--font-body)", marginTop: "4px" }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Recent users */}
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Recent Signups</p>
                  </div>
                  {users.slice(0, 5).map(u => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--border)" }}>
                      <div>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{u.full_name || u.username}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>u/{u.username} · {u.profession || "Unknown"}</p>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: "99px", background: roleColors[u.role]?.bg || "#F0F6FA", color: roleColors[u.role]?.color || "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "11px" }}>
                        {u.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users tab */}
            {tab === "users" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none" }}
                />
                <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", overflow: "hidden", boxShadow: "var(--shadow)" }}>
                  {filteredUsers.map((u, i) => (
                    <div key={u.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: i < filteredUsers.length - 1 ? "1px solid var(--border)" : "none", gap: "12px", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", flexShrink: 0 }}>
                          {(u.full_name || u.username || "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{u.full_name || u.username}</p>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>u/{u.username} · {u.profession || "Unknown"}</p>
                        </div>
                      </div>

                      {/* Role selector */}
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ position: "relative" }}>
                          <select
                            value={u.role}
                            onChange={e => updateRole(u.id, e.target.value)}
                            disabled={updatingId === u.id || (u.role === "super_admin" && currentRole !== "super_admin")}
                            style={{ padding: "6px 28px 6px 10px", borderRadius: "99px", border: `1px solid ${roleColors[u.role]?.color || "var(--border)"}`, background: roleColors[u.role]?.bg || "var(--surface-2)", color: roleColors[u.role]?.color || "var(--text)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12px", cursor: "pointer", appearance: "none", outline: "none" }}
                          >
                            {roles.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: roleColors[u.role]?.color || "var(--text-muted)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Posts tab */}
            {tab === "posts" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {posts.map(post => (
                  <div key={post.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "14px 16px", boxShadow: "var(--shadow)" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "4px" }}>{post.title}</p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                          {post.community?.icon} {post.community?.name} · u/{post.author?.username} · {post.upvotes} upvotes
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: "6px", flexShrink: 0, flexWrap: "wrap" }}>
                        <button
                          onClick={() => toggleAnnouncement(post.id, post.is_announcement)}
                          style={{ padding: "5px 10px", borderRadius: "99px", border: "none", background: post.is_announcement ? "#EBF5FF" : "var(--surface-2)", color: post.is_announcement ? "var(--blue)" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11.5px", cursor: "pointer" }}
                        >
                          📢 {post.is_announcement ? "Unannounce" : "Announce"}
                        </button>
                        <button
                          onClick={() => togglePin(post.id, post.is_pinned)}
                          style={{ padding: "5px 10px", borderRadius: "99px", border: "none", background: post.is_pinned ? "#EDFFF5" : "var(--surface-2)", color: post.is_pinned ? "var(--green)" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11.5px", cursor: "pointer" }}
                        >
                          📌 {post.is_pinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          style={{ padding: "5px 10px", borderRadius: "99px", border: "none", background: "#FFF0F2", color: "#E8445A", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                        >
                          <Trash2 size={11} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
