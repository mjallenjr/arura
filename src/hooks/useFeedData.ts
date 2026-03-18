import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAds } from "@/hooks/useAds";
import { useBlocks } from "@/hooks/useBlocks";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Signal, FALLBACK_DISCOVERY, shuffleArray, getCachedFeed, cacheFeed } from "@/lib/feed-types";

export function useFeedData() {
  const { user } = useAuth();
  const { fetchTargetedAd } = useAds();
  const { isBlocked, refreshBlocks } = useBlocks();
  const isOnline = useOnlineStatus();

  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFromCache, setIsFromCache] = useState(false);
  const [firstTouchSignals, setFirstTouchSignals] = useState<Record<string, boolean>>({});
  const [levelUpCreditSignals, setLevelUpCreditSignals] = useState<Record<string, boolean>>({});

  const fetchDiscovery = useCallback(async (): Promise<Signal[]> => {
    if (!user) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
    try {
      const [ownWords, stitchWords] = await Promise.all([
        supabase.from("signals").select("stitch_word").eq("user_id", user.id).not("stitch_word", "is", null).order("created_at", { ascending: false }).limit(10),
        supabase.from("stitches").select("word").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      const themes = [...(ownWords.data?.map((s) => s.stitch_word).filter(Boolean) ?? []), ...(stitchWords.data?.map((s) => s.word) ?? [])];
      if (themes.length === 0) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
      const { data, error } = await supabase.functions.invoke("discover-content", { body: { themes } });
      if (error || !data?.items?.length) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
      return data.items.map((item: any) => ({
        id: item.id, user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: item.display_name || item.query, media_url: item.image_url, isDiscovery: true,
      }));
    } catch { return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5); }
  }, [user]);

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
        if (s.storage_path) { const { data: d } = supabase.storage.from("signals").getPublicUrl(s.storage_path); media_url = d.publicUrl; }
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
        if (s.storage_path) { const { data: d } = supabase.storage.from("signals").getPublicUrl(s.storage_path); media_url = d.publicUrl; }
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
        const discovery = await fetchDiscovery();
        const final = await interleaveAds(discovery, user.id);
        setSignals(final);
        cacheFeed(final);
        setIsFromCache(false);
        setLoading(false);
        return;
      }

      const auraRank = new Map(rankedIds.map((id: string, i: number) => [id, i]));
      const followingIdSet = new Set(rankedIds as string[]);

      const [rawSignalsRes, diversitySignals] = await Promise.all([
        supabase.from("signals").select("*").in("user_id", rankedIds).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(30),
        fetchDiversitySignals(followingIdSet),
      ]);

      const rawSignals = rawSignalsRes.data;

      if (!rawSignals || rawSignals.length === 0) {
        const discovery = await fetchDiscovery();
        const final = await interleaveAds([...discovery, ...diversitySignals], user.id);
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
          if (s.storage_path) { const { data } = supabase.storage.from("signals").getPublicUrl(s.storage_path); media_url = data.publicUrl; }
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
          return { ...s, stitch_word_pos: s.stitch_word_pos as any, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, heat_score: heatScore, _score: compositeScore };
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
  };
}
