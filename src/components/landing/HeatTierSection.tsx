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

const BrandFlame = ({ size = 18, opacity = 1, className = "" }: { size?: number; opacity?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={`text-primary ${className}`} style={{ opacity }}>
    <defs><filter id={`hfg-${size}`}><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g filter={`url(#hfg-${size})`}>
      <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
      <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.45"/>
    </g>
  </svg>
);

const BrandStar = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className="text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" fill="currentColor" opacity="0.3"/>
    <path d="M16 4l3.5 8.5L28 14l-6.5 5.5L23 28l-7-4.5L9 28l1.5-8.5L4 14l8.5-1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none"/>
  </svg>
);

const tiers = [
  { name: "match",   opacity: 0.3,  color: "from-primary/15 to-primary/5",  glow: "",                    desc: "Just lit — 2h to prove itself" },
  { name: "spark",   opacity: 0.4,  color: "from-primary/20 to-primary/10", glow: "",                    desc: "Catching on" },
  { name: "ignite",  opacity: 0.5,  color: "from-primary/30 to-primary/15", glow: "shadow-primary/10",   desc: "People are noticing" },
  { name: "flame",   opacity: 0.6,  color: "from-primary/40 to-primary/20", glow: "shadow-primary/15",   desc: "Burning steady" },
  { name: "hot",     opacity: 0.7,  color: "from-primary/50 to-primary/25", glow: "shadow-primary/20",   desc: "Can't look away" },
  { name: "burning", opacity: 0.8,  color: "from-primary/60 to-primary/30", glow: "shadow-primary/25",   desc: "Spreading fast" },
  { name: "raging",  opacity: 0.85, color: "from-primary/70 to-primary/40", glow: "shadow-primary/30",   desc: "Wildfire energy" },
  { name: "inferno", opacity: 0.95, color: "from-primary/80 to-primary/50", glow: "shadow-primary/40",   desc: "Unstoppable" },
  { name: "star",    opacity: 1,    color: "from-primary/90 to-primary/60", glow: "shadow-primary/50",   desc: "Eternal — lives for 1 year", isStar: true },
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
              className="w-full h-full bg-gradient-to-b from-primary/10 via-primary/30 to-primary/70"
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
                  {/* Node */}
                  <div className="relative z-10 flex-shrink-0">
                    <motion.div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-lg ${tier.glow} border border-primary/20`}
                      animate={isHovered ? { scale: 1.15 } : { scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {'isStar' in tier && tier.isStar
                        ? <BrandStar size={20} />
                        : <BrandFlame size={20} opacity={tier.opacity} />
                      }
                    </motion.div>

                    {/* Pulse ring for star */}
                    {'isStar' in tier && tier.isStar && inView && (
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
