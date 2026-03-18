import { motion, AnimatePresence } from "framer-motion";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface StitchOverlayProps {
  stitchWord: string | null;
  stitchWordPos?: { x: number; y: number; scale: number; rotation: number } | null;
  submittedStitch: {
    word: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  } | null;
  showStitchInput: boolean;
  stitchInput: string;
  stitchPos: { x: number; y: number };
  stitchScale: number;
  stitchRotation: number;
  stitchSuggestions: string[];
  loadingSuggestions: boolean;
  hasStitched: boolean;
  isOwnSignal: boolean;
  isDiscovery: boolean;
  isSuggested: boolean;
  stitchCount: number;
  showIgnitePrompt: boolean;
  isIgnitedInFeed: boolean;
  displayName: string;
  onStitchInputChange: (val: string) => void;
  onStitchSubmit: () => void;
  onStitchClose: () => void;
  onIgnite: () => void;
}

const StitchOverlay = ({
  stitchWord,
  submittedStitch,
  showStitchInput,
  stitchInput,
  stitchPos,
  stitchScale,
  stitchRotation,
  stitchSuggestions,
  loadingSuggestions,
  hasStitched,
  isOwnSignal,
  isDiscovery,
  isSuggested,
  stitchCount,
  showIgnitePrompt,
  isIgnitedInFeed,
  displayName,
  onStitchInputChange,
  onStitchSubmit,
  onStitchClose,
  onIgnite,
}: StitchOverlayProps) => {
  return (
    <>
      {/* Creator's stitch word overlay */}
      {stitchWord && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <motion.p
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ ...signalTransition, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            style={{
              textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)",
              fontStyle: "italic",
            }}
          >
            {stitchWord}
          </motion.p>
        </div>
      )}

      {/* Submitted stitch word at chosen position */}
      {submittedStitch && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute text-2xl font-bold text-primary drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            style={{
              left: `${submittedStitch.x}%`,
              top: `${submittedStitch.y}%`,
              transform: `translate(-50%, -50%) scale(${submittedStitch.scale}) rotate(${submittedStitch.rotation}deg)`,
              textShadow: "0 0 16px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.6)",
              fontStyle: "italic",
            }}
          >
            {submittedStitch.word}
          </motion.p>
        </div>
      )}

      {/* Live stitch preview at tap position while typing */}
      {showStitchInput && stitchInput && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <p
            className="absolute text-2xl font-bold text-primary/70 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            style={{
              left: `${stitchPos.x}%`,
              top: `${stitchPos.y}%`,
              transform: `translate(-50%, -50%) scale(${stitchScale}) rotate(${stitchRotation}deg)`,
              textShadow: "0 0 16px hsl(var(--primary) / 0.3), 0 2px 8px rgba(0,0,0,0.4)",
              fontStyle: "italic",
              transition: "transform 0.1s ease-out",
            }}
          >
            {stitchInput}
          </p>
        </div>
      )}

      {/* Stitch input overlay — positioned near bottom */}
      {showStitchInput && (
        <div
          className="absolute bottom-24 left-0 right-0 z-20 flex flex-col items-center gap-2 px-6"
          onClick={(e) => e.stopPropagation()}
        >
          {/* AI suggestion chips */}
          <AnimatePresence>
            {(stitchSuggestions.length > 0 || loadingSuggestions) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap justify-center gap-1.5 mb-1"
              >
                {loadingSuggestions ? (
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-[10px] text-muted-foreground/50"
                  >
                    ✦ conjuring vibes...
                  </motion.div>
                ) : (
                  stitchSuggestions.map((word, i) => (
                    <motion.button
                      key={word}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...signalTransition, delay: i * 0.06 }}
                      onClick={() => onStitchInputChange(word)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium signal-ease ${
                        stitchInput === word
                          ? "bg-primary/25 text-primary ring-1 ring-primary/40"
                          : "bg-background/60 backdrop-blur-sm text-foreground/70 hover:text-primary"
                      }`}
                    >
                      {word}
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground/60">pinch to resize & rotate</p>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-2 signal-surface signal-blur rounded-2xl px-4 py-2"
          >
            <input
              type="text"
              placeholder="one word"
              value={stitchInput}
              onChange={(e) => onStitchInputChange(e.target.value.replace(/\s/g, "").slice(0, 12))}
              maxLength={12}
              autoFocus
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-24"
              onKeyDown={(e) => e.key === "Enter" && onStitchSubmit()}
            />
            <button
              onClick={onStitchSubmit}
              disabled={!stitchInput.trim()}
              className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground disabled:opacity-30"
            >
              stitch
            </button>
            <button onClick={onStitchClose} className="text-muted-foreground/50 text-xs">
              ✕
            </button>
          </motion.div>

          {/* Ignite button for suggested embers */}
          <AnimatePresence>
            {showIgnitePrompt && isSuggested && !isIgnitedInFeed && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={signalTransition}
                onClick={onIgnite}
                className="mt-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground uppercase tracking-wide"
                whileTap={{ scale: 0.95 }}
              >
                🔥 ignite {displayName}
              </motion.button>
            )}
            {showIgnitePrompt && isSuggested && isIgnitedInFeed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-[10px] text-primary/70"
              >
                🔥 ignited
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </>
  );
};

export default StitchOverlay;
