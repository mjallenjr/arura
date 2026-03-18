import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { X, Search } from "lucide-react";

interface FanSheetProps {
  open: boolean;
  signalId: string;
  userId: string;
  fanCount: number;
  onFan: (recipientId: string, recipientName: string) => Promise<boolean>;
  checkSparked: (recipientId: string) => Promise<boolean>;
  onClose: () => void;
}

interface EmberResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}

const FanSheet = ({ open, signalId, userId, fanCount, onFan, onClose }: FanSheetProps) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EmberResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  // Search embers
  useEffect(() => {
    if (!open || query.length < 2) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.rpc("search_profiles", {
        search_term: query,
        requesting_user_id: userId,
      });
      setResults((data as EmberResult[]) ?? []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [query, open, userId]);

  // Load recent follows as default suggestions
  useEffect(() => {
    if (!open || query.length > 0) return;
    (async () => {
      setLoading(true);
      const { data: follows } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (follows && follows.length > 0) {
        const ids = follows.map((f) => f.following_id);
        const { data: profiles } = await supabase.rpc("get_profiles_by_ids", {
          p_user_ids: ids,
        });
        setResults((profiles as EmberResult[]) ?? []);
      }
      setLoading(false);
    })();
  }, [open, userId, query]);

  const handleFan = useCallback(
    async (ember: EmberResult) => {
      setSending(ember.user_id);
      const success = await onFan(ember.user_id, ember.display_name);
      setSending(null);
      if (success) onClose();
    },
    [onFan, onClose]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="w-full max-w-md rounded-t-2xl bg-background border-t border-border p-6 pb-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Fan this flare</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {fanCount >= 2
                    ? "ad required for next fan"
                    : `${2 - fanCount} free fan${2 - fanCount !== 1 ? "s" : ""} remaining`}
                </p>
              </div>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-muted/40 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search embers..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
                className="w-full rounded-xl bg-muted/30 border border-border pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>

            {/* Results */}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {loading && (
                <p className="text-xs text-muted-foreground text-center py-4 animate-pulse">
                  searching...
                </p>
              )}
              {!loading && results.length === 0 && query.length >= 2 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  no embers found
                </p>
              )}
              {!loading && results.length === 0 && query.length < 2 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {query.length === 0 ? "your circle" : "type to search..."}
                </p>
              )}
              {results.map((ember) => (
                <motion.button
                  key={ember.user_id}
                  whileTap={{ scale: 0.97 }}
                  disabled={sending === ember.user_id}
                  onClick={() => handleFan(ember)}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/30 transition-colors disabled:opacity-50"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {ember.avatar_url ? (
                      <img
                        src={ember.avatar_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-medium text-primary">
                        {ember.display_name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-medium text-foreground flex-1 text-left">
                    {ember.display_name}
                  </span>
                  <span className="text-[10px] text-primary font-medium">
                    {sending === ember.user_id ? "fanning..." : "fan"}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FanSheet;
