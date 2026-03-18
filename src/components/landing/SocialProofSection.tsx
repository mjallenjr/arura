import { useRef } from "react";
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

const BrandFlameSmall = ({ opacity = 0.7 }: { opacity?: number }) => (
  <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="text-primary" style={{ opacity }}>
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const testimonials = [
  { quote: "Finally an app that doesn't make me perform.", name: "luna.ember", opacity: 0.5 },
  { quote: "I actually talk to people now instead of scrolling.", name: "kai.drift", opacity: 0.6 },
  { quote: "The 2-hour expiry changed how I share moments.", name: "sol.flare", opacity: 0.8 },
  { quote: "10-word DMs hit different. Every word counts.", name: "fern.glow", opacity: 1 },
];

const stats = [
  { value: "5s", label: "max signal length" },
  { value: "2h", label: "until it's gone" },
  { value: "10", label: "word DM limit" },
  { value: "0", label: "follower counts" },
];

const SocialProofSection = () => (
  <section className="py-24 px-6 border-t border-border/50 relative overflow-hidden">
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px]" />
    </div>

    <div className="relative z-10 max-w-5xl mx-auto">
      <FadeIn>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">Voices</p>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-14">
          What early embers are saying.
        </h2>
      </FadeIn>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-14">
        {stats.map((s, i) => (
          <FadeIn key={i} delay={i * 0.08}>
            <div className="text-center py-4 px-3 rounded-2xl border border-border/30 bg-card/30">
              <span className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">{s.value}</span>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Testimonials */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {testimonials.map((t, i) => (
          <FadeIn key={i} delay={i * 0.1}>
            <div className="rounded-2xl border border-border/30 bg-card/40 p-5 hover:border-primary/20 transition-colors">
              <p className="text-sm text-foreground leading-relaxed mb-4">"{t.quote}"</p>
              <div className="flex items-center gap-2">
                <BrandFlameSmall opacity={t.opacity} />
                <span className="text-xs text-muted-foreground font-medium">{t.name}</span>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  </section>
);

export default SocialProofSection;
