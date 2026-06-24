import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, X, MessageSquare, Sparkles, BookOpen, Cpu, Activity, GraduationCap } from "lucide-react";
import { createClient } from "@/lib/supabase";

type BotMode = "docu" | "pulse" | "scrub";

export function FloatingChatbot() {
  const supabase = createClient();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<BotMode>("docu");
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Authentication check state
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      setIsAuthenticated(!!user);
    }
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Unified Coordinates with persistence & profile collision prevention
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem("floating_chatbot_position");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.x === "number" && typeof parsed.y === "number") {
          return parsed;
        }
      } catch (e) {}
    }
    // Starts safely high-up (offset y by 280px) to dodge overlapping bottom profiles
    return { x: window.innerWidth - 92, y: window.innerHeight - 280 };
  });

  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => ({
        x: Math.max(16, Math.min(window.innerWidth - 92, prev.x)),
        y: Math.max(16, Math.min(window.innerHeight - 280, prev.y))
      }));
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Save coordinates whenever updated
  useEffect(() => {
    localStorage.setItem("floating_chatbot_position", JSON.stringify(position));
  }, [position]);

  // Don't show on non-authenticated routes or dedicated page
  if (!isAuthenticated || ["/login", "/signup", "/forgot-password", "/chatbot"].includes(location)) {
    return null;
  }

  const botDetails = {
    docu: {
      name: "Docu-Bot AI",
      tagline: "Document Analysis & Simplifier",
      avatar: <Cpu size={22} style={{ color: "white" }} />,
      accent: "#0D9488",
      desc: "Breaks down complex medical articles and papers."
    },
    pulse: {
      name: "Pulse-Bot AI",
      tagline: "Clinical Symptom Assistant",
      avatar: <Activity size={22} style={{ color: "white" }} />,
      accent: "#E11D48",
      desc: "Simulates high-urgency pediatric & adult cases."
    },
    scrub: {
      name: "Scrub-Bot AI",
      tagline: "Fast Quiz & Flashcard Drill",
      avatar: <GraduationCap size={22} style={{ color: "white" }} />,
      accent: "#7C3AED",
      desc: "Drills medical MCQs and high-yield study cards."
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = {
      id: "u-" + Date.now(),
      sender: "user",
      content: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    const textToSend = inputVal;
    setInputVal("");
    setLoading(true);

    // Record usage
    await supabase.from("pulse_usage").insert({
      model_used: activeMode,
      prompt_preview: textToSend.substring(0, 50),
      created_at: new Date().toISOString()
    }).catch(() => {});

    setTimeout(() => {
      let reply = "";
      if (activeMode === "docu") {
        reply = `### 📄 Docu-Bot Breakdown:\n\n1. **Core Concept:** Standard local physiological responses.\n2. **Pathways:** Clear target feedback controls.\n3. **Pearl:** Focus on rate-limiting steps for exams.`;
      } else if (activeMode === "pulse") {
        reply = `### 🩺 Pulse-Bot Case Check:\n\n*Educational Simulation Only.*\n\n- **Triage:** Ensure airway/circulation.\n- **Diagnostics:** Check malaria smears & full blood counts.`;
      } else {
        reply = `### 🧠 Scrub revision drill:\n\nLet's test! What increases Km but leaves Vmax unaffected?\n* **Answer:** Competitive inhibitor.`;
      }

      const aiMsg = {
        id: "ai-" + Date.now(),
        sender: "ai",
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div style={{ position: "fixed", zIndex: 9999 }}>
      
      {/* Draggable Trigger Button */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0}
        onDragEnd={(event, info) => {
          const newX = Math.max(16, Math.min(window.innerWidth - 92, position.x + info.offset.x));
          const newY = Math.max(16, Math.min(window.innerHeight - 92, position.y + info.offset.y));
          setPosition({ x: newX, y: newY });
          localStorage.setItem("floating_chatbot_position", JSON.stringify({ x: newX, y: newY }));
        }}
        key={`chatbot-${position.x}-${position.y}`}
        style={{
          position: "fixed",
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: "grab",
          touchAction: "none"
        }}
        whileTap={{ cursor: "grabbing", scale: 0.95 }}
      >
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "var(--gradient, linear-gradient(135deg, #0d9488, #115e59))",
            color: "white",
            border: "none",
            boxShadow: "0 10px 25px -5px rgba(13, 148, 136, 0.4), 0 8px 10px -6px rgba(13, 148, 136, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}
          title="Drag me! Click to Chat with Co-pilot"
        >
          <Bot size={28} className="animate-pulse" />
          <span style={{ position: "absolute", top: "-2px", right: "-2px", background: "#E11D48", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: 800 }}>AI</span>
        </button>
      </motion.div>

      {/* Mini Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            style={{
              position: "fixed",
              left: `${Math.max(16, Math.min(window.innerWidth - 376, position.x - 300))}px`,
              top: `${Math.max(16, Math.min(window.innerHeight - 512, position.y - 490))}px`,
              width: "360px",
              height: "480px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* Header */}
            <div style={{ background: botDetails[activeMode].accent, padding: "14px 16px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "20px" }}>{botDetails[activeMode].avatar}</span>
                <div>
                  <h4 style={{ margin: 0, fontSize: "13.5px", fontWeight: 700 }}>{botDetails[activeMode].name}</h4>
                  <span style={{ fontSize: "10px", opacity: 0.9 }}>{botDetails[activeMode].tagline}</span>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ background: "rgba(0,0,0,0.15)", border: "none", color: "white", borderRadius: "50%", padding: "4px", cursor: "pointer" }}>
                <X size={14} />
              </button>
            </div>

            {/* Persona Switcher Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)", background: "var(--surface-muted)" }}>
              {(Object.keys(botDetails) as BotMode[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveMode(tab); setMessages([]); }}
                  style={{
                    flex: 1,
                    background: activeMode === tab ? "var(--surface)" : "transparent",
                    border: "none",
                    borderBottom: activeMode === tab ? `2px solid ${botDetails[tab].accent}` : "none",
                    padding: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: activeMode === tab ? botDetails[tab].accent : "var(--text-muted)",
                    cursor: "pointer"
                  }}
                >
                  {botDetails[tab].name.split("-")[0]}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div style={{ flex: 1, padding: "12px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", background: "var(--bg)" }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: "center", margin: "auto", maxWidth: "240px", padding: "16px" }}>
                  <span style={{ fontSize: "32px" }}>🤖</span>
                  <h5 style={{ margin: "8px 0 4px", fontSize: "13px", fontWeight: 700 }}>Ask {botDetails[activeMode].name}</h5>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {botDetails[activeMode].desc}
                  </p>
                  <Link href="/chatbot" onClick={() => setIsOpen(false)} style={{ display: "inline-block", marginTop: "12px", background: "rgba(13,148,136,0.1)", color: "#0D9488", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: 700, textDecoration: "none" }}>
                    Full Page Simulator →
                  </Link>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <div key={m.id} style={{ alignSelf: isUser ? "flex-end" : "flex-start", maxWidth: "85%" }}>
                      <div style={{
                        background: isUser ? botDetails[activeMode].accent : "var(--surface)",
                        color: isUser ? "white" : "var(--text)",
                        border: isUser ? "none" : "1px solid var(--border)",
                        padding: "8px 12px",
                        borderRadius: "12px",
                        fontSize: "12.5px",
                        lineHeight: 1.4,
                        whiteSpace: "pre-wrap"
                      }}>
                        {m.content}
                      </div>
                      <span style={{ fontSize: "9px", color: "var(--text-muted)", margin: "2px 4px 0", display: "block", textAlign: isUser ? "right" : "left" }}>
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })
              )}
              {loading && (
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "8px 12px", borderRadius: "12px", width: "50px" }}>
                  <span className="dot" style={{ width: "4px", height: "4px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", marginRight: "3px" }} />
                  <span className="dot" style={{ width: "4px", height: "4px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", marginRight: "3px" }} />
                  <span className="dot" style={{ width: "4px", height: "4px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block" }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} style={{ padding: "10px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", background: "var(--surface)" }}>
              <input
                type="text"
                placeholder={`Ask ${botDetails[activeMode].name}...`}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--surface-muted)",
                  color: "var(--text)",
                  outline: "none",
                  fontSize: "12.5px"
                }}
              />
              <button
                type="submit"
                style={{
                  background: botDetails[activeMode].accent,
                  color: "white",
                  border: "none",
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer"
                }}
              >
                <Send size={14} />
              </button>
            </form>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
