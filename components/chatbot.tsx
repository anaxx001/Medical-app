"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function formatMessage(text: string) {
  // Basic markdown-like formatting
  return text
    .split("\n")
    .map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) {
        return <p key={i} style={{ fontWeight: 700, margin: "6px 0 2px", color: "var(--text)" }}>{line.slice(2, -2)}</p>;
      }
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return <p key={i} style={{ margin: "2px 0", paddingLeft: "12px", color: "var(--text)" }}>• {line.slice(2)}</p>;
      }
      if (line.trim() === "") return <br key={i} />;
      return <p key={i} style={{ margin: "2px 0", color: "var(--text)" }}>{line}</p>;
    });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hi! I'm MedBot 🩺 Your AI study assistant. Ask me anything about anatomy, pharmacology, past questions, or any med topic!" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const history = [...messages, userMsg]
        .filter(m => m.id !== "welcome")
        .map(m => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get response.");

      setMessages(prev => [...prev, {
        id: Date.now().toString() + "_ai",
        role: "assistant",
        content: data.message,
      }]);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        title="MedBot AI Assistant"
        style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "56px", height: "56px", borderRadius: "50%",
          background: "var(--gradient)", border: "none",
          boxShadow: "0 4px 20px rgba(45,135,200,0.45)",
          cursor: "pointer", zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "24px", transition: "transform 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* Chat drawer */}
      {open && (
        <div style={{
          position: "fixed", bottom: "92px", right: "24px",
          width: "340px", height: "520px",
          background: "var(--surface)", borderRadius: "var(--radius)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          zIndex: 99, overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}>

          {/* Header */}
          <div style={{
            padding: "14px 16px", borderBottom: "1px solid var(--border)",
            background: "var(--gradient)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "22px" }}>🤖</span>
            <div>
              <h3 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "white", margin: 0 }}>MedBot</h3>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.8)", margin: 0 }}>AI Medical Study Assistant</p>
            </div>
            <button
              onClick={() => setMessages([{ id: "welcome", role: "assistant", content: "Hi! I'm MedBot 🩺 Your AI study assistant. Ask me anything about anatomy, pharmacology, past questions, or any med topic!" }])}
              title="Clear chat"
              style={{ marginLeft: "auto", background: "rgba(255,255,255,0.2)", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", color: "white", fontSize: "11px", fontFamily: "var(--font-body)" }}
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 12px", scrollbarWidth: "thin" }}>
            {messages.map(msg => (
              <div key={msg.id} style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "10px",
              }}>
                {msg.role === "assistant" && (
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", flexShrink: 0, marginRight: "8px", alignSelf: "flex-end" }}>🤖</div>
                )}
                <div style={{
                  maxWidth: "80%", padding: "10px 12px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                  background: msg.role === "user" ? "var(--gradient)" : "var(--surface-2)",
                  border: msg.role === "assistant" ? "1px solid var(--border)" : "none",
                  fontSize: "13px", lineHeight: 1.55,
                  color: msg.role === "user" ? "white" : "var(--text)",
                }}>
                  {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>🤖</div>
                <div style={{ background: "var(--surface-2)", border: "1px solid var(--border)", borderRadius: "16px 16px 16px 4px", padding: "10px 14px" }}>
                  <span style={{ fontSize: "18px", letterSpacing: "2px", color: "var(--text-muted)" }}>···</span>
                </div>
              </div>
            )}

            {error && (
              <p style={{ fontSize: "12px", color: "#E8445A", textAlign: "center", background: "#FFF0F2", padding: "8px", borderRadius: "8px", margin: "4px 0" }}>{error}</p>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: "8px", alignItems: "center" }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask MedBot anything..."
              disabled={loading}
              style={{
                flex: 1, padding: "9px 12px", borderRadius: "20px",
                border: "1px solid var(--border)", background: "var(--surface-2)",
                fontFamily: "var(--font-body)", fontSize: "13px",
                color: "var(--text)", outline: "none",
              }}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                background: "var(--gradient)", border: "none",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "16px", flexShrink: 0,
              }}
            >↑</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}