// ─── CHARITY CARD ─────────────────────────────
// Displays a single charity with select/deselect toggle
// Highlighted with gold border when it's the user's active selection

"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Charity } from "@/types";

interface CharityCardProps {
  charity: Charity;
  isSelected: boolean;
  onSelect: (charityId: string) => void;
  isLoading?: boolean;
}

export default function CharityCard({
  charity,
  isSelected,
  onSelect,
  isLoading = false,
}: CharityCardProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={() => !isLoading && onSelect(charity.id)}
      disabled={isLoading}
      className={cn(
        "relative w-full text-left card p-5 flex flex-col gap-3 transition-all duration-250 cursor-pointer",
        "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        isSelected
          ? "border-accent shadow-[0_0_0_2px_var(--color-accent)] bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent"
          : "hover:border-primary/30",
        isLoading && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Selected checkmark */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-3 right-3 flex items-center justify-center w-6 h-6 rounded-full bg-accent"
        >
          <Check className="w-3.5 h-3.5 text-primary-dark" />
        </motion.div>
      )}

      {/* Featured badge */}
      {charity.is_featured && (
        <span className="self-start badge badge-info text-[10px] uppercase tracking-wider">
          Featured
        </span>
      )}

      {/* Charity name */}
      <h3 className={cn(
        "font-heading text-base font-bold",
        isSelected ? "text-primary" : "text-[var(--color-text-primary)]"
      )}>
        {charity.name}
      </h3>

      {/* Description */}
      {charity.description && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
          {charity.description}
        </p>
      )}

      {/* Website link */}
      {charity.website_url && (
        <a
          href={charity.website_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()} // Don't trigger card select
          className="flex items-center gap-1 text-xs text-accent hover:underline mt-auto"
        >
          <ExternalLink className="w-3 h-3" />
          Visit website
        </a>
      )}

      {/* "Selected" label at bottom */}
      {isSelected && (
        <p className="text-xs font-semibold text-accent">✓ Your selected charity</p>
      )}
    </motion.button>
  );
}
