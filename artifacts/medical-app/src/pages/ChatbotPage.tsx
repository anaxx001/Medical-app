import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase";
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  Loader2,
  ChevronLeft,
  RotateCcw,
  FlaskConical,
  HeartPulse,
  Brain,
  BookOpen,
  Lightbulb,
  ShieldAlert,
  Info,
  X,
} from "lucide-react";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are a research co-pilot for Nigerian medical and health sciences students. You help with:
- Understanding medical concepts and research papers
- Explaining study material in simple terms
- Suggesting study strategies and resources
- Providing mental health encouragement when students seem stressed

IMPORTANT: Always remind students to verify critical information with their lecturers or clinical supervisors. You are a study aid, not a medical authority. Be warm, supportive, and culturally aware of Nigerian medical education context.`;

const SUGGESTED_PROMPTS = [
  { icon: FlaskConical, text: "Help me structure a literature review on malaria in pregnancy", category: "Research" },
  { icon: HeartPulse, text: "Explain the pathophysiology of heart failure in simple terms", category: "Study" },
  { icon: Brain, text: "I'm feeling overwhelmed with exams. Any coping strategies?", category: "Wellness" },
  { icon: BookOpen, text: "What are the best free research databases for Nigerian medical students?", category: "Resources" },
  { icon: Lightbulb, text: "How do I choose a research topic for my final year project?", category: "Research" },
  { icon: AlertCircle, text: "Walk me through writing a case report step by step", category: "Research" },
];

const DAILY_MESSAGE_LIMIT = 50;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
}

const models = [
  { value: "docu", label: "Docu", icon: BookOpen, desc: "Research & Study" },
  { value: "pulse", label: "Pulse", icon: HeartPulse, desc: "Clinical Cases" },
  { value: "scrub", label: "Scrub", icon: FlaskConical, desc: "Procedural Skills" },
];

export default function ChatbotPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState("docu");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [dailyCount, setDailyCount] = useState(0);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const [modelStatus, setModelStatus] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMessages();
    checkDailyCount();
    checkModelStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (data) {
      setMessages(
        data.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
          model: msg.model,
        }))
      );
    }
  };

  const checkDailyCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`);

    setDailyCount(count || 0);
    if ((count || 0) >= DAILY_MESSAGE_LIMIT * 0.8) {
      setShowLimitWarning(true);
    }
  };

  const checkModelStatus = async () => {
    const { data } = await supabase
      .from("ai_model_settings")
      .select("model_name, enabled");

    if (data) {
      const status: Record<string, boolean> = {};
      data.forEach((s: any) => {
        status[s.model_name] = s.enabled;
      });
      setModelStatus(status);
    }
  };

  const saveMessage = async (role: "user" | "assistant", content: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role,
      content,
      model: selectedModel,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/login");
      return;
    }

    if (dailyCount >= DAILY_MESSAGE_LIMIT) {
      setToastMessage(`You've reached your daily limit of ${DAILY_MESSAGE_LIMIT} messages. Try again tomorrow!`);
      setShowToast(true);
      return;
    }

    if (modelStatus[selectedModel] === false) {
      setToastMessage(`${selectedModel.charAt(0).toUpperCase() + selectedModel.slice(1)} is temporarily unavailable. Try another model or check back later.`);
      setShowToast(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    await saveMessage("user", userMessage.content);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-exp",
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
        ],
      });

      const chat = model.startChat({
        history: messages.map((m) => ({
          role: m.role,
          parts: [{ text: m.content }],
        })),
        systemInstruction: SYSTEM_PROMPT,
      });

      const result = await chat.sendMessage(input.trim());
      const response = await result.response;
      const responseText = response.text();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseText,
        timestamp: new Date(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      await saveMessage("assistant", assistantMessage.content);
      setDailyCount((prev) => prev + 1);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `⚠️ ${error.message || "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setToastMessage("Chat history cleared");
    setShowToast(true);
  };

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "100dvh",
      background: "var(--bg)",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0D9488, #14B8A6)",
        color: "white",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "8px",
              color: "white",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <ChevronLeft size={22} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={18} color="#FBBF24" />
            <span style={{ fontWeight: 600, fontSize: "16px" }}>Research Co-Pilot</span>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            borderRadius: "8px",
            color: "white",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Model Selector */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "8px 16px",
        flexShrink: 0,
      }}>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 14px",
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            color: "var(--text)",
            fontSize: "13px",
            fontWeight: 500,
            fontFamily: "var(--font-display)",
            outline: "none",
            cursor: "pointer",
          }}
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} — {m.desc} {modelStatus[m.value] === false ? "(Offline)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Daily Limit Bar */}
      <div style={{
        background: "var(--bg)",
        padding: "8px 16px",
        borderBottom: "1px solid var(--border)",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          color: "var(--text-muted)",
          marginBottom: "4px",
        }}>
          <span>Daily usage: {dailyCount}/{DAILY_MESSAGE_LIMIT}</span>
          <span>{Math.round((dailyCount / DAILY_MESSAGE_LIMIT) * 100)}%</span>
        </div>
        <div style={{
          width: "100%",
          background: "var(--border)",
          borderRadius: "999px",
          height: "6px",
          overflow: "hidden",
        }}>
          <motion.div
            style={{
              height: "100%",
              borderRadius: "999px",
              background: dailyCount >= DAILY_MESSAGE_LIMIT
                ? "#EF4444"
                : dailyCount >= DAILY_MESSAGE_LIMIT * 0.8
                ? "#F59E0B"
                : "#10B981",
            }}
            initial={{ width: 0 }}
            animate={{ width: `${(dailyCount / DAILY_MESSAGE_LIMIT) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        background: "var(--bg)",
        padding: "0 16px",
      }}>
        <AnimatePresence>
          {showLimitWarning && dailyCount < DAILY_MESSAGE_LIMIT && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ margin: "8px 0" }}
            >
              <div style={{
                background: "rgba(245, 158, 11, 0.08)",
                border: "1px solid rgba(245, 158, 11, 0.2)",
                borderRadius: "12px",
                padding: "12px",
                display: "flex",
                alignItems: "flex-start",
                gap: "8px",
              }}>
                <AlertCircle size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)", margin: "0 0 2px 0" }}>
                    Approaching daily limit
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
                    You've used {dailyCount} of {DAILY_MESSAGE_LIMIT} messages today.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: "32px 0", textAlign: "center" }}
          >
            <div style={{
              width: "80px",
              height: "80px",
              background: "linear-gradient(135deg, #0D9488, #14B8A6)",
              borderRadius: "20px",
              margin: "0 auto 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(13,148,136,0.25)",
            }}>
              <Sparkles size={32} color="white" />
            </div>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
              margin: "0 0 8px 0",
            }}>
              Your Research Co-Pilot
            </h2>
            <p style={{
              fontSize: "14px",
              color: "var(--text-muted)",
              margin: "0 auto 24px auto",
              maxWidth: "320px",
              lineHeight: 1.5,
            }}>
              Ask me anything about research, studies, or wellness. I'm here to help you learn, not replace your judgment.
            </p>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              maxWidth: "380px",
              margin: "0 auto",
            }}>
              {SUGGESTED_PROMPTS.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePromptClick(prompt.text)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px",
                      background: "var(--surface)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#0D9488";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(13,148,136,0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{
                      width: "32px",
                      height: "32px",
                      background: "rgba(13, 148, 136, 0.08)",
                      borderRadius: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon size={16} color="#0D9488" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: "13px",
                        color: "var(--text)",
                        margin: "0 0 2px 0",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {prompt.text}
                      </p>
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", margin: 0 }}>
                        {prompt.category}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div style={{
              marginTop: "24px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              fontSize: "12px",
              color: "var(--text-muted)",
              maxWidth: "320px",
              marginLeft: "auto",
              marginRight: "auto",
            }}>
              <Info size={14} style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                This AI provides educational support only. Always verify critical information and consult supervisors for clinical decisions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: "flex",
                  gap: "12px",
                  flexDirection: message.role === "user" ? "row-reverse" : "row",
                }}
              >
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background: message.role === "user" ? "var(--border)" : "linear-gradient(135deg, #0D9488, #14B8A6)",
                }}>
                  {message.role === "user" ? (
                    <User size={14} color="var(--text-muted)" />
                  ) : (
                    <Sparkles size={14} color="white" />
                  )}
                </div>

                <div style={{
                  maxWidth: "75%",
                  padding: "12px 16px",
                  borderRadius: "16px",
                  fontSize: "14px",
                  lineHeight: 1.6,
                  background: message.role === "user" ? "#0D9488" : "var(--surface)",
                  color: message.role === "user" ? "white" : "var(--text)",
                  border: message.role === "user" ? "none" : "1px solid var(--border)",
                  borderBottomRightRadius: message.role === "user" ? "4px" : "16px",
                  borderBottomLeftRadius: message.role === "user" ? "16px" : "4px",
                  whiteSpace: "pre-wrap",
                }}>
                  <div>{message.content}</div>
                  {message.model && message.role === "assistant" && (
                    <div style={{
                      marginTop: "6px",
                      fontSize: "11px",
                      opacity: 0.5,
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}>
                      <FlaskConical size={12} />
                      {message.model}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: "flex", gap: "12px" }}
            >
              <div style={{
                width: "32px",
                height: "32px",
                background: "linear-gradient(135deg, #0D9488, #14B8A6)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <div style={{
                background: "var(--surface)",
                padding: "12px 16px",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                borderBottomLeftRadius: "4px",
              }}>
                <Loader2 size={16} color="var(--text-muted)" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
        padding: "12px 16px",
        flexShrink: 0,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              dailyCount >= DAILY_MESSAGE_LIMIT
                ? "Daily limit reached"
                : "Ask your research co-pilot..."
            }
            disabled={isLoading || dailyCount >= DAILY_MESSAGE_LIMIT}
            style={{
              flex: 1,
              background: "var(--bg)",
              borderRadius: "999px",
              padding: "12px 16px",
              fontSize: "14px",
              border: "1px solid var(--border)",
              color: "var(--text)",
              outline: "none",
              fontFamily: "var(--font-body)",
              opacity: isLoading || dailyCount >= DAILY_MESSAGE_LIMIT ? 0.5 : 1,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || dailyCount >= DAILY_MESSAGE_LIMIT}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "none",
              cursor: !input.trim() || isLoading || dailyCount >= DAILY_MESSAGE_LIMIT ? "not-allowed" : "pointer",
              background: dailyCount >= DAILY_MESSAGE_LIMIT ? "var(--border)" : "#0D9488",
              color: dailyCount >= DAILY_MESSAGE_LIMIT ? "var(--text-muted)" : "white",
              transition: "opacity 0.2s",
              opacity: !input.trim() || isLoading || dailyCount >= DAILY_MESSAGE_LIMIT ? 0.5 : 1,
            }}
          >
            {isLoading ? (
              <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed",
              top: "16px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              background: "#374151",
              color: "white",
              padding: "10px 16px",
              borderRadius: "10px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ShieldAlert size={16} />
            {toastMessage}
            <button
              onClick={() => setShowToast(false)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "2px",
                color: "white",
                marginLeft: "4px",
              }}
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
