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

const BrandFlameInline = ({ opacity = 0.7 }: { opacity?: number }) => (
  <svg width="14" height="14" viewBox="0 0 32 32" fill="none" className="text-primary inline-block" style={{ opacity }}>
    <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const BrandStarInline = () => (
  <svg width="14" height="14" viewBox="0 0 32 32" fill="none" className="text-primary inline-block drop-shadow-[0_0_4px_hsl(var(--primary)/0.5)]">
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" fill="currentColor" opacity="0.3"/>
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
);

const heatIcons: Record<string, React.ReactNode> = {
  match: <BrandFlameInline opacity={0.35} />,
  spark: <BrandFlameInline opacity={0.55} />,
  flame: <BrandFlameInline opacity={0.75} />,
  star: <BrandStarInline />,
};

const sampleSignals = [
  { id: 1, user: "ember.luna", caption: "golden hour", img: "/discover/sunset-pier.jpg", heat: "flame", timeLeft: "1h 42m", stitch: "magic" },
  { id: 2, user: "kai.drift", caption: "3am thoughts", img: "/discover/clouds-lake.jpg", heat: "spark", timeLeft: "47m", stitch: null },
  { id: 3, user: "sol.flare", caption: "first snow", img: "/discover/waterfall.jpg", heat: "star", timeLeft: "12m", stitch: "perfect" },
  { id: 4, user: "fern.glow", caption: "late night ramen", img: "/discover/river-autumn.jpg", heat: "match", timeLeft: "1h 58m", stitch: null },
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
                      {heatIcons[signal.heat]}
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
