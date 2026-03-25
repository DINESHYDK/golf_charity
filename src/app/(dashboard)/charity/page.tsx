// ─── CHARITY PAGE ─────────────────────────────
// Fetches charity list + user's current selection from /api/charities
// Left: CharityGrid — Right: ContributionSlider + current selection info

"use client";

import { useState, useEffect, useCallback } from "react";
import { Heart } from "lucide-react";
import toast from "react-hot-toast";
import CharityCard from "@/components/charity/CharityCard";
import ContributionSlider from "@/components/charity/ContributionSlider";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { TOAST_MESSAGES } from "@/constants";
import type { Charity, UserCharitySelection } from "@/types";

export default function CharityPage() {
  const { subscription } = useAuth();

  const [charities, setCharities] = useState<Charity[]>([]);
  const [selection, setSelection] = useState<UserCharitySelection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isActive = subscription?.status === "active";

  // ─── FETCH CHARITIES + CURRENT SELECTION ─────
  const fetchCharities = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/charities");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setCharities(result.data?.charities ?? []);
      setSelection(result.data?.my_selection ?? null);
    } catch {
      toast.error("Failed to load charities");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCharities();
  }, [fetchCharities]);

  // ─── SELECT CHARITY ───────────────────────────
  const handleSelect = async (charityId: string) => {
    if (!isActive) {
      toast.error(TOAST_MESSAGES.SUBSCRIPTION_REQUIRED);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/charities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ charity_id: charityId, contribution_percentage: selection?.contribution_percentage ?? 10 }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSelection(result.data);
      toast.success(TOAST_MESSAGES.CHARITY_SELECTED);
    } catch {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── UPDATE CONTRIBUTION % ────────────────────
  const handleUpdatePercentage = async (percentage: number) => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/charities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contribution_percentage: percentage }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setSelection((prev) => prev ? { ...prev, contribution_percentage: percentage } : prev);
    } catch {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading charities..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ─── PAGE HEADER ─────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          My Charity
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Choose the cause your subscription supports. Minimum 10% of every payment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─── CHARITY GRID (2/3 width) ────────── */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
            Choose a Charity
          </h2>

          {charities.length === 0 ? (
            <EmptyState
              icon={<Heart className="w-10 h-10" />}
              title="No charities available"
              description="Check back soon — new verified charities are added regularly."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {charities.map((charity) => (
                <CharityCard
                  key={charity.id}
                  charity={charity}
                  isSelected={selection?.charity_id === charity.id}
                  onSelect={handleSelect}
                  isLoading={isSaving}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── CONTRIBUTION SLIDER (1/3 width) ─── */}
        <div className="flex flex-col gap-4">
          {selection ? (
            <ContributionSlider
              currentPercentage={selection.contribution_percentage}
              onUpdate={handleUpdatePercentage}
              isLoading={isSaving}
            />
          ) : (
            <div className="card p-6 text-center">
              <Heart className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                Select a charity first to set your contribution percentage.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
