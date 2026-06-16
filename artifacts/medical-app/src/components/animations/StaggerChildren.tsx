import React from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface StaggerChildrenProps {
  children: React.ReactNode;
  staggerDelay?: number; // ms between each child
  baseDelay?: number;
}

export default function StaggerChildren({ children, staggerDelay = 50, baseDelay = 0 }: StaggerChildrenProps) {
  const reduced = useReducedMotion();

  return (
    <>
      {React.Children.map(children, (child, i) => (
        <div
          style={
            reduced
              ? {}
              : {
                  opacity: 0,
                  transform: "translateY(16px)",
                  animation: `fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${baseDelay + i * staggerDelay}ms forwards`,
                }
          }
        >
          {child}
        </div>
      ))}
    </>
  );
}
