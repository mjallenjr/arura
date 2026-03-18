import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const COOKIE_KEY = "arura_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const respond = (choice: "accepted" | "rejected") => {
    localStorage.setItem(COOKIE_KEY, choice);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl border border-border bg-card p-4 shadow-lg sm:bottom-6"
        >
          <p className="text-xs text-muted-foreground mb-3">
            We use essential cookies to keep arura running and optional analytics cookies to improve your experience.{" "}
            <a href="/legal" className="underline text-foreground">
              Privacy Policy
            </a>
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="flex-1 text-xs"
              onClick={() => respond("rejected")}
            >
              Reject All
            </Button>
            <Button
              size="sm"
              className="flex-1 text-xs"
              onClick={() => respond("accepted")}
            >
              Accept All
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
