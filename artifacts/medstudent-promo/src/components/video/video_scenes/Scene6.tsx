import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-dark)] overflow-hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 25 }}
    >
      <div className="absolute inset-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/student.jpg`} 
          className="absolute inset-0 w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-bg-dark)] via-[var(--color-bg-dark)] to-transparent opacity-90" />
      </div>

      <div className="relative z-10 text-center px-10 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] flex items-center justify-center text-white text-6xl font-bold font-display shadow-[0_0_50px_rgba(45,135,200,0.6)]">
            M
          </div>
        </motion.div>

        <motion.h1 
          className="text-[6vw] font-display font-bold text-white mb-4"
          initial={{ y: 30, opacity: 0 }}
          animate={phase >= 2 ? { y: 0, opacity: 1 } : { y: 30, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        >
          MedStudent
        </motion.h1>
        
        <motion.p
          className="text-[2vw] text-[var(--color-accent)] font-bold tracking-wide"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8, delay: phase >= 2 ? 0.3 : 0 }}
        >
          JOIN THE COMMUNITY TODAY.
        </motion.p>
      </div>
    </motion.div>
  );
}