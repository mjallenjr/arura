import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the user
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all user data in order (respecting foreign keys)
    const tables = [
      { table: "ad_impressions", column: "user_id" },
      { table: "felts", column: "user_id" },
      { table: "stitches", column: "user_id" },
      { table: "signal_views", column: "user_id" },
      { table: "signal_owner_views", column: "user_id" },
      { table: "notifications", column: "user_id" },
      { table: "notifications", column: "from_user_id" },
      { table: "direct_messages", column: "sender_id" },
      { table: "direct_messages", column: "receiver_id" },
      { table: "follows", column: "follower_id" },
      { table: "follows", column: "following_id" },
      { table: "reports", column: "reporter_id" },
      { table: "reports", column: "reported_user_id" },
      { table: "blocks", column: "blocker_id" },
      { table: "blocks", column: "blocked_id" },
      { table: "signals", column: "user_id" },
      { table: "profiles", column: "user_id" },
      { table: "user_roles", column: "user_id" },
    ];

    for (const { table, column } of tables) {
      await adminClient.from(table).delete().eq(column, userId);
    }

    // Delete storage files
    const { data: signalFiles } = await adminClient.storage.from("signals").list(userId);
    if (signalFiles && signalFiles.length > 0) {
      await adminClient.storage.from("signals").remove(signalFiles.map(f => `${userId}/${f.name}`));
    }

    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      await adminClient.storage.from("avatars").remove(avatarFiles.map(f => `${userId}/${f.name}`));
    }

    // Delete auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
