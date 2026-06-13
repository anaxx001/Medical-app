import { useState, useRef, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { Send, Bot, User, Trash2, Copy, Check } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Explain the brachial plexus",
  "Mnemonics for cranial nerves",
  "How does X-ray imaging work?",
  "Explain glycolysis steps",
  "What is the cardiac cycle?",
  "Difference between MRI and CT scan",
];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInline(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--blue-dark);font-family:var(--font-display)">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em style="color:var(--text-muted)">$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:var(--surface-2);padding:1px 6px;border-radius:4px;font-size:12.5px;color:var(--green-dark)">$1</code>');
}

function formatMessage(content: string) {
  const lines = content.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("### ")) return <p key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "15px", color: "var(--blue-dark)", marginBottom: "6px", marginTop: i > 0 ? "14px" : 0, borderBottom: "1px solid var(--border)", paddingBottom: "4px" }}>{line.replace("### ", "")}</p>;
    if (line.startsWith("## ")) return <p key={i} style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "16px", color: "var(--blue)", marginBottom: "6px", marginTop: i > 0 ? "14px" : 0 }}>{line.replace("## ", "")}</p>;
    if (line.trim() === "---") return <hr key={i} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "10px 0" }} />;
    if (line.startsWith("* ") || line.startsWith("- ") || line.startsWith("*   ") || line.startsWith("-   ")) {
      const text = line.replace(/^\*\s{3}|^-\s{3}|^\*\s|^-\s/, "");
      return <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}><span style={{ color: "var(--green)", fontWeight: 700, flexShrink: 0 }}>•</span><span style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatInline(text) }} /></div>;
    }
    if (/^\d+\./.test(line)) {
      const num = line.match(/^(\d+)\./)?.[1];
      const text = line.replace(/^\d+\.\s*/, "");
      return <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "5px" }}><span style={{ color: "var(--blue)", fontWeight: 700, flexShrink: 0, fontSize: "13px", minWidth: "18px" }}>{num}.</span><span style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatInline(text) }} /></div>;
    }
    if (line.trim() === "") return <div key={i} style={{ height: "6px" }} />;
    return <p key={i} style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6, marginBottom: "4px" }} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
  });
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const content = (text || input).trim();
    if (!content || loading) return;
    const userMessage: Message = { role: "user", content };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const { data: { session } } = await createClient().auth.getSession();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(content: string, id: string) {
    await navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 130px)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px", flexShrink: 0 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "2px" }}>MedAI Assistant 🤖</h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Your AI-powered medical study companion</p>
          </div>
          {messages.length > 0 && (
            <button onClick={() => setMessages([])} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 14px", borderRadius: "99px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer" }}>
              <Trash2 size={13} />Clear
            </button>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", paddingBottom: "16px" }}>
          {messages.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto 14px" }}>🧠</div>
                <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "18px", color: "var(--text)", marginBottom: "6px" }}>Ask MedAI anything</h2>
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", maxWidth: "320px", lineHeight: 1.6 }}>Your medical study companion. Ask about anatomy, physiology, pharmacology, radiography and more.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "center", maxWidth: "500px" }}>
                {suggestions.map(s => (
                  <button key={s} onClick={() => handleSend(s)} style={{ padding: "8px 14px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "13px", cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: msg.role === "user" ? "var(--gradient)" : "linear-gradient(135deg, #1A5F96, #28935C)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {msg.role === "user" ? <User size={15} color="white" /> : <Bot size={15} color="white" />}
              </div>
              <div style={{ maxWidth: "80%", position: "relative" }}>
                <div style={{ padding: "12px 16px", borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: msg.role === "user" ? "var(--gradient)" : "var(--surface)", border: msg.role === "user" ? "none" : "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
                  {msg.role === "user"
                    ? <p style={{ fontSize: "14px", color: "white", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>{msg.content}</p>
                    : <div>{formatMessage(msg.content)}</div>
                  }
                </div>
                {msg.role === "assistant" && (
                  <button onClick={() => handleCopy(msg.content, `msg-${i}`)} style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--text-light)", padding: "2px", display: "flex" }}>
                    {copied === `msg-${i}` ? <Check size={12} color="var(--green)" /> : <Copy size={12} />}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #1A5F96, #28935C)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Bot size={15} color="white" />
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", display: "flex", gap: "5px", alignItems: "center" }}>
                {[0, 1, 2].map(j => (
                  <div key={j} style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--blue-light)", animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${j * 0.2}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div style={{ flexShrink: 0, background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "12px", boxShadow: "var(--shadow-md)", display: "flex", gap: "10px", alignItems: "flex-end" }}>
          <textarea
            placeholder="Ask about anatomy, pharmacology, radiography..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            rows={1}
            style={{ flex: 1, border: "none", background: "transparent", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", resize: "none", lineHeight: 1.6, maxHeight: "120px", overflowY: "auto" }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            style={{ width: "40px", height: "40px", borderRadius: "12px", border: "none", background: input.trim() ? "var(--gradient)" : "var(--border)", color: input.trim() ? "white" : "var(--text-light)", display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() ? "pointer" : "not-allowed", flexShrink: 0, transition: "all 0.2s ease" }}
          >
            <Send size={16} />
          </button>
        </div>
        <p style={{ fontSize: "11px", color: "var(--text-light)", textAlign: "center", marginTop: "8px", fontFamily: "var(--font-body)", flexShrink: 0 }}>
          MedAI can make mistakes. Always verify with your textbooks and lecturers.
        </p>
      </div>
    </AppShell>
  );
}
