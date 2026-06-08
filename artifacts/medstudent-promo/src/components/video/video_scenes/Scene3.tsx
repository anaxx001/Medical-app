import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1800),
      setTimeout(() => setPhase(4), 2600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--color-primary)] overflow-hidden"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.2, opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="absolute inset-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/community.jpg`} 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)] to-[var(--color-primary)] opacity-60" />
      </div>

      <div className="relative z-10 w-full px-16 flex items-center justify-between">
        <div className="w-[45%]">
          <motion.h2 
            className="text-[5vw] font-display font-bold text-white leading-tight mb-6"
            initial={{ x: -50, opacity: 0 }}
            animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: -50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          >
            Connect &<br />Collaborate
          </motion.h2>

          <motion.p 
            className="text-[2vw] text-white/80"
            initial={{ x: -30, opacity: 0 }}
            animate={phase >= 2 ? { x: 0, opacity: 1 } : { x: -30, opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            Join study groups, share clinical cases, and discuss notes with peers.
          </motion.p>
        </div>

        <div className="w-[45%] relative h-[60vh]">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-full bg-white rounded-xl shadow-xl p-4 flex gap-4 items-center"
              style={{ top: `${i * 35}%`, zIndex: 10 - i }}
              initial={{ x: 100, opacity: 0, rotate: -5 + i * 5 }}
              animate={phase >= 3 ? { x: 0, opacity: 1, rotate: 0 } : { x: 100, opacity: 0, rotate: -5 + i * 5 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: phase >= 3 ? i * 0.2 : 0 }}
            >
              <div className="w-12 h-12 rounded-full bg-[var(--color-accent)] flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
                <div className="h-2 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}