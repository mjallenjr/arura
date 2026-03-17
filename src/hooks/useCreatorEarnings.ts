import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCreatorEarnings() {
  const { user } = useAuth();
  const [impressions, setImpressions] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [creatorShare, setCreatorShare] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Get impressions on signals where this user's content was shown
      // (ad placed adjacent to their signal in feed)
      const { data: mySignals } = await supabase
        .from("signals")
        .select("id")
        .eq("user_id", user.id);

      if (!mySignals || mySignals.length === 0) {
        setLoading(false);
        return;
      }

      // Count total impressions logged by viewers of their signals
      const { count } = await supabase
        .from("signal_views")
        .select("id", { count: "exact", head: true })
        .in("signal_id", mySignals.map(s => s.id));

      const viewCount = count ?? 0;
      // Estimate: ~25% of signal views generate an ad impression at $0.005 CPM
      const estImpressions = Math.floor(viewCount * 0.25);
      const estRevenue = estImpressions * 0.005;
      const share = estRevenue * 0.30; // 30% creator share

      setImpressions(estImpressions);
      setRevenue(estRevenue);
      setCreatorShare(share);
      setLoading(false);
    };
    load();
  }, [user]);

  return { impressions, revenue, creatorShare, loading };
}
