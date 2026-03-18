import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import FeedPlayer from "@/components/feed/FeedPlayer";
import HeatBadge from "@/components/feed/HeatBadge";

const signalTransition = { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as const };

interface SignalData {
  id: string;
  type: string;
  storage_path: string | null;
  stitch_word: string | null;
  stitch_word_pos: any;
  heat_level: string;
  created_at: string;
  expires_at: string;
  user_id: string;
}

const SignalView = () => {
  const { signalId } = useParams<{ signalId: string }>();
  const [signal, setSignal] = useState<SignalData | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [authorName, setAuthorName] = useState("someone");
  const [loading, setLoading] = useState(true);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!signalId) return;
    const load = async () => {
      // Use service-level access via anon key — signal must be active
      const { data, error } = await supabase
        .from("signals")
        .select("*")
        .eq("id", signalId)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        setExpired(true);
        setLoading(false);
        return;
      }

      setSignal(data as SignalData);

      if (data.storage_path) {
        const { data: urlData } = supabase.storage.from("signals").getPublicUrl(data.storage_path);
        setMediaUrl(urlData.publicUrl);
      }

      // Get author name
      const { data: profile } = await supabase.rpc("get_public_profile", { p_user_id: data.user_id });
      if (profile && profile.length > 0) {
        setAuthorName(profile[0].display_name || "someone");
      }

      setLoading(false);
    };
    load();
  }, [signalId]);

  if (loading) {
    return (
      <div className="flex h-svh items-center justify-center bg-background">
        <p className="label-signal animate-pulse">loading signal...</p>
      </div>
    );
  }

  if (expired || !signal) {
    return (
      <div className="flex h-svh flex-col items-center justify-center bg-background gap-4 px-8">
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="text-muted-foreground opacity-30">
          <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
            stroke="currentColor" strokeWidth="1.5" fill="none" />
        </svg>
        <p className="text-sm text-muted-foreground text-center">This signal has burned out</p>
        <a href="/home" className="text-xs text-primary hover:underline">Open arura</a>
      </div>
    );
  }

  return (
    <div className="relative h-svh w-full bg-background overflow-hidden">
      <FeedPlayer signalId={signal.id} mediaUrl={mediaUrl} type={signal.type} />

      {/* Stitch word */}
      {signal.stitch_word && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...signalTransition, delay: 0.2 }}
            className="absolute text-4xl font-bold tracking-tight text-foreground"
            style={{
              left: signal.stitch_word_pos ? `${signal.stitch_word_pos.x}%` : "50%",
              top: signal.stitch_word_pos ? `${signal.stitch_word_pos.y}%` : "50%",
              transform: `translate(-50%, -50%) scale(${signal.stitch_word_pos?.scale ?? 1}) rotate(${signal.stitch_word_pos?.rotation ?? -2}deg)`,
              textShadow: "0 0 20px hsl(var(--primary) / 0.4), 0 2px 8px rgba(0,0,0,0.6)",
              fontStyle: "italic",
            }}
          >
            {signal.stitch_word}
          </motion.p>
        </div>
      )}

      {/* Bottom info */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-8">
        <div className="flex items-center gap-2 mb-2">
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 0.6, y: 0 }}
            transition={signalTransition}
            className="label-signal"
          >
            {authorName}
          </motion.p>
          {signal.heat_level !== "match" && (
            <HeatBadge level={signal.heat_level} />
          )}
        </div>
        <a
          href="/home"
          className="inline-block mt-2 rounded-full bg-primary px-5 py-2 text-xs font-medium text-primary-foreground signal-glow"
        >
          Open in arura
        </a>
      </div>

      {/* Top branding */}
      <div className="absolute top-4 left-4 z-20">
        <a href="/home" className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="text-primary">
            <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
              fill="currentColor" opacity="0.3" />
            <path d="M16 7c-1.2 4.8-4.8 7.2-4.8 12a7.2 7.2 0 0014.4 0c0-4.8-3.6-7.2-4.8-12-1.2 2.4-3.6 3.6-4.8 0z"
              stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          <span className="text-sm font-medium text-foreground tracking-[-0.04em]">arura</span>
        </a>
      </div>
    </div>
  );
};

export default SignalView;
