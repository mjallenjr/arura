import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SignalButton from "@/components/SignalButton";
import PostActions from "@/components/PostActions";
import FeedView from "@/components/FeedView";
import CameraViewfinder from "@/components/CameraViewfinder";
import Onboarding from "@/components/Onboarding";
import { useCamera } from "@/hooks/useCamera";
import { useRecorder } from "@/hooks/useRecorder";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type AppState = "home" | "camera" | "confirm" | "feed";
type CaptureMode = "video" | "photo";

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const Index = () => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>("home");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("video");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5.0);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("arura_onboarded");
  });
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [songUrl, setSongUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [stitchWord, setStitchWord] = useState("");
  const [uploading, setUploading] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const cameraActive = state === "camera" || state === "confirm";
  const { videoRef, streamRef, hasPermission, error: cameraError, zoom, zoomCaps, applyZoom } = useCamera({
    facing: cameraFacing,
    active: cameraActive,
  });
  const { start: startMediaRecorder, stop: stopMediaRecorder } = useRecorder();
  const { startPulse, stopPulse } = useHaptics();

  // Helper: flip a video blob horizontally (for front camera recordings)
  const flipVideoBlob = useCallback(async (blob: Blob): Promise<Blob> => {
    // For video, we can't easily re-encode in browser, so we accept the raw stream.
    // The real fix is to mirror the CSS on playback. But for photos we flip via canvas.
    return blob;
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Always flip for front camera so the photo matches what the user sees
    if (cameraFacing === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          setPhotoBlob(blob);
          setState("confirm");
        }
      },
      "image/jpeg",
      0.9
    );
  }, [videoRef, cameraFacing]);

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

    if (captureMode === "photo") {
      capturePhoto();
      return;
    }

    setIsRecording(true);
    setCountdown(5.0);
    startTimeRef.current = Date.now();
    setRecordedBlob(null);

    startMediaRecorder(streamRef.current);
    startPulse();

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, 5 - elapsed);
      setCountdown(remaining);

      if (remaining <= 0) {
        stopRecording();
      }
    }, 50);
  }, [stopRecording, startMediaRecorder, startPulse, streamRef, captureMode, capturePhoto]);

  const resetToHome = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
    setPhotoBlob(null);
    setSongUrl("");
    setSongTitle("");
    setStitchWord("");
    setState("home");
  }, []);

  const handleDiscard = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
    setPhotoBlob(null);
    setSongUrl("");
    setSongTitle("");
    setStitchWord("");
    setState("camera");
  }, []);

  const handlePost = useCallback(async () => {
    if (!user) return;
    setUploading(true);

    try {
      const blob = captureMode === "photo" ? photoBlob : recordedBlob;
      const ext = captureMode === "photo" ? "jpg" : "webm";
      const path = `${user.id}/${Date.now()}.${ext}`;

      if (blob) {
        const { error: uploadError } = await supabase.storage
          .from("signals")
          .upload(path, blob);

        if (uploadError) throw uploadError;
      }

      const { error: insertError } = await supabase.from("signals").insert({
        user_id: user.id,
        type: captureMode,
        storage_path: blob ? path : null,
        song_clip_url: songUrl || null,
        song_title: songTitle || null,
        stitch_word: stitchWord || null,
      });

      if (insertError) throw insertError;

      toast.success("Signal posted");
      resetToHome();
    } catch (err) {
      console.error("Post failed:", err);
      toast.error("Failed to post signal");
    } finally {
      setUploading(false);
    }
  }, [user, captureMode, photoBlob, recordedBlob, songUrl, songTitle, stitchWord, resetToHome]);

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
      <canvas ref={canvasRef} className="hidden" />

      {/* Onboarding overlay */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding
            onComplete={() => {
              setShowOnboarding(false);
              localStorage.setItem("arura_onboarded", "true");
            }}
          />
        )}
      </AnimatePresence>
      {cameraActive && (
        <CameraViewfinder
          videoRef={videoRef}
          hasPermission={hasPermission}
          error={cameraError}
          isRecording={isRecording}
          zoom={zoom}
          zoomCaps={zoomCaps}
          onZoomChange={applyZoom}
          facing={cameraFacing}
        />
      )}

      <AnimatePresence mode="wait">
        {/* ── HOME HUB ── */}
        {state === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          >
            {/* Ambient background */}
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-12 px-8">
              {/* Brand */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...signalTransition, delay: 0.1 }}
                className="flex flex-col items-center gap-2"
              >
                <h1 className="text-3xl font-medium tracking-[-0.06em] text-foreground">arura</h1>
                <p className="text-xs text-muted-foreground tracking-wide">life, briefly witnessed</p>
              </motion.div>

              {/* Two choices */}
              <div className="flex flex-col gap-4 w-full max-w-[260px]">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...signalTransition, delay: 0.2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setState("camera")}
                  className="group relative overflow-hidden rounded-2xl bg-primary px-8 py-5 text-primary-foreground signal-glow signal-ease"
                >
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <span className="text-lg font-medium tracking-[-0.02em]">Drop</span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] opacity-60">
                      share something warm
                    </span>
                  </div>
                </motion.button>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...signalTransition, delay: 0.3 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setState("feed")}
                  className="group relative overflow-hidden rounded-2xl signal-surface signal-blur px-8 py-5 text-foreground signal-ease border border-border/30"
                >
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <span className="text-lg font-medium tracking-[-0.02em]">Indulge</span>
                    <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                      see what's hot
                    </span>
                  </div>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── CAMERA ── */}
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
              <button onClick={resetToHome} className="label-signal">
                ← back
              </button>
              <div className="flex items-center gap-2">
                {/* Mode toggle */}
                <div className="flex signal-surface rounded-full signal-blur">
                  <button
                    onClick={() => setCaptureMode("video")}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-medium signal-ease ${
                      captureMode === "video" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Video
                  </button>
                  <button
                    onClick={() => setCaptureMode("photo")}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-medium signal-ease ${
                      captureMode === "photo" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    }`}
                  >
                    Photo
                  </button>
                </div>
                <button
                  onClick={toggleCamera}
                  className="signal-surface rounded-full p-2.5 signal-blur"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                    <path d="m21 2-9 9" />
                    <path d="m21 11V2h-9" />
                  </svg>
                </button>
              </div>
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
                  {hasPermission === false
                    ? "Camera access needed"
                    : captureMode === "photo"
                    ? "Tap to capture"
                    : "Hold to record"}
                </motion.p>
              )}

              <SignalButton
                isRecording={isRecording}
                progress={(5 - countdown) / 5}
                onStart={startRecording}
                onStop={stopRecording}
                disabled={!streamRef.current}
                isPhotoMode={captureMode === "photo"}
              />
            </div>

            <div />
          </motion.div>
        )}

        {/* ── CONFIRM ── */}
        {state === "confirm" && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8"
          >
            <div className="absolute inset-0 bg-background/70 signal-blur" />

            {/* Video/Photo preview */}
            {recordedBlob && captureMode === "video" && (
              <video
                src={URL.createObjectURL(recordedBlob)}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}
            {photoBlob && captureMode === "photo" && (
              <img
                src={URL.createObjectURL(photoBlob)}
                alt="Preview"
                className="absolute inset-0 h-full w-full object-cover opacity-40"
              />
            )}

            <div className="relative z-10 w-full max-w-sm">
              <PostActions
                onPost={handlePost}
                onDiscard={handleDiscard}
                uploading={uploading}
                isPhoto={captureMode === "photo"}
                songUrl={songUrl}
                songTitle={songTitle}
                onSongUrlChange={setSongUrl}
                onSongTitleChange={setSongTitle}
                stitchWord={stitchWord}
                onStitchWordChange={setStitchWord}
              />
            </div>
          </motion.div>
        )}

        {/* ── FEED ── */}
        {state === "feed" && (
          <motion.div
            key="feed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0"
          >
            <FeedView onEnd={resetToHome} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
