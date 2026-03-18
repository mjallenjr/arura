import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shuffleArray } from "@/lib/feed-types";
import type { Signal } from "@/lib/feed-types";
import {
  type SeedContent,
  type SeedExposure,
  seedToSignal,
  isSeedWindowOpen,
  SEED_WINDOW_MS,
} from "@/lib/seed-content";

/**
 * Manages seed content with per-user 2-hour viewing windows.
 * Each ember gets their own timer per seed image — the fire burns
 * for 2 hours from the moment they first see it.
 */
export function useSeedContent() {
  const [exposureMap, setExposureMap] = useState<Map<string, SeedExposure>>(new Map());

  const fetchSeedSignals = useCallback(
    async (userId: string, limit = 20): Promise<Signal[]> => {
      try {
        // Fetch all seed content and user's exposures in parallel
        const [contentRes, exposuresRes] = await Promise.all([
          supabase.from("seed_content").select("*"),
          supabase
            .from("seed_content_views")
            .select("seed_content_id, first_seen_at, felt, stitched")
            .eq("user_id", userId),
        ]);

        if (!contentRes.data) return [];

        const allContent = contentRes.data as SeedContent[];
        const exposures = exposuresRes.data ?? [];

        // Build exposure map
        const expMap = new Map<string, SeedExposure>();
        exposures.forEach((e) => expMap.set(e.seed_content_id, e as SeedExposure));
        setExposureMap(expMap);

        // Filter to seeds within the user's 2h window (or never seen)
        const available = allContent.filter((seed) => {
          const exposure = expMap.get(seed.id);
          if (!exposure) return true; // never seen
          return isSeedWindowOpen(exposure.first_seen_at);
        });

        // Shuffle and limit
        const selected = shuffleArray(available).slice(0, limit);

        // Record new exposures for seeds the user hasn't seen yet
        const newExposures = selected
          .filter((seed) => !expMap.has(seed.id))
          .map((seed) => ({
            user_id: userId,
            seed_content_id: seed.id,
          }));

        if (newExposures.length > 0) {
          await supabase
            .from("seed_content_views")
            .upsert(newExposures, { onConflict: "user_id,seed_content_id" });
        }

        return selected.map(seedToSignal);
      } catch (e) {
        console.error("seed content error:", e);
        return [];
      }
    },
    []
  );

  /** Record a felt on seed content */
  const feltSeed = useCallback(
    async (seedContentId: string, userId: string) => {
      try {
        // Update the user's view record
        await supabase
          .from("seed_content_views")
          .upsert(
            { user_id: userId, seed_content_id: seedContentId, felt: true },
            { onConflict: "user_id,seed_content_id" }
          );

        // Increment heat score on seed content (via RPC or direct update)
        // Since we can't UPDATE seed_content from client (no policy), we use an RPC
        // For now, the heat_score is read-only from client; a background job can update it
      } catch (e) {
        console.error("felt seed error:", e);
      }
    },
    []
  );

  /** Record a stitch on seed content */
  const stitchSeed = useCallback(
    async (seedContentId: string, userId: string, word: string) => {
      try {
        await supabase
          .from("seed_content_views")
          .upsert(
            {
              user_id: userId,
              seed_content_id: seedContentId,
              stitched: true,
              stitch_word: word,
            },
            { onConflict: "user_id,seed_content_id" }
          );
      } catch (e) {
        console.error("stitch seed error:", e);
      }
    },
    []
  );

  return { fetchSeedSignals, feltSeed, stitchSeed, exposureMap };
}
