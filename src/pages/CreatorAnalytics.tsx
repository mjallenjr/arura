import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";
import { HEAT_TIERS } from "@/components/feed/HeatBadge";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, AreaChart, Area } from "recharts";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface DailyStats {
  date: string;
  views: number;
  felts: number;
  stitches: number;
}

interface DropStat {
  id: string;
  stitch_word: string | null;
  heat_level: string;
  created_at: string;
  views: number;
  felts: number;
  stitches: number;
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [dropStats, setDropStats] = useState<DropStat[]>([]);
  const [totals, setTotals] = useState({ views: 0, felts: 0, stitches: 0, drops: 0 });
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get all user's signals (including expired for history)
      const { data: signals } = await supabase
        .from("signals")
        .select("id, stitch_word, heat_level, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);

      if (!signals || signals.length === 0) {
        setLoading(false);
        return;
      }

      const signalIds = signals.map((s) => s.id);

      const [viewsRes, feltsRes, stitchesRes] = await Promise.all([
        supabase.from("signal_views").select("signal_id, created_at").in("signal_id", signalIds),
        supabase.from("felts").select("signal_id, created_at").in("signal_id", signalIds),
        supabase.from("stitches").select("signal_id, created_at").in("signal_id", signalIds),
      ]);

      const views = viewsRes.data ?? [];
      const felts = feltsRes.data ?? [];
      const stitches = stitchesRes.data ?? [];

      // Totals
      setTotals({
        views: views.length,
        felts: felts.length,
        stitches: stitches.length,
        drops: signals.length,
      });

      // Tier distribution
      const tiers: Record<string, number> = {};
      signals.forEach((s) => {
        tiers[s.heat_level] = (tiers[s.heat_level] ?? 0) + 1;
      });
      setTierCounts(tiers);

      // Per-drop stats
      const viewCountMap = new Map<string, number>();
      views.forEach((v) => viewCountMap.set(v.signal_id, (viewCountMap.get(v.signal_id) ?? 0) + 1));
      const feltCountMap = new Map<string, number>();
      felts.forEach((f) => feltCountMap.set(f.signal_id, (feltCountMap.get(f.signal_id) ?? 0) + 1));
      const stitchCountMap = new Map<string, number>();
      stitches.forEach((s) => stitchCountMap.set(s.signal_id, (stitchCountMap.get(s.signal_id) ?? 0) + 1));

      setDropStats(
        signals.slice(0, 20).map((s) => ({
          id: s.id,
          stitch_word: s.stitch_word,
          heat_level: s.heat_level,
          created_at: s.created_at,
          views: viewCountMap.get(s.id) ?? 0,
          felts: feltCountMap.get(s.id) ?? 0,
          stitches: stitchCountMap.get(s.id) ?? 0,
        }))
      );

      // Daily stats (last 7 days)
      const days: DailyStats[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayStr = date.toISOString().split("T")[0];
        const dayViews = views.filter((v) => v.created_at.startsWith(dayStr)).length;
        const dayFelts = felts.filter((f) => f.created_at.startsWith(dayStr)).length;
        const dayStitches = stitches.filter((s) => s.created_at.startsWith(dayStr)).length;
        days.push({
          date: date.toLocaleDateString("en", { weekday: "short" }),
          views: dayViews,
          felts: dayFelts,
          stitches: dayStitches,
        });
      }
      setDailyStats(days);
      setLoading(false);
    };

    load();
  }, [user]);

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="min-h-svh bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-[env(safe-area-inset-top,12px)]">
        <button onClick={() => navigate("/profile")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-sm font-medium tracking-[-0.02em] text-foreground">Analytics</h1>
        <div className="w-5" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="label-signal animate-pulse">loading...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Views", value: totals.views, icon: "◉" },
              { label: "Total Felts", value: totals.felts, icon: "✦" },
              { label: "Total Stitches", value: totals.stitches, icon: "⫽" },
              { label: "Total Flares", value: totals.drops, icon: "◆" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...signalTransition, delay: i * 0.05 }}
                className="rounded-2xl bg-muted/30 border border-border/20 p-4 flex flex-col gap-1"
              >
                <span className="text-lg">{stat.icon}</span>
                <span className="text-2xl font-semibold tracking-tight text-foreground">{stat.value}</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{stat.label}</span>
              </motion.div>
            ))}
          </div>

          {/* 7-day engagement chart */}
          {dailyStats.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...signalTransition, delay: 0.2 }}
              className="rounded-2xl bg-muted/30 border border-border/20 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
                Last 7 Days
              </p>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyStats}>
                    <defs>
                      <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "11px",
                      }}
                    />
                    <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="felts" stroke="hsl(var(--accent-foreground))" fill="none" strokeWidth={1.5} strokeDasharray="4 4" />
                    <Area type="monotone" dataKey="stitches" stroke="hsl(var(--primary))" fill="none" strokeWidth={1} opacity={0.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="w-3 h-0.5 rounded bg-primary" /> views
                </span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="w-3 h-0.5 rounded bg-accent-foreground" style={{ backgroundImage: "repeating-linear-gradient(90deg, currentColor 0 3px, transparent 3px 7px)" }} /> felts
                </span>
                <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                  <span className="w-3 h-0.5 rounded bg-primary/50" /> stitches
                </span>
              </div>
            </motion.div>
          )}

          {/* Heat tier distribution */}
          {Object.keys(tierCounts).length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...signalTransition, delay: 0.3 }}
              className="rounded-2xl bg-muted/30 border border-border/20 p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-3">
                Heat Distribution
              </p>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={HEAT_TIERS.map((tier) => ({ tier, count: tierCounts[tier] ?? 0 }))}>
                    <XAxis dataKey="tier" tick={{ fontSize: 8, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Top drops */}
          {dropStats.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-2 px-1">
                Recent Drops
              </p>
              <div className="space-y-2">
                {dropStats.map((drop, i) => (
                  <motion.div
                    key={drop.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...signalTransition, delay: 0.3 + i * 0.03 }}
                    className="flex items-center gap-3 rounded-xl bg-muted/20 border border-border/10 p-3"
                  >
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-[10px] text-primary font-medium">{drop.heat_level.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">
                        {drop.stitch_word ?? "untitled drop"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(drop.created_at)}</p>
                    </div>
                    <div className="flex gap-3 text-[10px] text-muted-foreground">
                      <span>👁 {drop.views}</span>
                      <span>✦ {drop.felts}</span>
                      <span>🧵 {drop.stitches}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <NavBar />
    </div>
  );
};

export default CreatorAnalytics;
