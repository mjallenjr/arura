import { motion } from "framer-motion";
import { Flame, Crown, Users } from "lucide-react";
import type { Camp } from "@/hooks/useCamps";

interface CampCardProps {
  camp: Camp;
  onClick: () => void;
}

const CampCard = ({ camp, onClick }: CampCardProps) => {
  const isBonfire = camp.status === "bonfire";

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl p-4 signal-surface signal-ease border ${
        isBonfire ? "border-amber-500/40 shadow-[0_0_20px_-4px_hsl(38_90%_50%/0.2)]" : "border-border/30"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame
            className={`w-4 h-4 ${isBonfire ? "text-amber-400" : "text-primary"}`}
            fill={isBonfire ? "currentColor" : "none"}
          />
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {isBonfire ? "bonfire" : "campfire"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{camp.member_count}</span>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-foreground truncate">
        {camp.name ?? camp.vibe}
      </h3>

      {camp.name && (
        <p className="text-[10px] text-muted-foreground mt-0.5">#{camp.vibe}</p>
      )}

      {isBonfire && camp.rangerName && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400/80">
          <Crown className="w-3 h-3" />
          <span>{camp.rangerName} · park ranger</span>
        </div>
      )}
    </motion.button>
  );
};

export default CampCard;
