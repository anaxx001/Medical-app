import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { RotateCcw, ChevronLeft, ChevronRight, Check, X, BookOpen, Sparkles, Loader2, AlertCircle } from "lucide-react";

interface Card {
  id: number;
  subject: string;
  front: string;
  back: string;
}

const builtInCards: Card[] = [
  { id: 1, subject: "Anatomy", front: "What are the roots of the brachial plexus?", back: "Roots C5, C6, C7, C8 and T1. Mnemonic: 'Rugby Teams Drink Cold Beer' — Roots, Trunks, Divisions, Cords, Branches." },
  { id: 2, subject: "Anatomy", front: "Name the branches of the facial nerve (CN VII)", back: "Two Zebras Bit My Cat: Temporal, Zygomatic, Buccal, Marginal mandibular, Cervical." },
  { id: 3, subject: "Anatomy", front: "What is the blood supply of the femoral head in adults?", back: "Primarily the medial femoral circumflex artery (branch of profunda femoris). Fractures can disrupt this, causing avascular necrosis." },
  { id: 4, subject: "Anatomy", front: "What structures pass through the carpal tunnel?", back: "4 FDS, 4 FDP, 1 FPL tendons + median nerve (9 tendons + 1 nerve). Note: ulnar nerve does NOT pass through." },
  { id: 5, subject: "Anatomy", front: "Name the rotator cuff muscles", back: "SITS: Supraspinatus, Infraspinatus, Teres minor, Subscapularis. Supraspinatus initiates abduction (0–15°), deltoid continues it." },
  { id: 6, subject: "Anatomy", front: "Where does the great saphenous vein drain?", back: "The femoral vein at the saphenofemoral junction, ~4 cm below and lateral to the pubic tubercle." },
  { id: 7, subject: "Anatomy", front: "What is the Triangle of Petit?", back: "A lumbar triangle bounded by: iliac crest (below), external oblique (anteriorly), latissimus dorsi (posteriorly). Site of lumbar hernias." },
  { id: 8, subject: "Physiology", front: "What is the normal resting membrane potential of a neuron?", back: "–70 mV. Maintained by the Na⁺/K⁺ ATPase pump (3 Na⁺ out, 2 K⁺ in) and selective K⁺ leak channels." },
  { id: 9, subject: "Physiology", front: "What happens during the absolute refractory period?", back: "No action potential can be generated regardless of stimulus strength. Na⁺ channels are inactivated. Lasts ~1 ms." },
  { id: 10, subject: "Physiology", front: "What is the Frank-Starling Law?", back: "Force of cardiac contraction is proportional to initial length of cardiac muscle fibres (preload). Greater ventricular filling → greater stroke volume." },
  { id: 11, subject: "Physiology", front: "How does ADH work on the kidney?", back: "ADH binds V2 receptors in collecting duct → cAMP → inserts aquaporin-2 (AQP2) channels → increases water reabsorption." },
  { id: 12, subject: "Physiology", front: "What causes a right shift of the O₂-Hb dissociation curve?", back: "Bohr effect: ↓pH, ↑CO₂, ↑2,3-DPG, ↑temperature → ↓O₂ affinity → more O₂ released to tissues." },
  { id: 13, subject: "Biochemistry", front: "What are the key products of glycolysis?", back: "1 glucose → 2 pyruvate + 2 ATP (net) + 2 NADH. Occurs in cytoplasm. Anaerobic: pyruvate → lactate (by LDH)." },
  { id: 14, subject: "Biochemistry", front: "What is the rate-limiting step of the TCA cycle?", back: "Isocitrate dehydrogenase (isocitrate → α-ketoglutarate). Inhibited by high ATP/NADH; activated by ADP/NAD⁺." },
  { id: 15, subject: "Biochemistry", front: "What enzyme converts phenylalanine to tyrosine?", back: "Phenylalanine hydroxylase. Deficiency = PKU. Requires tetrahydrobiopterin (BH4) as cofactor." },
  { id: 16, subject: "Biochemistry", front: "What is the function of HMG-CoA reductase?", back: "Rate-limiting enzyme in cholesterol synthesis: HMG-CoA → mevalonate. Inhibited by statins. Active at night — why statins are taken at bedtime." },
  { id: 17, subject: "Pharmacology", front: "Mechanism of action of beta-lactam antibiotics?", back: "Inhibit cell wall synthesis by binding penicillin-binding proteins (PBPs), preventing peptidoglycan cross-linking. Bactericidal." },
  { id: 18, subject: "Pharmacology", front: "Adverse effects of aminoglycosides", back: "Nephrotoxicity (ATN), ototoxicity (cochlear and vestibular), neuromuscular blockade. Monitor trough levels." },
  { id: 19, subject: "Pharmacology", front: "First-line treatment for malaria in Nigeria?", back: "Uncomplicated: Artemether-Lumefantrine (Coartem). Severe malaria: IV Artesunate." },
  { id: 20, subject: "Pharmacology", front: "How do ACE inhibitors work?", back: "Block Angiotensin I → II conversion → ↓vasoconstriction + ↓aldosterone → ↓BP. Also block bradykinin degradation → dry cough." },
  { id: 21, subject: "Pathology", front: "Difference between necrosis and apoptosis?", back: "Necrosis: pathological, uncontrolled, causes inflammation, cell swelling then lysis. Apoptosis: programmed, no inflammation, cell shrinkage, apoptotic bodies." },
  { id: 22, subject: "Pathology", front: "Name the types of necrosis and their associations", back: "Coagulative (ischaemia), Liquefactive (brain/abscess), Caseous (TB), Fat (pancreatitis), Gangrenous, Fibrinoid (immune vasculitis)." },
  { id: 23, subject: "Pathology", front: "What is Virchow's Triad?", back: "Risk factors for thrombosis: 1) Stasis of blood flow, 2) Endothelial injury, 3) Hypercoagulability." },
  { id: 24, subject: "Microbiology", front: "How does M. tuberculosis evade the immune system?", back: "Survives inside macrophages by preventing phagosome-lysosome fusion (cord factor). Forms granulomas. Waxy mycolic acid cell wall resists killing." },
  { id: 25, subject: "Microbiology", front: "Gram-positive vs gram-negative cell walls?", back: "Gram+: thick peptidoglycan, teichoic acids, no outer membrane. Gram–: thin peptidoglycan, outer membrane with LPS (endotoxin), periplasmic space." },
  { id: 26, subject: "Microbiology", front: "What is the confirmatory test for HIV?", back: "Western blot — detects antibodies to specific viral proteins. ELISA is the screening test. PCR used for viral load and neonatal diagnosis." },
];

