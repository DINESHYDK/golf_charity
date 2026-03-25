// ─── SCORE HISTORY ────────────────────────────
// Displays the user's current rolling 5 scores
// Most recent first. Oldest score flagged with tooltip.
// Each row has a delete button.

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { formatDate } from "@/lib/utils";
import { SCORE_CONFIG, TOAST_MESSAGES } from "@/constants";
import type { Score } from "@/types";
import { Target } from "lucide-react";

interface ScoreHistoryProps {
  scores: Score[];
  isLoading: boolean;
  onDelete: (id: string) => Promise<boolean>;
}

export default function ScoreHistory({ scores, isLoading, onDelete }: ScoreHistoryProps) {
  const handleDelete = async (id: string) => {
    const success = await onDelete(id);
    if (success) {
      toast.success(TOAST_MESSAGES.SCORE_DELETED);
    } else {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    }
  };

  // The oldest score (earliest created_at) is the one that gets replaced next
  const oldestId = scores.length >= SCORE_CONFIG.MAX_SCORES_PER_USER
    ? [...scores].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]?.id
    : null;

  if (isLoading) {
    return (
      <div className="card p-6 flex justify-center">
        <LoadingSpinner size="md" text="Loading scores..." />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
          My Scores
        </h2>
        <span className="text-xs text-[var(--color-text-muted)]">
          Rolling {SCORE_CONFIG.MAX_SCORES_PER_USER} — newest first
        </span>
      </div>

      {scores.length === 0 ? (
        <EmptyState
          icon={<Target className="w-10 h-10" />}
          title="No scores yet"
          description="Add your first Stableford score from a recent round to enter the monthly draw."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          <AnimatePresence initial={false}>
            {/* Scores displayed newest first (API returns reverse-chrono order) */}
            {scores.map((score, index) => (
              <motion.li
                key={score.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16, height: 0 }}
                transition={{ duration: 0.25, delay: index * 0.04 }}
                className="flex items-center justify-between py-4 gap-4"
              >
                {/* Score bubble */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-dark)] font-heading font-bold text-lg flex-shrink-0">
                    {score.score_value}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">
                      Round on {formatDate(score.score_date)}
                    </p>
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                      <Clock className="w-3 h-3" />
                      Entered {formatDate(score.created_at)}
                      {/* Flag the oldest score at max capacity */}
                      {score.id === oldestId && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-warning/20 text-warning text-[10px] font-semibold">
                          Oldest — replaced next
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => handleDelete(score.id)}
                  className="p-2 rounded-btn text-[var(--color-text-muted)] hover:text-error hover:bg-error/10 transition-all duration-250 flex-shrink-0"
                  aria-label={`Delete score ${score.score_value}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
