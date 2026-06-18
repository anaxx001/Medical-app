import { useEffect, useState } from "react";
import { Heart, Brain, Activity, Stethoscope, Users, BookOpen } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

const MEDICAL_ICONS = [
  { Icon: Heart, delay: 0, x: "15%", y: "20%", size: 28, color: "rgba(239, 68, 68, 0.15)" },
  { Icon: Brain, delay: 0.3, x: "80%", y: "15%", size: 32, color: "rgba(139, 92, 246, 0.12)" },
  { Icon: Activity, delay: 0.6, x: "75%", y: "75%", size: 24, color: "rgba(16, 185, 129, 0.15)" },
  { Icon: Stethoscope, delay: 0.9, x: "20%", y: "70%", size: 26, color: "rgba(13, 148, 136, 0.12)" },
  { Icon: Users, delay: 1.2, x: "50%", y: "85%", size: 22, color: "rgba(59, 130, 246, 0.1)" },
  { Icon: BookOpen, delay: 1.5, x: "85%", y: "45%", size: 20, color: "rgba(245, 158, 11, 0.1)" },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const [showIcons, setShowIcons] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setShowIcons(true), 200);
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("exit"), 2200);
    const t3 = setTimeout(() => onComplete(), 2800);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

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
        overflow: "hidden",
      }}
    >
      {/* Floating medical icons */}
      {showIcons && MEDICAL_ICONS.map(({ Icon, delay, x, y, size, color }, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: x,
            top: y,
            opacity: phase === "enter" ? 0 : 1,
            transform: phase === "enter" ? "scale(0) rotate(-20deg)" : "scale(1) rotate(0deg)",
            transition: `all 0.8s cubic-bezier(0.34,1.56,0.64,1) ${delay}s`,
            animation: `float 3s ease-in-out ${delay}s infinite`,
          }}
        >
          <Icon size={size} color={color} strokeWidth={1.5} />
        </div>
      ))}

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
          position: "relative",
          zIndex: 2,
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
            animation: "pulse-glow 2s ease-in-out infinite",
          }}
        >
          <img
            src="/logo.png"
            alt="MedStudent"
            style={{ width: "72px", height: "72px", borderRadius: "18px", objectFit: "contain" }}
            onError={(e) => {
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
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 20px 60px rgba(0,0,0,0.2); }
          50% { box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255,255,255,0.1); }
        }
      `}</style>
    </div>
  );
}
