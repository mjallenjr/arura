import { useState, useRef, useEffect } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import mockupFeed from "@/assets/landing/mockup-feed.jpg";
import mockupPeople from "@/assets/landing/mockup-people.jpg";
import mockupCamera from "@/assets/landing/mockup-camera.jpg";

const ease = [0.2, 0.8, 0.2, 1] as const;

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StrikeThrough = ({ children }: { children: React.ReactNode }) => (
  <span className="relative inline-block">
    <span className="text-muted-foreground">{children}</span>
    <motion.span
      className="absolute left-0 top-1/2 h-[2px] bg-destructive/70"
      initial={{ width: "0%" }}
      whileInView={{ width: "100%" }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
    />
  </span>
);

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  useEffect(() => {
    supabase.rpc("get_waitlist_count" as any).then(({ data }) => {
      if (typeof data === "number") setWaitlistCount(data);
    });
  }, [submitted]);

  useEffect(() => {
    document.body.style.overflow = "auto";
    document.body.style.height = "auto";
    const root = document.getElementById("root");
    if (root) { root.style.overflow = "auto"; root.style.height = "auto"; }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
      if (root) { root.style.overflow = ""; root.style.height = ""; }
    };
  }, []);

  const handleWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email");
      return;
    }

    setSubmitting(true);
    setError("");

    const { error: dbError } = await supabase
      .from("waitlist_signups" as any)
      .insert({ email: trimmed } as any);

    if (dbError) {
      if (dbError.code === "23505") {
        setSubmitted(true);
      } else {
        setError("Something went wrong. Try again.");
      }
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-primary">
              <defs>
                <filter id="navFlameGlow">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <g filter="url(#navFlameGlow)">
                <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.4" />
              </g>
            </svg>
            <span className="text-lg font-semibold tracking-[-0.04em]">arura</span>
          </div>
          <button
            onClick={() => navigate("/auth")}
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* ═══════ ACT I: THE PROBLEM ═══════ */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
        </div>

        <motion.div style={{ opacity: heroOpacity }} className="relative z-10 max-w-3xl mx-auto text-center">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-8">
              A message for the overstimulated
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-[-0.05em] leading-[0.95] mb-8">
              You scroll for hours.<br />
              You feel <span className="text-primary">nothing.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.25}>
            <div className="space-y-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-12 leading-relaxed">
              <p>
                Your feed is an endless performance. Curated selfies. Filtered sunsets. Engagement bait.
                Everyone's shouting. Nobody's listening.
              </p>
              <p className="text-foreground/90 font-medium">
                You don't need another platform. You need a reason to put your phone down and actually live.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.4}>
            <motion.div
              className="flex justify-center"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5">
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ y: [0, 12, 0], opacity: [1, 0.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </FadeIn>
        </motion.div>
      </section>

      {/* ═══════ ACT II: THE INDICTMENT ═══════ */}
      <section className="py-32 px-6 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-destructive/80 text-center mb-6">
              The problem with social media
            </p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.04em] text-center leading-[1.1] mb-16">
              They built platforms<br />
              that profit from your <span className="text-destructive/80">anxiety.</span>
            </h2>
          </FadeIn>

          <div className="space-y-6 max-w-lg mx-auto">
            {[
              { old: "Infinite scroll", truth: "Designed to waste your life" },
              { old: "Likes & followers", truth: "Reduced your worth to a number" },
              { old: "The algorithm", truth: "Shows you what angers you, not what matters" },
              { old: "Stories & posts", truth: "Turned every moment into a performance" },
              { old: "DMs", truth: "Became another inbox you dread" },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="flex items-center gap-4 py-3">
                  <div className="flex-1">
                    <StrikeThrough>{item.old}</StrikeThrough>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  <p className="flex-1 text-sm text-foreground/80">{item.truth}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ACT III: THE MANIFESTO ═══════ */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <FadeIn>
            <motion.div
              className="flex justify-center mb-8"
              animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="72" height="72" viewBox="0 0 32 32" fill="none" className="text-primary drop-shadow-[0_0_30px_hsl(var(--primary)/0.5)]">
                <defs>
                  <filter id="heroFlameGlow">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <g filter="url(#heroFlameGlow)">
                  <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                  <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25" />
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.45" />
                </g>
              </svg>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-[-0.05em] leading-[0.95] mb-8">
              What if social media<br />
              made you feel <span className="text-primary">alive?</span>
            </h2>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="space-y-5 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              <p>
                <span className="text-foreground font-semibold">arura</span> is a counter-culture.
                A place where nothing lasts, so everything matters.
              </p>
              <p>
                Drop a 5-second signal — a photo, a video, a raw moment.
                It lives for <span className="text-foreground font-medium">2 hours</span>, then it's gone forever.
                No archive. No receipts. No pressure.
              </p>
              <p>
                When people engage, your signal gains <span className="text-primary font-medium">heat</span> — climbing from
                match to spark to flame to star. It's not a like count.
                It's collective energy. It means people <em>felt</em> something.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════ ACT IV: THE RULES ═══════ */}
      <section className="py-32 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary text-center mb-4">
              The rules
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-4">
              We don't play by theirs.
            </h2>
            <p className="text-muted-foreground text-center text-sm max-w-md mx-auto mb-16">
              Every design choice exists to protect your time, your peace, and your authenticity.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                emoji: "⏱",
                rule: "Everything expires",
                detail: "Signals self-destruct in 2 hours. No permanent record means no overthinking, no regret.",
              },
              {
                emoji: "🔥",
                rule: "Heat, not likes",
                detail: "Engagement fuels collective heat. match → spark → flame → ⭐ star. Energy you can feel, not a number to obsess over.",
              },
              {
                emoji: "💬",
                rule: "10 words max",
                detail: "DMs are capped at 10 words. Say what matters. No essays, no small talk, no dread.",
              },
              {
                emoji: "🧵",
                rule: "Stitch, don't comment",
                detail: "Double-tap to overlay your word on someone's signal. Collaboration over criticism.",
              },
              {
                emoji: "👁",
                rule: "No follower counts",
                detail: "You ignite embers. They ignite you back. Connections ranked by aura — how present you are, not how popular.",
              },
              {
                emoji: "🚫",
                rule: "No algorithm",
                detail: "Chronological + heat. What's happening now, not what a machine thinks will keep you hooked.",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/20 transition-colors h-full">
                  <span className="text-2xl mb-3 block">{item.emoji}</span>
                  <h3 className="text-sm font-semibold text-foreground mb-1.5">{item.rule}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ACT V: THE EXPERIENCE ═══════ */}
      <section className="py-32 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary text-center mb-4">
              Inside arura
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-16">
              Built to feel, not to scroll.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { img: mockupCamera, label: "Drop a signal", desc: "5 seconds. One moment. No filters, no retakes. Just you." },
              { img: mockupFeed, label: "Watch it burn", desc: "Signals climb in heat as people engage. When time's up, it's gone." },
              { img: mockupPeople, label: "Find your people", desc: "Real connections ranked by aura — how present you are with each other." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="group">
                  <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl shadow-primary/5 mb-4">
                    <img
                      src={item.img}
                      alt={item.label}
                      className="w-full aspect-[9/16] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ ACT VI: THE MOVEMENT ═══════ */}
      <section className="py-32 px-6 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-primary/6 blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto text-center">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-6">
              Join the movement
            </p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-[-0.04em] leading-[0.95] mb-4">
              Everything burns.<br />
              <span className="text-primary">Make it count.</span>
            </h2>
            <p className="text-sm text-muted-foreground mb-10 max-w-sm mx-auto">
              arura is in early access. Join the waitlist and be the first to feel something real again.
            </p>
          </FadeIn>

          <FadeIn delay={0.15}>
            {submitted ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4"
              >
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">You're on the list. We'll be in touch.</span>
              </motion.div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  id="waitlist-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={255}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3.5 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Joining..." : "Join the waitlist"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            {waitlistCount !== null && waitlistCount > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-muted-foreground mt-4"
              >
                <span className="text-foreground font-semibold">{waitlistCount.toLocaleString()}</span> {waitlistCount === 1 ? "person has" : "people have"} already joined
              </motion.p>
            )}
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Already have access? Sign in →
              </button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none" className="text-primary opacity-50">
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" />
            </svg>
            <span className="text-xs">© {new Date().getFullYear()} arura</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/legal")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Legal
            </button>
            <button onClick={() => navigate("/advertise")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Advertise
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
