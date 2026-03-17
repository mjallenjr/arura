import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCreatorEarnings() {
  const { user, session } = useAuth();
  const [impressions, setImpressions] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [creatorShare, setCreatorShare] = useState(0);
  const [paidOut, setPaidOut] = useState(0);
  const [available, setAvailable] = useState(0);
  const [stripeConnected, setStripeConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payingOut, setPayingOut] = useState(false);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [signalsRes, profileRes, payoutsRes] = await Promise.all([
        supabase.from("signals").select("id").eq("user_id", user.id),
        supabase.from("profiles").select("stripe_connect_id").eq("user_id", user.id).single(),
        supabase.from("creator_payouts").select("amount, status").eq("user_id", user.id),
      ]);

      setStripeConnected(!!profileRes.data?.stripe_connect_id);

      const signals = signalsRes.data ?? [];
      if (signals.length === 0) {
        setLoading(false);
        return;
      }

      const { count } = await supabase
        .from("signal_views")
        .select("id", { count: "exact", head: true })
        .in("signal_id", signals.map(s => s.id));

      const viewCount = count ?? 0;
      const estImpressions = Math.floor(viewCount * 0.25);
      const estRevenue = estImpressions * 0.005;
      const share = estRevenue * 0.30;

      const paid = (payoutsRes.data ?? [])
        .filter(p => p.status === "paid" || p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount), 0);

      setImpressions(estImpressions);
      setRevenue(estRevenue);
      setCreatorShare(share);
      setPaidOut(paid);
      setAvailable(Math.max(0, share - paid));
      setLoading(false);
    };
    load();
  }, [user]);

  const connectStripe = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const { data, error } = await supabase.functions.invoke("connect-stripe-account", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (e) {
      console.error("Failed to start Stripe Connect onboarding", e);
    }
  }, [session?.access_token]);

  const requestPayout = useCallback(async () => {
    if (!session?.access_token) return { success: false, error: "Not authenticated" };
    setPayingOut(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-payout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Update local state
      setPaidOut(prev => prev + (data.amount ?? 0));
      setAvailable(0);
      setPayingOut(false);
      return { success: true, amount: data.amount };
    } catch (e: any) {
      setPayingOut(false);
      return { success: false, error: e.message ?? "Payout failed" };
    }
  }, [session?.access_token]);

  return {
    impressions,
    revenue,
    creatorShare,
    paidOut,
    available,
    stripeConnected,
    loading,
    payingOut,
    connectStripe,
    requestPayout,
  };
}
