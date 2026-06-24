import { useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, RotateCw, CheckCircle, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";

interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export default function FlashcardsPage() {
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const decks = [
    {
      id: "deck-1",
      title: "Cranial Nerves & Innervations",
      cardCount: 5,
      cards: [
        { id: "1", front: "Which cranial nerve innervates the lateral rectus muscle?", back: "CN VI (Abducens nerve). Shortcut: LR6-SO4-AO3." },
        { id: "2", front: "Name the cranial nerves that pass through the superior orbital fissure.", back: "CN III, IV, V1 (ophthalmic division of trigeminal), and VI." },
        { id: "3", front: "Which nerve matches tongue muscle motor controls?", back: "CN XII (Hypoglossal nerve) - except palatoglossus (CN X)." },
        { id: "4", front: "Name CN VII principal branches inside the parotid gland.", back: "Temporal, Zygomatic, Buccal, Marginal Mandibular, Cervical (Ten Zebras Bit My Cat)." }
      ]
    },
    {
      id: "deck-2",
      title: "Pharmacokinetics Clearance Curves",
      cardCount: 4,
      cards: [
        { id: "p1", front: "Formula for half-life (t1/2) in terms of Vd and Cl?", back: "t1/2 = 0.693 × Vd / Cl." },
        { id: "p2", front: "What does a high volume of distribution (Vd) suggest?", back: "Drug is highly lipid-soluble and widely distributed in tissue spaces, not concentrated in plasma." },
        { id: "p3", front: "How many half-lives are typically required to reach 90% steady state?", back: "Approximately 3.3 half-lives." }
      ]
    }
  ];

  const currentDeck = decks.find(d => d.id === activeDeck);
  const currentCard = currentDeck?.cards[currentIdx];

  const handleNext = () => {
    if (currentDeck && currentIdx < currentDeck.cards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx(c => c + 1);
      }, 150);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIdx(c => c - 1);
      }, 150);
    }
  };

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto", padding: "24px 16px 80px", fontFamily: "var(--font-body)", color: "var(--text)" }}>
      
      {/* Return back header */}
      <div style={{ marginBottom: "20px" }}>
        {activeDeck ? (
          <button 
            onClick={() => { setActiveDeck(null); setCurrentIdx(0); setIsFlipped(false); }}
            style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
          >
            <ArrowLeft size={16} /> Return to Decks
          </button>
        ) : (
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", color: "var(--text-muted)", fontSize: "14px", fontWeight: 600 }}>
            <ArrowLeft size={16} /> Returns to Core Console
          </Link>
        )}
      </div>

      {!activeDeck ? (
        <div>
          <span style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, color: "#0D9488" }}>ACTIVE RECALL STUDY</span>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800, margin: "4px 0 20px" }}>
            Cardiology & Anatomy Decks
          </h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr md:1fr", gap: "16px" }} className="grid-cols-1 md:grid-cols-2">
            {decks.map((deck) => (
              <div 
                key={deck.id}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px", borderRadius: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              >
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 800 }}>{deck.title}</h3>
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>{deck.cards.length} revision cards structured</span>
                </div>

                <button 
                  onClick={() => setActiveDeck(deck.id)}
                  style={{ background: "#0D9488", color: "white", border: "none", width: "100%", padding: "10px", borderRadius: "10px", marginTop: "18px", fontWeight: 700, cursor: "pointer" }}
                >
                  Start active recall drill
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        currentDeck && currentCard && (
          <div style={{ textAlign: "center" }}>
            
            <div style={{ marginBottom: "20px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>
                {currentDeck.title} • Card {currentIdx + 1} of {currentDeck.cards.length}
              </span>
            </div>

            {/* FLIP CARD AREA */}
            <div 
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                perspective: "1000px",
                width: "100%",
                maxWidth: "480px",
                height: "280px",
                margin: "0 auto 28px",
                cursor: "pointer"
              }}
            >
              <div style={{
                position: "relative",
                width: "100%",
                height: "100%",
                transition: "transform 0.6s",
                transformStyle: "preserve-3d",
                transform: isFlipped ? "rotateY(180deg)" : "none"
              }}>
                
                {/* Front */}
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  background: "var(--surface)",
                  border: "2px solid #0D9488",
                  borderRadius: "20px",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.03)"
                }}>
                  <p style={{ margin: 0, fontSize: "17px", fontWeight: 750, lineHeight: 1.5 }}>
                    {currentCard.front}
                  </p>
                  <span style={{ position: "absolute", bottom: "16px", fontSize: "12px", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <RotateCw size={13} /> Tap to flip card
                  </span>
                </div>

                {/* Back */}
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  background: "var(--surface-muted)",
                  border: "2px solid var(--border)",
                  borderRadius: "20px",
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transform: "rotateY(180deg)",
                  boxShadow: "0 8px 16px rgba(0,0,0,0.03)"
                }}>
                  <p style={{ margin: 0, fontSize: "16.5px", fontWeight: 650, color: "#0D9488", lineHeight: 1.5 }}>
                    {currentCard.back}
                  </p>
                  <span style={{ position: "absolute", bottom: "16px", fontSize: "12px", color: "var(--text-muted)" }}>
                    Answer Verified by Senior Mentor
                  </span>
                </div>

              </div>
            </div>

            {/* CONTROLS */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "24px" }}>
              <button 
                onClick={handlePrev}
                disabled={currentIdx === 0}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentIdx === 0 ? "not-allowed" : "pointer" }}
              >
                <ChevronLeft size={20} />
              </button>

              <button 
                onClick={() => setIsFlipped(!isFlipped)}
                style={{ background: "rgba(13,148,136,0.1)", color: "#0D9488", border: "none", padding: "10px 24px", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}
              >
                Flip Card
              </button>

              <button 
                onClick={handleNext}
                disabled={currentIdx === currentDeck.cards.length - 1}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", width: "42px", height: "42px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: currentIdx === currentDeck.cards.length - 1 ? "not-allowed" : "pointer" }}
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>
        )
      )}

    </div>
  );
}
