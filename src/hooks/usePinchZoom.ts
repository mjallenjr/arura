import { useRef, useCallback, useEffect } from "react";

interface UsePinchZoomOptions {
  onZoomChange: (zoom: number) => void;
  currentZoom: number;
  minZoom: number;
  maxZoom: number;
  elementRef: React.RefObject<HTMLElement | null>;
}

export function usePinchZoom({ onZoomChange, currentZoom, minZoom, maxZoom, elementRef }: UsePinchZoomOptions) {
  const initialDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef(currentZoom);

  const getDistance = (t1: Touch, t2: Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistRef.current = getDistance(e.touches[0], e.touches[1]);
      initialZoomRef.current = currentZoom;
    }
  }, [currentZoom]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistRef.current !== null) {
      e.preventDefault();
      const dist = getDistance(e.touches[0], e.touches[1]);
      const scale = dist / initialDistRef.current;
      const newZoom = Math.min(maxZoom, Math.max(minZoom, initialZoomRef.current * scale));
      onZoomChange(newZoom);
    }
  }, [onZoomChange, minZoom, maxZoom]);

  const handleTouchEnd = useCallback(() => {
    initialDistRef.current = null;
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);
}
