import { useState } from "react";
import { useLocation, Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, HeartPulse } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrUsername || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Direct sign-in using email, or fallback check for username
      let loginEmail = emailOrUsername.trim();
      if (!loginEmail.includes("@")) {
        // Find matching email from Username in mock database or assume domain
        loginEmail = `${loginEmail.toLowerCase()}@medstudent.ng`;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (signInError) throw signInError;
      
      // If success, go to homepage/dashboard
      setLocation("/");
    } catch (err: any) {
      setError(err?.message || "Invalid academic credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--gradient-soft, linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%))",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      fontFamily: "var(--font-sans, sans-serif)"
    }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        
        {/* Logo/Identity Section */}
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "var(--gradient, linear-gradient(135deg, #0d9488 0%, #0369a1 100%))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px",
            color: "white",
            margin: "0 auto 12px",
            boxShadow: "0 8px 16px rgba(13, 148, 136, 0.15)"
          }}>
            <HeartPulse size={28} />
          </div>
          <h1 style={{
            fontFamily: "var(--font-display, inherit)",
            fontWeight: 850,
            fontSize: "26px",
            color: "var(--text, #1e293b)",
            letterSpacing: "-0.5px",
            margin: 0
          }}>
            MedStudent
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-muted, #64748b)", marginTop: "4px" }}>
            The premier research & peer community hub for health-science students
          </p>
        </div>

        {/* Form panel */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "var(--surface, #ffffff)",
            borderRadius: "20px",
            padding: "32px 24px",
            border: "1px solid var(--border, #e2e8f0)",
            boxShadow: "var(--shadow-xl, 0 20px 25px -5px rgba(0, 0, 0, 0.05))"
          }}
        >
          <h2 style={{
            fontFamily: "var(--font-display, inherit)",
            fontWeight: 700,
            fontSize: "19px",
            color: "var(--text, #1e293b)",
            marginBottom: "4px"
          }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted, #64748b)", marginBottom: "24px" }}>
            Sign in to access your dashboard, study circles, and peer resources.
          </p>

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Username/Email Input */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Username or Email
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted, #64748b)"
                }} />
                <input
                  type="text"
                  placeholder="eg. obi_nwosu or obi@email.com"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 12px 11px 36px",
                    borderRadius: "10px",
                    border: "1px solid var(--border, #e2e8f0)",
                    background: "var(--surface-muted, #f8fafc)",
                    fontFamily: "var(--font-body, inherit)",
                    fontSize: "14px",
                    color: "var(--text, #1e293b)",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <label style={{
                  fontFamily: "var(--font-display, inherit)",
                  fontWeight: 600,
                  fontSize: "13px",
                  color: "var(--text, #1e293b)"
                }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{
                  fontSize: "12.5px",
                  color: "#0d9488",
                  textDecoration: "none",
                  fontWeight: 500
                }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted, #64748b)"
                }} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 38px 11px 36px",
                    borderRadius: "10px",
                    border: "1px solid var(--border, #e2e8f0)",
                    background: "var(--surface-muted, #f8fafc)",
                    fontFamily: "var(--font-body, inherit)",
                    fontSize: "14px",
                    color: "var(--text, #1e293b)",
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    color: "var(--text-muted, #64748b)",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error Notification */}
            {error && (
              <div style={{
                display: "flex",
                gap: "8px",
                alignItems: "center",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                padding: "10px 12px",
                borderRadius: "10px"
              }}>
                <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: "12px", color: "#b91c1c", fontWeight: 500 }}>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "13px",
                  borderRadius: "12px",
                  border: "none",
                  background: "var(--gradient, linear-gradient(135deg, #0d9488 0%, #0369a1 100%))",
                  color: "white",
                  fontFamily: "var(--font-display, inherit)",
                  fontWeight: 750,
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(13, 148, 136, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 0.2s"
                }}
              >
                {loading ? "Verifying clinical access..." : "Sign In"}
                {!loading && <ArrowRight size={16} />}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0" }}>
                <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
                <span style={{ fontSize: "11px", color: "var(--text-muted, #64748b)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "var(--border, #e2e8f0)" }} />
              </div>

              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoading(true);
                    const { error } = await supabase.auth.signInWithOAuth({
                      provider: 'google',
                      options: { redirectTo: window.location.origin }
                    });
                    if (error) throw error;
                  } catch (err: any) {
                    setError(err.message || "Google sign-in failed");
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "12px",
                  border: "1px solid var(--border, #e2e8f0)",
                  background: "var(--surface, #ffffff)",
                  color: "var(--text, #1e293b)",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  transition: "all 0.2s"
                }}
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: "18px", height: "18px" }} />
                Continue with Google
              </button>
            </div>

          </form>

          {/* Prompt to register */}
          <div style={{
            marginTop: "24px",
            textAlign: "center",
            borderTop: "1px solid var(--border, #e2e8f0)",
            paddingTop: "16px"
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
              Don't have an account?{" "}
              <Link href="/signup" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>
                Sign Up
              </Link>
            </p>
          </div>

        </motion.div>

        {/* Safe sandboxed badge */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginTop: "16px",
          color: "var(--text-muted, #64748b)"
        }}>
          <ShieldCheck size={14} color="#0d9488" />
          <span style={{ fontSize: "11px", fontWeight: 500 }}>Verified Student Enrollment Database</span>
        </div>

      </div>
    </div>
  );
}
