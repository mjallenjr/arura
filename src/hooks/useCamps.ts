import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Camp {
  id: string;
  vibe: string;
  name: string | null;
  status: string;
  ranger_id: string | null;
  member_count: number;
  created_at: string;
  isMember?: boolean;
  rangerName?: string;
}

export function useCamps() {
  const { user } = useAuth();
  const [myCamps, setMyCamps] = useState<Camp[]>([]);
  const [warmingUp, setWarmingUp] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCamps = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get user's memberships
    const { data: memberships } = await supabase
      .from("camp_members")
      .select("camp_id")
      .eq("user_id", user.id);

    const memberCampIds = new Set(memberships?.map((m: any) => m.camp_id) ?? []);

    // Get all camps
    const { data: allCamps } = await supabase
      .from("camps")
      .select("*")
      .order("member_count", { ascending: false });

    if (!allCamps) {
      setLoading(false);
      return;
    }

    // Get ranger names for bonfires
    const rangerIds = allCamps
      .filter((c: any) => c.ranger_id)
      .map((c: any) => c.ranger_id);

    let rangerNameMap = new Map<string, string>();
    if (rangerIds.length > 0) {
      const { data: profiles } = await supabase
        .from("public_profiles")
        .select("user_id, display_name")
        .in("user_id", rangerIds);
      rangerNameMap = new Map(profiles?.map((p: any) => [p.user_id, p.display_name]) ?? []);
    }

    const mine: Camp[] = [];
    const warming: Camp[] = [];

    for (const c of allCamps as any[]) {
      const camp: Camp = {
        ...c,
        isMember: memberCampIds.has(c.id),
        rangerName: c.ranger_id ? rangerNameMap.get(c.ranger_id) ?? undefined : undefined,
      };
      if (camp.isMember) {
        mine.push(camp);
      } else {
        warming.push(camp);
      }
    }

    setMyCamps(mine);
    setWarmingUp(warming);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  const syncCamps = useCallback(async () => {
    if (!user) return;
    await supabase.rpc("sync_camps_for_user", { p_user_id: user.id });
    await fetchCamps();
  }, [user, fetchCamps]);

  const nameCamp = useCallback(async (campId: string, name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length > 3 || words.length === 0) {
      toast.error("Camp name must be 1-3 words");
      return false;
    }
    const { error } = await supabase
      .from("camps")
      .update({ name: name.trim() })
      .eq("id", campId);
    if (error) {
      toast.error("Couldn't name this campground");
      return false;
    }
    toast.success("Campground named!");
    await fetchCamps();
    return true;
  }, [fetchCamps]);

  const getFomoCamps = useCallback(async (): Promise<Camp[]> => {
    if (!user) return [];
    const { data: memberships } = await supabase
      .from("camp_members")
      .select("camp_id")
      .eq("user_id", user.id);
    const memberIds = new Set(memberships?.map((m: any) => m.camp_id) ?? []);

    const { data: camps } = await supabase
      .from("camps")
      .select("*")
      .gte("member_count", 5)
      .order("member_count", { ascending: false })
      .limit(5);

    return (camps ?? [])
      .filter((c: any) => !memberIds.has(c.id))
      .map((c: any) => ({ ...c, isMember: false }));
  }, [user]);

  return { myCamps, warmingUp, loading, syncCamps, nameCamp, fetchCamps, getFomoCamps };
}
