import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
    Users,
      User,
  Settings,
  LogOut,
  Heart,
    GraduationCap,
  Shield,
  Activity,
  FlaskConical,
  Sparkles,
  ChevronRight,
  X,
  Plus,
  Compass,
  Crown,
  Zap,
  TrendingUp,
  Star,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export default function Sidebar({ isOpen, onClose, userRole = "user" }: SidebarProps) {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [joinedCommunities, setJoinedCommunities] = useState<any[]>([]);
  const [createdCommunities, setCreatedCommunities] = useState<any[]>([]);
  const [isDesktop, setIsDesktop] = useState(false);

  // SUPER ADMIN check - includes all admin roles
  const effectiveRole = profile?.role || userRole; // profile.role wins once loaded
const isAdmin = ["admin", "app_admin", "super_admin", "moderator"].includes(effectiveRole);
const isSuperAdmin = effectiveRole === "super_admin";

  useEffect(() => {
    loadUser();
    loadCommunities();
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadUnreadCount();
    }
  }, [isOpen]);

  const checkDesktop = () => {
    setIsDesktop(window.innerWidth >= 1024);
  };

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
    }
  };

  const loadCommunities = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load joined communities
    const { data: joined } = await supabase
      .from("community_members")
      .select("communities:community_id(id, name, slug, icon)")
      .eq("user_id", user.id)
      .limit(10);

    if (joined) {
      setJoinedCommunities(joined.map((j: any) => j.communities).filter(Boolean));
    }

    // Load created communities
    const { data: created } = await supabase
      .from("communities")
      .select("id, name, slug, icon")
      .eq("created_by", user.id)
      .limit(10);

    if (created) {
      setCreatedCommunities(created);
    }
  };

  const loadUnreadCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setUnreadCount(count || 0);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setToastMessage("Signed out successfully");
    setShowToast(true);
    setTimeout(() => {
      navigate("/login");
      onClose();
    }, 1000);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    onClose();
  };

  // SECTIONS (Reddit-style, no bottom nav duplicates)

  // MAIN - only quick actions not in bottom nav
  const mainLinks = [
    { icon: TrendingUp, label: "Popular", path: "/popular" },
    { icon: Zap, label: "Recent", path: "/recent" },
  ];

  // COMMUNITIES - discover, create, joined
  const communityLinks = [
    { icon: Compass, label: "Discover Communities", path: "/discover-communities" },
    { icon: Plus, label: "Start a Community", path: "/start-community" },
  ];

  // PERSONAL - user's own content (NOT bottom nav duplicates)
  const personalLinks = [
    { icon: Heart, label: "Saved Posts", path: "/saved-posts" },
    { icon: MessageCircle, label: "My Posts", path: "/my-posts" },
  ];

  // STUDY - academic tools
  const studyLinks = [
    { icon: GraduationCap, label: "Materials", path: "/materials" },
    { icon: Activity, label: "Flashcards", path: "/flashcards" },
    { icon: FlaskConical, label: "Quizzes", path: "/quiz" },
  ];

  // MODERATION - admin only
  const adminLinks = [
    { icon: Shield, label: "Admin Panel", path: "/admin" },
    { icon: Sparkles, label: "AI Models", path: "/admin/ai-models" },
  ];

  const CommunityLinkItem = ({ iconUrl, label, path }: { iconUrl?: string; label: string; path: string }) => {
    const [loc] = useLocation();
    const isActive = loc === path || loc.startsWith(path + "/");

    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigation(path)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "10px 14px",
          borderRadius: "10px",
          background: isActive ? "rgba(13, 148, 136, 0.08)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: isActive ? "#0D9488" : "var(--text)",
          fontSize: "14px",
          fontWeight: isActive ? 600 : 500,
          fontFamily: "var(--font-display)",
          transition: "all 0.2s",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(0,0,0,0.03)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        {iconUrl ? (
          <img src={iconUrl} alt="" style={{ width: 20, height: 20, borderRadius: "4px", objectFit: "cover" }} />
        ) : (
          <Users size={20} />
        )}
        <span style={{ flex: 1 }}>{label}</span>
        {isActive && <ChevronRight size={16} />}
      </motion.button>
    );
  };

  const LinkItem = ({ icon: Icon, label, path, badge }: { icon: any; label: string; path: string; badge?: number }) => {
    const [loc] = useLocation();
    const isActive = loc === path || loc.startsWith(path + "/");

    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleNavigation(path)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          width: "100%",
          padding: "10px 14px",
          borderRadius: "10px",
          background: isActive ? "rgba(13, 148, 136, 0.08)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: isActive ? "#0D9488" : "var(--text)",
          fontSize: "14px",
          fontWeight: isActive ? 600 : 500,
          fontFamily: "var(--font-display)",
          transition: "all 0.2s",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "rgba(0,0,0,0.03)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = "transparent";
          }
        }}
      >
        <Icon size={20} />
        <span style={{ flex: 1 }}>{label}</span>
        {badge ? (
          <span style={{
            background: "#EF4444",
            color: "white",
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "99px",
            minWidth: "20px",
            textAlign: "center",
          }}>
            {badge > 99 ? "99+" : badge}
          </span>
        ) : null}
        {isActive && <ChevronRight size={16} />}
      </motion.button>
    );
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <p style={{
      fontSize: "11px",
      fontWeight: 700,
      color: "var(--text-muted)",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      padding: "0 14px",
      marginBottom: "4px",
      marginTop: "16px",
    }}>
      {title}
    </p>
  );

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div style={{
        padding: "16px",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img 
            src="/logo.png" 
            alt="MedStudent" 
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              objectFit: "cover",
            }}
          />
          <span style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--text)",
          }}>
            MedStudent
          </span>
        </div>
        {!isDesktop && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "var(--text-muted)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Scrollable Content */}
      <div style={{
  flex: 1,
  overflowY: "auto",
  overflowX: "hidden",
  padding: "12px",
  WebkitOverflowScrolling: "touch",
}}>
        {/* User Profile Card */}
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "var(--bg)",
              borderRadius: "12px",
              padding: "14px",
              marginBottom: "16px",
              border: "1px solid var(--border)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: profile?.avatar_url
                  ? `url(${profile.avatar_url}) center/cover`
                  : "linear-gradient(135deg, #0D9488, #14B8A6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 600,
                fontSize: "14px",
                flexShrink: 0,
              }}>
                {!profile?.avatar_url && (profile?.full_name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "var(--text)",
                  margin: "0 0 2px 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {profile?.full_name || user.email?.split("@")[0] || "User"}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <p style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}>
                    {profile?.profession || "Medical Student"}
                  </p>
                  {isSuperAdmin && (
                    <span style={{
                      padding: "2px 6px",
                      borderRadius: "4px",
                      background: "#FFF8EC",
                      color: "#F5A623",
                      fontSize: "10px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}>
                      <Crown size={10} style={{ display: "inline", marginRight: "2px" }} />
                      Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: "flex",
              gap: "12px",
              marginTop: "12px",
              paddingTop: "12px",
              borderTop: "1px solid var(--border)",
            }}>
              <div style={{ textAlign: "center", flex: 1 }}>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
                  {profile?.followers_count || 0}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Followers</p>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
                  {profile?.following_count || 0}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Following</p>
              </div>
              <div style={{ textAlign: "center", flex: 1 }}>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
                  {profile?.upvotes_count || 0}
                </p>
                <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Upvotes</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* MAIN - Quick Access */}
        <SectionHeader title="Feeds" />
        {mainLinks.map((link) => (
          <LinkItem key={link.path} {...link} />
        ))}

        {/* COMMUNITIES */}
        <SectionHeader title="Communities" />
        {communityLinks.map((link) => (
          <LinkItem key={link.path} {...link} />
        ))}

        {/* Joined Communities */}
        {joinedCommunities.length > 0 && (
          <>
            <SectionHeader title="My Communities" />
            {joinedCommunities.map((comm) => (
              <CommunityLinkItem
                key={comm.id}
                iconUrl={comm.icon}
                label={comm.name}
                path={`/community/${comm.slug}`}
              />
            ))}
          </>
        )}

        {/* Created Communities (only if any) */}
        {createdCommunities.length > 0 && (
          <>
            <SectionHeader title="Created by Me" />
            {createdCommunities.map((comm) => (
              <CommunityLinkItem
                key={comm.id}
                iconUrl={comm.icon}
                label={comm.name}
                path={`/community/${comm.slug}`}
              />
            ))}
          </>
        )}

        {/* PERSONAL */}
        <SectionHeader title="Personal" />
        {personalLinks.map((link) => (
          <LinkItem key={link.path} {...link} />
        ))}

        {/* STUDY */}
        <SectionHeader title="Study" />
        {studyLinks.map((link) => (
          <LinkItem key={link.path} {...link} />
        ))}

        {/* ADMIN - only for admins */}
        {isAdmin && (
          <>
            <SectionHeader title="Moderation" />
            {adminLinks.map((link) => (
              <LinkItem key={link.path} {...link} />
            ))}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid var(--border)",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}>
        <LinkItem icon={Settings} label="Settings" path="/settings" />
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSignOut}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            width: "100%",
            padding: "10px 14px",
            borderRadius: "10px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#EF4444",
            fontSize: "14px",
            fontWeight: 500,
            fontFamily: "var(--font-display)",
            transition: "background 0.2s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.06)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </motion.button>
      </div>
    </>
  );

  // Desktop: Fixed sidebar
  if (isDesktop) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "280px",
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <div style={{
  flex: 1,
  overflowY: "auto",
  padding: "12px",
}}>
  {/* User Profile Card */}
  {user && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg)",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: profile?.avatar_url
            ? `url(${profile.avatar_url}) center/cover`
            : "linear-gradient(135deg, #0D9488, #14B8A6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 600,
          fontSize: "14px",
          flexShrink: 0,
        }}>
          {!profile?.avatar_url && (profile?.full_name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            margin: "0 0 2px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {profile?.full_name || user.email?.split("@")[0] || "User"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              {profile?.profession || "Medical Student"}
            </p>
            {isSuperAdmin && (
              <span style={{
                padding: "2px 6px",
                borderRadius: "4px",
                background: "#FFF8EC",
                color: "#F5A623",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}>
                <Crown size={10} style={{ display: "inline", marginRight: "2px" }} />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.followers_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Followers</p>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.following_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Following</p>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.upvotes_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Upvotes</p>
        </div>
      </div>
    </motion.div>
  )}

  {/* MAIN - Quick Access */}
  <SectionHeader title="Feeds" />
  {mainLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* COMMUNITIES */}
  <SectionHeader title="Communities" />
  {communityLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* Joined Communities */}
  {joinedCommunities.length > 0 && (
    <>
      <SectionHeader title="My Communities" />
      {joinedCommunities.map((comm) => (
        <CommunityLinkItem
          key={comm.id}
          iconUrl={comm.icon}
          label={comm.name}
          path={`/community/${comm.slug}`}
        />
      ))}
    </>
  )}

  {/* Created Communities */}
  {createdCommunities.length > 0 && (
    <>
      <SectionHeader title="Created by Me" />
      {createdCommunities.map((comm) => (
        <CommunityLinkItem
          key={comm.id}
          iconUrl={comm.icon}
          label={comm.name}
          path={`/community/${comm.slug}`}
        />
      ))}
    </>
  )}

  {/* PERSONAL */}
  <SectionHeader title="Personal" />
  {personalLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* STUDY */}
  <SectionHeader title="Study" />
  {studyLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* ADMIN */}
  {isAdmin && (
    <>
      <SectionHeader title="Moderation" />
      {adminLinks.map((link) => (
        <LinkItem key={link.path} {...link} />
      ))}
    </>
  )}
</div>
        </div>      
      );           
    }              
    
  // Mobile: Slide-out drawer
  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                zIndex: 40,
              }}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                width: "280px",
                maxWidth: "85vw",
                background: "var(--surface)",
                borderRight: "1px solid var(--border)",
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div style={{
  flex: 1,
  overflowY: "auto",
  padding: "12px",
}}>
  {/* User Profile Card */}
  {user && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "var(--bg)",
        borderRadius: "12px",
        padding: "14px",
        marginBottom: "16px",
        border: "1px solid var(--border)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: profile?.avatar_url
            ? `url(${profile.avatar_url}) center/cover`
            : "linear-gradient(135deg, #0D9488, #14B8A6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 600,
          fontSize: "14px",
          flexShrink: 0,
        }}>
          {!profile?.avatar_url && (profile?.full_name?.charAt(0) || user.email?.charAt(0) || "?").toUpperCase()}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontWeight: 600,
            fontSize: "14px",
            color: "var(--text)",
            margin: "0 0 2px 0",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
            {profile?.full_name || user.email?.split("@")[0] || "User"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <p style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              margin: 0,
            }}>
              {profile?.profession || "Medical Student"}
            </p>
            {isSuperAdmin && (
              <span style={{
                padding: "2px 6px",
                borderRadius: "4px",
                background: "#FFF8EC",
                color: "#F5A623",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}>
                <Crown size={10} style={{ display: "inline", marginRight: "2px" }} />
                Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginTop: "12px",
        paddingTop: "12px",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.followers_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Followers</p>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.following_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Following</p>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <p style={{ fontSize: "16px", fontWeight: 700, color: "var(--text)", margin: "0 0 2px 0" }}>
            {profile?.upvotes_count || 0}
          </p>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>Upvotes</p>
        </div>
      </div>
    </motion.div>
  )}

  {/* MAIN - Quick Access */}
  <SectionHeader title="Feeds" />
  {mainLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* COMMUNITIES */}
  <SectionHeader title="Communities" />
  {communityLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* Joined Communities */}
  {joinedCommunities.length > 0 && (
    <>
      <SectionHeader title="My Communities" />
      {joinedCommunities.map((comm) => (
        <CommunityLinkItem
          key={comm.id}
          iconUrl={comm.icon}
          label={comm.name}
          path={`/community/${comm.slug}`}
        />
      ))}
    </>
  )}

  {/* Created Communities */}
  {createdCommunities.length > 0 && (
    <>
      <SectionHeader title="Created by Me" />
      {createdCommunities.map((comm) => (
        <CommunityLinkItem
          key={comm.id}
          iconUrl={comm.icon}
          label={comm.name}
          path={`/community/${comm.slug}`}
        />
      ))}
    </>
  )}

  {/* PERSONAL */}
  <SectionHeader title="Personal" />
  {personalLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* STUDY */}
  <SectionHeader title="Study" />
  {studyLinks.map((link) => (
    <LinkItem key={link.path} {...link} />
  ))}

  {/* ADMIN */}
  {isAdmin && (
    <>
      <SectionHeader title="Moderation" />
      {adminLinks.map((link) => (
        <LinkItem key={link.path} {...link} />
      ))}
    </>
  )}
</div>
                
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "#374151",
              color: "white",
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
