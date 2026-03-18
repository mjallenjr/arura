import { motion } from "framer-motion";
import { useState, useEffect } from "react";

interface LevelUpCelebrationProps {
  /** Set to true to trigger the animation */
  trigger: boolean;
  newLevel: string;
}

const PARTICLE_COUNT = 12;

const LevelUpCelebration = ({ trigger, newLevel }: LevelUpCelebrationProps) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      const t = setTimeout(() => setShow(false), 1500);
      return () => clearTimeout(t);
    }
  }, [trigger]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden" role="status" aria-live="assertive">
      <span className="sr-only">Level up! You reached {newLevel}</span>
      {/* Radial flash */}
      <motion.div
        initial={{ opacity: 0.6, scale: 0.3 }}
        animate={{ opacity: 0, scale: 2.5 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
        }}
      />

      {/* Particles */}
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (i / PARTICLE_COUNT) * 360;
        const distance = 60 + Math.random() * 80;
        const rad = (angle * Math.PI) / 180;
        const tx = Math.cos(rad) * distance;
        const ty = Math.sin(rad) * distance;
        const size = 3 + Math.random() * 4;
        const delay = Math.random() * 0.15;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={{ opacity: 0, x: tx, y: ty, scale: 0 }}
            transition={{ duration: 0.8 + Math.random() * 0.4, delay, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 rounded-full"
            style={{
              width: size,
              height: size,
              background: `hsl(var(--primary))`,
              boxShadow: `0 0 ${size * 2}px hsl(var(--primary) / 0.6)`,
              marginLeft: -size / 2,
              marginTop: -size / 2,
            }}
          />
        );
      })}

      {/* Level name flash */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.1, 1, 0.9], y: [20, -10, -10, -30] }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1"
      >
        <span className="text-[10px] font-medium text-primary/70 uppercase tracking-[0.15em]">
          level up
        </span>
        <span className="text-lg font-bold text-primary tracking-wide"
          style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.5)" }}
        >
          {newLevel}
        </span>
      </motion.div>
    </div>
  );
};

export default LevelUpCelebration;
