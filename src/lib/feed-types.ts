import type { Ad } from "@/hooks/useAds";

export const SIGNAL_DURATION = 5000;
export const AD_DURATION = 3700;
export const FEED_CACHE_KEY = "arura_feed_cache";
export const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface Signal {
  id: string;
  user_id: string;
  type: string;
  storage_path: string | null;
  song_clip_url: string | null;
  song_title: string | null;
  stitch_word: string | null;
  stitch_word_pos?: { x: number; y: number; scale: number; rotation: number } | null;
  created_at: string;
  display_name: string;
  media_url: string | null;
  heat_level?: string;
  heat_score?: number;
  isDiscovery?: boolean;
  isSuggested?: boolean;
  isDiversity?: boolean;
  isAd?: boolean;
  isSeed?: boolean;
  isFanned?: boolean;
  fannedBy?: string;
  ad?: Ad;
  _score?: number;
}

export const FALLBACK_DISCOVERY: Signal[] = [
  { id: "d-1", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "autumn river", media_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-2", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "sunset pier", media_url: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-3", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "hidden waterfall", media_url: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8427?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-4", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "mountain lake", media_url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-5", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "northern lights", media_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1200&fit=crop", isDiscovery: true },
];

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getTouchDistance(t1: Touch, t2: Touch) {
  return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
}

export function getTouchAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
}

export function getCachedFeed(): Signal[] | null {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const { signals, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > FEED_CACHE_TTL) return null;
    return signals;
  } catch { return null; }
}

export function cacheFeed(signals: Signal[]) {
  try {
    const cacheable = signals.filter(s => !s.isAd).slice(0, 20);
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ signals: cacheable, timestamp: Date.now() }));
  } catch { /* quota exceeded */ }
}
