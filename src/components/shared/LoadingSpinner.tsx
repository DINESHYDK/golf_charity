// ─── LOADING SPINNER ─────────────────────────
// Animated spinner for async operations
// PRD requires loading animations on every DB/Auth response

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  className?: string;
  fullPage?: boolean;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
  xl: "h-16 w-16",
};

export default function LoadingSpinner({
  size = "md",
  text,
  className,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      {/* Golf ball spinner — custom themed */}
      <motion.div
        className={cn(
          "rounded-full border-2 border-accent border-t-transparent",
          sizeMap[size]
        )}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-[var(--color-text-secondary)] font-medium"
        >
          {text}
        </motion.p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--color-bg-page)]/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
}
