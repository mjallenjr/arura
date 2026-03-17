import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_PAYOUT = 5.00; // Minimum $5 payout

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Get user's Stripe Connect ID
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("stripe_connect_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.stripe_connect_id) {
      throw new Error("No connected Stripe account. Please connect your account first.");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Verify the connected account is fully onboarded
    const account = await stripe.accounts.retrieve(profile.stripe_connect_id);
    if (!account.charges_enabled || !account.payouts_enabled) {
      throw new Error("Your Stripe account setup is incomplete. Please finish onboarding.");
    }

    // Calculate available earnings
    const { data: signals } = await supabaseClient
      .from("signals")
      .select("id")
      .eq("user_id", user.id);

    if (!signals || signals.length === 0) {
      throw new Error("No signals found — no earnings to pay out.");
    }

    const { count } = await supabaseClient
      .from("signal_views")
      .select("id", { count: "exact", head: true })
      .in("signal_id", signals.map(s => s.id));

    const viewCount = count ?? 0;
    const estImpressions = Math.floor(viewCount * 0.25);
    const creatorShare = estImpressions * 0.005 * 0.30;

    // Subtract already-paid amounts
    const { data: paidPayouts } = await supabaseClient
      .from("creator_payouts")
      .select("amount")
      .eq("user_id", user.id)
      .in("status", ["pending", "paid"]);

    const alreadyPaid = (paidPayouts ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
    const available = Math.max(0, creatorShare - alreadyPaid);

    if (available < MIN_PAYOUT) {
      throw new Error(`Minimum payout is $${MIN_PAYOUT.toFixed(2)}. You have $${available.toFixed(2)} available.`);
    }

    // Round to cents
    const amountCents = Math.floor(available * 100);

    // Create a transfer to the connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: "usd",
      destination: profile.stripe_connect_id,
      description: `arura creator payout for ${user.id}`,
    });

    // Record the payout
    await supabaseClient.from("creator_payouts").insert({
      user_id: user.id,
      amount: available,
      status: "paid",
      stripe_transfer_id: transfer.id,
      processed_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      amount: available,
      transfer_id: transfer.id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
