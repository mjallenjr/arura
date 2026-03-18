import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Push-driven re-engagement notifications.
 * Called periodically to notify users about:
 * - New embers joining their vibes
 * - Signals heating up (level changes)
 * - Activity on their drops
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // 1. Update heat levels
    await supabase.rpc("update_signal_heat_levels");

    // 2. Find signals that leveled up recently (last 15 min)
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data: hotSignals } = await supabase
      .from("signals")
      .select("id, user_id, heat_level, stitch_word")
      .gt("expires_at", new Date().toISOString())
      .in("heat_level", ["hot", "burning", "raging", "inferno", "star"])
      .gt("last_engagement_at", fifteenMinAgo)
      .limit(20);

    if (!hotSignals || hotSignals.length === 0) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Send push notifications for heating signals
    let notified = 0;
    for (const signal of hotSignals) {
      const levelLabel = signal.heat_level === "star" ? "⭐ STAR" : `🔥 ${signal.heat_level?.toUpperCase()}`;
      const body = signal.stitch_word
        ? `Your drop "${signal.stitch_word}" is now ${levelLabel}!`
        : `Your drop just hit ${levelLabel}! Keep it lit.`;

      // Send push via send-push function
      try {
        await supabase.functions.invoke("send-push", {
          body: {
            user_id: signal.user_id,
            title: "Your signal is heating up 🔥",
            body,
            url: "/",
          },
        });
        notified++;
      } catch (e) {
        console.error("Push send error:", e);
      }
    }

    // 4. Notify users about new embers in their top vibes (weekly digest)
    // Only run on Mondays
    const now = new Date();
    if (now.getUTCDay() === 1 && now.getUTCHours() === 12) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, interests")
        .not("interests", "is", null)
        .limit(100);

      if (profiles) {
        for (const profile of profiles) {
          const interests = profile.interests ?? [];
          if (interests.length === 0) continue;
          const topVibe = interests[0];
          
          // Count embers for this vibe
          const { count } = await supabase
            .from("profiles")
            .select("*", { count: "exact", head: true })
            .contains("interests", [topVibe]);

          if (count && count > 1) {
            try {
              await supabase.functions.invoke("send-push", {
                body: {
                  user_id: profile.user_id,
                  title: `${topVibe} is growing`,
                  body: `${count} embers share your "${topVibe}" vibe. See who's new.`,
                  url: "/discover",
                },
              });
            } catch { /* skip */ }
          }
        }
      }
    }

    return new Response(JSON.stringify({ processed: notified }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
