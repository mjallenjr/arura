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

const SmsIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const CopyIcon = ({ copied }: { copied: boolean }) => (
  <AnimatePresence mode="wait">
    {copied ? (
      <motion.svg key="check" initial={{ scale: 0.5 }} animate={{ scale: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </motion.svg>
    ) : (
      <motion.svg key="copy" initial={{ scale: 0.5 }} animate={{ scale: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="9" y="9" width="13" height="13" rx="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </motion.svg>
    )}
  </AnimatePresence>
);

interface InviteEmbersProps {
  variant?: "full" | "banner";
}

const InviteEmbers = ({ variant = "full" }: InviteEmbersProps) => {
  const { shareLink, referralCount, reward } = useReferral();
  const [copied, setCopied] = useState(false);
  const nextTier = getNextTier(referralCount);

  const inviteText = `Join me on Arura — where moments burn bright and fade fast. 🔥\n${shareLink}`;

  const handleNativeShare = async () => {
    if (!shareLink) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Join me on Arura", text: "Where moments burn bright and fade fast. 🔥", url: shareLink });
      } catch { /* cancelled */ }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      toast.success("Link copied ✦");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const openSms = () => {
    if (!shareLink) return;
    window.open(`sms:?&body=${encodeURIComponent(inviteText)}`, "_self");
  };

  const openWhatsApp = () => {
    if (!shareLink) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteText)}`, "_blank");
  };

  if (!shareLink) return null;

  /* ── Banner variant ── */
  if (variant === "banner") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={signalTransition}
        className="rounded-2xl p-3.5 mb-4 border border-primary/10"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), transparent)" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground leading-tight">
              Know someone who'd vibe here?
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Invite them — earn bonus heat ✦
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNativeShare}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground flex-shrink-0"
          >
            Invite
          </motion.button>
        </div>
      </motion.div>
    );
  }

  /* ── Full variant ── */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={signalTransition}
      className="mb-6"
    >
      <p className="label-signal mb-3">bring your people</p>

      <div
        className="rounded-2xl p-4 border border-primary/10"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08), hsl(var(--primary) / 0.02))" }}
      >
        {/* Tier progress */}
        {nextTier && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-muted-foreground">
                {referralCount}/{nextTier.count} invites
              </span>
              <span className="text-[11px] text-primary font-medium">
                {nextTier.emoji} {nextTier.label}
              </span>
            </div>
            <div className="h-1 rounded-full bg-muted/60 overflow-hidden">
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
          <div className="flex items-center gap-2 mb-3 py-1.5 px-2.5 rounded-lg bg-primary/5">
            <span className="text-base">
              {reward.tier === "eternal" ? "👑" : reward.tier === "inferno" ? "⚡" : reward.tier === "flame" ? "🔥" : "✦"}
            </span>
            <div>
              <p className="text-[11px] font-medium text-foreground leading-tight">{reward.label}</p>
              <p className="text-[10px] text-muted-foreground">+{reward.bonusMinutes}min flare duration</p>
            </div>
          </div>
        )}

        {/* Action row — single line of equal icon buttons + primary CTA */}
        <div className="flex items-center gap-1.5">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNativeShare}
            className="flex-1 rounded-xl bg-primary py-2.5 text-[13px] font-medium text-primary-foreground"
          >
            Share
          </motion.button>

          {[
            { icon: <SmsIcon />, action: openSms, label: "SMS" },
            { icon: <WhatsAppIcon />, action: openWhatsApp, label: "WhatsApp" },
            { icon: <CopyIcon copied={copied} />, action: handleCopy, label: copied ? "Copied" : "Copy" },
          ].map((btn) => (
            <motion.button
              key={btn.label}
              whileTap={{ scale: 0.92 }}
              onClick={btn.action}
              title={btn.label}
              className="h-10 w-10 flex items-center justify-center rounded-xl border border-border/40 text-muted-foreground transition-colors hover:text-foreground hover:border-primary/30"
            >
              {btn.icon}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default InviteEmbers;
