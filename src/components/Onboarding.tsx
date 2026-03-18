import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveTapDemo from "@/components/onboarding/InteractiveTapDemo";
import InteractiveStitchDemo from "@/components/onboarding/InteractiveStitchDemo";
import InteractiveDropDemo from "@/components/onboarding/InteractiveDropDemo";
import InteractiveHeatDemo from "@/components/onboarding/InteractiveHeatDemo";
import InviteStep from "@/components/onboarding/InviteStep";

const signalTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const BlueFlame = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="text-primary flame-glow">
    <defs>
      <filter id="flameGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#flameGlow)">
      <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.4" />
    </g>
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

interface Step {
  title: string;
  subtitle: string;
  body: string;
  interactive?: "flare" | "tap" | "stitch" | "heat" | "invite";
}

const steps: Step[] = [
  {
    title: "welcome to arura",
    subtitle: "life, briefly witnessed",
    body: "A place where moments burn bright and fade fast. Nothing lasts forever here — and that's the point.",
  },
  {
    title: "Flare",
    subtitle: "shoot something warm",
    body: "Record a 5-second video or snap a photo. Overlay a single word. Your Flare lives for 2 hours, then it's gone.",
    interactive: "flare",
  },
  {
    title: "Tap = Felt",
    subtitle: "feel the moment",
    body: "Single tap the signal below to show you felt it. No likes, no numbers — just energy.",
    interactive: "tap",
  },
  {
    title: "Double-tap = Stitch",
    subtitle: "leave your mark",
    body: "Double-tap the signal below to place a word. Pinch to resize & rotate it.",
    interactive: "stitch",
  },
  {
    title: "Keep It Lit",
    subtitle: "heat rises with engagement",
    body: "Every felt, stitch, and view adds heat. Watch signals climb from match → spark → flame → star. You can even rekindle a dying drop.",
    interactive: "heat",
  },
  {
    title: "Embers",
    subtitle: "your people, your fire",
    body: "Follow someone? You've Ignited them. Mutual follows? You've Sparked. The more you interact, the higher your Aura.",
  },
  {
    title: "Words",
    subtitle: "keep it brief",
    body: "DMs are 10 words max. No paragraphs, no novels — just enough to say what matters.",
  },
  {
    title: "Bring Your People",
    subtitle: "the fire spreads",
    body: "Invite 3 friends to earn your First Spark reward — bonus heat on every flare you drop.",
    interactive: "invite",
  },
];

const stepIcons: Record<number, React.ReactNode> = {
  0: <BlueFlame size={44} />,
  4: <EmbersIcon />,
  5: <WordIcon />,
};

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = React.forwardRef<HTMLDivElement, OnboardingProps>(({ onComplete }, ref) => {
  const [step, setStep] = useState(0);
  const [interactionDone, setInteractionDone] = useState(false);
  const current = steps[step];
  const isLast = step === steps.length - 1;
  // Invite step is never blocking — let users explore before committing
  const needsInteraction = !!current.interactive && current.interactive !== "invite" && !interactionDone;

  const goNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setInteractionDone(false);
      setStep((s) => s + 1);
    }
  };

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
          className="relative z-10 flex flex-col items-center gap-4 px-10 max-w-sm text-center"
        >
          {/* Icon (non-interactive steps only) */}
          {stepIcons[step] && (
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ ...signalTransition, delay: 0.1 }}
            >
              {stepIcons[step]}
            </motion.div>
          )}

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

          {/* Interactive demos */}
          {current.interactive === "flare" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2"
            >
              <InteractiveDropDemo onComplete={() => setInteractionDone(true)} />
            </motion.div>
          )}

          {current.interactive === "tap" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2"
            >
              <InteractiveTapDemo onComplete={() => setInteractionDone(true)} />
            </motion.div>
          )}

          {current.interactive === "stitch" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2"
            >
              <InteractiveStitchDemo onComplete={() => setInteractionDone(true)} />
            </motion.div>
          )}

          {current.interactive === "heat" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2"
            >
              <InteractiveHeatDemo onComplete={() => setInteractionDone(true)} />
            </motion.div>
          )}

          {current.interactive === "invite" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="mt-2 w-full"
            >
              <InviteStep onComplete={() => setInteractionDone(true)} />
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="absolute bottom-16 flex flex-col items-center gap-4 w-full px-10 max-w-sm">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={goNext}
          className={`w-full rounded-2xl px-8 py-4 text-sm font-medium signal-ease transition-all ${
            needsInteraction
              ? "bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground signal-glow"
          }`}
        >
          {needsInteraction
            ? "Try it above ↑"
            : isLast
            ? "Let's go"
            : "Next"}
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
