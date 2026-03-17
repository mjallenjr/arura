import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FeltEffect from "@/components/FeltEffect";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FeedViewProps {
  onEnd: () => void;
}

const SIGNAL_DURATION = 5000;

interface Signal {
  id: string;
  user_id: string;
  type: string;
  storage_path: string | null;
  song_clip_url: string | null;
  song_title: string | null;
  created_at: string;
  display_name: string;
  media_url: string | null;
  isDiscovery?: boolean;
}

// Discovery content — shown when no new signals from followed users
const DISCOVERY_ITEMS: Signal[] = [
  { id: "d-1", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "autumn river", media_url: "/discover/river-autumn.jpg", isDiscovery: true },
  { id: "d-2", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "sunset pier", media_url: "/discover/sunset-pier.jpg", isDiscovery: true },
  { id: "d-3", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "hidden waterfall", media_url: "/discover/waterfall.jpg", isDiscovery: true },
  { id: "d-4", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "fly fishing", media_url: "/discover/fly-fishing.jpg", isDiscovery: true },
  { id: "d-5", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "cotton candy skies", media_url: "/discover/clouds-lake.jpg", isDiscovery: true },
  { id: "d-6", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "morning visitor", media_url: "/discover/deer-morning.jpg", isDiscovery: true },
  { id: "d-7", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "boardwalk treats", media_url: "/discover/ice-cream.jpg", isDiscovery: true },
  { id: "d-8", user_id: "", type: "photo", storage_path: null, song_clip_url: null, song_title: null, created_at: "", display_name: "paradise found", media_url: "/discover/beach-sunrise.jpg", isDiscovery: true },
];

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const signalTransition = {
  duration: 0.4,
  ease: [0.2, 0.8, 0.2, 1] as const,
};

const FeedView = ({ onEnd }: FeedViewProps) => {
  const { user } = useAuth();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [feltEffects, setFeltEffects] = useState<Array<{ id: string; x: number; y: number }>>([]);
  const [ended, setEnded] = useState(false);
  const startTimeRef = useRef(Date.now());
  const animRef = useRef<number>(0);

  // Fetch signals from people the user follows
  useEffect(() => {
    if (!user) return;

    const fetchSignals = async () => {
      // Get followed user ids
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      const followedIds = follows?.map((f) => f.following_id) ?? [];

      if (followedIds.length === 0) {
        setSignals([]);
        setLoading(false);
        setEnded(true);
        return;
      }

      // Fetch non-expired signals from followed users
      const { data: rawSignals } = await supabase
        .from("signals")
        .select("*")
        .in("user_id", followedIds)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(20);

      if (!rawSignals || rawSignals.length === 0) {
        setSignals([]);
        setLoading(false);
        setEnded(true);
        return;
      }

      // Get display names for signal authors
      const authorIds = [...new Set(rawSignals.map((s) => s.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", authorIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      // Build media URLs
      const enriched: Signal[] = rawSignals.map((s) => {
        let media_url: string | null = null;
        if (s.storage_path) {
          const { data } = supabase.storage.from("signals").getPublicUrl(s.storage_path);
          media_url = data.publicUrl;
        }
        return {
          ...s,
          display_name: nameMap.get(s.user_id) ?? "unknown",
          media_url,
        };
      });

      setSignals(enriched);
      setLoading(false);
    };

    fetchSignals();
  }, [user]);

  const advanceSignal = useCallback(() => {
    if (currentIndex < signals.length - 1) {
      setCurrentIndex((i) => i + 1);
      setProgress(0);
      startTimeRef.current = Date.now();
    } else {
      setEnded(true);
    }
  }, [currentIndex, signals.length]);

  useEffect(() => {
    if (ended || loading || signals.length === 0) return;

    startTimeRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const p = Math.min(1, elapsed / SIGNAL_DURATION);
      setProgress(p);

      if (p >= 1) {
        advanceSignal();
      } else {
        animRef.current = requestAnimationFrame(tick);
      }
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [currentIndex, ended, loading, signals.length, advanceSignal]);

  const handleFelt = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let x: number, y: number;

      if ("touches" in e) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      } else {
        x = e.clientX - rect.left;
        y = e.clientY - rect.top;
      }

      // Record felt in DB
      if (user && signals[currentIndex]) {
        supabase.from("felts").insert({
          user_id: user.id,
          signal_id: signals[currentIndex].id,
        }).then(() => {});
      }

      const id = `${Date.now()}-${Math.random()}`;
      setFeltEffects((prev) => [...prev, { id, x, y }]);
      setTimeout(() => {
        setFeltEffects((prev) => prev.filter((f) => f.id !== id));
      }, 700);
    },
    [user, signals, currentIndex]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="label-signal animate-pulse">loading...</p>
      </div>
    );
  }

  if (ended) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...signalTransition, delay: 0.3 }}
        className="flex h-full flex-col items-center justify-center gap-8 p-8"
      >
        <p className="display-signal text-center">
          {signals.length === 0 ? "No new signals." : "You're all caught up."}
        </p>
        <p className="text-sm text-muted-foreground">
          {signals.length === 0 ? "Follow people to see their moments." : "Go live something."}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onEnd}
          className="mt-4 signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-muted-foreground signal-ease"
        >
          Return
        </motion.button>
      </motion.div>
    );
  }

  const signal = signals[currentIndex];

  return (
    <div className="relative h-full w-full bg-background" onClick={handleFelt}>
      {/* Progress bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 p-3">
        {signals.map((s, i) => (
          <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-foreground/10">
            <motion.div
              className="h-full rounded-full bg-primary"
              style={{
                width:
                  i < currentIndex
                    ? "100%"
                    : i === currentIndex
                    ? `${progress * 100}%`
                    : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Signal content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={signal.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 flex items-center justify-center bg-background"
        >
          {signal.media_url && signal.type === "photo" && (
            <img
              src={signal.media_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {signal.media_url && signal.type === "video" && (
            <video
              src={signal.media_url}
              autoPlay
              muted
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          {!signal.media_url && (
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,30%,8%)] via-[hsl(200,25%,12%)] to-[hsl(180,20%,6%)]" />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Name + song overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
        <motion.p
          key={signal.display_name}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.6, y: 0 }}
          transition={signalTransition}
          className="label-signal"
        >
          {signal.display_name}
        </motion.p>
        {signal.song_title && (
          <p className="mt-1 text-xs text-muted-foreground/60">♪ {signal.song_title}</p>
        )}
      </div>

      {/* Counter */}
      <div className="absolute right-8 top-12 z-10">
        <p className="label-signal">
          {currentIndex + 1}/{signals.length}
        </p>
      </div>

      {/* Felt effects */}
      {feltEffects.map((felt) => (
        <FeltEffect key={felt.id} x={felt.x} y={felt.y} />
      ))}
    </div>
  );
};

export default FeedView;
