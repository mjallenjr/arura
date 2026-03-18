import { motion } from "framer-motion";

const HEAT_TIERS = [
  "match", "spark", "ignite", "flame", "hot", "burning", "raging", "inferno", "star",
] as const;

type HeatTier = typeof HEAT_TIERS[number];

// Returns a tier index 0-8 for intensity scaling
function tierIndex(level: string): number {
  const idx = HEAT_TIERS.indexOf(level as HeatTier);
  return idx >= 0 ? idx : 0;
}

// SVG flame icon that scales in complexity with tier
function HeatIcon({ tier, size = 14 }: { tier: number; size?: number }) {
  // Lower tiers: simple single flame. Higher tiers: layered flames
  const opacity = 0.5 + tier * 0.06;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="shrink-0">
      {/* Base flame - always present */}
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
      {/* Inner flame - appears at ignite+ */}
      {tier >= 2 && (
        <path
          d="M12 18a2.4 2.4 0 002.4-2.4c0-1.6-1.2-2.4-1.6-4-.4.8-1.2 1.2-1.6 0-.4 1.6-1.6 2.4-1.6 4A2.4 2.4 0 0012 18z"
          fill="hsl(var(--primary))"
          opacity={0.7 + tier * 0.03}
        />
      )}
      {/* Devil horns - appears at hot+ */}
      {tier >= 4 && (
        <>
          <path d="M7 6C6 4 4.5 3 3.5 2.5c.5 1 1 2.2 1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
          <path d="M17 6C18 4 19.5 3 20.5 2.5c-.5 1-1 2.2-1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        </>
      )}
      {/* Star burst rays - star tier only */}
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
}

const HeatBadge = ({ level }: HeatBadgeProps) => {
  const tier = tierIndex(level);
  const isHighTier = tier >= 5; // burning+

  return (
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
  );
};

export default HeatBadge;
