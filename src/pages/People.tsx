import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import QRCode from "@/components/QRCode";
import QRScanner from "@/components/QRScanner";

type Tab = "search" | "qr" | "scan";

const EMBER_FOUNDER_ID = "52c9cc57-3d25-4722-b0a9-1dac99e79354";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface ProfileResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  qr_code: string | null;
  isFollowing: boolean;
}

type AnimatingId = { id: string; type: "ignite" | "extinguish" };

const People = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [myQr, setMyQr] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState<AnimatingId | null>(null);
  const [suggested, setSuggested] = useState<ProfileResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const isPulling = useRef(false);
  const PULL_THRESHOLD = 80;

  const loadSuggestions = useCallback(async (currentFollowingIds?: Set<string>) => {
    if (!user) return;
    const myFollowingIds = currentFollowingIds ?? followingIds;

    // Always suggest the founder "Ember" if not already following and not self
    let founderProfile: ProfileResult | null = null;
    if (user.id !== EMBER_FOUNDER_ID && !myFollowingIds.has(EMBER_FOUNDER_ID)) {
      const { data: fp } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, qr_code")
        .eq("user_id", EMBER_FOUNDER_ID)
        .single();
      if (fp) founderProfile = { ...fp, isFollowing: false };
    }

    let suggestionList: ProfileResult[] = [];
    if (myFollowingIds.size > 0) {
      const { data: fof } = await supabase
        .from("follows")
        .select("following_id")
        .in("follower_id", [...myFollowingIds])
        .limit(100);

      if (fof) {
        const candidateIds = [...new Set(fof.map((f) => f.following_id))]
          .filter((id) => id !== user.id && id !== EMBER_FOUNDER_ID && !myFollowingIds.has(id));

        // Shuffle candidates for variety on refresh
        const shuffled = candidateIds.sort(() => Math.random() - 0.5);

        if (shuffled.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, qr_code")
            .in("user_id", shuffled.slice(0, 10));

          if (profiles) {
            suggestionList = profiles.sort(() => Math.random() - 0.5).map((p) => ({ ...p, isFollowing: false }));
          }
        }
      }
    } else {
      const { data: randomEmbers } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url, qr_code")
        .neq("user_id", user.id)
        .neq("user_id", EMBER_FOUNDER_ID)
        .limit(20);
      if (randomEmbers) {
        suggestionList = randomEmbers.sort(() => Math.random() - 0.5).slice(0, 10).map((p) => ({ ...p, isFollowing: false }));
      }
    }

    if (founderProfile) suggestionList.unshift(founderProfile);
    setSuggested(suggestionList);
  }, [user, followingIds]);

  // Load my QR code, following list, and suggested embers
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [profileRes, followsRes] = await Promise.all([
        supabase.from("profiles").select("qr_code").eq("user_id", user.id).single(),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);

      if (profileRes.data) setMyQr(profileRes.data.qr_code);
      const myFollowingIds = new Set(followsRes.data?.map((f) => f.following_id) ?? []);
      setFollowingIds(myFollowingIds);
      await loadSuggestions(myFollowingIds);
    };
    loadData();
  }, [user]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSuggestions();
    setRefreshing(false);
  }, [loadSuggestions]);

  // Pull-to-refresh touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (el && el.scrollTop <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || refreshing) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) {
      setPullDistance(Math.min(delta * 0.5, 120));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(() => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= PULL_THRESHOLD && !refreshing) {
      handleRefresh().finally(() => setPullDistance(0));
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, refreshing, handleRefresh]);

  const search = useCallback(async () => {
    if (!query.trim() || !user) return;

    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, qr_code")
      .or(`display_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .neq("user_id", user.id)
      .limit(20);

    if (data) {
      setResults(
        data.map((p) => ({
          ...p,
          isFollowing: followingIds.has(p.user_id),
        }))
      );
    }
  }, [query, user, followingIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) search();
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!user) return;
      const isUnfollow = followingIds.has(targetUserId);

      // Start animation
      setAnimating({ id: targetUserId, type: isUnfollow ? "extinguish" : "ignite" });

      if (isUnfollow) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        // Wait for extinguish animation before updating state
        setTimeout(() => {
          setFollowingIds((prev) => {
            const next = new Set(prev);
            next.delete(targetUserId);
            return next;
          });
          setResults((prev) =>
            prev.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: false } : r))
          );
          setAnimating(null);
        }, 900);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        setFollowingIds((prev) => new Set(prev).add(targetUserId));
        setResults((prev) =>
          prev.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: true } : r))
        );
        toast.success("Ignited 🔥");
        setTimeout(() => setAnimating(null), 1200);
      }
    },
    [user, followingIds]
  );

  const handleQrScan = useCallback(
    async (qrCode: string) => {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .eq("qr_code", qrCode)
        .neq("user_id", user.id)
        .single();

      if (data) {
        await supabase
          .from("follows")
          .upsert({ follower_id: user.id, following_id: data.user_id });
        setFollowingIds((prev) => new Set(prev).add(data.user_id));
        toast.success(`Ignited ${data.display_name} 🔥`);
        setTab("search");
      } else {
        toast.error("User not found");
      }
    },
    [user]
  );

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">embers</p>
        <div className="w-5" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {(["search", "qr", "scan"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs font-medium signal-ease ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "signal-surface text-muted-foreground"
            }`}
          >
            {t === "search" ? "Search" : t === "qr" ? "My QR" : "Scan"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <AnimatePresence mode="wait">
          {tab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              <input
                type="text"
                placeholder="Search by name, phone, or email..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 mb-4"
              />

              {/* Suggested Embers */}
              {query.length < 2 && suggested.length > 0 && (
                <div className="mb-4">
                  <p className="label-signal mb-3">embers you may know</p>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
                    {suggested.map((ember) => {
                      const isIgniting = animating?.id === ember.user_id && animating.type === "ignite";
                      return (
                        <motion.div
                          key={ember.user_id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-2 min-w-[80px] signal-surface rounded-xl p-3 relative"
                        >
                          <div className="relative">
                            <div className={`h-12 w-12 rounded-full bg-secondary flex items-center justify-center overflow-hidden ${ember.user_id === EMBER_FOUNDER_ID ? 'animate-ember-glow' : ''}`}>
                              {ember.avatar_url ? (
                                <img src={ember.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-sm font-medium text-secondary-foreground">
                                  {ember.display_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <AnimatePresence>
                              {isIgniting && (
                                <motion.div
                                  className="absolute -inset-2 rounded-full pointer-events-none"
                                  initial={{ opacity: 0, scale: 0.5 }}
                                  animate={{ opacity: [0, 0.8, 0], scale: [0.5, 1.6, 2] }}
                                  exit={{ opacity: 0 }}
                                  transition={{ duration: 1.2, ease: "easeOut" }}
                                  style={{
                                    background: "radial-gradient(circle, hsla(30,100%,60%,0.5) 0%, transparent 70%)",
                                    filter: "blur(4px)",
                                  }}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                          <p className="text-[10px] font-medium text-foreground text-center truncate w-full">
                            {ember.display_name}
                          </p>
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => toggleFollow(ember.user_id)}
                            disabled={!!animating}
                            className="rounded-full bg-primary text-primary-foreground px-3 py-1 text-[10px] font-medium"
                          >
                            Ignite
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Search results */}
              <div className="flex flex-col gap-2">
                {results.map((person) => {
                  const isIgniting = animating?.id === person.user_id && animating.type === "ignite";
                  const isExtinguishing = animating?.id === person.user_id && animating.type === "extinguish";

                  return (
                    <motion.div
                      key={person.user_id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between signal-surface rounded-xl p-3 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden ${person.user_id === EMBER_FOUNDER_ID ? 'animate-ember-glow' : ''}`}>
                          {person.avatar_url ? (
                            <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-secondary-foreground">
                              {person.display_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          <motion.p
                            className="text-sm font-medium"
                            animate={
                              isIgniting
                                ? { color: ["hsl(var(--foreground))", "hsl(30 100% 60%)", "hsl(var(--foreground))"] }
                                : isExtinguishing
                                ? { color: ["hsl(var(--foreground))", "hsl(0 0% 50%)", "hsl(0 0% 35%)"], opacity: [1, 0.6, 1] }
                                : { color: "hsl(var(--foreground))" }
                            }
                            transition={{ duration: isIgniting ? 1.2 : 0.9, ease: "easeInOut" }}
                          >
                            {isExtinguishing ? "ashes..." : person.display_name}
                          </motion.p>

                          {/* Ignite glow */}
                          <AnimatePresence>
                            {isIgniting && (
                              <motion.div
                                className="absolute -inset-3 rounded-full pointer-events-none"
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{
                                  opacity: [0, 0.8, 0.4, 0],
                                  scale: [0.5, 1.4, 1.8, 2.2],
                                }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, ease: "easeOut" }}
                                style={{
                                  background: "radial-gradient(circle, hsla(30,100%,60%,0.6) 0%, hsla(15,100%,50%,0.3) 40%, transparent 70%)",
                                  filter: "blur(6px)",
                                }}
                              />
                            )}
                          </AnimatePresence>

                          {/* Extinguish ash particles */}
                          <AnimatePresence>
                            {isExtinguishing && (
                              <>
                                {[...Array(6)].map((_, i) => (
                                  <motion.span
                                    key={i}
                                    className="absolute text-[8px] pointer-events-none"
                                    initial={{ opacity: 1, x: 0, y: 0 }}
                                    animate={{
                                      opacity: [1, 0.6, 0],
                                      x: (i % 2 === 0 ? 1 : -1) * (8 + i * 4),
                                      y: -(6 + i * 5),
                                    }}
                                    transition={{ duration: 0.8, delay: i * 0.05, ease: "easeOut" }}
                                    style={{ left: `${20 + i * 12}%`, top: "0%" }}
                                  >
                                    ░
                                  </motion.span>
                                ))}
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleFollow(person.user_id)}
                        disabled={!!animating}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease ${
                          person.isFollowing
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {person.isFollowing ? "Extinguish" : "Ignite"}
                      </motion.button>
                    </motion.div>
                  );
                })}

                {query.length >= 2 && results.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-8">
                    No one found. Try a different name.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {tab === "qr" && (
            <motion.div
              key="qr"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
              className="flex flex-col items-center gap-6 pt-8"
            >
              <p className="text-sm text-muted-foreground">Share to connect</p>
              {myQr && <QRCode value={myQr} />}
              <p className="text-xs text-muted-foreground">
                Others can scan this to follow you
              </p>
            </motion.div>
          )}

          {tab === "scan" && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              <QRScanner onScan={handleQrScan} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default People;
