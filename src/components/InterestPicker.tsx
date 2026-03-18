import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, X, Sparkles, TrendingUp } from "lucide-react";
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
  const searchRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on mount
  useEffect(() => {
    setTimeout(() => searchRef.current?.focus(), 300);
  }, []);

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

  // Search results — now triggers from 1 character
  const searchResults = useMemo(() => {
    if (search.trim().length < 1) return [];
    return searchVibes(search, 40);
  }, [search]);

  const isSearching = search.trim().length >= 1;

  // Quick suggestions — mix of trending + network
  const quickSuggestions = useMemo(() => {
    const seen = new Set(selected);
    const result: string[] = [];
    for (const i of networkInterests) { if (!seen.has(i) && result.length < 8) { seen.add(i); result.push(i); } }
    for (const i of FEATURED_VIBES) { if (!seen.has(i) && result.length < 12) { seen.add(i); result.push(i); } }
    return result;
  }, [networkInterests, selected]);

  // Full recommendations
  const recommendations = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const i of networkInterests) { if (!seen.has(i)) { seen.add(i); result.push(i); } }
    for (const i of FEATURED_VIBES) { if (!seen.has(i)) { seen.add(i); result.push(i); } }
    return result.slice(0, 25);
  }, [networkInterests]);

  const displayItems = isSearching ? searchResults : recommendations;

  const canCreateCustom = search.trim().length > 1 &&
    !searchResults.includes(search.toLowerCase().trim()) &&
    !selected.includes(search.toLowerCase().trim());

  const handleAddCustom = useCallback(async () => {
    const term = search.toLowerCase().trim();
    if (!term || selected.length >= 25) return;
    toggleInterest(term);
    setSearch("");
    searchRef.current?.focus();
    await supabase.rpc("increment_interest_search", { p_term: term });
  }, [search, selected, toggleInterest]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ interests: selected })
      .eq("user_id", userId);

    // Sync camps after interest change
    Promise.resolve(supabase.rpc("sync_camps_for_user" as any, { p_user_id: userId })).catch(() => {});

    onSave(selected);
    setSaving(false);
    toast.success("Interests saved");
    onClose();
  }, [selected, userId, onSave, onClose]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase().trim());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <span className="text-primary font-semibold">{text.slice(idx, idx + query.trim().length)}</span>
        {text.slice(idx + query.trim().length)}
      </>
    );
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={signalTransition}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
          <X className="w-5 h-5" />
        </button>
        <p className="label-signal">your vibes</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-sm font-semibold text-primary disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </div>

      {/* GIANT search bar — the star of the show */}
      <div className="px-4 pb-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search 500+ vibes..."
            className="w-full rounded-2xl border border-border bg-card pl-12 pr-12 py-4 text-base text-foreground placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all"
          />
          {search && (
            <button
              onClick={() => { setSearch(""); searchRef.current?.focus(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Live result count badge */}
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-2 ml-1"
          >
            <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
              {searchResults.length} match{searchResults.length !== 1 ? "es" : ""}
            </span>
            {canCreateCustom && (
              <button
                onClick={handleAddCustom}
                className="text-[10px] font-medium text-foreground bg-accent rounded-full px-2 py-0.5 hover:bg-accent/80 transition-colors"
              >
                + create "{search.trim()}"
              </button>
            )}
          </motion.div>
        )}
      </div>

      {/* Quick suggestion chips — always visible when not searching */}
      {!isSearching && quickSuggestions.length > 0 && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">Quick add</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {quickSuggestions.map((interest, idx) => (
              <motion.button
                key={interest}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...signalTransition, delay: idx * 0.03 }}
                onClick={() => { toggleInterest(interest); }}
                className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 transition-colors"
              >
                + {interest}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Selected count bar */}
      <div className="px-4 pb-2 flex items-center gap-2">
        <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={false}
            animate={{ width: `${(selected.length / 25) * 100}%` }}
            transition={signalTransition}
          />
        </div>
        <span className="text-[10px] font-medium text-muted-foreground shrink-0">
          {selected.length}/25
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-12">
        {/* Selected interests */}
        {selected.length > 0 && (
          <div className="mb-4">
            <p className="label-signal mb-2">selected</p>
            <div className="flex flex-wrap gap-1.5">
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
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  {interest}
                  {PERMANENT_INTERESTS.includes(interest) ? (
                    <span className="text-[8px] opacity-60">🔒</span>
                  ) : (
                    <X className="w-3 h-3" />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results — big, tappable list items */}
        {isSearching ? (
          <div>
            <div className="flex flex-col gap-1">
              {searchResults
                .filter(i => !selected.includes(i))
                .map((interest, idx) => (
                  <motion.button
                    key={interest}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...signalTransition, delay: idx * 0.02 }}
                    onClick={() => { toggleInterest(interest); searchRef.current?.focus(); }}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-accent/50 active:bg-accent transition-colors group"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <span className="text-primary text-xs font-bold">+</span>
                    </span>
                    <span className="text-sm text-foreground">{highlightMatch(interest, search)}</span>
                  </motion.button>
                ))}
            </div>
            {searchResults.length === 0 && canCreateCustom && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleAddCustom}
                className="w-full flex items-center gap-3 rounded-xl border border-dashed border-primary/30 px-4 py-4 mt-2 hover:bg-primary/5 transition-colors"
              >
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm text-foreground">
                  Create new vibe: <span className="text-primary font-semibold">"{search.trim()}"</span>
                </span>
              </motion.button>
            )}
            {searchResults.length === 0 && !canCreateCustom && (
              <p className="text-xs text-muted-foreground text-center py-8">No matches found</p>
            )}
          </div>
        ) : (
          <>
            {/* Recommendations */}
            <div className="mb-4">
              {networkInterests.length > 0 ? (
                <p className="label-signal mb-2">✦ from your embers</p>
              ) : (
                <p className="label-signal mb-2">Popular vibes</p>
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
            </div>

            {/* Category browser */}
            <div className="mt-2">
              <p className="label-signal mb-2">Browse by category</p>
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
          </>
        )}
      </div>
    </motion.div>
  );
};

export default InterestPicker;
