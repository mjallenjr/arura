import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import QRCode from "@/components/QRCode";
import QRScanner from "@/components/QRScanner";

type Tab = "search" | "qr" | "scan";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface ProfileResult {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  qr_code: string | null;
  isFollowing: boolean;
}

const People = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("search");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProfileResult[]>([]);
  const [myQr, setMyQr] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  // Load my QR code and following list
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      const [profileRes, followsRes] = await Promise.all([
        supabase.from("profiles").select("qr_code").eq("user_id", user.id).single(),
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
      ]);

      if (profileRes.data) setMyQr(profileRes.data.qr_code);
      if (followsRes.data) {
        setFollowingIds(new Set(followsRes.data.map((f) => f.following_id)));
      }
    };
    loadData();
  }, [user]);

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

      if (followingIds.has(targetUserId)) {
        await supabase
          .from("follows")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", targetUserId);

        setFollowingIds((prev) => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
        setResults((prev) =>
          prev.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: false } : r))
        );
      } else {
        await supabase
          .from("follows")
          .insert({ follower_id: user.id, following_id: targetUserId });

        setFollowingIds((prev) => new Set(prev).add(targetUserId));
        setResults((prev) =>
          prev.map((r) => (r.user_id === targetUserId ? { ...r, isFollowing: true } : r))
        );
        toast.success("Connected");
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
        toast.success(`Connected with ${data.display_name}`);
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
        <p className="label-signal">people</p>
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

              <div className="flex flex-col gap-2">
                {results.map((person) => (
                  <motion.div
                    key={person.user_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between signal-surface rounded-xl p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-medium text-secondary-foreground">
                          {person.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{person.display_name}</p>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleFollow(person.user_id)}
                      className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease ${
                        person.isFollowing
                          ? "signal-surface text-muted-foreground"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      {person.isFollowing ? "Following" : "Follow"}
                    </motion.button>
                  </motion.div>
                ))}

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
