import React from "react";

export default function GradientBackground() {
  return (
    <>
      <div className="animated-bg" aria-hidden="true" />
      {/* Optional floating orbs for extra depth */}
      <div style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none", overflow: "hidden" }}>
        <div className="floating-orb" style={{ width: 300, height: 300, background: "rgba(45,135,200,0.15)", top: "10%", left: "5%", animationDelay: "0s" }} />
        <div className="floating-orb" style={{ width: 250, height: 250, background: "rgba(155,109,255,0.12)", bottom: "15%", right: "10%", animationDelay: "-4s" }} />
        <div className="floating-orb" style={{ width: 180, height: 180, background: "rgba(13,148,136,0.10)", top: "50%", left: "60%", animationDelay: "-8s" }} />
      </div>
    </>
  );
}
