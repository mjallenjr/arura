import { useState, useEffect, useCallback, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import FeltEffect from "@/components/FeltEffect";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import FeedPlayer from "@/components/feed/FeedPlayer";
import FeedEndScreen from "@/components/feed/FeedEndScreen";
import AdCard from "@/components/feed/AdCard";
import StitchOverlay from "@/components/feed/StitchOverlay";
import FeedControls from "@/components/feed/FeedControls";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAds, type Ad } from "@/hooks/useAds";
import { useBlocks } from "@/hooks/useBlocks";
import { useRateLimit } from "@/hooks/useRateLimit";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "sonner";

interface FeedViewProps {
  onEnd: () => void;
}

const SIGNAL_DURATION = 5000;
const AD_DURATION = 3700;
const FEED_CACHE_KEY = "arura_feed_cache";
const FEED_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface Signal {
  id: string;
  user_id: string;
  type: string;
  storage_path: string | null;
  song_clip_url: string | null;
  song_title: string | null;
  stitch_word: string | null;
  created_at: string;
  display_name: string;
  media_url: string | null;
  isDiscovery?: boolean;
  isSuggested?: boolean;
  isDiversity?: boolean;
  isAd?: boolean;
  ad?: Ad;
}

const FALLBACK_DISCOVERY: Signal[] = [
  { id: "d-1", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "autumn river", media_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-2", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "sunset pier", media_url: "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-3", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "hidden waterfall", media_url: "https://images.unsplash.com/photo-1432405972618-c6b0cfba8427?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-4", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "mountain lake", media_url: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=800&h=1200&fit=crop", isDiscovery: true },
  { id: "d-5", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: "northern lights", media_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=1200&fit=crop", isDiscovery: true },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getTouchDistance(t1: Touch, t2: Touch) {
  return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
}

function getTouchAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
}

// Offline cache helpers
function getCachedFeed(): Signal[] | null {
  try {
    const raw = localStorage.getItem(FEED_CACHE_KEY);
    if (!raw) return null;
    const { signals, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > FEED_CACHE_TTL) return null;
    return signals;
  } catch { return null; }
}

function cacheFeed(signals: Signal[]) {
  try {
    const cacheable = signals.filter(s => !s.isAd).slice(0, 20);
    localStorage.setItem(FEED_CACHE_KEY, JSON.stringify({ signals: cacheable, timestamp: Date.now() }));
  } catch { /* quota exceeded */ }
}

const FeedView = ({ onEnd }: FeedViewProps) => {
  const { user } = useAuth();
  const { fetchTargetedAd } = useAds();
  const { isBlocked, refreshBlocks } = useBlocks();
  const checkStitchLimit = useRateLimit(10, 60000);
  const isOnline = useOnlineStatus();
  const [showReportMenu, setShowReportMenu] = useState(false);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [feltEffects, setFeltEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [ended, setEnded] = useState(false);
  const [stitchInput, setStitchInput] = useState("");
  const [showStitchInput, setShowStitchInput] = useState(false);
  const [stitchCounts, setStitchCounts] = useState<Record<string, number>>({});
  const [hasStitched, setHasStitched] = useState<Record<string, boolean>>({});
  const [stitchSuggestions, setStitchSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const [showIgnitePrompt, setShowIgnitePrompt] = useState(false);
  const [ignitedInFeed, setIgnitedInFeed] = useState<Record<string, boolean>>({});
  const [stitchPos, setStitchPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [stitchScale, setStitchScale] = useState(1);
  const [stitchRotation, setStitchRotation] = useState(0);
  const [submittedStitch, setSubmittedStitch] = useState<{
    word: string; x: number; y: number; scale: number; rotation: number;
  } | null>(null);
  const [isFromCache, setIsFromCache] = useState(false);

  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<number>(0);
  const doubleTapPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const feedRef = useRef<HTMLDivElement>(null);
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartAngleRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const pinchStartRotRef = useRef(0);
  const pausedRef = useRef(false);
  const elapsedBeforePauseRef = useRef(0);
  const swipeStartXRef = useRef<number | null>(null);
  const swipeStartYRef = useRef<number | null>(null);
  const swipeDeltaRef = useRef(0);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const isSwiping = useRef(false);

  // ── Pinch-to-resize/rotate for stitch ──
  useEffect(() => {
    const el = feedRef.current;
    if (!el || !showStitchInput) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        pinchStartDistRef.current = getTouchDistance(e.touches[0], e.touches[1]);
        pinchStartAngleRef.current = getTouchAngle(e.touches[0], e.touches[1]);
        pinchStartScaleRef.current = stitchScale;
        pinchStartRotRef.current = stitchRotation;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null && pinchStartAngleRef.current !== null) {
        e.preventDefault();
        const dist = getTouchDistance(e.touches[0], e.touches[1]);
        const angle = getTouchAngle(e.touches[0], e.touches[1]);
        setStitchScale(Math.min(3, Math.max(0.4, pinchStartScaleRef.current * (dist / pinchStartDistRef.current))));
        setStitchRotation(pinchStartRotRef.current + (angle - pinchStartAngleRef.current));
      }
    };
    const onTouchEnd = () => { pinchStartDistRef.current = null; pinchStartAngleRef.current = null; };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => { el.removeEventListener("touchstart", onTouchStart); el.removeEventListener("touchmove", onTouchMove); el.removeEventListener("touchend", onTouchEnd); };
  }, [showStitchInput, stitchScale, stitchRotation]);

  // ── Data fetching ──
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
        return { ...s, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, isSuggested: true };
      }));
    } catch { return []; }
  }, [user]);

  // ── Diversity injection: fetch 1-2 signals from outside follow graph ──
  const fetchDiversitySignals = useCallback(async (followingIds: Set<string>): Promise<Signal[]> => {
    if (!user) return [];
    try {
      // Get engagement-ranked signals from outside follow graph
      const { data: ranked } = await supabase.rpc("get_engagement_ranked_signals", { p_user_id: user.id });
      if (!ranked || ranked.length === 0) return [];

      // Filter to only those NOT in follow graph
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
          display_name: nameMap.get(s.signal_user_id) ?? "unknown", media_url,
          isDiversity: true,
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

  // ── Fetch signals with offline-first + diversity ──
  useEffect(() => {
    if (!user) return;
    const fetchSignals = async () => {
      // Try cache first for instant load
      if (!isOnline) {
        const cached = getCachedFeed();
        if (cached && cached.length > 0) {
          setSignals(cached);
          setIsFromCache(true);
          setLoading(false);
          return;
        }
      }

      // Show cached data immediately, then refresh
      const cached = getCachedFeed();
      if (cached && cached.length > 0) {
        setSignals(cached);
        setIsFromCache(true);
        setLoading(false);
      }

      // 1. Get aura-ranked following
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
      
      // 2. Fetch signals + diversity in parallel
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
      
      // 3. Get engagement data
      const signalIds = rawSignals.map(s => s.id);
      const [feltData, stitchData, viewData] = await Promise.all([
        supabase.from("felts").select("signal_id").in("signal_id", signalIds),
        supabase.from("stitches").select("signal_id").in("signal_id", signalIds),
        supabase.from("signal_views").select("signal_id").in("signal_id", signalIds),
      ]);
      
      const feltCounts = new Map<string, number>();
      feltData.data?.forEach((f: any) => feltCounts.set(f.signal_id, (feltCounts.get(f.signal_id) ?? 0) + 1));
      const stitchCountsMap = new Map<string, number>();
      stitchData.data?.forEach((s: any) => stitchCountsMap.set(s.signal_id, (stitchCountsMap.get(s.signal_id) ?? 0) + 1));
      const viewCounts = new Map<string, number>();
      viewData.data?.forEach((v: any) => viewCounts.set(v.signal_id, (viewCounts.get(v.signal_id) ?? 0) + 1));
      
      // 4. Get profiles
      const allAuthorIds = [...new Set([...rawSignals.map((s) => s.user_id), ...diversitySignals.map(s => s.user_id)])];
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name").in("user_id", allAuthorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      
      // 5. Composite scoring
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
          
          return { ...s, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, _score: compositeScore };
        })
        .sort((a: any, b: any) => (b._score ?? 0) - (a._score ?? 0));
      
      // 6. Inject diversity signals at positions ~5 and ~10
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

  // ── Signal advancement ──
  const resetStitchState = useCallback(() => {
    setShowStitchInput(false);
    setShowIgnitePrompt(false);
    setStitchInput("");
    setSubmittedStitch(null);
    setStitchScale(1);
    setStitchRotation(0);
    elapsedBeforePauseRef.current = 0;
    startTimeRef.current = Date.now();
  }, []);

  const advanceSignal = useCallback(() => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      resetStitchState();
    } else {
      const now = Date.now();
      const remaining = signals.filter((s) => {
        if (s.isAd || s.isDiscovery) return false;
        if (hasStitched[s.id]) return false;
        const createdAt = new Date(s.created_at).getTime();
        if (createdAt > 0 && now - createdAt > 24 * 60 * 60 * 1000) return false;
        return true;
      });
      if (remaining.length > 0) {
        setSignals(shuffleArray(remaining));
        setCurrentIndex(0);
        setProgress(0);
        resetStitchState();
      } else if (!suggestedLoaded) {
        setSuggestedLoaded(true);
        fetchSuggestedSignals().then((suggested) => {
          if (suggested.length > 0) {
            setSignals(suggested);
            setCurrentIndex(0);
            setProgress(0);
            resetStitchState();
          } else { setEnded(true); }
        });
      } else { setEnded(true); }
    }
  }, [currentIndex, signals, hasStitched, suggestedLoaded, fetchSuggestedSignals, resetStitchState]);

  // ── Stitch counts ──
  useEffect(() => {
    if (!user || signals.length === 0) return;
    const mySignalIds = signals.filter((s) => s.user_id === user.id && !s.isDiscovery).map((s) => s.id);
    if (mySignalIds.length === 0) return;
    supabase.from("stitches").select("signal_id").in("signal_id", mySignalIds).then(({ data }) => {
      if (!data) return;
      const counts: Record<string, number> = {};
      data.forEach((d: any) => { counts[d.signal_id] = (counts[d.signal_id] || 0) + 1; });
      setStitchCounts(counts);
    });
  }, [user, signals]);

  // ── Stitch submit ──
  const handleStitchSubmit = useCallback(async () => {
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery || !stitchInput.trim()) return;
    if (!checkStitchLimit()) { toast.error("Slow down — too many stitches"); return; }
    const word = stitchInput.replace(/\s/g, "").slice(0, 12);
    if (!word) return;
    const { error } = await supabase.from("stitches").insert({ user_id: user.id, signal_id: signal.id, word });
    if (!error) {
      setHasStitched((prev) => ({ ...prev, [signal.id]: true }));
      setSubmittedStitch({ word, x: stitchPos.x, y: stitchPos.y, scale: stitchScale, rotation: stitchRotation });
      await supabase.from("notifications").insert({ user_id: signal.user_id, from_user_id: user.id, signal_id: signal.id, type: "stitch", word });
      toast.success("Stitched ✦");
    }
    setShowStitchInput(false);
    setStitchInput("");
  }, [user, signals, currentIndex, stitchInput, stitchPos, stitchScale, stitchRotation]);

  // ── Record view ──
  useEffect(() => {
    if (loading || ended || signals.length === 0) return;
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery) return;
    supabase.from("signal_views").upsert({ user_id: user.id, signal_id: signal.id }, { onConflict: "user_id,signal_id" }).then(() => {});
  }, [currentIndex, loading, ended, signals, user]);

  // ── AI stitch suggestions + pause/resume timer ──
  useEffect(() => {
    if (showStitchInput) {
      pausedRef.current = true;
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      cancelAnimationFrame(animRef.current);
      const signal = signals[currentIndex];
      if (signal && !signal.isDiscovery && !signal.isAd) {
        setLoadingSuggestions(true);
        setStitchSuggestions([]);
        supabase.functions.invoke("stitch-suggest", {
          body: { creator_name: signal.display_name, stitch_word: signal.stitch_word, media_type: signal.type, display_name: signal.display_name },
        }).then(({ data, error }) => {
          if (!error && data?.words) setStitchSuggestions(data.words);
          setLoadingSuggestions(false);
        }).catch(() => setLoadingSuggestions(false));
      }
      return;
    }
    pausedRef.current = false;
    startTimeRef.current = Date.now();
  }, [showStitchInput]);

  // ── Timer ──
  useEffect(() => {
    if (ended || loading || signals.length === 0 || showStitchInput) return;
    startTimeRef.current = Date.now();
    if (!showStitchInput) elapsedBeforePauseRef.current = 0;
    const tick = () => {
      const elapsed = elapsedBeforePauseRef.current + (Date.now() - startTimeRef.current);
      const isAd = signals[currentIndex]?.isAd;
      const p = Math.min(1, elapsed / (isAd ? AD_DURATION : SIGNAL_DURATION));
      setProgress(p);
      if (p >= 1) advanceSignal();
      else animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentIndex, ended, loading, signals.length, advanceSignal, showStitchInput]);

  // ── Tap handler ──
  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (showStitchInput) return;
      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let x: number, y: number;
      if ("touches" in e) { x = e.touches[0].clientX - rect.left; y = e.touches[0].clientY - rect.top; }
      else { x = e.clientX - rect.left; y = e.clientY - rect.top; }
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;
      const current = signals[currentIndex];
      if (current?.isAd) return;

      if (timeSinceLastTap < 300) {
        clearTimeout(tapTimeoutRef.current);
        lastTapRef.current = 0;
        if (user && current && !current.isDiscovery && current.user_id !== user.id && !hasStitched[current.id]) {
          doubleTapPosRef.current = { x: xPct, y: yPct };
          setStitchPos({ x: xPct, y: yPct });
          setStitchScale(1);
          setStitchRotation(0);
          setShowStitchInput(true);
          if (current.isSuggested || current.isDiversity) setShowIgnitePrompt(true);
        }
        return;
      }
      lastTapRef.current = now;
      tapTimeoutRef.current = window.setTimeout(() => {
        if (user && current && !current.isDiscovery) {
          supabase.from("felts").insert({ user_id: user.id, signal_id: current.id }).then(() => {});
        }
        const id = `${Date.now()}-${Math.random()}`;
        setFeltEffects((prev) => [...prev, { id, x, y }]);
        setTimeout(() => { setFeltEffects((prev) => prev.filter((f) => f.id !== id)); }, 700);
      }, 300);
    },
    [user, signals, currentIndex, hasStitched, showStitchInput]
  );

  // ── Render ──
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="label-signal animate-pulse">loading...</p>
      </div>
    );
  }

  if (ended) return <FeedEndScreen onEnd={onEnd} />;

  const signal = signals[currentIndex];
  const isDiscoveryFeed = signals.length > 0 && signals[0].isDiscovery;
  const isSuggestedFeed = signals.length > 0 && signals[0].isSuggested;

  return (
    <div ref={feedRef} className="relative h-full w-full bg-background touch-none" onClick={handleTap}>
      {/* Offline/cached indicator */}
      {isFromCache && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 rounded-full bg-muted/80 backdrop-blur-sm px-3 py-1">
          <p className="text-[10px] text-muted-foreground">
            {isOnline ? "refreshing..." : "offline — showing cached"}
          </p>
        </div>
      )}

      <FeedControls
        signals={signals}
        currentIndex={currentIndex}
        progress={progress}
        isDiscoveryFeed={isDiscoveryFeed}
        isSuggestedFeed={isSuggestedFeed}
        currentSignal={signal}
        userId={user?.id}
        stitchCount={stitchCounts[signal.id] || 0}
        hasStitched={!!hasStitched[signal.id]}
        showStitchInput={showStitchInput}
        showReportMenu={showReportMenu}
        onReportClick={() => setShowReportMenu(true)}
      />

      <FeedPlayer signalId={signal.id} mediaUrl={signal.media_url} type={signal.type} />

      <StitchOverlay
        stitchWord={signal.stitch_word}
        submittedStitch={submittedStitch}
        showStitchInput={showStitchInput}
        stitchInput={stitchInput}
        stitchPos={stitchPos}
        stitchScale={stitchScale}
        stitchRotation={stitchRotation}
        stitchSuggestions={stitchSuggestions}
        loadingSuggestions={loadingSuggestions}
        hasStitched={!!hasStitched[signal.id]}
        isOwnSignal={signal.user_id === user?.id}
        isDiscovery={!!signal.isDiscovery}
        isSuggested={!!signal.isSuggested}
        stitchCount={stitchCounts[signal.id] || 0}
        showIgnitePrompt={showIgnitePrompt}
        isIgnitedInFeed={!!ignitedInFeed[signal.user_id]}
        displayName={signal.display_name}
        onStitchInputChange={setStitchInput}
        onStitchSubmit={handleStitchSubmit}
        onStitchClose={() => { setShowStitchInput(false); setShowIgnitePrompt(false); setStitchInput(""); setStitchSuggestions([]); }}
        onIgnite={async () => {
          if (!user) return;
          const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: signal.user_id });
          if (!error) { setIgnitedInFeed((prev) => ({ ...prev, [signal.user_id]: true })); toast.success(`Ignited ${signal.display_name} 🔥`); }
        }}
      />

      {/* Ad overlay */}
      {signal.isAd && signal.ad && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
          <AdCard ad={signal.ad} signalId={signal.id} />
        </div>
      )}

      {/* Report/Block menu */}
      <AnimatePresence>
        {showReportMenu && signal && !signal.isAd && !signal.isDiscovery && (
          <ReportBlockMenu
            targetUserId={signal.user_id}
            targetUserName={signal.display_name}
            signalId={signal.id}
            onClose={() => setShowReportMenu(false)}
            onBlocked={() => { refreshBlocks(); advanceSignal(); }}
          />
        )}
      </AnimatePresence>

      {/* Felt effects */}
      {feltEffects.map((felt) => (
        <FeltEffect key={felt.id} x={felt.x} y={felt.y} />
      ))}
    </div>
  );
};

export default FeedView;
