import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };
const PERMANENT_INTERESTS = ["fly fishing"];

const PRESET_INTERESTS = [
  "photography", "music", "hiking", "cooking", "gaming", "fitness",
  "travel", "art", "fashion", "film", "reading", "yoga",
  "surfing", "skateboarding", "dancing", "poetry", "astronomy",
  "gardening", "tattoos", "vinyl", "coffee", "meditation",
  "cycling", "climbing", "design",
];

interface InterestPickerProps {
  userId: string;
  currentInterests: string[];
  onSave: (interests: string[]) => void;
  onClose: () => void;
}

const InterestPicker = ({ userId, currentInterests, onSave, onClose }: InterestPickerProps) => {
  const [selected, setSelected] = useState<string[]>(currentInterests);
  const [search, setSearch] = useState("");
  const [networkInterests, setNetworkInterests] = useState<string[]>([]);
  const [popularTerms, setPopularTerms] = useState<{ term: string; search_count: number }[]>([]);
  const [saving, setSaving] = useState(false);

  // Load network interests + popular searches
  useEffect(() => {
    const load = async () => {
      // Get interests from connected embers (mutual follows)
      const [followingRes, followersRes, popularRes] = await Promise.all([
        supabase.from("follows").select("following_id").eq("follower_id", userId),
        supabase.from("follows").select("follower_id").eq("following_id", userId),
        supabase.from("interest_searches").select("term, search_count").order("search_count", { ascending: false }).limit(25),
      ]);

      const followingIds = new Set((followingRes.data ?? []).map(f => f.following_id));
      const followerIds = new Set((followersRes.data ?? []).map(f => f.follower_id));

      // Mutual = sparked
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

        // Sort by frequency among network
        const sorted = [...interestCount.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([term]) => term);

        setNetworkInterests(sorted);
      }

      setPopularTerms((popularRes.data ?? []) as { term: string; search_count: number }[]);
    };
    load();
  }, [userId]);

  const toggleInterest = useCallback((interest: string) => {
    const normalized = interest.toLowerCase().trim();
    setSelected(prev =>
      prev.includes(normalized)
        ? prev.filter(i => i !== normalized)
        : prev.length >= 25 ? (toast.error("Max 25 interests"), prev) : [...prev, normalized]
    );
  }, []);

  // Build recommendation list: network interests first, then popular, then presets
  const recommendations = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    // 1. Network interests (from connected embers)
    for (const i of networkInterests) {
      if (!seen.has(i)) { seen.add(i); result.push(i); }
    }

    // 2. Popular searched terms
    for (const p of popularTerms) {
      if (!seen.has(p.term)) { seen.add(p.term); result.push(p.term); }
    }

    // 3. Presets
    for (const i of PRESET_INTERESTS) {
      if (!seen.has(i)) { seen.add(i); result.push(i); }
    }

    return result.slice(0, 25);
  }, [networkInterests, popularTerms]);

  // Filter by search
  const filtered = useMemo(() => {
    if (!search.trim()) return recommendations;
    const q = search.toLowerCase().trim();
    const matches = recommendations.filter(i => i.includes(q));
    // If no match found, allow creating custom
    return matches;
  }, [search, recommendations]);

  const canCreateCustom = search.trim().length > 1 && !recommendations.includes(search.toLowerCase().trim()) && !selected.includes(search.toLowerCase().trim());

  const handleAddCustom = useCallback(async () => {
    const term = search.toLowerCase().trim();
    if (!term || selected.length >= 25) return;
    toggleInterest(term);
    setSearch("");

    // Track the search term popularity
    const { data: existing } = await supabase
      .from("interest_searches")
      .select("id, search_count")
      .eq("term", term)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("interest_searches")
        .update({ search_count: (existing.search_count as number) + 1 })
        .eq("id", existing.id);
    } else {
      await supabase
        .from("interest_searches")
        .insert({ term, search_count: 1 });
    }
  }, [search, selected, toggleInterest]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    // Also track any selected presets as searches for popularity
    for (const interest of selected) {
      if (!currentInterests.includes(interest)) {
        const { data: existing } = await supabase
          .from("interest_searches")
          .select("id, search_count")
          .eq("term", interest)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("interest_searches")
            .update({ search_count: (existing.search_count as number) + 1 })
            .eq("id", existing.id);
        } else {
          await supabase
            .from("interest_searches")
            .insert({ term: interest, search_count: 1 });
        }
      }
    }

    await supabase
      .from("profiles")
      .update({ interests: selected })
      .eq("user_id", userId);

    onSave(selected);
    setSaving(false);
    toast.success("Interests saved");
    onClose();
  }, [selected, userId, currentInterests, onSave, onClose]);

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
        {/* Selected count */}
        <p className="text-[10px] text-muted-foreground text-center mb-4">
          {selected.length}/25 selected
        </p>

        {/* Search */}
        <div className="relative mb-5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search or create an interest..."
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

        {/* Create custom interest */}
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
                  className="rounded-full bg-primary/20 ring-1 ring-primary/40 px-3 py-1.5 text-xs font-medium text-primary flex items-center gap-1.5"
                >
                  {interest}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          {networkInterests.length > 0 && !search && (
            <p className="label-signal mb-2">✦ from your embers</p>
          )}
          {search && filtered.length > 0 && (
            <p className="label-signal mb-2">results</p>
          )}
          {!search && networkInterests.length === 0 && (
            <p className="label-signal mb-2">recommended</p>
          )}
          <div className="flex flex-wrap gap-2">
            {filtered
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
          {search && filtered.length === 0 && !canCreateCustom && (
            <p className="text-xs text-muted-foreground text-center py-4">No matches</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default InterestPicker;
