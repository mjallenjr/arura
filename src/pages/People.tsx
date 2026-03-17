import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAds, type Ad } from "@/hooks/useAds";
import QRCode from "@/components/QRCode";
import QRScanner from "@/components/QRScanner";
import EmberProfile from "@/components/EmberProfile";

type Tab = "search" | "qr" | "scan";

const EMBER_FOUNDER_ID = "52c9cc57-3d25-4722-b0a9-1dac99e79354";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const INTEREST_TAGS = [
  "music", "photography", "travel", "fitness", "art", "fashion",
  "coffee", "nature", "gaming", "cooking", "surfing", "meditation",
  "film", "dancing", "tattoos", "painting", "running", "tech",
  "hiking", "yoga", "poetry", "reading", "skateboarding", "design",
  "sunsets", "camping", "astronomy", "vinyl", "plants", "baking",
];

interface ProfileResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  qr_code: string | null;
  isFollowing: boolean;
  interests?: string[];
}

type AnimatingId = { id: string; type: "ignite" | "extinguish" };

const People = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchTargetedAd } = useAds();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [myQr, setMyQr] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [animating, setAnimating] = useState<AnimatingId | null>(null);
  const [suggested, setSuggested] = useState<ProfileResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [interestResults, setInterestResults] = useState<ProfileResult[]>([]);
  const [loadingInterest, setLoadingInterest] = useState(false);
  const [suggestedPage, setSuggestedPage] = useState(0);
  const [allSuggestions, setAllSuggestions] = useState<ProfileResult[]>([]);
  const SUGGESTIONS_PER_PAGE = 6;
  const refreshCountRef = useRef(0);
  const [selectedEmberId, setSelectedEmberId] = useState<string | null>(null);
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);

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
        .from("public_profiles")
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

        const shuffled = candidateIds.sort(() => Math.random() - 0.5);

        if (shuffled.length > 0) {
          const { data: profiles } = await supabase
            .from("public_profiles")
            .select("user_id, display_name, avatar_url, qr_code")
            .in("user_id", shuffled.slice(0, 20));

          if (profiles) {
            suggestionList = profiles.sort(() => Math.random() - 0.5).map((p) => ({ ...p, isFollowing: false }));
          }
        }
      }
    }

    // Also fetch random embers not yet following
    const { data: randomEmbers } = await supabase
      .from("public_profiles")
      .select("user_id, display_name, avatar_url, qr_code")
      .neq("user_id", user.id)
      .neq("user_id", EMBER_FOUNDER_ID)
      .limit(30);

    if (randomEmbers) {
      const existingIds = new Set(suggestionList.map(s => s.user_id));
      const additional = randomEmbers
        .filter(p => !existingIds.has(p.user_id) && !myFollowingIds.has(p.user_id))
        .sort(() => Math.random() - 0.5)
        .slice(0, 20 - suggestionList.length)
        .map(p => ({ ...p, isFollowing: false }));
      suggestionList.push(...additional);
    }

    if (founderProfile) suggestionList.unshift(founderProfile);
    setAllSuggestions(suggestionList);
    setSuggestedPage(0);
    setSuggested(suggestionList.slice(0, SUGGESTIONS_PER_PAGE));
  }, [user, followingIds]);

  const loadMoreSuggestions = useCallback(() => {
    const nextPage = suggestedPage + 1;
    const start = nextPage * SUGGESTIONS_PER_PAGE;
    const nextBatch = allSuggestions.slice(start, start + SUGGESTIONS_PER_PAGE);
    if (nextBatch.length > 0) {
      setSuggested(prev => [...prev, ...nextBatch]);
      setSuggestedPage(nextPage);
    }
  }, [suggestedPage, allSuggestions]);

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
    refreshCountRef.current += 1;

    // Show ad every 4th refresh, auto-dismiss after 3.7s
    if (refreshCountRef.current % 4 === 0 && user) {
      const ad = await fetchTargetedAd(user.id, "embers");
      setCurrentAd(ad);
      if (ad) setTimeout(() => setCurrentAd(null), 3700);
    } else {
      setCurrentAd(null);
    }

    await loadSuggestions();
    setRefreshing(false);
  }, [loadSuggestions, fetchTargetedAd, user]);

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

  // Search by interest
  const searchByInterest = useCallback(async (interest: string) => {
    if (!user) return;
    setLoadingInterest(true);
    setSelectedInterest(interest);

    const { data } = await supabase
      .from("public_profiles")
      .select("user_id, display_name, avatar_url, qr_code, interests")
      .contains("interests", [interest])
      .neq("user_id", user.id)
      .limit(20);

    if (data) {
      setInterestResults(
        data.map((p) => ({
          ...p,
          interests: (p as any).interests ?? [],
          isFollowing: followingIds.has(p.user_id),
        }))
      );
    }
    setLoadingInterest(false);
  }, [user, followingIds]);

  const search = useCallback(async () => {
    if (!query.trim() || !user) return;

    // Search by name/phone AND by interest in parallel
    const q = query.trim();
    const [nameRes, interestRes] = await Promise.all([
      supabase
        .from("public_profiles")
        .select("user_id, display_name, avatar_url, qr_code, interests")
        .ilike("display_name", `%${q}%`)
        .neq("user_id", user.id)
        .limit(20),
      supabase
        .from("public_profiles")
        .select("user_id, display_name, avatar_url, qr_code, interests")
        .contains("interests", [q.toLowerCase()])
        .neq("user_id", user.id)
        .limit(20),
    ]);

    // Merge and deduplicate
    const seen = new Set<string>();
    const merged: ProfileResult[] = [];
    for (const p of [...(nameRes.data ?? []), ...(interestRes.data ?? [])]) {
      if (seen.has(p.user_id)) continue;
      seen.add(p.user_id);
      merged.push({
        ...p,
        interests: (p as any).interests ?? [],
        isFollowing: followingIds.has(p.user_id),
      });
    }
    setResults(merged);
  }, [query, user, followingIds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length >= 2) {
        search();
        setSelectedInterest(null);
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const toggleFollow = useCallback(
    async (targetUserId: string) => {
      if (!user) return;
      const isUnfollow = followingIds.has(targetUserId);

      setAnimating({ id: targetUserId, type: isUnfollow ? "extinguish" : "ignite" });

      if (isUnfollow) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        setTimeout(() => {
          setFollowingIds((prev) => {
            const next = new Set(prev);
            next.delete(targetUserId);
            return next;
          });
          const updateFollow = (list: ProfileResult[]) =>
            list.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: false } : r));
          setResults(updateFollow);
          setInterestResults(updateFollow);
          setAnimating(null);
        }, 900);
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        setFollowingIds((prev) => new Set(prev).add(targetUserId));
        const updateFollow = (list: ProfileResult[]) =>
          list.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: true } : r));
        setResults(updateFollow);
        setInterestResults(updateFollow);
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
        .from("public_profiles")
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

  // Shared ember row renderer
  const renderEmberRow = (person: ProfileResult, showInterests = false) => {
    const isIgniting = animating?.id === person.user_id && animating.type === "ignite";
    const isExtinguishing = animating?.id === person.user_id && animating.type === "extinguish";

    return (
      <motion.div
        key={person.user_id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between signal-surface rounded-xl p-3 relative overflow-hidden"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => setSelectedEmberId(person.user_id)}>
          <div className={`h-10 w-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center overflow-hidden ${person.user_id === EMBER_FOUNDER_ID ? 'animate-ember-glow' : ''}`}>
            {person.avatar_url ? (
              <img src={person.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-secondary-foreground">
                {person.display_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="relative flex-1 min-w-0">
            <motion.p
              className="text-sm font-medium truncate"
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
            {showInterests && person.interests && person.interests.length > 0 && (
              <div className="flex gap-1 mt-0.5 flex-wrap">
                {person.interests.slice(0, 3).map(tag => (
                  <span key={tag} className="text-[9px] text-primary/70 bg-primary/10 rounded-full px-1.5 py-0.5">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <AnimatePresence>
              {isIgniting && (
                <motion.div
                  className="absolute -inset-3 rounded-full pointer-events-none"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 0.8, 0.4, 0], scale: [0.5, 1.4, 1.8, 2.2] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  style={{
                    background: "radial-gradient(circle, hsla(30,100%,60%,0.6) 0%, hsla(15,100%,50%,0.3) 40%, transparent 70%)",
                    filter: "blur(6px)",
                  }}
                />
              )}
            </AnimatePresence>

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
          className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease flex-shrink-0 ml-2 ${
            person.isFollowing
              ? "bg-destructive/10 text-destructive"
              : "bg-primary text-primary-foreground"
          }`}
        >
          {person.isFollowing ? "Extinguish" : "Ignite"}
        </motion.button>
      </motion.div>
    );
  };

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
            {t === "search" ? "Wonder" : t === "qr" ? "My QR" : "Scan"}
          </button>
        ))}
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 pb-8"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
        <motion.div
          className="flex items-center justify-center overflow-hidden"
          animate={{ height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 48 : 0) : 0 }}
          transition={{ duration: pullDistance > 0 ? 0 : 0.3 }}
        >
          <motion.div
            animate={refreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
            transition={refreshing ? { repeat: Infinity, duration: 0.8, ease: "linear" } : { duration: 0 }}
            className="flex flex-col items-center gap-1"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <path d="M1 4v6h6M23 20v-6h-6" />
              <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
            </svg>
            <span className="text-[10px] text-muted-foreground">
              {refreshing ? "refreshing..." : pullDistance >= PULL_THRESHOLD ? "release to refresh" : "pull to refresh"}
            </span>
          </motion.div>
        </motion.div>

        <AnimatePresence mode="wait">
          {tab === "search" && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
            >
              {/* Search input */}
              <input
                type="text"
                placeholder="Roam Your World…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30 mb-4"
              />

              {/* Interest tags */}
              {query.length < 2 && (
                <div className="mb-5">
                  <p className="label-signal mb-2">search by interest</p>
                  <div className="flex flex-wrap gap-1.5">
                    {INTEREST_TAGS.slice(0, 15).map(tag => (
                      <motion.button
                        key={tag}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => selectedInterest === tag ? setSelectedInterest(null) : searchByInterest(tag)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-medium signal-ease ${
                          selectedInterest === tag
                            ? "bg-primary text-primary-foreground"
                            : "signal-surface text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tag}
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interest search results */}
              {selectedInterest && query.length < 2 && (
                <div className="mb-5">
                  <p className="label-signal mb-3">
                    embers into <span className="text-primary">{selectedInterest}</span>
                  </p>
                  {loadingInterest ? (
                    <div className="flex justify-center py-6">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full"
                      />
                    </div>
                  ) : interestResults.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {interestResults.map((p) => renderEmberRow(p, true))}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No embers found with this interest yet
                    </p>
                  )}
                </div>
              )}

              {/* Search results */}
              {query.length >= 2 && (
                <div className="flex flex-col gap-2 mb-5">
                  {results.map((p) => renderEmberRow(p, true))}
                  {results.length === 0 && (
                    <p className="text-center text-xs text-muted-foreground py-8">
                      No one found. Try a different name.
                    </p>
                  )}
                </div>
              )}

              {/* Ad card from refresh */}
              {query.length < 2 && !selectedInterest && currentAd && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={signalTransition}
                  className="mb-4 rounded-2xl overflow-hidden relative"
                >
                  <img src={currentAd.media_url} alt="" className="w-full h-44 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <span className="text-[9px] font-medium text-muted-foreground/50 uppercase tracking-widest">sponsored</span>
                    <p className="text-sm font-bold text-foreground mt-1" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                      {currentAd.headline}
                    </p>
                    {currentAd.description && (
                      <p className="text-[11px] text-foreground/70 mt-0.5">{currentAd.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-muted-foreground/60">{currentAd.company_name}</span>
                      {currentAd.cta_url && (
                        <a
                          href={currentAd.cta_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full bg-primary px-3 py-1 text-[10px] font-medium text-primary-foreground"
                        >
                          {currentAd.cta_text || "Learn More"}
                        </a>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setCurrentAd(null)}
                    className="absolute top-2 right-2 h-6 w-6 rounded-full bg-background/60 flex items-center justify-center text-muted-foreground text-xs"
                  >
                    ✕
                  </button>
                </motion.div>
              )}

              {/* Suggested Embers - vertical list */}
              {query.length < 2 && !selectedInterest && suggested.length > 0 && (
                <div className="mb-4">
                  <p className="label-signal mb-3">embers you may know</p>
                  <div className="flex flex-col gap-2">
                    {suggested.map((ember) => renderEmberRow(ember, false))}
                  </div>

                  {/* Load more */}
                  {suggested.length < allSuggestions.length && (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={loadMoreSuggestions}
                      className="w-full mt-3 rounded-xl signal-surface py-3 text-xs font-medium text-muted-foreground hover:text-foreground signal-ease"
                    >
                      show more embers
                    </motion.button>
                  )}
                </div>
              )}
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

      {/* Ember profile overlay */}
      <AnimatePresence>
        {selectedEmberId && (
          <EmberProfile userId={selectedEmberId} onClose={() => setSelectedEmberId(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default People;
