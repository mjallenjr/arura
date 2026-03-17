import { useRef, useEffect, useCallback, useState } from "react";

interface UseCameraOptions {
  facing: "user" | "environment";
  active: boolean;
}

interface ZoomCapabilities {
  min: number;
  max: number;
  step: number;
}

export function useCamera({ facing, active }: UseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [zoomCaps, setZoomCaps] = useState<ZoomCapabilities | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setZoom(1);
    setZoomCaps(null);
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: true,
      });

      streamRef.current = stream;
      setHasPermission(true);

      // Check zoom capabilities
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities?.() as any;
        if (capabilities?.zoom) {
          setZoomCaps({
            min: capabilities.zoom.min ?? 1,
            max: capabilities.zoom.max ?? 1,
            step: capabilities.zoom.step ?? 0.1,
          });
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err);
      setHasPermission(false);
      setError(err instanceof Error ? err.message : "Camera unavailable");
    }
  }, [facing, stopStream]);

  const applyZoom = useCallback(
    (newZoom: number) => {
      if (!streamRef.current || !zoomCaps) return;
      const clamped = Math.min(zoomCaps.max, Math.max(zoomCaps.min, newZoom));
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        try {
          (videoTrack as any).applyConstraints({ advanced: [{ zoom: clamped }] });
          setZoom(clamped);
        } catch {
          // Zoom not supported on this device
        }
      }
    },
    [zoomCaps]
  );

  useEffect(() => {
    if (active) {
      startStream();
    } else {
      stopStream();
    }
    return stopStream;
  }, [active, startStream, stopStream]);

  return { videoRef, streamRef, hasPermission, error, stopStream, zoom, zoomCaps, applyZoom };
}
