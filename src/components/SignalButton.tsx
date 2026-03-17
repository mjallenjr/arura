import { motion } from "framer-motion";
import { useRef, useCallback } from "react";

interface SignalButtonProps {
  isRecording: boolean;
  progress: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  isPhotoMode?: boolean;
}

const SignalButton = ({ isRecording, progress, onStart, onStop, disabled, isPhotoMode }: SignalButtonProps) => {
  const holdRef = useRef(false);

  const handlePointerDown = useCallback(() => {
    if (disabled) return;
    if (isPhotoMode) {
      onStart();
      return;
    }
    holdRef.current = true;
    onStart();
  }, [onStart, disabled, isPhotoMode]);

  const handlePointerUp = useCallback(() => {
    if (isPhotoMode) return;
    if (holdRef.current) {
      holdRef.current = false;
      onStop();
    }
  }, [onStop, isPhotoMode]);

  const circumference = 2 * Math.PI * 36;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="relative flex items-center justify-center">
      <svg className="absolute" width="96" height="96" viewBox="0 0 80 80">
        <circle
          cx="40" cy="40" r="36"
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="2"
          opacity={isRecording ? 0.3 : 0}
        />
        {isRecording && (
          <circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 40 40)"
            className="signal-ease"
          />
        )}
      </svg>

      <motion.button
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        whileTap={{ scale: 0.96 }}
        className={`
          relative z-10 h-20 w-20 rounded-full border-2 
          transition-all duration-200 signal-ease
          ${isRecording
            ? "border-primary signal-glow bg-primary/10"
            : disabled
            ? "border-foreground/10 bg-foreground/5 opacity-50"
            : "border-foreground/20 bg-foreground/5"
          }
        `}
        aria-label={isPhotoMode ? "Take photo" : isRecording ? "Stop recording" : "Hold to record"}
      >
        <motion.div
          className={`
            absolute inset-3 rounded-full transition-all duration-200 signal-ease
            ${isPhotoMode
              ? "bg-foreground/20"
              : isRecording
              ? "bg-primary/30"
              : "bg-foreground/10"
            }
          `}
          animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={isRecording ? { duration: 1, repeat: Infinity } : {}}
        />
      </motion.button>
    </div>
  );
};

export default SignalButton;
