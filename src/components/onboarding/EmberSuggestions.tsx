import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };
const EMBER_FOUNDER_ID = "52c9cc57-3d25-4722-b0a9-1dac99e79354";
const MIN_IGNITES = 3;

interface EmberSuggestion {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  interests?: string[];
}

interface EmberSuggestionsProps {
  userId: string;
  userInterests: string[];
  onComplete: () => void;
}

const EmberSuggestions = ({ userId, userInterests, onComplete }: EmberSuggestionsProps) => {
  const [suggestions, setSuggestions] = useState<EmberSuggestion[]>([]);
  const [ignited, setIgnited] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  useEffect(() => {
    const loadSuggestions = async () => {
      setLoading(true);
      const results: EmberSuggestion[] = [];

      // 1. Always suggest founder
      if (userId !== EMBER_FOUNDER_ID) {
        const { data: founder } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url, interests")
          .eq("user_id", EMBER_FOUNDER_ID)
          .single();
        if (founder) results.push(founder as EmberSuggestion);
      }

      // 2. Interest-based suggestions
      if (userInterests.length > 0) {
        const { data: interestEmbers } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url, interests")
          .neq("user_id", userId)
          .neq("user_id", EMBER_FOUNDER_ID)
          .overlaps("interests", userInterests)
          .limit(20);

        if (interestEmbers) {
          // Sort by shared interest count
          const scored = interestEmbers
            .map((e) => ({
              ...e,
              sharedCount: ((e.interests as string[]) || []).filter((i: string) =>
                userInterests.includes(i)
              ).length,
            }))
            .sort((a, b) => b.sharedCount - a.sharedCount);
          results.push(...scored.filter((e) => !results.some((r) => r.user_id === e.user_id)));
        }
      }

      // 3. Fill with random embers if needed
      if (results.length < 12) {
        const { data: randomEmbers } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url, interests")
          .neq("user_id", userId)
          .neq("user_id", EMBER_FOUNDER_ID)
          .limit(30);

        if (randomEmbers) {
          const existing = new Set(results.map((r) => r.user_id));
          const additional = randomEmbers
            .filter((e) => !existing.has(e.user_id))
            .sort(() => Math.random() - 0.5)
            .slice(0, 12 - results.length);
          results.push(...(additional as EmberSuggestion[]));
        }
      }

      setSuggestions(results.slice(0, 15));
      setLoading(false);
    };
    loadSuggestions();
  }, [userId, userInterests]);

  const handleIgnite = useCallback(
    async (emberId: string) => {
      if (ignited.has(emberId)) return;
      setAnimatingId(emberId);

      const { error } = await supabase.from("follows").insert({
        follower_id: userId,
        following_id: emberId,
      });

      if (!error) {
        setIgnited((prev) => new Set(prev).add(emberId));

        // Send follow notification
        await supabase.from("notifications").insert({
          user_id: emberId,
          from_user_id: userId,
          type: "follow",
        });
      }
      setTimeout(() => setAnimatingId(null), 600);
    },
    [userId, ignited]
  );

  const sharedInterests = (ember: EmberSuggestion) => {
    if (!ember.interests) return [];
    return (ember.interests as string[]).filter((i) => userInterests.includes(i)).slice(0, 3);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex flex-col bg-background"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center gap-2 pt-12 px-8">
        <motion.svg
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          width="36"
          height="36"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
        >
          <circle cx="9" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
          <path d="M1 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="18" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.15" />
          <path d="M19 13c2.21.636 4 2.247 4 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </motion.svg>
        <h2 className="text-xl font-medium tracking-[-0.04em] text-foreground">Ignite some embers</h2>
        <p className="text-[10px] uppercase tracking-[0.1em] text-primary font-semibold">
          follow at least {MIN_IGNITES}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {ignited.size} ignited · your feed fills with their flares
        </p>
      </div>

      {/* Suggestions list */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-4 pb-32">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="signal-surface rounded-2xl px-4 py-3 animate-pulse h-16" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {suggestions.map((ember, i) => {
              const isIgnited = ignited.has(ember.user_id);
              const shared = sharedInterests(ember);
              const isFounder = ember.user_id === EMBER_FOUNDER_ID;

              return (
                <motion.div
                  key={ember.user_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...signalTransition, delay: i * 0.04 }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 signal-ease ${
                    isIgnited ? "bg-primary/10 border border-primary/20" : "signal-surface"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    {ember.avatar_url ? (
                      <img
                        src={ember.avatar_url}
                        alt={ember.display_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-muted-foreground">
                          <circle cx="8" cy="5" r="2.5" stroke="currentColor" strokeWidth="1" fill="currentColor" opacity="0.2" />
                          <path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" strokeWidth="1" fill="none" />
                        </svg>
                      </div>
                    )}
                    {isFounder && (
                      <div className="absolute -bottom-0.5 -right-0.5 bg-primary rounded-full p-0.5">
                        <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M8 1l1.5 4.5L14 8l-4.5 1.5L8 15l-1.5-5.5L2 8l4.5-1.5z"
                            fill="hsl(var(--primary-foreground))"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {ember.display_name}
                      {isFounder && (
                        <span className="text-[9px] text-primary ml-1.5">founder</span>
                      )}
                    </p>
                    {shared.length > 0 && (
                      <p className="text-[10px] text-muted-foreground truncate">
                        {shared.join(" · ")}
                      </p>
                    )}
                  </div>

                  {/* Ignite button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleIgnite(ember.user_id)}
                    disabled={isIgnited}
                    className={`rounded-full px-4 py-1.5 text-[11px] font-medium signal-ease flex-shrink-0 ${
                      isIgnited
                        ? "bg-primary/20 text-primary"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {animatingId === ember.user_id ? (
                        <motion.span
                          key="animating"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-block"
                        >
                          ✦
                        </motion.span>
                      ) : isIgnited ? (
                        <motion.span
                          key="ignited"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                        >
                          ignited
                        </motion.span>
                      ) : (
                        <span key="ignite">ignite</span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-[env(safe-area-inset-bottom,20px)] bg-gradient-to-t from-background via-background to-transparent z-20">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onComplete}
          className={`w-full rounded-2xl px-8 py-4 text-sm font-medium signal-ease transition-all ${
            ignited.size >= MIN_IGNITES
              ? "bg-primary text-primary-foreground signal-glow"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {ignited.size < MIN_IGNITES
            ? `Ignite ${MIN_IGNITES - ignited.size} more`
            : "Let's go"}
        </motion.button>
        <button
          onClick={onComplete}
          className="w-full mt-3 text-xs text-muted-foreground/50 signal-ease hover:text-muted-foreground text-center"
        >
          skip for now
        </button>
      </div>
    </motion.div>
  );
};

export default EmberSuggestions;
