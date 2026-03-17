import { motion } from "framer-motion";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface FeedEndScreenProps {
  onEnd: () => void;
}

const FeedEndScreen = ({ onEnd }: FeedEndScreenProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ ...signalTransition, delay: 0.3 }}
    className="flex h-full flex-col items-center justify-center gap-8 p-8"
  >
    <p className="display-signal text-center">Your fire is resting.</p>
    <p className="text-sm text-muted-foreground">Go spark something new.</p>
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onEnd}
      className="mt-4 signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease"
    >
      Return
    </motion.button>
  </motion.div>
);

export default FeedEndScreen;
