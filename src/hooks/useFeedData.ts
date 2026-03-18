import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAds } from "@/hooks/useAds";
import { useBlocks } from "@/hooks/useBlocks";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { useSeedContent } from "@/hooks/useSeedContent";
import { Signal, FALLBACK_DISCOVERY, shuffleArray, getCachedFeed, cacheFeed, resolveMediaUrl } from "@/lib/feed-types";

export function useFeedData() {
  const { user } = useAuth();
  const { fetchTargetedAd } = useAds();
  const { isBlocked, refreshBlocks } = useBlocks();
  const isOnline = useOnlineStatus();
  const { fetchSeedSignals, feltSeed, stitchSeed } = useSeedContent();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [firstTouchSignals, setFirstTouchSignals] = useState<Record<string, boolean>>({});
  const [levelUpCreditSignals, setLevelUpCreditSignals] = useState<Record<string, boolean>>({});

  const fetchDiscovery = useCallback(async (): Promise<Signal[]> => {
    if (!user) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
    try {
      // Use seed content with per-user 2h windows instead of edge function
      const seedSignals = await fetchSeedSignals(user.id, 15);
      if (seedSignals.length > 0) return seedSignals;
      return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
    } catch { return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5); }
  }, [user, fetchSeedSignals]);

  const fetchSuggestedSignals = useCallback(async (): Promise<Signal[]> => {
    if (!user) return [];
    try {
      const { data: myFollows } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followingIds = new Set(myFollows?.map((f) => f.following_id) ?? []);
      if (followingIds.size === 0) return [];
      const { data: fof } = await supabase.from("follows").select("following_id").in("follower_id", [...followingIds]).limit(100);
      if (!fof) return [];
      const candidateIds = [...new Set(fof.map((f) => f.following_id))].filter((id) => id !== user.id && !followingIds.has(id));
      if (candidateIds.length === 0) return [];
      const shuffledCandidates = shuffleArray(candidateIds).slice(0, 10);
      const { data: rawSignals } = await supabase.from("signals").select("*").in("user_id", shuffledCandidates).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(15);
      if (!rawSignals || rawSignals.length === 0) return [];
      const authorIds = [...new Set(rawSignals.map((s) => s.user_id))];
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", authorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      return shuffleArray(rawSignals.map((s) => {
        let media_url: string | null = null;
        if (s.storage_path) { media_url = resolveMediaUrl(s.storage_path); }
        return { ...s, stitch_word_pos: s.stitch_word_pos as any, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, isSuggested: true };
      }));
    } catch { return []; }
  }, [user]);

  const fetchDiversitySignals = useCallback(async (followingIds: Set<string>): Promise<Signal[]> => {
    if (!user) return [];
    try {
      const { data: ranked } = await supabase.rpc("get_engagement_ranked_signals", { p_user_id: user.id });
      if (!ranked || ranked.length === 0) return [];
      const outsideGraph = (ranked as any[]).filter((s: any) => !followingIds.has(s.signal_user_id));
      const picked = shuffleArray(outsideGraph).slice(0, 2);
      if (picked.length === 0) return [];
      const authorIds = [...new Set(picked.map((s: any) => s.signal_user_id))];
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", authorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      return picked.map((s: any) => {
        let media_url: string | null = null;
        if (s.storage_path) { media_url = resolveMediaUrl(s.storage_path); }
        return {
          id: s.signal_id, user_id: s.signal_user_id, type: s.signal_type,
          storage_path: s.storage_path, song_clip_url: s.song_clip_url, song_title: s.song_title,
          stitch_word: s.stitch_word, created_at: s.created_at,
          display_name: nameMap.get(s.signal_user_id) ?? "unknown", media_url, isDiversity: true,
        };
      });
    } catch { return []; }
  }, [user]);

  const interleaveAds = useCallback(async (items: Signal[], userId: string): Promise<Signal[]> => {
    if (items.length < 3) return items;
    const result: Signal[] = [];
    let contentCount = 0;
    for (const item of items) {
      contentCount++;
      result.push(item);
      if (contentCount % 3 === 0) {
        const ad = await fetchTargetedAd(userId, "feed");
        if (ad) {
          result.push({
            id: `ad-${ad.id}-${contentCount}`, user_id: "", type: ad.media_type === "video" ? "video" : "photo",
            storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "",
            display_name: ad.company_name, media_url: ad.media_url, isAd: true, ad,
          });
        }
      }
    }
    return result;
  }, [fetchTargetedAd]);

  // Main fetch
  useEffect(() => {
    if (!user) return;
    const fetchSignals = async () => {
      if (!isOnline) {
        const cached = getCachedFeed();
        if (cached && cached.length > 0) {
          setSignals(cached);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      const cached = getCachedFeed();
      if (cached && cached.length > 0) {
        setSignals(cached);
        setIsFromCache(true);
        setLoading(false);
      }

      const { data: auraData } = await supabase.rpc("get_aura_ranked_following", { p_user_id: user.id });
      const rankedIds = auraData?.map((a: any) => a.following_id) ?? [];

      if (rankedIds.length === 0) {
        // Cold-start: fetch seed content AND top engagement signals in parallel
        const [discovery, engagementRes] = await Promise.all([
          fetchDiscovery(),
          supabase.rpc("get_engagement_ranked_signals", { p_user_id: user.id }),
        ]);
        
        let forYouSignals: Signal[] = [];
        if (engagementRes.data && (engagementRes.data as any[]).length > 0) {
          const topSignals = shuffleArray(engagementRes.data as any[]).slice(0, 8);
          const authorIds = [...new Set(topSignals.map((s: any) => s.signal_user_id))];
          const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", authorIds);
          const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
          forYouSignals = topSignals.map((s: any) => ({
            id: s.signal_id, user_id: s.signal_user_id, type: s.signal_type,
            storage_path: s.storage_path, song_clip_url: s.song_clip_url, song_title: s.song_title,
            stitch_word: s.stitch_word, created_at: s.created_at,
            display_name: nameMap.get(s.signal_user_id) ?? "unknown",
            media_url: s.storage_path ? resolveMediaUrl(s.storage_path) : null,
            isForYou: true,
          }));
        }

        const combined = shuffleArray([...forYouSignals, ...discovery]);
        const final = await interleaveAds(combined, user.id);
        setSignals(final);
        cacheFeed(final);
        setIsFromCache(false);
        setLoading(false);
        return;
      }

      const auraRank = new Map(rankedIds.map((id: string, i: number) => [id, i]));
      const followingIdSet = new Set(rankedIds as string[]);

      const [rawSignalsRes, diversitySignals, fannedSignalIds] = await Promise.all([
        supabase.from("signals").select("*").in("user_id", rankedIds).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(30),
        fetchDiversitySignals(followingIdSet),
        // Fetch flares fanned to this user
        supabase.from("fans").select("signal_id, sender_id").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);

      const fannedIds = new Set(fannedSignalIds.data?.map((f: any) => f.signal_id) ?? []);
      const fannedSenderMap = new Map(fannedSignalIds.data?.map((f: any) => [f.signal_id, f.sender_id]) ?? []);

      const rawSignals = rawSignalsRes.data;

      if (!rawSignals || rawSignals.length === 0) {
        // Still fetch fanned flares even with no followed content
        let fannedSignals: Signal[] = [];
        if (fannedIds.size > 0) {
          const { data: fSignals } = await supabase.from("signals").select("*").in("id", [...fannedIds]).gt("expires_at", new Date().toISOString());
          if (fSignals) {
            const fAuthorIds = [...new Set(fSignals.map(s => s.user_id))];
            const { data: fProfiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", fAuthorIds);
            const fNameMap = new Map(fProfiles?.map((p) => [p.user_id, p.display_name]) ?? []);
            const senderIds = [...new Set([...fannedSenderMap.values()])];
            const { data: sProfiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", senderIds);
            const sNameMap = new Map(sProfiles?.map((p) => [p.user_id, p.display_name]) ?? []);
            fannedSignals = fSignals.map(s => {
              let media_url: string | null = null;
              if (s.storage_path) { media_url = resolveMediaUrl(s.storage_path); }
              return { ...s, stitch_word_pos: s.stitch_word_pos as any, display_name: fNameMap.get(s.user_id) ?? "unknown", media_url, isFanned: true, fannedBy: sNameMap.get(fannedSenderMap.get(s.id) ?? "") ?? "someone" };
            });
          }
        }
        const discovery = await fetchDiscovery();
        const final = await interleaveAds([...fannedSignals, ...discovery, ...diversitySignals], user.id);
        setSignals(final);
        cacheFeed(final);
        setIsFromCache(false);
        setLoading(false);
        return;
      }

      const signalIds = rawSignals.map(s => s.id);
      const [feltData, stitchData, viewData, firstFeltData, firstStitchData] = await Promise.all([
        supabase.from("felts").select("signal_id").in("signal_id", signalIds),
        supabase.from("stitches").select("signal_id").in("signal_id", signalIds),
        supabase.from("signal_views").select("signal_id").in("signal_id", signalIds),
        supabase.from("felts").select("signal_id, created_at").in("signal_id", signalIds).eq("user_id", user.id).order("created_at", { ascending: true }).limit(signalIds.length),
        supabase.from("stitches").select("signal_id, created_at").in("signal_id", signalIds).eq("user_id", user.id).order("created_at", { ascending: true }).limit(signalIds.length),
      ]);

      const feltCounts = new Map<string, number>();
      feltData.data?.forEach((f: any) => feltCounts.set(f.signal_id, (feltCounts.get(f.signal_id) ?? 0) + 1));
      const stitchCountsMap = new Map<string, number>();
      stitchData.data?.forEach((s: any) => stitchCountsMap.set(s.signal_id, (stitchCountsMap.get(s.signal_id) ?? 0) + 1));
      const viewCounts = new Map<string, number>();
      viewData.data?.forEach((v: any) => viewCounts.set(v.signal_id, (viewCounts.get(v.signal_id) ?? 0) + 1));

      const firstTouchMap: Record<string, boolean> = {};
      const userFeltSignals = new Set(firstFeltData.data?.map((f: any) => f.signal_id) ?? []);
      const userStitchedSignals = new Set(firstStitchData.data?.map((s: any) => s.signal_id) ?? []);
      signalIds.forEach(id => {
        const totalFelts = feltCounts.get(id) ?? 0;
        const totalStitches = stitchCountsMap.get(id) ?? 0;
        if ((totalFelts === 1 && userFeltSignals.has(id)) || (totalStitches === 1 && userStitchedSignals.has(id))) {
          firstTouchMap[id] = true;
        }
      });
      setFirstTouchSignals(firstTouchMap);

      const levelUpMap: Record<string, boolean> = {};
      signalIds.forEach(id => {
        if ((userFeltSignals.has(id) || userStitchedSignals.has(id)) && !firstTouchMap[id]) {
          levelUpMap[id] = true;
        }
      });
      setLevelUpCreditSignals(levelUpMap);

      const allAuthorIds = [...new Set([...rawSignals.map((s) => s.user_id), ...diversitySignals.map(s => s.user_id)])];
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", allAuthorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      const now = Date.now();
      const enriched: Signal[] = rawSignals
        .filter((s) => !isBlocked(s.user_id))
        .map((s) => {
          let media_url: string | null = null;
          if (s.storage_path) { media_url = resolveMediaUrl(s.storage_path); }
          const auraPos = auraRank.get(s.user_id) ?? rankedIds.length;
          const auraScore = Math.max(0, 100 - (auraPos / Math.max(rankedIds.length, 1)) * 100);
          const felts = feltCounts.get(s.id) ?? 0;
          const stitches = stitchCountsMap.get(s.id) ?? 0;
          const views = viewCounts.get(s.id) ?? 0;
          const engagementScore = Math.min(100, felts * 15 + stitches * 25 + views * 2);
          const ageMs = now - new Date(s.created_at).getTime();
          const recencyScore = Math.max(0, 100 - (ageMs / (2 * 60 * 60 * 1000)) * 100);
          const compositeScore = auraScore * 0.35 + engagementScore * 0.4 + recencyScore * 0.25;
          const heatScore = felts * 3 + stitches * 8 + views;
          const isFanned = fannedIds.has(s.id);
          const fannedBy = isFanned ? undefined : undefined; // will resolve below
          return { ...s, stitch_word_pos: s.stitch_word_pos as any, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, heat_score: heatScore, _score: isFanned ? compositeScore + 50 : compositeScore, isFanned };
        })
        .sort((a, b) => (b._score ?? 0) - (a._score ?? 0));

      const withDiversity = [...enriched];
      diversitySignals.forEach((ds, i) => {
        const insertPos = Math.min(withDiversity.length, 4 + i * 5);
        withDiversity.splice(insertPos, 0, ds);
      });

      const final = await interleaveAds(withDiversity, user.id);
      setSignals(final);
      cacheFeed(final);
      setIsFromCache(false);
      setLoading(false);
    };
    fetchSignals();
  }, [user, fetchDiscovery, fetchTargetedAd, isOnline]);

  return {
    signals, setSignals, loading, isFromCache, isOnline,
    firstTouchSignals, levelUpCreditSignals,
    fetchSuggestedSignals, refreshBlocks,
    feltSeed, stitchSeed,
  };
}
