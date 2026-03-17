import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const signalTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const steps = [
  {
    title: "welcome to arura",
    subtitle: "life, briefly witnessed",
    body: "A place where moments burn bright and fade fast. Nothing lasts forever here — and that's the point.",
    icon: "🔥",
  },
  {
    title: "Drop",
    subtitle: "share something warm",
    body: "Record a 5-second video or snap a photo. Overlay a single word. Your Drop lives for 2 hours, then it's gone.",
    icon: "📸",
  },
  {
    title: "Indulge",
    subtitle: "see what's hot",
    body: "Watch Drops from Embers you've Ignited. Double-tap to Stitch a word reply — it appears right where you tapped.",
    icon: "✦",
  },
  {
    title: "Embers",
    subtitle: "your people, your fire",
    body: "Follow someone? You've Ignited them. Mutual follows? You've Sparked. The more you interact, the higher your Aura — and theirs.",
    icon: "🧡",
  },
  {
    title: "Words",
    subtitle: "say it in one word",
    body: "DMs are single words only. 12 characters max. No paragraphs, no novels — just a word that says it all.",
    icon: "💬",
  },
];

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding = ({ onComplete }: OnboardingProps) => {
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
          className="relative z-10 flex flex-col items-center gap-6 px-10 max-w-sm text-center"
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
