import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Save, AlertCircle, Trash2 } from "lucide-react";

export default function CommunityManagePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const [, setLocation] = useLocation();

  const [community, setCommunity] = useState<any>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [rules, setRules] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("user");
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetchingCommunity, setIsFetchingCommunity] = useState(true);
  const [activeManageTab, setActiveManageTab] = useState<"settings" | "members" | "reports" | "requests" | "banned">("settings");

  useEffect(() => {
    const init = async () => {
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

      const { data } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", params.slug)
        .single();
      
      if (data) {
          setCommunity(data);
          setName(data.name || "");
          setDescription(data.description || "");
          setAvatarUrl(data.avatar_url || "");
          setBannerUrl(data.banner_url || "");
          setRules(data.rules || "");
          setIsPrivate(data.is_private || false);

          // Use a simpler select if complex joins fail in mock
          const { data: mData } = await supabase
              .from("community_members")
              .select("*, profiles(*)")
              .eq("community_id", data.id);
          
          if (mData) {
              setMembers(mData);
          }

          // Fetch reports for this community
          const { data: rData } = await supabase
              .from("report_posts")
              .select("*, post:posts(*)")
              .eq("community_id", data.id);
          
          if (rData) {
              setReports(rData);
          }

          // Fetch join requests if private
          const { data: reqData } = await supabase
              .from("community_requests")
              .select("*, profiles(*)")
              .eq("community_id", data.id)
              .eq("status", "pending");
          
          if (reqData) {
              setRequests(reqData);
          }
      }
      setIsFetchingCommunity(false);
    };
    init();
  }, [params.slug]);

  const isSuperAdmin = userRole === "super_admin" || userRole === "app_admin" || userRole === "admin";
  const isDefaultOrOfficial = community && (!community.creator_id || community.creator_id === "student-obi-id");
  const isAdmin = user && community && (community.creator_id === user.id || (isSuperAdmin && isDefaultOrOfficial));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "banner") => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const img = new Image();
              img.onload = () => {
                  const canvas = document.createElement("canvas");
                  const maxWidth = type === "avatar" ? 128 : 256;
                  const maxHeight = type === "avatar" ? 128 : 128;
                  let width = img.width;
                  let height = img.height;

                  if (width > maxWidth || height > maxHeight) {
                      const ratio = Math.min(maxWidth / width, maxHeight / height);
                      width = Math.floor(width * ratio);
                      height = Math.floor(height * ratio);
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                      ctx.drawImage(img, 0, 0, width, height);
                      const outputUrl = canvas.toDataURL("image/jpeg", 0.4);
                      if (type === "avatar") {
                          setAvatarUrl(outputUrl);
                      } else {
                          setBannerUrl(outputUrl);
                      }
                  }
              };
              img.src = reader.result as string;
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUpdate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!community || !isAdmin) return;
    setLoading(true);

    const { error } = await supabase
      .from("communities")
      .update({ 
        name, 
        description, 
        avatar_url: avatarUrl, 
        icon: avatarUrl,
        banner_url: bannerUrl,
        banner: bannerUrl,
        rules,
        is_private: isPrivate
      })
      .eq("id", community.id);

    setLoading(false);
    if (!error) {
        if (e) setLocation(`/c/${params.slug}`);
    } else {
        alert("Failed to update: " + error.message);
    }
  };

  const handleAcceptRequest = async (requestId: string, userId: string) => {
      setLoading(true);
      // Add to members
      await supabase.from("community_members").insert({
          community_id: community.id,
          user_id: userId,
          role: "member"
      });
      // Update request status
      await supabase.from("community_requests").update({ status: "approved" }).eq("id", requestId);
      
      setRequests(requests.filter(r => r.id !== requestId));
      // Refresh members
      const { data: mData } = await supabase.from("community_members").select("*, profiles(*)").eq("community_id", community.id);
      if (mData) setMembers(mData);
      setLoading(false);
  };

  const handleDeleteCommunity = async () => {
      if (!community || !isAdmin) return;
      if (confirm("Are you sure you want to delete this community? This action is irreversible and will delete all posts associated with it.")) {
          setLoading(true);
          // Posts will cascade delete since we have RLS but to be safe we can manually delete them or assume cascade.
          await supabase.from("posts").delete().eq("community_id", community.id);
          await supabase.from("community_members").delete().eq("community_id", community.id);
          const { error } = await supabase.from("communities").delete().eq("id", community.id);
          setLoading(false);
          
          if (!error) {
              setLocation("/communities/discover");
          } else {
              alert("Failed to delete community: " + error.message);
          }
      }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: string) => {
      setLoading(true);
      const { error } = await supabase
          .from("community_members")
          .update({ role: newRole })
          .eq("id", memberId);
      
      setLoading(false);
      if (!error) {
          setMembers(members.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      } else {
          alert("Failed to update role: " + error.message);
      }
  };

  const handleRemoveMember = async (memberId: string) => {
      if (!confirm("Are you sure you want to remove this member?")) return;
      setLoading(true);
      const { error } = await supabase
          .from("community_members")
          .delete()
          .eq("id", memberId);
      
      setLoading(false);
      if (!error) {
          setMembers(members.filter(m => m.id !== memberId));
      } else {
          alert("Failed to remove member: " + error.message);
      }
  };

  if (isFetchingCommunity) return <div style={{ padding: "20px", textAlign: "center" }}>Loading settings...</div>;
  if (!community) return <div style={{ padding: "20px" }}>Community not found.</div>;
  if (!isAdmin) return <div style={{ padding: "20px" }}>Unauthorized to manage this community.</div>;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href={`/c/${params.slug}`} style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to {community.name}
        </Link>
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
        {[
          { id: "settings", label: "Settings" },
          { id: "members", label: "Members" },
          { id: "reports", label: "Reports", count: reports.length },
          { id: "requests", label: "Join Requests", count: requests.length },
          { id: "banned", label: "Banned" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveManageTab(tab.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid var(--border)",
              background: activeManageTab === tab.id ? "var(--text)" : "var(--surface)",
              color: activeManageTab === tab.id ? "var(--bg)" : "var(--text)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            {tab.label}
            {tab.count ? <span style={{ background: "rgba(239, 68, 68, 0.2)", color: "rgb(239, 68, 68)", padding: "1px 6px", borderRadius: "99px", fontSize: "11px" }}>{tab.count}</span> : null}
          </button>
        ))}
      </div>

      {activeManageTab === "settings" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "24px", fontWeight: 800, margin: "0 0 8px" }}>Manage Community</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Edit basic settings, descriptions, or administrative flags.</p>

          <form onSubmit={handleUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Community Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Purpose / Description</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box" }}
              />
            </div>

            <div>
               <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Avatar Image</label>
               <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                   {avatarUrl && <img src={avatarUrl} alt="Avatar Preview" style={{ width: "60px", height: "60px", borderRadius: "16px", objectFit: "cover" }} />}
                   <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "avatar")}
                      style={{ fontSize: "14px", padding: "8px", border: "1px dashed var(--border)", borderRadius: "8px", flex: 1, color: "var(--text-muted)" }}
                   />
               </div>
            </div>

            <div>
               <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>Banner Image</label>
               <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                   {bannerUrl && <img src={bannerUrl} alt="Banner Preview" style={{ width: "100%", height: "120px", borderRadius: "16px", objectFit: "cover" }} />}
                   <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "banner")}
                      style={{ fontSize: "14px", padding: "8px", border: "1px dashed var(--border)", borderRadius: "8px", flex: 1, color: "var(--text-muted)" }}
                   />
               </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "13px", borderRadius: "10px", border: "none", background: "var(--text)", color: "var(--bg)", fontFamily: "var(--font-display)", fontWeight: 750, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer" }}
            >
              {loading ? "Saving configs..." : "Save Settings"}
            </button>
          </form>
        </div>
      )}

      {activeManageTab === "settings" && (
        <>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Community Rules</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Define guidelines for members to follow.</p>
              
              <textarea 
                  rows={6}
                  placeholder="1. Be respectful... 
    2. No spam...
    3. Use Nigerian medical curriculum context when possible..."
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", outline: "none", resize: "none", boxSizing: "border-box", marginBottom: "16px", fontSize: "14px", lineHeight: "1.6" }}
              />
              <button 
                  onClick={handleUpdate}
                  disabled={loading}
                  style={{ width: "100%", padding: "11px", borderRadius: "10px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontWeight: 700, fontSize: "13px", cursor: loading ? "not-allowed" : "pointer" }}
              >
                  Update Rules
              </button>
          </div>

          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Privacy & Access</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Control who can join and view this community.</p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", border: "1px solid var(--border)", borderRadius: "12px", background: isPrivate ? "rgba(13, 148, 136, 0.03)" : "transparent" }}>
                  <div>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>Private Community</div>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>Members must be approved to join.</div>
                  </div>
                  <button 
                      onClick={() => setIsPrivate(!isPrivate)}
                      style={{
                          width: "44px",
                          height: "24px",
                          borderRadius: "20px",
                          background: isPrivate ? "#0D9488" : "var(--border)",
                          border: "none",
                          position: "relative",
                          cursor: "pointer",
                          transition: "background 0.2s"
                      }}
                  >
                      <div style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: "white",
                          position: "absolute",
                          left: isPrivate ? "22px" : "4px",
                          top: "3px",
                          transition: "left 0.2s"
                      }} />
                  </button>
              </div>
          </div>
        </>
      )}

      {activeManageTab === "requests" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Join Requests</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Review pending requests to join this private community.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {requests.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", border: "1px dashed var(--border)", borderRadius: "12px" }}>
                        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No pending join requests.</p>
                    </div>
                ) : requests.map((req) => (
                    <div key={req.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img 
                                src={req.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${req.profiles?.username || "user"}`}
                                alt=""
                                style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg)" }}
                            />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{req.profiles?.full_name || req.profiles?.username || "User"}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{req.profiles?.study_year || "Student"}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button 
                              onClick={() => handleAcceptRequest(req.id, req.user_id)}
                              style={{ padding: "6px 12px", borderRadius: "8px", border: "none", background: "var(--accent)", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Approve
                            </button>
                            <button 
                              onClick={async () => {
                                  await supabase.from("community_requests").update({ status: "rejected" }).eq("id", req.id);
                                  setRequests(requests.filter(r => r.id !== req.id));
                              }}
                              style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeManageTab === "reports" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Pending Reports</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Review content reported by community members.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {reports.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "32px", border: "1px dashed var(--border)", borderRadius: "12px" }}>
                        <AlertCircle size={24} color="var(--text-muted)" style={{ marginBottom: "8px" }} />
                        <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No active reports. Your community is clean!</p>
                    </div>
                ) : reports.map((report) => (
                    <div key={report.id} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface-muted)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "rgb(239, 68, 68)", background: "rgba(239, 68, 68, 0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                                {report.reason || "Policy Violation"}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {new Date(report.created_at).toLocaleDateString()}
                            </span>
                        </div>
                        <p style={{ fontSize: "13px", color: "var(--text)", margin: "0 0 12px", fontWeight: 500 }}>
                            Reported post: <span style={{ fontWeight: 600 }}>{report.post?.title}</span>
                        </p>
                        <div style={{ display: "flex", gap: "8px" }}>
                            <button 
                              onClick={async () => {
                                  if (confirm("Dismiss this report?")) {
                                      await supabase.from("report_posts").delete().eq("id", report.id);
                                      setReports(reports.filter(r => r.id !== report.id));
                                  }
                              }}
                              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Dismiss
                            </button>
                            <button 
                              onClick={async () => {
                                  if (confirm("Are you sure you want to delete the reported content?")) {
                                      await supabase.from("posts").delete().eq("id", report.post_id);
                                      await supabase.from("report_posts").delete().eq("id", report.id);
                                      setReports(reports.filter(r => r.id !== report.id));
                                  }
                              }}
                              style={{ flex: 1, padding: "8px", borderRadius: "8px", border: "none", background: "rgb(239, 68, 68)", color: "white", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                            >
                                Delete Content
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeManageTab === "members" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px" }}>Manage Members</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Change roles, mute or ban members.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {members.filter(m => !m.is_banned).length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No members to manage.</p> : members.filter(m => !m.is_banned).map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: "12px", background: "var(--surface-muted)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img 
                                src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.profiles?.username || "user"}`}
                                alt={m.profiles?.username || "User"}
                                style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg)", objectFit: "cover" }}
                            />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>{m.profiles?.username || "Unknown"}</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                  {m.profiles?.study_year || "Student"}
                                  {m.is_muted && <span style={{ color: "#F59E0B", fontSize: "10px", fontWeight: 700 }}>[MUTED]</span>}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <select 
                                value={m.role}
                                onChange={(e) => handleUpdateMemberRole(m.id, e.target.value)}
                                disabled={loading || m.user_id === community.creator_id} 
                                style={{ padding: "6px 10px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: "13px", outline: "none", cursor: loading || m.user_id === community.creator_id ? "not-allowed" : "pointer" }}
                            >
                                <option value="member">Student</option>
                                <option value="moderator">Community Moderator</option>
                                <option value="admin">Community Admin</option>
                            </select>
                            
                            <button 
                                onClick={async () => {
                                  const { error } = await supabase.from("community_members").update({ is_muted: !m.is_muted }).eq("id", m.id);
                                  if (!error) setMembers(members.map(mem => mem.id === m.id ? { ...mem, is_muted: !mem.is_muted } : mem));
                                }}
                                disabled={loading || m.user_id === community.creator_id}
                                title={m.is_muted ? "Unmute" : "Mute"}
                                style={{ padding: "8px", borderRadius: "8px", border: "none", background: m.is_muted ? "rgba(245, 158, 11, 0.1)" : "rgba(var(--text-rgb), 0.05)", color: m.is_muted ? "#F59E0B" : "var(--text-muted)", cursor: loading || m.user_id === community.creator_id ? "not-allowed" : "pointer" }}
                            >
                                {m.is_muted ? "Unmute" : "Mute"}
                            </button>

                            <button 
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to BAN ${m.profiles?.username}? They will be removed and blacklisted from this community.`)) {
                                    const { error } = await supabase.from("community_members").update({ is_banned: true, role: "member" }).eq("id", m.id);
                                    if (!error) setMembers(members.map(mem => mem.id === m.id ? { ...mem, is_banned: true } : mem));
                                  }
                                }}
                                disabled={loading || m.user_id === community.creator_id}
                                title="Ban Member"
                                style={{ padding: "8px", borderRadius: "8px", border: "none", background: "rgba(239, 68, 68, 0.1)", color: "rgb(239, 68, 68)", cursor: loading || m.user_id === community.creator_id ? "not-allowed" : "pointer" }}
                            >
                                Ban
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeManageTab === "banned" && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px", color: "rgb(239, 68, 68)" }}>Banned Members</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Blacklisted users who cannot join or view this community.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {members.filter(m => m.is_banned).length === 0 ? <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No banned members.</p> : members.filter(m => m.is_banned).map((m) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", border: "1px solid var(--border)", borderRadius: "12px", background: "rgba(239, 68, 68, 0.05)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <img 
                                src={m.profiles?.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${m.profiles?.username || "user"}`}
                                alt=""
                                style={{ width: "36px", height: "36px", borderRadius: "50%", background: "var(--bg)", opacity: 0.6 }}
                            />
                            <div>
                                <div style={{ fontWeight: 600, fontSize: "14px", color: "rgb(239, 68, 68)" }}>{m.profiles?.username} [BANNED]</div>
                                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>{m.profiles?.study_year}</div>
                            </div>
                        </div>
                        <button 
                            onClick={async () => {
                              const { error } = await supabase.from("community_members").update({ is_banned: false }).eq("id", m.id);
                              if (!error) setMembers(members.map(mem => mem.id === m.id ? { ...mem, is_banned: false } : mem));
                            }}
                            style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                        >
                            Unban
                        </button>
                    </div>
                ))}
            </div>
        </div>
      )}

      {activeManageTab === "settings" && (
        <div style={{ background: "var(--surface)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "20px", padding: "28px" }}>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "20px", fontWeight: 800, margin: "0 0 8px", color: "rgb(239, 68, 68)" }}>Danger Zone</h2>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Irreversible actions regarding your community.</p>

            <button 
               onClick={handleDeleteCommunity}
               disabled={loading}
               style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid rgb(239, 68, 68)", background: "transparent", color: "rgb(239, 68, 68)", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
            >
                <Trash2 size={16} /> Delete Community
            </button>
        </div>
      )}

    </div>
  );
}
