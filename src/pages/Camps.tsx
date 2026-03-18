import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, ArrowLeft } from "lucide-react";
import { useCamps } from "@/hooks/useCamps";
import CampCard from "@/components/camp/CampCard";

const Camps = () => {
  const navigate = useNavigate();
  const { myCamps, warmingUp, loading, syncCamps } = useCamps();

  useEffect(() => {
    syncCamps();
  }, [syncCamps]);

  return (
    <div className="h-svh flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-safe">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </motion.button>
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-amber-400" fill="currentColor" />
          <h1 className="text-lg font-semibold text-foreground">campgrounds</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 px-4 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground animate-pulse">finding camps…</p>
          </div>
        ) : (
          <>
            {/* My Camps */}
            {myCamps.length > 0 && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  my camps
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {myCamps.map((camp) => (
                    <CampCard
                      key={camp.id}
                      camp={camp}
                      onClick={() => navigate(`/camp/${camp.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Warming Up (FOMO) */}
            {warmingUp.length > 0 && (
              <section>
                <h2 className="text-xs font-medium uppercase tracking-wider text-amber-400/80 mb-3">
                  🔥 warming up
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {warmingUp.map((camp) => (
                    <CampCard
                      key={camp.id}
                      camp={camp}
                      onClick={() => navigate(`/camp/${camp.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {myCamps.length === 0 && warmingUp.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Flame className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">no campgrounds yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  add vibes to your profile and camps will form when 5+ embers share the same one
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Camps;
