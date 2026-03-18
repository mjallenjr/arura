import { useState, useEffect } from "react";
import { resolveMediaUrl } from "@/lib/feed-types";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const HEAT_TIERS = ["match", "spark", "ignite", "flame", "hot", "burning", "raging", "inferno", "star"];

interface HeatHistoryData {
  hottest_level: string;
  hottest_signal_id: string | null;
  hottest_media_url: string | null;
  hottest_type: string;
  tier_counts: Record<string, number>;
  total_signals: number;
}

function HeatIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        fill="hsl(var(--primary))" opacity="0.6" />
      <path d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        stroke="hsl(var(--primary))" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

const ProfileHeatHistory = () => {
  const { user } = useAuth();
  const [data, setData] = useState<HeatHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      // Get all user's signals (including expired for history)
      const { data: signals } = await supabase
        .from("signals")
        .select("id, heat_level, type, storage_path")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (!signals || signals.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      // Count tiers
      const tierCounts: Record<string, number> = {};
      HEAT_TIERS.forEach(t => tierCounts[t] = 0);
      let hottestIdx = 0;
      let hottestSignal = signals[0];

      signals.forEach(s => {
        const level = s.heat_level || "match";
        tierCounts[level] = (tierCounts[level] || 0) + 1;
        const idx = HEAT_TIERS.indexOf(level);
        if (idx > hottestIdx) {
          hottestIdx = idx;
          hottestSignal = s;
        }
      });

      let hottest_media_url: string | null = null;
      if (hottestSignal.storage_path) {
        hottest_media_url = resolveMediaUrl(hottestSignal.storage_path);
      }

      setData({
        hottest_level: hottestSignal.heat_level || "match",
        hottest_signal_id: hottestSignal.id,
        hottest_media_url,
        hottest_type: hottestSignal.type,
        tier_counts: tierCounts,
        total_signals: signals.length,
      });
      setLoading(false);
    };
    load();
  }, [user]);

  if (loading) return <div className="py-4 text-center text-[10px] text-muted-foreground animate-pulse">loading heat history...</div>;
  if (!data) return null;

  const maxCount = Math.max(1, ...Object.values(data.tier_counts));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="signal-surface rounded-2xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center gap-2">
        <HeatIcon size={18} />
        <h3 className="text-sm font-medium text-foreground tracking-tight">Heat History</h3>
        <span className="text-[10px] text-muted-foreground ml-auto">{data.total_signals} total drops</span>
      </div>

      {/* Hottest drop ever */}
      {data.hottest_level !== "match" && (
        <div className="flex items-center gap-3 rounded-xl bg-primary/5 p-3">
          {data.hottest_media_url && (
            <div className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              {data.hottest_type === "photo" ? (
                <img src={data.hottest_media_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">▶</div>
              )}
            </div>
          )}
          <div>
            <p className="text-[10px] text-primary/60 uppercase tracking-[0.1em] font-medium">hottest drop ever</p>
            <p className="text-sm font-bold text-primary" style={{ textShadow: "0 0 12px hsl(var(--primary) / 0.3)" }}>
              {data.hottest_level}
            </p>
          </div>
        </div>
      )}

      {/* Tier breakdown bars */}
      <div className="flex flex-col gap-1.5">
        {HEAT_TIERS.filter(t => t !== "match").map((tier, i) => {
          const count = data.tier_counts[tier] || 0;
          const pct = (count / maxCount) * 100;
          const tierIdx = HEAT_TIERS.indexOf(tier);
          const opacity = 0.3 + (tierIdx / 8) * 0.7;

          return (
            <div key={tier} className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground w-12 text-right font-medium">{tier}</span>
              <div className="flex-1 h-2 rounded-full bg-primary/5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  className="h-full rounded-full"
                  style={{
                    background: `hsl(var(--primary) / ${opacity})`,
                    boxShadow: count > 0 ? `0 0 4px hsl(var(--primary) / ${opacity * 0.5})` : "none",
                  }}
                />
              </div>
              <span className="text-[9px] text-muted-foreground w-5">{count}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ProfileHeatHistory;
