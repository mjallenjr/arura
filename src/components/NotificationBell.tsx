import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface NotifItem {
  id: string;
  type: string;
  from_user_id: string;
  word: string | null;
  read: boolean;
  created_at: string;
  from_name?: string;
}

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);

  const loadNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (!data) return;

    const fromIds = [...new Set(data.map((n) => n.from_user_id))];
    const { data: profiles } = await supabase
      .from("public_profiles")
      .select("user_id, display_name")
      .in("user_id", fromIds);

    const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

    const items = data.map((n) => ({
      ...n,
      from_name: nameMap.get(n.from_user_id) ?? "someone",
    }));

    setNotifications(items);
    setUnreadCount(items.filter((n) => !n.read).length);
  };

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    const channel = supabase
      .channel("bell-notifs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${user.id}`,
      }, () => {
        loadNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const getNotifText = (n: NotifItem) => {
    switch (n.type) {
      case "stitch": return `stitched "${n.word}" on your drop`;
      case "felt": return "felt your drop";
      case "follow": return "ignited you";
      case "dm": return `sent you a word`;
      case "heat_advisory": return `'s drop is rapidly rising — now 🔥 ${n.word?.toUpperCase()}`;
      default: return "interacted with your drop";
    }
  };

  return (
    <div className="relative">
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "No unread notifications"}
      </span>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) markAllRead();
        }}
        className="relative p-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-[8px] font-bold text-destructive-foreground flex items-center justify-center px-1"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[65]"
              onClick={() => setShowDropdown(false)}
            />
            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={signalTransition}
              className="absolute right-0 top-10 z-[66] w-72 max-h-80 overflow-y-auto signal-surface signal-blur rounded-2xl border border-border/30 shadow-xl"
            >
              <div className="p-3 border-b border-border/20 flex items-center justify-between">
                <span className="label-signal">notifications</span>
                <button
                  onClick={() => { setShowDropdown(false); navigate("/profile"); }}
                  className="text-[10px] text-primary font-medium"
                >
                  see all
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Nothing yet</p>
              ) : (
                <div className="flex flex-col">
                  {notifications.slice(0, 10).map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start gap-2.5 px-3 py-2.5 signal-ease hover:bg-muted/30 ${
                        !n.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        n.type === "heat_advisory" ? "bg-destructive/15" : "bg-primary/10"
                      }`}>
                        <span className={`text-[10px] ${n.type === "heat_advisory" ? "text-destructive" : "text-primary"}`}>
                          {n.type === "heat_advisory" ? "🔥" : "✦"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-foreground leading-snug">
                          <span className="font-medium">{n.from_name}</span>{" "}
                          {getNotifText(n)}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
