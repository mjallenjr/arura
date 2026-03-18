import { useState, useEffect, useCallback } from "react";
import { resolveMediaUrl } from "@/lib/feed-types";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import FeltEffect from "./FeltEffect";
import ReferralBadge from "./ReferralBadge";
import type { ReferralReward } from "@/hooks/useReferral";

const REWARD_TIERS: { min: number; tier: ReferralReward["tier"]; label: string; bonusMinutes: number }[] = [
  { min: 25, tier: "eternal",  label: "Eternal Flame",  bonusMinutes: 120 },
  { min: 10, tier: "inferno",  label: "Inferno Spark",  bonusMinutes: 60 },
  { min: 5,  tier: "flame",    label: "Flame Carrier",  bonusMinutes: 30 },
  { min: 1,  tier: "spark",    label: "First Spark",    bonusMinutes: 15 },
];

function getReward(count: number): ReferralReward {
  for (const t of REWARD_TIERS) {
    if (count >= t.min) {
      const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(t) - 1];
      return { tier: t.tier, label: t.label, bonusMinutes: t.bonusMinutes, nextTierAt: nextTier ? nextTier.min : t.min };
    }
  }
  return { tier: "none", label: "", bonusMinutes: 0, nextTierAt: 1 };
}

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
  topDrop: { signal_id: string; media_url: string; type: string; stitch_word: string | null; felt_count: number } | null;
}

