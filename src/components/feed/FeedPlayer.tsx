import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

interface FeedPlayerProps {
  signalId: string;
  mediaUrl: string | null;
  type: string;
}

const FeedPlayer = ({ signalId, mediaUrl, type }: FeedPlayerProps) => {
  const [mediaError, setMediaError] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signalId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center bg-background"
      >
        {mediaUrl && !mediaError && type === "photo" && (
          <img
            src={mediaUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setMediaError(true)}
          />
        )}
        {mediaUrl && !mediaError && type === "video" && (
          <video
            src={mediaUrl}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setMediaError(true)}
          />
        )}
        {(!mediaUrl || mediaError) && (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary flex items-center justify-center">
            {mediaError && (
              <div className="flex flex-col items-center gap-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground/40">
                  <path d="M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10m18 0l-6.5-6.5a2 2 0 00-2.83 0L3 15m18 0v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                </svg>
                <p className="text-[10px] text-muted-foreground/40">signal expired</p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedPlayer;
