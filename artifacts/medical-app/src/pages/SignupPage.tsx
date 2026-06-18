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

const studyYears = [
"Year 1", "Year 2", "Year 3", "Year 4", "Year 5", "Year 6",
"Professor", "Consultant",
];

export default function SignupPage() {
const [, navigate] = useLocation();
const supabase = createClient();

const [step, setStep] = useState<1 | 2>(1);
const [fullName, setFullName] = useState("");
const [username, setUsername] = useState("");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [profession, setProfession] = useState<Profession | null>(null);
const [studyYear, setStudyYear] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

async function handleSignup() {
if (!profession) return;
setLoading(true);
setError("");
try {
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
email,
password,
options: {
data: {
full_name: fullName,
username: username.toLowerCase().trim(),
profession,
study_year: studyYear,
},
},
});
if (signUpError) throw signUpError;

// Backstop: persist study_year on the profile in case the auth trigger
// doesn't map it from metadata.
const newUserId = signUpData.user?.id;
if (newUserId && studyYear) {
await supabase.from("profiles").update({ study_year: studyYear }).eq("id", newUserId);
}
navigate("/");
} catch (err: any) {
setError(err.message || "Something went wrong.");
} finally {
setLoading(false);
}
}

return (
<div style={{ minHeight: "100vh", background: "var(--gradient-soft)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "var(--font-body)" }}>

  <div style={{ width: "100%", maxWidth: "460px", margin: "0 auto" }}>

    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "28px" }}>

      <div
        style={{
          padding: "10px",
          borderRadius: "24px",
          background: "rgba(255,255,255,0.4)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: "12px"
        }}
      >
        <img
          src="/logo.png"
          alt="MedStudent"
          style={{
            width: "70px",
            height: "70px",
            borderRadius: "18px",
            boxShadow: "0 6px 12px rgba(0,0,0,0.15)"
          }}
        />
      </div>

      <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", background: "var(--gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", margin: "0" }}>
        MedStudent
      </h1>

      <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "4px" }}>
        STUDY•CONNECT•SUCCEED
      </p>
    </div>

    <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "28px 24px", boxShadow: "var(--shadow-md)" }}>

      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
        {[1, 2].map((s) => (
          <div key={s} style={{ flex: 1, height: "4px", borderRadius: "99px", background: step >= s ? "var(--gradient)" : "var(--border)" }} />
        ))}
      </div>

      {step === 1 ? (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>
            Create your account
          </h2>

          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Join the Nigerian medical student community
          </p>

          {[
            { label: "Full Name", placeholder: "e.g. Chukwuemeka Obi", value: fullName, setter: setFullName, type: "text" },
            { label: "Username", placeholder: "e.g. chemeka_obi", value: username, setter: setUsername, type: "text" },
            { label: "Email", placeholder: "you@example.com", value: email, setter: setEmail, type: "email" },
            { label: "Password", placeholder: "Min 8 characters", value: password, setter: setPassword, type: "password" },
          ].map(({ label, placeholder, value, setter, type }) => (
            <div key={label} style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>
                {label}
              </label>
              <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", boxSizing: "border-box" }}
              />
            </div>
          ))}

          <button
            onClick={() => {
              if (!fullName || !username || !email || !password) {
                setError("Please fill in all fields.");
                return;
              }
              setError("");
              setStep(2);
            }}
            style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
          >
            Continue →
          </button>

          {error && (
            <p style={{ fontSize: "13px", color: "#E8445A", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)", marginTop: "14px" }}>
              {error}
            </p>
          )}

          <p style={{ textAlign: "center", fontSize: "13px", color: "var(--text-muted)", marginTop: "16px" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--blue)", fontWeight: 600, textDecoration: "none" }}>
              Log in
            </Link>
          </p>
        </>
      ) : (
        <>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "19px", color: "var(--text)", marginBottom: "4px" }}>
            What are you studying?
          </h2>

          <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "20px" }}>
            Select your health science discipline
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
            {professions.map((p) => {
              const isSelected = profession === p;
              return (
                <button
                  key={p}
                  onClick={() => setProfession(p)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 14px",
                    borderRadius: "var(--radius-sm)",
                    border: `2px solid ${isSelected ? "var(--blue)" : "var(--border)"}`,
                    background: isSelected ? "rgba(45, 135, 200, 0.05)" : "transparent",
                    cursor: "pointer"
                  }}
                >
                  <span style={{ fontSize: "20px" }}>{icons[p]}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontWeight: isSelected ? 700 : 500, fontSize: "13px", color: isSelected ? "var(--blue)" : "var(--text)" }}>
                    {p}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", marginBottom: "6px" }}>
              Study Year / Level
            </label>
            <select
              value={studyYear}
              onChange={(e) => setStudyYear(e.target.value)}
              style={{ width: "100%", padding: "11px 14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "var(--surface-2)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", boxSizing: "border-box", cursor: "pointer" }}
            >
              <option value="">Select your level</option>
              {studyYears.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ fontSize: "13px", color: "#E8445A", marginBottom: "14px", textAlign: "center", background: "#FFF0F2", padding: "10px", borderRadius: "var(--radius-sm)" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setStep(1)}
              style={{ flex: 1, padding: "13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)", background: "transparent", color: "var(--text)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}
            >
              Back
            </button>

            <button
              onClick={handleSignup}
              disabled={!profession || !studyYear || loading}
              style={{
                flex: 2,
                padding: "13px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                background: profession && studyYear ? "var(--gradient)" : "var(--border)",
                color: profession && studyYear ? "white" : "var(--text-muted)",
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "14px",
                cursor: profession && studyYear ? "pointer" : "not-allowed",
                opacity: profession && studyYear ? 1 : 0.7,
              }}
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
