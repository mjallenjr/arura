import { motion, AnimatePresence } from "framer-motion";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const OfflineBanner = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive/90 backdrop-blur-sm py-2 px-4 text-center"
        >
          <p className="text-xs font-medium text-destructive-foreground">
            You're offline — some features may not work
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineBanner;
