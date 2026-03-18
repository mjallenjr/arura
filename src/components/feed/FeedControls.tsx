import { motion } from "framer-motion";
import HeatBadge from "@/components/feed/HeatBadge";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface Signal {
  id: string;
  isAd?: boolean;
  isDiscovery?: boolean;
  isSuggested?: boolean;
  display_name: string;
  song_title: string | null;
  heat_level?: string;
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
  onReportClick: () => void;
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
  onReportClick,
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
          <motion.p
            key={signal.display_name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={signalTransition}
            className="label-signal"
          >
            {signal.display_name}
          </motion.p>
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
        </div>
      )}
    </>
  );
};

export default FeedControls;
