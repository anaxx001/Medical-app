import { useState } from "react";
import AppShell from "@/components/AppShell";
import SupportTicketForm from "@/components/SupportTicketForm";
import { MessageSquare, FileText, Settings, AlertCircle, HelpCircle } from "lucide-react";

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState<"faq" | "support">("faq");

  const FAQItems = [
    {
      question: "How do I create a community?",
      answer:
        "Navigate to the Communities section and click 'Create Community'. Fill in the community name, description, and choose your preferred settings. Your community will be live immediately!",
    },
    {
      question: "How do I report inappropriate content?",
      answer:
        "Click the three-dot menu on any post or comment and select 'Report'. Choose the reason for your report and provide details. Our moderation team will review it within 24 hours.",
    },
    {
      question: "How do I save posts for later?",
      answer:
        "Click the bookmark icon on any post to save it. You can view all your saved posts by going to your profile and clicking 'Saved Posts'.",
    },
    {
      question: "How do I change my profile picture?",
      answer:
        "Go to Profile Settings, click on your current avatar, and select a new image from your device. Your new profile picture will be updated immediately.",
    },
    {
      question: "How do I enable dark mode?",
      answer:
        "Visit App Settings and toggle the 'Dark Mode' option. The theme will change instantly and your preference will be saved.",
    },
    {
      question: "How do I reset my password?",
      answer:
        "Go to the login page and click 'Forgot Password'. Enter your email address and we'll send you a link to reset your password.",
    },
  ];

  const HelpCard = ({ icon: Icon, title, description }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) => (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "20px",
      display: "flex",
      gap: "16px",
      alignItems: "flex-start",
    }}>
      <div style={{
        color: "#0D9488",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        {Icon}
      </div>
      <div>
        <h3 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: "15px",
          color: "var(--text)",
          margin: "0 0 8px 0",
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          margin: 0,
          lineHeight: "1.5",
        }}>
          {description}
        </p>
      </div>
    </div>
  );

  const FAQItem = ({ question, answer }: { question: string; answer: string }) => (
    <details style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius)",
      padding: "16px",
      cursor: "pointer",
      marginBottom: "12px",
    }}>
      <summary style={{
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "15px",
        color: "var(--text)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        userSelect: "none",
      }}>
        <span>➕</span>
        {question}
      </summary>
      <p style={{
        fontSize: "14px",
        color: "var(--text-muted)",
        margin: "12px 0 0 24px",
        lineHeight: "1.6",
      }}>
        {answer}
      </p>
    </details>
  );

  const TabButton = ({ tab, label }: { tab: "faq" | "support"; label: string }) => (
    <button
      onClick={() => setActiveTab(tab)}
      style={{
        padding: "10px 16px",
        fontFamily: "var(--font-display)",
        fontWeight: 600,
        fontSize: "14px",
        background: activeTab === tab ? "#0D9488" : "transparent",
        color: activeTab === tab ? "white" : "var(--text-muted)",
        border: activeTab === tab ? "none" : `1px solid var(--border)`,
        borderRadius: "var(--radius)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.background = "var(--border)";
        }
      }}
      onMouseLeave={(e) => {
        if (activeTab !== tab) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {label}
    </button>
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 16px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-display)",
            fontWeight: 800,
            fontSize: "32px",
            color: "var(--text)",
            margin: "0 0 8px 0",
          }}>
            Help & Support
          </h1>
          <p style={{
            fontSize: "16px",
            color: "var(--text-muted)",
            margin: 0,
          }}>
            Find answers to common questions or submit a support ticket
          </p>
        </div>

        {/* Quick Help Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "40px",
        }}>
          <HelpCard
            icon={<HelpCircle size={24} />}
            title="FAQ"
            description="Browse frequently asked questions about features and settings"
          />
          <HelpCard
            icon={<MessageSquare size={24} />}
            title="Support Tickets"
            description="Submit a support ticket to our team for direct assistance"
          />
          <HelpCard
            icon={<Settings size={24} />}
            title="Settings"
            description="Adjust your account settings and preferences"
          />
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex",
          gap: "12px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border)",
          paddingBottom: "12px",
        }}>
          <TabButton tab="faq" label="FAQ" />
          <TabButton tab="support" label="Support Ticket Desk" />
        </div>

        {/* FAQ Tab */}
        {activeTab === "faq" && (
          <div style={{ animation: "fadeIn 0.3s ease-in" }}>
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--text)",
              marginBottom: "20px",
            }}>
              Frequently Asked Questions
            </h2>
            {FAQItems.map((item, index) => (
              <FAQItem key={index} question={item.question} answer={item.answer} />
            ))}
          </div>
        )}

        {/* Support Ticket Desk Tab */}
        {activeTab === "support" && (
          <div style={{ animation: "fadeIn 0.3s ease-in", marginBottom: "40px" }}>
            <SupportTicketForm onSuccess={() => setActiveTab("faq")} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </AppShell>
  );
}
