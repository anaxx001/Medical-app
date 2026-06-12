import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, Link } from "wouter";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient-soft)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-body)" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <img
            src="/logo.png"
            alt="MedStudent"
            style={{ width: "80px", height: "80px", borderRadius: "20px", marginBottom: "12px" }}
          />
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: "0" }}>MedStudent</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Your Nigerian health community</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow-md)" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>Welcome back</h2>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "24px" }}>Log in to continue learning</p>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "6px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>Password</label>
            <input
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ textAlign: "right", marginBottom: "20px" }}>
            <Link href="/forgot-password" style={{ fontSize: "12.5px", color: "var(--blue)", textDecoration: "none", fontWeight: 600 }}>
              Forgot password?
            </Link>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#E8445A", marginBottom: "14px", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>
              {error}
            </p>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Logging in..." : "Log In →"}
          </button>

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)" }}>
            New here?{" "}
            <Link href="/signup" style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}