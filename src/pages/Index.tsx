import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PostActions from "@/components/PostActions";
import StitchWordPreview from "@/components/StitchWordPreview";
import FeedView from "@/components/FeedView";
import Onboarding from "@/components/Onboarding";
import VibesPicker from "@/components/onboarding/VibesPicker";
import { useCamera } from "@/hooks/useCamera";
import { useRecorder } from "@/hooks/useRecorder";
import { useHaptics } from "@/hooks/useHaptics";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

type AppState = "home" | "camera" | "confirm" | "feed";
type CaptureMode = "video" | "photo";

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const Index = () => {
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [state, setState] = useState<AppState>("home");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("video");
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5.0);

  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem("arura_onboarded");
  });
  const [showVibesPicker, setShowVibesPicker] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("environment");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [songUrl, setSongUrl] = useState("");
  const [songTitle, setSongTitle] = useState("");
  const [stitchWord, setStitchWord] = useState("");
  const [stitchWordPos, setStitchWordPos] = useState({ x: 50, y: 40 });
  const [stitchWordScale, setStitchWordScale] = useState(1);
  const [stitchWordRotation, setStitchWordRotation] = useState(0);
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

  const flipVideoBlob = useCallback(async (blob: Blob): Promise<Blob> => {
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
    } catch {}
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
      if (remaining <= 0) stopRecording();
    }, 50);
  }, [stopRecording, startMediaRecorder, startPulse, streamRef, captureMode, capturePhoto]);

  const resetToHome = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
    setPhotoBlob(null);
    setSongUrl("");
    setSongTitle("");
    setStitchWord("");
    setStitchWordPos({ x: 50, y: 40 });
    setStitchWordScale(1);
    setStitchWordRotation(0);
    setState("home");
  }, []);

  const handleDiscard = useCallback(() => {
    setCountdown(5.0);
    setRecordedBlob(null);
    setPhotoBlob(null);
    setSongUrl("");
    setSongTitle("");
    setStitchWord("");
    setStitchWordPos({ x: 50, y: 40 });
    setStitchWordScale(1);
    setStitchWordRotation(0);
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
        const { error: uploadError } = await supabase.storage.from("signals").upload(path, blob);
        if (uploadError) throw uploadError;
      }

      // Pro users get 24h signal duration
      const expiresAt = isPro
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase.from("signals").insert({
        user_id: user.id,
        type: captureMode,
        storage_path: blob ? path : null,
        song_clip_url: songUrl || null,
        song_title: songTitle || null,
        stitch_word: stitchWord || null,
        stitch_word_pos: stitchWord ? { x: stitchWordPos.x, y: stitchWordPos.y, scale: stitchWordScale, rotation: stitchWordRotation } : null,
        expires_at: expiresAt,
      } as any);
      if (insertError) throw insertError;
      toast.success(isPro ? "Signal posted — live for 24h ✦" : "Signal posted");
      resetToHome();
    } catch (err) {
      console.error("Post failed:", err);
      toast.error("Failed to post signal");
    } finally {
      setUploading(false);
    }
  }, [user, captureMode, photoBlob, recordedBlob, songUrl, songTitle, stitchWord, stitchWordPos, stitchWordScale, stitchWordRotation, resetToHome, isPro]);

  const toggleCamera = useCallback(() => {
    setCameraFacing((f) => (f === "user" ? "environment" : "user"));
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // iPhone-style zoom level buttons
  const isFrontCamera = cameraFacing === "user";
  const zoomLevels = zoomCaps ? [
    { label: ".5", value: Math.max(zoomCaps.min, 0.5) },
    { label: "1×", value: 1 },
    { label: "2", value: Math.min(zoomCaps.max, 2) },
  ].filter(z => z.value >= zoomCaps.min && z.value <= zoomCaps.max) : [];

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
              // Show vibes picker after onboarding if user has an account
              if (user) {
                const hasVibes = localStorage.getItem("arura_vibes_picked");
                if (!hasVibes) setShowVibesPicker(true);
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showVibesPicker && user && (
          <VibesPicker
            userId={user.id}
            onComplete={() => {
              setShowVibesPicker(false);
              localStorage.setItem("arura_vibes_picked", "true");
            }}
          />
        )}
      </AnimatePresence>

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
            <div className="absolute inset-0 bg-gradient-to-b from-secondary/30 via-background to-background" />
            <div
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            <div className="relative z-10 flex flex-col items-center gap-12 px-8">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...signalTransition, delay: 0.1 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.svg
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ ...signalTransition, delay: 0.05 }}
                  width="40" height="40" viewBox="0 0 32 32" fill="none" className="text-primary flame-glow"
                >
                  <path d="M9.5 8C8 5.5 5.5 4 4 3.5c1 1.5 1.8 3.5 2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                  <path d="M22.5 8C24 5.5 26.5 4 28 3.5c-1 1.5-1.8 3.5-2 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d="M16 23a3.6 3.6 0 003.6-3.6c0-2.4-1.8-3.6-2.4-6-.6 1.2-1.8 1.8-2.4 0-.6 2.4-2.4 3.6-2.4 6A3.6 3.6 0 0016 23z" fill="currentColor" opacity="0.4" />
                </motion.svg>
                <h1 className="text-3xl font-medium tracking-[-0.06em] text-foreground">arura</h1>
                <p className="text-xs text-muted-foreground tracking-wide">life, briefly witnessed</p>
              </motion.div>

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

        {/* ── CAMERA (iPhone-style) ── */}
        {state === "camera" && (
          <motion.div
            key="camera"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
            className="absolute inset-0 z-10 flex flex-col"
          >
            {/* Full-screen camera viewfinder */}
            <div className="absolute inset-0 overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: isFrontCamera ? "scaleX(-1)" : "none" }}
              />
              {hasPermission !== true && (
                <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-background" />
              )}
            </div>

            {/* Top safe area bar */}
            <div className="relative z-20 flex items-center justify-between px-4 pt-[env(safe-area-inset-top,12px)] pb-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={resetToHome}
                className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </motion.button>

              <div className="flex items-center gap-2">
                {/* Flash placeholder */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  className="h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Center area - recording indicator */}
            <div className="flex-1 relative z-20 flex items-center justify-center">
              {isRecording && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-2"
                >
                  <motion.div
                    className="h-3 w-3 rounded-full bg-red-500"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <p className="font-mono text-3xl font-light text-white drop-shadow-lg tabular-nums">
                    {countdown.toFixed(1)}
                  </p>
                </motion.div>
              )}

              {hasPermission === false && (
                <div className="flex flex-col items-center gap-3 px-8">
                  <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                  <p className="text-sm text-white/70 text-center">
                    Camera access needed to drop signals
                  </p>
                </div>
              )}
            </div>

            {/* Bottom controls - iPhone camera style */}
            <div className="relative z-20 pb-[env(safe-area-inset-bottom,20px)]">
              {/* Zoom level pills */}
              {zoomLevels.length > 1 && !isRecording && (
                <div className="flex justify-center gap-2 mb-4">
                  {zoomLevels.map((z) => (
                    <motion.button
                      key={z.label}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => applyZoom(z.value)}
                      className={`h-8 w-8 rounded-full text-[11px] font-medium flex items-center justify-center transition-all ${
                        Math.abs(zoom - z.value) < 0.1
                          ? "bg-primary/80 text-primary-foreground"
                          : "bg-black/40 backdrop-blur-md text-white/80"
                      }`}
                    >
                      {z.label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Shutter + mode toggle + flip */}
              <div className="flex items-center justify-center gap-8 px-8 mb-4">
                {/* Thumbnail / last capture placeholder */}
                <div className="w-12 h-12" />

                {/* Shutter button - true iOS style */}
                <motion.button
                  onPointerDown={() => {
                    if (!streamRef.current) return;
                    if (captureMode === "photo") {
                      capturePhoto();
                    } else {
                      startRecording();
                    }
                  }}
                  onPointerUp={() => {
                    if (captureMode === "video" && isRecording) {
                      stopRecording();
                    }
                  }}
                  onPointerLeave={() => {
                    if (captureMode === "video" && isRecording) {
                      stopRecording();
                    }
                  }}
                  whileTap={{ scale: 0.92 }}
                  disabled={!streamRef.current}
                  className="relative h-[72px] w-[72px] flex items-center justify-center"
                  aria-label={captureMode === "photo" ? "Take photo" : isRecording ? "Stop" : "Hold to record"}
                >
                  {/* Outer ring */}
                  <div className={`absolute inset-0 rounded-full border-[3px] transition-colors duration-200 ${
                    isRecording ? "border-red-500" : "border-white"
                  }`} />
                  {/* Progress ring for recording */}
                  {isRecording && (
                    <svg className="absolute inset-0" width="72" height="72" viewBox="0 0 72 72">
                      <circle
                        cx="36" cy="36" r="33"
                        fill="none"
                        stroke="hsl(0, 80%, 55%)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 33}
                        strokeDashoffset={2 * Math.PI * 33 * (1 - (5 - countdown) / 5)}
                        transform="rotate(-90 36 36)"
                        className="transition-all duration-100"
                      />
                    </svg>
                  )}
                  {/* Inner circle */}
                  <motion.div
                    animate={isRecording ? { scale: 0.5, borderRadius: "8px" } : { scale: 1, borderRadius: "50%" }}
                    transition={{ duration: 0.2 }}
                    className={`h-[58px] w-[58px] transition-colors duration-200 ${
                      isRecording ? "bg-red-500" : captureMode === "photo" ? "bg-white" : "bg-red-500"
                    }`}
                    style={{ borderRadius: isRecording ? 8 : "50%" }}
                  />
                </motion.button>

                {/* Flip camera */}
                <motion.button
                  whileTap={{ scale: 0.85, rotate: 180 }}
                  onClick={toggleCamera}
                  className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center"
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5" />
                    <path d="M13 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5" />
                    <path d="m21 2-9 9" />
                    <path d="m21 11V2h-9" />
                  </svg>
                </motion.button>
              </div>

              {/* Mode selector - swipe style like iPhone */}
              <div className="flex justify-center gap-6 pb-2">
                <button
                  onClick={() => setCaptureMode("photo")}
                  className={`text-xs font-semibold uppercase tracking-widest transition-all ${
                    captureMode === "photo" ? "text-primary" : "text-white/50"
                  }`}
                >
                  Photo
                </button>
                <button
                  onClick={() => setCaptureMode("video")}
                  className={`text-xs font-semibold uppercase tracking-widest transition-all ${
                    captureMode === "video" ? "text-primary" : "text-white/50"
                  }`}
                >
                  Video
                </button>
              </div>
            </div>
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
