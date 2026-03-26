// ─── ADMIN STAT CARD ──────────────────────────
// Animated metric card for the admin overview dashboard
// Variants: default (green), warning (amber), success (green), error (red)

"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subLabel?: string;
  variant?: "default" | "warning" | "success" | "error";
  delay?: number;
}

export default function AdminStatCard({
  label,
  value,
  icon: Icon,
  subLabel,
  variant = "default",
  delay = 0,
}: AdminStatCardProps) {
  // ─── VARIANT STYLES ───────────────────────
  const containerVariants = {
    default: "border-[var(--color-border)] bg-[var(--color-bg-card)]",
    warning: "border-amber-200 bg-amber-50",
    success: "border-green-200 bg-green-50",
    error:   "border-red-200 bg-red-50",
  };

  const iconVariants = {
    default: "bg-[var(--color-primary)]/10 text-[var(--color-primary)]",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-green-100 text-green-600",
    error:   "bg-red-100 text-red-600",
  };

  const valueVariants = {
    default: "text-[var(--color-text-primary)]",
    warning: "text-amber-700",
    success: "text-green-700",
    error:   "text-red-700",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className={cn(
        "rounded-xl border p-6 flex flex-col gap-4",
        containerVariants[variant]
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-lg",
          iconVariants[variant]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value + Label */}
      <div>
        <p
          className={cn(
            "text-2xl font-heading font-bold",
            valueVariants[variant]
          )}
        >
          {value}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{label}</p>
        {subLabel && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{subLabel}</p>
        )}
      </div>
    </motion.div>
  );
}
