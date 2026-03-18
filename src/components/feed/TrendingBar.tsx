import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { HeatIcon } from "@/components/BrandIcons";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface TrendingSignal {
  id: string;
  heat_level: string;
  stitch_word: string | null;
  display_name: string;
  media_url: string | null;
}

interface TrendingBarProps {
  onSignalTap: (signalId: string) => void;
}


const TrendingBar = ({ onSignalTap }: TrendingBarProps) => {
  const [trending, setTrending] = useState<TrendingSignal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      const { data: signals } = await supabase
        .from("signals")
        .select("id, heat_level, stitch_word, user_id")
        .gt("expires_at", new Date().toISOString())
        .in("heat_level", ["flame", "hot", "burning", "raging", "inferno", "star"])
        .order("last_engagement_at", { ascending: false })
        .limit(8);

      if (!signals || signals.length === 0) {
        setLoading(false);
        return;
      }

      const userIds = [...new Set(signals.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      setTrending(
        signals.map((s) => ({
          id: s.id,
          heat_level: s.heat_level,
          stitch_word: s.stitch_word,
          display_name: nameMap.get(s.user_id) ?? "unknown",
          media_url: null,
        }))
      );
      setLoading(false);
    };

    fetchTrending();
  }, []);

  if (loading || trending.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="w-full"
    >
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">
          trending now
        </span>
        <div className="flex-1 h-px bg-primary/10" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {trending.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...signalTransition, delay: i * 0.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSignalTap(s.id)}
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1.5 signal-ease hover:bg-primary/20"
          >
            <span className="text-xs flex items-center">
              <HeatIcon level={s.heat_level} size={12} />
            </span>
            <span className="text-[10px] font-medium text-foreground whitespace-nowrap max-w-[80px] truncate">
              {s.stitch_word ?? s.display_name}
            </span>
            <span className="text-[8px] text-primary/60 font-medium uppercase">
              {s.heat_level}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default TrendingBar;
