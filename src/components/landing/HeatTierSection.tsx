import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

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

const tiers = [
  { name: "match",   emoji: "🔥", color: "from-muted-foreground/40 to-muted-foreground/20", glow: "", desc: "Just lit — 2h to prove itself" },
  { name: "spark",   emoji: "🔥", color: "from-amber-800/50 to-amber-900/30", glow: "", desc: "Catching on" },
  { name: "ignite",  emoji: "🔥", color: "from-amber-700/60 to-orange-800/40", glow: "shadow-amber-900/20", desc: "People are noticing" },
  { name: "flame",   emoji: "🔥", color: "from-orange-600/60 to-amber-700/40", glow: "shadow-orange-800/30", desc: "Burning steady" },
  { name: "hot",     emoji: "🔥", color: "from-orange-500/70 to-red-600/50", glow: "shadow-orange-600/30", desc: "Can't look away" },
  { name: "burning", emoji: "🔥", color: "from-red-500/70 to-orange-500/50", glow: "shadow-red-500/30", desc: "Spreading fast" },
  { name: "raging",  emoji: "🔥", color: "from-red-500/80 to-rose-500/60", glow: "shadow-red-500/40", desc: "Wildfire energy" },
  { name: "inferno", emoji: "🔥", color: "from-rose-500/80 to-red-400/70", glow: "shadow-rose-500/50", desc: "Unstoppable" },
  { name: "star",    emoji: "⭐", color: "from-primary/80 to-primary/50", glow: "shadow-primary/40", desc: "Eternal — lives for 1 year" },
];

const HeatTierSection = () => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="py-24 px-6 border-t border-border/50 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto">
        <FadeIn>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">The heat ladder</p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-3">
            Keep it lit.
          </h2>
          <p className="text-sm text-muted-foreground text-center mb-14 max-w-md mx-auto">
            Every signal starts as a match. Engage it and it climbs. Ignore it and it dies. Only the hottest reach ⭐&nbsp;star.
          </p>
        </FadeIn>

        {/* Tier progression */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-5 sm:left-6 top-0 bottom-0 w-px">
            <motion.div
              className="w-full h-full bg-gradient-to-b from-muted-foreground/20 via-orange-500/30 via-red-500/40 to-primary/60"
              initial={{ scaleY: 0 }}
              animate={inView ? { scaleY: 1 } : {}}
              transition={{ duration: 1.2, ease }}
              style={{ transformOrigin: "top" }}
            />
          </div>

          <div className="space-y-1">
            {tiers.map((tier, i) => {
              const isHovered = hoveredIdx === i;
              const intensity = i / (tiers.length - 1);

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, ease, delay: i * 0.08 }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  onClick={() => setHoveredIdx(isHovered ? null : i)}
                  className="relative flex items-center gap-4 pl-1 cursor-pointer group"
                >
                  {/* Node dot */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg ${tier.glow} border border-border/30`}
                      animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <span className="text-base sm:text-lg">{tier.emoji}</span>
                    </motion.div>

                    {/* Pulse ring for star */}
                    {i === tiers.length - 1 && inView && (
                      <motion.div
                        className="absolute inset-0 rounded-full border border-primary/40"
                        animate={{ scale: [1, 1.6, 1.6], opacity: [0.6, 0, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                      />
                    )}
                  </div>

                  {/* Label */}
                  <div className="flex-1 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{tier.name}</span>
                      {/* Heat bar */}
                      <div className="flex-1 max-w-[120px] h-1 rounded-full bg-border/30 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full bg-gradient-to-r ${tier.color}`}
                          initial={{ width: 0 }}
                          animate={inView ? { width: `${(intensity * 100).toFixed(0)}%` } : {}}
                          transition={{ duration: 0.6, ease, delay: 0.3 + i * 0.08 }}
                        />
                      </div>
                    </div>

                    {/* Description - show on hover/tap */}
                    <motion.div
                      initial={false}
                      animate={{ height: isHovered ? "auto" : 0, opacity: isHovered ? 1 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="text-xs text-muted-foreground mt-1">{tier.desc}</p>
                    </motion.div>
                  </div>

                  {/* Tier number */}
                  <span className="text-[10px] tabular-nums text-muted-foreground/40 font-mono flex-shrink-0 w-4 text-right">
                    {i + 1}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeatTierSection;
