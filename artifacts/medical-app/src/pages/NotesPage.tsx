import { useState } from "react";
import AppShell from "@/components/AppShell";
import { FileText, ChevronDown, ChevronUp, Search, BookMarked } from "lucide-react";

interface Note {
  id: number;
  subject: string;
  title: string;
  tags: string[];
  content: { heading: string; body: string }[];
}

const notes: Note[] = [
  {
    id: 1, subject: "Anatomy", title: "Brachial Plexus Overview", tags: ["upper limb", "nerves", "MBBS"],
    content: [
      { heading: "Formation", body: "The brachial plexus is formed from the ventral rami of C5, C6, C7, C8, and T1. Mnemonic: Rugby Teams Drink Cold Beer (Roots → Trunks → Divisions → Cords → Branches)." },
      { heading: "Trunks", body: "Upper trunk (C5–C6), Middle trunk (C7), Lower trunk (C8–T1). Each trunk splits into anterior and posterior divisions." },
      { heading: "Cords", body: "Lateral cord (C5–7 anterior), Medial cord (C8–T1 anterior), Posterior cord (all posterior divisions). Named by relation to axillary artery." },
      { heading: "Key Injuries", body: "Erb's palsy (C5–6): waiter's tip posture — arm adducted, internally rotated, forearm pronated. Klumpke's palsy (C8–T1): claw hand + Horner syndrome. Wrist drop = radial nerve (C5–8) injury at spiral groove." },
    ]
  },
  {
    id: 2, subject: "Anatomy", title: "The Heart — Chambers and Valves", tags: ["cardiovascular", "surgery", "MBBS"],
    content: [
      { heading: "Chambers", body: "4 chambers: Right atrium (receives from SVC/IVC/coronary sinus), Right ventricle (pumps to pulmonary circulation), Left atrium (receives from pulmonary veins), Left ventricle (pumps to systemic circulation, thickest wall)." },
      { heading: "Valves", body: "Atrioventricular: Tricuspid (right, 3 cusps), Mitral/Bicuspid (left, 2 cusps). Semilunar: Pulmonary (right outflow), Aortic (left outflow). Both semilunar valves have 3 cusps." },
      { heading: "Coronary Arteries", body: "Left coronary artery (LCA) → LAD (left anterior descending, supplies anterior wall/septum/apex) + Left circumflex (supplies lateral/posterior wall). Right coronary artery (RCA) → supplies right heart + SA node (60%) + AV node (90%) → dominant in 70% of people." },
      { heading: "Referred Pain", body: "Cardiac pain is typically referred to the left arm, jaw, and neck via C8–T4 nerve roots (somatic convergence). Inferior MI may cause epigastric pain." },
    ]
  },
  {
    id: 3, subject: "Physiology", title: "The Cardiac Action Potential", tags: ["electrophysiology", "cardiology", "MBBS"],
    content: [
      { heading: "Phase 0 — Rapid depolarisation", body: "Fast Na⁺ channels open → rapid Na⁺ influx → membrane potential rises from –90mV to +30mV. Responsible for the upstroke of the action potential." },
      { heading: "Phase 1 — Early repolarisation", body: "Fast Na⁺ channels close. Transient K⁺ efflux (Ito) begins early repolarisation." },
      { heading: "Phase 2 — Plateau", body: "L-type Ca²⁺ channels open → Ca²⁺ influx balanced by K⁺ efflux. This plateau is unique to cardiac muscle and allows calcium-induced calcium release for contraction. Prevents tetany." },
      { heading: "Phase 3 — Rapid repolarisation", body: "Ca²⁺ channels close. K⁺ efflux (IKr, IKs) dominates → rapid return to resting potential." },
      { heading: "Phase 4 — Resting potential", body: "–90mV maintained by Na⁺/K⁺ ATPase. In pacemaker cells (SA/AV node), funny current (If) produces spontaneous depolarisation — no true resting phase." },
    ]
  },
  {
    id: 4, subject: "Physiology", title: "Renal Physiology — Tubular Functions", tags: ["kidney", "fluid balance", "MBBS"],
    content: [
      { heading: "Proximal Convoluted Tubule (PCT)", body: "Reabsorbs ~65% of filtered Na⁺, K⁺, water, glucose (all), amino acids (all), HCO₃⁻, phosphate, uric acid. Main workhorse. Powered by Na⁺/K⁺ ATPase on basolateral membrane." },
      { heading: "Loop of Henle", body: "Thin descending: permeable to water (reabsorbs water), impermeable to solutes. Thick ascending: impermeable to water, actively reabsorbs Na⁺/K⁺/Cl⁻ via NKCC2 cotransporter (target of loop diuretics like furosemide). Creates medullary gradient for concentration." },
      { heading: "Distal Convoluted Tubule (DCT)", body: "Reabsorbs Na⁺/Cl⁻ via NCC cotransporter (target of thiazide diuretics). Impermeable to water without ADH. PTH stimulates Ca²⁺ reabsorption here." },
      { heading: "Collecting Duct", body: "ADH (vasopressin) inserts AQP2 water channels → water reabsorption → concentrated urine. Aldosterone (mineralocorticoid) stimulates Na⁺ reabsorption and K⁺/H⁺ secretion via principal cells. Intercalated cells handle acid-base (H⁺ secretion, HCO₃⁻ reabsorption)." },
    ]
  },
  {
    id: 5, subject: "Biochemistry", title: "Glycolysis — Step by Step", tags: ["metabolism", "energy", "MBBS"],
    content: [
      { heading: "Overview", body: "Glucose (6C) → 2 Pyruvate (3C) + 2 ATP (net) + 2 NADH. Occurs in cytoplasm of all cells. Does not require oxygen (anaerobic). Regulated at: Hexokinase, Phosphofructokinase-1 (PFK-1, rate-limiting), Pyruvate kinase." },
      { heading: "Energy investment phase (steps 1–5)", body: "Uses 2 ATP: Glucose + ATP → Glucose-6-phosphate (Hexokinase/Glucokinase). G6P → Fructose-6-phosphate (Phosphoglucose isomerase). F6P + ATP → Fructose-1,6-bisphosphate (PFK-1 — KEY REGULATORY STEP). F1,6-BP → 2× DHAP/G3P (Aldolase)." },
      { heading: "Energy payoff phase (steps 6–10)", body: "Generates 4 ATP + 2 NADH: G3P → 1,3-BPG (Glyceraldehyde-3-phosphate dehydrogenase, produces NADH). 1,3-BPG → 3-PG (Phosphoglycerate kinase, produces ATP). Eventually → Pyruvate (Pyruvate kinase, produces ATP)." },
      { heading: "Pyruvate fate", body: "Aerobic: Pyruvate → Acetyl-CoA (pyruvate dehydrogenase) → TCA cycle. Anaerobic: Pyruvate → Lactate (LDH, regenerates NAD⁺ to continue glycolysis). RBCs always use anaerobic glycolysis (no mitochondria)." },
      { heading: "Regulation of PFK-1", body: "Activated by: AMP, ADP, fructose-2,6-bisphosphate (insulin↑F2,6-BP). Inhibited by: ATP, citrate, H⁺ (acidosis). Glucagon decreases F2,6-BP → inhibits PFK-1 → decreases glycolysis." },
    ]
  },
  {
    id: 6, subject: "Pharmacology", title: "Antibiotics — Mechanisms and Classes", tags: ["antimicrobials", "infection", "clinical"],
    content: [
      { heading: "Cell wall synthesis inhibitors", body: "Beta-lactams (penicillins, cephalosporins, carbapenems): block transpeptidase/PBPs. Bactericidal. Vancomycin: inhibits transglycosylation, effective against MRSA. Bacitracin: disrupts lipid carrier." },
      { heading: "Protein synthesis inhibitors", body: "30S: Aminoglycosides (bactericidal — misreading mRNA), Tetracyclines (bacteriostatic — block tRNA binding). 50S: Macrolides (bacteriostatic — block translocation), Chloramphenicol (bacteriostatic), Linezolid (bacteriostatic), Clindamycin (bacteriostatic)." },
      { heading: "DNA/RNA synthesis inhibitors", body: "Fluoroquinolones (ciprofloxacin): inhibit DNA gyrase (gram-negative) and topoisomerase IV (gram-positive). Bactericidal. Rifampicin: inhibits RNA polymerase. Metronidazole: forms toxic free radicals that damage DNA — effective against anaerobes and protozoa." },
      { heading: "Cell membrane disruptors", body: "Polymyxins (colistin): disrupt gram-negative outer membrane. Daptomycin: disrupts gram-positive membranes. Azole antifungals: inhibit ergosterol synthesis." },
      { heading: "Resistance mechanisms", body: "Beta-lactamase production (overcome with clavulanic acid). Target modification (MRSA: altered PBP2a). Efflux pumps (tetracyclines, fluoroquinolones). Reduced permeability (gram-negative resistance)." },
    ]
  },
  {
    id: 7, subject: "Pathology", title: "Types of Inflammation", tags: ["pathology", "immune", "MBBS"],
    content: [
      { heading: "Acute inflammation", body: "Duration: hours to days. Mediators: histamine, prostaglandins, leukotrienes, complement. Features: rubor (redness), calor (heat), dolor (pain), tumor (swelling), functio laesa (loss of function). Cells: neutrophils (dominate early)." },
      { heading: "Chronic inflammation", body: "Duration: weeks to years. Cells: macrophages, lymphocytes, plasma cells, sometimes eosinophils. Associated with tissue destruction AND repair (fibrosis). Caused by persistent infection, autoimmune disease, toxic agents (silica, sutures)." },
      { heading: "Granulomatous inflammation", body: "A form of chronic inflammation. Granuloma = aggregate of activated macrophages (epithelioid cells) surrounded by lymphocytes ± giant cells ± necrosis. Causes: TB (caseous necrosis), sarcoidosis (non-caseating), Crohn's disease (non-caseating), fungal infections." },
      { heading: "Chemical mediators", body: "Vasoactive amines: histamine (mast cells), serotonin (platelets). Arachidonic acid derivatives: prostaglandins (PGE2, PGI2 → vasodilation, pain, fever), leukotrienes (LTB4 → neutrophil chemotaxis; LTC4/D4/E4 → bronchoconstriction). Cytokines: IL-1, TNF (systemic effects), IL-8 (chemotaxis)." },
    ]
  },
  {
    id: 8, subject: "Microbiology", title: "HIV/AIDS — Pathogenesis and Management", tags: ["viral", "immunology", "clinical"],
    content: [
      { heading: "Pathogenesis", body: "HIV (RNA retrovirus) targets CD4+ T cells. Virus binds CD4 receptor + CCR5/CXCR4 co-receptors → RNA reverse-transcribed to DNA (reverse transcriptase) → integrates into host genome (integrase) → viral replication → CD4 depletion → immunodeficiency." },
      { heading: "Clinical stages (WHO)", body: "Stage 1: Asymptomatic/generalised lymphadenopathy. Stage 2: Minor mucocutaneous conditions (herpes zoster, seborrhoeic dermatitis, recurrent oral ulcers). Stage 3: Oral candidiasis, pulmonary TB, unexplained anaemia. Stage 4 (AIDS): PCP, CMV retinitis, cryptococcal meningitis, Kaposi sarcoma, CNS toxoplasmosis. AIDS-defining CD4 < 200 cells/μL." },
      { heading: "Diagnosis", body: "Screening: ELISA (detect anti-HIV antibodies, sensitivity >99.5%). Confirmatory: Western blot (specific). Neonates and early infection: HIV PCR (detects viral RNA). Viral load: quantitative PCR — monitors treatment response. CD4 count: guides when to start prophylaxis." },
      { heading: "Treatment (ART)", body: "Nigeria uses WHO guidelines. First-line: 2 NRTIs + 1 NNRTI or INSTI. Common: TDF (tenofovir) + 3TC (lamivudine) + DTG (dolutegravir). Goal: undetectable viral load (<50 copies/mL). Start ART regardless of CD4 count (treat all). Monitor: CD4 count, viral load, LFTs, renal function." },
    ]
  },
];