const BUILTIN_SUBJECTS = ["All", ...Array.from(new Set(builtInCards.map(c => c.subject)))];
const STORAGE_KEY = "medapp_flashcards_progress";

function loadProgress(): Record<number, "known" | "unknown"> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveProgress(p: Record<number, "known" | "unknown">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

type AICard = { front: string; back: string };

export default function FlashcardsPage() {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState<Record<number, "known" | "unknown">>(loadProgress);

  // AI generation state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiCards, setAiCards] = useState<AICard[]>([]);
  const [aiTopic_label, setAiTopicLabel] = useState("");
  const [aiIndex, setAiIndex] = useState(0);
  const [aiFlipped, setAiFlipped] = useState(false);
  const [viewingAI, setViewingAI] = useState(false);

  const deck = builtInCards.filter(c => selectedSubject === "All" || c.subject === selectedSubject);
  const card = deck[index];
  const known = deck.filter(c => progress[c.id] === "known").length;
  const pct = deck.length > 0 ? Math.round((known / deck.length) * 100) : 0;

  function go(dir: number) {
    setFlipped(false);
    setTimeout(() => setIndex(i => (i + dir + deck.length) % deck.length), 80);
  }

  function mark(val: "known" | "unknown") {
    const next = { ...progress, [card.id]: val };
    setProgress(next);
    saveProgress(next);
    if (index < deck.length - 1) go(1);
  }

  function reset() {
    const cleared = deck.reduce((acc, c) => { delete acc[c.id]; return acc; }, { ...progress });
    setProgress(cleared);
    saveProgress(cleared);
    setIndex(0);
    setFlipped(false);
  }

  useEffect(() => { setIndex(0); setFlipped(false); }, [selectedSubject]);

  async function handleGenerate() {
    if (!aiTopic.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError("");
    setAiCards([]);
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: aiTopic.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAiCards(data.cards);
      setAiTopicLabel(data.topic);
      setAiIndex(0);
      setAiFlipped(false);
      setViewingAI(true);
    } catch (err: any) {
      setAiError(err.message || "Generation failed. Please try again.");
    } finally {
      setAiLoading(false);
    }
  }

  function goAI(dir: number) {
    setAiFlipped(false);
    setTimeout(() => setAiIndex(i => (i + dir + aiCards.length) % aiCards.length), 80);
  }

  // ── AI Card Viewer ──────────────────────────────────────────────
  if (viewingAI && aiCards.length > 0) {
    const ac = aiCards[aiIndex];
    return (
      <AppShell>
        <div style={{ maxWidth: "680px", margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <Sparkles size={18} color="var(--blue)" />
                <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "20px", color: "var(--text)" }}>AI-Generated Deck</h1>
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Topic: <strong>{aiTopic_label}</strong></p>
            </div>
            <button onClick={() => setViewingAI(false)} style={{ padding: "8px 16px", borderRadius: "99px", border: "1.5px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer" }}>
              ← Back
            </button>
          </div>

          {/* AI progress */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{aiCards.length} cards generated</span>
              <span style={{ fontSize: "12px", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{aiIndex + 1} / {aiCards.length}</span>
            </div>
            <div style={{ height: "5px", borderRadius: "99px", background: "var(--border)", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((aiIndex + 1) / aiCards.length) * 100}%`, background: "var(--gradient)", borderRadius: "99px", transition: "width 0.3s ease" }} />
            </div>
          </div>

          {/* AI Card */}
          <div
            onClick={() => setAiFlipped(f => !f)}
            style={{ cursor: "pointer", borderRadius: "var(--radius)", background: "var(--surface)", border: "2px solid var(--border)", boxShadow: "var(--shadow-md)", padding: "40px 32px", minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", position: "relative", marginBottom: "20px", transition: "border-color 0.2s" }}
          >
            <div style={{ position: "absolute", top: "14px", left: "16px" }}>
              <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: "linear-gradient(135deg, #EBF5FF, #EDFFF5)", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                <Sparkles size={10} /> AI
              </span>
            </div>
            {!aiFlipped ? (
              <>
                <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px", color: "var(--text)", lineHeight: 1.5, maxWidth: "480px" }}>{ac.front}</p>
                <p style={{ fontSize: "11.5px", color: "var(--text-light)", marginTop: "20px", fontFamily: "var(--font-body)" }}>Tap to reveal answer</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "11px", color: "var(--text-light)", marginBottom: "12px", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Answer</p>
                <p style={{ fontFamily: "var(--font-body)", fontSize: "14.5px", color: "var(--text)", lineHeight: 1.7, maxWidth: "500px" }}>{ac.back}</p>
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "24px" }}>
            <button onClick={() => goAI(-1)} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={() => goAI(1)} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              <ChevronRight size={20} />
            </button>
          </div>

          <div style={{ textAlign: "center" }}>
            <button onClick={() => { setShowAIPanel(true); setViewingAI(false); setAiCards([]); setAiTopic(""); }} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "99px", border: "none", background: "var(--gradient)", color: "white", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}>
              <Sparkles size={13} /> Generate Another Deck
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Main Flashcards View ────────────────────────────────────────
  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
              <BookOpen size={22} color="var(--blue)" /> Flashcards
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Tap a card to reveal the answer. Mark what you know.</p>
          </div>
          <button
            onClick={() => setShowAIPanel(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "99px", border: "none", background: showAIPanel ? "var(--gradient)" : "linear-gradient(135deg, #EBF5FF, #EDFFF5)", color: showAIPanel ? "white" : "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer", flexShrink: 0, boxShadow: showAIPanel ? "var(--shadow)" : "none", transition: "all 0.2s ease" }}
          >
            <Sparkles size={14} /> Generate with AI
          </button>
        </div>

        {/* AI Generation Panel */}
        {showAIPanel && (
          <div style={{ background: "linear-gradient(135deg, rgba(45,135,200,0.06), rgba(61,190,122,0.05))", border: "1.5px solid var(--blue)", borderRadius: "var(--radius)", padding: "20px", marginBottom: "22px" }}>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "14px", color: "var(--text)", marginBottom: "6px", display: "flex", alignItems: "center", gap: "7px" }}>
              <Sparkles size={15} color="var(--blue)" /> Create a custom flashcard deck
            </p>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginBottom: "14px" }}>Type any medical topic and MedAI will generate 6 flashcards for you instantly.</p>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexWrap: "wrap" }}>
              <input
                value={aiTopic}
                onChange={e => { setAiTopic(e.target.value); setAiError(""); }}
                onKeyDown={e => { if (e.key === "Enter") handleGenerate(); }}
                placeholder="e.g. Renin-angiotensin system, Cranial nerves, Sickle cell disease..."
                style={{ flex: "1 1 220px", padding: "10px 14px", borderRadius: "var(--radius-sm)", border: `1.5px solid ${aiError ? "#E8445A" : "var(--border)"}`, background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "13.5px", color: "var(--text)", outline: "none" }}
              />
              <button
                onClick={handleGenerate}
                disabled={!aiTopic.trim() || aiLoading}
                style={{ padding: "10px 22px", borderRadius: "var(--radius-sm)", border: "none", background: aiTopic.trim() && !aiLoading ? "var(--gradient)" : "var(--border)", color: aiTopic.trim() && !aiLoading ? "white" : "var(--text-light)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13.5px", cursor: aiTopic.trim() && !aiLoading ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: "7px", whiteSpace: "nowrap", transition: "all 0.2s ease" }}
              >
                {aiLoading ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Generating…</> : <><Sparkles size={14} /> Generate</>}
              </button>
            </div>
            {aiError && (
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginTop: "10px", padding: "9px 13px", borderRadius: "var(--radius-sm)", background: "#FFF0F2", border: "1px solid #E8445A" }}>
                <AlertCircle size={14} color="#E8445A" />
                <p style={{ fontSize: "12.5px", color: "#E8445A", fontFamily: "var(--font-body)" }}>{aiError}</p>
              </div>
            )}
            <div style={{ marginTop: "12px", display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["Renal tubular function", "Cranial nerves", "Cardiac cycle", "Antibiotic resistance", "Hormones of the adrenal cortex"].map(s => (
                <button key={s} onClick={() => { setAiTopic(s); setAiError(""); }} style={{ padding: "4px 12px", borderRadius: "99px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "12px", cursor: "pointer" }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Spinner overlay for long generations */}
        {aiLoading && (
          <div style={{ textAlign: "center", padding: "20px 0 24px", display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 size={22} color="white" style={{ animation: "spin 0.8s linear infinite" }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "14px", color: "var(--text-muted)" }}>MedAI is generating your flashcards…</p>
          </div>
        )}

        {!aiLoading && (
          <>
            {/* Subject tabs */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "20px" }}>
              {BUILTIN_SUBJECTS.map(s => (
                <button key={s} onClick={() => setSelectedSubject(s)} style={{ padding: "7px 16px", borderRadius: "99px", border: `1.5px solid ${selectedSubject === s ? "var(--blue)" : "var(--border)"}`, background: selectedSubject === s ? "var(--blue)" : "var(--surface)", color: selectedSubject === s ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {s}
                </button>
              ))}
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{known} / {deck.length} known</span>
                <span style={{ fontSize: "12px", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 700 }}>{pct}%</span>
              </div>
              <div style={{ height: "6px", borderRadius: "99px", background: "var(--border)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "var(--gradient)", borderRadius: "99px", transition: "width 0.4s ease" }} />
              </div>
            </div>

            {/* Card */}
            {card && (
              <div
                onClick={() => setFlipped(f => !f)}
                style={{ cursor: "pointer", borderRadius: "var(--radius)", background: "var(--surface)", border: `2px solid ${progress[card.id] === "known" ? "var(--green)" : progress[card.id] === "unknown" ? "#E8445A" : "var(--border)"}`, boxShadow: "var(--shadow-md)", padding: "40px 32px", minHeight: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", transition: "border-color 0.2s ease", position: "relative", marginBottom: "20px" }}
              >
                <div style={{ position: "absolute", top: "14px", left: "16px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "11px", padding: "3px 10px", borderRadius: "99px", background: "var(--gradient-soft)", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{card.subject}</span>
                </div>
                <div style={{ position: "absolute", top: "14px", right: "16px", fontSize: "11px", color: "var(--text-light)", fontFamily: "var(--font-display)" }}>{index + 1} / {deck.length}</div>

                {!flipped ? (
                  <>
                    <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "17px", color: "var(--text)", lineHeight: 1.5, maxWidth: "480px" }}>{card.front}</p>
                    <p style={{ fontSize: "11.5px", color: "var(--text-light)", marginTop: "20px", fontFamily: "var(--font-body)" }}>Tap to reveal answer</p>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: "11px", color: "var(--text-light)", marginBottom: "12px", fontFamily: "var(--font-display)", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>Answer</p>
                    <p style={{ fontFamily: "var(--font-body)", fontSize: "14.5px", color: "var(--text)", lineHeight: 1.7, maxWidth: "500px" }}>{card.back}</p>
                  </>
                )}
              </div>
            )}

            {/* Action row */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", marginBottom: "24px" }}>
              <button onClick={() => go(-1)} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <ChevronLeft size={20} />
              </button>
              <button onClick={() => mark("unknown")} style={{ padding: "10px 22px", borderRadius: "99px", border: "none", background: "#FFF0F2", color: "#E8445A", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <X size={15} /> Don't Know
              </button>
              <button onClick={() => mark("known")} style={{ padding: "10px 22px", borderRadius: "99px", border: "none", background: "#EDFFF5", color: "var(--green-dark)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                <Check size={15} /> I Know It
              </button>
              <button onClick={() => go(1)} style={{ width: "44px", height: "44px", borderRadius: "50%", border: "1.5px solid var(--border)", background: "var(--surface)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <button onClick={reset} style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "99px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}>
                <RotateCcw size={13} /> Reset Progress
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </AppShell>
  );
}
