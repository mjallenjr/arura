import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface EmberProfileProps {
  userId: string;
  onClose: () => void;
}

interface EmberData {
  display_name: string;
  avatar_url: string | null;
  bio_word: string | null;
  ignitedCount: number;
  fuelingCount: number;
  topDrop: { media_url: string; type: string; stitch_word: string | null; felt_count: number } | null;
}

const EmberProfile = ({ userId, onClose }: EmberProfileProps) => {
  const [data, setData] = useState<EmberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Fetch profile, follow counts, and top signal in parallel
      const [profileRes, ignitedRes, fuelingRes, signalsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, avatar_url, bio_word").eq("user_id", userId).single(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("signals").select("id, type, storage_path, stitch_word").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      ]);

      let topDrop: EmberData["topDrop"] = null;

      if (signalsRes.data && signalsRes.data.length > 0) {
        // Find signal with most felts
        const signalIds = signalsRes.data.map(s => s.id);
        const { data: feltCounts } = await supabase
          .from("felts")
          .select("signal_id")
          .in("signal_id", signalIds);

        const countMap = new Map<string, number>();
        feltCounts?.forEach(f => countMap.set(f.signal_id, (countMap.get(f.signal_id) ?? 0) + 1));

        // Sort by felt count, pick top
        const ranked = signalsRes.data
          .map(s => ({ ...s, felt_count: countMap.get(s.id) ?? 0 }))
          .sort((a, b) => b.felt_count - a.felt_count);

        const top = ranked[0];
        if (top.storage_path) {
          const { data: urlData } = supabase.storage.from("signals").getPublicUrl(top.storage_path);
          topDrop = {
            media_url: urlData.publicUrl,
            type: top.type,
            stitch_word: top.stitch_word,
            felt_count: top.felt_count,
          };
        }
      }

      setData({
        display_name: profileRes.data?.display_name ?? "Unknown",
        avatar_url: profileRes.data?.avatar_url ?? null,
        bio_word: (profileRes.data as any)?.bio_word ?? null,
        ignitedCount: ignitedRes.count ?? 0,
        fuelingCount: fuelingRes.count ?? 0,
        topDrop,
      });
      setLoading(false);
    };
    load();
  }, [userId]);

  const initial = data?.display_name?.charAt(0).toUpperCase() ?? "?";

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={signalTransition}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">ember</p>
        <div className="w-5" />
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
            className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      ) : data ? (
        <div className="flex-1 overflow-y-auto px-6 pb-12">
          {/* Avatar + Name + Bio word */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={signalTransition}
            className="flex flex-col items-center gap-3 pt-6 pb-6"
          >
            <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
              {data.avatar_url ? (
                <img src={data.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-medium text-secondary-foreground">{initial}</span>
              )}
            </div>
            <p className="text-lg font-medium text-foreground tracking-tight">{data.display_name}</p>
            {data.bio_word && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...signalTransition, delay: 0.15 }}
                className="text-xl font-bold text-primary tracking-tight"
                style={{
                  fontStyle: "italic",
                  textShadow: "0 0 20px hsl(var(--primary) / 0.3)",
                }}
              >
                {data.bio_word}
              </motion.p>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...signalTransition, delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-8"
          >
            <div className="signal-surface rounded-xl p-4 flex flex-col items-center gap-1">
              <span className="text-xl font-medium text-foreground">{data.ignitedCount}</span>
              <span className="label-signal">Ignited</span>
            </div>
            <div className="signal-surface rounded-xl p-4 flex flex-col items-center gap-1">
              <span className="text-xl font-medium text-foreground">{data.fuelingCount}</span>
              <span className="label-signal">Fueling</span>
            </div>
          </motion.div>

          {/* Top sparked drop */}
          {data.topDrop && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.2 }}
            >
              <p className="label-signal mb-3">✦ top sparked drop</p>
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary">
                {data.topDrop.type === "photo" ? (
                  <img
                    src={data.topDrop.media_url}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <video
                    src={data.topDrop.media_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {data.topDrop.stitch_word && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p
                      className="text-3xl font-bold tracking-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                      style={{
                        textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)",
                        fontStyle: "italic",
                      }}
                    >
                      {data.topDrop.stitch_word}
                    </p>
                  </div>
                )}

                {/* Felt count badge */}
                <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5">
                  <span className="text-primary text-sm">✦</span>
                  <span className="text-xs font-medium text-foreground">{data.topDrop.felt_count}</span>
                </div>
              </div>
            </motion.div>
          )}

          {!data.topDrop && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ ...signalTransition, delay: 0.2 }}
              className="signal-surface rounded-xl p-6 flex items-center justify-center"
            >
              <p className="text-xs text-muted-foreground">No drops yet</p>
            </motion.div>
          )}
        </div>
      ) : null}
    </motion.div>
  );
};

export default EmberProfile;
