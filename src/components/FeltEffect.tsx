import { forwardRef } from "react";
import { motion } from "framer-motion";

interface FeltEffectProps {
  x: number;
  y: number;
}

const FeltEffect = forwardRef<HTMLDivElement, FeltEffectProps>(({ x, y }, ref) => {
  return (
    <motion.div
      ref={ref}
      className="pointer-events-none absolute z-30"
      style={{ left: x, top: y }}
      initial={{ scale: 1, opacity: 0.5 }}
      animate={{ scale: 4, opacity: 0 }}
      transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />
    </motion.div>
  );
});

FeltEffect.displayName = "FeltEffect";

export default FeltEffect;
