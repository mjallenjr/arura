import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";

const ease = [0.2, 0.8, 0.2, 1] as const;

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 24 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease, delay }} className={className}>
      {children}
    </motion.div>
  );
};

const TapDemo = () => {
  const [heat, setHeat] = useState(0);
  const [ripple, setRipple] = useState(false);
  const levels = ["match", "spark", "flame", "⭐"];

  const handleTap = () => {
    if (heat >= 4) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    setHeat((h) => h + 1);
  };

  return (
    <motion.div
      onClick={handleTap}
      whileTap={{ scale: 0.97 }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer select-none bg-gradient-to-br from-primary/15 via-secondary/30 to-accent/15 border border-border/50"
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        <span className="text-3xl">{heat === 0 ? "🔥" : heat < 4 ? "🔥".repeat(heat) : "⭐"}</span>
        <p className="text-xs font-medium text-foreground/80">
          {heat === 0 ? "Tap to feel it" : heat < 4 ? levels[heat - 1] : "blazing"}
        </p>
      </div>
      <AnimatePresence>
        {ripple && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              className="w-16 h-16 rounded-full border-2 border-primary/40"
              initial={{ scale: 0.3, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute top-2 right-2">
        <div className="flex gap-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${i < heat ? "bg-primary" : "bg-muted-foreground/20"}`} />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const StitchDemo = () => {
  const [word, setWord] = useState("");
  const [placed, setPlaced] = useState(false);

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-accent/15 via-primary/10 to-secondary/20 border border-border/50">
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-lg font-bold text-foreground/60 italic">sunset vibes</p>
      </div>
      {placed && word && (
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2"
        >
          <span className="text-sm font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg backdrop-blur-sm">
            {word}
          </span>
        </motion.div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex gap-2">
        <input
          type="text"
          maxLength={12}
          placeholder="your word..."
          value={word}
          onChange={(e) => { setWord(e.target.value); setPlaced(false); }}
          className="flex-1 text-xs bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          onClick={() => word && setPlaced(true)}
          disabled={!word}
          className="text-xs font-medium text-primary-foreground bg-primary rounded-lg px-3 py-1.5 disabled:opacity-30"
        >
          Stitch
        </button>
      </div>
    </div>
  );
};

const DMDemo = () => {
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const wordCount = msg.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-secondary/15 via-accent/10 to-primary/15 border border-border/50 flex flex-col justify-end p-3">
      {sent ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end mb-2">
          <span className="text-xs bg-primary/20 text-primary rounded-xl px-3 py-1.5 font-medium">{msg}</span>
        </motion.div>
      ) : (
        <div className="mb-2 text-center">
          <p className="text-xs text-muted-foreground/50">10 words max. Say what matters.</p>
        </div>
      )}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          maxLength={80}
          placeholder="say something brief..."
          value={msg}
          onChange={(e) => { setMsg(e.target.value); setSent(false); }}
          className="flex-1 text-xs bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <span className={`text-[10px] tabular-nums ${wordCount > 10 ? "text-destructive" : "text-muted-foreground/50"}`}>{wordCount}/10</span>
        <button
          onClick={() => msg.trim() && wordCount <= 10 && setSent(true)}
          disabled={!msg.trim() || wordCount > 10}
          className="text-xs font-medium text-primary-foreground bg-primary rounded-lg px-3 py-1.5 disabled:opacity-30"
        >
          Send
        </button>
      </div>
    </div>
  );
};

const InteractiveDemoSection = () => (
  <section className="py-24 px-6 border-t border-border/50">
    <div className="max-w-4xl mx-auto">
      <FadeIn>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">Try it now</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-4">
          Feel it before you join.
        </h2>
        <p className="text-sm text-muted-foreground text-center mb-12 max-w-md mx-auto">
          These aren't screenshots — they're real interactions. Tap, type, explore.
        </p>
      </FadeIn>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <FadeIn delay={0}>
          <div className="space-y-3">
            <TapDemo />
            <h3 className="text-sm font-semibold text-foreground">Feel the heat</h3>
            <p className="text-xs text-muted-foreground">Tap to raise the heat level. No likes — just energy.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.12}>
          <div className="space-y-3">
            <StitchDemo />
            <h3 className="text-sm font-semibold text-foreground">Stitch a word</h3>
            <p className="text-xs text-muted-foreground">Leave your mark on any signal with a single word.</p>
          </div>
        </FadeIn>
        <FadeIn delay={0.24}>
          <div className="space-y-3">
            <DMDemo />
            <h3 className="text-sm font-semibold text-foreground">Brief DMs</h3>
            <p className="text-xs text-muted-foreground">10 words max. No essays, no noise — just meaning.</p>
          </div>
        </FadeIn>
      </div>
    </div>
  </section>
);

export default InteractiveDemoSection;
