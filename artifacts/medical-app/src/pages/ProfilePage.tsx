import { useEffect, useState, useCallback, useRef } from "react";
import AppShell from "@/components/AppShell";
import PostCard, { Post } from "@/components/PostCard";
import UserAvatar from "@/components/UserAvatar";
import { createClient } from "@/lib/supabase";
import { ROLE_COLORS, ROLE_LABELS, POST_SELECT_FIELDS } from "@/lib/constants";
import { normalizePosts } from "@/lib/posts";
import type { Profile } from "@/lib/types";
import { useParams, Link } from "wouter";
import {
  Settings, MapPin, BookOpen, Clock, MessageCircle, Bookmark,
  Lock, Globe, Shield, Award, Zap, Users, Flag, UserPlus,
  UserCheck, X, Check, Ban, VolumeX, ChevronRight,
  Image as ImageIcon, Hash, TrendingUp, Flame, Crown,
  Camera, Pin, Send, Loader2,
} from "lucide-react";

interface Comment { id: string; content: string; created_at: string; post_id: string; }
interface CommunityMembership {
  id: string; name: string; slug: string; icon_url: string | null;
  member_count: number; role: "member" | "moderator" | "admin";
}
interface FollowRequest {
  id: string; follower_id: string;
  follower: { id: string; username: string; full_name: string; avatar_url: string | null; };
  created_at: string;
}
interface BlockedUser {
  id: string; blocked_user_id: string;
  blocked_user: { username: string; full_name: string; avatar_url: string | null; };
}
interface MutedCommunity {
  id: string; community_id: string;
  community: { name: string; slug: string; icon_url: string | null; };
}
interface Badge {
  id: string; name: string; description: string; icon: string;
  color: string; earned_at: string;
}
interface ViolationRecord {
  id: string; type: "warning" | "mute" | "ban";
  reason: string; created_at: string; expires_at: string | null;
  issued_by: { username: string; };
}

