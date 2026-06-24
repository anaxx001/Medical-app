import { Link } from "wouter";
import { Clock, ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";

export default function CommunityWaitingPage({ params }: { params: { id: string } }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "var(--font-sans, sans-serif)",
      color: "var(--text)"
    }}>
      <div style={{ textAlign: "center", maxWidth: "460px", background: "var(--surface)", border: "1px solid var(--border)", padding: "40px", borderRadius: "20px" }}>
        
        <div style={{
          width: "60px",
          height: "60px",
          borderRadius: "16px",
          background: "rgba(217,119,6,0.08)",
          color: "#D97706",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <Clock size={32} />
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "24px",
          marginBottom: "12px",
          letterSpacing: "-0.5px"
        }}>
          Awaiting Senior Clinical Review
        </h1>

        <p style={{
          fontSize: "14px",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          marginBottom: "24px"
        }}>
          In order to prevent systemic misinformation and protect student academic paths, new circles require review by a verified senior consultant doctor or student supervisor before going public. High academic standard safeguards active.
        </p>

        <div style={{
          background: "var(--surface-muted)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "12px 14px",
          fontSize: "12.5px",
          textAlign: "left",
          marginBottom: "28px",
          display: "flex",
          gap: "10px",
          alignItems: "center"
        }}>
          <ShieldAlert size={18} color="#D97706" style={{ flexShrink: 0 }} />
          <span>Typically processed in less than 24 hours. You'll receive a notification central alert once approved.</span>
        </div>

        <Link href="/" style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          background: "var(--gradient, linear-gradient(135deg, #0d9488 0%, #0369a1 100%))",
          color: "white",
          padding: "12px 24px",
          borderRadius: "10px",
          fontWeight: 700,
          fontSize: "14px",
          textDecoration: "none",
          boxShadow: "0 4px 12px rgba(13, 148, 136, 0.15)"
        }}>
          Returns to Dashboard <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
