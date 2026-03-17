import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  onComplete: () => void;
}

const SUGGESTIONS = ["wander", "golden", "vibe", "dreamy", "warmth"];

const InteractiveStitchDemo = ({ onComplete }: Props) => {
  const [doubleTapped, setDoubleTapped] = useState(false);
  const [word, setWord] = useState("");
  const [placed, setPlaced] = useState(false);
  const [tapPos, setTapPos] = useState({ x: 50, y: 50 });
  const lastTapRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (placed) return;
    const now = Date.now();
    if (now - lastTapRef.current < 400) {
      // Double tap detected
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        setTapPos({
          x: ((clientX - rect.left) / rect.width) * 100,
          y: ((clientY - rect.top) / rect.height) * 100,
        });
      }
      setDoubleTapped(true);
    }
    lastTapRef.current = now;
  };

  const placeWord = (w: string) => {
    setWord(w);
    setPlaced(true);
    onComplete();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <motion.div
        ref={containerRef}
        onClick={handleTap}
        className="relative w-56 h-36 rounded-2xl overflow-hidden cursor-pointer select-none"
      >
        {/* Fake signal card */}
        <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 via-secondary/40 to-primary/20" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg font-bold text-foreground/80 italic" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}>
            first light
          </p>
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            ember.kai
          </span>
        </div>

        {/* Placed stitch word */}
        <AnimatePresence>
          {placed && word && (
            <motion.p
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute text-sm font-bold text-primary italic pointer-events-none"
              style={{
                left: `${tapPos.x}%`,
                top: `${tapPos.y}%`,
                transform: "translate(-50%, -50%)",
                textShadow: "0 0 10px hsl(var(--primary) / 0.4)",
              }}
            >
              {word}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Word picker after double-tap */}
      <AnimatePresence>
        {doubleTapped && !placed && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="flex flex-wrap gap-2 justify-center max-w-[240px]"
          >
            {SUGGESTIONS.map((w) => (
              <motion.button
                key={w}
                whileTap={{ scale: 0.9 }}
                onClick={() => placeWord(w)}
                className="rounded-full bg-primary/15 px-3 py-1.5 text-xs font-medium text-primary signal-ease hover:bg-primary/25"
              >
                {w}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-[10px] text-muted-foreground/50">
        {placed ? "stitched ✦" : doubleTapped ? "pick a word to stitch" : "double-tap the signal"}
      </p>
    </div>
  );
};

export default InteractiveStitchDemo;
