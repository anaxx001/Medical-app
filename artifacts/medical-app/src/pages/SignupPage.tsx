import { useState } from "react";
import { useLocation, Link } from "wouter";
import { createClient } from "@/lib/supabase";
import { motion } from "framer-motion";
import { Mail, Lock, User, School, AlertCircle, ArrowRight, ShieldCheck, HeartPulse, GraduationCap, Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const [, setLocation] = useLocation();
  const supabase = createClient();

  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [school, setSchool] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !fullName || !email || !school || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create user authentication node
      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            username: username.toLowerCase().trim(),
            full_name: fullName.trim(),
            school: school.trim(),
            role: "student", // default student role
          }
        }
      });

      if (signupError) throw signupError;

      // Also create database record or trigger mock profile insertion
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: data.user?.id,
          username: username.toLowerCase().trim(),
          full_name: fullName.trim(),
          school: school.trim(),
          role: "student",
          academic_year: "1st Year",
          created_at: new Date().toISOString()
        });

      if (profileError) {
        console.warn("Failed to create user profile database row, proceeding anyway: ", profileError);
      }

      // Successful registration, proceed to Homepage
      setLocation("/");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please audit your credentials.");
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
      padding: "20px 20px 40px",
      fontFamily: "var(--font-sans, sans-serif)"
    }}>
      <div style={{ width: "100%", maxWidth: "440px" }}>
        
        {/* Logo/Identity Section */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
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
            Peer study circles, real-time mentorship, and research co-pilots
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
            Create Medical Profile
          </h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-muted, #64748b)", marginBottom: "24px" }}>
            Join peer study networks and get access to senior-verified resources.
          </p>

          <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Full Name Input */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Full Name
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted, #64748b)"
                }} />
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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

            {/* Username Input */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Username
              </label>
              <div style={{ position: "relative" }}>
                <GraduationCap size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted, #64748b)"
                }} />
                <input
                  type="text"
                  placeholder="e.g. adamed"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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

            {/* School/Institution Input */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Academic Institution / Medical School
              </label>
              <div style={{ position: "relative" }}>
                <School size={16} style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted, #64748b)"
                }} />
                <input
                  type="text"
                  placeholder="e.g. University of Ibadan"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
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

            {/* Email Input */}
            <div>
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Email Address
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
                  type="email"
                  placeholder="e.g. candidate@medstudent.ng"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
              <label style={{
                display: "block",
                fontFamily: "var(--font-display, inherit)",
                fontWeight: 600,
                fontSize: "13px",
                color: "var(--text, #1e293b)",
                marginBottom: "6px"
              }}>
                Password
              </label>
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
                  placeholder="Min. 6 characters"
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

            {/* Error Notifications */}
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
                {loading ? "Onboarding student..." : "Create Account"}
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

          {/* Prompt to login */}
          <div style={{
            marginTop: "24px",
            textAlign: "center",
            borderTop: "1px solid var(--border, #e2e8f0)",
            paddingTop: "16px"
          }}>
            <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
              Already registered?{" "}
              <Link href="/login" style={{ color: "#0d9488", fontWeight: 600, textDecoration: "none" }}>
                Login Here
              </Link>
            </p>
          </div>

        </motion.div>

        {/* Security verification */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "6px",
          marginTop: "16px",
          color: "var(--text-muted, #64748b)"
        }}>
          <ShieldCheck size={14} color="#0d9488" />
          <span style={{ fontSize: "11px", fontWeight: 500 }}>Protected under HIPAA & MDCN data protocols</span>
        </div>

      </div>
    </div>
  );
}
