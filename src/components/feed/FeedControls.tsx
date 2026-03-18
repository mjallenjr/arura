import { motion } from "framer-motion";
import HeatBadge from "@/components/feed/HeatBadge";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface Signal {
  id: string;
  isAd?: boolean;
  isDiscovery?: boolean;
  isSuggested?: boolean;
  isFanned?: boolean;
  fannedBy?: string;
  display_name: string;
  song_title: string | null;
  heat_level?: string;
  heat_score?: number;
  user_id: string;
}

interface FeedControlsProps {
  signals: Signal[];
  currentIndex: number;
  progress: number;
  isDiscoveryFeed: boolean;
  isSuggestedFeed: boolean;
  currentSignal: Signal;
  userId: string | undefined;
  stitchCount: number;
  hasStitched: boolean;
  showStitchInput: boolean;
  showReportMenu: boolean;
  isFirstTouch: boolean;
  isLevelUpCredit: boolean;
  hasRekindled: boolean;
  onReportClick: () => void;
  onRekindle: () => void;
  onShare: () => void;
  onFan: () => void;
}

const FeedControls = ({
  signals,
  currentIndex,
  progress,
  isDiscoveryFeed,
  isSuggestedFeed,
  currentSignal,
  userId,
  stitchCount,
  hasStitched,
  showStitchInput,
  showReportMenu,
  isFirstTouch,
  isLevelUpCredit,
  hasRekindled,
  onReportClick,
  onRekindle,
  onShare,
  onFan,
}: FeedControlsProps) => {
  const signal = currentSignal;

  return (
    <>
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
        {signals.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{
                width: i < currentIndex ? "100%" : i === currentIndex ? `${progress * 100}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Counter + discover badge + report button */}
      <div className="absolute right-8 top-12 z-10 flex items-center gap-2">
        {isDiscoveryFeed && (
          <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-medium text-primary">
            discover
          </span>
        )}
        {isSuggestedFeed && (
          <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
            suggested
          </span>
        )}
        <p className="label-signal">
          {currentIndex + 1}/{signals.length}
        </p>
      </div>

      {/* Report/block button */}
      {signal && !signal.isAd && !signal.isDiscovery && signal.user_id !== userId && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReportClick();
          }}
          className="absolute left-4 top-12 z-20 h-8 w-8 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center signal-ease hover:bg-background/60"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-foreground/60"
          >
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      )}

      {/* Bottom info overlay (non-ad) */}
      {!signal.isAd && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
        <div className="flex items-center gap-2">
          <motion.p
            key={signal.display_name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={signalTransition}
            className="label-signal"
          >
            {signal.display_name}
          </motion.p>
          {signal.heat_level && signal.heat_level !== "match" && (
            <HeatBadge
              level={signal.heat_level}
              heatScore={signal.heat_score}
              isFirstTouch={isFirstTouch}
              isLevelUpCredit={isLevelUpCredit}
            />
          )}
        </div>
          {signal.song_title && (
            <p className="mt-1 text-xs text-muted-foreground/60">♪ {signal.song_title}</p>
          )}

          {userId && signal.user_id === userId && stitchCount > 0 && (
            <p className="mt-1 text-xs text-primary/80">
              ✦ {stitchCount} stitch{stitchCount > 1 ? "es" : ""}
            </p>
          )}

          {userId &&
            signal.user_id !== userId &&
            !signal.isDiscovery &&
            !hasStitched &&
            !showStitchInput && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.35 }}
                transition={{ delay: 1.5 }}
                className="mt-2 text-[10px] text-muted-foreground"
              >
                double tap to stitch{signal.isSuggested ? " & ignite" : ""} ✦
              </motion.p>
            )}

          {hasStitched && (
            <p className="mt-2 text-[10px] text-primary/60">✦ stitched</p>
          )}

          {/* Rekindle + Share buttons */}
          {userId && signal.user_id !== userId && !signal.isAd && !signal.isDiscovery && (
            <div className="flex items-center gap-3 mt-3">
              {/* Rekindle — only show for signals with heat_level at match/spark (dying) */}
              {(signal.heat_score === undefined || signal.heat_score < 15) && !hasRekindled && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onRekindle(); }}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-medium text-primary signal-ease hover:bg-primary/20"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                    <path d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z" />
                  </svg>
                  rekindle
                </motion.button>
              )}
              {hasRekindled && (
                <span className="text-[10px] text-primary/50">rekindled</span>
              )}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 2.5 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); onShare(); }}
                className="flex items-center gap-1 rounded-full bg-muted/40 px-3 py-1.5 text-[10px] font-medium text-muted-foreground signal-ease hover:bg-muted/60"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                share
              </motion.button>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default FeedControls;
