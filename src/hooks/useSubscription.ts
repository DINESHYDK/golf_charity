// ─── useSubscription HOOK ────────────────────
// Handles subscription checkout flow, status, and cancellation

"use client";

import { useState } from "react";
import type { PlanType } from "@/types";

export function useSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── START CHECKOUT: Redirect to Stripe ────
  const startCheckout = async (planType: PlanType, charityPercentage: number = 10) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_type: planType,
          charity_percentage: charityPercentage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to start checkout");
      }

      // Redirect to Stripe Checkout
      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── CANCEL SUBSCRIPTION ───────────────────
  const cancelSubscription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription", { method: "DELETE" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel subscription");
      }

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    startCheckout,
    cancelSubscription,
  };
}