const EmberProfile = ({ userId, onClose }: EmberProfileProps) => {
  const [data, setData] = useState<EmberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sparked, setSparked] = useState(false);
  const [showFelt, setShowFelt] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [refueled, setRefueled] = useState(false);
  const [extinguishing, setExtinguishing] = useState(false);
  const [refueling, setRefueling] = useState(false);
  const [igniting, setIgniting] = useState(false);
  const [hasMutualSpark, setHasMutualSpark] = useState(false);
  const [referralReward, setReferralReward] = useState<ReferralReward>({ tier: "none", label: "", bonusMinutes: 0, nextTierAt: 1 });
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: d }) => setCurrentUser(d.user?.id ?? null));
  }, []);

  useEffect(() => {
    const load = async () => {
      const [profileRes, ignitedRes, fuelingRes, signalsRes] = await Promise.all([
        supabase.from("public_profiles").select("display_name, avatar_url, bio_word").eq("user_id", userId).single(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", userId),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("signals").select("id, type, storage_path, stitch_word").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      ]);

      let topDrop: EmberData["topDrop"] = null;

      if (signalsRes.data && signalsRes.data.length > 0) {
        const signalIds = signalsRes.data.map(s => s.id);
        const { data: feltCounts } = await supabase
          .from("felts")
          .select("signal_id")
          .in("signal_id", signalIds);

        const countMap = new Map<string, number>();
        feltCounts?.forEach(f => countMap.set(f.signal_id, (countMap.get(f.signal_id) ?? 0) + 1));

        const ranked = signalsRes.data
          .map(s => ({ ...s, felt_count: countMap.get(s.id) ?? 0 }))
          .sort((a, b) => b.felt_count - a.felt_count);

        const top = ranked[0];
        if (top.storage_path) {
          const { data: urlData } = supabase.storage.from("signals").getPublicUrl(top.storage_path);
          topDrop = {
            signal_id: top.id,
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

      // Fetch referral count for badge
      const { count: refCount } = await supabase
        .from("referrals")
        .select("id", { count: "exact", head: true })
        .eq("referrer_id", userId);
      setReferralReward(getReward(refCount ?? 0));

      setLoading(false);
    };
    load();
  }, [userId]);

  // Check follow status and refuel status
  useEffect(() => {
    if (!currentUser || currentUser === userId) return;
    
    // Check follow
    const checkFollow = supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser)
      .eq("following_id", userId);

    // Check latest refuel notification from me to them
    const checkRefuel = supabase
      .from("notifications")
      .select("created_at")
      .eq("user_id", userId)
      .eq("from_user_id", currentUser)
      .eq("type", "refuel")
      .order("created_at", { ascending: false })
      .limit(1);

    // Check their latest signal
    const checkLatestSignal = supabase
      .from("signals")
      .select("created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1);

    Promise.all([checkFollow, checkRefuel, checkLatestSignal]).then(
      ([followRes, refuelRes, signalRes]) => {
        setIsFollowing(followRes.data !== null && followRes.data.length > 0);

        // Refueled = there's a refuel notification that's newer than their latest signal
        const lastRefuel = refuelRes.data?.[0]?.created_at;
        const lastSignal = signalRes.data?.[0]?.created_at;
        if (lastRefuel) {
          if (!lastSignal || new Date(lastRefuel) > new Date(lastSignal)) {
            setRefueled(true);
          }
          // If they posted a new signal after the refuel, allow re-refueling
        }
      }
    );
  }, [currentUser, userId]);

  // Check mutual spark (both users have felted each other's signals)
  useEffect(() => {
    if (!currentUser || currentUser === userId) return;
    const check = async () => {
      // Did I felt any of their signals?
      const { data: theirSignals } = await supabase
        .from("signals")
        .select("id")
        .eq("user_id", userId)
        .limit(50);
      if (!theirSignals || theirSignals.length === 0) return;

      const { data: myFelts } = await supabase
        .from("felts")
        .select("id")
        .eq("user_id", currentUser)
        .in("signal_id", theirSignals.map((s) => s.id))
        .limit(1);

      // Did they felt any of my signals?
      const { data: mySignals } = await supabase
        .from("signals")
        .select("id")
        .eq("user_id", currentUser)
        .limit(50);
      if (!mySignals || mySignals.length === 0) return;

      const { data: theirFelts } = await supabase
        .from("felts")
        .select("id")
        .eq("user_id", userId)
        .in("signal_id", mySignals.map((s) => s.id))
        .limit(1);

      if (myFelts && myFelts.length > 0 && theirFelts && theirFelts.length > 0) {
        setHasMutualSpark(true);
      }
    };
    check();
  }, [currentUser, userId]);

  useEffect(() => {
    if (!data?.topDrop?.signal_id || !currentUser) return;
    supabase
      .from("felts")
      .select("id")
      .eq("signal_id", data.topDrop.signal_id)
      .eq("user_id", currentUser)
      .then(({ data: felts }) => {
        if (felts && felts.length > 0) setSparked(true);
      });
  }, [data?.topDrop?.signal_id, currentUser]);

  const handleSpark = async () => {
    if (!currentUser || !data?.topDrop?.signal_id || sparked) return;
    setSparked(true);
    setShowFelt(true);
    setTimeout(() => setShowFelt(false), 1200);

    const { error } = await supabase.from("felts").insert({
      signal_id: data.topDrop.signal_id,
      user_id: currentUser,
    });

    if (error) {
      setSparked(false);
      return;
    }

    setData(prev => prev && prev.topDrop ? {
      ...prev,
      topDrop: { ...prev.topDrop, felt_count: prev.topDrop.felt_count + 1 },
    } : prev);

    toast({ title: "✦ sparked", description: `You sparked ${data.display_name}'s top drop` });
  };

  const handleExtinguish = useCallback(async () => {
    if (!currentUser || !isFollowing) return;
    setExtinguishing(true);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser)
      .eq("following_id", userId);

    setTimeout(() => {
      setExtinguishing(false);
      if (!error) {
        setIsFollowing(false);
        toast({ title: "extinguished", description: `You extinguished ${data?.display_name}` });
      }
    }, 800);
  }, [currentUser, userId, isFollowing, data?.display_name]);

  const handleRefuel = useCallback(async () => {
    if (!currentUser || refueled) return;
    setRefueling(true);

    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      from_user_id: currentUser,
      type: "refuel",
      word: "wants to see more of your world",
    });

    setTimeout(() => {
      setRefueling(false);
      if (!error) {
        setRefueled(true);
        toast({ title: "✦ refueled", description: `${data?.display_name} will know a roaming ember wants more` });
      }
    }, 600);
  }, [currentUser, userId, refueled, data?.display_name]);

  const handleIgnite = useCallback(async () => {
    if (!currentUser || isFollowing) return;
    setIgniting(true);

    const { error } = await supabase.from("follows").insert({
      follower_id: currentUser,
      following_id: userId,
    });

    setTimeout(() => {
      setIgniting(false);
      if (!error) {
        setIsFollowing(true);
        toast({ title: "✦ ignited", description: `You ignited ${data?.display_name}` });
      }
    }, 800);
  }, [currentUser, userId, isFollowing, data?.display_name]);

  const initial = data?.display_name?.charAt(0).toUpperCase() ?? "?";
  const isSelf = currentUser === userId;

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
          {/* Avatar + Name + Root */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={signalTransition}
            className="flex flex-col items-center gap-3 pt-6 pb-6"
          >
            <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
              {data.avatar_url ? (
                <img src={data.avatar_url} alt={`${data.display_name}'s avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-3xl font-medium text-secondary-foreground">{initial}</span>
              )}
            </div>
            <p className="text-lg font-medium text-foreground tracking-tight">{data.display_name}</p>
            {referralReward.tier !== "none" && (
              <ReferralBadge reward={referralReward} size="sm" />
            )}
            {data.bio_word && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ ...signalTransition, delay: 0.15 }}
                className="flex flex-col items-center gap-1"
              >
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50">root</span>
                <p
                  className="text-xl font-bold text-primary tracking-tight"
                  style={{
                    fontStyle: "italic",
                    textShadow: "0 0 20px hsl(var(--primary) / 0.3)",
                  }}
                >
                  {data.bio_word}
                </p>
              </motion.div>
            )}
          </motion.div>

          {/* Ignite / Extinguish & Refuel Actions */}
          {!isSelf && currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.08 }}
              className="flex gap-3 mb-6"
            >
              {/* Ignite button (when not following) */}
              {!isFollowing && (
                <motion.button
                  onClick={handleIgnite}
                  disabled={igniting}
                  className="flex-1 relative overflow-hidden rounded-xl py-3 px-4 bg-primary text-primary-foreground text-xs font-medium tracking-wide uppercase transition-colors hover:opacity-90 disabled:opacity-50"
                  whileTap={{ scale: 0.97 }}
                >
                  <AnimatePresence>
                    {igniting && (
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <motion.div
                          className="absolute inset-0 bg-gradient-radial from-primary/40 to-transparent"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: [0, 1, 0.5], scale: [0.5, 1.2, 1] }}
                          transition={{ duration: 0.8 }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  ✦ ignite
                </motion.button>
              )}

              {/* Extinguish button (when following) */}
              {isFollowing && (
                <motion.button
                  onClick={handleExtinguish}
                  disabled={extinguishing}
                  className="flex-1 relative overflow-hidden rounded-xl py-3 px-4 border border-destructive/30 bg-destructive/5 text-destructive text-xs font-medium tracking-wide uppercase transition-colors hover:bg-destructive/10 disabled:opacity-50"
                  whileTap={{ scale: 0.97 }}
                >
                  <AnimatePresence>
                    {extinguishing && (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-destructive/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {[...Array(8)].map((_, i) => (
                          <motion.span
                            key={i}
                            className="absolute w-1 h-1 rounded-full bg-destructive/60"
                            initial={{ opacity: 1, x: 0, y: 0 }}
                            animate={{
                              opacity: 0,
                              x: (Math.random() - 0.5) * 60,
                              y: Math.random() * -40 - 10,
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                          />
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  extinguish
                </motion.button>
              )}

              {/* Refuel button */}
              <motion.button
                onClick={handleRefuel}
                disabled={refueled || refueling}
                className={`flex-1 relative overflow-hidden rounded-xl py-3 px-4 text-xs font-medium tracking-wide uppercase transition-all ${
                  refueled
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-primary text-primary-foreground hover:opacity-90"
                } disabled:opacity-60`}
                whileTap={{ scale: 0.97 }}
              >
                <AnimatePresence>
                  {refueling && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 1] }}
                        transition={{ duration: 0.6 }}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                {refueled ? "✦ refueled" : "refuel"}
              </motion.button>
            </motion.div>
          )}

          {/* Words button (mutual spark only) */}
          {!isSelf && currentUser && hasMutualSpark && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...signalTransition, delay: 0.12 }}
              className="mb-6"
            >
              <motion.button
                onClick={() => {
                  onClose();
                  navigate(`/messages?dm=${userId}&name=${encodeURIComponent(data?.display_name ?? "")}`);
                }}
                className="w-full rounded-xl py-3 px-4 signal-surface border border-border/30 text-xs font-medium tracking-wide uppercase text-foreground/80 hover:text-foreground transition-colors"
                whileTap={{ scale: 0.97 }}
              >
                words
              </motion.button>
            </motion.div>
          )}

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
              <div
                className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-secondary cursor-pointer"
                onClick={handleSpark}
              >
                {data.topDrop.type === "photo" ? (
                  <img
                    src={data.topDrop.media_url}
                    alt={`Top signal by ${data.display_name}`}
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

                {/* Felt effect overlay */}
                <AnimatePresence>
                  {showFelt && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <FeltEffect x={0} y={0} />
                    </div>
                  )}
                </AnimatePresence>

                {/* Felt count badge */}
                <div className={`absolute bottom-3 right-3 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1.5 ${sparked ? "bg-primary/20" : "bg-background/80"}`}>
                  <span className="text-primary text-sm">✦</span>
                  <span className="text-xs font-medium text-foreground">{data.topDrop.felt_count}</span>
                </div>

                {/* Tap to spark hint */}
                {!sparked && (
                  <div className="absolute bottom-3 left-3 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-[10px] text-muted-foreground">tap to spark</span>
                  </div>
                )}
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
