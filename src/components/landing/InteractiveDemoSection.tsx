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

const BrandFlame = ({ size = 28, opacity = 1 }: { size?: number; opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="text-primary" style={{ opacity, filter: `drop-shadow(0 0 ${6 * opacity}px hsl(var(--primary) / ${0.4 * opacity}))` }}>
    <defs><filter id="td-fg"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g filter="url(#td-fg)">
      <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.45"/>
    </g>
  </svg>
);

const BrandStar = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="text-primary drop-shadow-[0_0_10px_hsl(var(--primary)/0.6)]">
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" fill="currentColor" opacity="0.3"/>
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
);

const TapDemo = () => {
  const [heat, setHeat] = useState(0);
  const [ripple, setRipple] = useState(false);
  const levels = ["match", "spark", "flame", "star"];

  const handleTap = () => {
    if (heat >= 4) return;
    setRipple(true);
    setTimeout(() => setRipple(false), 500);
    setHeat((h) => h + 1);
  };

  const opacityLevels = [0.35, 0.5, 0.75, 1];

  return (
    <motion.div
      onClick={handleTap}
      whileTap={{ scale: 0.97 }}
      className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer select-none border border-border/50"
    >
      <img src="/discover/sunset-pier.jpg" alt="Sunset signal" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/20 to-transparent" />
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
        {heat === 0 ? (
          <BrandFlame size={32} opacity={0.35} />
        ) : heat < 4 ? (
          <div className="flex gap-1">
            {Array.from({ length: heat }).map((_, i) => (
              <BrandFlame key={i} size={28} opacity={opacityLevels[heat - 1]} />
            ))}
          </div>
        ) : (
          <BrandStar size={36} />
        )}
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
    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-border/50">
      <img src="/discover/clouds-lake.jpg" alt="Lake signal" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/30 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-lg font-bold text-foreground/80 italic drop-shadow-lg">sunset vibes</p>
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
