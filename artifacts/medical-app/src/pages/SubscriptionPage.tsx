import { useLocation } from "wouter";
import { createClient } from "@/lib/supabase";
import {
  ArrowLeft,
  Star,
  Zap,
  Brain,
  HardDrive,
  Shield,
  MessageSquare,
  Clock,
  Check,
  X,
  Crown,
  Sparkles,
  Bell,
} from "lucide-react";
import AnimatedPage from "@/components/animations/AnimatedPage";
import StaggerChildren from "@/components/animations/StaggerChildren";

const TIERS = [
  {
    name: "Free",
    icon: Star,
    color: "#6B7280",
    price: "₦0",
    period: "forever",
    description: "Everything you need to get started",
    features: [
      { text: "Community feed & posts", included: true },
      { text: "Join communities", included: true },
      { text: "Basic AI chat (20 msgs/day)", included: true },
      { text: "Flashcards & quizzes", included: true },
      { text: "Notes & study tools", included: true },
      { text: "Direct messages", included: true },
      { text: "News & announcements", included: true },
      { text: "Limited file storage (100MB)", included: true },
      { text: "Ads supported", included: true },
      { text: "RAG Knowledge Base", included: false },
      { text: "Unlimited AI chat", included: false },
      { text: "Priority support", included: false },
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Premium",
    icon: Zap,
    color: "#0D9488",
    price: "₦2,500",
    period: "/month",
    description: "Unlock your full potential",
    badge: "Most Popular",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Unlimited AI chat", included: true },
      { text: "RAG Knowledge Base", included: true },
      { text: "Upload your own notes & PDFs", included: true },
      { text: "AI answers from YOUR materials", included: true },
      { text: "5 GB file storage", included: true },
      { text: "Advanced study analytics", included: true },
      { text: "Custom flashcard decks", included: true },
      { text: "No ads", included: true },
      { text: "Priority support", included: false },
      { text: "Early access to new features", included: false },
    ],
    cta: "Coming Soon",
    disabled: true,
  },
  {
    name: "Pro",
    icon: Crown,
    color: "#8B5CF6",
    price: "₦5,000",
    period: "/month",
    description: "For serious medical students",
    badge: "Best Value",
    features: [
      { text: "Everything in Premium", included: true },
      { text: "Unlimited file storage", included: true },
      { text: "Priority support (24h response)", included: true },
      { text: "Early access to new features", included: true },
      { text: "Exclusive study groups", included: true },
      { text: "1-on-1 mentorship matching", included: true },
      { text: "Offline mode for notes", included: true },
      { text: "Export study data", included: true },
      { text: "Custom AI personality", included: true },
    ],
    cta: "Coming Soon",
    disabled: true,
  },
];

const WHY_UPGRADE = [
  {
    icon: Brain,
    title: "AI That Knows YOUR Notes",
    desc: "Upload your lecture slides, PDFs, and handwritten notes. Our RAG system lets the AI answer questions based on your exact materials.",
    color: "#8B5CF6",
  },
  {
    icon: HardDrive,
    title: "Store Everything",
    desc: "Past questions, lecture recordings, anatomy diagrams, pharmacology charts — keep it all organized and accessible anywhere.",
    color: "#3B82F6",
  },
  {
    icon: MessageSquare,
    title: "Unlimited AI Conversations",
    desc: "No more hitting daily limits. Ask as many questions as you need, whether it's 2 AM before an exam or during a study session.",
    color: "#0D9488",
  },
  {
    icon: Shield,
    title: "Ad-Free Experience",
    desc: "Focus entirely on your studies without distractions. Every pixel of the app is optimized for learning, not advertising.",
    color: "#10B981",
  },
];

