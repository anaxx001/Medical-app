import { useAppTour, TourStep } from "@/hooks/useAppTour";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function AppTour() {
  const { isOpen, currentStep, tourSteps, nextStep, prevStep, skipTour, endTour } = useAppTour();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = tourSteps[currentStep];
  const targetElement = document.querySelector(`[data-tour-id="${step.target}"]`);

  if (!targetElement) return null;

  const rect = targetElement.getBoundingClientRect();
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

  let top = rect.top + scrollTop;
  let left = rect.left + scrollLeft;

  // Position tooltip based on step.position
  const tooltipWidth = 300;
  const tooltipHeight = 200;
  const gap = 20;

  switch (step.position) {
    case "top":
      top -= tooltipHeight + gap;
      left += rect.width / 2 - tooltipWidth / 2;
      break;
    case "bottom":
      top += rect.height + gap;
      left += rect.width / 2 - tooltipWidth / 2;
      break;
    case "left":
      top += rect.height / 2 - tooltipHeight / 2;
      left -= tooltipWidth + gap;
      break;
    case "right":
      top += rect.height / 2 - tooltipHeight / 2;
      left += rect.width + gap;
      break;
    case "center":
      top = window.innerHeight / 2 - tooltipHeight / 2 + scrollTop;
      left = window.innerWidth / 2 - tooltipWidth / 2 + scrollLeft;
      break;
  }

  // Clamp position to viewport
  top = Math.max(10, Math.min(top, window.innerHeight + scrollTop - tooltipHeight - 10));
  left = Math.max(10, Math.min(left, window.innerWidth + scrollLeft - tooltipWidth - 10));

  const progressPercent = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Overlay with blur */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(3px)",
          zIndex: 999,
          cursor: "pointer",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease",
        }}
        onClick={skipTour}
      />

      {/* Highlight box around target with animated border */}
      <div
        style={{
          position: "fixed",
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          border: "3px solid #0D9488",
          borderRadius: "12px",
          boxShadow: "0 0 0 4px rgba(13, 148, 136, 0.2), 0 0 30px rgba(13, 148, 136, 0.3)",
          zIndex: 1000,
          pointerEvents: "none",
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "scale(1)" : "scale(0.95)",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          animation: "highlight-pulse 2s ease-in-out infinite",
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          width: "300px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 12px 40px rgba(0, 0, 0, 0.2)",
          zIndex: 1001,
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(10px) scale(0.95)",
          transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        {/* Progress bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: "var(--border)",
          borderRadius: "16px 16px 0 0",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: "linear-gradient(90deg, #0D9488, #14B8A6)",
            borderRadius: "16px 16px 0 0",
            transition: "width 0.3s ease",
          }} />
        </div>

        {/* Close button */}
        <button
          onClick={skipTour}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
            borderRadius: "6px",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <X size={16} />
        </button>

        {/* Step indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "12px",
        }}>
          <Sparkles size={14} color="#0D9488" />
          <span style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#0D9488",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}>
            Step {currentStep + 1} of {tourSteps.length}
          </span>
        </div>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "17px",
            color: "var(--text)",
            margin: "0 0 10px 0",
            paddingRight: "24px",
            lineHeight: 1.3,
          }}
        >
          {step.title}
        </h3>

        {/* Content */}
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            margin: "0 0 20px 0",
            lineHeight: 1.6,
          }}
        >
          {step.content}
        </p>

        {/* Progress dots */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "6px",
          marginBottom: "16px",
        }}>
          {tourSteps.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === currentStep ? "20px" : "6px",
                height: "6px",
                borderRadius: "3px",
                background: i === currentStep ? "#0D9488" : i < currentStep ? "rgba(13, 148, 136, 0.4)" : "var(--border)",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <button
            onClick={skipTour}
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
              padding: "6px 8px",
              borderRadius: "6px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
          >
            Skip tour
          </button>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: currentStep === 0 ? "var(--text-light)" : "var(--text)",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                opacity: currentStep === 0 ? 0.5 : 1,
                transition: "all 0.2s",
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <button
              onClick={currentStep === tourSteps.length - 1 ? endTour : nextStep}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px",
                height: "36px",
                padding: "0 16px",
                borderRadius: "10px",
                border: "none",
                background: "#0D9488",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "13px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "#0F766E"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "#0D9488"; }}
            >
              {currentStep === tourSteps.length - 1 ? (
                <>Finish</>
              ) : (
                <>
                  Next <ChevronRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes highlight-pulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.2), 0 0 30px rgba(13, 148, 136, 0.3); }
          50% { box-shadow: 0 0 0 6px rgba(13, 148, 136, 0.3), 0 0 40px rgba(13, 148, 136, 0.4); }
        }
      `}</style>
    </>
  );
}
