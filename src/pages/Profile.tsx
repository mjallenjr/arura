import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

const Profile = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [signalsCount, setSignalsCount] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, followersRes, followingRes, signalsRes] = await Promise.all([
        supabase.from("profiles").select("display_name, phone").eq("user_id", user.id).single(),
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

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, phone: phone || null })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save");
    } else {
      toast.success("Saved");
    }
    setSaving(false);
  }, [user, displayName, phone]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/auth");
  }, [signOut, navigate]);

  const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

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
          className="flex flex-col items-center gap-4 pt-4 pb-8"
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
          className="grid grid-cols-3 gap-3 mb-8"
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

        {/* Edit fields */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...signalTransition, delay: 0.2 }}
          className="flex flex-col gap-4 mb-8"
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
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...signalTransition, delay: 0.3 }}
          className="flex justify-center"
        >
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSignOut}
            className="signal-surface signal-blur rounded-full px-8 py-3 text-sm font-medium text-destructive signal-ease"
          >
            Sign Out
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
