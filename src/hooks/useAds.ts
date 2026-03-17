import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  company_name: string;
  headline: string;
  description: string | null;
  media_url: string;
  media_type: string;
  cta_text: string | null;
  cta_url: string | null;
  target_interests: string[];
  cost_per_impression: number;
}

/**
 * Fetches a targeted ad based on the user's interests and their network's interests.
 * Logs an impression for revenue tracking.
 */
export function useAds() {
  const fetchTargetedAd = useCallback(async (
    userId: string,
    placement: "feed" | "embers"
  ): Promise<Ad | null> => {
    try {
      // Gather user interests
      const { data: profile } = await supabase
        .from("profiles")
        .select("interests")
        .eq("user_id", userId)
        .single();

      const userInterests: string[] = (profile as any)?.interests ?? [];

      // Gather network interests (people I follow + who follow me)
      const [followingRes, followersRes] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", userId).limit(20),
        supabase.from("follows").select("follower_id").eq("following_id", userId).limit(20),
      ]);

      const networkIds = [
        ...(followingRes.data?.map(f => f.following_id) ?? []),
        ...(followersRes.data?.map(f => f.follower_id) ?? []),
      ].filter((id, i, arr) => arr.indexOf(id) === i && id !== userId);

      let networkInterests: string[] = [];
      if (networkIds.length > 0) {
        const { data: networkProfiles } = await supabase
          .from("profiles")
          .select("interests")
          .in("user_id", networkIds.slice(0, 15));

        networkInterests = (networkProfiles ?? [])
          .flatMap((p: any) => p.interests ?? []);
      }

      // Combine and rank interests
      const interestCounts = new Map<string, number>();
      userInterests.forEach(i => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 3)); // user's own = 3x weight
      networkInterests.forEach(i => interestCounts.set(i, (interestCounts.get(i) ?? 0) + 1));

      const allInterests = [...interestCounts.keys()];

      if (allInterests.length === 0) {
        // No targeting data — serve random ad
        const { data: ads } = await supabase
          .from("advertisements")
          .select("*")
          .eq("active", true)
          .limit(5);

        if (!ads || ads.length === 0) return null;
        const ad = ads[Math.floor(Math.random() * ads.length)] as Ad;
        await logImpression(ad, userId, placement);
        return ad;
      }

      // Fetch all active ads and score them
      const { data: ads } = await supabase
        .from("advertisements")
        .select("*")
        .eq("active", true);

      if (!ads || ads.length === 0) return null;

      const scored = ads.map((ad: any) => {
        const adInterests: string[] = ad.target_interests ?? [];
        let score = 0;
        adInterests.forEach(ai => {
          if (interestCounts.has(ai)) {
            score += interestCounts.get(ai)!;
          }
        });
        return { ad: ad as Ad, score };
      });

      // Filter to ads with any relevance, or fallback to all
      const relevant = scored.filter(s => s.score > 0);
      const pool = relevant.length > 0 ? relevant : scored;

      // Weighted random selection
      const totalScore = pool.reduce((sum, s) => sum + Math.max(s.score, 1), 0);
      let rand = Math.random() * totalScore;
      let selected = pool[0].ad;
      for (const item of pool) {
        rand -= Math.max(item.score, 1);
        if (rand <= 0) {
          selected = item.ad;
          break;
        }
      }

      await logImpression(selected, userId, placement);
      return selected;
    } catch {
      return null;
    }
  }, []);

  return { fetchTargetedAd };
}

async function logImpression(ad: Ad, userId: string, placement: string) {
  await supabase.from("ad_impressions").insert({
    ad_id: ad.id,
    user_id: userId,
    placement,
    revenue: ad.cost_per_impression,
  });
}
