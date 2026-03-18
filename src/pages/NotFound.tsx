import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";

const signalTransition = { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const };

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-background overflow-hidden px-6">
      {/* Background glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: [0.15, 0.25, 0.15], scale: [1, 1.15, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
        }}
      />

      {/* Flame icon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...signalTransition, delay: 0.1 }}
        className="relative mb-8"
      >
        <motion.svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <path
            d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
            fill="hsl(var(--primary))"
            opacity={0.3}
          />
          <path
            d="M12 2C10.8 6.8 7.2 9.2 7.2 14a4.8 4.8 0 009.6 0c0-4.8-3.6-7.2-4.8-12z"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </motion.svg>
      </motion.div>

      {/* 404 text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...signalTransition, delay: 0.2 }}
        className="text-5xl font-bold tracking-tight text-foreground mb-3"
        style={{ textShadow: "0 0 40px hsl(var(--primary) / 0.2)" }}
      >
        404
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...signalTransition, delay: 0.35 }}
        className="text-sm text-muted-foreground mb-2"
      >
        This signal has burned out.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ ...signalTransition, delay: 0.5 }}
        className="text-[11px] text-muted-foreground italic tracking-wide mb-10"
      >
        Nothing lasts forever — especially bad URLs.
      </motion.p>

      {/* Return button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...signalTransition, delay: 0.6 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/")}
        className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        Return to the fire
      </motion.button>

      {/* Bottom quote */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.2 }}
        transition={{ delay: 2, duration: 1.5 }}
        className="absolute bottom-10 px-10 text-center text-[10px] italic tracking-wide text-muted-foreground"
      >
        Everything burns.
      </motion.p>
    </div>
  );
};

export default NotFound;
