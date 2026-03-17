import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const Auth = () => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

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
        <h1 className="display-signal text-center mb-2">signal</h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {mode === "signin" ? "Welcome back" : "Join the moment"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
            {submitting ? "..." : mode === "signin" ? "Enter" : "Create"}
          </motion.button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-6 w-full text-center text-xs text-muted-foreground"
        >
          {mode === "signin" ? "Don't have an account? Join" : "Already here? Sign in"}
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
