import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ReferralReward {
  tier: "none" | "spark" | "flame" | "inferno" | "eternal";
  label: string;
  bonusMinutes: number; // extra signal duration
  nextTierAt: number;   // referrals needed for next tier
}

const REWARD_TIERS: { min: number; tier: ReferralReward["tier"]; label: string; bonusMinutes: number }[] = [
  { min: 25, tier: "eternal",  label: "Eternal Flame",  bonusMinutes: 120 },
  { min: 10, tier: "inferno",  label: "Inferno Spark",  bonusMinutes: 60 },
  { min: 5,  tier: "flame",    label: "Flame Carrier",  bonusMinutes: 30 },
  { min: 1,  tier: "spark",    label: "First Spark",    bonusMinutes: 15 },
];

function getReward(count: number): ReferralReward {
  for (const t of REWARD_TIERS) {
    if (count >= t.min) {
      const nextTier = REWARD_TIERS[REWARD_TIERS.indexOf(t) - 1];
      return {
        tier: t.tier,
        label: t.label,
        bonusMinutes: t.bonusMinutes,
        nextTierAt: nextTier ? nextTier.min : t.min,
      };
    }
  }
  return { tier: "none", label: "", bonusMinutes: 0, nextTierAt: 1 };
}

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

    const { data: referrer } = await supabase
      .from("public_profiles")
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

  const reward = getReward(referralCount);

  const shareLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : null;

  return { referralCode, referralCount, shareLink, claimReferral, loading, reward };
}
