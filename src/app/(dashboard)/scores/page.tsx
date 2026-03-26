// ─── SCORES PAGE ─────────────────────────────
// Score entry/edit form (left) + rolling 5-score history (right)
// PRD: max 5 scores, oldest by created_at replaced on 6th entry
// Edit mode: clicking pencil on a score pre-fills the form

"use client";

import { useState } from "react";
import { useScores } from "@/hooks/useScores";
import { useAuth } from "@/hooks/useAuth";
import ScoreEntryForm from "@/components/scores/ScoreEntryForm";
import ScoreHistory from "@/components/scores/ScoreHistory";
import SubscriptionBanner from "@/components/dashboard/SubscriptionBanner";
import type { Score } from "@/types";

export default function ScoresPage() {
  const { subscription } = useAuth();
  const { scores, isLoading, isSubmitting, addScore, deleteScore, updateScore, scoreCount, canAddMore } = useScores();

  // ─── EDIT STATE ───────────────────────────────
  // null = add mode; Score = edit mode (pre-fills form)
  const [editingScore, setEditingScore] = useState<Score | null>(null);

  const isActive = subscription?.status === "active";

  const handleEdit = (score: Score) => setEditingScore(score);
  const handleCancelEdit = () => setEditingScore(null);

  const handleUpdateScore = async (id: string, value: number, date: string) => {
    const success = await updateScore(id, value, date);
    if (success) setEditingScore(null);
    return success;
  };

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
        {/* Left: Entry / Edit form */}
        <ScoreEntryForm
          onScoreAdded={addScore}
          onScoreUpdated={handleUpdateScore}
          onCancelEdit={handleCancelEdit}
          isSubmitting={isSubmitting}
          scoreCount={scoreCount}
          canAddMore={canAddMore}
          editingScore={editingScore}
        />

        {/* Right: History with edit + delete per row */}
        <ScoreHistory
          scores={scores}
          isLoading={isLoading}
          onDelete={deleteScore}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}
