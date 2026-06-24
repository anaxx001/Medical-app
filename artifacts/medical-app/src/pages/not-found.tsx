import { Link } from "wouter";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
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
      <div style={{ textAlign: "center", maxWidth: "440px" }}>
        <div style={{
          width: "64px",
          height: "64px",
          borderRadius: "50%",
          background: "rgba(239, 68, 68, 0.08)",
          color: "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px"
        }}>
          <AlertTriangle size={32} />
        </div>

        <h1 style={{
          fontFamily: "var(--font-display)",
          fontWeight: 800,
          fontSize: "28px",
          marginBottom: "12px",
          letterSpacing: "-0.5px"
        }}>
          Route Path Missing
        </h1>

        <p style={{
          fontSize: "14.5px",
          color: "var(--text-muted)",
          lineHeight: 1.5,
          marginBottom: "28px"
        }}>
          This community workspace path does not exist. It might have been updated during our diagnostic checks. Let's return back to your core console.
        </p>

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
          <Home size={16} /> Returns to Core Console
        </Link>
      </div>
    </div>
  );
}
