import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/doctor.jpg`} 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-transparent to-[var(--color-bg-dark)] opacity-80" />
      </div>

      <div className="relative z-10 text-center px-10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-4xl font-bold font-display shadow-[0_0_40px_rgba(45,135,200,0.5)]">
            M
          </div>
        </motion.div>

        <motion.h1 
          className="text-[6vw] font-display font-bold text-white leading-tight"
          initial={{ y: 50, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          Built for <span className="text-[var(--color-accent)]">Nigerian</span>
          <br />Medical Students
        </motion.h1>
      </div>
    </motion.div>
  );
}