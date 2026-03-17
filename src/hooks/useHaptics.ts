import { useRef, useCallback } from "react";

/**
 * Provides haptic feedback using the Vibration API.
 * Fires a short pulse every second during recording.
 */
export function useHaptics() {
  const intervalRef = useRef<number | null>(null);

  const vibrate = useCallback((pattern: number | number[] = 30) => {
    if ("vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const startPulse = useCallback(() => {
    vibrate(40);
    intervalRef.current = window.setInterval(() => {
      vibrate(40);
    }, 1000);
  }, [vibrate]);

  const stopPulse = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    navigator.vibrate?.(0); // cancel any ongoing vibration
  }, []);

  return { vibrate, startPulse, stopPulse };
}
