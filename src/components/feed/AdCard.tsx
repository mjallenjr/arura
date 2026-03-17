import { motion, AnimatePresence } from "framer-motion";
import type { Ad } from "@/hooks/useAds";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface AdCardProps {
  ad: Ad;
  signalId: string;
}

const AdCard = ({ ad, signalId }: AdCardProps) => (
  <motion.div
    key={`ad-${signalId}`}
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={signalTransition}
    className="flex flex-col gap-2"
  >
    <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">
      sponsored
    </span>
    <p
      className="text-lg font-bold text-foreground tracking-tight"
      style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}
    >
      {ad.headline}
    </p>
    {ad.description && (
      <p
        className="text-xs text-foreground/70"
        style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
      >
        {ad.description}
      </p>
    )}
    <div className="flex items-center gap-3 mt-1">
      <span className="text-[10px] text-muted-foreground/60">{ad.company_name}</span>
      {ad.cta_url && (
        <a
          href={ad.cta_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground"
        >
          {ad.cta_text || "Learn More"}
        </a>
      )}
    </div>
  </motion.div>
);

export default AdCard;