const subjects = ["All", ...Array.from(new Set(notes.map(n => n.subject)))];

export default function NotesPage() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = notes.filter(n =>
    (subject === "All" || n.subject === subject) &&
    (search === "" || n.title.toLowerCase().includes(search.toLowerCase()) || n.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  return (
    <AppShell>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: "22px", color: "var(--text)", marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
            <FileText size={22} color="#F5A623" /> Study Notes
          </h1>
          <p style={{ fontSize: "13px", color: "var(--text-muted)" }}>Structured notes for Nigerian medical students.</p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "14px" }}>
          <Search size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-light)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search notes or tags..."
            style={{ width: "100%", padding: "10px 14px 10px 40px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", background: "var(--surface)", fontFamily: "var(--font-body)", fontSize: "14px", color: "var(--text)", outline: "none" }}
          />
        </div>

        {/* Subject tabs */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "6px", marginBottom: "20px" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSubject(s)} style={{ padding: "7px 16px", borderRadius: "99px", border: `1.5px solid ${subject === s ? "#F5A623" : "var(--border)"}`, background: subject === s ? "#F5A623" : "var(--surface)", color: subject === s ? "white" : "var(--text-muted)", fontFamily: "var(--font-display)", fontWeight: 600, fontSize: "12.5px", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>
              {s}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px 0", color: "var(--text-muted)", fontSize: "14px" }}>
              <BookMarked size={32} style={{ margin: "0 auto 10px", display: "block", opacity: 0.4 }} />
              No notes found for your search.
            </div>
          )}
          {filtered.map(note => (
            <div key={note.id} style={{ background: "var(--surface)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
              <button
                onClick={() => setExpanded(expanded === note.id ? null : note.id)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", padding: "2px 10px", borderRadius: "99px", background: "var(--gradient-soft)", color: "var(--blue)", fontFamily: "var(--font-display)", fontWeight: 600 }}>{note.subject}</span>
                    {note.tags.map(t => (
                      <span key={t} style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "99px", background: "var(--surface-2)", color: "var(--text-muted)", fontFamily: "var(--font-body)" }}>#{t}</span>
                    ))}
                  </div>
                  <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "15px", color: "var(--text)" }}>{note.title}</p>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "3px" }}>{note.content.length} sections</p>
                </div>
                {expanded === note.id ? <ChevronUp size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} /> : <ChevronDown size={18} color="var(--text-muted)" style={{ flexShrink: 0 }} />}
              </button>

              {expanded === note.id && (
                <div style={{ borderTop: "1px solid var(--border)", padding: "20px" }}>
                  {note.content.map((section, i) => (
                    <div key={i} style={{ marginBottom: i < note.content.length - 1 ? "20px" : 0 }}>
                      <p style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "13.5px", color: "var(--blue)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--blue)", display: "inline-block", flexShrink: 0 }} />
                        {section.heading}
                      </p>
                      <p style={{ fontSize: "13.5px", color: "var(--text)", fontFamily: "var(--font-body)", lineHeight: 1.7, paddingLeft: "12px" }}>{section.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
