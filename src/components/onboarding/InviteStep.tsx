import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReferral } from "@/hooks/useReferral";
import { toast } from "sonner";

const signalTransition = { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] as const };

const INVITE_GOAL = 3;

interface InviteStepProps {
  onComplete: () => void;
}

const InviteStep = ({ onComplete }: InviteStepProps) => {
  const { shareLink, referralCount } = useReferral();
  const [shareCount, setShareCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const inviteMessage = `Join me on Arura — where moments burn bright and fade fast. Life, briefly witnessed. 🔥\n\n${shareLink}`;

  const handleShare = async () => {
    if (!shareLink) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Arura",
          text: "Where moments burn bright and fade fast. Life, briefly witnessed. 🔥",
          url: shareLink,
        });
        setShareCount((c) => Math.min(c + 1, INVITE_GOAL));
      } catch {
        // User cancelled
      }
    } else {
      await handleCopy();
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      setShareCount((c) => Math.min(c + 1, INVITE_GOAL));
      toast.success("Link copied ✦");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  // Mark done once they've shared enough (or existing referrals count)
  useEffect(() => {
    if (referralCount >= INVITE_GOAL || shareCount >= INVITE_GOAL) {
      // Slight delay for celebration feel
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [referralCount, shareCount, onComplete]);

  const progress = Math.min(INVITE_GOAL, shareCount + referralCount);

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      {/* Flame invite icon */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...signalTransition, delay: 0.1 }}
        className="relative"
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-primary">
          <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
          <path d="M1 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M19 8v6m3-3h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </motion.div>

      {/* Progress circles */}
      <div className="flex items-center gap-3">
        {Array.from({ length: INVITE_GOAL }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{
              scale: i < progress ? 1.1 : 1,
              opacity: 1,
            }}
            transition={{ ...signalTransition, delay: 0.2 + i * 0.1 }}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
              i < progress
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i < progress ? "✦" : i + 1}
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {progress >= INVITE_GOAL ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="text-sm font-medium text-primary">You're on fire! 🔥</p>
            <p className="text-xs text-muted-foreground">Your embers are waiting</p>
          </motion.div>
        ) : (
          <motion.div
            key="cta"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            {/* Share button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleShare}
              className="w-full rounded-2xl bg-primary py-4 text-sm font-medium text-primary-foreground signal-glow"
            >
              {shareCount === 0 ? "Share invite link" : `Share again (${progress}/${INVITE_GOAL})`}
            </motion.button>

            {/* Copy fallback */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleCopy}
              className="text-xs text-muted-foreground signal-ease hover:text-foreground"
            >
              {copied ? "Copied ✓" : "or copy link"}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InviteStep;
