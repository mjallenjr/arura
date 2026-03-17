import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const InteractiveTapDemo = ({ onComplete }: Props) => {
  const [felt, setFelt] = useState(false);
  const [showRipple, setShowRipple] = useState(false);

  const handleTap = () => {
    if (felt) return;
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 600);
    setFelt(true);
    onComplete();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        onClick={handleTap}
        whileTap={{ scale: 0.97 }}
        className="relative w-56 h-36 rounded-2xl overflow-hidden cursor-pointer select-none"
      >
        {/* Fake signal card */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/40 to-accent/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-bold text-foreground/80 italic" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}>
            golden hour
          </p>
        </div>

        {/* Bottom label */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            ember.luna
          </span>
        </div>

        {/* Ripple */}
        <AnimatePresence>
          {showRipple && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full border-2 border-primary/50"
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.6 }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Felt badge */}
        <AnimatePresence>
          {felt && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute top-2 right-2 bg-primary/20 rounded-full px-2 py-0.5"
            >
              <span className="text-[10px] text-primary font-medium">felt ✦</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <p className="text-[10px] text-muted-foreground/50">
        {felt ? "you felt it ✦" : "tap the signal"}
      </p>
    </div>
  );
};

export default InteractiveTapDemo;
