import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const TIERS = ["match", "spark", "ignite", "flame", "hot"];

interface Props {
  onComplete: () => void;
}

const InteractiveHeatDemo = ({ onComplete }: Props) => {
  const [tierIndex, setTierIndex] = useState(0);
  const [taps, setTaps] = useState(0);
  const [showBurst, setShowBurst] = useState(false);

  const handleTap = () => {
    const newTaps = taps + 1;
    setTaps(newTaps);

    if (newTaps >= 3 && tierIndex < TIERS.length - 1) {
      const next = tierIndex + 1;
      setTierIndex(next);
      setTaps(0);
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 800);
      if (next >= 3) onComplete();
    }
  };

  const progress = Math.min(1, taps / 3);
  const tier = TIERS[tierIndex];

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        onClick={handleTap}
        whileTap={{ scale: 0.95 }}
        className="relative w-56 h-40 rounded-2xl overflow-hidden cursor-pointer select-none bg-gradient-to-br from-primary/15 via-secondary/30 to-primary/10 border border-primary/20"
      >
        {/* Fake signal */}
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-bold text-foreground/80 italic" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}>
            sunset vibes
          </p>
        </div>

        {/* Heat badge */}
        <motion.div
          key={tier}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
              fill="hsl(var(--primary))"
              opacity={0.4 + tierIndex * 0.15}
            />
          </svg>
          <span className="text-[9px] font-medium text-primary">{tier}</span>
        </motion.div>

        {/* Thermometer */}
        <div className="absolute bottom-2 left-3 right-3">
          <div className="h-1 rounded-full bg-primary/10 overflow-hidden">
            <motion.div
              animate={{ width: `${progress * 100}%` }}
              className="h-full rounded-full bg-primary"
              transition={{ duration: 0.3 }}
            />
          </div>
          {tierIndex < TIERS.length - 1 && (
            <p className="text-[7px] text-primary/40 text-right mt-0.5">
              → {TIERS[tierIndex + 1]}
            </p>
          )}
        </div>

        {/* Level-up burst */}
        <AnimatePresence>
          {showBurst && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1.5 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-20 h-20 rounded-full bg-primary/20 blur-xl" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/50">
        {tierIndex >= 3
          ? "you see how it works! 🔥"
          : `tap to add heat (${tier} → ${TIERS[tierIndex + 1]})`}
      </p>
    </div>
  );
};

export default InteractiveHeatDemo;
