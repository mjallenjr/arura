import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useBlocks() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id)
      .then(({ data }) => {
        setBlockedIds(new Set(data?.map(b => b.blocked_id) ?? []));
      });
  }, [user]);

  const isBlocked = (userId: string) => blockedIds.has(userId);

  const refreshBlocks = async () => {
    if (!user) return;
    const { data } = await supabase.from("blocks").select("blocked_id").eq("blocker_id", user.id);
    setBlockedIds(new Set(data?.map(b => b.blocked_id) ?? []));
  };

  return { blockedIds, isBlocked, refreshBlocks };
}
