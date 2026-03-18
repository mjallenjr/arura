import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const InteractiveDropDemo = ({ onComplete }: Props) => {
  const [held, setHeld] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recorded, setRecorded] = useState(false);
  const [intervalId, setIntervalId] = useState<number | null>(null);

  const startHold = () => {
    if (recorded) return;
    setHeld(true);
    setCountdown(3);
    let remaining = 3;
    const id = window.setInterval(() => {
      remaining -= 0.1;
      setCountdown(Math.max(0, remaining));
      if (remaining <= 0) {
        clearInterval(id);
        setHeld(false);
        setRecorded(true);
        onComplete();
      }
    }, 100);
    setIntervalId(id);
  };

  const stopHold = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    setHeld(false);
    if (!recorded) setCountdown(3);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Fake viewfinder */}
      <div className="relative w-56 h-36 rounded-2xl overflow-hidden bg-secondary/50">
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/5 to-foreground/10" />
        
        {held && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          >
            <motion.div
              className="h-3 w-3 rounded-full bg-destructive"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <p className="font-mono text-2xl font-light text-foreground tabular-nums">
              {countdown.toFixed(1)}
            </p>
          </motion.div>
        )}

        {!held && !recorded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xs text-muted-foreground/60">viewfinder</p>
          </div>
        )}

        <AnimatePresence>
          {recorded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">✦</span>
                <p className="text-xs text-primary font-medium">signal captured</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Shutter button */}
      {!recorded && (
        <motion.button
          onPointerDown={startHold}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          whileTap={{ scale: 0.92 }}
          className="relative h-16 w-16 flex items-center justify-center"
        >
          <div className={`absolute inset-0 rounded-full border-[3px] transition-colors ${held ? "border-destructive" : "border-foreground/60"}`} />
          <motion.div
            animate={{ scale: held ? 0.7 : 1 }}
            className={`h-12 w-12 rounded-full transition-colors ${held ? "bg-destructive" : "bg-foreground/80"}`}
          />
        </motion.button>
      )}

      <p className="text-[10px] text-muted-foreground/50">
        {recorded ? "nice! you shot a flare" : "hold the shutter to record"}
      </p>
    </div>
  );
};

export default InteractiveDropDemo;
