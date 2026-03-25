// ─── EMPTY STATE ─────────────────────────────
// Shown when a list or data set has no items yet
// Used in scores, draws, winnings, admin tables, etc.

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6",
        className
      )}
    >
      {icon && (
        <div className="mb-4 text-[var(--color-text-muted)] opacity-50">
          {icon}
        </div>
      )}
      <h3 className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-2">
        {title}
      </h3>
      {description && (
        <p className="font-body text-sm text-[var(--color-text-secondary)] max-w-sm mb-6">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </motion.div>
  );
}
