import { useState } from "react";
import AppShell from "@/components/AppShell";
import { ClipboardList, Search, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";

interface PQ {
  id: number;
  year: string;
  subject: string;
  institution: string;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: PQ[] = [
  { id: 1, year: "2023", subject: "Anatomy", institution: "UNILAG", question: "The posterior boundary of the axilla is formed by:", options: ["Pectoralis major", "Subscapularis, teres major, latissimus dorsi", "Coracobrachialis and biceps brachii", "Serratus anterior and ribs 1–4"], correct: 1, explanation: "The posterior wall of the axilla is formed by subscapularis (anterior surface of scapula), teres major, and latissimus dorsi. The anterior wall is pectoralis major and minor." },
  { id: 2, year: "2023", subject: "Anatomy", institution: "UI Ibadan", question: "Which of the following passes through the greater sciatic foramen below the piriformis?", options: ["Superior gluteal nerve and artery", "Pudendal nerve", "Nerve to obturator internus", "All of the above except the superior gluteal"], correct: 3, explanation: "Superior gluteal nerve/artery passes ABOVE piriformis. Everything else passes below: inferior gluteal nerve/artery, sciatic nerve, posterior femoral cutaneous nerve, pudendal nerve, nerve to obturator internus, nerve to quadratus femoris." },
  { id: 3, year: "2022", subject: "Physiology", institution: "UNILAG", question: "A patient has a PaO₂ of 55mmHg, PaCO₂ of 50mmHg, and pH of 7.30. The most likely diagnosis is:", options: ["Metabolic acidosis", "Respiratory alkalosis", "Respiratory acidosis", "Mixed metabolic and respiratory acidosis"], correct: 2, explanation: "Respiratory acidosis: low pH, elevated PaCO₂. The high CO₂ (hypoventilation) is driving the acidosis. PaO₂ is low consistent with hypoventilation. The kidneys will compensate (elevated HCO₃⁻) in chronic respiratory acidosis." },
  { id: 4, year: "2022", subject: "Physiology", institution: "ABUTH Zaria", question: "Which of the following correctly describes the renal handling of glucose?", options: ["Glucose is secreted by the PCT", "Glucose is fully reabsorbed under normal blood glucose levels", "Glucose begins to appear in urine when plasma levels exceed 300 mg/dL", "Glucose reabsorption in the PCT is passive"], correct: 1, explanation: "Under normal conditions, all filtered glucose (100%) is reabsorbed in the PCT via SGLT2 (and SGLT1) cotransporters. The renal threshold is ~180 mg/dL (10 mmol/L) — above this, glucose appears in urine (glycosuria)." },
  { id: 5, year: "2023", subject: "Biochemistry", institution: "UCH Ibadan", question: "Sickle cell disease results from a point mutation in which amino acid position of the beta-globin chain?", options: ["Position 1 — Valine to Glutamate", "Position 6 — Glutamate to Valine", "Position 6 — Valine to Glutamate", "Position 11 — Glutamate to Lysine"], correct: 1, explanation: "In sickle cell disease (HbS), position 6 of the beta-globin chain has a substitution of glutamate (hydrophilic) to valine (hydrophobic). This causes HbS polymerisation under deoxygenated conditions, leading to sickling. HbC has glutamate → lysine at position 6." },
  { id: 6, year: "2022", subject: "Biochemistry", institution: "UNILAG", question: "Von Gierke disease (Type I glycogen storage disease) is due to deficiency of:", options: ["Glycogen phosphorylase", "Glucose-6-phosphatase", "Debranching enzyme", "Glycogen synthase"], correct: 1, explanation: "Von Gierke disease: deficiency of glucose-6-phosphatase. This enzyme is needed for the final step of glycogenolysis and gluconeogenesis (releasing free glucose into blood). Results in severe fasting hypoglycaemia, hepatomegaly, lactic acidosis, and hyperuricaemia." },
  { id: 7, year: "2023", subject: "Pharmacology", institution: "LUTH", question: "A 28-year-old pregnant woman (gestational age 34 weeks) has severe malaria. Which treatment is most appropriate?", options: ["Chloroquine alone", "Artemether-lumefantrine (oral)", "IV Artesunate", "Quinine IV"], correct: 2, explanation: "IV Artesunate is the drug of choice for severe malaria in all patients including pregnant women (all trimesters). Artemisinin-based therapies (ACTs) are now considered safe in all trimesters. WHO 2023 guidelines recommend artesunate over quinine due to better outcomes and fewer adverse effects." },
  { id: 8, year: "2022", subject: "Pharmacology", institution: "ABUTH Zaria", question: "Which of the following antihypertensives is absolutely contraindicated in bilateral renal artery stenosis?", options: ["Amlodipine", "Hydrochlorothiazide", "Enalapril (ACE inhibitor)", "Metoprolol"], correct: 2, explanation: "ACE inhibitors are contraindicated in bilateral renal artery stenosis. The stenosis makes kidney perfusion dependent on angiotensin II–mediated efferent arteriolar constriction. Blocking angiotensin II causes efferent dilation → reduced GFR → acute kidney injury." },
  { id: 9, year: "2023", subject: "Pathology", institution: "UI Ibadan", question: "In a patient with TB, biopsy shows granulomas with central caseous necrosis. The giant cells most likely present are:", options: ["Langhans giant cells", "Foreign body giant cells", "Touton giant cells", "Reed-Sternberg cells"], correct: 0, explanation: "Langhans giant cells are characteristic of TB granulomas — nuclei arranged in a horseshoe or peripheral ring pattern. Foreign body giant cells have randomly scattered nuclei. Touton cells are seen in fat necrosis (nuclei encircle lipid). Reed-Sternberg cells are in Hodgkin lymphoma." },
  { id: 10, year: "2022", subject: "Pathology", institution: "UNILAG", question: "Which of the following is an example of Type IV (cell-mediated) hypersensitivity?", options: ["Anaphylaxis to bee sting", "Transfusion reactions", "Systemic lupus erythematosus", "Contact dermatitis to nickel"], correct: 3, explanation: "Contact dermatitis (e.g., to nickel, latex, poison ivy) is a classic Type IV (delayed-type) hypersensitivity reaction. Mediated by sensitised T cells (CD4+ Th1 and CD8+ CTLs), not antibodies. Reaction takes 48–72 hours to develop after re-exposure." },
  { id: 11, year: "2023", subject: "Microbiology", institution: "UCH Ibadan", question: "Which hepatitis virus is transmitted via the faecal-oral route and has NO chronic carrier state?", options: ["Hepatitis B", "Hepatitis C", "Hepatitis A", "Hepatitis D"], correct: 2, explanation: "Hepatitis A virus (HAV) is transmitted faecal-orally and NEVER causes chronic infection — complete recovery in >99% of cases. Acute infection only. Compare: HBV, HCV, HDV — can all become chronic. HAV and HEV are faecal-oral; HBV, HCV, HDV are bloodborne/sexual." },
  { id: 12, year: "2022", subject: "Microbiology", institution: "LUTH", question: "Which of the following is the causative organism of Lassa fever, an endemic disease in Nigeria?", options: ["Ebola virus (Filoviridae)", "Lassa virus (Arenaviridae)", "Marburg virus (Filoviridae)", "Hantavirus (Bunyaviridae)"], correct: 1, explanation: "Lassa fever is caused by Lassa virus, an Arenavirus (enveloped, bisegmented RNA virus). Reservoir: Mastomys natalensis (multimammate rat). Endemic in West Africa, especially Nigeria, Sierra Leone, Liberia, Guinea. Transmitted via contact with rodent excreta or person-to-person through bodily fluids." },
  { id: 13, year: "2023", subject: "Anatomy", institution: "UNTH Enugu", question: "Which of the following correctly describes the fetal circulation?", options: ["The ductus arteriosus connects the pulmonary artery to the aorta", "The foramen ovale allows blood to pass from right to left atrium", "The ductus venosus connects the portal vein to the inferior vena cava", "All of the above are correct"], correct: 3, explanation: "All three are correct: (1) Ductus arteriosus: pulmonary trunk → descending aorta (bypasses lungs). (2) Foramen ovale: RA → LA (bypasses right ventricle and lungs). (3) Ductus venosus: umbilical vein → IVC (bypasses liver). All close after birth due to increased O₂ and decreased prostaglandins." },
  { id: 14, year: "2022", subject: "Physiology", institution: "UNILAG", question: "The primary site of iron absorption in the gastrointestinal tract is:", options: ["Stomach", "Duodenum and proximal jejunum", "Distal jejunum", "Ileum"], correct: 1, explanation: "Iron is absorbed primarily in the duodenum and proximal jejunum via DMT-1 (divalent metal transporter). Ferrous iron (Fe²⁺) is better absorbed — vitamin C helps maintain Fe in the Fe²⁺ state. Hepcidin (liver) is the master regulator of iron absorption and export." },
  { id: 15, year: "2023", subject: "Pharmacology", institution: "UI Ibadan", question: "A patient taking rifampicin for TB develops reduced efficacy of her oral contraceptive pill. The mechanism is:", options: ["Rifampicin inhibits hepatic CYP3A4 enzymes", "Rifampicin induces hepatic CYP3A4 enzymes", "Rifampicin directly blocks oestrogen receptors", "Rifampicin increases renal clearance of oestrogen"], correct: 1, explanation: "Rifampicin is a potent inducer of CYP3A4 (and other CYP enzymes, P-glycoprotein). This dramatically increases metabolism of oestrogen and progesterone in oral contraceptives → reduced plasma levels → contraceptive failure. Women on rifampicin should use additional contraception." },
];

const subjects = ["All", ...Array.from(new Set(questions.map(q => q.subject)))];
const years = ["All", ...Array.from(new Set(questions.map(q => q.year))).sort().reverse()];

export default function PastQuestionsPage() {
  const [subject, setSubject] = useState("All");
  const [year, setYear] = useState("All");
  const [search, setSearch] = useState("");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<Record<number, number>>({});

  const filtered = questions.filter(q =>
    (subject === "All" || q.subject === subject) &&
    (year === "All" || q.year === year) &&
    (search === "" || q.question.toLowerCase().includes(search.toLowerCase()))
  );

  function toggleReveal(id: number) {
    setRevealed(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function choose(qId: number, optIdx: number) {
    if (selected[qId] !== undefined) return;
    setSelected(prev => ({ ...prev, [qId]: optIdx }));
    setRevealed(prev => { const n = new Set(prev); n.add(qId); return n; });
  }

  const correct = questions.filter(q => selected[q.id] === q.correct).length;
  const attempted = Object.keys(selected).length;

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <ClipboardList size={22} color="#9B6DFF" /> Past Questions
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Practice with questions from Nigerian medical schools.</p>
        </div>

        {/* Stats bar */}
        {attempted > 0 && (
          <div style={{ display: "flex", gap: "12px", marginBottom: "18px" }}>
            <div style={{ background: "#EDFFF5", border: "1px solid var(--green)", borderRadius: "var(--radius-sm)", padding: "10px 16px", flex: 1, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--green-dark)" }}>{correct}</p>
              <p style={{ fontSize: "11px", color: "var(--green-dark)" }}>Correct</p>
            </div>
            <div style={{ background: "#FFF0F2", border: "1px solid #E8445A", borderRadius: "var(--radius-sm)", padding: "10px 16px", flex: 1, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "#E8445A" }}>{attempted - correct}</p>
              <p style={{ fontSize: "11px", color: "#E8445A" }}>Incorrect</p>
            </div>
            <div style={{ background: "var(--gradient-soft)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", padding: "10px 16px", flex: 1, textAlign: "center" }}>
              <p style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "18px", color: "var(--blue)" }}>{Math.round((correct / attempted) * 100)}%</p>
              <p style={{ fontSize: "11px", color: "var(--blue)" }}>Score</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: "flex", gap: "10px", marginBottom: "14px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: "1 1 200px" }}>
            <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search questions..." style={{ width: "100%", padding: "9px 12px 9px 36px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "13px", color: "var(--text)", outline: "none" }} />
          </div>
          <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: "9px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "13px", color: "var(--text)", outline: "none", cursor: "pointer" }}>
            {years.map(y => <option key={y} value={y}>{y === "All" ? "All Years" : y}</option>)}
          </select>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "20px" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)} style={{ padding: "7px 16px", borderRadius: "99px", border: `1.5px solid ${subject === s ? "#9B6DFF" : "var(--border)"}`, background: subject === s ? "#9B6DFF" : "var(--surface)", color: subject === s ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s}
            </button>
          ))}
        </div>

        <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>{filtered.length} question{filtered.length !== 1 ? "s" : ""}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {filtered.map((q, idx) => {
            const isRevealed = revealed.has(q.id);
            const chosenOpt = selected[q.id];
            const wasAnswered = chosenOpt !== undefined;
            return (
              <div key={q.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: `1.5px solid ${wasAnswered ? (chosenOpt === q.correct ? "var(--green)" : "#E8445A") : "var(--border)"}`, boxShadow: "var(--shadow)", overflow: "hidden" }}>
                {/* Header */}
                <div style={{ padding: "16px 18px 12px", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: "#F5F0FF", color: "#9B6DFF", fontFamily: "var(--font-display)", fontWeight: 600 }}>{q.subject}</span>
                    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: "var(--surface-2)", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{q.year}</span>
                    <span style={{ fontSize: "11px", color: "var(--text-light)", fontFamily: "var(--font-body)" }}>{q.institution}</span>
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14.5px", color: "var(--text)", lineHeight: 1.5 }}>
                    <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Q{idx + 1}. </span>{q.question}
                  </p>
                </div>
                {/* Options */}
                <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {q.options.map((opt, i) => {
                    let bg = "var(--surface-2)";
                    let border = "1.5px solid transparent";
                    let color = "var(--text)";
                    if (wasAnswered) {
                      if (i === q.correct) { bg = "#EDFFF5"; border = "1.5px solid var(--green)"; color = "var(--green-dark)"; }
                      else if (i === chosenOpt) { bg = "#FFF0F2"; border = "1.5px solid #E8445A"; color = "#E8445A"; }
                      else { bg = "transparent"; color = "var(--text-light)"; }
                    }
                    return (
                      <button key={i} onClick={() => choose(q.id, i)} style={{ display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-sm)", background: bg, border, textAlign: "left", cursor: wasAnswered ? "default" : "pointer", width: "100%", transition: "all 0.2s ease" }}>
                        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", color: "inherit", flexShrink: 0, marginTop: "1px" }}>{String.fromCharCode(65 + i)}.</span>
                        <span style={{ fontSize: "13.5px", fontFamily: "var(--font-body)", color, lineHeight: 1.5 }}>{opt}</span>
                        {wasAnswered && i === q.correct && <CheckCircle size={15} color="var(--green)" style={{ marginLeft: "auto", flexShrink: 0, marginTop: "2px" }} />}
                        {wasAnswered && i === chosenOpt && i !== q.correct && <XCircle size={15} color="#E8445A" style={{ marginLeft: "auto", flexShrink: 0, marginTop: "2px" }} />}
                      </button>
                    );
                  })}
                </div>
                {/* Explanation toggle */}
                <div style={{ padding: "0 18px 14px" }}>
                  {wasAnswered && (
                    <button onClick={() => toggleReveal(q.id)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer" }}>
                      {isRevealed ? <><ChevronUp size={14} /> Hide Explanation</> : <><ChevronDown size={14} /> Show Explanation</>}
                    </button>
                  )}
                  {isRevealed && (
                    <div style={{ marginTop: "10px", padding: "14px 16px", background: "var(--gradient-soft)", borderRadius: "var(--radius-sm)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "12px", fontFamily: "var(--font-display)", fontWeight: 700, color: "var(--blue)", marginBottom: "6px" }}>Explanation</p>
                      <p style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.7 }}>{q.explanation}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
