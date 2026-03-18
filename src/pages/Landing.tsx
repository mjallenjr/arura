import { useState, useRef, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import mockupFeed from "@/assets/landing/mockup-feed.jpg";
import mockupPeople from "@/assets/landing/mockup-people.jpg";
import mockupCamera from "@/assets/landing/mockup-camera.jpg";
import InteractiveDemoSection from "@/components/landing/InteractiveDemoSection";
import SocialProofSection from "@/components/landing/SocialProofSection";
import FAQSection from "@/components/landing/FAQSection";
import TeaserFeedSection from "@/components/landing/TeaserFeedSection";
import HeatTierSection from "@/components/landing/HeatTierSection";

const ease = [0.2, 0.8, 0.2, 1] as const;

const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError("Enter a valid email"); return; }
    setSubmitting(true);
    setError("");
    const { error: dbError } = await supabase.from("waitlist_signups" as any).insert({ email: trimmed } as any);
    if (dbError) {
      if (dbError.code === "23505") setSubmitted(true);
      else setError("Something went wrong. Try again.");
    } else setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-primary">
              <defs><filter id="nfg"><feGaussianBlur stdDeviation="1.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              <g filter="url(#nfg)">
                <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2"/>
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.4"/>
              </g>
            </svg>
            <span className="text-lg font-semibold tracking-[-0.04em]">arura</span>
          </div>
          <button onClick={() => navigate("/auth")} className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
            Sign in
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <FadeIn>
            <motion.div
              className="flex justify-center mb-6"
              animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <svg width="64" height="64" viewBox="0 0 32 32" fill="none" className="text-primary drop-shadow-[0_0_20px_hsl(var(--primary)/0.5)]">
                <defs><filter id="hfg"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                <g filter="url(#hfg)">
                  <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                  <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.45"/>
                </g>
              </svg>
            </motion.div>
          </FadeIn>

          <FadeIn>
            <button
              onClick={() => { const el = document.getElementById("waitlist-email"); if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); setTimeout(() => el.focus(), 400); } }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8 cursor-pointer hover:bg-primary/10 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Early access — join the waitlist</span>
            </button>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.05em] leading-[0.9] mb-6">
              Everything<br /><span className="text-primary">burns.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Drop 5-second signals that vanish in 2 hours.
              No likes, no followers, no filters — just raw moments with the people who matter.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            {submitted ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4">
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">You're on the list. We'll be in touch.</span>
              </motion.div>
            ) : (
              <form onSubmit={handleWaitlist} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input id="waitlist-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" maxLength={255} />
                <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {submitting ? "Joining..." : "Join waitlist"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            {waitlistCount !== null && waitlistCount > 0 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs text-muted-foreground mt-4">
                <span className="text-foreground font-semibold">{waitlistCount.toLocaleString()}</span> {waitlistCount === 1 ? "person has" : "people have"} joined
              </motion.p>
            )}
          </FadeIn>
        </div>
      </section>

      {/* ── THE EXPERIENCE ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">The experience</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-16">
              Built for moments,<br />not metrics
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { img: mockupCamera, label: "Shoot a flare", desc: "5 seconds. No retakes. Just you." },
              { img: mockupFeed, label: "Watch it burn", desc: "Signals gain heat as people engage." },
              { img: mockupPeople, label: "Find your embers", desc: "Real connections, ranked by aura." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="group">
                  <div className="relative rounded-2xl overflow-hidden bg-card border border-border/50 shadow-2xl shadow-primary/5 mb-4">
                    <img src={item.img} alt={item.label} className="w-full aspect-[9/16] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700" loading="lazy" />
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

      {/* ── HOW IT WORKS (visual, minimal text) ── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-16">
              Simple. Raw. Gone.
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: "timer", rule: "Everything expires", detail: "2 hours, then it's gone forever." },
              { icon: "flame", rule: "Heat, not likes", detail: "match → spark → flame → star" },
              { icon: "dm", rule: "Brief DMs", detail: "10 words max. Say what matters." },
              { icon: "stitch", rule: "Stitch a word", detail: "Overlay your mark on any signal." },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/20 transition-colors">
                  <div className="mb-3">
                    {item.icon === "flame" ? (
                      <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-primary">
                        <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                        <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7"/>
                        <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.25"/>
                        <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.45"/>
                      </svg>
                    ) : item.icon === "timer" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <circle cx="12" cy="13" r="8" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
                        <path d="M12 9v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="12" cy="13" r="8" fill="currentColor" opacity="0.1"/>
                      </svg>
                    ) : item.icon === "dm" ? (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="currentColor" opacity="0.1"/>
                      </svg>
                    ) : (
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                        <path d="M4 4l4 4m8 8l4 4M4 20l16-16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="9" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15"/>
                        <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15"/>
                      </svg>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{item.rule}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      <HeatTierSection />

      {/* ── WHY NOT THEM ── */}
      <section className="py-24 px-6 border-t border-border/50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-primary/5 blur-[140px]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">Why arura</p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-14">
              They optimize for attention.<br />
              We optimize for <span className="text-primary">presence.</span>
            </h2>
          </FadeIn>

          <div className="space-y-0">
            {[
              { them: "Infinite scroll", us: "Finite feed — it ends" },
              { them: "Likes & follower counts", us: "Heat & aura — energy, not ego" },
              { them: "Algorithm decides what you see", us: "Chronological + heat" },
              { them: "Posts live forever", us: "2 hours, then gone" },
              { them: "DM overload", us: "10 words. That's it." },
              { them: "Curated performance", us: "5-second raw moments" },
            ].map((row, i) => (
              <FadeIn key={i} delay={i * 0.06}>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3.5 border-b border-border/30 last:border-0">
                  <span className="text-sm text-muted-foreground/60 line-through decoration-muted-foreground/30 text-right">{row.them}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  <span className="text-sm text-foreground font-medium">{row.us}</span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* New engagement sections */}
      <InteractiveDemoSection />
      <TeaserFeedSection />
      <SocialProofSection />
      <FAQSection />

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-lg mx-auto text-center">
          <FadeIn>
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="text-primary mx-auto mb-6">
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.3" />
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </FadeIn>
          <FadeIn delay={0.1}>
            <h2 className="text-3xl font-bold tracking-[-0.04em] mb-3">
              Don't let your ember<br />turn to ash.
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              The moment's now. No app store, no signup wall — just go.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button onClick={() => navigate("/auth")} className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors">
                Get started <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => navigate("/install")} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors">
                Install PWA
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
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor"/>
            </svg>
            <span className="text-xs">© {new Date().getFullYear()} arura</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => navigate("/legal")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Legal</button>
            <button onClick={() => navigate("/advertise")} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Advertise</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
