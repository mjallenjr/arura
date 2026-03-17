import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeltEffect from "@/components/FeltEffect";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAds, type Ad } from "@/hooks/useAds";
import { useBlocks } from "@/hooks/useBlocks";
import { useRateLimit } from "@/hooks/useRateLimit";
import { toast } from "sonner";

interface FeedViewProps {
  onEnd: () => void;
}

const SIGNAL_DURATION = 5000;
const AD_DURATION = 3700;

interface Signal {
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

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

// Helper: get distance between two touches
function getTouchDistance(t1: Touch, t2: Touch) {
  return Math.sqrt((t1.clientX - t2.clientX) ** 2 + (t1.clientY - t2.clientY) ** 2);
}

// Helper: get angle between two touches
function getTouchAngle(t1: Touch, t2: Touch) {
  return Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX) * (180 / Math.PI);
}

const FeedView = ({ onEnd }: FeedViewProps) => {
  const { user } = useAuth();
  const { fetchTargetedAd } = useAds();
  const { isBlocked, refreshBlocks } = useBlocks();
  const checkStitchLimit = useRateLimit(10, 60000); // 10 stitches per minute
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

  // Stitch position, scale, and rotation
  const [stitchPos, setStitchPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [stitchScale, setStitchScale] = useState(1);
  const [stitchRotation, setStitchRotation] = useState(0);

  // Submitted stitch state for display
  const [submittedStitch, setSubmittedStitch] = useState<{
    word: string;
    x: number;
    y: number;
    scale: number;
    rotation: number;
  } | null>(null);

  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<number>(0);
  const doubleTapPosRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const feedRef = useRef<HTMLDivElement>(null);

  // Pinch gesture refs
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartAngleRef = useRef<number | null>(null);
  const pinchStartScaleRef = useRef(1);
  const pinchStartRotRef = useRef(0);

  // Pinch-to-resize/rotate for stitch
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

        const scaleFactor = dist / pinchStartDistRef.current;
        const newScale = Math.min(3, Math.max(0.4, pinchStartScaleRef.current * scaleFactor));
        setStitchScale(newScale);

        const angleDiff = angle - pinchStartAngleRef.current;
        setStitchRotation(pinchStartRotRef.current + angleDiff);
      }
    };

    const onTouchEnd = () => {
      pinchStartDistRef.current = null;
      pinchStartAngleRef.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [showStitchInput, stitchScale, stitchRotation]);

  // Fetch contextual discovery content
  const fetchDiscovery = useCallback(async (): Promise<Signal[]> => {
    if (!user) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
    try {
      const [ownWords, stitchWords] = await Promise.all([
        supabase.from("signals").select("stitch_word").eq("user_id", user.id).not("stitch_word", "is", null).order("created_at", { ascending: false }).limit(10),
        supabase.from("stitches").select("word").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      ]);
      const themes = [
        ...(ownWords.data?.map((s) => s.stitch_word).filter(Boolean) ?? []),
        ...(stitchWords.data?.map((s) => s.word) ?? []),
      ];
      if (themes.length === 0) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);

      const { data, error } = await supabase.functions.invoke("discover-content", { body: { themes } });
      if (error || !data?.items?.length) return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);

      return data.items.map((item: any) => ({
        id: item.id, user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, stitch_word: null, created_at: "", display_name: item.display_name || item.query, media_url: item.image_url, isDiscovery: true,
      }));
    } catch {
      return shuffleArray(FALLBACK_DISCOVERY).slice(0, 5);
    }
  }, [user]);

  // Fetch suggested embers' signals (friends-of-friends)
  const fetchSuggestedSignals = useCallback(async (): Promise<Signal[]> => {
    if (!user) return [];
    try {
      // Get who I follow
      const { data: myFollows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);
      const followingIds = new Set(myFollows?.map((f) => f.following_id) ?? []);
      if (followingIds.size === 0) return [];

      // Get friends-of-friends
      const { data: fof } = await supabase
        .from("follows")
        .select("following_id")
        .in("follower_id", [...followingIds])
        .limit(100);
      if (!fof) return [];

      const candidateIds = [...new Set(fof.map((f) => f.following_id))]
        .filter((id) => id !== user.id && !followingIds.has(id));
      if (candidateIds.length === 0) return [];

      const shuffledCandidates = shuffleArray(candidateIds).slice(0, 10);

      // Fetch their active signals
      const { data: rawSignals } = await supabase
        .from("signals")
        .select("*")
        .in("user_id", shuffledCandidates)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(15);
      if (!rawSignals || rawSignals.length === 0) return [];

      const authorIds = [...new Set(rawSignals.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", authorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      return shuffleArray(rawSignals.map((s) => {
        let media_url: string | null = null;
        if (s.storage_path) {
          const { data: d } = supabase.storage.from("signals").getPublicUrl(s.storage_path);
          media_url = d.publicUrl;
        }
        return { ...s, display_name: nameMap.get(s.user_id) ?? "unknown", media_url, isSuggested: true };
      }));
    } catch {
      return [];
    }
  }, [user]);

  // Fetch signals
  useEffect(() => {
    if (!user) return;
    const fetchSignals = async () => {
      const { data: auraData } = await supabase.rpc("get_aura_ranked_following", { p_user_id: user.id });
      const rankedIds = auraData?.map((a: any) => a.following_id) ?? [];

      if (rankedIds.length === 0) {
        const discovery = await fetchDiscovery();
        setSignals(await interleaveAds(discovery, user.id));
        setLoading(false);
        return;
      }

      const auraRank = new Map(rankedIds.map((id: string, i: number) => [id, i]));
      const { data: rawSignals } = await supabase.from("signals").select("*").in("user_id", rankedIds).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }).limit(20);

      if (!rawSignals || rawSignals.length === 0) {
        const discovery = await fetchDiscovery();
        setSignals(await interleaveAds(discovery, user.id));
        setLoading(false);
        return;
      }

      const authorIds = [...new Set(rawSignals.map((s) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", authorIds);
      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      const enriched: Signal[] = rawSignals
        .filter((s) => !isBlocked(s.user_id))
        .map((s) => {
          let media_url: string | null = null;
          if (s.storage_path) {
            const { data } = supabase.storage.from("signals").getPublicUrl(s.storage_path);
            media_url = data.publicUrl;
          }
          return { ...s, display_name: nameMap.get(s.user_id) ?? "unknown", media_url };
        })
        .sort((a, b) => (auraRank.get(a.user_id) ?? 999) - (auraRank.get(b.user_id) ?? 999));

      // Insert ads every 4th position
      const withAds = await interleaveAds(enriched, user.id);
      setSignals(withAds);
      setLoading(false);
    };
    fetchSignals();
  }, [user, fetchDiscovery, fetchTargetedAd]);

  // Insert an ad every 4th slot
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
            id: `ad-${ad.id}-${contentCount}`,
            user_id: "",
            type: ad.media_type === "video" ? "video" : "photo",
            storage_path: null,
            song_clip_url: null,
            song_title: null,
            stitch_word: null,
            created_at: "",
            display_name: ad.company_name,
            media_url: ad.media_url,
            isAd: true,
            ad,
          });
        }
      }
    }
    return result;
  }, [fetchTargetedAd]);

  const advanceSignal = useCallback(() => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      setShowStitchInput(false);
      setShowIgnitePrompt(false);
      setStitchInput("");
      setSubmittedStitch(null);
      setStitchScale(1);
      setStitchRotation(0);
      elapsedBeforePauseRef.current = 0;
      startTimeRef.current = Date.now();
    } else {
      // Filter out stitched signals and signals older than 24hrs, then reshuffle
      const now = Date.now();
      const remaining = signals.filter((s) => {
        if (s.isAd || s.isDiscovery) return false;
        if (hasStitched[s.id]) return false;
        const createdAt = new Date(s.created_at).getTime();
        if (createdAt > 0 && now - createdAt > 24 * 60 * 60 * 1000) return false;
        return true;
      });

      if (remaining.length > 0) {
        const reshuffled = shuffleArray(remaining);
        setSignals(reshuffled);
        setCurrentIndex(0);
        setProgress(0);
        setShowStitchInput(false);
        setStitchInput("");
        setSubmittedStitch(null);
        setStitchScale(1);
        setStitchRotation(0);
        elapsedBeforePauseRef.current = 0;
        startTimeRef.current = Date.now();
      } else if (!suggestedLoaded) {
        // Load suggested embers' signals before ending
        setSuggestedLoaded(true);
        fetchSuggestedSignals().then((suggested) => {
          if (suggested.length > 0) {
            setSignals(suggested);
            setCurrentIndex(0);
            setProgress(0);
            setShowStitchInput(false);
            setStitchInput("");
            setSubmittedStitch(null);
            setStitchScale(1);
            setStitchRotation(0);
            elapsedBeforePauseRef.current = 0;
            startTimeRef.current = Date.now();
          } else {
            setEnded(true);
          }
        });
      } else {
        setEnded(true);
      }
    }
  }, [currentIndex, signals, hasStitched, suggestedLoaded, fetchSuggestedSignals]);

  // Fetch stitch counts for own signals
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

  const handleStitchSubmit = useCallback(async () => {
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery || !stitchInput.trim()) return;
    const word = stitchInput.replace(/\s/g, "").slice(0, 12);
    if (!word) return;

    const { error } = await supabase.from("stitches").insert({ user_id: user.id, signal_id: signal.id, word });

    if (!error) {
      setHasStitched((prev) => ({ ...prev, [signal.id]: true }));
      setSubmittedStitch({ word, x: stitchPos.x, y: stitchPos.y, scale: stitchScale, rotation: stitchRotation });

      await supabase.from("notifications").insert({
        user_id: signal.user_id, from_user_id: user.id, signal_id: signal.id, type: "stitch", word,
      });
      toast.success("Stitched ✦");
    }
    setShowStitchInput(false);
    setStitchInput("");
  }, [user, signals, currentIndex, stitchInput, stitchPos, stitchScale, stitchRotation]);

  // Record view
  useEffect(() => {
    if (loading || ended || signals.length === 0) return;
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery) return;
    supabase.from("signal_views").upsert({ user_id: user.id, signal_id: signal.id }, { onConflict: "user_id,signal_id" }).then(() => {});
  }, [currentIndex, loading, ended, signals, user]);

  // Timer — pauses when stitch input is open
  const pausedRef = useRef(false);
  const elapsedBeforePauseRef = useRef(0);

  // Fetch AI stitch suggestions when stitch input opens
  useEffect(() => {
    if (showStitchInput) {
      // Pause: save elapsed time so far
      pausedRef.current = true;
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      cancelAnimationFrame(animRef.current);

      // Fetch suggestions
      const signal = signals[currentIndex];
      if (signal && !signal.isDiscovery && !signal.isAd) {
        setLoadingSuggestions(true);
        setStitchSuggestions([]);
        supabase.functions.invoke("stitch-suggest", {
          body: {
            creator_name: signal.display_name,
            stitch_word: signal.stitch_word,
            media_type: signal.type,
            display_name: signal.display_name,
          },
        }).then(({ data, error }) => {
          if (!error && data?.words) {
            setStitchSuggestions(data.words);
          }
          setLoadingSuggestions(false);
        }).catch(() => setLoadingSuggestions(false));
      }
      return;
    }
    // Resume or start fresh
    pausedRef.current = false;
    startTimeRef.current = Date.now();
  }, [showStitchInput]);

  useEffect(() => {
    if (ended || loading || signals.length === 0 || showStitchInput) return;
    startTimeRef.current = Date.now();
    if (!showStitchInput) elapsedBeforePauseRef.current = 0; // reset on new signal
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

  // Double-tap handler
  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      // Ignore taps when stitch input is showing (pinch gestures handle that)
      if (showStitchInput) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let x: number, y: number;
      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      // Convert to percentage for responsive positioning
      const xPct = (x / rect.width) * 100;
      const yPct = (y / rect.height) * 100;

      const current = signals[currentIndex];
      if (current?.isAd) return; // No interactions on ads

      if (timeSinceLastTap < 300) {
        // DOUBLE TAP
        clearTimeout(tapTimeoutRef.current);
        lastTapRef.current = 0;

        const current = signals[currentIndex];
        if (user && current && !current.isDiscovery && current.user_id !== user.id && !hasStitched[current.id]) {
          doubleTapPosRef.current = { x: xPct, y: yPct };
          setStitchPos({ x: xPct, y: yPct });
          setStitchScale(1);
          setStitchRotation(0);
          setShowStitchInput(true);
          // For suggested signals, also show the ignite prompt
          if (current.isSuggested) {
            setShowIgnitePrompt(true);
          }
        }
        return;
      }

      lastTapRef.current = now;

      // Delayed single tap → felt
      tapTimeoutRef.current = window.setTimeout(() => {
        const current = signals[currentIndex];
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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="label-signal animate-pulse">loading...</p>
      </div>
    );
  }

  const isDiscoveryFeed = signals.length > 0 && signals[0].isDiscovery;
  const isSuggestedFeed = signals.length > 0 && signals[0].isSuggested;

  if (ended) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ ...signalTransition, delay: 0.3 }} className="flex h-full flex-col items-center justify-center gap-8 p-8">
        <p className="display-signal text-center">Your fire is resting.</p>
        <p className="text-sm text-muted-foreground">Go spark something new.</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onEnd} className="mt-4 signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease">Return</motion.button>
      </motion.div>
    );
  }

  const signal = signals[currentIndex];

  return (
    <div ref={feedRef} className="relative h-full w-full bg-background touch-none" onClick={handleTap}>
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
        {signals.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div className="h-full rounded-full bg-primary" style={{ width: i < currentIndex ? "100%" : i === currentIndex ? `${progress * 100}%` : "0%" }} />
          </div>
        ))}
      </div>

      {/* Signal content */}
      <AnimatePresence mode="wait">
        <motion.div key={signal.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 flex items-center justify-center bg-background">
          {signal.media_url && signal.type === "photo" && (
            <img src={signal.media_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {signal.media_url && signal.type === "video" && (
            <video src={signal.media_url} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          )}
          {!signal.media_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,30%,8%)] via-[hsl(200,25%,12%)] to-[hsl(180,20%,6%)]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Creator's stitch word overlay */}
      {signal.stitch_word && (
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <motion.p
            initial={{ opacity: 0, scale: 0.8, rotate: -2 }}
            animate={{ opacity: 1, scale: 1, rotate: -2 }}
            transition={{ ...signalTransition, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)", fontStyle: "italic" }}
          >
            {signal.stitch_word}
          </motion.p>
        </div>
      )}

      {/* Submitted stitch word at chosen position */}
      {submittedStitch && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute text-2xl font-bold text-primary drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
            style={{
              left: `${submittedStitch.x}%`,
              top: `${submittedStitch.y}%`,
              transform: `translate(-50%, -50%) scale(${submittedStitch.scale}) rotate(${submittedStitch.rotation}deg)`,
              textShadow: "0 0 16px hsl(var(--primary) / 0.5), 0 2px 8px rgba(0,0,0,0.6)",
              fontStyle: "italic",
            }}
          >
            {submittedStitch.word}
          </motion.p>
        </div>
      )}

      {/* Live stitch preview at tap position while typing */}
      {showStitchInput && stitchInput && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <p
            className="absolute text-2xl font-bold text-primary/70 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
            style={{
              left: `${stitchPos.x}%`,
              top: `${stitchPos.y}%`,
              transform: `translate(-50%, -50%) scale(${stitchScale}) rotate(${stitchRotation}deg)`,
              textShadow: "0 0 16px hsl(var(--primary) / 0.3), 0 2px 8px rgba(0,0,0,0.4)",
              fontStyle: "italic",
              transition: "transform 0.1s ease-out",
            }}
          >
            {stitchInput}
          </p>
        </div>
      )}

      {/* Name + song overlay OR Ad overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
        {signal.isAd && signal.ad ? (
          <motion.div
            key={`ad-${signal.id}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={signalTransition}
            className="flex flex-col gap-2"
          >
            <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">sponsored</span>
            <p className="text-lg font-bold text-foreground tracking-tight" style={{ textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
              {signal.ad.headline}
            </p>
            {signal.ad.description && (
              <p className="text-xs text-foreground/70" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                {signal.ad.description}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-muted-foreground/60">{signal.ad.company_name}</span>
              {signal.ad.cta_url && (
                <a
                  href={signal.ad.cta_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-full bg-primary px-4 py-1.5 text-[11px] font-medium text-primary-foreground"
                >
                  {signal.ad.cta_text || "Learn More"}
                </a>
              )}
            </div>
          </motion.div>
        ) : (
          <>
            <motion.p key={signal.display_name} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 0.6, y: 0 }} transition={signalTransition} className="label-signal">
              {signal.display_name}
            </motion.p>
            {signal.song_title && <p className="mt-1 text-xs text-muted-foreground/60">♪ {signal.song_title}</p>}

            {user && signal.user_id === user.id && stitchCounts[signal.id] && (
              <p className="mt-1 text-xs text-primary/80">✦ {stitchCounts[signal.id]} stitch{stitchCounts[signal.id] > 1 ? "es" : ""}</p>
            )}

            {user && signal.user_id !== user.id && !signal.isDiscovery && !hasStitched[signal.id] && !showStitchInput && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 0.35 }} transition={{ delay: 1.5 }} className="mt-2 text-[10px] text-muted-foreground">
                double tap to stitch{signal.isSuggested ? " & ignite" : ""} ✦
              </motion.p>
            )}

            {hasStitched[signal.id] && !submittedStitch && (
              <p className="mt-2 text-[10px] text-primary/60">✦ stitched</p>
            )}
          </>
        )}
      </div>

      {/* Stitch input overlay — positioned near bottom */}
      {showStitchInput && (
        <div className="absolute bottom-24 left-0 right-0 z-20 flex flex-col items-center gap-2 px-6" onClick={(e) => e.stopPropagation()}>
          {/* AI suggestion chips */}
          <AnimatePresence>
            {(stitchSuggestions.length > 0 || loadingSuggestions) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-wrap justify-center gap-1.5 mb-1"
              >
                {loadingSuggestions ? (
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-[10px] text-muted-foreground/50"
                  >
                    ✦ conjuring vibes...
                  </motion.div>
                ) : (
                  stitchSuggestions.map((word, i) => (
                    <motion.button
                      key={word}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ ...signalTransition, delay: i * 0.06 }}
                      onClick={() => setStitchInput(word)}
                      className={`rounded-full px-3 py-1 text-[11px] font-medium signal-ease ${
                        stitchInput === word
                          ? "bg-primary/25 text-primary ring-1 ring-primary/40"
                          : "bg-background/60 backdrop-blur-sm text-foreground/70 hover:text-primary"
                      }`}
                    >
                      {word}
                    </motion.button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <p className="text-[10px] text-muted-foreground/60">pinch to resize & rotate</p>
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="flex items-center gap-2 signal-surface signal-blur rounded-2xl px-4 py-2"
          >
            <input
              type="text"
              placeholder="one word"
              value={stitchInput}
              onChange={(e) => setStitchInput(e.target.value.replace(/\s/g, "").slice(0, 12))}
              maxLength={12}
              autoFocus
              className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-24"
              onKeyDown={(e) => e.key === "Enter" && handleStitchSubmit()}
            />
            <button onClick={handleStitchSubmit} disabled={!stitchInput.trim()} className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground disabled:opacity-30">
              stitch
            </button>
            <button onClick={() => { setShowStitchInput(false); setShowIgnitePrompt(false); setStitchInput(""); setStitchSuggestions([]); }} className="text-muted-foreground/50 text-xs">✕</button>
          </motion.div>

          {/* Ignite button for suggested embers */}
          <AnimatePresence>
            {showIgnitePrompt && signal.isSuggested && !ignitedInFeed[signal.user_id] && (
              <motion.button
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={signalTransition}
                onClick={async () => {
                  if (!user) return;
                  const { error } = await supabase.from("follows").insert({
                    follower_id: user.id,
                    following_id: signal.user_id,
                  });
                  if (!error) {
                    setIgnitedInFeed((prev) => ({ ...prev, [signal.user_id]: true }));
                    toast.success(`Ignited ${signal.display_name} 🔥`);
                  }
                }}
                className="mt-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground uppercase tracking-wide"
                whileTap={{ scale: 0.95 }}
              >
                🔥 ignite {signal.display_name}
              </motion.button>
            )}
            {showIgnitePrompt && signal.isSuggested && ignitedInFeed[signal.user_id] && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-[10px] text-primary/70"
              >
                🔥 ignited
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Counter + discover badge */}
      <div className="absolute right-8 top-12 z-10 flex items-center gap-2">
        {isDiscoveryFeed && (
          <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-medium text-primary">discover</span>
        )}
        {isSuggestedFeed && (
          <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">suggested</span>
        )}
        <p className="label-signal">{currentIndex + 1}/{signals.length}</p>
      </div>

      {/* Felt effects */}
      {feltEffects.map((felt) => (
        <FeltEffect key={felt.id} x={felt.x} y={felt.y} />
      ))}
    </div>
  );
};

export default FeedView;
