import { motion, AnimatePresence } from "framer-motion";

interface FeedPlayerProps {
  signalId: string;
  mediaUrl: string | null;
  type: string;
}

const FeedPlayer = ({ signalId, mediaUrl, type }: FeedPlayerProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={signalId}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 flex items-center justify-center bg-background"
    >
      {mediaUrl && type === "photo" && (
        <img src={mediaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      )}
      {mediaUrl && type === "video" && (
        <video
          src={mediaUrl}
          autoPlay
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {!mediaUrl && (
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,30%,8%)] via-[hsl(200,25%,12%)] to-[hsl(180,20%,6%)]" />
      )}
    </motion.div>
  </AnimatePresence>
);

export default FeedPlayer;
