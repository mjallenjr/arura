import { motion } from "framer-motion";
import { Flame, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Camp } from "@/hooks/useCamps";

interface CampFomoCardProps {
  camp: Camp;
}

const CampFomoCard = ({ camp }: CampFomoCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-4 my-3 rounded-2xl bg-gradient-to-br from-amber-500/10 to-primary/5 border border-amber-500/20 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <Flame className="w-8 h-8 text-amber-400" fill="currentColor" />
          <motion.div
            className="absolute inset-0"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Flame className="w-8 h-8 text-amber-300" fill="currentColor" />
          </motion.div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">
            <span className="text-amber-400">{camp.vibe}</span> is warming up
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {camp.member_count} campers and growing
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/camps")}
          className="rounded-full bg-primary/10 p-2 text-primary"
        >
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CampFomoCard;
