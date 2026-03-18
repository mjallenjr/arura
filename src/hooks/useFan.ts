import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function useFan() {
  const { user } = useAuth();
  const [fanCounts, setFanCounts] = useState<Record<string, number>>({});
  const [fanning, setFanning] = useState(false);
  const [sparkedCache, setSparkedCache] = useState<Record<string, boolean>>({});

  /** Bulk check which IDs are mutual follows — single DB call */
  const checkSparkedBulk = useCallback(
    async (candidateIds: string[]): Promise<Record<string, boolean>> => {
      if (!user || candidateIds.length === 0) return {};

      // Return cached results for already-checked IDs
      const uncached = candidateIds.filter((id) => !(id in sparkedCache));
      let newResults: Record<string, boolean> = {};

      if (uncached.length > 0) {
        const { data } = await supabase.rpc("get_mutual_follow_ids", {
          p_user_id: user.id,
          p_candidate_ids: uncached,
        });
        const mutualIds = new Set<string>((data as string[]) ?? []);
        uncached.forEach((id) => {
          newResults[id] = mutualIds.has(id);
        });
        setSparkedCache((prev) => ({ ...prev, ...newResults }));
      }

      // Merge cached + new
      const result: Record<string, boolean> = {};
      candidateIds.forEach((id) => {
        result[id] = sparkedCache[id] ?? newResults[id] ?? false;
      });
      return result;
    },
    [user, sparkedCache]
  );

  /** Single ID check — uses cache or falls back to bulk */
  const checkSparked = useCallback(
    async (recipientId: string): Promise<boolean> => {
      if (recipientId in sparkedCache) return sparkedCache[recipientId];
      const result = await checkSparkedBulk([recipientId]);
      return result[recipientId] ?? false;
    },
    [sparkedCache, checkSparkedBulk]
  );

  /** Get how many times the current user has fanned a specific flare */
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

  /** Fan a flare to another ember — caller handles ad gate */
  const fanFlare = useCallback(
    async (
      signalId: string,
      recipientId: string,
      recipientName: string,
      expiresAt?: string
    ): Promise<boolean> => {
      if (!user || fanning) return false;

      // Expiry guard — can't fan ash
      if (expiresAt && new Date(expiresAt) <= new Date()) {
        toast("This flare has turned to ash", { duration: 3000 });
        return false;
      }

      setFanning(true);

      try {
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
          [signalId]: (prev[signalId] ?? 0) + 1,
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
    [user, fanning]
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

  return {
    fanFlare,
    getFanCount,
    fetchFannedFlares,
    checkSparked,
    checkSparkedBulk,
    fanCounts,
    fanning,
  };
}
