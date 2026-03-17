import { motion } from "framer-motion";

interface PostActionsProps {
  onPost: () => void;
  onDiscard: () => void;
}

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const PostActions = ({ onPost, onDiscard }: PostActionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="flex flex-col items-center gap-6"
    >
      <p className="display-signal">Your signal is ready.</p>
      <p className="text-sm text-muted-foreground">No preview. No edits. Just real.</p>

      <div className="mt-4 flex gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onPost}
          className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease"
        >
          Post Signal
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDiscard}
          className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease"
        >
          Discard
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PostActions;
