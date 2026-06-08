import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 2500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)] overflow-hidden"
      initial={{ clipPath: 'circle(0% at 50% 50%)' }}
      animate={{ clipPath: 'circle(150% at 50% 50%)' }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute w-[80vw] h-[80vw] rounded-full bg-[var(--color-accent)] opacity-10 blur-3xl"
          animate={{ x: ["-20%", "20%"], y: ["-10%", "10%"] }}
          transition={{ duration: 8, repeat: Infinity, repeatType: "reverse" }}
        />
      </div>

      <div className="relative z-10 text-center w-full px-12">
        <motion.h2 
          className="text-[5vw] font-display font-bold text-white mb-12"
          initial={{ y: 40, opacity: 0 }}
          animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 40, opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          Powerful Study Tools
        </motion.h2>

        <div className="flex justify-center gap-10">
          {[
            { title: "Flashcards", icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" },
            { title: "Notes", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
            { title: "Quizzes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" }
          ].map((item, i) => (
            <motion.div
              key={i}
              className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-64 flex flex-col items-center"
              initial={{ y: 50, opacity: 0 }}
              animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: phase >= 2 ? i * 0.15 : 0 }}
            >
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white font-display">{item.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}