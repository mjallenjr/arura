import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import EmberProfile from "@/components/EmberProfile";
import { useHaptics } from "@/hooks/useHaptics";
import { VIBE_CATEGORIES, FEATURED_VIBES, searchVibes } from "@/lib/vibes";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface TrendingDrop {
  id: string;
  user_id: string;
  type: string;
  storage_path: string | null;
  stitch_word: string | null;
  created_at: string;
  media_url: string | null;
  display_name: string;
  stitch_count: number;
  felt_count: number;
}

interface SuggestedEmber {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  interests: string[];
  mutual_count: number;
}

type DiscoverTab = "trending" | "interests" | "embers";

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<DiscoverTab>("trending");
  const [trendingDrops, setTrendingDrops] = useState<TrendingDrop[]>([]);
  const [suggestedEmbers, setSuggestedEmbers] = useState<SuggestedEmber[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [interestEmbers, setInterestEmbers] = useState<SuggestedEmber[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmberId, setSelectedEmberId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const { vibrate } = useHaptics();
  const [vibeQuery, setVibeQuery] = useState("");
  const [vibeSearchResults, setVibeSearchResults] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Pull-to-refresh state
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const [pullDistance, setPullDistance] = useState(0);
  const isPulling = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  const PULL_THRESHOLD = 80;

  // Pull-to-refresh handlers defined after data loaders

  // Load following list
  useEffect(() => {
    if (!user) return;
    supabase.from("follows").select("following_id").eq("follower_id", user.id).then(({ data }) => {
      setFollowingIds(new Set(data?.map((f) => f.following_id) ?? []));
    });
  }, [user]);

  // Load trending drops (most stitched/felted active drops)
  const loadTrending = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get active signals (RLS now allows all active signals for discovery)
    const { data: signals } = await supabase
      .from("signals")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .neq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!signals || signals.length === 0) {
      setTrendingDrops([]);
      setLoading(false);
      return;
    }

    // Get author names
    const authorIds = [...new Set(signals.map((s) => s.user_id))];
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("user_id, display_name")
      .in("user_id", authorIds);
    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

    const trending: TrendingDrop[] = signals
      .map((s) => {
        let media_url: string | null = null;
        if (s.storage_path) {
          const { data } = supabase.storage.from("signals").getPublicUrl(s.storage_path);
          media_url = data.publicUrl;
        }
        return {
          ...s,
          media_url,
          display_name: nameMap.get(s.user_id) ?? "unknown",
          stitch_count: 0,
          felt_count: 0,
        };
      })
      .slice(0, 20);

    setTrendingDrops(trending);
    setLoading(false);
  }, [user]);

  // Load suggested embers (interest-based matching)
  const loadSuggestedEmbers = useCallback(async () => {
    if (!user) return;

    // Get my interests
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("interests")
      .eq("user_id", user.id)
      .single();

    const myInterests = myProfile?.interests ?? [];

    // Get all profiles with interests, not already following
    const { data: allProfiles } = await supabase
      .from("public_profiles")
      .select("user_id, display_name, avatar_url, interests")
      .neq("user_id", user.id)
      .limit(100);

    if (!allProfiles) return;

    // Get my follows
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const followSet = new Set(follows?.map((f) => f.following_id) ?? []);

    // Score by shared interests
    const scored: SuggestedEmber[] = allProfiles
      .filter((p) => !followSet.has(p.user_id))
      .map((p) => {
        const theirInterests = p.interests ?? [];
        const mutual = myInterests.filter((i: string) => theirInterests.includes(i));
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          interests: theirInterests,
          mutual_count: mutual.length,
        };
      })
      .filter((p) => p.mutual_count > 0 || p.interests.length > 0)
      .sort((a, b) => b.mutual_count - a.mutual_count)
      .slice(0, 20);

    setSuggestedEmbers(scored);
  }, [user]);


  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    vibrate(20);
    if (tab === "trending") await loadTrending();
    else if (tab === "embers") await loadSuggestedEmbers();
    setRefreshing(false);
  }, [tab, vibrate, loadTrending, loadSuggestedEmbers]);

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
    if (delta > 0) setPullDistance(Math.min(delta * 0.5, 120));
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

  // Search by interest
  const searchByInterest = useCallback(async (interest: string) => {
    if (!user) return;
    setSelectedInterest(interest);

    const { data } = await supabase
      .from("public_profiles")
      .select("user_id, display_name, avatar_url, interests")
      .contains("interests", [interest])
      .neq("user_id", user.id)
      .limit(30);

    if (data) {
      setInterestEmbers(
        data.map((p) => ({
          user_id: p.user_id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
          interests: p.interests ?? [],
          mutual_count: 0,
        }))
      );
    }
  }, [user]);

  useEffect(() => {
    loadTrending();
    loadSuggestedEmbers();
  }, [loadTrending, loadSuggestedEmbers]);

  const toggleFollow = useCallback(async (targetId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(targetId);

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", targetId);
      setFollowingIds((prev) => { const n = new Set(prev); n.delete(targetId); return n; });
    } else {
      await supabase.from("follows").insert({ follower_id: user.id, following_id: targetId });
      setFollowingIds((prev) => new Set(prev).add(targetId));
    }
  }, [user, followingIds]);

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">wonder</p>
        <div className="w-5" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {(["trending", "interests", "embers"] as DiscoverTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-full py-2 text-xs font-medium signal-ease ${
              tab === t ? "bg-primary text-primary-foreground" : "signal-surface text-muted-foreground"
            }`}
          >
            {t === "trending" ? (
              <span className="inline-flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 32 32" fill="none" className={tab === t ? "text-primary-foreground" : "text-primary"}>
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.4" />
                  <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  {tab === t && <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="hsl(var(--foreground) / 0.7)" strokeWidth="2.5" fill="none" />}
                </svg>
                Hot
              </span>
            ) : t === "interests" ? "✦ Vibes" : "👤 For You"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-32"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <AnimatePresence>
          {pullDistance > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-2"
            >
              <motion.svg
                width="20" height="20" viewBox="0 0 32 32" fill="none"
                className="text-primary"
                animate={{ rotate: pullDistance >= PULL_THRESHOLD ? 360 : 0, scale: pullDistance >= PULL_THRESHOLD ? 1.2 : 0.8 }}
                transition={{ type: "spring", bounce: 0.3 }}
              >
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.4" />
                <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </motion.svg>
            </motion.div>
          )}
        </AnimatePresence>
        {refreshing && (
          <div className="flex justify-center py-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
            />
          </div>
        )}
        <AnimatePresence mode="wait">
          {tab === "trending" && (
            <motion.div
              key="trending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              {loading ? (
                <div className="flex justify-center py-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : trendingDrops.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4">
                  <motion.svg
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [0.8, 1.1, 1] }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    width="48" height="48" viewBox="0 0 32 32" fill="none" className="text-primary"
                  >
                    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
                    <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
                  </motion.svg>
                  <p className="text-sm font-medium text-foreground">No drops yet — be the first 🔥</p>
                  <p className="text-xs text-muted-foreground text-center px-8">Things heat up fast. Drop a signal and watch it spread.</p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/")}
                    className="rounded-2xl bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow mt-2"
                  >
                    Drop something warm
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {trendingDrops.map((drop, i) => (
                    <motion.div
                      key={drop.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...signalTransition, delay: i * 0.04 }}
                      className="relative aspect-[3/4] rounded-2xl overflow-hidden signal-surface cursor-pointer"
                      onClick={() => setSelectedEmberId(drop.user_id)}
                    >
                      {drop.media_url ? (
                        <img src={drop.media_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-muted to-secondary" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        {drop.stitch_word && (
                          <p className="text-sm font-bold text-primary italic mb-1">"{drop.stitch_word}"</p>
                        )}
                        <p className="text-[10px] text-foreground/80 font-medium truncate">{drop.display_name}</p>
                        <div className="flex gap-2 mt-1">
                          {drop.stitch_count > 0 && (
                            <span className="text-[9px] text-primary/70">✦ {drop.stitch_count}</span>
                          )}
                          {drop.felt_count > 0 && (
                            <span className="text-[9px] text-muted-foreground">♡ {drop.felt_count}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {tab === "interests" && (
            <motion.div
              key="interests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              {/* Search input */}
              <div className="signal-surface rounded-xl px-4 py-2.5 mb-4">
                <input
                  type="text"
                  placeholder="500+ Hazy Vibes..."
                  value={vibeQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setVibeQuery(q);
                    setVibeSearchResults(q.length >= 2 ? searchVibes(q, 30) : []);
                  }}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              {/* Search results */}
              {vibeQuery.length >= 2 && (
                <div className="mb-4">
                  <p className="label-signal mb-2">{vibeSearchResults.length} results</p>
                  <div className="flex flex-wrap gap-1.5">
                    {vibeSearchResults.map((tag) => (
                      <motion.button
                        key={tag}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { searchByInterest(tag); setVibeQuery(""); setVibeSearchResults([]); }}
                        className={`rounded-full px-3.5 py-2 text-xs font-medium signal-ease ${
                          selectedInterest === tag
                            ? "bg-primary text-primary-foreground"
                            : "signal-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </motion.button>
                    ))}
                    {vibeSearchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">No vibes match "{vibeQuery}"</p>
                    )}
                  </div>
                </div>
              )}

              {/* Featured vibes (when not searching) */}
              {vibeQuery.length < 2 && !selectedInterest && (
                <>
                  <p className="label-signal mb-2">Vibrant Vibes</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {FEATURED_VIBES.map((tag) => (
                      <motion.button
                        key={tag}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => searchByInterest(tag)}
                        className="rounded-full px-3.5 py-2 text-xs font-medium signal-surface text-muted-foreground hover:text-foreground signal-ease"
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>

                  {/* Browse by category */}
                  <p className="label-signal mb-2">Drift Flares</p>
                  <div className="flex flex-col gap-1.5">
                    {Object.entries(VIBE_CATEGORIES).map(([category, vibes]) => (
                      <div key={category}>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                          className="w-full flex items-center justify-between signal-surface rounded-xl px-4 py-3 text-left"
                        >
                          <span className="text-xs font-medium text-foreground">{category}</span>
                          <span className="text-[10px] text-muted-foreground">{vibes.length} vibes</span>
                        </motion.button>
                        <AnimatePresence>
                          {expandedCategory === category && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-wrap gap-1.5 px-2 py-2">
                                {vibes.map((tag) => (
                                  <motion.button
                                    key={tag}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => searchByInterest(tag)}
                                    className={`rounded-full px-3 py-1.5 text-[11px] font-medium signal-ease ${
                                      selectedInterest === tag
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-secondary text-secondary-foreground hover:text-foreground"
                                    }`}
                                  >
                                    {tag}
                                  </motion.button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Selected interest results */}
              {selectedInterest && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="label-signal">
                      embers into <span className="text-primary">{selectedInterest}</span>
                    </p>
                    <button onClick={() => setSelectedInterest(null)} className="text-[10px] text-muted-foreground">clear</button>
                  </div>
                  {interestEmbers.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {interestEmbers.map((ember) => (
                        <motion.div
                          key={ember.user_id}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between signal-surface rounded-xl p-3"
                        >
                          <div
                            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                            onClick={() => setSelectedEmberId(ember.user_id)}
                          >
                            <div className="h-10 w-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                              {ember.avatar_url ? (
                                <img src={ember.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs font-medium text-secondary-foreground">
                                  {ember.display_name.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{ember.display_name}</p>
                              <div className="flex gap-1 mt-0.5 flex-wrap">
                                {ember.interests.slice(0, 3).map((tag) => (
                                  <span key={tag} className="text-[9px] text-primary/70 bg-primary/10 rounded-full px-1.5 py-0.5">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => toggleFollow(ember.user_id)}
                            className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease flex-shrink-0 ml-2 ${
                              followingIds.has(ember.user_id)
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary text-primary-foreground"
                            }`}
                          >
                            {followingIds.has(ember.user_id) ? "Extinguish" : "Ignite"}
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-6">No embers found with this vibe yet</p>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {tab === "embers" && (
            <motion.div
              key="embers"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              <p className="label-signal mb-3">matched by your interests</p>
              {suggestedEmbers.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {suggestedEmbers.map((ember, i) => (
                    <motion.div
                      key={ember.user_id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ ...signalTransition, delay: i * 0.03 }}
                      className="flex items-center justify-between signal-surface rounded-xl p-3"
                    >
                      <div
                        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                        onClick={() => setSelectedEmberId(ember.user_id)}
                      >
                        <div className="h-10 w-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {ember.avatar_url ? (
                            <img src={ember.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-secondary-foreground">
                              {ember.display_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{ember.display_name}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {ember.interests.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-[9px] text-primary/70 bg-primary/10 rounded-full px-1.5 py-0.5">
                                {tag}
                              </span>
                            ))}
                            {ember.mutual_count > 0 && (
                              <span className="text-[9px] text-accent bg-accent/10 rounded-full px-1.5 py-0.5">
                                {ember.mutual_count} shared
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleFollow(ember.user_id)}
                        className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease flex-shrink-0 ml-2 ${
                          followingIds.has(ember.user_id)
                            ? "bg-destructive/10 text-destructive"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {followingIds.has(ember.user_id) ? "Extinguish" : "Ignite"}
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-sm text-muted-foreground">Add interests to your profile to get matched</p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/profile")}
                    className="mt-4 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground"
                  >
                    Set interests
                  </motion.button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ember profile overlay */}
      <AnimatePresence>
        {selectedEmberId && (
          <EmberProfile userId={selectedEmberId} onClose={() => setSelectedEmberId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Discover;
