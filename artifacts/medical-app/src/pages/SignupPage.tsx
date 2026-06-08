import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useLocation, Link } from "wouter";
import { Profession } from "@/lib/userPrefs";

const professions: Profession[] = [
  "Medical Doctor", "Radiographer", "Nurse", "Anatomist",
  "Pharmacist", "Physiotherapist", "Dentist", "Other",
];

const icons: Record<Profession, string> = {
  "Medical Doctor": "🩺", "Radiographer": "🔬", "Nurse": "💉",
  "Anatomist": "🧬", "Pharmacist": "💊", "Physiotherapist": "🏃",
  "Dentist": "🦷", "Other": "📚",
};

export default function SignupPage() {
  const [, navigate] = useLocation();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profession, setProfession] = useState<Profession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSignup() {
    if (!profession) return;
    setLoading(true);
    setError("");
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            username: username.toLowerCase().trim(),
            profession,
          },
        },
      });
      if (signUpError) throw signUpError;
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient-soft)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-body)" }}>
      <div style={{ width: "100%", maxWidth: "460px" }}>
        <div style={{ textAlign: "center", marginBottom: "28px" }}>
          <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", margin: "0 auto 12px" }}>🩺</div>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>MedStudent</h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>Your Nigerian health community</p>
        </div>

        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow-md)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
            {[1, 2].map((s) => (
              <div key={s} style={{ flex: 1, height: "4px", borderRadius: "99px", background: step >= s ? "var(--gradient)" : "var(--border)", transition: "background 0.3s ease" }} />
            ))}
          </div>

          {step === 1 ? (
            <>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>Create your account</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Join the Nigerian medical student community</p>

              {[
                { label: "Full Name", placeholder: "e.g. Chukwuemeka Obi", value: fullName, setter: setFullName, type: "text" },
                { label: "Username", placeholder: "e.g. chemeka_obi", value: username, setter: setUsername, type: "text" },
                { label: "Email", placeholder: "you@example.com", value: email, setter: setEmail, type: "email" },
                { label: "Password", placeholder: "Min 8 characters", value: password, setter: setPassword, type: "password" },
              ].map(({ label, placeholder, value, setter, type }) => (
                <div key={label} style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>{label}</label>
                  <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  if (!fullName || !username || !email || !password) { setError("Please fill in all fields."); return; }
                  setError("");
                  setStep(2);
                }}
                style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", cursor: "pointer", boxShadow: "0 4px 14px rgba(45,135,200,0.3)", marginBottom: "16px" }}
              >
                Continue →
              </button>

              {error && <p style={{ fontSize: "13px", color: "#E8445A", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>{error}</p>}

              <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>Log in</Link>
              </p>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>What are you studying?</h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>Select your health science discipline</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "24px" }}>
                {professions.map((p) => {
                  const isSelected = profession === p;
                  return (
                    <button
                      key={p}
                      onClick={() => setProfession(p)}
                      style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 14px", borderRadius: "var(--radius-sm)", border: `2px solid ${isSelected ? "var(--blue)" : "var(--border)"}`, background: isSelected ? "var(--gradient-soft)" : "var(--surface-2)", cursor: "pointer", textAlign: "left", transition: "all 0.15s ease" }}
                    >
                      <span style={{ fontSize: "20px" }}>{icons[p]}</span>
                      <span style={{ fontFamily: "var(--font-display)", fontWeight: isSelected ? 700 : 500, fontSize: "13px", color: isSelected ? "var(--blue-dark)" : "var(--text)" }}>{p}</span>
                    </button>
                  );
                })}
              </div>

              {error && <p style={{ fontSize: "13px", color: "#E8445A", marginBottom: "14px", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>{error}</p>}

              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: "13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "15px", cursor: "pointer" }}>
                  Back
                </button>
                <button
                  onClick={handleSignup}
                  disabled={!profession || loading}
                  style={{ flex: 2, padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: profession ? "var(--gradient)" : "var(--border)", color: profession ? "white" : "var(--text-light)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", cursor: profession ? "pointer" : "not-allowed", boxShadow: profession ? "0 4px 14px rgba(45,135,200,0.3)" : "none", opacity: loading ? 0.8 : 1 }}
                >
                  {loading ? "Creating..." : "Join MedStudent →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
