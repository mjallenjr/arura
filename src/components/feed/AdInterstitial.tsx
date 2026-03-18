import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Ad } from "@/hooks/useAds";

interface AdInterstitialProps {
  open: boolean;
  ad: Ad | null;
  onComplete: () => void;
  onSkip: () => void;
}

const AD_COUNTDOWN_SECONDS = 4;

const AdInterstitial = ({ open, ad, onComplete, onSkip }: AdInterstitialProps) => {
  const [countdown, setCountdown] = useState(AD_COUNTDOWN_SECONDS);
  const [canDismiss, setCanDismiss] = useState(false);

  useEffect(() => {
    if (!open) {
      setCountdown(AD_COUNTDOWN_SECONDS);
      setCanDismiss(false);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          setCanDismiss(true);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  const handleDismiss = useCallback(() => {
    if (canDismiss) onComplete();
  }, [canDismiss, onComplete]);

  if (!ad) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full max-w-sm mx-4 rounded-2xl bg-background border border-border overflow-hidden"
          >
            {/* Ad media */}
            <div className="relative aspect-video bg-muted">
              <img
                src={ad.media_url}
                alt={ad.headline}
                className="w-full h-full object-cover"
              />
              {/* Countdown / close button */}
              <div className="absolute top-3 right-3">
                {canDismiss ? (
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    onClick={handleDismiss}
                    className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-foreground">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </motion.button>
                ) : (
                  <div className="h-7 w-7 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-foreground">
                      {countdown}
                    </span>
                  </div>
                )}
              </div>
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted-foreground/20">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: AD_COUNTDOWN_SECONDS, ease: "linear" }}
                />
              </div>
            </div>

            {/* Ad info */}
            <div className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                sponsored
              </p>
              <p className="text-sm font-semibold text-foreground">{ad.headline}</p>
              {ad.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.description}</p>
              )}
              <div className="flex items-center gap-2 mt-3">
                {ad.cta_url && (
                  <a
                    href={ad.cta_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-lg bg-primary/10 px-3 py-2 text-center text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
                  >
                    {ad.cta_text ?? "Learn more"}
                  </a>
                )}
                {canDismiss && (
                  <button
                    onClick={handleDismiss}
                    className="rounded-lg bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/60 transition-colors"
                  >
                    continue
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AdInterstitial;
