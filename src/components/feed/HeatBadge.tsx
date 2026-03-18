import { motion } from "framer-motion";

const HEAT_TIERS = [
  "match", "spark", "ignite", "flame", "hot", "burning", "raging", "inferno", "star",
] as const;

const HEAT_THRESHOLDS = [0, 5, 15, 30, 50, 80, 120, 180, 250];

type HeatTier = typeof HEAT_TIERS[number];

function tierIndex(level: string): number {
  const idx = HEAT_TIERS.indexOf(level as HeatTier);
  return idx >= 0 ? idx : 0;
}

function getProgressToNext(level: string, heatScore: number): { progress: number; nextTier: string | null } {
  const tier = tierIndex(level);
  if (tier >= 8) return { progress: 1, nextTier: null }; // star = max
  const currentThreshold = HEAT_THRESHOLDS[tier];
  const nextThreshold = HEAT_THRESHOLDS[tier + 1];
  const range = nextThreshold - currentThreshold;
  const progressInRange = Math.min(1, Math.max(0, (heatScore - currentThreshold) / range));
  return { progress: progressInRange, nextTier: HEAT_TIERS[tier + 1] };
}

function HeatIcon({ tier, size = 14 }: { tier: number; size?: number }) {
  const opacity = 0.5 + tier * 0.06;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      <path
        d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        fill="hsl(var(--primary))"
        opacity={opacity}
      />
      <path
        d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        stroke="hsl(var(--primary))"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {tier >= 2 && (
        <path
          d="M12 18a2.4 2.4 0 002.4-2.4c0-1.6-1.2-2.4-1.6-4-.4.8-1.2 1.2-1.6 0-.4 1.6-1.6 2.4-1.6 4A2.4 2.4 0 0012 18z"
          fill="hsl(var(--primary))"
          opacity={0.7 + tier * 0.03}
        />
      )}
      {tier >= 4 && (
        <>
          <path d="M7 6C6 4 4.5 3 3.5 2.5c.5 1 1 2.2 1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
          <path d="M17 6C18 4 19.5 3 20.5 2.5c-.5 1-1 2.2-1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        </>
      )}
      {tier >= 8 && (
        <>
          <line x1="12" y1="0" x2="12" y2="3" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.5" />
          <line x1="4" y1="4" x2="6" y2="6" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.5" />
          <line x1="20" y1="4" x2="18" y2="6" stroke="hsl(var(--primary))" strokeWidth="0.8" opacity="0.5" />
        </>
      )}
    </svg>
  );
}

interface HeatBadgeProps {
  level: string;
  heatScore?: number;
  isFirstTouch?: boolean;
  isLevelUpCredit?: boolean;
}

const HeatBadge = ({ level, heatScore = 0, isFirstTouch, isLevelUpCredit }: HeatBadgeProps) => {
  const tier = tierIndex(level);
  const isHighTier = tier >= 5;
  const { progress, nextTier } = getProgressToNext(level, heatScore);
  const isStar = tier >= 8;

  return (
    <div className="flex flex-col gap-1">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md ${
          isHighTier
            ? "bg-primary/20 shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
            : "bg-primary/10"
        }`}
      >
        <motion.div
          animate={
            tier >= 7
              ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] }
              : undefined
          }
          transition={tier >= 7 ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
        >
          <HeatIcon tier={tier} size={tier >= 6 ? 16 : 14} />
        </motion.div>
        <span
          className={`text-[10px] font-medium tracking-wide ${
            isHighTier ? "text-primary" : "text-primary/70"
          }`}
        >
          {level}
        </span>
      </motion.div>

      {/* Thermometer progress bar */}
      {!isStar && (
        <div className="flex items-center gap-1.5 px-1">
          <div className="relative h-1 flex-1 rounded-full bg-primary/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, hsl(var(--primary) / 0.4), hsl(var(--primary)))`,
                boxShadow: progress > 0.5 ? "0 0 6px hsl(var(--primary) / 0.4)" : "none",
              }}
            />
          </div>
          {nextTier && (
            <span className="text-[8px] text-primary/40 font-medium tracking-wide whitespace-nowrap">
              {nextTier}
            </span>
          )}
        </div>
      )}

      {/* First touch / level-up credit */}
      {(isFirstTouch || isLevelUpCredit) && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-1 px-1"
        >
          {isFirstTouch && (
            <span className="text-[9px] font-medium text-primary/60 tracking-wide">
              first to feel
            </span>
          )}
          {isLevelUpCredit && !isFirstTouch && (
            <span className="text-[9px] font-medium text-primary/60 tracking-wide">
              you lit the fuse
            </span>
          )}
        </motion.div>
      )}
    </div>
  );
};

export { HEAT_THRESHOLDS, HEAT_TIERS };
export default HeatBadge;
