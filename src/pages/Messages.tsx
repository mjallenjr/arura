import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface Conversation {
  user_id: string;
  display_name: string;
  last_word: string;
  last_at: string;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  word: string;
  created_at: string;
  read_at: string | null;
}

const Messages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [word, setWord] = useState("");
  const [followers, setFollowers] = useState<{ user_id: string; display_name: string }[]>([]);
  const [showNewDm, setShowNewDm] = useState(false);

  // Handle deep-link from ember profile
  useEffect(() => {
    const dmUserId = searchParams.get("dm");
    const dmName = searchParams.get("name");
    if (dmUserId && dmName) {
      setSelectedUserId(dmUserId);
      setSelectedName(decodeURIComponent(dmName));
    }
  }, [searchParams]);

  // Load conversations
  useEffect(() => {
    if (!user) return;

    const loadConversations = async () => {
      const { data: dms } = await supabase
        .from("direct_messages")
        .select("*")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!dms || dms.length === 0) {
        setConversations([]);
        return;
      }

      // Group by other user
      const convMap = new Map<string, { last_word: string; last_at: string; unread: number }>();
      for (const dm of dms) {
        const otherId = dm.sender_id === user.id ? dm.receiver_id : dm.sender_id;
        if (!convMap.has(otherId)) {
          convMap.set(otherId, {
            last_word: dm.word,
            last_at: dm.created_at,
            unread: 0,
          });
        }
        if (dm.receiver_id === user.id && !dm.read_at) {
          const c = convMap.get(otherId)!;
          c.unread++;
        }
      }

      // Get names
      const ids = [...convMap.keys()];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);

      const nameMap = new Map(profiles?.map((p) => [p.user_id, p.display_name]) ?? []);

      const convos: Conversation[] = ids.map((id) => ({
        user_id: id,
        display_name: nameMap.get(id) ?? "unknown",
        ...convMap.get(id)!,
      }));

      convos.sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());
      setConversations(convos);
    };

    loadConversations();

    // Realtime subscription
    const channel = supabase
      .channel("dm-updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, () => {
        loadConversations();
        // Also refresh messages if in a conversation
        if (selectedUserId) loadMessages(selectedUserId);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedUserId]);

  const loadMessages = useCallback(async (otherId: string) => {
    if (!user) return;

    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true });

    setMessages(data ?? []);

    // Mark received messages as read
    if (data) {
      const unreadIds = data
        .filter((m) => m.receiver_id === user.id && !m.read_at)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        await supabase
          .from("direct_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unreadIds);
      }
    }
  }, [user]);

  const openConversation = useCallback((userId: string, name: string) => {
    setSelectedUserId(userId);
    setSelectedName(name);
    loadMessages(userId);
  }, [loadMessages]);

  const sendWord = useCallback(async () => {
    if (!user || !selectedUserId || !word.trim()) return;
    const cleaned = word.replace(/\s/g, "").slice(0, 12);
    if (!cleaned) return;

    const { error } = await supabase.from("direct_messages").insert({
      sender_id: user.id,
      receiver_id: selectedUserId,
      word: cleaned,
    });

    if (error) {
      toast.error("Can't send — start a conversation first");
    } else {
      setWord("");
      loadMessages(selectedUserId);
    }
  }, [user, selectedUserId, word, loadMessages]);

  // Load followers for new DM
  const loadFollowers = useCallback(async () => {
    if (!user) return;
    const { data: followData } = await supabase
      .from("follows")
      .select("follower_id")
      .eq("following_id", user.id);

    if (!followData || followData.length === 0) {
      setFollowers([]);
      return;
    }

    const ids = followData.map((f) => f.follower_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", ids);

    setFollowers(profiles ?? []);
  }, [user]);

  // Conversation thread view
  if (selectedUserId) {
    return (
      <div className="flex h-svh w-full flex-col bg-background">
        <div className="flex items-center justify-between p-4">
          <button onClick={() => setSelectedUserId(null)} className="text-muted-foreground">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <p className="label-signal">{selectedName}</p>
          <div className="w-5" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-32">
          <div className="flex flex-col gap-3 pt-4">
            {messages.map((msg) => {
              const isMine = msg.sender_id === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`rounded-2xl px-5 py-3 text-lg font-medium tracking-tight ${
                      isMine
                        ? "bg-primary text-primary-foreground"
                        : "signal-surface text-foreground"
                    }`}
                  >
                    {msg.word}
                  </div>
                </motion.div>
              );
            })}
            {messages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-12">
                Send a word to start.
              </p>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-safe bg-background/80 signal-blur">
          <div className="flex items-center gap-2 signal-surface rounded-2xl px-4 py-2">
            <input
              type="text"
              placeholder="one word"
              value={word}
              onChange={(e) => setWord(e.target.value.replace(/\s/g, "").slice(0, 12))}
              maxLength={12}
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              onKeyDown={(e) => e.key === "Enter" && sendWord()}
            />
            <button
              onClick={sendWord}
              disabled={!word.trim()}
              className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-30"
            >
              send
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations list view
  return (
    <div className="flex h-svh w-full flex-col bg-background">
      <div className="flex items-center justify-between p-4">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <p className="label-signal">words</p>
        <button
          onClick={() => {
            setShowNewDm(true);
            loadFollowers();
          }}
          className="text-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {/* New DM picker */}
        <AnimatePresence>
          {showNewDm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <p className="label-signal mb-2">Your followers</p>
              <div className="flex flex-col gap-2">
                {followers.map((f) => (
                  <motion.button
                    key={f.user_id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setShowNewDm(false);
                      openConversation(f.user_id, f.display_name);
                    }}
                    className="flex items-center gap-3 signal-surface rounded-xl p-3 text-left"
                  >
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                      <span className="text-xs font-medium text-secondary-foreground">
                        {f.display_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{f.display_name}</span>
                  </motion.button>
                ))}
                {followers.length === 0 && (
                  <p className="text-xs text-muted-foreground py-4 text-center">No followers yet</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Existing conversations */}
        <div className="flex flex-col gap-2">
          {conversations.map((c) => (
            <motion.button
              key={c.user_id}
              whileTap={{ scale: 0.98 }}
              onClick={() => openConversation(c.user_id, c.display_name)}
              className="flex items-center justify-between signal-surface rounded-xl p-3 text-left"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-medium text-secondary-foreground">
                    {c.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{c.display_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.last_word}</p>
                </div>
              </div>
              {c.unread > 0 && (
                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                  {c.unread}
                </span>
              )}
            </motion.button>
          ))}
          {conversations.length === 0 && !showNewDm && (
            <div className="flex flex-col items-center gap-4 py-16">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setShowNewDm(true);
                  loadFollowers();
                }}
                className="rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground"
              >
                Start a conversation
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;
