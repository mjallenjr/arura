import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import FeltEffect from "@/components/FeltEffect";
import ReportBlockMenu from "@/components/ReportBlockMenu";
import FeedPlayer from "@/components/feed/FeedPlayer";
import FeedEndScreen from "@/components/feed/FeedEndScreen";
import AdCard from "@/components/feed/AdCard";
import StitchOverlay from "@/components/feed/StitchOverlay";
import FeedControls from "@/components/feed/FeedControls";
import LevelUpCelebration from "@/components/feed/LevelUpCelebration";
import FanSheet from "@/components/feed/FanSheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFeedData } from "@/hooks/useFeedData";
import { useFeedInteractions } from "@/hooks/useFeedInteractions";
import { useFan } from "@/hooks/useFan";
import { toast } from "sonner";
import { playSwipe, hapticSwipe } from "@/lib/sounds";
import { Signal, SIGNAL_DURATION, AD_DURATION, shuffleArray, getTouchDistance, getTouchAngle } from "@/lib/feed-types";

// Re-export Signal for consumers
export type { Signal } from "@/lib/feed-types";

interface FeedViewProps {
  onEnd: () => void;
}

const FeedView = ({ onEnd }: FeedViewProps) => {
  const { user } = useAuth();
  const {
    signals, setSignals, loading, isFromCache, isOnline,
    firstTouchSignals, levelUpCreditSignals,
    fetchSuggestedSignals, refreshBlocks,
  } = useFeedData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [ended, setEnded] = useState(false);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const [showStitchInput, setShowStitchInput] = useState(false);
  const [showIgnitePrompt, setShowIgnitePrompt] = useState(false);
  const [stitchInput, setStitchInput] = useState("");
  const [stitchPos, setStitchPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [stitchScale, setStitchScale] = useState(1);
  const [stitchRotation, setStitchRotation] = useState(0);
  const [submittedStitch, setSubmittedStitch] = useState<{
    word: string; x: number; y: number; scale: number; rotation: number;
  } | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showFanSheet, setShowFanSheet] = useState(false);
  const { fanFlare, fanCounts, getFanCount } = useFan();

  const {
    feltEffects, stitchCounts, hasStitched, stitchSuggestions, loadingSuggestions,
    ignitedInFeed, hasRekindled, levelUpTrigger, levelUpName,
    showReportMenu, setShowReportMenu,
    handleStitchSubmit: rawStitchSubmit, handleRekindle, handleShare, handleFelt, handleIgnite,
    setStitchSuggestions,
  } = useFeedInteractions({ signals, currentIndex, showStitchInput });

  // Refs
  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<number>(0);
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

  // ── Heat advisory realtime ──
  const jumpToSignal = useCallback((signalId: string) => {
    const idx = signals.findIndex((s) => s.id === signalId);
    if (idx >= 0) { setCurrentIndex(idx); setProgress(0); }
  }, [signals]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("heat-advisory")
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, (payload: any) => {
        const row = payload.new;
        if (row?.type === "heat_advisory" && row?.signal_id) {
          toast("✦ Heat Advisory", {
            description: `A flare you follow just hit ${row.word?.toUpperCase() ?? "HOT"} — tap to jump!`,
            duration: 6000,
            action: { label: "Go", onClick: () => jumpToSignal(row.signal_id) },
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, jumpToSignal]);

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
  }, [currentIndex, signals, hasStitched, suggestedLoaded, fetchSuggestedSignals, resetStitchState, setSignals]);

  const goBackSignal = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
      setProgress(0);
      resetStitchState();
    }
  }, [currentIndex, resetStitchState]);

  // ── Pause/resume timer on stitch ──
  useEffect(() => {
    if (showStitchInput) {
      pausedRef.current = true;
      elapsedBeforePauseRef.current += Date.now() - startTimeRef.current;
      cancelAnimationFrame(animRef.current);
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
        handleFelt(x, y);
      }, 300);
    },
    [user, signals, currentIndex, hasStitched, showStitchInput, handleFelt]
  );

  // ── Stitch submit wrapper ──
  const onStitchSubmit = useCallback(async () => {
    const success = await rawStitchSubmit(stitchInput, stitchPos, stitchScale, stitchRotation);
    if (success) {
      setSubmittedStitch({ word: stitchInput.replace(/\s/g, "").slice(0, 12), x: stitchPos.x, y: stitchPos.y, scale: stitchScale, rotation: stitchRotation });
    }
    setShowStitchInput(false);
    setStitchInput("");
  }, [rawStitchSubmit, stitchInput, stitchPos, stitchScale, stitchRotation]);

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
    <div
      ref={feedRef}
      className="relative h-full w-full bg-background touch-none"
      onClick={handleTap}
      onTouchStart={(e) => {
        if (showStitchInput || e.touches.length > 1) return;
        swipeStartXRef.current = e.touches[0].clientX;
        swipeStartYRef.current = e.touches[0].clientY;
        isSwiping.current = false;
        swipeDeltaRef.current = 0;
      }}
      onTouchMove={(e) => {
        if (swipeStartXRef.current === null || swipeStartYRef.current === null || showStitchInput || e.touches.length > 1) return;
        const dx = e.touches[0].clientX - swipeStartXRef.current;
        const dy = e.touches[0].clientY - swipeStartYRef.current;
        if (!isSwiping.current && Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          isSwiping.current = true;
        }
        if (isSwiping.current) { swipeDeltaRef.current = dx; setSwipeOffset(dx); }
      }}
      onTouchEnd={() => {
        if (isSwiping.current) {
          const threshold = 80;
          if (swipeDeltaRef.current < -threshold) { advanceSignal(); playSwipe(); hapticSwipe(); }
          else if (swipeDeltaRef.current > threshold) { goBackSignal(); playSwipe(); hapticSwipe(); }
        }
        swipeStartXRef.current = null;
        swipeStartYRef.current = null;
        isSwiping.current = false;
        swipeDeltaRef.current = 0;
        setSwipeOffset(0);
      }}
    >
      {/* Close button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEnd(); }}
        aria-label="Close feed"
        className="absolute top-4 right-4 z-30 h-9 w-9 rounded-full signal-surface signal-blur flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Live region for screen readers — signal changes */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        Signal {currentIndex + 1} of {signals.length}
        {signal.display_name ? `, by ${signal.display_name}` : ""}
        {signal.heat_level ? `, heat level ${signal.heat_level}` : ""}
      </div>

      {/* Offline/cached indicator */}
      {isFromCache && (
        <div role="status" aria-live="polite" className="absolute top-12 left-1/2 -translate-x-1/2 z-20 rounded-full bg-muted/80 backdrop-blur-sm px-3 py-1">
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
        isFirstTouch={!!firstTouchSignals[signal.id]}
        isLevelUpCredit={!!levelUpCreditSignals[signal.id] && signal.heat_level !== 'match'}
        hasRekindled={!!hasRekindled[signal.id]}
        onReportClick={() => setShowReportMenu(true)}
        onRekindle={() => handleRekindle(signal.id, signal.user_id)}
        onShare={() => handleShare(signal.id)}
      />

      <LevelUpCelebration trigger={levelUpTrigger} newLevel={levelUpName} />

      <div style={{ transform: `translateX(${swipeOffset * 0.4}px)`, opacity: 1 - Math.abs(swipeOffset) / 400, transition: swipeOffset === 0 ? 'transform 0.25s ease, opacity 0.25s ease' : 'none' }}>
        <FeedPlayer signalId={signal.id} mediaUrl={signal.media_url} type={signal.type} />
      </div>

      <StitchOverlay
        stitchWord={signal.stitch_word}
        stitchWordPos={signal.stitch_word_pos}
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
        onStitchSubmit={onStitchSubmit}
        onStitchClose={() => { setShowStitchInput(false); setShowIgnitePrompt(false); setStitchInput(""); setStitchSuggestions([]); }}
        onIgnite={() => handleIgnite(signal.user_id, signal.display_name)}
      />

      {signal.isAd && signal.ad && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
          <AdCard ad={signal.ad} signalId={signal.id} />
        </div>
      )}

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

      <AnimatePresence>
        {feltEffects.map((f) => (
          <FeltEffect key={f.id} x={f.x} y={f.y} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default FeedView;
