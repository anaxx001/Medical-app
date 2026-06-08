import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { Link } from "wouter";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleReset() {
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true);
    setError("");
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      if (resetError) throw resetError;
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient-soft)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-body)" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 12px" }}>🩺</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MedStudent</h1>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow-md)" }}>
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📬</div>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "8px" }}>Check your email</h2>
              <p style={{ fontSize: "13.5px", color: "var(--text-muted)", marginBottom: "24px", lineHeight: 1.6 }}>
                We sent a password reset link to <strong>{email}</strong>. Check your inbox and follow the instructions.
              </p>
              <Link href="/login" style={{ display: "block", padding: "13px", borderRadius: "var(--radius-sm)", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", textDecoration: "none", textAlign: "center", boxShadow: "0 4px 14px rgba(45,135,200,0.3)" }}>
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>Reset your password</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Enter your email and we'll send you a reset link.</p>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {error && <p style={{ fontSize: "13px", color: "#E8445A", marginBottom: "14px", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>{error}</p>}

              <button onClick={handleReset} disabled={loading} style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 4px 14px rgba(45,135,200,0.3)", opacity: loading ? 0.8 : 1, marginBottom: "16px" }}>
                {loading ? "Sending..." : "Send Reset Link →"}
              </button>

              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
                Remember it?{" "}
                <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>Back to login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
