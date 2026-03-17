import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignalButton from "@/components/SignalButton";
import PostActions from "@/components/PostActions";
import FeedView from "@/components/FeedView";
import CameraViewfinder from "@/components/CameraViewfinder";
import { useCamera } from "@/hooks/useCamera";
import { useRecorder } from "@/hooks/useRecorder";
import { useHaptics } from "@/hooks/useHaptics";

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
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const cameraActive = state === "camera" || state === "confirm";
  const { videoRef, streamRef, hasPermission, error: cameraError } = useCamera({
    facing: cameraFacing,
    active: cameraActive,
  });
  const { start: startMediaRecorder, stop: stopMediaRecorder } = useRecorder();
  const { startPulse, stopPulse } = useHaptics();

  const stopRecording = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    stopPulse();
    setIsRecording(false);

    try {
      const blob = await stopMediaRecorder();
      setRecordedBlob(blob);
    } catch {
      // recorder wasn't active
    }

    setState("confirm");
  }, [stopMediaRecorder, stopPulse]);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    setIsRecording(true);
    setCountdown(5.0);
    startTimeRef.current = Date.now();
    setRecordedBlob(null);

    // Start media recorder
    startMediaRecorder(streamRef.current);

    // Start haptic pulse
    startPulse();

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(remaining);

      if (remaining <= 0) {
        stopRecording();
      }
    }, 50);
  }, [stopRecording, startMediaRecorder, startPulse, streamRef]);

  const handleDiscard = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
    setState("camera");
  }, []);

  const handlePost = useCallback(() => {
    // In production: upload recordedBlob to temp storage with 2hr TTL
    // For now, we just move to feed
    console.log("Signal posted:", recordedBlob ? `${(recordedBlob.size / 1024).toFixed(0)}KB` : "no data");
    setState("feed");
  }, [recordedBlob]);

  const handleFeedEnd = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
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
      {/* Live camera feed - always behind when on camera/confirm */}
      {cameraActive && (
        <CameraViewfinder
          videoRef={videoRef}
          hasPermission={hasPermission}
          error={cameraError}
          isRecording={isRecording}
        />
      )}

      <AnimatePresence mode="wait">
        {state === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 z-10 flex flex-col justify-between p-8"
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
                  className="font-mono-signal text-2xl font-medium text-foreground drop-shadow-lg"
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
                  {hasPermission === false ? "Camera access needed" : "Capture a moment"}
                </motion.p>
              )}

              <SignalButton
                isRecording={isRecording}
                progress={(5 - countdown) / 5}
                onStart={startRecording}
                onStop={stopRecording}
                disabled={!streamRef.current}
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
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8"
          >
            {/* Dark overlay over frozen camera */}
            <div className="absolute inset-0 bg-background/70 signal-blur" />
            <div className="relative z-10">
              <PostActions onPost={handlePost} onDiscard={handleDiscard} />
            </div>
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
