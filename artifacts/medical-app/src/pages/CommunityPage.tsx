import { useEffect, useState, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import LoadingList from "@/components/LoadingList";
import EmptyState from "@/components/EmptyState";
import { createClient } from "@/lib/supabase";
import { POST_SELECT_FIELDS } from "@/lib/constants";
import { normalizePosts } from "@/lib/posts";
import { useParams, Link } from "wouter";
import {
  PenSquare, Settings, Users, MessageCircle, TrendingUp, Clock,
  Shield, Eye, EyeOff, Lock, Globe, Hash, UserPlus, UserCheck,
  Flag, Share2, Bell, BellOff, Pin, Camera, Upload, X
} from "lucide-react";
import type { Community } from "@/lib/types";

type SortMode = "top" | "new" | "trending";
type Tab = "posts" | "about" | "members" | "rules";
type PhotoType = "profile" | "cover";

export default function CommunityPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const supabase = createClient();

  const [community, setCommunity] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [isAdmin, setIsAdmin] = useState(false);
  const [sortBy, setSortBy] = useState<SortMode>("top");
  const [activeTab, setActiveTab] = useState<Tab>("posts");
  const [memberCount, setMemberCount] = useState(0);
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rules, setRules] = useState<any[]>([]);
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [moderators, setModerators] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [showShareToast, setShowShareToast] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isUploading, setIsUploading] = useState<PhotoType | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState<PhotoType | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setUploadError(null);
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id);

    const { data: communityData } = await supabase
      .from("communities")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!communityData) { setLoading(false); return; }
    setCommunity(communityData);

    if (user) {
      let admin = false;
      if (communityData.creator_id === user.id || communityData.created_by === user.id) {
        admin = true;
      } else {
        const { data: mod } = await supabase
          .from("community_moderators")
          .select("role")
          .eq("community_id", communityData.id)
          .eq("user_id", user.id)
          .eq("role", "admin")
          .single();
        if (mod) admin = true;

        if (!admin) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();
          if (["super_admin", "admin", "app_admin"].includes(profile?.role)) {
            admin = true;
          }
        }
      }
      setIsAdmin(admin);

      const { data: membership } = await supabase
        .from("community_members")
        .select("id, muted")
        .eq("community_id", communityData.id)
        .eq("user_id", user.id)
        .single();
      setIsJoined(!!membership);
      setIsMuted(membership?.muted || false);
    }

    const { count } = await supabase
      .from("community_members")
      .select("id", { count: "exact", head: true })
      .eq("community_id", communityData.id);
    setMemberCount(count || 0);

    let query = supabase
      .from("posts")
      .select(POST_SELECT_FIELDS)
      .eq("community_id", communityData.id);

    if (sortBy === "top") {
      query = query.order("upvotes", { ascending: false });
    } else if (sortBy === "new") {
      query = query.order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: false })
        .gt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    }

    const { data: postsData } = await query.limit(30);
    const normalized = normalizePosts((postsData || []) as Record<string, unknown>[]);
    setPosts(normalized);

    const { data: pinned } = await supabase
      .from("posts")
      .select(POST_SELECT_FIELDS)
      .eq("community_id", communityData.id)
      .eq("is_pinned", true)
      .order("created_at", { ascending: false })
      .limit(3);
    setPinnedPosts(normalizePosts((pinned || []) as Record<string, unknown>[]));

    const { data: anns } = await supabase
      .from("community_announcements")
      .select("*")
      .eq("community_id", communityData.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setAnnouncements(anns || []);

    const { data: rulesData } = await supabase
      .from("community_rules")
      .select("*")
      .eq("community_id", communityData.id)
      .order("order_index", { ascending: true });
    setRules(rulesData || []);

    const { data: mods } = await supabase
      .from("community_moderators")
      .select("*, profiles(username, display_name, avatar_url)")
      .eq("community_id", communityData.id);
    setModerators(mods || []);

    // Fetch members for the members tab
    const { data: membersData } = await supabase
      .from("community_members")
      .select("*, profiles(username, display_name, avatar_url, joined_at)")
      .eq("community_id", communityData.id)
      .order("joined_at", { ascending: false });
    setMembers(membersData || []);

    // Auto-join creator if not already a member (failsafe)
    if (user && (communityData.creator_id === user.id || communityData.created_by === user.id)) {
      const isAlreadyMember = membersData?.some((m: any) => m.user_id === user.id);
      if (!isAlreadyMember) {
        await supabase.from("community_members").insert({
          community_id: communityData.id,
          user_id: user.id,
        });
        // Also ensure creator is in moderators as admin
        await supabase.from("community_moderators").upsert({
          community_id: communityData.id,
          user_id: user.id,
          role: "admin",
        }, { onConflict: "community_id,user_id" });
        // Refresh
        const { data: refreshed } = await supabase
          .from("community_members")
          .select("*, profiles(username, display_name, avatar_url, joined_at)")
          .eq("community_id", communityData.id)
          .order("joined_at", { ascending: false });
        setMembers(refreshed || []);
        setMemberCount((refreshed || []).length);
      }
    }

    setLoading(false);
  }, [slug, sortBy, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoin = async () => {
    if (!currentUserId || !community) return;

    // Creator trying to leave
    const isCreator = community.creator_id === currentUserId || community.created_by === currentUserId;
    if (isJoined && isCreator) {
      setShowLeaveModal(true);
      return;
    }

    if (isJoined) {
      await supabase.from("community_members").delete()
        .eq("community_id", community.id).eq("user_id", currentUserId);
      setIsJoined(false);
      setMemberCount(c => c - 1);
      setMembers(prev => prev.filter((m: any) => m.user_id !== currentUserId));
    } else {
      await supabase.from("community_members").insert({
        community_id: community.id, user_id: currentUserId
      });
      setIsJoined(true);
      setMemberCount(c => c + 1);

      // Send welcome notification to new member
      await supabase.from("notifications").insert({
        user_id: currentUserId,
        type: "community_welcome",
        title: `Welcome to ${community.name}!`,
        message: `You joined c/${community.slug}. Post questions, share notes, and connect with fellow students.`,
        reference_id: community.id,
        reference_type: "community",
        metadata: {
          community_id: community.id,
          community_name: community.name,
          community_slug: community.slug,
        },
      });

      // Notify admins/moderators of new member
      const adminIds = moderators.map((m: any) => m.user_id);
      if (community.creator_id) adminIds.push(community.creator_id);
      const uniqueAdmins = [...new Set(adminIds)].filter(id => id !== currentUserId);

      for (const adminId of uniqueAdmins) {
        await supabase.from("notifications").insert({
          user_id: adminId,
          type: "community_new_member",
          title: "New Member",
          message: `A new member joined ${community.name}`,
          reference_id: community.id,
          reference_type: "community",
          metadata: {
            community_id: community.id,
            community_name: community.name,
            new_member_id: currentUserId,
          },
        });
      }

      // Refresh members
      const { data: refreshed } = await supabase
        .from("community_members")
        .select("*, profiles(username, display_name, avatar_url, joined_at)")
        .eq("community_id", community.id)
        .order("joined_at", { ascending: false });
      setMembers(refreshed || []);
    }
  };

  const handleMute = async () => {
    if (!currentUserId || !community) return;
    const newMuted = !isMuted;
    await supabase.from("community_members").update({ muted: newMuted })
      .eq("community_id", community.id).eq("user_id", currentUserId);
    setIsMuted(newMuted);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2000);
    } catch {}
  };

  const handleReport = () => {
    alert("Report submitted. Our team will review this community.");
  };

  // ── Photo Upload ──
  const openPhotoPicker = (type: PhotoType) => {
    setShowPhotoModal(type);
    setPreviewUrl(null);
    setUploadError(null);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleUploadConfirm = async () => {
    if (!previewUrl || !showPhotoModal || !community) return;
    setIsUploading(showPhotoModal);
    setUploadError(null);

    try {
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error("No file selected.");

      const fileExt = file.name.split(".").pop();
      const fileName = `${community.id}_${showPhotoModal}_${Date.now()}.${fileExt}`;
      const filePath = `community-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("community-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("community-assets")
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Update community record
      const updateField = showPhotoModal === "profile" ? "profile_image_url" : "cover_image_url";
      const { error: updateError } = await supabase
        .from("communities")
        .update({ [updateField]: publicUrl })
        .eq("id", community.id);

      if (updateError) throw updateError;

      // Update local state
      setCommunity(prev => prev ? { ...prev, [updateField]: publicUrl } : prev);
      setShowPhotoModal(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setUploadError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(null);
    }
  };

  const handleRemovePhoto = async (type: PhotoType) => {
    if (!community) return;
    const field = type === "profile" ? "profile_image_url" : "cover_image_url";
    const { error } = await supabase
      .from("communities")
      .update({ [field]: null })
      .eq("id", community.id);
    if (!error) {
      setCommunity(prev => prev ? { ...prev, [field]: null } : prev);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", paddingBottom: "40px" }}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileSelect}
        />

        {/* Share Toast */}
        {showShareToast && (
          <div style={{
            position: "fixed", top: "20px", left: "50%", transform: "translateX(-50%)",
            background: "var(--surface-2)", border: "1px solid var(--border)",
            padding: "10px 20px", borderRadius: "99px", fontSize: "13px", fontWeight: 600,
            zIndex: 100, boxShadow: "0 4px 20px rgba(0,0,0,0.1)"
          }}>
            Link copied to clipboard!
          </div>
        )}

        {/* Photo Upload Modal */}
        {showPhotoModal && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
            padding: "20px"
          }} onClick={() => { setShowPhotoModal(null); setPreviewUrl(null); }}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "16px", padding: "24px", maxWidth: "420px", width: "100%"
            }} onClick={e => e.stopPropagation()}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700 }}>
                  {showPhotoModal === "profile" ? "Update Profile Photo" : "Update Cover Photo"}
                </h3>
                <button onClick={() => { setShowPhotoModal(null); setPreviewUrl(null); }} style={{
                  background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)"
                }}>
                  <X size={20} />
                </button>
              </div>

              {previewUrl ? (
                <div style={{ marginBottom: "16px" }}>
                  <img src={previewUrl} style={{
                    width: "100%", borderRadius: "12px",
                    aspectRatio: showPhotoModal === "profile" ? "1/1" : "16/9",
                    objectFit: "cover"
                  }} />
                </div>
              ) : (
                <div style={{
                  border: "2px dashed var(--border)", borderRadius: "12px", padding: "40px",
                  textAlign: "center", color: "var(--text-muted)", marginBottom: "16px"
                }}>
                  <Camera size={32} style={{ margin: "0 auto 8px" }} />
                  <p style={{ fontSize: "13px" }}>Select an image to preview</p>
                </div>
              )}

              {uploadError && (
                <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "12px" }}>{uploadError}</p>
              )}

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    flex: 1, padding: "10px", borderRadius: "10px", border: "1px solid var(--border)",
                    background: "var(--surface-2)", cursor: "pointer", fontWeight: 600, fontSize: "13px"
                  }}
                >
                  {previewUrl ? "Choose Different" : "Choose Image"}
                </button>
                {previewUrl && (
                  <button
                    onClick={handleUploadConfirm}
                    disabled={!!isUploading}
                    style={{
                      flex: 1, padding: "10px", borderRadius: "10px", border: "none",
                      background: "var(--gradient)", color: "white", cursor: "pointer",
                      fontWeight: 700, fontSize: "13px", opacity: isUploading ? 0.6 : 1
                    }}
                  >
                    {isUploading ? "Uploading..." : "Save"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Community Header Card */}
        {community && (
          <div style={{
            border: "1px solid var(--border)", borderRadius: "var(--radius)",
            marginBottom: "16px", overflow: "hidden", background: "var(--surface)"
          }}>
            {/* Cover Photo */}
            <div style={{
              position: "relative", width: "100%", aspectRatio: "16/5", minHeight: "120px",
              background: community.cover_image_url
                ? `url(${community.cover_image_url}) center/cover no-repeat`
                : "linear-gradient(135deg, rgba(45,135,200,0.15), rgba(61,190,122,0.1))",
              borderBottom: "1px solid var(--border)"
            }}>
              {isAdmin && (
                <button
                  onClick={() => openPhotoPicker("cover")}
                  style={{
                    position: "absolute", bottom: "12px", right: "12px",
                    padding: "6px 12px", background: "rgba(0,0,0,0.6)", color: "white",
                    borderRadius: "8px", border: "none", cursor: "pointer",
                    fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  <Camera size={12} /> {community.cover_image_url ? "Change" : "Add Cover"}
                </button>
              )}
            </div>

            {/* Profile + Info Row */}
            <div style={{ padding: "0 20px 20px", position: "relative" }}>
              {/* Profile Photo - overlaps cover */}
              <div style={{
                position: "relative", marginTop: "-32px", marginBottom: "12px",
                width: "fit-content"
              }}>
                <div style={{
                  width: "72px", height: "72px", borderRadius: "18px",
                  border: "4px solid var(--surface)",
                  background: community.profile_image_url
                    ? `url(${community.profile_image_url}) center/cover no-repeat`
                    : "var(--gradient)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "32px", overflow: "hidden", position: "relative"
                }}>
                  {!community.profile_image_url && community.icon}
                </div>
                {isAdmin && (
                  <button
                    onClick={() => openPhotoPicker("profile")}
                    style={{
                      position: "absolute", bottom: "-4px", right: "-4px",
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: "var(--surface-2)", border: "2px solid var(--surface)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}
                  >
                    <Camera size={14} style={{ color: "var(--text)" }} />
                  </button>
                )}
              </div>

              {/* Name + Actions */}
              <div style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: "16px", flexWrap: "wrap", marginBottom: "12px"
              }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <h1 style={{
                    fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px",
                    color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center",
                    gap: "8px", flexWrap: "wrap"
                  }}>
                    {community.name}
                    {community.is_private && <Lock size={14} style={{ color: "var(--text-muted)" }} />}
                    {community.verified && <Shield size={14} style={{ color: "#0D9488" }} />}
                  </h1>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "12px", fontSize: "13px",
                    color: "var(--text-muted)", flexWrap: "wrap"
                  }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Users size={13} /> {memberCount.toLocaleString()} members
                    </span>
                    <span>•</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      {community.is_private
                        ? <><EyeOff size={13} /> Private</>
                        : <><Globe size={13} /> Public</>}
                    </span>
                    {community.category && (
                      <>
                        <span>•</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Hash size={13} /> {community.category}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  {isAdmin && (
                    <Link href={`/c/${slug}/manage`}>
                      <button style={{
                        padding: "8px 14px", background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px", color: "var(--text)"
                      }}>
                        <Settings size={14} /> Manage
                      </button>
                    </Link>
                  )}
                  <button onClick={handleShare} style={{
                    padding: "8px", background: "var(--surface-2)", border: "1px solid var(--border)",
                    borderRadius: "10px", cursor: "pointer", color: "var(--text-muted)"
                  }}>
                    <Share2 size={16} />
                  </button>
                  {currentUserId && (
                    <>
                      <button onClick={handleMute} style={{
                        padding: "8px", background: "var(--surface-2)", border: "1px solid var(--border)",
                        borderRadius: "10px", cursor: "pointer",
                        color: isMuted ? "var(--accent)" : "var(--text-muted)"
                      }}>
                        {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
                      </button>
                      <button onClick={handleJoin} style={{
                        padding: "8px 18px", borderRadius: "99px", fontSize: "13px", fontWeight: 700,
                        cursor: "pointer", transition: "all 0.2s",
                        background: isJoined ? "var(--surface-2)" : "var(--gradient)",
                        color: isJoined ? "var(--text)" : "white",
                        border: isJoined ? "1px solid var(--border)" : "none",
                        display: "flex", alignItems: "center", gap: "6px"
                      }}>
                        {isJoined ? <><UserCheck size={14} /> Joined</> : <><UserPlus size={14} /> Join</>}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {community.description && (
                <p style={{
                  fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "12px"
                }}>
                  {community.description}
                </p>
              )}

              {community.tags && community.tags.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                  {community.tags.map((tag: string) => (
                    <span key={tag} style={{
                      padding: "4px 10px", borderRadius: "99px",
                      background: "rgba(13,148,136,0.08)", color: "#0D9488",
                      fontSize: "12px", fontWeight: 600
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "flex", gap: "4px", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                {[
                  { key: "posts" as Tab, label: "Posts", icon: MessageCircle },
                  { key: "about" as Tab, label: "About", icon: Eye },
                  { key: "members" as Tab, label: "Members", icon: Users },
                  { key: "rules" as Tab, label: "Rules", icon: Shield },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    style={{
                      padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                      cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "6px",
                      background: activeTab === tab.key ? "rgba(13,148,136,0.1)" : "transparent",
                      color: activeTab === tab.key ? "#0D9488" : "var(--text-muted)"
                    }}
                  >
                    <tab.icon size={14} /> {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "posts" && (
          <>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "16px", gap: "12px"
            }}>
              <div style={{ display: "flex", gap: "4px" }}>
                {[
                  { key: "top" as SortMode, label: "Top", icon: TrendingUp },
                  { key: "new" as SortMode, label: "New", icon: Clock },
                  { key: "trending" as SortMode, label: "Trending", icon: MessageCircle },
                ].map(s => (
                  <button
                    key={s.key}
                    onClick={() => setSortBy(s.key)}
                    style={{
                      padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                      cursor: "pointer", border: "none", display: "flex", alignItems: "center", gap: "4px",
                      background: sortBy === s.key ? "var(--surface-2)" : "transparent",
                      color: sortBy === s.key ? "var(--text)" : "var(--text-muted)"
                    }}
                  >
                    <s.icon size={12} /> {s.label}
                  </button>
                ))}
              </div>
              <Link href={`/c/${slug}/create`} style={{
                display: "flex", alignItems: "center", gap: "6px", padding: "10px 16px",
                borderRadius: "99px", background: "var(--gradient)", color: "white",
                textDecoration: "none", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px"
              }}>
                <PenSquare size={14} /> Post
              </Link>
            </div>

            {pinnedPosts.length > 0 && (
              <div style={{ marginBottom: "16px" }}>
                <div style={{
                  fontSize: "12px", fontWeight: 700, color: "#0D9488", marginBottom: "8px",
                  display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <Pin size={12} /> PINNED
                </div>
                {pinnedPosts.map(post => (
                  <div key={post.id} style={{ marginBottom: "8px" }}>
                    <PostCard post={post} currentUserId={currentUserId} />
                  </div>
                ))}
              </div>
            )}

            {announcements.length > 0 && (
              <div style={{
                background: "rgba(13,148,136,0.05)", border: "1px solid rgba(13,148,136,0.2)",
                borderRadius: "12px", padding: "16px", marginBottom: "16px"
              }}>
                <div style={{
                  fontSize: "12px", fontWeight: 700, color: "#0D9488", marginBottom: "8px",
                  display: "flex", alignItems: "center", gap: "4px"
                }}>
                  <Bell size={12} /> Announcements
                </div>
                {announcements.map((ann: any) => (
                  <div key={ann.id} style={{
                    padding: "8px 0", borderBottom: "1px solid rgba(13,148,136,0.1)"
                  }}>
                    <p style={{
                      fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "2px"
                    }}>{ann.title}</p>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{ann.content}</p>
                  </div>
                ))}
              </div>
            )}

            {loading ? (
              <LoadingList count={3} height="140px" />
            ) : posts.length === 0 ? (
              <EmptyState emoji="🌱" title="No posts yet." description="Be the first to share something!" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserId={currentUserId} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === "about" && community && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "20px"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>
              About {community.name}
            </h3>
            <p style={{
              fontSize: "14px", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: "20px"
            }}>
              {community.description || "No description provided."}
            </p>

            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Stats</h4>
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px"
            }}>
              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
                  {memberCount.toLocaleString()}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Members</div>
              </div>
              <div style={{ padding: "12px", background: "var(--surface-2)", borderRadius: "10px" }}>
                <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
                  {posts.length}
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Posts</div>
              </div>
            </div>

            <h4 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>Moderators</h4>
            {moderators.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {moderators.map((mod: any) => (
                  <div key={mod.id} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "50%", background: "var(--gradient)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                      overflow: "hidden"
                    }}>
                      {mod.profiles?.avatar_url ? (
                        <img src={mod.profiles.avatar_url} style={{
                          width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover"
                        }} />
                      ) : "👤"}
                    </div>
                    <div>
                      <div style={{ fontSize: "13px", fontWeight: 600 }}>
                        @{mod.profiles?.username || "Unknown"}
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{mod.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No moderators listed.</p>
            )}

            <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--border)" }}>
              <button onClick={handleReport} style={{
                display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "#ef4444",
                background: "none", border: "none", cursor: "pointer", fontWeight: 600
              }}>
                <Flag size={14} /> Report Community
              </button>
            </div>
          </div>
        )}

        {activeTab === "members" && (
          <div>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius)", padding: "12px 14px", marginBottom: "12px",
              display: "flex", alignItems: "center", gap: "10px",
            }}>
              <Users size={16} style={{ color: "var(--text-muted)" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)" }}>
                {memberCount.toLocaleString()} members
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {members.length === 0 ? (
                <div style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius)", padding: "20px", textAlign: "center",
                }}>
                  <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>No members yet.</p>
                </div>
              ) : (
                members.map((member: any) => {
                  const isThisCreator = member.user_id === community?.creator_id;
                  const isMod = moderators.some((m: any) => m.user_id === member.user_id);
                  return (
                    <div key={member.id} style={{
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: "var(--radius)", padding: "14px 16px",
                      display: "flex", alignItems: "center", gap: "12px",
                    }}>
                      <div style={{
                        width: "40px", height: "40px", borderRadius: "50%",
                        background: "var(--gradient)", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        color: "white", fontWeight: 700, fontSize: "14px",
                        overflow: "hidden", flexShrink: 0,
                      }}>
                        {member.profiles?.avatar_url ? (
                          <img src={member.profiles.avatar_url} style={{
                            width: "100%", height: "100%", objectFit: "cover",
                          }} />
                        ) : (
                          member.profiles?.display_name?.[0]?.toUpperCase() ||
                          member.profiles?.username?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: "14px", fontWeight: 700, color: "var(--text)",
                          margin: 0, display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap",
                        }}>
                          {member.profiles?.display_name || member.profiles?.username || "Unknown"}
                          {isThisCreator && (
                            <span style={{
                              fontSize: "10px", padding: "1px 6px",
                              background: "rgba(13,148,136,0.1)", color: "#0D9488",
                              borderRadius: "4px", fontWeight: 700,
                            }}>OWNER</span>
                          )}
                          {isMod && !isThisCreator && (
                            <span style={{
                              fontSize: "10px", padding: "1px 6px",
                              background: "rgba(155,109,255,0.1)", color: "#9B6DFF",
                              borderRadius: "4px", fontWeight: 700,
                            }}>MOD</span>
                          )}
                        </p>
                        <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "2px 0 0" }}>
                          @{member.profiles?.username} • Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === "rules" && (
          <div style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "var(--radius)", padding: "20px"
          }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "12px" }}>Community Rules</h3>
            {rules.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {rules.map((rule: any, idx: number) => (
                  <div key={rule.id} style={{
                    padding: "12px", background: "var(--surface-2)", borderRadius: "10px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        width: "22px", height: "22px", borderRadius: "50%", background: "var(--gradient)",
                        color: "white", fontSize: "11px", fontWeight: 800,
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{ fontSize: "14px", fontWeight: 700 }}>{rule.title}</span>
                    </div>
                    <p style={{
                      fontSize: "13px", color: "var(--text-muted)", paddingLeft: "30px"
                    }}>{rule.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                No rules have been set for this community yet.
              </p>
            )}
          </div>
        )}
      {/* Leave Modal for Creator */}
      {showLeaveModal && community && (
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
              <Link href={`/c/${slug}/manage`} onClick={() => setShowLeaveModal(false)}
                style={{
                  padding: "12px", borderRadius: "var(--radius-sm)", background: "var(--gradient)",
                  color: "white", border: "none", fontWeight: 700, cursor: "pointer",
                  fontSize: "14px", textAlign: "center", textDecoration: "none", display: "block",
                }}>
                Transfer Ownership
              </Link>
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
      </div>
    </AppShell>
  );
}
