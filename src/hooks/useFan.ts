import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAds } from "@/hooks/useAds";
import { toast } from "sonner";

interface UseFanOptions {
  onAdRequired?: () => Promise<boolean>; // returns true if ad was watched
}

export function useFan({ onAdRequired }: UseFanOptions = {}) {
  const { user } = useAuth();
  const { fetchTargetedAd } = useAds();
  const [fanCounts, setFanCounts] = useState<Record<string, number>>({});
  const [fanning, setFanning] = useState(false);

  /** Get how many times the current user has fanned a specific signal */
  const getFanCount = useCallback(
    async (signalId: string): Promise<number> => {
      if (!user) return 0;
      const { count } = await supabase
        .from("fans")
        .select("*", { count: "exact", head: true })
        .eq("signal_id", signalId)
        .eq("sender_id", user.id);
      const c = count ?? 0;
      setFanCounts((prev) => ({ ...prev, [signalId]: c }));
      return c;
    },
    [user]
  );

  /** Fan a flare to another ember */
  const fanFlare = useCallback(
    async (signalId: string, recipientId: string, recipientName: string): Promise<boolean> => {
      if (!user || fanning) return false;
      setFanning(true);

      try {
        // Check current fan count for this signal
        let count = fanCounts[signalId] ?? (await getFanCount(signalId));

        // Ad gate: 3rd+ fan requires watching an ad
        if (count >= 2) {
          if (onAdRequired) {
            const watched = await onAdRequired();
            if (!watched) {
              toast("Watch a quick ad to fan again", { duration: 3000 });
              setFanning(false);
              return false;
            }
          } else {
            // Fetch and "show" an ad impression
            const ad = await fetchTargetedAd(user.id, "fan_gate");
            if (!ad) {
              toast("No ads available — try again later", { duration: 3000 });
              setFanning(false);
              return false;
            }
          }
        }

        // Insert fan record
        const { error: fanError } = await supabase.from("fans").insert({
          signal_id: signalId,
          sender_id: user.id,
          recipient_id: recipientId,
        } as any);

        if (fanError) {
          if (fanError.code === "23505") {
            toast("Already fanned to this ember");
          } else {
            toast.error("Couldn't fan — try again");
          }
          setFanning(false);
          return false;
        }

        // Send notification
        await supabase.from("notifications").insert({
          user_id: recipientId,
          from_user_id: user.id,
          signal_id: signalId,
          type: "fan",
        } as any);

        setFanCounts((prev) => ({
          ...prev,
          [signalId]: (prev[signalId] ?? count) + 1,
        }));

        toast.success(`Fanned to ${recipientName}`);
        setFanning(false);
        return true;
      } catch {
        toast.error("Couldn't fan — try again");
        setFanning(false);
        return false;
      }
    },
    [user, fanning, fanCounts, getFanCount, fetchTargetedAd, onAdRequired]
  );

  /** Get flares fanned to the current user (for feed integration) */
  const fetchFannedFlares = useCallback(async (): Promise<string[]> => {
    if (!user) return [];
    const { data } = await supabase
      .from("fans")
      .select("signal_id")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    return data?.map((f: any) => f.signal_id) ?? [];
  }, [user]);

  return { fanFlare, getFanCount, fetchFannedFlares, fanCounts, fanning };
}
