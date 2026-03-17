import { motion } from "framer-motion";

interface PostActionsProps {
  onPost: () => void;
  onDiscard: () => void;
  uploading?: boolean;
  isPhoto?: boolean;
  songUrl?: string;
  songTitle?: string;
  onSongUrlChange?: (url: string) => void;
  onSongTitleChange?: (title: string) => void;
}

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const PostActions = ({
  onPost,
  onDiscard,
  uploading,
  isPhoto,
  songUrl,
  songTitle,
  onSongUrlChange,
  onSongTitleChange,
}: PostActionsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="flex flex-col items-center gap-6"
    >
      <p className="display-signal">Your signal is ready.</p>
      <p className="text-sm text-muted-foreground">No preview. No edits. Just real.</p>

      {/* Song clip attachment (for photos) */}
      {isPhoto && (
        <div className="w-full flex flex-col gap-3 mt-2">
          <p className="text-xs text-muted-foreground text-center">Add a song clip (optional)</p>
          <input
            type="text"
            placeholder="Song title"
            value={songTitle}
            onChange={(e) => onSongTitleChange?.(e.target.value)}
            className="signal-surface rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
          <input
            type="url"
            placeholder="Song URL (Spotify, SoundCloud, etc.)"
            value={songUrl}
            onChange={(e) => onSongUrlChange?.(e.target.value)}
            className="signal-surface rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
        </div>
      )}

      <div className="mt-4 flex gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onPost}
          disabled={uploading}
          className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50"
        >
          {uploading ? "Posting..." : "Post Signal"}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onDiscard}
          disabled={uploading}
          className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease disabled:opacity-50"
        >
          Discard
        </motion.button>
      </div>
    </motion.div>
  );
};

export default PostActions;
