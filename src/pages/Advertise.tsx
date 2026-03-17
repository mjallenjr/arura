import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const t = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const BUDGET_TIERS = [
  { value: "starter", label: "$50–$200/mo", desc: "Test the waters" },
  { value: "growth", label: "$200–$1K/mo", desc: "Serious reach" },
  { value: "scale", label: "$1K–$5K/mo", desc: "Dominate" },
  { value: "enterprise", label: "$5K+/mo", desc: "Full takeover" },
];

const Advertise = () => {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [budget, setBudget] = useState("starter");
  const [message, setMessage] = useState("");

  // Live platform stats
  const [stats, setStats] = useState({ users: 0, signals: 0, impressions: 0 });

  useEffect(() => {
    const load = async () => {
      const [usersRes, signalsRes, impressionsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("signals").select("id", { count: "exact", head: true }),
        supabase.from("ad_impressions").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        users: usersRes.count ?? 0,
        signals: signalsRes.count ?? 0,
        impressions: impressionsRes.count ?? 0,
      });
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const { error } = await supabase.from("advertiser_leads").insert({
      company_name: company,
      contact_email: email,
      website: website || null,
      budget_range: budget,
      message: message || null,
    });
    if (error) {
      toast.error("Something went wrong. Try again.");
    } else {
      setSubmitted(true);
    }
    setSending(false);
  };

  const formatNum = (n: number) => {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  if (submitted) {
    return (
      <div className="flex h-svh w-full items-center justify-center bg-background p-8">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={t} className="text-center">
          <div className="text-5xl mb-4">🔥</div>
          <h2 className="display-signal mb-2">You're in.</h2>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            We'll reach out within 24 hours with your campaign setup. Get ready to reach the most engaged audience on the internet.
          </p>
          <a href="/" className="mt-6 inline-block text-xs text-primary hover:underline">← Back to arura</a>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-svh w-full bg-background overflow-y-auto">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 px-6 pt-16 pb-12 max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={t}>
            <a href="/" className="label-signal text-primary mb-8 inline-block">arura</a>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground leading-tight mb-3">
              Your brand, inside<br />the moment.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              arura users don't scroll past ads — they <span className="text-foreground font-medium">live inside them</span>. 
              Ephemeral signals mean every impression is a real human, right now, fully engaged.
            </p>
          </motion.div>

          {/* Live stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...t, delay: 0.15 }}
            className="grid grid-cols-3 gap-3 mt-8"
          >
            {[
              { label: "Active Embers", value: formatNum(stats.users), pulse: true },
              { label: "Signals Today", value: formatNum(stats.signals) },
              { label: "Ad Impressions", value: formatNum(stats.impressions) },
            ].map((s, i) => (
              <div key={i} className="signal-surface rounded-xl p-3 text-center">
                <p className={`text-xl font-semibold text-foreground ${s.pulse ? "animate-pulse" : ""}`}>{s.value}</p>
                <p className="label-signal mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Why arura */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...t, delay: 0.25 }}
        className="px-6 pb-8 max-w-lg mx-auto"
      >
        <div className="grid gap-4">
          {[
            { icon: "🎯", title: "Interest-targeted", desc: "We match your brand to users based on their real interests AND their friends' interests. No wasted spend." },
            { icon: "⏱", title: "3.7s of undivided attention", desc: "Signals are ephemeral — users are locked in. Your ad gets the same immersive, full-screen treatment." },
            { icon: "📊", title: "Real-time analytics", desc: "See exactly how many real humans saw your ad, when, and where. Every impression is tracked." },
            { icon: "💰", title: "You set the CPM", desc: "Start at $5 CPM. Scale when you see results. No minimums, no contracts, cancel anytime." },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...t, delay: 0.3 + i * 0.08 }}
              className="flex gap-3 items-start signal-surface rounded-xl p-4"
            >
              <span className="text-xl mt-0.5">{item.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Signup form */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...t, delay: 0.5 }}
        className="px-6 pb-24 max-w-lg mx-auto"
      >
        <div className="rounded-2xl border border-primary/20 p-6 bg-card">
          <h2 className="text-lg font-semibold text-foreground mb-1">Start advertising</h2>
          <p className="text-xs text-muted-foreground mb-6">Takes 30 seconds. We'll handle the rest.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Company name"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              required
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="url"
              placeholder="Website (optional)"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />

            {/* Budget selector */}
            <div>
              <p className="label-signal mb-2">Monthly budget</p>
              <div className="grid grid-cols-2 gap-2">
                {BUDGET_TIERS.map((tier) => (
                  <button
                    key={tier.value}
                    type="button"
                    onClick={() => setBudget(tier.value)}
                    className={`rounded-xl px-3 py-3 text-left signal-ease border ${
                      budget === tier.value
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border/30 signal-surface"
                    }`}
                  >
                    <p className={`text-sm font-medium ${budget === tier.value ? "text-primary" : "text-foreground"}`}>
                      {tier.label}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{tier.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <textarea
              placeholder="Tell us about your brand (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none"
            />

            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={sending}
              className="rounded-full bg-primary px-8 py-3.5 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
            >
              {sending ? "Submitting..." : "Get started →"}
            </motion.button>

            <p className="text-[10px] text-muted-foreground text-center">
              No commitment. We'll send you a campaign proposal within 24h.
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Advertise;
