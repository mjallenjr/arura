import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    // Find expired signals with storage paths
    const { data: expired, error: fetchErr } = await supabase
      .from("signals")
      .select("id, storage_path")
      .lt("expires_at", new Date().toISOString())
      .not("storage_path", "is", null)
      .limit(100);

    if (fetchErr) throw fetchErr;
    if (!expired || expired.length === 0) {
      return new Response(JSON.stringify({ deleted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete storage files
    const paths = expired.map((s) => s.storage_path!);
    const { error: storageErr } = await supabase.storage.from("signals").remove(paths);
    if (storageErr) console.error("Storage delete error:", storageErr);

    // Null out storage_path so we don't retry
    const ids = expired.map((s) => s.id);
    const { error: updateErr } = await supabase
      .from("signals")
      .update({ storage_path: null })
      .in("id", ids);
    if (updateErr) console.error("Update error:", updateErr);

    // Delete the expired signal rows entirely
    const { error: deleteErr } = await supabase
      .from("signals")
      .delete()
      .in("id", ids);
    if (deleteErr) console.error("Delete error:", deleteErr);

    console.log(`[CLEANUP] Deleted ${paths.length} expired signal files`);

    return new Response(JSON.stringify({ deleted: paths.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[CLEANUP] Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
