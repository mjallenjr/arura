import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const signalTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const steps = [
  {
    title: "welcome to arura",
    subtitle: "life, briefly witnessed",
    body: "A place where moments burn bright and fade fast. Nothing lasts forever here — and that's the point.",
    icon: "🔥",
    gesture: null,
  },
  {
    title: "Drop",
    subtitle: "share something warm",
    body: "Record a 5-second video or snap a photo. Overlay a single word. Your Drop lives for 2 hours, then it's gone.",
    icon: "📸",
    gesture: null,
  },
  {
    title: "Tap = Felt",
    subtitle: "feel the moment",
    body: "Single tap any signal to show you felt it. It's a pulse — no likes, no numbers, just energy.",
    icon: "✦",
    gesture: "tap",
  },
  {
    title: "Double-tap = Stitch",
    subtitle: "leave your mark",
    body: "Double-tap to place a word on their signal. It appears right where you tapped. Pinch to resize & rotate.",
    icon: "🧵",
    gesture: "double-tap",
  },
  {
    title: "Embers",
    subtitle: "your people, your fire",
    body: "Follow someone? You've Ignited them. Mutual follows? You've Sparked. The more you interact, the higher your Aura.",
    icon: "🧡",
    gesture: null,
  },
  {
    title: "Words",
    subtitle: "say it in one word",
    body: "DMs are single words only. 12 characters max. No paragraphs, no novels — just a word that says it all.",
    icon: "💬",
    gesture: null,
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const GestureDemo = ({ type }: { type: "tap" | "double-tap" }) => {
  const [showRipple, setShowRipple] = useState(false);
  const [showSecondRipple, setShowSecondRipple] = useState(false);
  const [showWord, setShowWord] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowRipple(true);
      if (type === "double-tap") {
        setTimeout(() => setShowSecondRipple(true), 200);
        setTimeout(() => setShowWord(true), 500);
        setTimeout(() => { setShowWord(false); setShowSecondRipple(false); }, 2000);
      }
      setTimeout(() => setShowRipple(false), 800);
    }, 3000);

    // Trigger immediately
    setShowRipple(true);
    if (type === "double-tap") {
      setTimeout(() => setShowSecondRipple(true), 200);
      setTimeout(() => setShowWord(true), 500);
      setTimeout(() => { setShowWord(false); setShowSecondRipple(false); }, 2000);
    }
    setTimeout(() => setShowRipple(false), 800);

    return () => clearInterval(interval);
  }, [type]);

  return (
    <div className="relative w-48 h-32 rounded-2xl signal-surface overflow-hidden flex items-center justify-center">
      {/* Fake signal background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />

      {/* Finger indicator */}
      <motion.div
        animate={{ scale: showRipple ? [1, 0.8, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10"
      >
        <div className="w-8 h-8 rounded-full bg-foreground/20 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/60">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
          </svg>
        </div>
      </motion.div>

      {/* Ripple effect */}
      <AnimatePresence>
        {showRipple && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-primary/40"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.6 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Second ripple for double-tap */}
      <AnimatePresence>
        {showSecondRipple && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-12 h-12 rounded-full border-2 border-accent/40"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.8 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stitch word appearing */}
      <AnimatePresence>
        {showWord && (
          <motion.p
            className="absolute text-sm font-bold text-primary italic"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{ textShadow: "0 0 10px hsl(var(--primary) / 0.4)" }}
          >
            wander
          </motion.p>
        )}
      </AnimatePresence>

      {/* Label */}
      <div className="absolute bottom-2 left-0 right-0 text-center">
        <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
          {type === "tap" ? "single tap" : "double tap"}
        </span>
      </div>
    </div>
  );
};

const Onboarding = React.forwardRef<HTMLDivElement, OnboardingProps>(({ onComplete }, ref) => {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Progress dots */}
      <div className="absolute top-12 flex gap-2">
        {steps.map((_, i) => (
          <motion.div
            key={i}
            className={`h-1.5 rounded-full signal-ease ${
              i <= step ? "bg-primary w-6" : "bg-muted w-1.5"
            }`}
            layout
            transition={signalTransition}
          />
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={signalTransition}
          className="relative z-10 flex flex-col items-center gap-5 px-10 max-w-sm text-center"
        >
          <motion.span
            className="text-5xl"
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...signalTransition, delay: 0.1 }}
          >
            {current.icon}
          </motion.span>

          <div className="flex flex-col items-center gap-2">
            <h2 className="text-2xl font-medium tracking-[-0.04em] text-foreground">
              {current.title}
            </h2>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
              {current.subtitle}
            </p>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {current.body}
          </p>

          {/* Interactive gesture demo */}
          {current.gesture && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2"
            >
              <GestureDemo type={current.gesture as "tap" | "double-tap"} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="absolute bottom-16 flex flex-col items-center gap-4 w-full px-10 max-w-sm">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (isLast) {
              onComplete();
            } else {
              setStep((s) => s + 1);
            }
          }}
          className="w-full rounded-2xl bg-primary px-8 py-4 text-sm font-medium text-primary-foreground signal-glow signal-ease"
        >
          {isLast ? "Let's go" : "Next"}
        </motion.button>

        {!isLast && (
          <button
            onClick={onComplete}
            className="text-xs text-muted-foreground/50 signal-ease hover:text-muted-foreground"
          >
            skip intro
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default Onboarding;
