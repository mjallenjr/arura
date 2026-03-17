import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface SubscriptionState {
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false,
    subscriptionEnd: null,
    loading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!session?.access_token) {
      setState({ subscribed: false, subscriptionEnd: null, loading: false });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        subscriptionEnd: data.subscription_end ?? null,
        loading: false,
      });
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [session?.access_token]);

  useEffect(() => {
    checkSubscription();
    // Re-check every 60 seconds
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startCheckout = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      console.error("Failed to start checkout");
    }
  }, [session?.access_token]);

  const openPortal = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch {
      console.error("Failed to open portal");
    }
  }, [session?.access_token]);

  return {
    ...state,
    checkSubscription,
    startCheckout,
    openPortal,
    isPro: state.subscribed,
  };
}
