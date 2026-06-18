import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
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
    if (!user) return;
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role,
      content,
      model: selectedModel,
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || !user) return;

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
    if (!user) return;
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
    setToastMessage("Chat history cleared");
    setShowToast(true);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <ChevronLeft size={22} />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-yellow-300" />
            <span className="font-semibold">Research Co-Pilot</span>
          </div>
        </div>
        <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Model Selector */}
      <div className="bg-white border-b border-gray-200 px-4 py-2">
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {models.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label} — {m.desc} {modelStatus[m.value] === false ? "(Offline)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Daily Limit Bar */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Daily usage: {dailyCount}/{DAILY_MESSAGE_LIMIT}</span>
          <span>{Math.round((dailyCount / DAILY_MESSAGE_LIMIT) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <motion.div
            className={`h-1.5 rounded-full ${
              dailyCount >= DAILY_MESSAGE_LIMIT
                ? "bg-red-500"
                : dailyCount >= DAILY_MESSAGE_LIMIT * 0.8
                ? "bg-yellow-500"
                : "bg-green-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${(dailyCount / DAILY_MESSAGE_LIMIT) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <AnimatePresence>
          {showLimitWarning && dailyCount < DAILY_MESSAGE_LIMIT && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-4 mt-2"
            >
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Approaching daily limit</p>
                  <p>You've used {dailyCount} of {DAILY_MESSAGE_LIMIT} messages today.</p>
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
            className="px-4 py-8 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
              <Sparkles size={32} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Your Research Co-Pilot</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
              Ask me anything about research, studies, or wellness. I'm here to help you learn, not replace your judgment.
            </p>

            <div className="space-y-2 max-w-sm mx-auto">
              {SUGGESTED_PROMPTS.map((prompt, index) => {
                const Icon = prompt.icon;
                return (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => handlePromptClick(prompt.text)}
                    className="w-full text-left p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon size={16} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 truncate">{prompt.text}</p>
                      <p className="text-xs text-gray-400">{prompt.category}</p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-6 flex items-start gap-2 text-xs text-gray-400 max-w-xs mx-auto">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              <p>
                This AI provides educational support only. Always verify critical information and consult supervisors for clinical decisions.
              </p>
            </div>
          </motion.div>
        )}

        {/* Messages */}
        <div className="px-4 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === "user"
                      ? "bg-gray-300"
                      : "bg-gradient-to-br from-blue-500 to-indigo-600"
                  }`}
                >
                  {message.role === "user" ? (
                    <User size={14} className="text-gray-600" />
                  ) : (
                    <Sparkles size={14} className="text-white" />
                  )}
                </div>

                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  {message.model && message.role === "assistant" && (
                    <div className="mt-1 text-xs opacity-50 flex items-center gap-1">
                      <FlaskConical size={12} />
                      {message.model}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <Sparkles size={14} className="text-white" />
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border border-gray-100">
                <Loader2 size={16} className="animate-spin text-gray-400" />
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
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
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading || dailyCount >= DAILY_MESSAGE_LIMIT}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              dailyCount >= DAILY_MESSAGE_LIMIT
                ? "bg-gray-300 text-gray-500"
                : "bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            }`}
          >
            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
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
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
              <ShieldAlert size={16} />
              {toastMessage}
              <button onClick={() => setShowToast(false)} className="ml-2">
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
