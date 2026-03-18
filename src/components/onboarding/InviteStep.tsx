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

            {/* SMS invite */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (!shareLink) return;
                const body = encodeURIComponent(`Join me on Arura — where moments burn bright and fade fast. 🔥\n${shareLink}`);
                window.open(`sms:?&body=${body}`, "_self");
                setShareCount((c) => Math.min(c + 1, INVITE_GOAL));
              }}
              className="w-full rounded-2xl signal-surface py-3 text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Invite via SMS
            </motion.button>

            {/* WhatsApp invite */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (!shareLink) return;
                const text = encodeURIComponent(`Join me on Arura — where moments burn bright and fade fast. 🔥\n${shareLink}`);
                window.open(`https://wa.me/?text=${text}`, "_blank");
                setShareCount((c) => Math.min(c + 1, INVITE_GOAL));
              }}
              className="w-full rounded-2xl signal-surface py-3 text-sm font-medium text-muted-foreground flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Invite via WhatsApp
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
