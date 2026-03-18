import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Flame, Clock, MessageCircle, Users, Zap, Check } from "lucide-react";
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

const Landing = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        setSubmitted(true); // Already on list
      } else {
        setError("Something went wrong. Try again.");
      }
    } else {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  const features = [
    { icon: Clock, title: "Ephemeral by design", desc: "Signals live for 2 hours then vanish. No permanent record, no pressure." },
    { icon: Flame, title: "Heat system", desc: "Engagement fuels heat. Signals climb from match → spark → flame → star." },
    { icon: MessageCircle, title: "One-word DMs", desc: "Messages are 12 characters max. Say everything in a single word." },
    { icon: Users, title: "Embers & Aura", desc: "Follow = Ignite. Mutual = Sparked. Your connections have real weight." },
    { icon: Zap, title: "Stitch a word", desc: "Double-tap any signal to overlay your word. Leave your mark on the moment." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-y-auto">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" className="text-primary">
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
                fill="currentColor" opacity="0.3" />
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
                stroke="currentColor" strokeWidth="1.5" fill="none" />
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

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[120px]" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <FadeIn>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-medium text-primary">Early access — join the waitlist</span>
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-[-0.05em] leading-[0.9] mb-6">
              Everything
              <br />
              <span className="text-primary">burns.</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed">
              Drop 5-second signals that vanish in 2 hours.
              No likes, no followers, no filters — just raw, real moments with the people who matter.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  maxLength={255}
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Joining..." : "Join waitlist"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
          </FadeIn>
        </div>
      </section>

      {/* App Screenshots */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">
              The experience
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-16">
              Built for moments,<br />not metrics
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              { img: mockupCamera, label: "Drop a signal", desc: "5 seconds. One word. That's it." },
              { img: mockupFeed, label: "Watch it burn", desc: "Signals climb in heat as people engage." },
              { img: mockupPeople, label: "Find your embers", desc: "Real connections, ranked by aura." },
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

      {/* Features */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <FadeIn>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary text-center mb-4">
              How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-[-0.04em] text-center mb-16">
              Social, reimagined
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-border/50 bg-card/50 p-6 hover:border-primary/20 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-lg mx-auto text-center">
          <FadeIn>
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none" className="text-primary mx-auto mb-6">
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
                fill="currentColor" opacity="0.3" />
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
                stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h2 className="text-3xl font-bold tracking-[-0.04em] mb-3">
              Ready to feel something real?
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              No app store. No signup wall. Just add to your home screen and go.
            </p>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="inline-flex items-center gap-2 rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Get started
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate("/install")}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground hover:border-primary/30 transition-colors"
              >
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
              <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
                fill="currentColor" />
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
