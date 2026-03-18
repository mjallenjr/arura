import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VIBE_CATEGORIES, FEATURED_VIBES, searchVibes } from "@/lib/vibes";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };
const PERMANENT_INTERESTS = ["fly fishing"];
const MIN_VIBES = 5;

interface VibesPickerProps {
  userId: string;
  onComplete: (vibes: string[]) => void;
}

const VibesPicker = ({ userId, onComplete }: VibesPickerProps) => {
  const [selected, setSelected] = useState<string[]>([...PERMANENT_INTERESTS]);
  const [query, setQuery] = useState("");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const searchResults = useMemo(() => {
    return query.length >= 2 ? searchVibes(query, 30) : [];
  }, [query]);

  const toggleVibe = useCallback((vibe: string) => {
    const normalized = vibe.toLowerCase().trim();
    if (PERMANENT_INTERESTS.includes(normalized)) {
      toast.info("Fly fishing is forever 🎣");
      return;
    }
    setSelected(prev =>
      prev.includes(normalized)
        ? prev.filter(i => i !== normalized)
        : prev.length >= 25 ? (toast.error("Max 25 vibes"), prev) : [...prev, normalized]
    );
  }, []);

  const handleContinue = useCallback(async () => {
    if (selected.length < MIN_VIBES) {
      toast.error(`Pick at least ${MIN_VIBES} vibes`);
      return;
    }
    setSaving(true);
    await supabase
      .from("profiles")
      .update({ interests: selected })
      .eq("user_id", userId);
    onComplete(selected);
    setSaving(false);
  }, [selected, userId, onComplete]);

  const canCreateCustom = query.trim().length > 1 &&
    !searchResults.includes(query.toLowerCase().trim()) &&
    !selected.includes(query.toLowerCase().trim());

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
          width="36" height="36" viewBox="0 0 32 32" fill="none" className="text-primary"
        >
          <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" fill="currentColor" opacity="0.2" />
          <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        </motion.svg>
        <h2 className="text-xl font-medium tracking-[-0.04em] text-foreground">Choose your vibes</h2>
        <p className="text-[10px] uppercase tracking-[0.1em] text-primary font-semibold">pick at least {MIN_VIBES}</p>
        <p className="text-[10px] text-muted-foreground">{selected.length}/25 selected</p>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-6 pt-4 pb-32">
        {/* Search */}
        <div className="signal-surface rounded-xl px-4 py-2.5 mb-4">
          <input
            type="text"
            placeholder="500+ Hazy Vibes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* Create custom */}
        <AnimatePresence>
          {canCreateCustom && (
            <motion.button
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onClick={() => { toggleVibe(query.trim()); setQuery(""); }}
              className="w-full signal-surface rounded-xl px-4 py-3 mb-4 flex items-center gap-2 text-left"
            >
              <span className="text-primary text-sm">+</span>
              <span className="text-sm text-foreground">Create "<span className="text-primary font-medium">{query.trim()}</span>"</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Selected */}
        {selected.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1.5">
              {selected.map((vibe) => (
                <motion.button
                  key={vibe}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={() => toggleVibe(vibe)}
                  className={`rounded-full px-3 py-1.5 text-[11px] font-medium flex items-center gap-1 ${
                    PERMANENT_INTERESTS.includes(vibe)
                      ? "bg-primary/30 ring-1 ring-primary/60 text-primary cursor-default"
                      : "bg-primary/20 ring-1 ring-primary/40 text-primary"
                  }`}
                >
                  {vibe}
                  {PERMANENT_INTERESTS.includes(vibe) ? (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" opacity={0.6}>
                      <path d="M12 2C9.24 2 7 4.24 7 7v3H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-1V7c0-2.76-2.24-5-5-5zm3 10H9V7c0-1.66 1.34-3 3-3s3 1.34 3 3v5z"/>
                    </svg>
                  ) : (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Search results */}
        {query.length >= 2 && (
          <div className="mb-4">
            <p className="label-signal mb-2">{searchResults.length} results</p>
            <div className="flex flex-wrap gap-1.5">
              {searchResults.filter(v => !selected.includes(v)).map((tag) => (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleVibe(tag)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium signal-surface text-muted-foreground hover:text-foreground signal-ease"
                >
                  {tag}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Featured vibes */}
        {query.length < 2 && (
          <>
            <p className="label-signal mb-2">Vibrant Vibes</p>
            <div className="flex flex-wrap gap-1.5 mb-5">
              {FEATURED_VIBES.filter(v => !selected.includes(v)).map((tag) => (
                <motion.button
                  key={tag}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleVibe(tag)}
                  className="rounded-full px-3 py-1.5 text-[11px] font-medium signal-surface text-muted-foreground hover:text-foreground signal-ease"
                >
                  {tag}
                </motion.button>
              ))}
            </div>

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
                              onClick={() => toggleVibe(tag)}
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
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-[env(safe-area-inset-bottom,20px)] bg-gradient-to-t from-background via-background to-transparent z-20">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleContinue}
          disabled={saving}
          className={`w-full rounded-2xl px-8 py-4 text-sm font-medium signal-ease transition-all ${
            selected.length >= MIN_VIBES
              ? "bg-primary text-primary-foreground signal-glow"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {saving ? "..." : selected.length < MIN_VIBES
            ? `Pick ${MIN_VIBES - selected.length} more`
            : "Let's go"}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VibesPicker;
