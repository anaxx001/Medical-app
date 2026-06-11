import { useEffect, useState } from "react";

interface Props {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: Props) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    const fadeIn = setTimeout(() => setPhase("hold"), 500);
    const hold = setTimeout(() => setPhase("out"), 2000);
    const done = setTimeout(() => onComplete(), 2600);
    return () => {
      clearTimeout(fadeIn);
      clearTimeout(hold);
      clearTimeout(done);
    };
  }, []);

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "linear-gradient(135deg, #0D9488, #0F766E)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 9999,
      opacity: phase === "out" ? 0 : 1,
      transition: phase === "in"
        ? "opacity 0.5s ease"
        : phase === "out"
        ? "opacity 0.6s ease"
        : "none",
    }}>
      {/* Logo */}
      <div style={{
        width: "120px",
        height: "120px",
        borderRadius: "28px",
        background: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        marginBottom: "24px",
        transform: phase === "in" ? "scale(0.8)" : "scale(1)",
        transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
      }}>
        <img
          src="/logo.png"
          alt="MedStudent"
          style={{
            width: "80px",
            height: "80px",
            objectFit: "contain",
          }}
        />
      </div>

      {/* App Name */}
      <h1 style={{
        color: "white",
        fontFamily: "var(--font-display)",
        fontWeight: 800,
        fontSize: "28px",
        margin: "0 0 8px 0",
        letterSpacing: "-0.5px",
        opacity: phase === "in" ? 0 : 1,
        transform: phase === "in" ? "translateY(10px)" : "translateY(0)",
        transition: "opacity 0.4s ease 0.2s, transform 0.4s ease 0.2s",
      }}>
        MedStudent
      </h1>

      {/* Tagline */}
      <p style={{
        color: "rgba(255,255,255,0.75)",
        fontSize: "14px",
        margin: 0,
        fontFamily: "var(--font-body)",
        letterSpacing: "0.5px",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 0.4s ease 0.4s",
      }}>
        Study · Interact · Connect
      </p>

      {/* Loading dots */}
      <div style={{
        position: "absolute",
        bottom: "60px",
        display: "flex",
        gap: "8px",
        opacity: phase === "in" ? 0 : 1,
        transition: "opacity 0.3s ease 0.6s",
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.6)",
            animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}