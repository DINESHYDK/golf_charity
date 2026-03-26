// ─── CHARITY CARD ─────────────────────────────
// Displays a single charity with View Profile + Select actions
// PRD: "Charity listing page with individual profiles"

"use client";

import { motion } from "framer-motion";
import { Check, ExternalLink, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import type { Charity } from "@/types";

interface CharityCardProps {
  charity: Charity;
  isSelected: boolean;
  onSelect: (charityId: string) => void;
  onViewProfile: (charity: Charity) => void;
  isLoading?: boolean;
}

export default function CharityCard({
  charity,
  isSelected,
  onSelect,
  onViewProfile,
  isLoading = false,
}: CharityCardProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "relative w-full card p-5 flex flex-col gap-3 transition-all duration-250",
        isSelected
          ? "border-accent shadow-[0_0_0_2px_var(--color-accent)] bg-gradient-to-br from-[var(--color-primary)]/5 to-transparent"
          : "hover:border-primary/30"
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
        "font-heading text-base font-bold pr-6",
        isSelected ? "text-primary" : "text-[var(--color-text-primary)]"
      )}>
        {charity.name}
      </h3>

      {/* Description (truncated on card) */}
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
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-xs text-accent hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          Visit website
        </a>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onViewProfile(charity)}
          icon={<Eye className="w-3.5 h-3.5" />}
          className="text-xs"
        >
          View Profile
        </Button>
        <Button
          variant={isSelected ? "secondary" : "primary"}
          size="sm"
          onClick={() => !isLoading && onSelect(charity.id)}
          disabled={isLoading}
          icon={isSelected ? <Check className="w-3.5 h-3.5" /> : undefined}
          className="text-xs ml-auto"
        >
          {isSelected ? "Selected" : "Select"}
        </Button>
      </div>
    </motion.div>
  );
}
