import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VIBE_CATEGORIES, FEATURED_VIBES, searchVibes } from "@/lib/vibes";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };
const PERMANENT_INTERESTS = ["fly fishing"];

interface InterestPickerProps {
  userId: string;
  currentInterests: string[];
  onSave: (interests: string[]) => void;
  onClose: () => void;
}

const InterestPicker = ({ userId, currentInterests, onSave, onClose }: InterestPickerProps) => {
  const [selected, setSelected] = useState<string[]>(() => {
    const merged = [...currentInterests];
    for (const p of PERMANENT_INTERESTS) {
      if (!merged.includes(p)) merged.push(p);
    }
    return merged;
  });
  const [search, setSearch] = useState("");
  const [networkInterests, setNetworkInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Load network interests from mutual connections
  useEffect(() => {
    const load = async () => {
      const [followingRes, followersRes] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", userId),
        supabase.from("follows").select("follower_id").eq("following_id", userId),
      ]);

      const followingIds = new Set((followingRes.data ?? []).map(f => f.following_id));
      const followerIds = new Set((followersRes.data ?? []).map(f => f.follower_id));
      const mutualIds = [...followingIds].filter(id => followerIds.has(id));

      if (mutualIds.length > 0) {
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("interests")
          .in("user_id", mutualIds);

        const interestCount = new Map<string, number>();
        profiles?.forEach(p => {
          (p.interests ?? []).forEach((i: string) => {
            interestCount.set(i, (interestCount.get(i) ?? 0) + 1);
          });
        });

        const sorted = [...interestCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([term]) => term);

        setNetworkInterests(sorted);
      }
    };
    load();
  }, [userId]);

  const toggleInterest = useCallback((interest: string) => {
    const normalized = interest.toLowerCase().trim();
    if (PERMANENT_INTERESTS.includes(normalized)) {
      toast.info("Fly fishing is forever 🎣");
      return;
    }
    setSelected(prev =>
      prev.includes(normalized)
        ? prev.filter(i => i !== normalized)
        : prev.length >= 25 ? (toast.error("Max 25 interests"), prev) : [...prev, normalized]
    );
  }, []);

  // Search results from full vibes library
  const searchResults = useMemo(() => {
    if (search.trim().length < 2) return [];
    return searchVibes(search, 30);
  }, [search]);

  // Recommendations when not searching
  const recommendations = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const i of networkInterests) { if (!seen.has(i)) { seen.add(i); result.push(i); } }
    for (const i of FEATURED_VIBES) { if (!seen.has(i)) { seen.add(i); result.push(i); } }
    return result.slice(0, 25);
  }, [networkInterests]);

  const displayItems = search.trim().length >= 2 ? searchResults : recommendations;

  const canCreateCustom = search.trim().length > 1 &&
    !searchResults.includes(search.toLowerCase().trim()) &&
    !selected.includes(search.toLowerCase().trim());

  const handleAddCustom = useCallback(async () => {
    const term = search.toLowerCase().trim();
    if (!term || selected.length >= 25) return;
    toggleInterest(term);
    setSearch("");
    await supabase.rpc("increment_interest_search", { p_term: term });
  }, [search, selected, toggleInterest]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ interests: selected })
      .eq("user_id", userId);

    onSave(selected);
    setSaving(false);
    toast.success("Interests saved");
    onClose();
  }, [selected, userId, onSave, onClose]);

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
        <p className="label-signal">your interests</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-medium text-primary disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-12">
        <p className="text-[10px] text-muted-foreground text-center mb-4">
          {selected.length}/25 selected
        </p>

        {/* Search */}
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="500+ Hazy Vibes..."
            className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Create custom */}
        <AnimatePresence>
          {canCreateCustom && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={handleAddCustom}
              className="w-full signal-surface rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-left"
            >
              <span className="text-primary text-sm">+</span>
              <span className="text-sm text-foreground">Create "<span className="text-primary font-medium">{search.trim()}</span>"</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Selected interests */}
        {selected.length > 0 && (
          <div className="mb-6">
            <p className="label-signal mb-2">selected</p>
            <div className="flex flex-wrap gap-2">
              {selected.map((interest) => (
                <motion.button
                  key={interest}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 ${
                    PERMANENT_INTERESTS.includes(interest)
                      ? "bg-primary/30 ring-1 ring-primary/60 text-primary cursor-default"
                      : "bg-primary/20 ring-1 ring-primary/40 text-primary"
                  }`}
                >
                  {interest}
                  {PERMANENT_INTERESTS.includes(interest) ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity={0.6}>
                      <path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm3 10H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v5z"/>
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Results / Recommendations */}
        <div>
          {search.trim().length >= 2 ? (
            <p className="label-signal mb-2">{searchResults.length} results</p>
          ) : networkInterests.length > 0 ? (
            <p className="label-signal mb-2">✦ from your embers</p>
          ) : (
            <p className="label-signal mb-2">Vibrant Vibes</p>
          )}
          <div className="flex flex-wrap gap-2">
            {displayItems
              .filter(i => !selected.includes(i))
              .map((interest, idx) => (
                <motion.button
                  key={interest}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...signalTransition, delay: idx * 0.02 }}
                  onClick={() => toggleInterest(interest)}
                  className="rounded-full signal-surface px-3 py-1.5 text-xs font-medium text-foreground/80 hover:ring-1 hover:ring-primary/20 signal-ease"
                >
                  {interest}
                </motion.button>
              ))}
          </div>
          {search.trim().length >= 2 && searchResults.length === 0 && !canCreateCustom && (
            <p className="text-xs text-muted-foreground text-center py-4">No matches</p>
          )}
        </div>

        {/* Category browser (when not searching) */}
        {search.trim().length < 2 && (
          <div className="mt-6">
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
                              onClick={() => toggleInterest(tag)}
                              className={`rounded-full px-3 py-1.5 text-[11px] font-medium signal-ease ${
                                selected.includes(tag)
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
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default InterestPicker;
