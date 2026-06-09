import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { RotateCcw, ChevronLeft, ChevronRight, Check, X, BookOpen } from "lucide-react";

interface Card {
  id: number;
  subject: string;
  front: string;
  back: string;
}

const allCards: Card[] = [
  // Anatomy
  { id: 1, subject: "Anatomy", front: "What are the bones of the brachial plexus roots?", back: "Roots C5, C6, C7, C8 and T1. Mnemonic: 'Rugby Teams Drink Cold Beer' — Roots, Trunks, Divisions, Cords, Branches." },
  { id: 2, subject: "Anatomy", front: "Name the branches of the facial nerve (CN VII)", back: "Two Zebras Bit My Cat: Temporal, Zygomatic, Buccal, Marginal mandibular, Cervical." },
  { id: 3, subject: "Anatomy", front: "What is the blood supply of the femoral head in adults?", back: "Primarily the medial femoral circumflex artery (branch of profunda femoris). Fractures can disrupt this, causing avascular necrosis." },
  { id: 4, subject: "Anatomy", front: "Where does the great saphenous vein drain into?", back: "The femoral vein at the saphenofemoral junction, approximately 4 cm below and lateral to the pubic tubercle." },
  { id: 5, subject: "Anatomy", front: "What structures pass through the carpal tunnel?", back: "4 flexor digitorum superficialis, 4 flexor digitorum profundus, 1 flexor pollicis longus tendons + median nerve. (9 tendons + 1 nerve). Note: ulnar nerve does NOT pass through." },
  { id: 6, subject: "Anatomy", front: "What is the Triangle of Petit?", back: "A lumbar triangle bounded by: iliac crest (below), external oblique (anteriorly), latissimus dorsi (posteriorly). A site for lumbar hernias." },
  { id: 7, subject: "Anatomy", front: "Name the rotator cuff muscles", back: "SITS: Supraspinatus, Infraspinatus, Teres minor, Subscapularis. Supraspinatus initiates abduction (0–15°), deltoid continues it." },
  // Physiology
  { id: 8, subject: "Physiology", front: "What is the normal resting membrane potential of a neuron?", back: "–70 mV. Maintained by the Na⁺/K⁺ ATPase pump (3 Na⁺ out, 2 K⁺ in) and selective K⁺ leak channels." },
  { id: 9, subject: "Physiology", front: "What happens during the absolute refractory period?", back: "No action potential can be generated, regardless of stimulus strength. Na⁺ channels are inactivated (closed and cannot open). Lasts ~1 ms." },
  { id: 10, subject: "Physiology", front: "What is the Frank-Starling Law?", back: "The force of cardiac contraction is proportional to the initial length of cardiac muscle fibres (preload). Greater ventricular filling → greater stroke volume." },
  { id: 11, subject: "Physiology", front: "How does ADH (vasopressin) work on the kidney?", back: "ADH binds V2 receptors in collecting duct → activates adenylyl cyclase → cAMP → inserts aquaporin-2 (AQP2) channels → increases water reabsorption." },
  { id: 12, subject: "Physiology", front: "What is the oxygen-haemoglobin dissociation curve shift in acidosis?", back: "Right shift (Bohr effect): decreased pH, increased CO₂, increased 2,3-DPG, increased temperature → decreased O₂ affinity → more O₂ released to tissues." },
  { id: 13, subject: "Physiology", front: "What controls the rate of the cardiac cycle?", back: "The SA node (pacemaker) fires at 60–100 bpm intrinsically. Modulated by the autonomic nervous system: sympathetic ↑ rate, parasympathetic ↓ rate." },
  // Biochemistry
  { id: 14, subject: "Biochemistry", front: "What are the key products of glycolysis?", back: "1 glucose → 2 pyruvate + 2 ATP (net) + 2 NADH. Occurs in cytoplasm. Anaerobic in absence of O₂, pyruvate → lactate (by LDH)." },
  { id: 15, subject: "Biochemistry", front: "What is the rate-limiting step of the TCA cycle?", back: "Isocitrate dehydrogenase (converts isocitrate → α-ketoglutarate). Inhibited by high ATP/NADH, activated by ADP/NAD⁺." },
  { id: 16, subject: "Biochemistry", front: "What enzyme converts phenylalanine to tyrosine?", back: "Phenylalanine hydroxylase. Deficiency = Phenylketonuria (PKU). Requires tetrahydrobiopterin (BH4) as cofactor." },
  { id: 17, subject: "Biochemistry", front: "What is the function of HMG-CoA reductase?", back: "Rate-limiting enzyme in cholesterol synthesis: converts HMG-CoA → mevalonate. Inhibited by statins. Active at night — why statins are taken at bedtime." },
  // Pharmacology
  { id: 18, subject: "Pharmacology", front: "What is the mechanism of action of beta-lactam antibiotics?", back: "Inhibit cell wall synthesis by binding penicillin-binding proteins (PBPs), preventing cross-linking of peptidoglycan. Bactericidal." },
  { id: 19, subject: "Pharmacology", front: "Name the adverse effects of aminoglycosides", back: "Nephrotoxicity (acute tubular necrosis), ototoxicity (both cochlear and vestibular), neuromuscular blockade. Monitor trough levels." },
  { id: 20, subject: "Pharmacology", front: "What is the first-line treatment for malaria in Nigeria?", back: "Uncomplicated malaria: Artemisinin-based Combination Therapy (ACT) — Artemether-Lumefantrine (Coartem). Severe malaria: IV Artesunate." },
  { id: 21, subject: "Pharmacology", front: "How do ACE inhibitors work?", back: "Block conversion of Angiotensin I → Angiotensin II → reduced vasoconstriction + reduced aldosterone → ↓BP. Also block bradykinin degradation → dry cough (side effect)." },
  // Pathology
  { id: 22, subject: "Pathology", front: "What is the difference between necrosis and apoptosis?", back: "Necrosis: pathological, uncontrolled, causes inflammation, cell swelling then lysis. Apoptosis: programmed, no inflammation, cell shrinkage, nuclear condensation, apoptotic bodies." },
  { id: 23, subject: "Pathology", front: "Name the types of necrosis and their associations", back: "Coagulative (ischaemia, most organs), Liquefactive (brain, abscess), Caseous (TB, fungi), Fat (pancreas), Gangrenous, Fibrinoid (immune vasculitis)." },
  { id: 24, subject: "Pathology", front: "What is Virchow's Triad?", back: "Risk factors for thrombosis: 1) Stasis of blood flow, 2) Endothelial injury, 3) Hypercoagulability." },
  // Microbiology
  { id: 25, subject: "Microbiology", front: "How does Mycobacterium tuberculosis evade the immune system?", back: "Survives inside macrophages by preventing phagosome-lysosome fusion (using cord factor/trehalose dimycolate). Forms granulomas. Slow-growing, waxy mycolic acid cell wall resists killing." },
  { id: 26, subject: "Microbiology", front: "What is the difference between gram-positive and gram-negative cell walls?", back: "Gram+: thick peptidoglycan layer, teichoic acids, no outer membrane. Gram–: thin peptidoglycan, outer membrane with LPS (endotoxin), periplasmic space." },
];

