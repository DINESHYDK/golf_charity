// ─── CARD COMPONENT ──────────────────────────
// Reusable card with optional header, padding variants

import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Card({
  children,
  className,
  padding = "md",
  hover = true,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-[var(--color-bg-card)] rounded-card border border-border",
        "shadow-card transition-shadow duration-250",
        hover && "hover:shadow-card-hover",
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
