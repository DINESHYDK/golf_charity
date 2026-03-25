// ─── STAT CARD ────────────────────────────────
// Reusable stat card for the dashboard overview
// Shows an icon, label, value, and optional trend/sub-text

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  accent?: boolean;      // Gold accent highlight for key stats
  className?: string;
}

export default function StatCard({
  icon,
  label,
  value,
  subText,
  accent = false,
  className,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "card p-6 flex flex-col gap-3",
        accent && "border-accent/40 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-light)] text-[var(--color-text-on-dark)]",
        className
      )}
    >
      {/* Icon */}
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full",
        accent ? "bg-accent/20" : "bg-[var(--color-secondary)]"
      )}>
        <span className={accent ? "text-accent" : "text-primary"}>
          {icon}
        </span>
      </div>

      {/* Value */}
      <div>
        <p className={cn(
          "font-heading text-3xl font-bold",
          accent ? "text-accent" : "text-[var(--color-text-primary)]"
        )}>
          {value}
        </p>
        <p className={cn(
          "text-sm font-medium mt-0.5",
          accent ? "text-[var(--color-text-on-dark)]/70" : "text-[var(--color-text-secondary)]"
        )}>
          {label}
        </p>
      </div>

      {/* Sub text */}
      {subText && (
        <p className={cn(
          "text-xs",
          accent ? "text-[var(--color-text-on-dark)]/50" : "text-[var(--color-text-muted)]"
        )}>
          {subText}
        </p>
      )}
    </motion.div>
  );
}
