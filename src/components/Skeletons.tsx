import { motion } from "framer-motion";

/** Reusable skeleton primitives for loading states */

export const FeedSkeleton = () => (
  <div className="h-svh w-full bg-background flex flex-col items-center justify-center gap-6 p-8">
    <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
    <div className="w-32 h-3 rounded-full bg-muted animate-pulse" />
    <div className="w-48 h-2 rounded-full bg-muted/60 animate-pulse" />
  </div>
);

export const ConversationSkeleton = () => (
  <div className="flex flex-col gap-1 p-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex items-center gap-3 py-3">
        <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="w-24 h-3 rounded-full bg-muted animate-pulse" />
          <div className="w-36 h-2 rounded-full bg-muted/60 animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const PeopleSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 p-4">
    {[...Array(6)].map((_, i) => (
      <div key={i} className="flex flex-col items-center gap-2 signal-surface rounded-2xl p-4">
        <div className="w-14 h-14 rounded-full bg-muted animate-pulse" />
        <div className="w-20 h-3 rounded-full bg-muted animate-pulse" />
        <div className="w-16 h-7 rounded-full bg-muted/60 animate-pulse" />
      </div>
    ))}
  </div>
);

export const ProfileSkeleton = () => (
  <div className="flex flex-col items-center gap-4 pt-12 pb-8">
    <div className="w-20 h-20 rounded-full bg-muted animate-pulse" />
    <div className="w-28 h-4 rounded-full bg-muted animate-pulse" />
    <div className="flex gap-8 mt-2">
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-4 rounded bg-muted animate-pulse" />
        <div className="w-12 h-2 rounded bg-muted/60 animate-pulse" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-4 rounded bg-muted animate-pulse" />
        <div className="w-12 h-2 rounded bg-muted/60 animate-pulse" />
      </div>
    </div>
  </div>
);

interface EmptyStateProps {
  emoji: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({ emoji, title, subtitle, action }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
    className="flex flex-col items-center gap-3 py-16 px-8 text-center"
  >
    <span className="text-3xl">{emoji}</span>
    <p className="text-sm font-medium text-foreground">{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground max-w-[240px]">{subtitle}</p>}
    {action && (
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={action.onClick}
        className="mt-2 rounded-full bg-primary px-6 py-2.5 text-xs font-medium text-primary-foreground signal-glow"
      >
        {action.label}
      </motion.button>
    )}
  </motion.div>
);
