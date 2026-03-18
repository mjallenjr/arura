import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useReferral } from "@/hooks/useReferral";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const TIER_THRESHOLDS = [
  { count: 1, label: "First Spark", emoji: "✦" },
  { count: 5, label: "Flame Carrier", emoji: "🔥" },
  { count: 10, label: "Inferno Spark", emoji: "⚡" },
  { count: 25, label: "Eternal Flame", emoji: "👑" },
];

function getNextTier(count: number) {
  for (const t of TIER_THRESHOLDS) {
    if (count < t.count) return t;
  }
  return null;
}

interface InviteEmbersProps {
  /** Compact mode for inline use (e.g. banner) */
  variant?: "full" | "banner";
}

const InviteEmbers = ({ variant = "full" }: InviteEmbersProps) => {
  const { shareLink, referralCount, reward } = useReferral();
  const [copied, setCopied] = useState(false);
  const nextTier = getNextTier(referralCount);

  const inviteMessage = `Join me on Arura — where moments burn bright and fade fast. Life, briefly witnessed. 🔥\n\n${shareLink}`;

  const handleNativeShare = async () => {
    if (!shareLink) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Arura",
          text: "Where moments burn bright and fade fast. Life, briefly witnessed. 🔥",
          url: shareLink,
        });
      } catch {
        // User cancelled — that's fine
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(inviteMessage);
      setCopied(true);
      toast.success("Link copied — share it anywhere ✦");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  if (!shareLink) return null;

  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={signalTransition}
        className="rounded-2xl p-4 mb-4"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--primary) / 0.04))",
          border: "1px solid hsl(var(--primary) / 0.15)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Know someone who'd vibe here?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Invite them — earn bonus heat ✦
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNativeShare}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground flex-shrink-0"
          >
            Invite
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Full invite section
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="mb-6"
    >
      <p className="label-signal mb-3">bring your people</p>

      {/* Heat bonus card */}
      <div
        className="rounded-2xl p-5 mb-3"
        style={{
          background: "linear-gradient(135deg, hsl(var(--primary) / 0.1), hsl(var(--primary) / 0.03))",
          border: "1px solid hsl(var(--primary) / 0.12)",
        }}
      >
        {/* Progress toward next tier */}
        {nextTier && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-muted-foreground">
                {referralCount} / {nextTier.count} invites
              </span>
              <span className="text-[11px] text-primary font-medium">
                {nextTier.emoji} {nextTier.label}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (referralCount / nextTier.count) * 100)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Current tier badge */}
        {reward.tier !== "none" && (
          <div className="flex items-center gap-2 mb-4 p-2 rounded-xl bg-primary/5">
            <span className="text-lg">
              {reward.tier === "eternal" ? "👑" : reward.tier === "inferno" ? "⚡" : reward.tier === "flame" ? "🔥" : "✦"}
            </span>
            <div>
              <p className="text-xs font-medium text-foreground">{reward.label}</p>
              <p className="text-[10px] text-muted-foreground">+{reward.bonusMinutes}min flare duration</p>
            </div>
          </div>
        )}

        {/* Invite message preview */}
        <div className="rounded-xl bg-muted/50 p-3 mb-3">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            "Join me on Arura — where moments burn bright and fade fast. 🔥"
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNativeShare}
            className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground signal-glow"
          >
            Share Invite
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              if (!shareLink) return;
              const body = encodeURIComponent(`Join me on Arura — where moments burn bright and fade fast. 🔥\n${shareLink}`);
              window.open(`sms:?&body=${body}`, "_self");
            }}
            className="rounded-xl signal-surface px-4 py-3 text-sm font-medium text-muted-foreground"
            title="Invite via SMS"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="rounded-xl signal-surface px-4 py-3 text-sm font-medium text-muted-foreground"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.span key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>✓</motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0.5 }} animate={{ scale: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default InviteEmbers;