type TabType = "posts" | "media" | "communities" | "saved" | "history" | "comments";
type EditModalTab = "profile" | "privacy" | "blocked" | "muted";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username;
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [mediaPosts, setMediaPosts] = useState<Post[]>([]);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [historyPosts, setHistoryPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [communities, setCommunities] = useState<CommunityMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [currentUserRole, setCurrentUserRole] = useState<string | undefined>();
  const [tab, setTab] = useState<TabType>("posts");
  const [totalUpvotes, setTotalUpvotes] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followRequestPending, setFollowRequestPending] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [karmaScore, setKarmaScore] = useState(0);
  const [studyStreak, setStudyStreak] = useState(0);
  const [topTags, setTopTags] = useState<{ tag: string; count: number }[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [mutedCommunities, setMutedCommunities] = useState<MutedCommunity[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<EditModalTab>("profile");
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [editForm, setEditForm] = useState({
    full_name: "", bio: "", status: "", institution: "",
    profession: "", course: "", study_year: "", is_private: false,
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [pinnedPosts, setPinnedPosts] = useState<Post[]>([]);
  const pinLimit = 3;

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id);

      if (user?.id) {
        const { data: currentProfile } = await supabase
          .from("profiles").select("role").eq("id", user.id).single();
        setCurrentUserRole(currentProfile?.role);
      }

      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("username", username).single();

      if (!profileData) { setLoading(false); return; }
      setProfile(profileData);
      setIsPrivate(profileData.is_private || false);
      setEditForm({
        full_name: profileData.full_name || "", bio: profileData.bio || "",
        status: profileData.status || "", institution: profileData.institution || "",
        profession: profileData.profession || "", course: profileData.course || "",
        study_year: profileData.study_year || "", is_private: profileData.is_private || false,
      });

      const { data: postsData } = await supabase
        .from("posts")
        .select(POST_SELECT_FIELDS)
        .eq("author_id", profileData.id)
        .order("pinned_at", { ascending: false, nullsLast: true })
        .order("created_at", { ascending: false })
        .limit(50);

      const normalizedPosts = normalizePosts((postsData || []) as Record<string, unknown>[]);
      const pinned = normalizedPosts.filter((p: any) => p.pinned_at);
      const regular = normalizedPosts.filter((p: any) => !p.pinned_at);
      setPinnedPosts(pinned);
      setPosts(regular);
      setMediaPosts(normalizedPosts.filter((p) => p.image_url));

      const totalVotes = (postsData || []).reduce(
        (sum: number, p: any) => sum + (p.upvotes || 0), 0
      );
      setTotalUpvotes(totalVotes);

      const { data: commentsReceived } = await supabase
        .from("comments").select("id", { count: "exact" }).eq("post_author_id", profileData.id);
      const { data: acceptedAnswers } = await supabase
        .from("comments").select("id", { count: "exact" })
        .eq("author_id", profileData.id).eq("is_accepted", true);

      const karma = totalVotes + (commentsReceived?.length || 0) * 2 + (acceptedAnswers?.length || 0) * 5;
      setKarmaScore(karma);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: activityDays } = await supabase
        .from("posts").select("created_at")
        .eq("author_id", profileData.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      const uniqueDays = new Set((activityDays || []).map((a: any) => a.created_at.split("T")[0]));
      setStudyStreak(uniqueDays.size);

      const tagCounts: Record<string, number> = {};
      (postsData || []).forEach((p: any) => {
        (p.tags || []).forEach((tag: string) => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; });
      });
      setTopTags(
        Object.entries(tagCounts).map(([tag, count]) => ({ tag, count }))
          .sort((a, b) => b.count - a.count).slice(0, 5)
      );

      if (user?.id === profileData.id) {
        const { data: saved } = await supabase
          .from("saved_posts")
          .select(`id, post:posts(${POST_SELECT_FIELDS})`)
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
        setSavedPosts(
          (saved || []).map((s: any) => s.post).filter(Boolean)
            .map((p: any) => normalizePosts([p as Record<string, unknown>])[0])
        );

        const { data: history } = await supabase
          .from("post_history")
          .select(`id, post:posts(${POST_SELECT_FIELDS})`)
          .eq("user_id", user.id).order("viewed_at", { ascending: false }).limit(50);
        setHistoryPosts(
          (history || []).map((h: any) => h.post).filter(Boolean)
            .map((p: any) => normalizePosts([p as Record<string, unknown>])[0])
        );

        const { data: requests } = await supabase
          .from("follow_requests")
          .select(`id, follower_id, created_at, follower:profiles!follower_id(id, username, full_name, avatar_url)`)
          .eq("following_id", user.id).eq("status", "pending");
        setFollowRequests((requests || []) as any);

        const { data: blocked } = await supabase
          .from("blocked_users")
          .select(`id, blocked_user_id, blocked_user:profiles!blocked_user_id(username, full_name, avatar_url)`)
          .eq("blocker_id", user.id);
        setBlockedUsers((blocked || []) as any);

        const { data: muted } = await supabase
          .from("muted_communities")
          .select(`id, community_id, community:communities(name, slug, icon_url)`)
          .eq("user_id", user.id);
        setMutedCommunities((muted || []) as any);
      }

      const { data: commentsData } = await supabase
        .from("comments").select("id, content, created_at, post_id")
        .eq("author_id", profileData.id).order("created_at", { ascending: false }).limit(50);
      setComments(commentsData || []);

      const { data: memberships } = await supabase
        .from("community_members")
        .select(`id, role, community:communities(id, name, slug, icon_url, member_count)`)
        .eq("user_id", profileData.id);
      setCommunities(
        (memberships || []).map((m: any) => ({
          id: m.community.id, name: m.community.name, slug: m.community.slug,
          icon_url: m.community.icon_url, member_count: m.community.member_count, role: m.role,
        }))
      );

      const { count: followers } = await supabase
        .from("followers").select("*", { count: "exact", head: true }).eq("following_id", profileData.id);
      const { count: following } = await supabase
        .from("followers").select("*", { count: "exact", head: true }).eq("follower_id", profileData.id);
      setFollowerCount(followers || 0);
      setFollowingCount(following || 0);

      if (user?.id && user.id !== profileData.id) {
        const { data: followData } = await supabase
          .from("followers").select("*")
          .eq("follower_id", user.id).eq("following_id", profileData.id).single();
        if (followData) { setIsFollowing(true); }
        else {
          const { data: reqData } = await supabase
            .from("follow_requests").select("*")
            .eq("follower_id", user.id).eq("following_id", profileData.id)
            .eq("status", "pending").single();
          setFollowRequestPending(!!reqData);
        }
      }

      const { data: badgesData } = await supabase
        .from("user_badges")
        .select(`id, earned_at, badge:badges(id, name, description, icon, color)`)
        .eq("user_id", profileData.id).order("earned_at", { ascending: false });
      setBadges(
        (badgesData || []).map((b: any) => ({
          id: b.badge.id, name: b.badge.name, description: b.badge.description,
          icon: b.badge.icon, color: b.badge.color, earned_at: b.earned_at,
        }))
      );

      if (user?.id && (currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === "moderator")) {
        const { data: violationsData } = await supabase
          .from("violations")
          .select(`id, type, reason, created_at, expires_at, issued_by:profiles!violations_issued_by_fkey(username)`)
          .eq("user_id", profileData.id).order("created_at", { ascending: false });
        setViolations((violationsData || []) as any);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoading(false);
    }
  }, [username]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleFollowToggle() {
    if (!currentUserId || !profile) return;
    if (isFollowing) {
      await supabase.from("followers").delete()
        .eq("follower_id", currentUserId).eq("following_id", profile.id);
      setIsFollowing(false);
      setFollowerCount(Math.max(0, followerCount - 1));
    } else if (isPrivate && !isOwn) {
      await supabase.from("follow_requests").insert({
        follower_id: currentUserId, following_id: profile.id, status: "pending",
      });
      setFollowRequestPending(true);
    } else {
      await supabase.from("followers").insert({ follower_id: currentUserId, following_id: profile.id });
      setIsFollowing(true);
      setFollowerCount(followerCount + 1);
    }
  }

  async function handleFollowRequest(requestId: string, action: "accept" | "decline") {
    if (action === "accept") {
      const request = followRequests.find((r) => r.id === requestId);
      if (request) {
        await supabase.from("followers").insert({ follower_id: request.follower_id, following_id: currentUserId });
      }
    }
    await supabase.from("follow_requests").delete().eq("id", requestId);
    setFollowRequests(followRequests.filter((r) => r.id !== requestId));
    if (action === "accept") setFollowerCount((c) => c + 1);
  }

  async function handleUnblock(blockedUserId: string) {
    await supabase.from("blocked_users").delete()
      .eq("blocker_id", currentUserId).eq("blocked_user_id", blockedUserId);
    setBlockedUsers(blockedUsers.filter((b) => b.blocked_user_id !== blockedUserId));
  }

  async function handleUnmute(communityId: string) {
    await supabase.from("muted_communities").delete()
      .eq("user_id", currentUserId).eq("community_id", communityId);
    setMutedCommunities(mutedCommunities.filter((m) => m.community_id !== communityId));
  }

  async function handleSaveProfile() {
    if (!profile) return;
    await supabase.from("profiles").update({
      full_name: editForm.full_name, bio: editForm.bio, status: editForm.status,
      institution: editForm.institution, profession: editForm.profession,
      course: editForm.course, study_year: editForm.study_year, is_private: editForm.is_private,
    }).eq("id", profile.id);
    setIsPrivate(editForm.is_private);
    setShowEditModal(false);
    fetchProfile();
  }

  async function handleReport() {
    if (!currentUserId || !profile || !reportReason.trim()) return;
    await supabase.from("reports").insert({
      reporter_id: currentUserId, reported_user_id: profile.id,
      reason: reportReason, status: "pending",
    });
    setShowReportModal(false);
    setReportReason("");
  }

  async function handleModerationAction(action: "warn" | "mute" | "ban") {
    if (!profile || !currentUserId) return;
    await supabase.from("violations").insert({
      user_id: profile.id, type: action, reason: `Moderator ${action}`, issued_by: currentUserId,
    });
    fetchProfile();
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || !currentUserId) return;
    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}-avatar-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("profiles").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("profiles").getPublicUrl(filePath);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
      setProfile({ ...profile, avatar_url: cacheBustedUrl });
    } catch (err) {
      console.error("Avatar upload failed:", err);
      alert("Failed to upload avatar. Please try again.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !profile || !currentUserId) return;
    setUploadingBanner(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${currentUserId}-banner-${Date.now()}.${fileExt}`;
      const filePath = `banners/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from("profiles").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("profiles").getPublicUrl(filePath);
      const cacheBustedUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ banner_url: publicUrl }).eq("id", profile.id);
      setProfile({ ...profile, banner_url: cacheBustedUrl });
    } catch (err) {
      console.error("Banner upload failed:", err);
      alert("Failed to upload banner. Please try again.");
    } finally {
      setUploadingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }

  async function handlePinToggle(postId: string, isPinned: boolean) {
    if (!profile || !isOwn) return;
    if (!isPinned && pinnedPosts.length >= pinLimit) {
      alert(`You can only pin up to ${pinLimit} posts. Unpin one first.`);
      return;
    }
    try {
      await supabase.from("posts")
        .update({ pinned_at: isPinned ? null : new Date().toISOString() })
        .eq("id", postId).eq("author_id", profile.id);
      fetchProfile();
    } catch (err) {
      console.error("Pin toggle failed:", err);
    }
  }

  function handleMessage() {
    if (!profile) return;
    window.location.href = `/messages/${profile.username}`;
  }

  const isOwn = currentUserId === profile?.id;
  const isAdmin = currentUserRole === "admin" || currentUserRole === "super_admin" || currentUserRole === "moderator";
  const canViewPrivate = !isPrivate || isOwn || isFollowing;

  if (loading) {
    return (
      <AppShell>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ height: "200px", background: "rgba(0,0,0,0.03)" }} />
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", marginTop: "-40px", marginBottom: "16px", gap: "12px" }}>
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(0,0,0,0.03)", border: "4px solid var(--surface)", flexShrink: 0 }} />
                <div style={{ paddingTop: "40px" }}>
                  <div style={{ width: "160px", height: "20px", background: "rgba(0,0,0,0.03)", borderRadius: "4px", marginBottom: "6px" }} />
                  <div style={{ width: "100px", height: "14px", background: "rgba(0,0,0,0.03)", borderRadius: "4px" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "12px", textAlign: "center" }}>
          <p style={{ fontFamily: "var(--font-body)", color: "var(--text-muted)", fontSize: "16px" }}>
            User not found.
          </p>
        </div>
      </AppShell>
    );
  }

  if (isPrivate && !isOwn && !isFollowing && !isAdmin) {
    return (
      <AppShell>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "12px" }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", textAlign: "center", padding: "48px 24px" }}>
            <Lock size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--text)", margin: "0 0 8px 0" }}>
              This account is private
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", fontFamily: "var(--font-body)", margin: "0 0 20px 0" }}>
              Follow @{profile.username} to see their posts and activity.
            </p>
            <button
              onClick={handleFollowToggle}
              disabled={followRequestPending}
              style={{
                padding: "10px 24px", borderRadius: "99px", border: "none",
                background: followRequestPending ? "rgba(0,0,0,0.03)" : "#1ABC9C",
                color: followRequestPending ? "var(--text-muted)" : "#fff",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px",
                cursor: followRequestPending ? "default" : "pointer",
              }}
            >
              {followRequestPending ? "Request Sent" : "Follow"}
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "12px" }}>
        {/* Profile Header Card */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: "20px",
          }}
        >
          {/* Cover / Banner Area */}
          <div
            style={{
              height: "200px",
              background: profile.banner_url
                ? `url(${profile.banner_url}) center/cover`
                : "linear-gradient(135deg, #1ABC9C 0%, #16A085 100%)",
              position: "relative",
            }}
          >
            {isOwn && (
              <>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={uploadingBanner}
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    right: "12px",
                    padding: "6px 12px",
                    borderRadius: "99px",
                    border: "none",
                    background: "rgba(0,0,0,0.6)",
                    color: "#fff",
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  {uploadingBanner ? (
                    <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Camera size={12} />
                  )}
                  {uploadingBanner ? "Uploading..." : "Change Cover"}
                </button>
              </>
            )}
          </div>

          {/* Profile Info - FIXED LAYOUT */}
          <div style={{ padding: "0 20px 20px" }}>
            {/* Row 1: Avatar + Name/Username + Actions - all on same baseline, no overlap */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: "-40px",
                marginBottom: "16px",
                gap: "12px",
              }}
            >
              {/* Left: Avatar + Name cluster */}
              <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1, minWidth: 0 }}>
                {/* Avatar with Upload Overlay - FIXED: object-fit cover wrapper */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      border: "4px solid var(--surface)",
                      overflow: "hidden",
                      background: "var(--surface)",
                      position: "relative",
                    }}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.username}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          objectPosition: "center",
                          display: "block",
                        }}
                      />
                    ) : (
                      <UserAvatar
                        url={null}
                        username={profile.username}
                        size={80}
                        style={{
                          width: "100%",
                          height: "100%",
                        }}
                      />
                    )}
                  </div>
                  {isOwn && (
                    <>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        style={{ display: "none" }}
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        style={{
                          position: "absolute",
                          bottom: "2px",
                          right: "2px",
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          border: "2px solid var(--surface)",
                          background: "#1ABC9C",
                          color: "#fff",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        {uploadingAvatar ? (
                          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Camera size={12} />
                        )}
                      </button>
                    </>
                  )}
                </div>

                {/* Name + Username - FIXED: no overlap, proper spacing */}
                <div style={{ minWidth: 0, paddingTop: "40px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    <h1
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "var(--text)",
                        margin: 0,
                        lineHeight: 1.2,
                      }}
                    >
                      {profile.full_name || profile.username}
                    </h1>
                    {profile.is_verified && (
                      <Shield size={16} color="#1ABC9C" fill="#1ABC9C" />
                    )}
                    {profile.role === "super_admin" && (
                      <Crown size={16} color="#F39C12" />
                    )}
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-body)",
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      margin: "2px 0 0 0",
                    }}
                  >
                    @{profile.username}
                  </p>
                </div>
              </div>

              {/* Right: Action Buttons - FIXED: smaller, compact, vertically centered */}
              <div style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, paddingTop: "0px" }}>
                {isOwn ? (
                  <button
                    onClick={() => setShowEditModal(true)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "99px",
                      border: "1px solid var(--border)",
                      background: "rgba(0,0,0,0.03)",
                      color: "var(--text)",
                      fontFamily: "var(--font-display)",
                      fontWeight: 600,
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Settings size={13} />
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleMessage}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "99px",
                        border: "1px solid var(--border)",
                        background: "rgba(0,0,0,0.03)",
                        color: "var(--text)",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Send size={13} />
                      Message
                    </button>
                    <button
                      onClick={handleFollowToggle}
                      style={{
                        padding: "6px 14px",
                        borderRadius: "99px",
                        border: "none",
                        background: isFollowing ? "rgba(0,0,0,0.03)" : "#1ABC9C",
                        color: isFollowing ? "var(--text)" : "#fff",
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "12px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isFollowing ? (
                        <><UserCheck size={13} /> Following</>
                      ) : followRequestPending ? (
                        <><Clock size={13} /> Pending</>
                      ) : (
                        <><UserPlus size={13} /> Follow</>
                      )}
                    </button>
                    <button
                      onClick={() => setShowReportModal(true)}
                      style={{
                        padding: "6px 10px",
                        borderRadius: "99px",
                        border: "1px solid var(--border)",
                        background: "rgba(0,0,0,0.03)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Flag size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bio & Details */}
            {profile.bio && (
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  color: "var(--text)",
                  lineHeight: 1.5,
                  margin: "0 0 14px 0",
                }}
              >
                {profile.bio}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px 16px",
                fontSize: "13px",
                color: "var(--text-muted)",
                fontFamily: "var(--font-body)",
                marginBottom: "16px",
              }}
            >
              {profile.institution && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <BookOpen size={14} />
                  {profile.institution}
                </span>
              )}
              {profile.profession && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Award size={14} />
                  {profile.profession}
                </span>
              )}
              {profile.course && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Hash size={14} />
                  {profile.course} {profile.study_year && `· Year ${profile.study_year}`}
                </span>
              )}
              <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <Clock size={14} />
                Joined {new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              {isPrivate && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Lock size={14} />
                  Private
                </span>
              )}
              {!isPrivate && (
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Globe size={14} />
                  Public
                </span>
              )}
            </div>

            {/* Stats Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                gap: "24px",
                paddingTop: "16px",
                borderTop: "1px solid var(--border)",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={() => setShowFollowersModal(true)}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {followerCount.toLocaleString()}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Followers
                </div>
              </button>
              <button
                onClick={() => setShowFollowingModal(true)}
                style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
              >
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {followingCount.toLocaleString()}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Following
                </div>
              </button>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {totalUpvotes.toLocaleString()}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Upvotes
                </div>
              </div>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {karmaScore.toLocaleString()}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Karma
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Karma & Streak Banner (Own Profile) */}
        {isOwn && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(26, 188, 156, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Zap size={20} color="#1ABC9C" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {karmaScore}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Karma Score
                </div>
              </div>
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(231, 76, 60, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flame size={20} color="#E74C3C" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {studyStreak}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Day Streak
                </div>
              </div>
            </div>
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "rgba(155, 89, 182, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp size={20} color="#9B59B6" />
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>
                  {posts.length}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  Posts
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Award size={18} color="#F39C12" />
              Badges
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  title={`${badge.name}: ${badge.description} • Earned ${new Date(badge.earned_at).toLocaleDateString()}`}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "99px",
                    background: `${badge.color}15`,
                    border: `1px solid ${badge.color}40`,
                    color: badge.color,
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    cursor: "default",
                  }}
                >
                  {badge.icon}
                  {badge.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Tags */}
        {topTags.length > 0 && (
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "20px",
            }}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--text)",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Hash size={18} color="#9B59B6" />
              Top Topics
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {topTags.map(({ tag, count }) => (
                <Link
                  key={tag}
                  href={`/tag/${tag}`}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "99px",
                    background: "rgba(0,0,0,0.03)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Hash size={12} />
                  {tag}
                  <span style={{ color: "var(--text-muted)", fontSize: "11px" }}>
                    {count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: "4px",
            borderBottom: "1px solid var(--border)",
            marginBottom: "20px",
            overflowX: "auto",
          }}
        >
          {(
            [
              { key: "posts", label: "Posts", icon: MessageCircle },
              { key: "media", label: "Media", icon: ImageIcon },
              { key: "communities", label: "Communities", icon: Users },
              ...(isOwn
                ? [
                    { key: "saved", label: "Saved", icon: Bookmark },
                    { key: "history", label: "History", icon: Clock },
                  ]
                : []),
              { key: "comments", label: "Comments", icon: MessageCircle },
            ] as { key: TabType; label: string; icon: typeof MessageCircle }[]
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                padding: "10px 14px",
                border: "none",
                borderBottom: `2px solid ${tab === key ? "#1ABC9C" : "transparent"}`,
                background: "none",
                color: tab === key ? "#1ABC9C" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                whiteSpace: "nowrap",
                transition: "color 0.2s, border-color 0.2s",
              }}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Pinned Posts Section (Posts Tab Only) */}
        {tab === "posts" && pinnedPosts.length > 0 && (
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Pin size={16} color="#F39C12" />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "var(--text)",
                  margin: 0,
                }}
              >
                Pinned Posts
              </h3>
              {isOwn && (
                <span
                  style={{
                    fontFamily: "var(--font-body)",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginLeft: "4px",
                  }}
                >
                  {pinnedPosts.length}/{pinLimit}
                </span>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pinnedPosts.map((post) => (
                <div key={post.id} style={{ position: "relative" }}>
                  <PostCard post={post} />
                  {isOwn && (
                    <button
                      onClick={() => handlePinToggle(post.id, true)}
                      title="Unpin post"
                      style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        padding: "4px 8px",
                        borderRadius: "99px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        zIndex: 5,
                      }}
                    >
                      <Pin size={12} />
                      Unpin
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div>
          {tab === "posts" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {isOwn && pinnedPosts.length < pinLimit && posts.length > 0 && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "rgba(243, 156, 18, 0.08)",
                    border: "1px dashed rgba(243, 156, 18, 0.3)",
                    borderRadius: "12px",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Pin size={14} color="#F39C12" />
                  You can pin up to {pinLimit} posts. Hover over any post to pin it.
                </div>
              )}
              {posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id} style={{ position: "relative" }}>
                    <PostCard post={post} />
                    {isOwn && pinnedPosts.length < pinLimit && (
                      <button
                        onClick={() => handlePinToggle(post.id, false)}
                        title="Pin to profile"
                        style={{
                          position: "absolute",
                          top: "8px",
                          right: "8px",
                          padding: "4px 8px",
                          borderRadius: "99px",
                          border: "1px solid var(--border)",
                          background: "var(--surface)",
                          color: "var(--text-muted)",
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          opacity: 0,
                          transition: "opacity 0.2s",
                          zIndex: 5,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                      >
                        <Pin size={12} />
                        Pin
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState message="No posts yet" icon={MessageCircle} />
              )}
            </div>
          )}

          {tab === "media" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {mediaPosts.length > 0 ? (
                mediaPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <EmptyState message="No media posts yet" icon={ImageIcon} />
              )}
            </div>
          )}

          {tab === "communities" && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}
            >
              {communities.length > 0 ? (
                communities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/c/${community.slug}`}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(0,0,0,0.03)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "var(--surface)")
                    }
                  >
                    {community.icon_url ? (
                      <img
                        src={community.icon_url}
                        alt=""
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.03)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Users size={18} color="var(--text-muted)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-display)",
                          fontWeight: 600,
                          fontSize: "13px",
                          color: "var(--text)",
                          marginBottom: "2px",
                        }}
                      >
                        {community.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: "11px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {community.member_count.toLocaleString()} members
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 10px",
                        borderRadius: "99px",
                        background: `${ROLE_COLORS[community.role]}15`,
                        color: ROLE_COLORS[community.role],
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {ROLE_LABELS[community.role]}
                    </span>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </Link>
                ))
              ) : (
                <EmptyState message="Not a member of any communities" icon={Users} />
              )}
            </div>
          )}

          {tab === "saved" && isOwn && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {savedPosts.length > 0 ? (
                savedPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <EmptyState message="No saved posts" icon={Bookmark} />
              )}
            </div>
          )}

          {tab === "history" && isOwn && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {historyPosts.length > 0 ? (
                historyPosts.map((post) => <PostCard key={post.id} post={post} />)
              ) : (
                <EmptyState message="No browsing history" icon={Clock} />
              )}
            </div>
          )}

          {tab === "comments" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <Link
                    key={comment.id}
                    href={`/post/${comment.post_id}`}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      textDecoration: "none",
                      display: "block",
                    }}
                  >
                    <p
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "13px",
                        color: "var(--text)",
                        lineHeight: 1.5,
                        margin: "0 0 8px 0",
                      }}
                    >
                      {comment.content}
                    </p>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {new Date(comment.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </Link>
                ))
              ) : (
                <EmptyState message="No comments yet" icon={MessageCircle} />
              )}
            </div>
          )}
        </div>

        {/* Follow Requests (Own Profile) */}
        {isOwn && followRequests.length > 0 && (
          <div
            style={{
              position: "fixed",
              bottom: "24px",
              right: "24px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              padding: "16px",
              maxWidth: "340px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              zIndex: 50,
            }}
          >
            <h4
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--text)",
                margin: "0 0 12px 0",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <UserPlus size={16} />
              Follow Requests ({followRequests.length})
            </h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {followRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <UserAvatar
                    url={request.follower.avatar_url}
                    username={request.follower.username}
                    size={32}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontFamily: "var(--font-display)",
                        fontWeight: 600,
                        fontSize: "13px",
                        color: "var(--text)",
                      }}
                    >
                      {request.follower.full_name || request.follower.username}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      @{request.follower.username}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      onClick={() => handleFollowRequest(request.id, "accept")}
                      style={{
                        padding: "6px",
                        borderRadius: "50%",
                        border: "none",
                        background: "#1ABC9C",
                        color: "#fff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleFollowRequest(request.id, "decline")}
                      style={{
                        padding: "6px",
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.03)",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <Modal onClose={() => setShowEditModal(false)} title="Edit Profile">
          <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--border)", marginBottom: "20px" }}>
            {(
              [
                { key: "profile", label: "Profile", icon: UserCheck },
                { key: "privacy", label: "Privacy", icon: Lock },
                { key: "blocked", label: "Blocked", icon: Ban },
                { key: "muted", label: "Muted", icon: VolumeX },
              ] as { key: EditModalTab; label: string; icon: typeof UserCheck }[]
            ).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setEditModalTab(key)}
                style={{
                  padding: "10px 14px",
                  border: "none",
                  borderBottom: `2px solid ${editModalTab === key ? "#1ABC9C" : "transparent"}`,
                  background: "none",
                  color: editModalTab === key ? "#1ABC9C" : "var(--text-muted)",
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {editModalTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "12px",
                    border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                  Bio
                </label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "12px",
                    border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px",
                    outline: "none", resize: "vertical",
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                  Status
                </label>
                <input
                  type="text"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  placeholder="e.g., Studying for MBBS finals"
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "12px",
                    border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                    color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                  }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                    Institution
                  </label>
                  <input
                    type="text"
                    value={editForm.institution}
                    onChange={(e) => setEditForm({ ...editForm, institution: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "12px",
                      border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                      color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                    Profession
                  </label>
                  <input
                    type="text"
                    value={editForm.profession}
                    onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "12px",
                      border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                      color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                    Course
                  </label>
                  <input
                    type="text"
                    value={editForm.course}
                    onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "12px",
                      border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                      color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: 600, color: "var(--text)", marginBottom: "6px" }}>
                    Study Year
                  </label>
                  <input
                    type="text"
                    value={editForm.study_year}
                    onChange={(e) => setEditForm({ ...editForm, study_year: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: "12px",
                      border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                      color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px", outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {editModalTab === "privacy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "14px 16px", background: "rgba(0,0,0,0.03)",
                  borderRadius: "12px", border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
                    Private Account
                  </div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Only approved followers can see your posts and activity
                  </div>
                </div>
                <button
                  onClick={() => setEditForm({ ...editForm, is_private: !editForm.is_private })}
                  style={{
                    width: "44px", height: "24px", borderRadius: "99px", border: "none",
                    background: editForm.is_private ? "#1ABC9C" : "rgba(0,0,0,0.06)",
                    cursor: "pointer", position: "relative", transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: "18px", height: "18px", borderRadius: "50%", background: "#fff",
                      position: "absolute", top: "3px",
                      left: editForm.is_private ? "22px" : "3px",
                      transition: "left 0.2s",
                    }}
                  />
                </button>
              </div>
            </div>
          )}

          {editModalTab === "blocked" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {blockedUsers.length > 0 ? (
                blockedUsers.map((blocked) => (
                  <div
                    key={blocked.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", background: "rgba(0,0,0,0.03)",
                      borderRadius: "12px", border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <UserAvatar
                        url={blocked.blocked_user.avatar_url}
                        username={blocked.blocked_user.username}
                        size={32}
                      />
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>
                          {blocked.blocked_user.full_name || blocked.blocked_user.username}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                          @{blocked.blocked_user.username}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(blocked.blocked_user_id)}
                      style={{
                        padding: "6px 12px", borderRadius: "99px", border: "1px solid var(--border)",
                        background: "var(--surface)", color: "var(--text)",
                        fontFamily: "var(--font-body)", fontSize: "11px", cursor: "pointer",
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "14px", padding: "12px" }}>
                  No blocked users
                </p>
              )}
            </div>
          )}

          {editModalTab === "muted" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {mutedCommunities.length > 0 ? (
                mutedCommunities.map((muted) => (
                  <div
                    key={muted.id}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", background: "rgba(0,0,0,0.03)",
                      borderRadius: "12px", border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      {muted.community.icon_url ? (
                        <img
                          src={muted.community.icon_url}
                          alt=""
                          style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Users size={14} color="var(--text-muted)" />
                        </div>
                      )}
                      <div>
                        <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)" }}>
                          {muted.community.name}
                        </div>
                        <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                          c/{muted.community.slug}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnmute(muted.community_id)}
                      style={{
                        padding: "6px 12px", borderRadius: "99px", border: "1px solid var(--border)",
                        background: "var(--surface)", color: "var(--text)",
                        fontFamily: "var(--font-body)", fontSize: "11px", cursor: "pointer",
                      }}
                    >
                      Unmute
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "14px", padding: "12px" }}>
                  No muted communities
                </p>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex", justifyContent: "flex-end", gap: "10px",
              marginTop: "24px", paddingTop: "16px", borderTop: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setShowEditModal(false)}
              style={{
                padding: "10px 20px", borderRadius: "99px", border: "1px solid var(--border)",
                background: "rgba(0,0,0,0.03)", color: "var(--text)",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              style={{
                padding: "10px 24px", borderRadius: "99px", border: "none",
                background: "#1ABC9C", color: "#fff",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer",
              }}
            >
              Save Changes
            </button>
          </div>
        </Modal>
      )}

      {/* Followers Modal */}
      {showFollowersModal && (
        <FollowListModal
          title="Followers"
          userId={profile.id}
          type="followers"
          onClose={() => setShowFollowersModal(false)}
        />
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <FollowListModal
          title="Following"
          userId={profile.id}
          type="following"
          onClose={() => setShowFollowingModal(false)}
        />
      )}

      {/* Report Modal */}
      {showReportModal && (
        <Modal onClose={() => setShowReportModal(false)} title="Report User">
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
              Why are you reporting @{profile.username}?
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              rows={4}
              style={{
                width: "100%", padding: "10px 14px", borderRadius: "12px",
                border: "1px solid var(--border)", background: "rgba(0,0,0,0.03)",
                color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "14px",
                outline: "none", resize: "vertical",
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: "10px 20px", borderRadius: "99px", border: "1px solid var(--border)",
                  background: "rgba(0,0,0,0.03)", color: "var(--text)",
                  fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={!reportReason.trim()}
                style={{
                  padding: "10px 24px", borderRadius: "99px", border: "none",
                  background: reportReason.trim() ? "#E74C3C" : "rgba(0,0,0,0.06)",
                  color: "#fff", fontFamily: "var(--font-display)", fontWeight: 600,
                  fontSize: "13px", cursor: reportReason.trim() ? "pointer" : "default",
                }}
              >
                Submit Report
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Admin/Mod Violations Panel */}
      {isAdmin && violations.length > 0 && (
        <div
          style={{
            position: "fixed", bottom: "24px", left: "24px",
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: "12px", padding: "16px 20px",
            maxWidth: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", zIndex: 50,
          }}
        >
          <h4
            style={{
              fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: 700,
              color: "var(--text)", margin: "0 0 12px 0",
              display: "flex", alignItems: "center", gap: "8px",
            }}
          >
            <Shield size={16} color="#E74C3C" />
            Violation History ({violations.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {violations.map((v) => (
              <div
                key={v.id}
                style={{
                  padding: "10px 12px", background: "rgba(0,0,0,0.03)",
                  borderRadius: "12px", border: "1px solid var(--border)", fontSize: "13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span
                    style={{
                      padding: "2px 8px", borderRadius: "99px",
                      background: v.type === "ban" ? "#E74C3C15" : v.type === "mute" ? "#F39C1215" : "#F1C40F15",
                      color: v.type === "ban" ? "#E74C3C" : v.type === "mute" ? "#F39C12" : "#F1C40F",
                      fontWeight: 600, fontSize: "11px", textTransform: "uppercase",
                    }}
                  >
                    {v.type}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>
                    by {v.issued_by.username}
                  </span>
                </div>
                <p style={{ color: "var(--text)", margin: 0, fontFamily: "var(--font-body)" }}>
                  {v.reason}
                </p>
                {v.expires_at && (
                  <p style={{ color: "var(--text-muted)", fontSize: "11px", margin: "4px 0 0 0" }}>
                    Expires: {new Date(v.expires_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button
              onClick={() => handleModerationAction("warn")}
              style={{
                flex: 1, padding: "8px", borderRadius: "12px",
                border: "1px solid #F1C40F", background: "#F1C40F15", color: "#F1C40F",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11px", cursor: "pointer",
              }}
            >
              Warn
            </button>
            <button
              onClick={() => handleModerationAction("mute")}
              style={{
                flex: 1, padding: "8px", borderRadius: "12px",
                border: "1px solid #F39C12", background: "#F39C1215", color: "#F39C12",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11px", cursor: "pointer",
              }}
            >
              Mute
            </button>
            <button
              onClick={() => handleModerationAction("ban")}
              style={{
                flex: 1, padding: "8px", borderRadius: "12px",
                border: "1px solid #E74C3C", background: "#E74C3C15", color: "#E74C3C",
                fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "11px", cursor: "pointer",
              }}
            >
              Ban
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}

/* ─── Sub-components ─── */

function EmptyState({ message, icon: Icon }: { message: string; icon: typeof MessageCircle }) {
  return (
    <div
      style={{
        textAlign: "center", padding: "48px 24px",
        background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
      }}
    >
      <Icon size={40} color="var(--text-muted)" style={{ marginBottom: "12px", opacity: 0.5 }} />
      <p style={{ fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text-muted)", margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 100, padding: "12px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "12px", maxWidth: "560px", width: "100%",
          maxHeight: "80vh", overflow: "auto", padding: "24px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: "4px" }}
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FollowListModal({
  title,
  userId,
  type,
  onClose,
}: {
  title: string;
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
}) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetch() {
      const column = type === "followers" ? "following_id" : "follower_id";
      const selectColumn = type === "followers" ? "follower_id" : "following_id";
      const { data } = await supabase
        .from("followers")
        .select(`
          ${selectColumn},
          profile:profiles!${selectColumn}(id, username, full_name, avatar_url, bio)
        `)
        .eq(column, userId)
        .order("created_at", { ascending: false })
        .limit(50);

      setUsers(
        (data || []).map((d: any) => ({
          id: d.profile.id,
          username: d.profile.username,
          full_name: d.profile.full_name,
          avatar_url: d.profile.avatar_url,
          bio: d.profile.bio,
        }))
      );
      setLoading(false);
    }
    fetch();
  }, [userId, type]);

  return (
    <Modal onClose={onClose} title={title}>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)" }}>Loading...</p>
        ) : users.length > 0 ? (
          users.map((user) => (
            <Link
              key={user.id}
              href={`/u/${user.username}`}
              onClick={onClose}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "10px 12px", background: "rgba(0,0,0,0.03)",
                borderRadius: "12px", border: "1px solid var(--border)",
                textDecoration: "none", transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.06)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.03)")}
            >
              <UserAvatar url={user.avatar_url} username={user.username} size={40} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text)" }}>
                  {user.full_name || user.username}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)" }}>
                  @{user.username}
                </div>
                {user.bio && (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.bio}
                  </div>
                )}
              </div>
              <ChevronRight size={16} color="var(--text-muted)" />
            </Link>
          ))
        ) : (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)", padding: "12px" }}>
            No users found
          </p>
        )}
      </div>
    </Modal>
  );
}
