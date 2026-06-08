"use client";

import { useState } from "react";
import { savePrefs, Profession } from "@/lib/userPrefs";

const professions: Profession[] = [
  "Medical Doctor",
  "Radiographer",
  "Nurse",
  "Anatomist",
  "Pharmacist",
  "Physiotherapist",
  "Dentist",
  "Other",
];

const icons: Record<Profession, string> = {
  "Medical Doctor": "🩺",
  "Radiographer": "🔬",
  "Nurse": "💉",
  "Anatomist": "🧬",
  "Pharmacist": "💊",
  "Physiotherapist": "🏃",
  "Dentist": "🦷",
  "Other": "📚",
};

interface Props {
  onComplete: () => void;
}

export default function OnboardingModal({ onComplete }: Props) {
  const [selected, setSelected] = useState<Profession | null>(null);
  const [name, setName] = useState("");

  function handleContinue() {
    if (!selected) return;
    savePrefs({ profession: selected, name: name.trim() || undefined });
    onComplete();
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:100, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", background:"rgba(15,30,45,0.6)", backdropFilter:"blur(8px)" }}>
      <div style={{ background:"var(--surface)", borderRadius:"var(--radius)", padding:"32px 24px", width:"100%", maxWidth:"480px", boxShadow:"var(--shadow-md)" }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:"24px" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"16px", background:"var(--gradient)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", margin:"0 auto 14px" }}>🎓</div>
          <h2 style={{ fontFamily:"var(--font-display)", fontWeight:800, fontSize:"22px", color:"var(--text)", marginBottom:"6px" }}>Welcome to MedStudent</h2>
          <p style={{ fontSize:"13.5px", color:"var(--text-muted)", fontFamily:"var(--font-body)" }}>Tell us about yourself so we can personalise your experience.</p>
        </div>

        {/* Name input */}
        <div style={{ marginBottom:"20px" }}>
          <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"8px" }}>Your name (optional)</label>
          <input
            type="text"
            placeholder="e.g. Ifuk"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width:"100%", padding:"11px 14px", borderRadius:"var(--radius-sm)", border:"1px solid var(--border)", background:"var(--surface-2)", fontFamily:"var(--font-body)", fontSize:"14px", color:"var(--text)", outline:"none" }}
          />
        </div>

        {/* Profession grid */}
        <div style={{ marginBottom:"24px" }}>
          <label style={{ display:"block", fontFamily:"var(--font-display)", fontWeight:600, fontSize:"13px", color:"var(--text)", marginBottom:"10px" }}>I am a...</label>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {professions.map((p) => {
              const isSelected = selected === p;
              return (
                <button
                  key={p}
                  onClick={() => setSelected(p)}
                  style={{ display:"flex", alignItems:"center", gap:"10px", padding:"12px 14px", borderRadius:"var(--radius-sm)", border:`2px solid ${isSelected ? "var(--blue)" : "var(--border)"}`, background: isSelected ? "var(--gradient-soft)" : "var(--surface-2)", cursor:"pointer", textAlign:"left", transition:"all 0.15s ease" }}
                >
                  <span style={{ fontSize:"20px" }}>{icons[p]}</span>
                  <span style={{ fontFamily:"var(--font-display)", fontWeight: isSelected ? 700 : 500, fontSize:"13px", color: isSelected ? "var(--blue-dark)" : "var(--text)" }}>{p}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          disabled={!selected}
          style={{ width:"100%", padding:"14px", borderRadius:"var(--radius-sm)", border:"none", background: selected ? "var(--gradient)" : "var(--border)", color: selected ? "white" : "var(--text-light)", fontFamily:"var(--font-display)", fontWeight:700, fontSize:"15px", cursor: selected ? "pointer" : "not-allowed", boxShadow: selected ? "0 4px 14px rgba(45,135,200,0.3)" : "none", transition:"all 0.2s ease" }}
        >
          Get Started →
        </button>
      </div>
    </div>
  );
}