export default function SubscriptionPage() {
  const [, navigate] = useLocation();

  return (
    <AnimatedPage>
      <div style={{ padding: "16px", paddingBottom: "80px", maxWidth: "900px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              color: "var(--text-primary)",
            }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "var(--text-primary)" }}>
              Subscription Plans
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>
              Choose the plan that fits your study needs
            </p>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div style={{
          background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
          borderRadius: "16px",
          padding: "20px",
          color: "white",
          textAlign: "center",
          marginBottom: "28px",
          position: "relative",
          overflow: "hidden",
        }}>
          <div style={{
            position: "absolute",
            top: "-20px",
            right: "-20px",
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "20px",
              background: "rgba(251, 191, 36, 0.2)",
              color: "#FBBF24",
              fontSize: "13px",
              fontWeight: 600,
              marginBottom: "12px",
            }}>
              <Sparkles size={14} />
              Coming Soon
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
              Premium Features Are on the Way
            </h2>
            <p style={{ fontSize: "14px", opacity: 0.8, maxWidth: "400px", margin: "0 auto", lineHeight: 1.5 }}>
              We're building the best study tools for Nigerian medical students. 
              Subscribe below to get notified when we launch.
            </p>
          </div>
        </div>

        {/* Pricing Tiers */}
        <StaggerChildren>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "16px",
            marginBottom: "32px",
          }}>
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                style={{
                  background: "var(--surface)",
                  borderRadius: "20px",
                  border: tier.name === "Premium" ? `2px solid ${tier.color}` : "1px solid var(--border)",
                  overflow: "hidden",
                  position: "relative",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {tier.badge && (
                  <div style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    padding: "4px 10px",
                    borderRadius: "20px",
                    background: tier.color,
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}>
                    {tier.badge}
                  </div>
                )}

                <div style={{ padding: "24px" }}>
                  {/* Tier Header */}
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      background: `${tier.color}15`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: tier.color,
                    }}>
                      <tier.icon size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
                        {tier.name}
                      </h3>
                      <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        {tier.description}
                      </p>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ marginBottom: "20px" }}>
                    <span style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>
                      {tier.price}
                    </span>
                    <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                      {" "}{tier.period}
                    </span>
                  </div>

                  {/* Features */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                    {tier.features.map((feature, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {feature.included ? (
                          <div style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "#10B98115",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <Check size={12} color="#10B981" strokeWidth={3} />
                          </div>
                        ) : (
                          <div style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            background: "var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                            <X size={12} color="var(--text-muted)" strokeWidth={3} />
                          </div>
                        )}
                        <span style={{
                          fontSize: "13px",
                          color: feature.included ? "var(--text-primary)" : "var(--text-muted)",
                        }}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <button
                    disabled={tier.disabled}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "12px",
                      background: tier.name === "Free" ? "var(--border)" : tier.color,
                      color: tier.name === "Free" ? "var(--text-muted)" : "white",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "15px",
                      cursor: tier.disabled ? "not-allowed" : "pointer",
                      opacity: tier.disabled ? 0.7 : 1,
                    }}
                  >
                    {tier.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </StaggerChildren>

        {/* Why Upgrade Section */}
        <div style={{ marginBottom: "32px" }}>
          <h2 style={{
            fontSize: "18px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "16px",
            textAlign: "center",
          }}>
            Why Students Upgrade
          </h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}>
            {WHY_UPGRADE.map((item, i) => (
              <div
                key={i}
                style={{
                  background: "var(--surface)",
                  borderRadius: "16px",
                  padding: "20px",
                  border: "1px solid var(--border)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: `${item.color}15`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: item.color,
                  marginBottom: "12px",
                }}>
                  <item.icon size={22} />
                </div>
                <h4 style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  marginBottom: "6px",
                }}>
                  {item.title}
                </h4>
                <p style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Teaser */}
        <div style={{
          background: "var(--surface)",
          borderRadius: "16px",
          padding: "20px",
          border: "1px solid var(--border)",
          textAlign: "center",
        }}>
          <Bell size={24} color="#0D9488" style={{ marginBottom: "8px" }} />
          <h3 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "6px" }}>
            Get Notified When We Launch
          </h3>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>
            Be the first to know when Premium goes live. No spam, just updates.
          </p>
          <div style={{ display: "flex", gap: "8px", maxWidth: "400px", margin: "0 auto" }}>
            <input
              type="email"
              placeholder="your@email.com"
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--background)",
                color: "var(--text-primary)",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                background: "#0D9488",
                color: "white",
                border: "none",
                fontWeight: 600,
                fontSize: "14px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Notify Me
            </button>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
