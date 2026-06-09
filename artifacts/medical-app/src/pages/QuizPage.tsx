import { useState } from "react";
import AppShell from "@/components/AppShell";
import { BrainCircuit, RotateCcw, ChevronRight, CheckCircle, XCircle, Trophy } from "lucide-react";

interface Question {
  id: number;
  subject: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const allQuestions: Question[] = [
  { id: 1, subject: "Anatomy", question: "Which nerve is most commonly injured in a mid-shaft humeral fracture?", options: ["Ulnar nerve", "Median nerve", "Radial nerve", "Musculocutaneous nerve"], correct: 2, explanation: "The radial nerve winds around the spiral groove of the humerus and is most vulnerable to injury in mid-shaft fractures. It results in wrist drop (loss of wrist extension)." },
  { id: 2, subject: "Anatomy", question: "What is the embryological origin of the suprarenal (adrenal) medulla?", options: ["Mesoderm", "Ectoderm", "Neural crest cells", "Endoderm"], correct: 2, explanation: "The adrenal medulla is derived from neural crest cells (neuroectoderm), which migrate and differentiate into chromaffin cells. The adrenal cortex is mesodermal." },
  { id: 3, subject: "Anatomy", question: "Which structure passes through the foramen ovale of the skull?", options: ["CN V1 (ophthalmic)", "CN V2 (maxillary)", "CN V3 (mandibular)", "CN VI (abducens)"], correct: 2, explanation: "CN V3 (mandibular nerve) passes through the foramen ovale. V1 passes through the superior orbital fissure; V2 passes through the foramen rotundum." },
  { id: 4, subject: "Physiology", question: "Which of the following increases during exercise?", options: ["Total peripheral resistance", "Stroke volume", "Vagal tone", "Diastolic filling time"], correct: 1, explanation: "Stroke volume increases during exercise due to increased preload (Starling effect) and sympathetic stimulation increasing contractility. TPR decreases to muscles, vagal tone decreases, HR increases reducing diastolic filling time." },
  { id: 5, subject: "Physiology", question: "What is the primary buffer system in blood?", options: ["Phosphate buffer system", "Protein buffer system", "Bicarbonate buffer system", "Haemoglobin buffer system"], correct: 2, explanation: "The bicarbonate buffer system (CO₂/HCO₃⁻) is the most important extracellular buffer in blood and is regulated by both the lungs (CO₂) and kidneys (HCO₃⁻). It accounts for ~70% of blood buffering." },
  { id: 6, subject: "Physiology", question: "Which hormone stimulates gluconeogenesis and glycogenolysis in the liver?", options: ["Insulin", "Glucagon", "Aldosterone", "ADH"], correct: 1, explanation: "Glucagon (from α-cells of pancreas) is released during fasting and stimulates gluconeogenesis and glycogenolysis in the liver, raising blood glucose. It acts via cAMP." },
  { id: 7, subject: "Biochemistry", question: "Deficiency of which vitamin causes Wernicke's encephalopathy?", options: ["Vitamin B12", "Vitamin B6", "Vitamin B1 (Thiamine)", "Vitamin B3 (Niacin)"], correct: 2, explanation: "Thiamine (Vitamin B1) deficiency causes Wernicke's encephalopathy (confusion, ataxia, ophthalmoplegia). Common in alcoholics. Thiamine is a cofactor for pyruvate dehydrogenase and α-ketoglutarate dehydrogenase." },
  { id: 8, subject: "Biochemistry", question: "Which lipoprotein has the highest triglyceride content?", options: ["HDL", "LDL", "IDL", "Chylomicrons"], correct: 3, explanation: "Chylomicrons have the highest triglyceride content (~85–90%). They transport dietary lipids from the intestine to peripheral tissues. VLDL is next at ~50% triglycerides." },
  { id: 9, subject: "Pharmacology", question: "A patient develops 'red man syndrome' during antibiotic infusion. Which antibiotic is responsible?", options: ["Gentamicin", "Vancomycin", "Metronidazole", "Ciprofloxacin"], correct: 1, explanation: "Red man syndrome (flushing, erythema, hypotension) is caused by rapid infusion of Vancomycin, causing direct mast cell degranulation and histamine release. It is not a true allergy. Treat by slowing infusion rate." },
  { id: 10, subject: "Pharmacology", question: "Which anti-malarial drug is contraindicated in G6PD deficiency?", options: ["Artemether", "Quinine", "Primaquine", "Lumefantrine"], correct: 2, explanation: "Primaquine causes oxidative haemolysis in G6PD-deficient patients. It is the only drug active against the dormant hypnozoite stage of P. vivax and P. ovale." },
  { id: 11, subject: "Pathology", question: "Which type of hypersensitivity reaction is responsible for anaphylaxis?", options: ["Type I (IgE-mediated)", "Type II (Cytotoxic)", "Type III (Immune complex)", "Type IV (Cell-mediated)"], correct: 0, explanation: "Type I hypersensitivity is IgE-mediated. Re-exposure to antigen causes cross-linking of IgE on mast cells → degranulation → histamine, leukotrienes release → anaphylaxis." },
  { id: 12, subject: "Pathology", question: "What is the hallmark histological feature of Alzheimer's disease?", options: ["Lewy bodies", "Neurofibrillary tangles and amyloid plaques", "Pick bodies", "Cowdry A inclusions"], correct: 1, explanation: "Alzheimer's disease is characterised by neurofibrillary tangles (tau protein) and senile/neuritic plaques (amyloid β/Aβ42). Loss of cholinergic neurons in the nucleus basalis of Meynert." },
  { id: 13, subject: "Microbiology", question: "Which organism causes the 'rice-water stool' characteristic of cholera?", options: ["Shigella dysenteriae", "Salmonella typhi", "Vibrio cholerae", "Clostridium difficile"], correct: 2, explanation: "Vibrio cholerae produces cholera toxin, which permanently activates adenylyl cyclase → massive Cl⁻ and water secretion into the gut → profuse, painless watery 'rice-water' stools." },
  { id: 14, subject: "Microbiology", question: "What is the confirmatory test for HIV infection?", options: ["ELISA (screening)", "Western blot", "p24 antigen test", "CD4 count"], correct: 1, explanation: "Western blot is the confirmatory test for HIV after a positive ELISA screening test. It detects antibodies to specific viral proteins. PCR is used for diagnosis in neonates and viral load monitoring." },
  { id: 15, subject: "Anatomy", question: "The appendix is most commonly found in which position?", options: ["Pelvic", "Retrocaecal", "Pre-ileal", "Post-ileal"], correct: 1, explanation: "The most common position of the appendix is retrocaecal (~74%), found behind the caecum. This explains why retrocaecal appendicitis may present with right flank pain rather than typical right iliac fossa pain." },
];

const subjects = ["All", ...Array.from(new Set(allQuestions.map(q => q.subject)))];

export default function QuizPage() {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const deck = allQuestions.filter(q => selectedSubject === "All" || q.subject === selectedSubject);
  const q = deck[current];

  function start() {
    setCurrent(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); setStarted(true);
  }

  function choose(i: number) {
    if (answered) return;
    setSelected(i);
    setAnswered(true);
    if (i === q.correct) setScore(s => s + 1);
  }

  function next() {
    if (current + 1 >= deck.length) { setFinished(true); return; }
    setCurrent(c => c + 1); setSelected(null); setAnswered(false);
  }

  function optionStyle(i: number) {
    const base: React.CSSProperties = { padding: "14px 18px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", textAlign: "left", cursor: answered ? "default" : "pointer", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", lineHeight: 1.5, width: "100%", transition: "all 0.2s ease" };
    if (!answered) return { ...base, ...(selected === i ? { borderColor: "var(--blue)", background: "#EBF5FF" } : {}) };
    if (i === q.correct) return { ...base, borderColor: "var(--green)", background: "#EDFFF5", color: "var(--green-dark)", fontWeight: 600 };
    if (i === selected && i !== q.correct) return { ...base, borderColor: "#E8445A", background: "#FFF0F2", color: "#E8445A" };
    return { ...base, opacity: 0.5 };
  }

  if (!started) {
    return (
      <AppShell>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <div style={{ marginBottom: "24px" }}>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              <BrainCircuit size={22} color="var(--green)" /> Quiz Mode
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Test your medical knowledge with MCQs.</p>
          </div>
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "10px" }}>Select subject</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {subjects.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)} style={{ padding: "7px 16px", borderRadius: "99px", border: `1.5px solid ${selectedSubject === s ? "var(--green)" : "var(--border)"}`, background: selectedSubject === s ? "var(--green)" : "var(--surface)", color: selectedSubject === s ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "24px", marginBottom: "20px", boxShadow: "var(--shadow)" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)", marginBottom: "6px" }}>Ready to begin?</p>
            <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "16px" }}>{deck.length} questions — {selectedSubject === "All" ? "all subjects" : selectedSubject}. Read each question, pick one answer, then see the explanation.</p>
            <button onClick={start} style={{ padding: "12px 28px", borderRadius: "99px", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              Start Quiz →
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (finished) {
    const pct = Math.round((score / deck.length) * 100);
    const grade = pct >= 80 ? { label: "Excellent!", color: "var(--green)", emoji: "🏆" } : pct >= 60 ? { label: "Good effort!", color: "var(--blue)", emoji: "👍" } : { label: "Keep studying!", color: "#F5A623", emoji: "📚" };
    return (
      <AppShell>
        <div style={{ maxWidth: "520px", margin: "0 auto", textAlign: "center", padding: "40px 0" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>{grade.emoji}</div>
          <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "24px", color: "var(--text)", marginBottom: "8px" }}>Quiz Complete!</h2>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: grade.color, marginBottom: "20px" }}>{grade.label}</p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", marginBottom: "28px" }}>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "20px 28px", boxShadow: "var(--shadow)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "32px", color: "var(--text)" }}>{score}/{deck.length}</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Score</p>
            </div>
            <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "20px 28px", boxShadow: "var(--shadow)" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "32px", color: grade.color }}>{pct}%</p>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Percentage</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
            <button onClick={start} style={{ padding: "11px 24px", borderRadius: "99px", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <RotateCcw size={15} /> Retry
            </button>
            <button onClick={() => setStarted(false)} style={{ padding: "11px 24px", borderRadius: "99px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", cursor: "pointer" }}>
              Change Subject
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: "640px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <BrainCircuit size={20} color="var(--green)" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>Question {current + 1} of {deck.length}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Trophy size={15} color="#F5A623" />
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)" }}>{score} pts</span>
          </div>
        </div>
        {/* Progress */}
        <div style={{ height: "5px", borderRadius: "99px", background: "var(--border)", marginBottom: "24px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${((current) / deck.length) * 100}%`, background: "var(--gradient)", borderRadius: "99px", transition: "width 0.3s ease" }} />
        </div>
        {/* Question card */}
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", padding: "24px", boxShadow: "var(--shadow)", marginBottom: "16px" }}>
          <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: "var(--gradient-soft)", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600, display: "inline-block", marginBottom: "14px" }}>{q.subject}</span>
          <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "16px", color: "var(--text)", lineHeight: 1.5 }}>{q.question}</p>
        </div>
        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => choose(i)} style={optionStyle(i)}>
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 600, marginRight: "10px", color: "inherit" }}>{String.fromCharCode(65 + i)}.</span>{opt}
            </button>
          ))}
        </div>
        {/* Explanation */}
        {answered && (
          <div style={{ background: selected === q.correct ? "#EDFFF5" : "#FFF8EC", border: `1px solid ${selected === q.correct ? "var(--green)" : "#F5A623"}`, borderRadius: "var(--radius-sm)", padding: "16px 18px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              {selected === q.correct ? <CheckCircle size={16} color="var(--green)" /> : <XCircle size={16} color="#E8445A" />}
              <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13.5px", color: selected === q.correct ? "var(--green-dark)" : "#E8445A" }}>{selected === q.correct ? "Correct!" : "Incorrect"}</span>
            </div>
            <p style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.6 }}>{q.explanation}</p>
          </div>
        )}
        {answered && (
          <button onClick={next} style={{ width: "100%", padding: "13px", borderRadius: "var(--radius-sm)", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            {current + 1 >= deck.length ? "See Results 🏆" : <>Next <ChevronRight size={18} /></>}
          </button>
        )}
      </div>
    </AppShell>
  );
}
