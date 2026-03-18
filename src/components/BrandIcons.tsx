/**
 * Branded SVG icons — replaces all generic emojis across the app.
 * Every icon uses signal-cyan (--primary) to stay on-brand.
 */

interface IconProps {
  size?: number;
  className?: string;
}

/** Flame icon — scales opacity/detail by tier (0-8) */
export const BrandFlame = ({ size = 14, tier = 0, className = "" }: IconProps & { tier?: number }) => {
  const opacity = 0.5 + tier * 0.06;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block shrink-0 ${className}`}>
      <path
        d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        fill="hsl(var(--primary))" opacity={opacity}
      />
      <path
        d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
        stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      {tier >= 2 && (
        <path
          d="M12 18a2.4 2.4 0 002.4-2.4c0-1.6-1.2-2.4-1.6-4-.4.8-1.2 1.2-1.6 0-.4 1.6-1.6 2.4-1.6 4A2.4 2.4 0 0012 18z"
          fill="hsl(var(--primary))" opacity={0.7 + tier * 0.03}
        />
      )}
      {tier >= 4 && (
        <>
          <path d="M7 6C6 4 4.5 3 3.5 2.5c.5 1 1 2.2 1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
          <path d="M17 6C18 4 19.5 3 20.5 2.5c-.5 1-1 2.2-1.2 3.5" stroke="hsl(var(--primary))" strokeWidth="1" strokeLinecap="round" opacity={0.6} />
        </>
      )}
    </svg>
  );
};

/** Star icon — for max-tier signals */
export const BrandStar = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block shrink-0 text-primary ${className}`}
    style={{ filter: "drop-shadow(0 0 6px hsl(var(--primary) / 0.5))" }}>
    <path d="M12 2l2.6 6.4L21 9.5l-4.9 4.1L17.5 20 12 16.6 6.5 20l1.4-6.4L3 9.5l6.4-1.1z"
      fill="currentColor" opacity="0.3" />
    <path d="M12 2l2.6 6.4L21 9.5l-4.9 4.1L17.5 20 12 16.6 6.5 20l1.4-6.4L3 9.5l6.4-1.1z"
      stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
  </svg>
);

/** Spark/felt icon ✦ */
export const BrandSpark = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`inline-block shrink-0 text-primary ${className}`}>
    <path d="M8 1l1.5 4.5L14 8l-4.5 1.5L8 15l-1.5-5.5L2 8l4.5-1.5z"
      fill="currentColor" opacity="0.6" />
    <path d="M8 1l1.5 4.5L14 8l-4.5 1.5L8 15l-1.5-5.5L2 8l4.5-1.5z"
      stroke="currentColor" strokeWidth="0.8" strokeLinejoin="round" fill="none" />
  </svg>
);

/** Stitch icon — thread/needle */
export const BrandStitch = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`inline-block shrink-0 text-primary ${className}`}>
    <path d="M3 13L13 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 5l2 2M9 9l2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    <circle cx="13" cy="3" r="1.2" fill="currentColor" opacity="0.6" />
  </svg>
);

/** Eye/view icon */
export const BrandEye = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`inline-block shrink-0 text-primary ${className}`}>
    <path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4z" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" fill="none" />
    <circle cx="8" cy="8" r="2" fill="currentColor" opacity="0.4" />
    <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="0.8" fill="none" />
  </svg>
);

/** Person/ember icon */
export const BrandEmber = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={`inline-block shrink-0 text-primary ${className}`}>
    <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2" />
    <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" fill="none" />
  </svg>
);

/** Shatter/error icon — replaces 💥 */
export const BrandShatter = ({ size = 14, className = "" }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`inline-block shrink-0 text-primary ${className}`}>
    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="currentColor" opacity="0.15" />
    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
  </svg>
);

/** Heat tier to brand icon mapping — returns JSX */
export const HEAT_TIERS_LIST = ["match", "spark", "ignite", "flame", "hot", "burning", "raging", "inferno", "star"] as const;

export function heatTierIndex(level: string): number {
  const idx = HEAT_TIERS_LIST.indexOf(level as typeof HEAT_TIERS_LIST[number]);
  return idx >= 0 ? idx : 0;
}

export const HeatIcon = ({ level, size = 14 }: { level: string; size?: number }) => {
  const tier = heatTierIndex(level);
  if (tier >= 8) return <BrandStar size={size} />;
  return <BrandFlame size={size} tier={tier} />;
};
