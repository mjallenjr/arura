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

const sampleSignals = [
  { id: 1, user: "ember.luna", caption: "golden hour", gradient: "from-amber-500/20 via-orange-400/15 to-rose-500/10", heat: "flame", emoji: "🔥", timeLeft: "1h 42m", stitch: "magic" },
  { id: 2, user: "kai.drift", caption: "3am thoughts", gradient: "from-indigo-500/20 via-purple-400/15 to-blue-500/10", heat: "spark", emoji: "✨", timeLeft: "47m", stitch: null },
  { id: 3, user: "sol.flare", caption: "first snow", gradient: "from-sky-500/20 via-cyan-400/15 to-teal-500/10", heat: "⭐", emoji: "⭐", timeLeft: "12m", stitch: "perfect" },
  { id: 4, user: "fern.glow", caption: "late night ramen", gradient: "from-rose-500/20 via-pink-400/15 to-fuchsia-500/10", heat: "match", emoji: "🔥", timeLeft: "1h 58m", stitch: null },
];

const TeaserFeedSection = () => {
  const [active, setActive] = useState(0);
  const signal = sampleSignals[active];

  return (
    <section className="py-24 px-6 border-t border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">Preview</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-4">
            A taste of the feed.
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-10 max-w-sm mx-auto">
            Swipe through sample signals. In the real app, these would vanish in 2 hours.
          </p>
        </FadeIn>

        <FadeIn delay={0.1}>
          {/* Phone frame */}
          <div className="mx-auto max-w-[280px]">
            <div className="rounded-[2rem] border-2 border-border/50 bg-card/50 p-2 shadow-2xl shadow-primary/5">
              <div className="rounded-[1.5rem] overflow-hidden bg-background">
                {/* Status bar */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-[9px] text-muted-foreground/50 font-medium">arura</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-primary/40" />
                    <div className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                  </div>
                </div>

                {/* Signal card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={signal.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.3, ease }}
                    className={`aspect-[9/14] bg-gradient-to-br ${signal.gradient} relative`}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-xl font-bold text-foreground/70 italic text-center px-6" style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.2)" }}>
                        {signal.caption}
                      </p>
                    </div>

                    {/* Heat badge */}
                    <div className="absolute top-3 right-3 bg-background/60 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
                      <span className="text-xs">{signal.emoji}</span>
                      <span className="text-[10px] font-medium text-foreground/70">{signal.heat}</span>
                    </div>

                    {/* Timer */}
                    <div className="absolute top-3 left-3 bg-background/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-medium text-muted-foreground">{signal.timeLeft}</span>
                    </div>

                    {/* Stitch overlay */}
                    {signal.stitch && (
                      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 rotate-[-3deg]">
                        <span className="text-xs font-bold text-primary bg-primary/10 backdrop-blur-sm px-2 py-0.5 rounded-md">
                          {signal.stitch}
                        </span>
                      </div>
                    )}

                    {/* User */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/30" />
                      <span className="text-[10px] font-medium text-foreground/70">{signal.user}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Navigation dots */}
                <div className="flex items-center justify-center gap-2 py-3">
                  {sampleSignals.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === active ? "bg-primary w-5" : "bg-muted-foreground/20 hover:bg-muted-foreground/40"}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
};

export default TeaserFeedSection;
