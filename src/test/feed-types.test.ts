import { describe, it, expect } from "vitest";
import { shuffleArray, getCachedFeed, cacheFeed, FEED_CACHE_KEY, Signal, FALLBACK_DISCOVERY } from "@/lib/feed-types";

describe("Feed Types", () => {
  it("shuffleArray returns same length with all elements", () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffleArray(arr);
    expect(shuffled).toHaveLength(arr.length);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it("shuffleArray does not mutate original", () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });

  it("FALLBACK_DISCOVERY has at least 3 signals", () => {
    expect(FALLBACK_DISCOVERY.length).toBeGreaterThanOrEqual(3);
    FALLBACK_DISCOVERY.forEach((s) => {
      expect(s.isDiscovery).toBe(true);
      expect(s.media_url).toBeTruthy();
    });
  });

  it("cacheFeed and getCachedFeed round-trip", () => {
    localStorage.removeItem(FEED_CACHE_KEY);
    expect(getCachedFeed()).toBeNull();

    const signals: Signal[] = [
      { id: "s1", user_id: "u1", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "test", media_url: "http://example.com/img.jpg" },
    ];
    cacheFeed(signals);
    const cached = getCachedFeed();
    expect(cached).not.toBeNull();
    expect(cached![0].id).toBe("s1");
  });

  it("cacheFeed excludes ad signals", () => {
    localStorage.removeItem(FEED_CACHE_KEY);
    const signals: Signal[] = [
      { id: "s1", user_id: "u1", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "test", media_url: "http://example.com/1.jpg" },
      { id: "ad1", user_id: "u1", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "ad", media_url: "http://example.com/ad.jpg", isAd: true },
    ];
    cacheFeed(signals);
    const cached = getCachedFeed();
    expect(cached).not.toBeNull();
    expect(cached!.every((s) => !s.isAd)).toBe(true);
  });
});
