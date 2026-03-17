import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useReferral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const [profileRes, countRes] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("user_id", user.id).single(),
        supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id),
      ]);

      setReferralCode((profileRes.data as any)?.referral_code ?? null);
      setReferralCount(countRes.count ?? 0);
      setLoading(false);
    };
    load();
  }, [user]);

  const claimReferral = useCallback(async (code: string) => {
    if (!user) return false;

    // Find referrer by code
    const { data: referrer } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("referral_code", code)
      .single();

    if (!referrer || (referrer as any).user_id === user.id) return false;

    const { error } = await supabase.from("referrals").insert({
      referrer_id: (referrer as any).user_id,
      referred_id: user.id,
      code,
    });

    return !error;
  }, [user]);

  const shareLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : null;

  return { referralCode, referralCount, shareLink, claimReferral, loading };
}
