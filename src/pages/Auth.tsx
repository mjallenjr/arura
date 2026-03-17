import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const Auth = () => {
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const [mode, setMode] = useState<"signin" | "signup">(refCode ? "signup" : "signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  // After signup + login, claim referral
  useEffect(() => {
    if (!user || !refCode) return;
    const claim = async () => {
      const { data: referrer } = await supabase
        .from("public_profiles")
        .select("user_id")
        .eq("referral_code", refCode)
        .single();
      if (referrer && (referrer as any).user_id !== user.id) {
        await supabase.from("referrals").insert({
          referrer_id: (referrer as any).user_id,
          referred_id: user.id,
          code: refCode,
        });
      }
    };
    claim();
  }, [user, refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (forgotMode) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email for a reset link.");
        setForgotMode(false);
      }
      setSubmitting(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await signUp(email, password, displayName || email.split("@")[0]);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Check your email to confirm.");
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
      } else {
        navigate("/");
      }
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
          {forgotMode ? "Reset your password" : mode === "signin" ? "Welcome back" : "Join the moment"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && !forgotMode && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
          {!forgotMode && (
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
            />
          )}

          <motion.button
            type="submit"
            whileTap={{ scale: 0.97 }}
            disabled={submitting}
            className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
          >
            {submitting ? "..." : forgotMode ? "Send Reset Link" : mode === "signin" ? "Enter" : "Create"}
          </motion.button>
        </form>

        {mode === "signin" && !forgotMode && (
          <button
            onClick={() => setForgotMode(true)}
            className="mt-3 w-full text-center text-xs text-muted-foreground/70"
          >
            Forgot password?
          </button>
        )}

        <button
          onClick={() => { setForgotMode(false); setMode(mode === "signin" ? "signup" : "signin"); }}
          className="mt-6 w-full text-center text-xs text-muted-foreground"
        >
          {forgotMode ? "Back to sign in" : mode === "signin" ? "Don't have an account? Join" : "Already here? Sign in"}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
