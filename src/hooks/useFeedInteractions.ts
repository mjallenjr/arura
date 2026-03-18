import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useRateLimit } from "@/hooks/useRateLimit";
import { toast } from "sonner";
import { playFelt, playStitch, playLevelUp, playRekindle, hapticFelt, hapticStitch, hapticLevelUp, hapticRekindle } from "@/lib/sounds";
import { HEAT_TIERS } from "@/components/feed/HeatBadge";
import type { Signal } from "@/lib/feed-types";

interface UseFeedInteractionsProps {
  signals: Signal[];
  currentIndex: number;
  showStitchInput: boolean;
}

export function useFeedInteractions({ signals, currentIndex, showStitchInput }: UseFeedInteractionsProps) {
  const { user } = useAuth();
  const checkStitchLimit = useRateLimit(10, 60000);

  const [feltEffects, setFeltEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [stitchCounts, setStitchCounts] = useState<Record<string, number>>({});
  const [hasStitched, setHasStitched] = useState<Record<string, boolean>>({});
  const [stitchSuggestions, setStitchSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [ignitedInFeed, setIgnitedInFeed] = useState<Record<string, boolean>>({});
  const [hasRekindled, setHasRekindled] = useState<Record<string, boolean>>({});
  const [levelUpTrigger, setLevelUpTrigger] = useState(false);
  const [levelUpName, setLevelUpName] = useState("");
  const [showReportMenu, setShowReportMenu] = useState(false);
  const prevHeatLevels = useRef<Record<string, string>>({});

  // Stitch counts for own signals
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

  // Level-up detection
  useEffect(() => {
    if (signals.length === 0) return;
    signals.forEach((s) => {
      const prev = prevHeatLevels.current[s.id];
      if (prev && s.heat_level && prev !== s.heat_level) {
        const prevIdx = HEAT_TIERS.indexOf(prev as any);
        const newIdx = HEAT_TIERS.indexOf(s.heat_level as any);
        if (newIdx > prevIdx && s.id === signals[currentIndex]?.id) {
          setLevelUpName(s.heat_level);
          setLevelUpTrigger(true);
          playLevelUp();
          hapticLevelUp();
          setTimeout(() => setLevelUpTrigger(false), 100);
        }
      }
      if (s.heat_level) prevHeatLevels.current[s.id] = s.heat_level;
    });
  }, [signals, currentIndex]);

  // Record view
  useEffect(() => {
    if (signals.length === 0) return;
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery) return;
    supabase.from("signal_views").upsert({ user_id: user.id, signal_id: signal.id }, { onConflict: "user_id,signal_id" }).then(() => {});
  }, [currentIndex, signals, user]);

  // AI stitch suggestions
  useEffect(() => {
    if (!showStitchInput) return;
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
  }, [showStitchInput, currentIndex, signals]);

  const handleStitchSubmit = useCallback(async (stitchInput: string, stitchPos: { x: number; y: number }, stitchScale: number, stitchRotation: number) => {
    const signal = signals[currentIndex];
    if (!user || !signal || signal.isDiscovery || !stitchInput.trim()) return false;
    if (!checkStitchLimit()) { toast.error("Slow down — too many stitches"); return false; }
    const word = stitchInput.replace(/\s/g, "").slice(0, 12);
    if (!word) return false;
    const { error } = await supabase.from("stitches").insert({ user_id: user.id, signal_id: signal.id, word });
    if (!error) {
      setHasStitched((prev) => ({ ...prev, [signal.id]: true }));
      await supabase.from("notifications").insert({ user_id: signal.user_id, from_user_id: user.id, signal_id: signal.id, type: "stitch", word });
      playStitch();
      hapticStitch();
      toast.success("Stitched ✦");
      return true;
    }
    return false;
  }, [user, signals, currentIndex]);

  const handleRekindle = useCallback(async (signalId: string, signalUserId: string) => {
    if (!user || hasRekindled[signalId]) return;
    const { error } = await supabase.from("rekindles").insert({ user_id: user.id, signal_id: signalId } as any);
    if (!error) {
      setHasRekindled((prev) => ({ ...prev, [signalId]: true }));
      await supabase.from("notifications").insert({
        user_id: signalUserId, from_user_id: user.id, signal_id: signalId, type: "rekindle" as any,
      } as any);
      playRekindle();
      hapticRekindle();
      toast.success("Rekindled — keeping it lit");
    }
  }, [user, hasRekindled]);

  const handleShare = useCallback(async (signalId: string) => {
    const ogUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/signal-og?id=${signalId}`;
    if (navigator.share) {
      try { await navigator.share({ title: "arura signal", url: ogUrl }); } catch {}
    } else {
      await navigator.clipboard.writeText(ogUrl);
      toast.success("Link copied");
    }
  }, []);

  const handleFelt = useCallback((x: number, y: number) => {
    const signal = signals[currentIndex];
    if (user && signal && !signal.isDiscovery) {
      supabase.from("felts").insert({ user_id: user.id, signal_id: signal.id }).then(() => {});
    }
    playFelt();
    hapticFelt();
    const id = `${Date.now()}-${Math.random()}`;
    setFeltEffects((prev) => [...prev, { id, x, y }]);
    setTimeout(() => { setFeltEffects((prev) => prev.filter((f) => f.id !== id)); }, 700);
  }, [user, signals, currentIndex]);

  const handleIgnite = useCallback(async (targetUserId: string, displayName: string) => {
    if (!user) return;
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: targetUserId });
    if (!error) {
      setIgnitedInFeed((prev) => ({ ...prev, [targetUserId]: true }));
      toast.success(`Ignited ${displayName} 🔥`);
    }
  }, [user]);

  return {
    feltEffects, stitchCounts, hasStitched, stitchSuggestions, loadingSuggestions,
    ignitedInFeed, hasRekindled, levelUpTrigger, levelUpName,
    showReportMenu, setShowReportMenu,
    handleStitchSubmit, handleRekindle, handleShare, handleFelt, handleIgnite,
    setStitchSuggestions,
  };
}
