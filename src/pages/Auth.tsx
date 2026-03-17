import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

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
  const [showVerify, setShowVerify] = useState(false);
  const [resending, setResending] = useState(false);
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
        setShowVerify(true);
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

  const handleResendVerification = useCallback(async () => {
    if (!email) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Verification email resent!");
    }
    setResending(false);
  }, [email]);

  return (
    <div className="flex h-svh w-full items-center justify-center bg-background p-8">
      <AnimatePresence mode="wait">
        {showVerify ? (
          <motion.div
            key="verify"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={signalTransition}
            className="w-full max-w-sm flex flex-col items-center gap-6"
          >
            <span className="text-5xl">📬</span>
            <h2 className="text-xl font-medium text-foreground tracking-tight text-center">Check your email</h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              We sent a verification link to<br />
              <span className="text-foreground font-medium">{email}</span>
            </p>
            <p className="text-xs text-muted-foreground text-center max-w-[260px]">
              Click the link in your email to activate your account. Check your spam folder if you don't see it.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleResendVerification}
              disabled={resending}
              className="rounded-full bg-primary/15 px-6 py-2.5 text-xs font-medium text-primary signal-ease disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </motion.button>
            <button
              onClick={() => { setShowVerify(false); setMode("signin"); }}
              className="text-xs text-muted-foreground"
            >
              Back to sign in
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={signalTransition}
            className="w-full max-w-sm"
          >
            <div className="flex flex-col items-center gap-3 mb-8">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-primary">
                <path d="M12 2c-1 4-4 6-4 10a6 6 0 0012 0c0-4-3-6-4-10-1 2-3 3-4 0z" fill="currentColor" opacity="0.2" />
                <path d="M12 2c-1 4-4 6-4 10a6 6 0 0012 0c0-4-3-6-4-10-1 2-3 3-4 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M12 18a3 3 0 003-3c0-2-1.5-3-2-5-.5 1-1.5 1.5-2 0-.5 2-2 3-2 5a3 3 0 003 3z" fill="currentColor" opacity="0.4" />
              </svg>
              <h1 className="display-signal text-center">arura</h1>
              <p className="text-sm text-muted-foreground text-center">
                {forgotMode ? "Reset your password" : mode === "signin" ? "Welcome back" : "Join the moment"}
              </p>
            </div>

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

            {!forgotMode && (
              <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    const { error } = await lovable.auth.signInWithOAuth("google", {
                      redirect_uri: window.location.origin,
                    });
                    if (error) toast.error(error.message ?? "Google sign-in failed");
                  }}
                  className="w-full flex items-center justify-center gap-2.5 signal-surface rounded-full px-8 py-3 text-sm font-medium text-foreground signal-ease hover:ring-1 hover:ring-primary/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </motion.button>
              </div>
            )}

            <button
              onClick={() => { setForgotMode(false); setShowVerify(false); setMode(mode === "signin" ? "signup" : "signin"); }}
              className="mt-4 w-full text-center text-xs text-muted-foreground"
            >
              {forgotMode ? "Back to sign in" : mode === "signin" ? "Don't have an account? Join" : "Already here? Sign in"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
