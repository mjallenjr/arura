import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeltEffect from "@/components/FeltEffect";

interface FeedViewProps {
  onEnd: () => void;
}

const SIGNAL_DURATION = 5000; // 5 seconds per signal

// Simulated signals with color gradients as placeholders
const MOCK_SIGNALS = [
  { id: "1", name: "kai", gradient: "from-[hsl(220,30%,8%)] via-[hsl(200,25%,12%)] to-[hsl(180,20%,6%)]" },
  { id: "2", name: "ren", gradient: "from-[hsl(250,20%,8%)] via-[hsl(230,25%,10%)] to-[hsl(210,20%,6%)]" },
  { id: "3", name: "sol", gradient: "from-[hsl(30,20%,8%)] via-[hsl(20,25%,10%)] to-[hsl(10,15%,6%)]" },
  { id: "4", name: "lux", gradient: "from-[hsl(170,20%,8%)] via-[hsl(190,25%,10%)] to-[hsl(210,20%,6%)]" },
  { id: "5", name: "arc", gradient: "from-[hsl(280,15%,8%)] via-[hsl(260,20%,10%)] to-[hsl(240,15%,6%)]" },
];

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const FeedView = ({ onEnd }: FeedViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [feltEffects, setFeltEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [ended, setEnded] = useState(false);
  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);

  const advanceSignal = useCallback(() => {
    if (currentIndex < MOCK_SIGNALS.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      setEnded(true);
    }
  }, [currentIndex]);

  useEffect(() => {
    if (ended) return;

    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(1, elapsed / SIGNAL_DURATION);
      setProgress(p);

      if (p >= 1) {
        advanceSignal();
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, [currentIndex, ended, advanceSignal]);

  const handleFelt = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x: number, y: number;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const id = `${Date.now()}-${Math.random()}`;
    setFeltEffects((prev) => [...prev, { id, x, y }]);

    setTimeout(() => {
      setFeltEffects((prev) => prev.filter((f) => f.id !== id));
    }, 700);
  }, []);

  if (ended) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...signalTransition, delay: 0.3 }}
        className="flex h-full flex-col items-center justify-center gap-8 p-8"
      >
        <p className="display-signal text-center">You're all caught up.</p>
        <p className="text-sm text-muted-foreground">Go live something.</p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onEnd}
          className="mt-4 signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease"
        >
          Return
        </motion.button>
      </motion.div>
    );
  }

  const signal = MOCK_SIGNALS[currentIndex];

  return (
    <div className="relative h-full w-full" onClick={handleFelt}>
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
        {MOCK_SIGNALS.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{
                width:
                  i < currentIndex
                    ? "100%"
                    : i === currentIndex
                    ? `${progress * 100}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Signal content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={signal.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={`absolute inset-0 bg-gradient-to-br ${signal.gradient}`}
        >
          {/* Simulated video texture */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Name overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
        <motion.p
          key={signal.name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={signalTransition}
          className="label-signal"
        >
          {signal.name}
        </motion.p>
      </div>

      {/* Counter */}
      <div className="absolute right-8 top-12 z-10">
        <p className="label-signal">
          {currentIndex + 1}/{MOCK_SIGNALS.length}
        </p>
      </div>

      {/* Felt effects */}
      {feltEffects.map((felt) => (
        <FeltEffect key={felt.id} x={felt.x} y={felt.y} />
      ))}
    </div>
  );
};

export default FeedView;
