import { motion } from "framer-motion";
import type { ReferralReward } from "@/hooks/useReferral";

const TIER_CONFIG: Record<string, { color: string; glow: string; icon: string }> = {
  spark:   { color: "text-cyan-400",   glow: "shadow-cyan-400/30",   icon: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" },
  flame:   { color: "text-orange-400", glow: "shadow-orange-400/30", icon: "M12 2c-1 4-4 6-4 10a5.5 5.5 0 0011 0c0-4-3-6-4-10-1 2-2 3-3 0z" },
  inferno: { color: "text-red-400",    glow: "shadow-red-400/30",    icon: "M12 2c-1 4-4 6-4 10a5.5 5.5 0 0011 0c0-4-3-6-4-10-1 2-2 3-3 0z" },
  eternal: { color: "text-violet-400", glow: "shadow-violet-400/30", icon: "M12 2c-1 4-4 6-4 10a5.5 5.5 0 0011 0c0-4-3-6-4-10-1 2-2 3-3 0z" },
};

interface Props {
  reward: ReferralReward;
  size?: "sm" | "md";
}

const ReferralBadge = ({ reward, size = "sm" }: Props) => {
  if (reward.tier === "none") return null;

  const config = TIER_CONFIG[reward.tier];
  const dim = size === "sm" ? "w-5 h-5" : "w-7 h-7";
  const textSize = size === "sm" ? "text-[9px]" : "text-[11px]";

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-1 rounded-full bg-card border border-border px-2 py-0.5 shadow-lg ${config.glow}`}
      title={`${reward.label} — ${reward.bonusMinutes}min bonus on signals`}
    >
      <svg viewBox="0 0 24 24" fill="none" className={`${dim} ${config.color}`}>
        <path
          d={config.icon}
          fill="currentColor"
          opacity={reward.tier === "eternal" ? 0.8 : 0.5}
        />
        <path
          d={config.icon}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {reward.tier === "eternal" && (
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.6" />
        )}
      </svg>
      <span className={`${textSize} font-semibold ${config.color}`}>{reward.label}</span>
    </motion.div>
  );
};

export default ReferralBadge;
