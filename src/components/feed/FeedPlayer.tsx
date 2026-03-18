import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

interface FeedPlayerProps {
  signalId: string;
  mediaUrl: string | null;
  type: string;
}

/** Generate a deterministic warm gradient from signal ID */
function signalGradient(id: string): string {
  const hash = id.split("").reduce((acc, c) => ((acc << 5) - acc + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(hash);
  const hue1 = (abs % 60) + 200; // blue-purple range
  const hue2 = ((abs >> 8) % 60) + 260;
  const hue3 = ((abs >> 16) % 40) + 320;
  const angle = abs % 360;
  return `linear-gradient(${angle}deg, hsl(${hue1} 60% 15%), hsl(${hue2} 50% 20%), hsl(${hue3} 40% 12%))`;
}

const FeedPlayer = ({ signalId, mediaUrl, type }: FeedPlayerProps) => {
  const [mediaError, setMediaError] = useState(false);
  const gradient = useMemo(() => signalGradient(signalId), [signalId]);
  const hasMedia = !!mediaUrl && !mediaError;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={signalId}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: gradient }}
      >
        {/* Ambient noise texture */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          }}
        />

        {hasMedia && type === "photo" && (
          <img
            src={mediaUrl}
            alt="Signal content"
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setMediaError(true)}
          />
        )}
        {hasMedia && type === "video" && (
          <video
            src={mediaUrl}
            autoPlay
            muted
            playsInline
            loop
            className="absolute inset-0 h-full w-full object-cover"
            onError={() => setMediaError(true)}
          />
        )}

        {/* Vignette overlay for all states */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
        }} />
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedPlayer;
