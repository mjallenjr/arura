import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useCallback, useState, useEffect } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useHaptics } from "@/hooks/useHaptics";

const tabs = [
  { path: "/home", label: "arura", icon: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" },
  { path: "/discover", label: "wonder", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
  { path: "/people", label: "embers", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" },
  { path: "/messages", label: "words", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { path: "/profile", label: "me", icon: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" },
];

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { vibrate } = useHaptics();

  const handleTap = useCallback((path: string) => {
    vibrate(15);
    navigate(path);
  }, [navigate, vibrate]);

  const [immersive, setImmersive] = useState(false);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setImmersive(document.body.hasAttribute("data-immersive"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-immersive"] });
    return () => observer.disconnect();
  }, []);

  if (location.pathname === "/auth" || location.pathname === "/" || immersive) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-safe" role="navigation" aria-label="Main navigation">
      <div className="flex items-center gap-1 signal-surface signal-blur rounded-full px-2 py-1.5 mb-4">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleTap(tab.path)}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-medium signal-ease ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-primary/10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              {active && (
                <motion.div
                  className="absolute inset-0 rounded-full pointer-events-none"
                  animate={{
                    boxShadow: [
                      "0 0 0px 0px hsl(var(--signal-glow) / 0)",
                      "0 0 12px 2px hsl(var(--signal-glow) / 0.2)",
                      "0 0 0px 0px hsl(var(--signal-glow) / 0)",
                    ],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="relative z-10"
                aria-hidden="true"
              >
                <path d={tab.icon} />
              </svg>
              <span className="relative z-10 hidden sm:inline">{tab.label}</span>
            </motion.button>
          );
        })}
        <div className="relative z-10 ml-1">
          <NotificationBell />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
