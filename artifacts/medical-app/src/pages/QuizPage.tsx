import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";

export default function QuizPage() {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const question = {
    text: "A 4-year-old child presents with sudden high fever, joint swelling, and a strawberry tongue. What is the most likely diagnostic approach parameter?",
    options: [
      "Immediate administration of intravenous immunoglobulin (IVIG) for Kawasaki Disease.",
      "Treatment with high-dose penicillin for Rheumatic Fever.",
      "Prescription of oral paracetamol and observation for regular roseola virus.",
      "None of the above parameters apply."
    ],
    correctIdx: 0,
    rationale: "Kawasaki Disease is characterized by strawberry tongue, fever, conjunctivitis, and joint swelling. IVIG is paramount to reduce coronary artery aneurysm risk parameters."
  };

  const handleChoice = (idx: number) => {
    if (!submitted) setSelectedAnswer(idx);
  };

  const evalAnswer = () => {
    if (selectedAnswer !== null) setSubmitted(true);
  };

  const resetQuiz = () => {
    setSelectedAnswer(null);
    setSubmitted(false);
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      <div style={{ marginBottom: "20px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
          <ArrowLeft size={16} /> Returns to Core Console
        </Link>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px", padding: "28px" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>CLINICAL REVISION</span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 0" }}>
              Diagnostic MCQ Drills
            </h1>
          </div>
          <Sparkles color="#0D9488" size={24} />
        </div>

        {/* QUESTION TEXT */}
        <p style={{ fontSize: "16px", fontWeight: 750, lineHeight: 1.5, marginBottom: "24px" }}>
          {question.text}
        </p>

        {/* CHOICES */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
          {question.options.map((opt, idx) => {
            let choiceBorder = "1px solid var(--border)";
            let choiceBg = "var(--surface)";

            if (selectedAnswer === idx) {
              choiceBorder = "2px solid #0D9488";
              choiceBg = "rgba(13,148,136,0.03)";
            }

            if (submitted) {
              if (idx === question.correctIdx) {
                choiceBorder = "2px solid #10B981";
                choiceBg = "rgba(16,185,129,0.06)";
              } else if (selectedAnswer === idx) {
                choiceBorder = "2px solid #EF4444";
                choiceBg = "rgba(239,68,68,0.06)";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleChoice(idx)}
                disabled={submitted}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "16px",
                  borderRadius: "12px",
                  border: choiceBorder,
                  background: choiceBg,
                  fontFamily: "var(--font-body)",
                  fontSize: "14px",
                  cursor: submitted ? "not-allowed" : "pointer"
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* ACTIONS */}
        {!submitted ? (
          <button
            onClick={evalAnswer}
            disabled={selectedAnswer === null}
            style={{
              background: "#0D9488",
              color: "white",
              border: "none",
              width: "100%",
              padding: "13px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "14.5px",
              cursor: selectedAnswer === null ? "not-allowed" : "pointer"
            }}
          >
            Submit Solution Check
          </button>
        ) : (
          <div>
            <div style={{ background: "var(--surface-muted)", border: "1px solid var(--border)", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", color: selectedAnswer === question.correctIdx ? "#10B981" : "#EF4444", marginBottom: "6px" }}>
                {selectedAnswer === question.correctIdx ? "✓ Correct Answer!" : "✗ Question Mismatch"}
              </strong>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.4 }}>
                {question.rationale}
              </p>
            </div>

            <button
              onClick={resetQuiz}
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                color: "var(--text)",
                width: "100%",
                padding: "13px",
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "14.5px",
                cursor: "pointer"
              }}
            >
              Next Practice Question
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
