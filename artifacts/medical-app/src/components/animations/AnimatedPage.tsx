import React, { useEffect, useRef } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export default function AnimatedPage({ children, className = "", delay = 0 }: AnimatedPageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced || !ref.current) return;

    const el = ref.current;
    el.style.opacity = "0";
    el.style.transform = "translateY(12px) scale(0.995)";

    const timer = setTimeout(() => {
      el.style.transition = `opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0) scale(1)";
    }, delay);

    return () => clearTimeout(timer);
  }, [reduced, delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
