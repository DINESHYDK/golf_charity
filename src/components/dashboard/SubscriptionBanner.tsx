// ─── SUBSCRIPTION BANNER ──────────────────────
// Shown at the top of the dashboard
// Case 1: No active subscription → CTA to subscribe
// Case 2: Active → show plan, renewal date, charity %, cancel option

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Calendar, Heart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDate, formatCurrency } from "@/lib/utils";
import { PLANS } from "@/constants";
import type { Subscription } from "@/types";

interface SubscriptionBannerProps {
  subscription: Subscription | null;
}

export default function SubscriptionBanner({ subscription }: SubscriptionBannerProps) {
  const { startCheckout, cancelSubscription, isLoading } = useSubscription();
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const isActive = subscription?.status === "active";

  // ─── CANCEL HANDLER ──────────────────────────
  const handleCancel = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }
    const success = await cancelSubscription();
    if (success) {
      toast.success("Subscription cancelled. Access continues until period end.");
      setCancelConfirm(false);
    } else {
      toast.error("Failed to cancel. Please try again.");
    }
  };

  // ─── NO SUBSCRIPTION ─────────────────────────
  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-card bg-warning/10 border border-warning/30"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">No active subscription</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Subscribe to enter scores, join draws, and contribute to charity.
            </p>
          </div>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="primary"
            size="sm"
            isLoading={isLoading}
            loadingText="Loading..."
            onClick={() => startCheckout("monthly")}
          >
            Monthly Plan
          </Button>
          <Button
            variant="secondary"
            size="sm"
            isLoading={isLoading}
            loadingText="Loading..."
            onClick={() => startCheckout("yearly")}
          >
            Yearly Plan
          </Button>
        </div>
      </motion.div>
    );
  }

  // ─── ACTIVE SUBSCRIPTION ─────────────────────
  const planLabel = subscription.plan_type ? PLANS[subscription.plan_type]?.name : "Plan";
  const renewalDate = subscription.current_period_end
    ? formatDate(subscription.current_period_end)
    : "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-card bg-success/10 border border-success/30"
    >
      <div className="flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <div>
            <p className="font-semibold text-[var(--color-text-primary)]">
              Active — {planLabel}
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <Calendar className="w-3.5 h-3.5" />
            Renews {renewalDate}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
            <Heart className="w-3.5 h-3.5 text-accent" />
            {subscription.charity_percentage}% to charity
          </div>
        </div>
      </div>

      {/* Cancel button — with confirmation step */}
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className="flex-shrink-0 text-sm text-[var(--color-text-muted)] hover:text-error transition-colors duration-250 flex items-center gap-1.5"
      >
        {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        {cancelConfirm ? "Confirm cancel?" : "Cancel plan"}
      </button>
    </motion.div>
  );
}
