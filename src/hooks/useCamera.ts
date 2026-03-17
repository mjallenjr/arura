import { useRef, useEffect, useCallback, useState } from "react";

interface UseCameraOptions {
  facing: "user" | "environment";
  active: boolean;
}

export function useCamera({ facing, active }: UseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
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

  useEffect(() => {
    if (active) {
      startStream();
    } else {
      stopStream();
    }
    return stopStream;
  }, [active, startStream, stopStream]);

  return { videoRef, streamRef, hasPermission, error, stopStream };
}
