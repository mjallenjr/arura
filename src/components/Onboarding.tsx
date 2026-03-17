import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const signalTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const BlueFlame = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="text-primary">
    {/* Sleek curved horns */}
    <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
    {/* Flame body */}
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Inner flame */}
    <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.4" />
  </svg>
);

const CameraIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
    <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const StitchIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
    <path d="M4 4l16 16M20 4L4 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M2 12h20M12 2v20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
  </svg>
);

const EmbersIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
    <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
    <path d="M1 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
    <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
    <path d="M19 13c2.21.636 4 2.247 4 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const WordIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-primary">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
    <path d="M8 10h8M8 14h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

const stepIcons = [
  <BlueFlame size={44} />,
  <CameraIcon />,
  <span className="text-primary text-4xl font-bold">✦</span>,
  <StitchIcon />,
  <EmbersIcon />,
  <WordIcon />,
];

const steps = [
  {
    title: "welcome to arura",
    subtitle: "life, briefly witnessed",
    body: "A place where moments burn bright and fade fast. Nothing lasts forever here — and that's the point.",
    gesture: null,
  },
  {
    title: "Drop",
    subtitle: "share something warm",
    body: "Record a 5-second video or snap a photo. Overlay a single word. Your Drop lives for 2 hours, then it's gone.",
    gesture: null,
  },
  {
    title: "Tap = Felt",
    subtitle: "feel the moment",
    body: "Single tap any signal to show you felt it. It's a pulse — no likes, no numbers, just energy.",
    gesture: "tap" as const,
  },
  {
    title: "Double-tap = Stitch",
    subtitle: "leave your mark",
    body: "Double-tap to place a word on their signal. It appears right where you tapped. Pinch to resize & rotate.",
    gesture: "double-tap" as const,
  },
  {
    title: "Embers",
    subtitle: "your people, your fire",
    body: "Follow someone? You've Ignited them. Mutual follows? You've Sparked. The more you interact, the higher your Aura.",
    gesture: null,
  },
  {
    title: "Words",
    subtitle: "say it in one word",
    body: "DMs are single words only. 12 characters max. No paragraphs, no novels — just a word that says it all.",
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
      ref={ref}
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
          <motion.div
            initial={{ scale: 0.5, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...signalTransition, delay: 0.1 }}
          >
            {stepIcons[step]}
          </motion.div>

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
});

Onboarding.displayName = "Onboarding";

export default Onboarding;