const subjects = ["All", ...Array.from(new Set(allCards.map(c => c.subject)))];

const STORAGE_KEY = "medapp_flashcards_progress";

function loadProgress(): Record<number, "known" | "unknown"> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}

function saveProgress(p: Record<number, "known" | "unknown">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

export default function FlashcardsPage() {
  const [selectedSubject, setSelectedSubject] = useState("All");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [progress, setProgress] = useState<Record<number, "known" | "unknown">>(loadProgress);

  const deck = allCards.filter(c => selectedSubject === "All" || c.subject === selectedSubject);
  const card = deck[index];
  const known = deck.filter(c => progress[c.id] === "known").length;
  const pct = deck.length > 0 ? Math.round((known / deck.length) * 100) : 0;

  function go(dir: number) {
    setFlipped(false);
    setTimeout(() => setIndex(i => (i + dir + deck.length) % deck.length), 100);
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

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [selectedSubject]);

  if (deck.length === 0) return <AppShell><div style={{ textAlign: "center", padding: "60px 20px" }}><p style={{ color: "var(--text-muted)" }}>No cards available.</p></div></AppShell>;

  return (
    <AppShell>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <BookOpen size={22} color="var(--blue)" /> Flashcards
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Tap a card to reveal the answer. Mark what you know.</p>
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "20px" }}>
          {subjects.map(s => (
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
      </div>
    </AppShell>
  );
}
