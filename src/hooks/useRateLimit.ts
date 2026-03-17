import { useRef, useCallback } from "react";

/**
 * Client-side rate limiter. Returns true if action is allowed, false if rate-limited.
 * @param maxActions - max actions in the time window
 * @param windowMs - time window in milliseconds
 */
export function useRateLimit(maxActions: number, windowMs: number) {
  const timestamps = useRef<number[]>([]);

  const checkLimit = useCallback(() => {
    const now = Date.now();
    // Remove expired timestamps
    timestamps.current = timestamps.current.filter(t => now - t < windowMs);
    if (timestamps.current.length >= maxActions) {
      return false; // rate limited
    }
    timestamps.current.push(now);
    return true; // allowed
  }, [maxActions, windowMs]);

  return checkLimit;
}
