import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Flame, Crown, Users, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { resolveMediaUrl } from "@/lib/feed-types";

interface CampData {
  id: string;
  vibe: string;
  name: string | null;
  status: string;
  ranger_id: string | null;
  member_count: number;
}

interface CampMember {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  contribution_score: number;
  isRanger: boolean;
}

interface CampFlare {
  id: string;
  signal_id: string;
  user_id: string;
  created_at: string;
  display_name: string;
  media_url: string | null;
  type: string;
}

const CampDetail = () => {
  const { campId } = useParams<{ campId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [camp, setCamp] = useState<CampData | null>(null);
  const [members, setMembers] = useState<CampMember[]>([]);
  const [flares, setFlares] = useState<CampFlare[]>([]);
  const [loading, setLoading] = useState(true);
  const [naming, setNaming] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const isRanger = user && camp?.ranger_id === user.id;
  const isBonfire = camp?.status === "bonfire";

  const fetchCampData = useCallback(async () => {
    if (!campId) return;

    const [campRes, membersRes, flaresRes] = await Promise.all([
      supabase.from("camps").select("*").eq("id", campId).single(),
      supabase.from("camp_members").select("user_id, contribution_score").eq("camp_id", campId).order("contribution_score", { ascending: false }),
      supabase.from("camp_flares").select("id, signal_id, user_id, created_at").eq("camp_id", campId).order("created_at", { ascending: false }).limit(30),
    ]);

    if (campRes.data) setCamp(campRes.data as any);

    // Resolve member profiles
    if (membersRes.data && membersRes.data.length > 0) {
      const userIds = membersRes.data.map((m: any) => m.user_id);
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name, avatar_url").in("user_id", userIds);
      const profileMap = new Map(profiles?.map((p: any) => [p.user_id, p]) ?? []);

      setMembers(membersRes.data.map((m: any) => ({
        user_id: m.user_id,
        display_name: profileMap.get(m.user_id)?.display_name ?? "unknown",
        avatar_url: profileMap.get(m.user_id)?.avatar_url ?? null,
        contribution_score: m.contribution_score,
        isRanger: campRes.data?.ranger_id === m.user_id,
      })));
    }

    // Resolve flare signals
    if (flaresRes.data && flaresRes.data.length > 0) {
      const signalIds = flaresRes.data.map((f: any) => f.signal_id);
      const authorIds = [...new Set(flaresRes.data.map((f: any) => f.user_id))];

      const [signalsRes, profilesRes] = await Promise.all([
        supabase.from("signals").select("id, type, storage_path, media_url").in("id", signalIds),
        supabase.from("public_profiles").select("user_id, display_name").in("user_id", authorIds),
      ]);

      const signalMap = new Map(signalsRes.data?.map((s: any) => [s.id, s]) ?? []);
      const nameMap = new Map(profilesRes.data?.map((p: any) => [p.user_id, p.display_name]) ?? []);

      setFlares(flaresRes.data.map((f: any) => {
        const signal = signalMap.get(f.signal_id);
        return {
          id: f.id,
          signal_id: f.signal_id,
          user_id: f.user_id,
          created_at: f.created_at,
          display_name: nameMap.get(f.user_id) ?? "unknown",
          media_url: signal?.storage_path ? resolveMediaUrl(signal.storage_path) : signal?.media_url ?? null,
          type: signal?.type ?? "photo",
        };
      }));
    }

    setLoading(false);
  }, [campId]);

  useEffect(() => {
    fetchCampData();
  }, [fetchCampData]);

  const handleNameCamp = async () => {
    if (!campId) return;
    const words = nameInput.trim().split(/\s+/);
    if (words.length > 3 || words.length === 0) {
      toast.error("1-3 words only");
      return;
    }
    const { error } = await supabase.from("camps").update({ name: nameInput.trim() }).eq("id", campId);
    if (error) {
      toast.error("Couldn't name this campground");
    } else {
      toast.success("Campground named!");
      setNaming(false);
      fetchCampData();
    }
  };

  if (loading) {
    return (
      <div className="h-svh flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground animate-pulse">loading camp…</p>
      </div>
    );
  }

  if (!camp) {
    return (
      <div className="h-svh flex flex-col items-center justify-center bg-background gap-3">
        <p className="text-sm text-muted-foreground">camp not found</p>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/camps")} className="text-xs text-primary">
          back to camps
        </motion.button>
      </div>
    );
  }

  return (
    <div className="h-svh flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 pt-safe space-y-3">
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </motion.button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Flame
                className={`w-4 h-4 ${isBonfire ? "text-amber-400" : "text-primary"}`}
                fill={isBonfire ? "currentColor" : "none"}
              />
              <h1 className="text-lg font-semibold text-foreground truncate">
                {camp.name ?? camp.vibe}
              </h1>
            </div>
            {camp.name && (
              <p className="text-[10px] text-muted-foreground ml-6">#{camp.vibe}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span>{camp.member_count}</span>
          </div>
        </div>

        {/* Park Ranger naming */}
        {isRanger && isBonfire && !camp.name && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
            {naming ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value.slice(0, 40))}
                  placeholder="name your campground (3 words max)"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNameCamp()}
                />
                <motion.button whileTap={{ scale: 0.9 }} onClick={handleNameCamp} className="text-amber-400">
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setNaming(true)}
                className="flex items-center gap-2 text-xs text-amber-400"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>you're the park ranger — name this campground</span>
              </motion.button>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
        {/* Members */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            campers
          </h2>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <motion.button
                key={m.user_id}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(`/ember/${m.user_id}`)}
                className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-2.5 py-1.5"
              >
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted" />
                )}
                <span className="text-[10px] text-foreground">{m.display_name}</span>
                {m.isRanger && <Crown className="w-3 h-3 text-amber-400" />}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Flares */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            camp flares
          </h2>
          {flares.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 text-center py-8">
              no flares in this camp yet
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {flares.map((f) => (
                <div key={f.id} className="rounded-xl overflow-hidden aspect-square bg-secondary/30 relative">
                  {f.media_url ? (
                    <img src={f.media_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Flame className="w-6 h-6 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-[9px] text-white/80 truncate">{f.display_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CampDetail;
