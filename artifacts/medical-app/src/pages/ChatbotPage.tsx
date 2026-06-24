import { useState, useRef, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Send, Sparkles, FileText, HeartPulse, ShieldAlert, 
  HelpCircle, Check, ArrowLeft, Star, Volume2, BookOpen, ChevronRight,
  Bot, Trash2, Copy
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ModelID = "docu" | "pulse" | "scrub";

interface Message {
  id: string;
  sender: "user" | "ai";
  content: string;
  timestamp: string;
  savedToFlashcards?: boolean;
}

export default function ChatbotPage() {
  const supabase = createClient();
  const rawSearch = useSearch();

  // Determine if there is an incoming prompt from the dashboard / other pages
  const parseQuery = () => {
    const params = new URLSearchParams(rawSearch);
    return params.get("prompt") || "";
  };

  const initialPrompt = parseQuery();

  const [activeModel, setActiveModel] = useState<ModelID>("docu");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const renderBotIcon = (type: ModelID, size = 18) => {
    let accent = "#0D9488";
    if (type === "pulse") accent = "#E11D48";
    if (type === "scrub") accent = "#7C3AED";
    return (
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: `${size + 14}px`,
        height: `${size + 14}px`,
        background: `${accent}15`,
        color: accent,
        borderRadius: "50%",
        boxShadow: `0 0 10px ${accent}20`
      }}>
        <Bot size={size} style={{ strokeWidth: 2.2 }} />
      </div>
    );
  };

  // Model details from strategic pillars
  const modelMetadata = {
    docu: {
      name: "Docu-Bot",
      tagline: "Document Analysis & Paper Breakdown",
      description: "Break complex medical publications & policy guidelines down into simple 1st-year or 2nd-year clinical levels.",
      avatar: "🤖📄",
      accent: "#0D9488",
      examplePrompts: [
        "Explain this term: Pharmacokinetics",
        "Summarize the guidelines for managing acute malaria",
        "Break down this mechanism: Renin-Angiotensin-Aldosterone System"
      ]
    },
    pulse: {
      name: "Pulse-Bot",
      tagline: "Quick Clinical Case Breakdown",
      description: "Ask hypothetical clinical symptom questions & learn diagnostic approaches safely on high-priority Nigerian health issues.",
      avatar: "🤖🩺",
      accent: "#E11D48",
      examplePrompts: [
        "Symptom approach: Unexplained pediatric high fever",
        "Explain the key markers for acute myocardial infarction",
        "Case breakdown: 24-year-old presenting with jaundice"
      ]
    },
    scrub: {
      name: "Scrub-Bot",
      tagline: "Flashcard & Quick Quiz Drills",
      description: "Interactive revision prep. Ask for quick quizzes on medical exam topics & generate study flashcards instantly.",
      avatar: "🤖🧠",
      accent: "#7C3AED",
      examplePrompts: [
        "Create a 3-question MCQ quiz on cardiac physiology",
        "Help me review Cranial Nerves and their functions",
        "Generate active recall prompts for pharmacology matching"
      ]
    }
  };

  const [enabledModels, setEnabledModels] = useState<Record<string, boolean>>({ docu: true, pulse: true, scrub: true });

  useEffect(() => {
    setEnabledModels({
      docu: localStorage.getItem("medstudent_ai_docu_active") !== "false",
      pulse: localStorage.getItem("medstudent_ai_pulse_active") !== "false",
      scrub: localStorage.getItem("medstudent_ai_scrub_active") !== "false"
    });
  }, []);

  // Run automatically if search prompt is present
  useEffect(() => {
    if (initialPrompt) {
      setInputVal(initialPrompt);
    }
  }, [initialPrompt]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || inputVal;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: "u-" + Date.now(),
      sender: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputVal("");
    setLoading(true);

    try {
      // Record usage parameter
      try {
        await supabase.from("pulse_usage").insert({
          model_used: activeModel,
          prompt_preview: textToSend.substring(0, 50),
          created_at: new Date().toISOString()
        });
      } catch (e) {}

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        alert("Please log in to use the AI assistant.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          message: textToSend,
          model: activeModel
        })
      });

      if (!response.ok) throw new Error("Failed to fetch response");
      const data = await response.json();

      const aiMsg: Message = {
        id: "ai-" + Date.now(),
        sender: "ai",
        content: data.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);

    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const saveAsFlashcard = async (msgId: string, text: string) => {
    // Insert into mock/real saved_posts or flashcards table
    await supabase.from("saved_posts").insert({
      title: `AI Recall: ${modelMetadata[activeModel].name}`,
      content: text,
      category: "Flashcards",
      created_at: new Date().toISOString()
    }).catch(() => {});

    setMessages((prev) => 
      prev.map(m => m.id === msgId ? { ...m, savedToFlashcards: true } : m)
    );
  };

  const handleExampleClick = (prompt: string) => {
    setInputVal(prompt);
    handleSendMessage(undefined, prompt);
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "var(--bg)", fontFamily: "var(--font-sans, sans-serif)", color: "var(--text)" }}>
      
      {/* SIDEBAR SELECTOR (DESKTOP MODE) */}
      <div style={{
        width: "300px",
        borderRight: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        padding: "20px"
      }} className="hidden md:flex">
        
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", marginBottom: "24px", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Hub
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <Sparkles color="#0D9488" size={20} />
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0 }}>Research Co-pilots</h2>
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px", lineHeight: 1.4 }}>
          Our co-pilots assist with documents, clinical thinking, and revision prep. They do not replace peer studies.
        </p>

        {/* Co-pilot models toggles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
          {(Object.keys(modelMetadata) as ModelID[]).filter(mKey => enabledModels[mKey]).map((mKey) => {
            const meta = modelMetadata[mKey];
            const active = activeModel === mKey;
            return (
              <button
                key={mKey}
                onClick={() => { setActiveModel(mKey); setMessages([]); }}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "14px",
                  borderRadius: "12px",
                  border: "1px solid" + (active ? meta.accent : "var(--border)"),
                  background: active ? `${meta.accent}0a` : "var(--surface)",
                  cursor: "pointer",
                  textAlign: "left"
                }}
              >
                {renderBotIcon(mKey, 20)}
                <div>
                  <strong style={{ display: "block", fontSize: "13.5px", color: active ? meta.accent : "var(--text)" }}>
                    {meta.name}
                  </strong>
                  <span style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {meta.tagline}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ marginTop: "auto", background: "rgba(13,148,136,0.05)", padding: "12px", borderRadius: "10px", fontSize: "11.5px", color: "var(--text-muted)", border: "1px solid rgba(13,148,136,0.1)" }}>
          💡 <strong>Study Tip:</strong> Use <em>Scrub</em> model when revision countdowns are high for diagnostic matching drills.
        </div>
      </div>

      {/* CHAT WINDOW */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        
        {/* MOBILE TOP NAVIGATION BRAND */}
        <div style={{
          padding: "16px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <span style={{ fontSize: "11px", fontWeight: 700, color: modelMetadata[activeModel].accent, textTransform: "uppercase" }}>
              Active Research Co-pilot
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {renderBotIcon(activeModel, 18)}
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>{modelMetadata[activeModel].name}</h3>
            </div>
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
            <div className="hidden md:flex">
              {messages.length > 0 && (
                <button 
                  onClick={() => setMessages([])}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    background: "transparent", border: "1px solid var(--border)", 
                    borderRadius: "8px", padding: "6px 10px", fontSize: "12px", fontWeight: 600,
                    cursor: "pointer", color: "var(--text-muted)"
                  }}
                  className="hover:bg-slate-50"
                >
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>
            
            <div className="flex md:hidden" style={{ display: "flex", gap: "8px" }}>
              {(Object.keys(modelMetadata) as ModelID[]).filter(mKey => enabledModels[mKey]).map((mKey) => (
                <button 
                  key={mKey} 
                  onClick={() => { setActiveModel(mKey); setMessages([]); }}
                  style={{ 
                    background: activeModel === mKey ? "var(--border)" : "transparent", 
                    border: "1px solid var(--border)", 
                    borderRadius: "8px", 
                    padding: "4px 8px", 
                    fontSize: "12px", 
                    fontWeight: 600,
                    cursor: "pointer",
                    color: "var(--text)"
                  }}
                >
                  {modelMetadata[mKey].name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MESSAGES LISTING */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "var(--bg)" }}>
          {messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ maxWidth: "560px", margin: "40px auto", textAlign: "center" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                {renderBotIcon(activeModel, 44)}
              </div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "20px", marginBottom: "8px" }}>
                I am {modelMetadata[activeModel].name}
              </h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: 1.5, marginBottom: "24px" }}>
                {modelMetadata[activeModel].description}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)", letterSpacing: "1px" }}>
                  Try starting with:
                </span>
                {modelMetadata[activeModel].examplePrompts.map((ep, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(ep)}
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text)",
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                    className="hover:bg-slate-50"
                  >
                    <span>{ep}</span>
                    <ChevronRight size={14} color="var(--text-muted)" />
                  </button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              <AnimatePresence>
                {messages.map((m) => {
                  const isUser = m.sender === "user";
                  return (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.2 }}
                      style={{
                        display: "flex",
                        justifyContent: isUser ? "flex-end" : "flex-start",
                        alignItems: "flex-start",
                        gap: "10px"
                      }}
                    >
                      {!isUser && renderBotIcon(activeModel, 16)}

                      <div style={{ maxWidth: "80%" }}>
                        <div style={{
                          background: isUser ? "var(--gradient, #0d9488)" : "var(--surface)",
                          color: isUser ? "white" : "var(--text)",
                          border: isUser ? "none" : "1px solid var(--border)",
                          padding: "14px 16px",
                          borderRadius: "16px",
                          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                          fontSize: "14px",
                          lineHeight: 1.5,
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere"
                        }} className={isUser ? "" : "markdown-body"}>
                          {isUser ? m.content : <Markdown remarkPlugins={[remarkGfm]}>{m.content}</Markdown>}
                        </div>

                        <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "space-between", alignItems: "center", marginTop: "6px", padding: "0 4px" }}>
                          {!isUser && (
                            <div style={{ display: "flex", gap: "14px" }}>
                              <button
                                onClick={() => navigator.clipboard.writeText(m.content).then(() => alert("Copied to clipboard!"))}
                                style={{
                                  background: "none", border: "none", padding: 0, fontSize: "11px",
                                  color: "var(--text-muted)", fontWeight: 600, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: "4px"
                                }}
                              >
                                <Copy size={12} /> Copy
                              </button>
                              <button
                                onClick={() => saveAsFlashcard(m.id, m.content)}
                                disabled={m.savedToFlashcards}
                                style={{
                                  background: "none", border: "none", padding: 0, fontSize: "11px",
                                  color: m.savedToFlashcards ? "#0D9488" : "var(--text-muted)", fontWeight: 600, cursor: "pointer",
                                  display: "flex", alignItems: "center", gap: "4px"
                                }}
                              >
                                <BookOpen size={12} />
                                {m.savedToFlashcards ? "Mastered Chest ✅" : "Add to Flashcard"}
                              </button>
                            </div>
                          )}
                          <span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: isUser ? 0 : "auto" }}>{m.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {loading && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  style={{ display: "flex", gap: "10px" }}
                >
                  {renderBotIcon(activeModel, 16)}
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "14px 16px", borderRadius: "16px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <span className="dot" style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both" }} />
                      <span className="dot" style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.2s" }} />
                      <span className="dot" style={{ width: "6px", height: "6px", background: "var(--text-muted)", borderRadius: "50%", display: "inline-block", animation: "bounce 1.4s infinite ease-in-out both", animationDelay: "0.4s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* INPUT COMPOSER CONTAINER */}
        <div style={{ padding: "20px", borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
          <form onSubmit={handleSendMessage} style={{ maxWidth: "720px", margin: "0 auto", position: "relative" }}>
            <input
              type="text"
              placeholder={`Query ${modelMetadata[activeModel].name} on topics...`}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 50px 14px 16px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                background: "var(--surface-muted)",
                color: "var(--text)",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                outline: "none"
              }}
            />
            <button
              type="submit"
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: modelMetadata[activeModel].accent,
                border: "none",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                cursor: "pointer"
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1.0); }
        }
      `}</style>
    </div>
  );
}
