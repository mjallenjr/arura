import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

type ProfileTab = "drops" | "activity" | "settings";

interface Notification {
  id: string;
  type: string;
  from_user_id: string;
  signal_id: string | null;
  word: string | null;
  read: boolean;
  created_at: string;
  from_name?: string;
}

interface MyDrop {
  id: string;
  type: string;
  storage_path: string | null;
  stitch_word: string | null;
  created_at: string;
  expires_at: string;
  media_url: string | null;
  stitch_count: number;
  stitches: { word: string; display_name: string }[];
  has_been_viewed: boolean;
  has_new_stitch: boolean;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("drops");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [signalsCount, setSignalsCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [myDrops, setMyDrops] = useState<MyDrop[]>([]);
  const [viewingDrop, setViewingDrop] = useState<MyDrop | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [myDrops, setMyDrops] = useState<MyDrop[]>([]);
  const [viewingDrop, setViewingDrop] = useState<MyDrop | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, followersRes, followingRes, signalsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, phone, avatar_url").eq("user_id", user.id).single(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("signals").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name ?? "");
        setPhone(profileRes.data.phone ?? "");
      }
      setFollowersCount(followersRes.count ?? 0);
      setFollowingCount(followingRes.count ?? 0);
      setSignalsCount(signalsRes.count ?? 0);
    };
    load();
  }, [user]);

  // Load my active drops
  useEffect(() => {
    if (!user) return;

    const loadDrops = async () => {
      const { data: signals } = await supabase
        .from("signals")
        .select("*")
        .eq("user_id", user.id)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (!signals || signals.length === 0) {
        setMyDrops([]);
        return;
      }

      const signalIds = signals.map((s) => s.id);

      // Get stitches, owner views
      const [stitchRes, ownerViewRes] = await Promise.all([
        supabase
          .from("stitches")
          .select("signal_id, word, user_id")
          .in("signal_id", signalIds),
        supabase
          .from("signal_owner_views")
          .select("signal_id")
          .eq("user_id", user.id)
          .in("signal_id", signalIds),
      ]);

      const stitchData = stitchRes.data ?? [];
      const viewedSet = new Set((ownerViewRes.data ?? []).map((v) => v.signal_id));

      // Get stitch author names
      const stitchAuthorIds = [...new Set(stitchData.map((s) => s.user_id))];
      let nameMap = new Map<string, string>();
      if (stitchAuthorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", stitchAuthorIds);
        nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);
      }

      const drops: MyDrop[] = signals.map((s) => {
        const signalStitches = stitchData.filter((st) => st.signal_id === s.id);
        let media_url: string | null = null;
        if (s.storage_path) {
          const { data } = supabase.storage.from("signals").getPublicUrl(s.storage_path);
          media_url = data.publicUrl;
        }

        const hasBeenViewed = viewedSet.has(s.id);
        // Has new stitch = viewed before but got stitches after (or any stitches if viewed)
        const hasNewStitch = hasBeenViewed && signalStitches.length > 0;

        return {
          id: s.id,
          type: s.type,
          storage_path: s.storage_path,
          stitch_word: s.stitch_word,
          created_at: s.created_at,
          expires_at: s.expires_at,
          media_url,
          stitch_count: signalStitches.length,
          stitches: signalStitches.map((st) => ({
            word: st.word,
            display_name: nameMap.get(st.user_id) ?? "someone",
          })),
          has_been_viewed: hasBeenViewed,
          has_new_stitch: hasNewStitch,
        };
      });

      setMyDrops(drops);
    };

    loadDrops();
  }, [user]);

  // Load notifications
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!notifs || notifs.length === 0) {
        setNotifications([]);
        return;
      }

      const fromIds = [...new Set(notifs.map((n) => n.from_user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", fromIds);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      setNotifications(
        notifs.map((n) => ({ ...n, from_name: nameMap.get(n.from_user_id) ?? "someone" }))
      );
    };

    loadNotifications();

    // Realtime subscription
    const channel = supabase
      .channel("notif-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleViewDrop = useCallback(async (drop: MyDrop) => {
    if (!user) return;

    // If already viewed and no new stitches, block re-view
    if (drop.has_been_viewed && !drop.has_new_stitch) {
      toast("You'll see this again when someone stitches it");
      return;
    }

    setViewingDrop(drop);

    // Record that we viewed our own drop
    await supabase.from("signal_owner_views").upsert(
      { user_id: user.id, signal_id: drop.id },
      { onConflict: "signal_id,user_id" }
    );

    // Update local state
    setMyDrops((prev) =>
      prev.map((d) =>
        d.id === drop.id ? { ...d, has_been_viewed: true, has_new_stitch: false } : d
      )
    );
  }, [user]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone: phone || null })
      .eq("user_id", user.id);

    if (error) toast.error("Failed to save");
    else toast.success("Saved");
    setSaving(false);
  }, [user, displayName, phone]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

  const timeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "expired";
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  // Drop viewer overlay
  if (viewingDrop) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setViewingDrop(null)} className="text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="label-signal">your drop</p>
          <div className="w-5" />
        </div>

        <div className="flex-1 relative">
          {viewingDrop.media_url && viewingDrop.type === "photo" && (
            <img src={viewingDrop.media_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
          {viewingDrop.media_url && viewingDrop.type === "video" && (
            <video src={viewingDrop.media_url} autoPlay muted playsInline className="absolute inset-0 h-full w-full object-cover" />
          )}

          {viewingDrop.stitch_word && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p
                className="text-4xl font-bold tracking-tight text-foreground drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]"
                style={{ textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)", fontStyle: "italic" }}
              >
                {viewingDrop.stitch_word}
              </p>
            </div>
          )}

          {/* Stitches overlay */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-6">
            {viewingDrop.stitches.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="label-signal">✦ stitches</p>
                {viewingDrop.stitches.map((st, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ ...signalTransition, delay: i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <span className="text-lg font-bold text-primary" style={{ fontStyle: "italic" }}>
                      {st.word}
                    </span>
                    <span className="text-[10px] text-muted-foreground">— {st.display_name}</span>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">No stitches yet</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh w-full flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">profile</p>
        <div className="w-5" />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {/* Avatar + Name */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={signalTransition}
          className="flex flex-col items-center gap-4 pt-4 pb-6"
        >
          <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center">
            <span className="text-2xl font-medium text-secondary-foreground">{initial}</span>
          </div>
          <p className="text-lg font-medium text-foreground tracking-tight">{displayName || "Anonymous"}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...signalTransition, delay: 0.1 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: "signals", value: signalsCount },
            { label: "followers", value: followersCount },
            { label: "following", value: followingCount },
          ].map((stat) => (
            <div key={stat.label} className="signal-surface rounded-xl p-4 flex flex-col items-center gap-1">
              <span className="text-xl font-medium text-foreground">{stat.value}</span>
              <span className="label-signal">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-6">
          {(["drops", "activity", "settings"] as ProfileTab[]).map((t) => {
            const unreadCount = t === "activity" ? notifications.filter((n) => !n.read).length : 0;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  // Mark notifications as read when opening activity
                  if (t === "activity" && unreadCount > 0 && user) {
                    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
                    supabase.from("notifications").update({ read: true }).in("id", unreadIds).then(() => {
                      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    });
                  }
                }}
                className={`relative flex-1 rounded-full py-2 text-xs font-medium signal-ease ${
                  tab === t ? "bg-primary text-primary-foreground" : "signal-surface text-muted-foreground"
                }`}
              >
                {t === "drops" ? "My Drops" : t === "activity" ? "Activity" : "Settings"}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {tab === "drops" && (
            <motion.div
              key="drops"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
              className="flex flex-col gap-3"
            >
              {myDrops.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No active drops right now
                </p>
              )}
              {myDrops.map((drop) => (
                <motion.button
                  key={drop.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleViewDrop(drop)}
                  className="relative signal-surface rounded-xl p-4 flex items-center gap-4 text-left overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                    {drop.media_url && drop.type === "photo" && (
                      <img src={drop.media_url} alt="" className="h-full w-full object-cover" />
                    )}
                    {drop.media_url && drop.type === "video" && (
                      <div className="h-full w-full flex items-center justify-center bg-secondary">
                        <span className="text-xs text-muted-foreground">▶</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {drop.type === "photo" ? "Photo" : "Video"}
                      </span>
                      {drop.stitch_word && (
                        <span className="text-xs text-primary italic">"{drop.stitch_word}"</span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {timeLeft(drop.expires_at)} left
                    </p>
                    {drop.stitch_count > 0 && (
                      <p className="text-[10px] text-primary/80 mt-0.5">
                        ✦ {drop.stitch_count} stitch{drop.stitch_count > 1 ? "es" : ""}
                      </p>
                    )}
                  </div>

                  {/* New stitch indicator */}
                  {drop.has_new_stitch && (
                    <div className="h-2.5 w-2.5 rounded-full bg-primary signal-glow flex-shrink-0" />
                  )}

                  {/* Locked indicator (viewed but no new stitches) */}
                  {drop.has_been_viewed && !drop.has_new_stitch && (
                    <span className="text-muted-foreground/40 text-xs flex-shrink-0">🔒</span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {tab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
              className="flex flex-col gap-3"
            >
              {notifications.length === 0 && (
                <p className="text-center text-xs text-muted-foreground py-8">
                  No activity yet
                </p>
              )}
              {notifications.map((notif) => {
                const timeAgo = (() => {
                  const diff = Date.now() - new Date(notif.created_at).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return "just now";
                  if (mins < 60) return `${mins}m ago`;
                  const hours = Math.floor(mins / 60);
                  if (hours < 24) return `${hours}h ago`;
                  return `${Math.floor(hours / 24)}d ago`;
                })();

                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`signal-surface rounded-xl p-3 flex items-center gap-3 ${
                      !notif.read ? "ring-1 ring-primary/20" : ""
                    }`}
                  >
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary text-sm">✦</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">
                        <span className="font-medium">{notif.from_name}</span>{" "}
                        {notif.type === "stitch" ? "stitched" : "interacted with"} your drop
                      </p>
                      {notif.word && (
                        <p className="text-primary text-sm font-bold italic mt-0.5">
                          "{notif.word}"
                        </p>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo}</p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {tab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={signalTransition}
              className="flex flex-col gap-4"
            >
              <div>
                <label className="label-signal mb-2 block">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="label-signal mb-2 block">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Optional"
                  className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/30"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
              >
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>

              <div className="flex justify-center mt-4">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignOut}
                  className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-destructive signal-ease"
                >
                  Sign Out
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Profile;
