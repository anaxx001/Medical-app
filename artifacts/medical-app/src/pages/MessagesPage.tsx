import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { 
  MessageSquare, UserPlus, Sparkles, Pin, Search, HeartPulse, 
  HelpCircle, ArrowRight, Star, GraduationCap, Clock, Check, X 
} from "lucide-react";

type TabID = "messages" | "requests" | "threads" | "groups";

export default function MessagesPage() {
  const supabase = createClient();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<TabID>("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<any>(null);

  // Real inbound chat requests and active 1:1 chats, loaded from Supabase.
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [inboundRequests, setInboundRequests] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dynamic Study Circles State
  const [studyCircles, setStudyCircles] = useState<any[]>(() => {
    const saved = localStorage.getItem("med_study_circles");
    return saved ? JSON.parse(saved) : [];
  });

  // Create Study Circle States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState("");
  const [newCircleDesc, setNewCircleDesc] = useState("");
  const [newCircleTopic, setNewCircleTopic] = useState("");
  const [newCircleMax, setNewCircleMax] = useState(8);

  // Manage Circle States
  const [showManageModal, setShowManageModal] = useState<any>(null); // Circle object or null
  const [addMemberName, setAddMemberName] = useState("");

  // Real Peer Student Searching States
  const [peerQuery, setPeerQuery] = useState("");
  const [peerResults, setPeerResults] = useState<any[]>([]);
  const [searchingPeers, setSearchingPeers] = useState(false);

  // Load Profile
  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (userProfile) setProfile(userProfile);
      }
    }
    loadProfile();
  }, []);

  // Real Peer Student Searching Loop
  useEffect(() => {
    if (!peerQuery.trim()) {
      setPeerResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      setSearchingPeers(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, role, avatar_url, institution")
        .or(`username.ilike.%${peerQuery}%,full_name.ilike.%${peerQuery}%,institution.ilike.%${peerQuery}%`)
        .limit(6);
      
      // Filter out self if logged in
      const filtered = (data || []).filter((p: any) => p.id !== profile?.id);
      setPeerResults(filtered);
      setSearchingPeers(false);
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [peerQuery, profile]);

  const handleCreatePeerChat = async (peer: any) => {
    if (!currentUserId) return;

    // Only navigate straight to the chat if there's already an accepted pair.
    // Sending a new chat request isn't built yet, so be honest about that
    // instead of faking an instant chat the way this used to.
    const { data: pair } = await supabase
      .from("accepted_chat_pairs")
      .select("id")
      .or(
        `and(user_a.eq.${currentUserId},user_b.eq.${peer.id}),and(user_a.eq.${peer.id},user_b.eq.${currentUserId})`
      )
      .maybeSingle();

    if (pair) {
      setLocation(`/messages/${peer.id}`);
    } else {
      alert(
        `You don't have an active chat with ${peer.full_name || peer.username} yet. Sending new chat requests isn't available yet — once they request to chat with you (or vice versa) and it's accepted, you'll see it here.`
      );
    }
  };

  // Load real inbound requests and real active chats from Supabase.
  async function loadInboxData() {
    setInboxLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setInboxLoading(false);
        return;
      }
      setCurrentUserId(user.id);

      // Pending requests sent TO me.
      const { data: requests, error: reqError } = await supabase
        .from("chat_requests")
        .select("id, message, created_at, sender:profiles!sender_id(id, username, full_name, avatar_url)")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (reqError) {
        console.error("Could not load chat requests:", reqError);
      } else {
        const mappedRequests = (requests || []).map((r: any) => ({
          id: r.id,
          senderId: r.sender?.id,
          description: `${r.sender?.full_name || r.sender?.username || "A peer"} wants to start a chat`,
          title: r.message || "Wants to connect with you",
          subtitle: new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric" }),
          avatar: "👥",
        }));
        setInboundRequests(mappedRequests);
      }

      // Pairs I'm already allowed to message.
      const { data: pairs, error: pairError } = await supabase
        .from("accepted_chat_pairs")
        .select("id, user_a, user_b, accepted_at")
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`);

      if (pairError) {
        console.error("Could not load accepted chat pairs:", pairError);
        setInboxLoading(false);
        return;
      }

      const otherIds = (pairs || []).map((p: any) => (p.user_a === user.id ? p.user_b : p.user_a));
      if (otherIds.length === 0) {
        setActiveChats([]);
        setInboxLoading(false);
        return;
      }

      const { data: peerProfiles } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, profession")
        .in("id", otherIds);

      const profileById = new Map((peerProfiles || []).map((p: any) => [p.id, p]));

      // One query per pair for its latest message — fine at the scale a chat
      // inbox like this typically has; worth batching differently if this list
      // grows into the hundreds.
      const chats = await Promise.all(
        (pairs || []).map(async (pair: any) => {
          const otherId = pair.user_a === user.id ? pair.user_b : pair.user_a;
          const peer = profileById.get(otherId);

          const { data: lastMsgRows } = await supabase
            .from("direct_messages")
            .select("content, created_at, sender_id, is_read")
            .or(
              `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
            )
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsg = lastMsgRows?.[0];

          return {
            id: otherId,
            name: peer?.full_name || peer?.username || "Medical Student",
            role: peer?.profession || "Peer Student",
            avatarUrl: peer?.avatar_url || null,
            lastMessage: lastMsg
              ? lastMsg.content
              : "No messages yet. Say hi and start revising!",
            time: lastMsg
              ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "",
            unread: !!lastMsg && !lastMsg.is_read && lastMsg.sender_id === otherId,
            isPinned: false,
            sortKey: lastMsg ? new Date(lastMsg.created_at).getTime() : new Date(pair.accepted_at).getTime(),
          };
        })
      );

      chats.sort((a, b) => b.sortKey - a.sortKey);
      setActiveChats(chats);
    } catch (e) {
      console.error("Failed to load inbox:", e);
    }
    setInboxLoading(false);
  }

  useEffect(() => {
    loadInboxData();
  }, []);

  // Accept a request: the accept_chat_request() RPC atomically creates the
  // accepted_chat_pairs row and deletes the request, so we just refresh after.
  const handleAcceptRequest = async (reqId: string) => {
    const { error } = await supabase.rpc("accept_chat_request", { p_request_id: reqId });
    if (error) {
      console.error("Failed to accept chat request:", error);
      alert("Couldn't accept this request. Please try again.");
      return;
    }
    await loadInboxData();
  };

  const handleDeclineRequest = async (reqId: string) => {
    const { error } = await supabase.from("chat_requests").delete().eq("id", reqId);
    if (error) {
      console.error("Failed to decline chat request:", error);
      return;
    }
    setInboundRequests((prev) => prev.filter((r) => r.id !== reqId));
  };

  // Study circle actions
  const handleCreateCircle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCircleName.trim()) return;

    const newCircle = {
      id: `circle-${Date.now()}`,
      name: newCircleName.trim(),
      description: newCircleDesc.trim() || "Collaborative study session.",
      members: [profile?.username || "Me"],
      maxMembers: Number(newCircleMax) || 8,
      createdBy: profile?.username || "Me",
      topic: newCircleTopic.trim() || "General Medicine"
    };

    const updated = [newCircle, ...studyCircles];
    setStudyCircles(updated);
    localStorage.setItem("med_study_circles", JSON.stringify(updated));

    setNewCircleName("");
    setNewCircleDesc("");
    setNewCircleTopic("");
    setNewCircleMax(8);
    setShowCreateModal(false);
  };

  const handleDeleteCircle = (circleId: string) => {
    const updated = studyCircles.filter(c => c.id !== circleId);
    setStudyCircles(updated);
    localStorage.setItem("med_study_circles", JSON.stringify(updated));
    setShowManageModal(null);
  };

  const handleEditCircleDetails = (circleId: string, updatedName: string, updatedDesc: string) => {
    const updated = studyCircles.map(c => {
      if (c.id === circleId) {
        return { ...c, name: updatedName, description: updatedDesc };
      }
      return c;
    });
    setStudyCircles(updated);
    localStorage.setItem("med_study_circles", JSON.stringify(updated));
    const found = updated.find(c => c.id === circleId);
    if (found) setShowManageModal(found);
  };

  const handleAddMember = (circleId: string) => {
    if (!addMemberName.trim()) return;
    const updated = studyCircles.map(c => {
      if (c.id === circleId) {
        if (c.members.length >= c.maxMembers) {
          alert("This circle is full!");
          return c;
        }
        if (c.members.includes(addMemberName.trim())) {
          alert("This user is already a member!");
          return c;
        }
        return { ...c, members: [...c.members, addMemberName.trim()] };
      }
      return c;
    });

    setStudyCircles(updated);
    localStorage.setItem("med_study_circles", JSON.stringify(updated));

    const found = updated.find(c => c.id === circleId);
    if (found) setShowManageModal(found);
    setAddMemberName("");
  };

  const handleKickMember = (circleId: string, memberName: string) => {
    const updated = studyCircles.map(c => {
      if (c.id === circleId) {
        return { ...c, members: c.members.filter(m => m !== memberName) };
      }
      return c;
    });

    setStudyCircles(updated);
    localStorage.setItem("med_study_circles", JSON.stringify(updated));

    const found = updated.find(c => c.id === circleId);
    if (found) setShowManageModal(found);
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      {/* HEADER BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>P2P PEER CHANNELS</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "32px", fontWeight: 800, margin: "4px 0 0", letterSpacing: "-1px" }}>
            Messages & Study Circles
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "4px 0 0" }}>
            Connect with senior mentors, start 8-person study circles, or review topic threads.
          </p>
        </div>

        {/* Global create trigger */}
        <Link href="/chatbot" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--gradient)", color: "white", padding: "10px 18px", borderRadius: "12px", fontWeight: 700, fontSize: "14px", textDecoration: "none", boxShadow: "0 4px 14px rgba(13,148,136,0.2)" }}>
          <Sparkles size={16} /> Summon AI Co-pilot
        </Link>
      </div>

      {/* CORE FOUR-TABS NAVIGATION (Section 10 of Brief) */}
      <div style={{ 
        display: "flex", 
        borderBottom: "1px solid var(--border)", 
        marginBottom: "24px", 
        paddingBottom: "2px", 
        gap: "24px", 
        overflowX: "auto" 
      }} className="scrollbar-none">
        
        <button 
          onClick={() => setActiveTab("messages")}
          style={{
            background: "none", border: "none", padding: "10px 4px", fontSize: "14px", 
            fontWeight: 700, cursor: "pointer", position: "relative",
            color: activeTab === "messages" ? "#0D9488" : "var(--text-muted)",
            transition: "color 0.2s"
          }}
        >
          Messages ({activeChats.length})
          {activeTab === "messages" && (
            <motion.div layoutId="activeTabIndicator" style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: "2px", background: "#0D9488" }} />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("requests")}
          style={{
            background: "none", border: "none", padding: "10px 4px", fontSize: "14px", 
            fontWeight: 700, cursor: "pointer", position: "relative",
            color: activeTab === "requests" ? "#0D9488" : "var(--text-muted)",
            transition: "color 0.2s"
          }}
        >
          Inbound Requests ({inboundRequests.length})
          {activeTab === "requests" && (
            <motion.div layoutId="activeTabIndicator" style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: "2px", background: "#0D9488" }} />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("threads")}
          style={{
            background: "none", border: "none", padding: "10px 4px", fontSize: "14px", 
            fontWeight: 700, cursor: "pointer", position: "relative",
            color: activeTab === "threads" ? "#0D9488" : "var(--text-muted)",
            transition: "color 0.2s"
          }}
        >
          Topic Threads
          {activeTab === "threads" && (
            <motion.div layoutId="activeTabIndicator" style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: "2px", background: "#0D9488" }} />
          )}
        </button>

        <button 
          onClick={() => setActiveTab("groups")}
          style={{
            background: "none", border: "none", padding: "10px 4px", fontSize: "14px", 
            fontWeight: 700, cursor: "pointer", position: "relative",
            color: activeTab === "groups" ? "#0D9488" : "var(--text-muted)",
            transition: "color 0.2s"
          }}
        >
          Study Circles ({studyCircles.length})
          {activeTab === "groups" && (
            <motion.div layoutId="activeTabIndicator" style={{ position: "absolute", bottom: -2, left: 0, right: 0, height: "2px", background: "#0D9488" }} />
          )}
        </button>
      </div>

      {/* SEARCH BOX FOR CHANNELS */}
      <div style={{ position: "relative", marginBottom: "20px", maxWidth: "440px" }}>
        <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="Filter channels, active circles, or topic names..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: "100%", padding: "10px 12px 10px 36px", borderRadius: "10px", 
            border: "1px solid var(--border)", background: "var(--surface)", 
            color: "var(--text)", fontFamily: "var(--font-body)", fontSize: "13.5px", outline: "none"
          }}
        />
      </div>

      {/* CORE VIEWS BASED ON SELECTED TAB */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", overflow: "hidden" }}>
        
        {/* MESSAGES TAB LISTING */}
        {activeTab === "messages" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            
            {/* Real Search for Registered Peer Students */}
            <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#0D9488", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
                🔍 Registered Peer Registry Query
              </span>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="text"
                  placeholder="Type student name, username or university to search..."
                  value={peerQuery}
                  onChange={(e) => setPeerQuery(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px 8px 34px", borderRadius: "8px",
                    border: "1px solid var(--border)", background: "var(--surface)",
                    color: "var(--text)", fontSize: "13px", outline: "none"
                  }}
                />
              </div>

              {searchingPeers && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>Searching medical student registry...</div>
              )}

              {peerResults.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "10px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" }}>
                  {peerResults.map((peer: any) => (
                    <div 
                      key={peer.id} 
                      onClick={() => handleCreatePeerChat(peer)}
                      style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", borderBottom: "1px solid var(--border)" }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <strong style={{ fontSize: "13px", display: "block" }}>{peer.full_name || peer.username}</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{peer.role || "Peer Student"} • {peer.institution || "Unspecified University"}</span>
                      </div>
                      <span style={{ fontSize: "11px", color: "#0D9488", fontWeight: 700 }}>Start Chat →</span>
                    </div>
                  ))}
                </div>
              )}

              {peerQuery && !searchingPeers && peerResults.length === 0 && (
                <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
                  No registered peer students found matching "{peerQuery}".
                </div>
              )}
            </div>

            {inboxLoading && (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                Loading your chats...
              </div>
            )}
            {!inboxLoading && activeChats
              .filter(chat => 
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map(chat => (
                <Link key={chat.id} href={`/messages/${chat.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center", cursor: "pointer" }} className="hover:bg-slate-50">
                    <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#E0F2FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", overflow: "hidden" }}>
                      {chat.avatarUrl ? (
                        <img src={chat.avatarUrl} alt={chat.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        "👤"
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ fontSize: "14.5px" }}>{chat.name} ({chat.role})</strong>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{chat.time}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {chat.lastMessage}
                      </p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                      {chat.isPinned && <Pin size={12} color="#0D9488" />}
                      {chat.unread && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }} />}
                    </div>
                  </div>
                </Link>
              ))}
            {!inboxLoading && activeChats.filter(chat => 
                chat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
              ).length === 0 && (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                  No active chats. Complete an inbound request or search for peers to start!
                </div>
              )}
          </div>
        )}

        {/* REQUESTS TAB LISTING */}
        {activeTab === "requests" && (
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {inboundRequests.map(req => (
              <div key={req.id} style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", borderRadius: "14px", padding: "18px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                  <span style={{ fontSize: "24px" }}>{req.avatar || "👥"}</span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700 }}>{req.description}</h4>
                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                      "{req.title}" • {req.subtitle}
                    </p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => handleDeclineRequest(req.id)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "6px 12px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 600, color: "var(--text)", cursor: "pointer" }}>
                    Decline
                  </button>
                  <button onClick={() => handleAcceptRequest(req.id)} style={{ background: "#0D9488", border: "none", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}>
                    Accept
                  </button>
                </div>
              </div>
            ))}
            {inboundRequests.length === 0 && (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                No active inbound requests. All caught up!
              </div>
            )}
          </div>
        )}

        {/* THREADS TAB LISTING */}
        {activeTab === "threads" && (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
            No active topic threads found.
          </div>
        )}

        {/* GROUPS (STUDY CIRCLES) TAB LISTING */}
        {activeTab === "groups" && (
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>Active Study Circles (Max {newCircleMax} Members)</span>
                <button
                  onClick={() => setShowCreateModal(true)}
                  style={{ background: "rgba(13,148,136,0.1)", border: "none", color: "#0D9488", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  + Start new circle
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr md:1fr", gap: "16px" }} className="grid-cols-1 md:grid-cols-2">
                {studyCircles
                  .filter(circle => 
                    circle.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    circle.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    circle.topic.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(circle => (
                    <div key={circle.id} style={{ border: "1px solid var(--border)", borderRadius: "14px", padding: "16px", background: "var(--surface-muted)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                          <strong style={{ fontSize: "14px", color: "var(--text)" }}>{circle.name}</strong>
                          <span style={{ fontSize: "10px", background: "rgba(13,148,136,0.1)", color: "#0D9488", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>{circle.topic}</span>
                        </div>
                        <p style={{ margin: "0 0 12px", fontSize: "12px", color: "var(--text-muted)", minHeight: "36px" }}>
                          {circle.description}
                        </p>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", borderTop: "1px dashed var(--border)", paddingTop: "10px" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                          👥 {circle.members.length}/{circle.maxMembers} Joined
                        </span>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => setShowManageModal(circle)}
                            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                          >
                            Manage
                          </button>
                          <button onClick={() => setLocation("/messages/anatomy-sprint")} style={{ background: "#0D9488", color: "white", padding: "5px 10px", borderRadius: "6px", border: "none", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                            Enter Room
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                {studyCircles.filter(circle => 
                    circle.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    circle.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    circle.topic.toLowerCase().includes(searchQuery.toLowerCase())
                  ).length === 0 && (
                    <div style={{ gridColumn: "1 / -1", padding: "40px", textAlign: "center", color: "var(--text-muted)", fontSize: "14px" }}>
                      No study circles found matches search parameters. Create one to get started!
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* CREATE STUDY CIRCLE MODAL */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }} onClick={() => setShowCreateModal(false)}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "450px", width: "100%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: "0 0 16px", fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px" }}>Start New Study Circle</h3>
            <form onSubmit={handleCreateCircle} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Circle Name</label>
                <input
                  type="text"
                  placeholder="e.g. Pathology Prep Team"
                  required
                  value={newCircleName}
                  onChange={e => setNewCircleName(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Description</label>
                <textarea
                  placeholder="e.g. Reviewing cardiac lesions prior to next week's test."
                  value={newCircleDesc}
                  onChange={e => setNewCircleDesc(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", minHeight: "80px", resize: "none", outline: "none" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Topic / Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Pathology"
                    value={newCircleTopic}
                    onChange={e => setNewCircleTopic(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Max Students (Max 8)</label>
                  <input
                    type="number"
                    min="2"
                    max="8"
                    value={newCircleMax}
                    onChange={e => setNewCircleMax(Number(e.target.value))}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", outline: "none" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 16px", borderRadius: "8px", fontWeight: 600, cursor: "pointer", color: "var(--text)" }}>Cancel</button>
                <button type="submit" style={{ background: "#0D9488", border: "none", color: "white", padding: "8px 16px", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}>Create Circle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE STUDY CIRCLE MODAL */}
      {showManageModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }} onClick={() => setShowManageModal(null)}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "16px", maxWidth: "480px", width: "100%", padding: "24px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px" }}>Manage Study Circle</h3>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Created by {showManageModal.createdBy}</span>
              </div>
              <button onClick={() => setShowManageModal(null)} style={{ background: "rgba(0,0,0,0.03)", border: "none", borderRadius: "50%", padding: "6px", cursor: "pointer" }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "6px" }}>Circle Details (Editable)</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Circle Name</label>
                  <input 
                    type="text" 
                    value={showManageModal.name}
                    onChange={e => handleEditCircleDetails(showManageModal.id, e.target.value, showManageModal.description)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Description</label>
                  <textarea 
                    value={showManageModal.description}
                    onChange={e => handleEditCircleDetails(showManageModal.id, showManageModal.name, e.target.value)}
                    style={{ width: "100%", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: "12.5px", minHeight: "60px", resize: "none" }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <strong style={{ fontSize: "14px", display: "block", marginBottom: "8px" }}>Members ({showManageModal.members.length}/{showManageModal.maxMembers})</strong>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "150px", overflowY: "auto", padding: "2px" }}>
                {showManageModal.members?.map((m: string) => (
                  <div key={m} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--surface-muted)", padding: "6px 12px", borderRadius: "6px", fontSize: "12.5px" }}>
                    <span>{m} {m === showManageModal.createdBy && <span style={{ fontSize: "10px", color: "#0D9488", fontWeight: 700 }}>(Host)</span>}</span>
                    {m !== showManageModal.createdBy && (
                      <button
                        onClick={() => handleKickMember(showManageModal.id, m)}
                        style={{ background: "transparent", border: "none", color: "#EF4444", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                      >
                        Kick
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 600, marginBottom: "4px" }}>Add Member</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="text"
                  placeholder="Enter peer username..."
                  value={addMemberName}
                  onChange={e => setAddMemberName(e.target.value)}
                  style={{ flex: 1, padding: "6px 12px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface-2)", color: "var(--text)", fontSize: "13px", outline: "none" }}
                />
                <button
                  onClick={() => handleAddMember(showManageModal.id)}
                  style={{ background: "#0D9488", border: "none", color: "white", padding: "6px 14px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700, cursor: "pointer" }}
                >
                  Add
                </button>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid var(--border)", paddingTop: "14px", marginTop: "14px" }}>
              <button
                onClick={() => handleDeleteCircle(showManageModal.id)}
                style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#EF4444", padding: "8px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
                Disband Circle
              </button>
              <button
                onClick={() => setShowManageModal(null)}
                style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--text)", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
