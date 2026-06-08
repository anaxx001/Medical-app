import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 2800),
      setTimeout(() => setPhase(5), 4500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center bg-[var(--color-bg-light)] overflow-hidden"
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "-100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="w-1/2 h-full flex flex-col justify-center px-16 relative z-10">
        <motion.div 
          className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-6"
          initial={{ scale: 0 }}
          animate={phase >= 1 ? { scale: 1 } : { scale: 0 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <svg className="w-8 h-8 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </motion.div>

        <motion.h2 
          className="text-[4.5vw] font-display font-bold text-[var(--color-text-primary)] leading-tight mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          AI Medical<br />Chatbot
        </motion.h2>

        <motion.p 
          className="text-[1.8vw] text-[var(--color-text-secondary)]"
          initial={{ y: 20, opacity: 0 }}
          animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Instant answers to your clinical questions, tailored to your curriculum.
        </motion.p>
      </div>

      <div className="w-1/2 h-full relative flex items-center justify-center">
        <motion.div 
          className="absolute inset-0 bg-[var(--color-primary)] opacity-5 transform -skew-x-12 scale-150"
          animate={{ x: ["-10%", "10%"] }}
          transition={{ duration: 10, repeat: Infinity, repeatType: "reverse" }}
        />
        
        <motion.div
          className="relative w-[80%] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden"
          initial={{ y: 100, opacity: 0, rotate: 5 }}
          animate={phase >= 4 ? { y: 0, opacity: 1, rotate: 0 } : { y: 100, opacity: 0, rotate: 5 }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
        >
          <div className="h-12 border-b border-gray-100 flex items-center px-4 bg-gray-50">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none w-3/4">
                <div className="h-2 bg-gray-300 rounded w-full mb-2" />
                <div className="h-2 bg-gray-300 rounded w-5/6" />
              </div>
            </div>
            <div className="flex gap-4 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
              <div className="bg-[var(--color-bg-muted)] p-3 rounded-2xl rounded-tr-none w-3/4">
                <div className="h-2 bg-[var(--color-primary)] opacity-50 rounded w-full mb-2" />
                <div className="h-2 bg-[var(--color-primary)] opacity-50 rounded w-4/6 mb-2" />
                <div className="h-2 bg-[var(--color-primary)] opacity-50 rounded w-5/6" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}