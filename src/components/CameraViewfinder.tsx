import { RefObject, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePinchZoom } from "@/hooks/usePinchZoom";

interface CameraViewfinderProps {
  videoRef: RefObject<HTMLVideoElement>;
  hasPermission: boolean | null;
  error: string | null;
  isRecording: boolean;
  zoom: number;
  zoomCaps: { min: number; max: number; step: number } | null;
  onZoomChange: (zoom: number) => void;
  facing?: "user" | "environment";
}

const CameraViewfinder = ({
  videoRef,
  hasPermission,
  error,
  isRecording,
  zoom,
  zoomCaps,
  onZoomChange,
  facing = "user",
}: CameraViewfinderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  usePinchZoom({
    onZoomChange,
    currentZoom: zoom,
    minZoom: zoomCaps?.min ?? 1,
    maxZoom: zoomCaps?.max ?? 10,
    elementRef: containerRef,
  });

  // Only mirror the front-facing camera preview
  const isFrontCamera = facing === "user";

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden bg-background">
      {/* Live video */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        aria-label="Camera viewfinder"
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: isFrontCamera ? "scaleX(-1)" : "none" }}
      />

      {/* Fallback gradient when no camera */}
      {hasPermission !== true && (
        <div className="absolute inset-0 bg-gradient-to-b from-secondary via-background to-background" />
      )}

      {/* Ambient noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Zoom indicator */}
      <AnimatePresence>
        {zoomCaps && zoom > zoomCaps.min + 0.05 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 signal-surface signal-blur rounded-full px-3 py-1"
          >
            <span className="font-mono-signal text-xs text-muted-foreground">
              {zoom.toFixed(1)}×
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator */}
      {isRecording && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute left-4 top-4 z-20 flex items-center gap-2"
        >
          <motion.div
            className="h-2 w-2 rounded-full bg-destructive"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <span className="label-signal text-destructive">rec</span>
        </motion.div>
      )}

      {/* Error state */}
      {hasPermission === false && error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center max-w-[200px]">
            Camera unavailable. Grant permission to capture signals.
          </p>
        </div>
      )}
    </div>
  );
};

export default CameraViewfinder;
