import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5() {
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
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-muted)] overflow-hidden"
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      exit={{ y: "-100%" }}
      transition={{ duration: 0.8 }}
      style={{ perspective: 1000 }}
    >
      <div className="w-full flex items-center justify-center relative z-10 h-full">
        <div className="w-1/2 flex flex-col items-center justify-center px-10 text-center">
          <motion.h2 
            className="text-[4.5vw] font-display font-bold text-[var(--color-text-primary)] leading-tight mb-4"
            initial={{ y: 30, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Anywhere,<br />Anytime
          </motion.h2>
          <motion.p 
            className="text-[1.8vw] text-[var(--color-text-secondary)] max-w-md"
            initial={{ y: 20, opacity: 0 }}
            animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 20, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Seamlessly sync between web and mobile app.
          </motion.p>
        </div>

        <div className="w-1/2 relative h-[80%] flex items-center justify-center">
          <motion.div
            className="absolute bg-white rounded-3xl shadow-2xl border border-gray-200 w-[60%] h-[70%] z-10 flex flex-col overflow-hidden"
            initial={{ x: 100, y: -50, opacity: 0 }}
            animate={phase >= 3 ? { x: -40, y: -20, opacity: 1 } : { x: 100, y: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
          >
            <div className="h-10 border-b border-gray-100 flex items-center px-4 bg-gray-50">
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                <div className="w-2 h-2 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="flex-1 p-4 bg-gray-50 flex flex-col gap-4">
               <div className="w-full h-8 bg-gray-200 rounded-md" />
               <div className="flex gap-4">
                 <div className="w-1/3 h-32 bg-white rounded shadow-sm border border-gray-100" />
                 <div className="w-2/3 h-32 bg-white rounded shadow-sm border border-gray-100" />
               </div>
            </div>
          </motion.div>

          <motion.div
            className="absolute bg-[var(--color-bg-dark)] rounded-[2rem] shadow-2xl border-4 border-gray-800 w-[30%] h-[80%] z-20 overflow-hidden"
            initial={{ x: 150, y: 50, opacity: 0 }}
            animate={phase >= 3 ? { x: 60, y: 20, opacity: 1 } : { x: 150, y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 20, delay: phase >= 3 ? 0.2 : 0 }}
          >
            <div className="h-full w-full bg-[var(--color-bg-light)] p-3 flex flex-col gap-3">
              <div className="w-full h-24 bg-[var(--color-primary)] rounded-xl" />
              <div className="w-full h-12 bg-white rounded-xl shadow-sm border border-gray-100" />
              <div className="w-full h-12 bg-white rounded-xl shadow-sm border border-gray-100" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}