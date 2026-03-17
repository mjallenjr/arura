import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase sends the user here with a recovery token in the URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated — you're in");
      navigate("/");
    }
    setSubmitting(false);
  };

  return (
    <div className="flex h-svh w-full items-center justify-center bg-background p-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={signalTransition}
        className="w-full max-w-sm"
      >
        <h1 className="display-signal text-center mb-2">arura</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {ready ? "Set your new password" : "Verifying reset link..."}
        </p>

        {ready ? (
          <form onSubmit={handleReset} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={submitting}
              className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
            >
              {submitting ? "..." : "Update Password"}
            </motion.button>
          </form>
        ) : (
          <p className="text-xs text-muted-foreground text-center animate-pulse">
            Loading...
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
