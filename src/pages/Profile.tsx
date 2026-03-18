import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import EmberProfile from "@/components/EmberProfile";
import InterestPicker from "@/components/InterestPicker";
import { useReferral } from "@/hooks/useReferral";
import { useCreatorEarnings } from "@/hooks/useCreatorEarnings";
import { useSubscription } from "@/hooks/useSubscription";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import ProfileHeatHistory from "@/components/ProfileHeatHistory";

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

interface SignalViewer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  viewed_at: string;
}

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ProfileTab>("drops");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [sparkedCount, setSparkedCount] = useState(0);
  const [ignitedCount, setIgnitedCount] = useState(0);
  const [fuelingCount, setFuelingCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [myDrops, setMyDrops] = useState<MyDrop[]>([]);
  const [viewingDrop, setViewingDrop] = useState<MyDrop | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showingList, setShowingList] = useState<"ignited" | "fueling" | null>(null);
  const [listEmbers, setListEmbers] = useState<{ user_id: string; display_name: string; avatar_url: string | null }[]>([]);
  const [selectedEmberId, setSelectedEmberId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewers, setViewers] = useState<SignalViewer[]>([]);
  const [loadingViewers, setLoadingViewers] = useState(false);
  const { referralCode, referralCount, shareLink } = useReferral();
  const {
    impressions: creatorImpressions,
    creatorShare,
    available: availablePayout,
    paidOut,
    stripeConnected,
    payingOut,
    connectStripe,
    requestPayout,
  } = useCreatorEarnings();
  const { isPro, subscriptionEnd, loading: subLoading, startCheckout, openPortal, checkSubscription } = useSubscription();
  const {
    isSubscribed: pushSubscribed,
    loading: pushLoading,
    subscribe: pushSubscribe,
    unsubscribe: pushUnsubscribe,
    isSupported: pushSupported,
  } = usePushNotifications();

  // Check subscription after returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "true") {
      checkSubscription();
      window.history.replaceState({}, "", "/profile");
    }
  }, [checkSubscription]);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, followersRes, followingRes, iFollowRes, followMeRes] = await Promise.all([
        supabase.from("profiles").select("display_name, phone, avatar_url, interests").eq("user_id", user.id).single(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("follower_id", user.id),
        // Users I ignited
        supabase.from("follows").select("following_id").eq("follower_id", user.id),
        // Users fueling me
        supabase.from("follows").select("follower_id").eq("following_id", user.id),
      ]);

      if (profileRes.data) {
        setDisplayName(profileRes.data.display_name ?? "");
        setPhone(profileRes.data.phone ?? "");
        setAvatarUrl(profileRes.data.avatar_url ?? null);
        setMyInterests(profileRes.data.interests ?? []);
      }

      setIgnitedCount(followingRes.count ?? 0);
      setFuelingCount(followersRes.count ?? 0);

      // Sparked = mutual follows (I ignited them AND they fuel me)
      const iFollow = new Set((iFollowRes.data ?? []).map(f => f.following_id));
      const followMe = new Set((followMeRes.data ?? []).map(f => f.follower_id));
      let mutualCount = 0;
      for (const id of iFollow) {
        if (followMe.has(id)) mutualCount++;
      }
      setSparkedCount(mutualCount);
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
          .from("public_profiles")
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
        .from("public_profiles")
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
    setViewers([]);

    // Record that we viewed our own drop
    await supabase.from("signal_owner_views").upsert(
      { user_id: user.id, signal_id: drop.id },
      { onConflict: "signal_id,user_id" }
    );

    // Load viewer insights for Pro users
    if (isPro) {
      setLoadingViewers(true);
      const { data: viewData } = await supabase
        .from("signal_views")
        .select("user_id, created_at")
        .eq("signal_id", drop.id)
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (viewData && viewData.length > 0) {
        const viewerIds = [...new Set(viewData.map(v => v.user_id))];
        const { data: profiles } = await supabase
          .from("public_profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", viewerIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p]) ?? []);
        setViewers(
          viewData
            .filter((v, i, arr) => arr.findIndex(a => a.user_id === v.user_id) === i)
            .map(v => ({
              user_id: v.user_id,
              display_name: (profileMap.get(v.user_id) as any)?.display_name ?? "someone",
              avatar_url: (profileMap.get(v.user_id) as any)?.avatar_url ?? null,
              viewed_at: v.created_at,
            }))
        );
      }
      setLoadingViewers(false);
    }

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

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files?.[0]) return;
    setUploadingAvatar(true);
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) { toast.error("Upload failed"); setUploadingAvatar(false); return; }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const newUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: newUrl }).eq("user_id", user.id);
    setAvatarUrl(newUrl);
    setUploadingAvatar(false);
    toast.success("Avatar updated");
  }, [user]);

  const handleSignOut = useCallback(async () => {
    localStorage.removeItem("arura_onboarded");
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    if (!user) return;
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("delete-account", {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      toast.success("Account deleted. Goodbye.");
      await signOut();
      navigate("/auth");
    } catch {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  }, [user, signOut, navigate]);

  const handleShowList = useCallback(async (type: "ignited" | "fueling") => {
    if (!user) return;
    setShowingList(type);
    setLoadingList(true);

    const { data: followData } = type === "ignited"
      ? await supabase.from("follows").select("following_id").eq("follower_id", user.id)
      : await supabase.from("follows").select("follower_id").eq("following_id", user.id);

    if (followData && followData.length > 0) {
      const ids = followData.map(f => (f as any).following_id ?? (f as any).follower_id);
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", ids);
      setListEmbers(profiles ?? []);
    } else {
      setListEmbers([]);
    }
    setLoadingList(false);
  }, [user]);

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

            {/* Viewer Insights (Pro only) */}
            {isPro && (
              <div className="mt-4">
                <p className="label-signal mb-2">👁 viewers</p>
                {loadingViewers ? (
                  <p className="text-[10px] text-muted-foreground">Loading...</p>
                ) : viewers.length > 0 ? (
                  <div className="flex flex-col gap-1.5">
                    {viewers.map((v) => {
                      const ago = (() => {
                        const diff = Date.now() - new Date(v.viewed_at).getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) return "just now";
                        if (mins < 60) return `${mins}m ago`;
                        return `${Math.floor(mins / 60)}h ago`;
                      })();
                      return (
                        <motion.div
                          key={v.user_id}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-2"
                        >
                          <div className="h-5 w-5 rounded-full bg-secondary overflow-hidden flex-shrink-0">
                            {v.avatar_url ? (
                              <img src={v.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <span className="flex h-full w-full items-center justify-center text-[8px] font-medium text-secondary-foreground">
                                {v.display_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-foreground/70">{v.display_name}</span>
                          <span className="text-[8px] text-muted-foreground/50 ml-auto">{ago}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/50">No views yet</p>
                )}
              </div>
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
          <label className="relative cursor-pointer group">
            <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden ring-2 ring-transparent group-hover:ring-primary/30 signal-ease">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-medium text-secondary-foreground">{initial}</span>
              )}
            </div>
            <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
              {uploadingAvatar ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }} className="h-3 w-3 border border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary-foreground">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
                </svg>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          </label>
          <div className="flex items-center gap-2">
            <p className="text-lg font-medium text-foreground tracking-tight">{displayName || "Anonymous"}</p>
            {isPro && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wide">PRO</span>
            )}
          </div>
          {/* Email hidden for privacy - only shown in settings */}
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...signalTransition, delay: 0.1 }}
          className="flex flex-col items-center gap-4 mb-6"
        >
          <p className="text-sm text-muted-foreground">
            You've Sparked with <span className="text-foreground font-semibold">{sparkedCount}</span> Embers
          </p>
          <div className="grid grid-cols-2 gap-3 w-full">
            <button onClick={() => handleShowList("ignited")} className="signal-surface rounded-xl p-4 flex flex-col items-center gap-1 signal-ease hover:ring-1 hover:ring-primary/20 active:scale-[0.98]">
              <span className="text-xl font-medium text-foreground">{ignitedCount}</span>
              <span className="label-signal">Ignited</span>
            </button>
            <button onClick={() => handleShowList("fueling")} className="signal-surface rounded-xl p-4 flex flex-col items-center gap-1 signal-ease hover:ring-1 hover:ring-primary/20 active:scale-[0.98]">
              <span className="text-xl font-medium text-foreground">{fuelingCount}</span>
              <span className="label-signal">Fueling You</span>
            </button>
          </div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...signalTransition, delay: 0.15 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate("/analytics")}
            className="w-full rounded-xl bg-primary/10 border border-primary/20 p-3 flex items-center justify-center gap-2 signal-ease hover:bg-primary/20"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            <span className="text-xs font-medium text-primary">View Analytics</span>
          </motion.button>
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
              {/* Heat History */}
              <ProfileHeatHistory />

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

              {/* Interests */}
              <div>
                <label className="label-signal mb-2 block">Your Interests</label>
                <button
                  onClick={() => setShowInterestPicker(true)}
                  className="w-full signal-surface rounded-xl px-4 py-3 text-left signal-ease hover:ring-1 hover:ring-primary/20"
                >
                  {myInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {myInterests.slice(0, 5).map(i => (
                        <span key={i} className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">{i}</span>
                      ))}
                      {myInterests.length > 5 && (
                        <span className="text-[10px] text-muted-foreground">+{myInterests.length - 5} more</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">Choose your interests...</span>
                  )}
                </button>
              </div>

              {/* Push Notifications */}
              {pushSupported && (
                <div className="signal-surface rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Push Notifications</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {pushSubscribed ? "You'll get notified for stitches & felts" : "Get notified when embers interact"}
                    </p>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={pushSubscribed ? pushUnsubscribe : pushSubscribe}
                    disabled={pushLoading}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium signal-ease ${
                      pushSubscribed
                        ? "bg-destructive/10 text-destructive"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {pushLoading ? "..." : pushSubscribed ? "Disable" : "Enable"}
                  </motion.button>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-primary px-8 py-3 text-sm font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50 mt-2"
              >
                {saving ? "Saving..." : "Save Changes"}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/legal")}
                className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-muted-foreground text-left signal-ease hover:ring-1 hover:ring-primary/20 flex items-center gap-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Terms & Privacy
              </motion.button>

              {/* Share profile link */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  const url = `${window.location.origin}/ember/${user?.id}`;
                  navigator.clipboard.writeText(url).then(() => {
                    toast.success("Profile link copied!");
                  }).catch(() => {
                    toast("Your link: " + url);
                  });
                }}
                className="w-full signal-surface rounded-xl px-4 py-3 text-sm text-muted-foreground text-left signal-ease hover:ring-1 hover:ring-primary/20 flex items-center gap-3"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                  <polyline points="16,6 12,2 8,6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                Share Profile Link
              </motion.button>

              {/* arura Pro */}
              {!subLoading && (
                <div className={`rounded-xl p-4 border ${isPro ? "border-primary/30 bg-primary/5" : "signal-surface border-border/30"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">✦</span>
                    <p className="text-sm font-semibold text-foreground">arura Pro</p>
                    {isPro && (
                      <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">Active</span>
                    )}
                  </div>
                  {isPro ? (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">
                        Renews {subscriptionEnd ? new Date(subscriptionEnd).toLocaleDateString() : "soon"}
                      </p>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={openPortal}
                        className="w-full rounded-full bg-secondary px-4 py-2.5 text-xs font-medium text-secondary-foreground signal-ease hover:bg-secondary/80"
                      >
                        Manage Subscription
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col gap-1.5 mb-3">
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">✓</span> 24h signal duration (vs 2h)
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">✓</span> See who viewed your signals
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">✓</span> Priority in Discover
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="text-primary">✓</span> Pro badge on your profile
                        </p>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={startCheckout}
                        className="w-full rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground signal-glow signal-ease"
                      >
                        Upgrade — $7.99/mo
                      </motion.button>
                    </>
                  )}
                </div>
              )}

              {creatorImpressions > 0 && (
                <div className="signal-surface rounded-xl p-4">
                  <p className="label-signal mb-2">💰 Creator Earnings</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-lg font-semibold text-foreground">{creatorImpressions}</p>
                      <p className="text-[10px] text-muted-foreground">Impressions</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-primary">${creatorShare.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Total earned</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">${availablePayout.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">Available</p>
                    </div>
                  </div>
                  {paidOut > 0 && (
                    <p className="text-[10px] text-muted-foreground mb-3">
                      ${paidOut.toFixed(2)} already paid out
                    </p>
                  )}
                  {!stripeConnected ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={connectStripe}
                      className="w-full rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground signal-glow signal-ease"
                    >
                      Connect Stripe to get paid
                    </motion.button>
                  ) : availablePayout >= 5 ? (
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        const result = await requestPayout();
                        if (result.success) {
                          toast.success(`$${result.amount?.toFixed(2)} payout sent!`);
                        } else {
                          toast.error(result.error ?? "Payout failed");
                        }
                      }}
                      disabled={payingOut}
                      className="w-full rounded-full bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground signal-glow signal-ease disabled:opacity-50"
                    >
                      {payingOut ? "Processing..." : `Cash out $${availablePayout.toFixed(2)}`}
                    </motion.button>
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center">
                      Min. payout is $5.00 — keep dropping signals!
                    </p>
                  )}
                </div>
              )}

              {/* Referral */}
              {shareLink && (
                <div className="signal-surface rounded-xl p-4">
                  <p className="label-signal mb-2">🔗 Invite & Earn</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    You've referred <span className="text-foreground font-semibold">{referralCount}</span> embers
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      navigator.clipboard.writeText(shareLink).then(() => toast.success("Invite link copied!"));
                    }}
                    className="w-full rounded-full bg-primary/15 px-4 py-2.5 text-xs font-medium text-primary signal-ease hover:bg-primary/25"
                  >
                    Copy invite link
                  </motion.button>
                  <p className="text-[10px] text-muted-foreground text-center mt-2 font-mono-signal">{referralCode}</p>
                </div>
              )}

              <div className="flex justify-center mt-4 gap-3">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSignOut}
                  className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-destructive signal-ease"
                >
                  Sign Out
                </motion.button>
              </div>

              {/* Delete account */}
              <div className="flex justify-center mt-2">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[10px] text-muted-foreground/40 hover:text-destructive signal-ease"
                >
                  Delete my account
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Ignited / Fueling list overlay */}
      <AnimatePresence>
        {showingList && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={signalTransition}
          >
            <div className="flex items-center justify-between p-4">
              <button onClick={() => setShowingList(null)} className="text-muted-foreground">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <p className="label-signal">{showingList === "ignited" ? "embers you ignited" : "embers fueling you"}</p>
              <div className="w-5" />
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-24">
              {loadingList ? (
                <div className="flex justify-center py-12">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full"
                  />
                </div>
              ) : listEmbers.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground py-12">
                  {showingList === "ignited" ? "You haven't ignited anyone yet" : "No one is fueling you yet"}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {listEmbers.map((ember) => (
                    <motion.button
                      key={ember.user_id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedEmberId(ember.user_id)}
                      className="flex items-center gap-3 signal-surface rounded-xl p-3 text-left w-full signal-ease hover:ring-1 hover:ring-primary/20"
                    >
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden flex-shrink-0">
                        {ember.avatar_url ? (
                          <img src={ember.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-xs font-medium text-secondary-foreground">
                            {ember.display_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground truncate">{ember.display_name}</p>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground ml-auto flex-shrink-0">
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ember profile detail overlay */}
      <AnimatePresence>
        {selectedEmberId && (
          <motion.div key="ember-profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmberProfile userId={selectedEmberId} onClose={() => setSelectedEmberId(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interest picker overlay */}
      <AnimatePresence>
        {showInterestPicker && user && (
          <motion.div key="interest-picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <InterestPicker
              userId={user.id}
              currentInterests={myInterests}
              onSave={setMyInterests}
              onClose={() => setShowInterestPicker(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete account confirmation */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !deleting && setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-card p-6 flex flex-col items-center gap-4"
            >
              <span className="text-3xl">⚠️</span>
              <p className="text-sm font-medium text-foreground text-center">Delete your account?</p>
              <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                This permanently deletes all your data — signals, stitches, messages, follows, and your profile. This cannot be undone.
              </p>
              <div className="flex gap-3 mt-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="rounded-full bg-destructive px-6 py-3 text-sm font-medium text-destructive-foreground disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete Forever"}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="signal-surface rounded-full px-6 py-3 text-sm font-medium text-muted-foreground"
                >
                  Keep
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
