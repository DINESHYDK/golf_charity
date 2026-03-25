// ─── CONTRIBUTION SLIDER ──────────────────────
// Lets the user set their charity contribution % above the 10% minimum
// PRD: "Extra % comes from platform fee — prize pool always stays at 72%"
// Change applies to NEXT billing cycle only

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Info } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { REVENUE_SPLIT, TOAST_MESSAGES } from "@/constants";

interface ContributionSliderProps {
  currentPercentage: number;
  onUpdate: (percentage: number) => Promise<void>;
  isLoading?: boolean;
}

export default function ContributionSlider({
  currentPercentage,
  onUpdate,
  isLoading = false,
}: ContributionSliderProps) {
  const [percentage, setPercentage] = useState(currentPercentage);
  const isDirty = percentage !== currentPercentage;

  // ─── DERIVED SPLIT VALUES ─────────────────────
  // Prize pool is always fixed at 72%
  // Platform fee decreases as charity % increases
  const platformFee = Math.max(0, 100 - REVENUE_SPLIT.PRIZE_POOL_PERCENTAGE - percentage);

  const handleSave = async () => {
    await onUpdate(percentage);
    toast.success(TOAST_MESSAGES.CHARITY_PERCENTAGE_UPDATED + " (applies next billing cycle)");
  };

  return (
    <div className="card p-6 flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
            Charity Contribution
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Minimum {REVENUE_SPLIT.CHARITY_MIN_PERCENTAGE}%. Increase anytime — extra comes from the platform fee.
          </p>
        </div>
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary)] flex-shrink-0">
          <Heart className="w-6 h-6 text-accent" />
        </div>
      </div>

      {/* Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="label mb-0">Your charity percentage</label>
          <span className="font-heading text-2xl font-bold text-accent">
            {percentage}%
          </span>
        </div>
        <input
          type="range"
          min={REVENUE_SPLIT.CHARITY_MIN_PERCENTAGE}
          max={82} // Max: 82% charity leaves 18% prize (unrealistic but capped)
          step={1}
          value={percentage}
          onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
          disabled={isLoading}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${((percentage - 10) / 72) * 100}%, var(--color-border) ${((percentage - 10) / 72) * 100}%, var(--color-border) 100%)`,
          }}
        />
        <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
          <span>{REVENUE_SPLIT.CHARITY_MIN_PERCENTAGE}% (min)</span>
          <span>82% (max)</span>
        </div>
      </div>

      {/* Live breakdown */}
      <div className="grid grid-cols-3 gap-3 text-center p-4 rounded-btn bg-[var(--color-secondary)]">
        <div>
          <p className="font-heading text-xl font-bold text-accent">{percentage}%</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Charity</p>
        </div>
        <div>
          <p className="font-heading text-xl font-bold text-primary">{REVENUE_SPLIT.PRIZE_POOL_PERCENTAGE}%</p>
          <p className="text-xs text-[var(--color-text-secondary)]">Prize Pool</p>
        </div>
        <div>
          <p className={`font-heading text-xl font-bold ${platformFee < 5 ? "text-error" : "text-[var(--color-text-muted)]"}`}>
            {platformFee}%
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">Platform</p>
        </div>
      </div>

      {/* Next cycle notice */}
      <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>Changes apply to your next billing cycle only — the current month is already set.</span>
      </div>

      {/* Save button — only shown when changed */}
      {isDirty && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            variant="primary"
            size="md"
            fullWidth
            isLoading={isLoading}
            loadingText="Saving..."
            onClick={handleSave}
          >
            Save — Give {percentage}% to Charity
          </Button>
        </motion.div>
      )}
    </div>
  );
}
