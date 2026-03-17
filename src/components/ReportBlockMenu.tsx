import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReportBlockMenuProps {
  targetUserId: string;
  targetUserName: string;
  signalId?: string;
  onClose: () => void;
  onBlocked?: () => void;
}

const REASONS = [
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Something else" },
];

const signalTransition = { duration: 0.3, ease: [0.2, 0.8, 0.2, 1] as const };

const ReportBlockMenu = ({ targetUserId, targetUserName, signalId, onClose, onBlocked }: ReportBlockMenuProps) => {
  const { user } = useAuth();
  const [view, setView] = useState<"menu" | "report" | "block-confirm">("menu");
  const [reason, setReason] = useState("inappropriate");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      signal_id: signalId || null,
      reason,
      details: details.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to submit report");
    } else {
      toast.success("Report submitted — we'll review it soon");
      onClose();
    }
  };

  const handleBlock = async () => {
    if (!user) return;
    setSubmitting(true);

    // Remove follow relationships in both directions
    await Promise.all([
      supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetUserId),
      supabase.from("follows").delete().eq("follower_id", targetUserId).eq("following_id", user.id),
    ]);

    const { error } = await supabase.from("blocks").insert({
      blocker_id: user.id,
      blocked_id: targetUserId,
    });
    setSubmitting(false);
    if (error?.code === "23505") {
      toast("Already blocked");
      onClose();
      return;
    }
    if (error) {
      toast.error("Failed to block");
    } else {
      toast.success(`Blocked ${targetUserName}`);
      onBlocked?.();
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={signalTransition}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10"
      >
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-muted" />

        <AnimatePresence mode="wait">
          {view === "menu" && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
              <p className="label-signal text-center mb-2">{targetUserName}</p>
              <button
                onClick={() => setView("report")}
                className="w-full signal-surface rounded-xl p-4 text-sm text-foreground text-left signal-ease hover:ring-1 hover:ring-primary/20 flex items-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-destructive">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
                Report
              </button>
              <button
                onClick={() => setView("block-confirm")}
                className="w-full signal-surface rounded-xl p-4 text-sm text-destructive text-left signal-ease hover:ring-1 hover:ring-destructive/20 flex items-center gap-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                </svg>
                Block
              </button>
              <button onClick={onClose} className="mt-2 text-xs text-muted-foreground text-center">Cancel</button>
            </motion.div>
          )}

          {view === "report" && (
            <motion.div key="report" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
              <button onClick={() => setView("menu")} className="text-muted-foreground self-start">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="label-signal text-center">Why are you reporting?</p>
              <div className="flex flex-col gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className={`rounded-xl px-4 py-3 text-sm text-left signal-ease ${
                      reason === r.value
                        ? "bg-primary/15 text-primary ring-1 ring-primary/30"
                        : "signal-surface text-foreground hover:ring-1 hover:ring-primary/10"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Add details (optional)"
                value={details}
                onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                maxLength={500}
                rows={2}
                className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 resize-none"
              />
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleReport}
                disabled={submitting}
                className="rounded-full bg-destructive px-8 py-3 text-sm font-medium text-destructive-foreground signal-ease disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </motion.button>
            </motion.div>
          )}

          {view === "block-confirm" && (
            <motion.div key="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 items-center">
              <p className="label-signal">Block {targetUserName}?</p>
              <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                They won't be able to see your signals, message you, or find your profile. You won't see their content either.
              </p>
              <div className="flex gap-3 mt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBlock}
                  disabled={submitting}
                  className="rounded-full bg-destructive px-6 py-3 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                >
                  {submitting ? "Blocking..." : "Block"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setView("menu")}
                  className="signal-surface rounded-full px-6 py-3 text-sm font-medium text-muted-foreground"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default ReportBlockMenu;
