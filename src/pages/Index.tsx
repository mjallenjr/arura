import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignalButton from "@/components/SignalButton";
import PostActions from "@/components/PostActions";
import FeedView from "@/components/FeedView";

type AppState = "camera" | "confirm" | "feed";

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const Index = () => {
  const [state, setState] = useState<AppState>("camera");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5.0);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const stopRecording = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
    setState("confirm");
  }, []);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setCountdown(5.0);
    startTimeRef.current = Date.now();

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(remaining);

      if (remaining <= 0) {
        stopRecording();
      }
    }, 50);
  }, [stopRecording]);

  const handleDiscard = useCallback(() => {
    setCountdown(5.0);
    setState("camera");
  }, []);

  const handlePost = useCallback(() => {
    setState("feed");
  }, []);

  const handleFeedEnd = useCallback(() => {
    setCountdown(5.0);
    setState("camera");
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraFacing((f) => (f === "user" ? "environment" : "user"));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="relative h-svh w-full overflow-hidden bg-background">
      {/* Simulated camera background */}
      <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-background" />

      {/* Ambient noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <AnimatePresence mode="wait">
        {state === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 flex flex-col justify-between p-8"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <p className="label-signal">signal</p>
              <button
                onClick={toggleCamera}
                className="signal-surface rounded-full p-2.5 signal-blur"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-muted-foreground"
                >
                  <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                  <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                  <path d="m21 2-9 9" />
                  <path d="m21 11V2h-9" />
                </svg>
              </button>
            </div>

            {/* Center */}
            <div className="flex flex-col items-center gap-6">
              {isRecording && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="font-mono-signal text-2xl font-medium text-foreground"
                >
                  {countdown.toFixed(2).padStart(5, "0")}
                </motion.p>
              )}

              {!isRecording && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-muted-foreground"
                >
                  Capture a moment
                </motion.p>
              )}

              <SignalButton
                isRecording={isRecording}
                progress={(5 - countdown) / 5}
                onStart={startRecording}
                onStop={stopRecording}
              />
            </div>

            {/* Bottom spacer */}
            <div />
          </motion.div>
        )}

        {state === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 flex flex-col items-center justify-center p-8"
          >
            <PostActions onPost={handlePost} onDiscard={handleDiscard} />
          </motion.div>
        )}

        {state === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0"
          >
            <FeedView onEnd={handleFeedEnd} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
