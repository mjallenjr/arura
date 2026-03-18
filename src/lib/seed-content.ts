import type { Signal } from "@/lib/feed-types";

export const SEED_USER_ID = "fade0001-0000-4000-a000-000000000001";
export const SEED_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours per ember

export interface SeedContent {
  id: string;
  image_url: string;
  display_name: string;
  stitch_word: string | null;
  category: string | null;
  heat_score: number;
}

export interface SeedExposure {
  seed_content_id: string;
  first_seen_at: string;
  felt: boolean;
  stitched: boolean;
}

/** Convert seed_content row into a virtual Signal for the feed */
export function seedToSignal(seed: SeedContent): Signal {
  const heatLevel = getHeatLevelFromScore(seed.heat_score);
  return {
    id: `seed-${seed.id}`,
    user_id: SEED_USER_ID,
    type: "photo",
    storage_path: null,
    song_clip_url: null,
    song_title: null,
    stitch_word: seed.stitch_word,
    created_at: new Date().toISOString(),
    display_name: seed.display_name,
    media_url: seed.image_url,
    heat_level: heatLevel,
    heat_score: seed.heat_score,
    isDiscovery: true,
    isSeed: true,
  };
}

function getHeatLevelFromScore(score: number): string {
  if (score >= 250) return "star";
  if (score >= 180) return "inferno";
  if (score >= 120) return "raging";
  if (score >= 80) return "burning";
  if (score >= 50) return "hot";
  if (score >= 30) return "flame";
  if (score >= 15) return "ignite";
  if (score >= 5) return "spark";
  return "match";
}

/** Check if a seed is still within a user's 2-hour window */
export function isSeedWindowOpen(firstSeenAt: string | null): boolean {
  if (!firstSeenAt) return true; // never seen = window open
  return Date.now() - new Date(firstSeenAt).getTime() < SEED_WINDOW_MS;
}

/** Extract the real seed_content ID from a virtual signal ID */
export function extractSeedId(signalId: string): string | null {
  if (!signalId.startsWith("seed-")) return null;
  return signalId.replace("seed-", "");
}
