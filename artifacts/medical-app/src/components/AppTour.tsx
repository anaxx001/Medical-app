import { useAppTour, TourStep } from "@/hooks/useAppTour";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function AppTour() {
  const { isOpen, currentStep, tourSteps, nextStep, prevStep, skipTour, endTour } = useAppTour();

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
  const tooltipWidth = 280;
  const tooltipHeight = 180;
  const gap = 16;

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

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.4)",
          zIndex: 999,
          cursor: "pointer",
        }}
        onClick={skipTour}
      />

      {/* Highlight box around target */}
      <div
        style={{
          position: "fixed",
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          border: "2px solid #0D9488",
          borderRadius: "8px",
          boxShadow: "0 0 20px rgba(13, 148, 136, 0.5)",
          zIndex: 1000,
          pointerEvents: "none",
        }}
      />

      {/* Tooltip */}
      <div
        style={{
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          width: "280px",
          backgroundColor: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
          zIndex: 1001,
        }}
      >
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
          }}
        >
          <X size={16} />
        </button>

        {/* Title */}
        <h3
          style={{
            fontFamily: "var(--font-display)",
            fontWeight: 700,
            fontSize: "16px",
            color: "var(--text)",
            margin: "0 0 8px 0",
            paddingRight: "24px",
          }}
        >
          {step.title}
        </h3>

        {/* Content */}
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            margin: "0 0 16px 0",
            lineHeight: 1.5,
          }}
        >
          {step.content}
        </p>

        {/* Progress & buttons */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-muted)",
              fontWeight: 600,
            }}
          >
            {currentStep + 1} / {tourSteps.length}
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                background: "var(--surface-2)",
                color: currentStep === 0 ? "var(--text-light)" : "var(--text)",
                cursor: currentStep === 0 ? "not-allowed" : "pointer",
                opacity: currentStep === 0 ? 0.5 : 1,
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={nextStep}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                border: "none",
                background: "#0D9488",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
