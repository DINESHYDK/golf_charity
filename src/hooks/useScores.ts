// ─── useScores HOOK ──────────────────────────
// Manages score fetching, adding (with rolling 5 logic), and deleting

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Score } from "@/types";

export function useScores() {
  const [scores, setScores] = useState<Score[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── FETCH SCORES ─────────────────────────
  const fetchScores = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/scores");
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setScores(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch scores";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load scores on mount
  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  // ─── ADD SCORE ────────────────────────────
  // PRD: "A new score replaces the oldest stored score automatically"
  const addScore = async (scoreValue: number, scoreDate: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score_value: scoreValue, score_date: scoreDate }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // Refresh scores to reflect the rolling window
      await fetchScores();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add score";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── DELETE SCORE ─────────────────────────
  const deleteScore = async (scoreId: string) => {
    setError(null);

    try {
      const response = await fetch(`/api/scores?id=${scoreId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // Remove from local state immediately for snappy UI
      setScores((prev) => prev.filter((s) => s.id !== scoreId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete score";
      setError(message);
      return false;
    }
  };

  // ─── UPDATE SCORE ─────────────────────────
  // Edit mode: sends PUT with new value + date, optimistic local update
  const updateScore = async (scoreId: string, scoreValue: number, scoreDate: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: scoreId, score_value: scoreValue, score_date: scoreDate }),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      // Optimistic update — no full re-fetch needed
      setScores((prev) =>
        prev.map((s: Score) =>
          s.id === scoreId ? { ...s, score_value: scoreValue, score_date: scoreDate } : s
        )
      );
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update score";
      setError(message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    scores,
    isLoading,
    isSubmitting,
    error,
    addScore,
    deleteScore,
    updateScore,
    refreshScores: fetchScores,
    canAddMore: scores.length < 5,
    scoreCount: scores.length,
  };
}
