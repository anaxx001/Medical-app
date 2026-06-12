import { useEffect, useState } from "react";

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(() => onFinish(), 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "linear-gradient(160deg, #0d7a6e 0%, #1ABC9C 60%, #a8eddf 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        opacity: phase === "exit" ? 0 : 1,
        transition: phase === "exit" ? "opacity 0.6s ease" : "none",
      }}
    >
      {/* Logo */}
      <div
        style={{
          transform: phase === "enter" ? "scale(0.7) translateY(20px)" : "scale(1) translateY(0px)",
          opacity: phase === "enter" ? 0 : 1,
          transition: "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), opacity 0.4s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "20px",
        }}
      >
        {/* Logo image or fallback icon */}
        <div
          style={{
            width: "100px",
            height: "100px",
            borderRadius: "28px",
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255,255,255,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}
        >
          <img
            src="/logo.png"
            alt="MedStudent"
            style={{ width: "72px", height: "72px", borderRadius: "18px", objectFit: "contain" }}
            onError={(e) => {
              // Fallback if logo not found
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>

        {/* App name */}
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontWeight: 800,
              fontSize: "32px",
              color: "#fff",
              margin: "0 0 6px 0",
              letterSpacing: "-0.5px",
              textShadow: "0 2px 12px rgba(0,0,0,0.15)",
            }}
          >
            MedStudent
          </h1>
          <p
            style={{
              fontFamily: "'Inter', 'Segoe UI', sans-serif",
              fontSize: "14px",
              color: "rgba(255,255,255,0.8)",
              margin: 0,
              letterSpacing: "0.5px",
            }}
          >
            Your Nigerian health community
          </p>
        </div>

        {/* Animated dots loader */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.9)",
                animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: "absolute",
          bottom: "48px",
          opacity: phase === "enter" ? 0 : 0.6,
          transition: "opacity 0.8s ease 0.4s",
          fontFamily: "'Inter', 'Segoe UI', sans-serif",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        Study. Connect. Grow.
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}