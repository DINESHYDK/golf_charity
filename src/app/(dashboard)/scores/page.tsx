// ─── SCORES PAGE ─────────────────────────────
// Score entry form (left) + rolling 5-score history (right)
// PRD: max 5 scores, oldest by created_at replaced on 6th entry

"use client";

import { useScores } from "@/hooks/useScores";
import { useAuth } from "@/hooks/useAuth";
import ScoreEntryForm from "@/components/scores/ScoreEntryForm";
import ScoreHistory from "@/components/scores/ScoreHistory";
import SubscriptionBanner from "@/components/dashboard/SubscriptionBanner";

export default function ScoresPage() {
  const { subscription } = useAuth();
  const { scores, isLoading, isSubmitting, addScore, deleteScore, scoreCount, canAddMore } = useScores();

  const isActive = subscription?.status === "active";

  return (
    <div className="flex flex-col gap-6">

      {/* ─── PAGE TITLE ──────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          My Scores
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Log your Stableford scores. Your latest 5 are used in the monthly draw.
        </p>
      </div>

      {/* ─── SUBSCRIPTION GATE ───────────────── */}
      {!isActive && <SubscriptionBanner subscription={subscription} />}

      {/* ─── MAIN LAYOUT ─────────────────────── */}
      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!isActive ? "opacity-60 pointer-events-none" : ""}`}>
        {/* Left: Entry form */}
        <ScoreEntryForm
          onScoreAdded={addScore}
          isSubmitting={isSubmitting}
          scoreCount={scoreCount}
          canAddMore={canAddMore}
        />

        {/* Right: History */}
        <ScoreHistory
          scores={scores}
          isLoading={isLoading}
          onDelete={deleteScore}
        />
      </div>
    </div>
  );
}
