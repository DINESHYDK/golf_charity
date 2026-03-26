// ─── SCORE ENTRY FORM ─────────────────────────
// Handles both ADD mode (default) and EDIT mode (when editingScore is set)
// PRD: "Max 5 scores — 6th entry deletes oldest by created_at"
// Edit mode: pre-fills form, changes button text, hides rolling window warning

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, AlertCircle, Info, Pencil } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { SCORE_CONFIG, TOAST_MESSAGES } from "@/constants";
import type { Score } from "@/types";

interface ScoreEntryFormProps {
  onScoreAdded: (scoreValue: number, scoreDate: string) => Promise<boolean>;
  onScoreUpdated: (id: string, scoreValue: number, scoreDate: string) => Promise<boolean>;
  onCancelEdit: () => void;
  isSubmitting: boolean;
  scoreCount: number;
  canAddMore: boolean;
  editingScore: Score | null;
}

export default function ScoreEntryForm({
  onScoreAdded,
  onScoreUpdated,
  onCancelEdit,
  isSubmitting,
  scoreCount,
  canAddMore,
  editingScore,
}: ScoreEntryFormProps) {
  const today = new Date().toISOString().split("T")[0];
  const [scoreValue, setScoreValue] = useState("");
  const [scoreDate, setScoreDate] = useState(today);
  const [errors, setErrors] = useState<{ scoreValue?: string; scoreDate?: string }>({});

  const isEditMode = editingScore !== null;
  const isAtMax = scoreCount >= SCORE_CONFIG.MAX_SCORES_PER_USER;

  // ─── SYNC FORM WITH editingScore ─────────────
  // When edit mode activates, pre-fill from the score being edited
  // When it clears, reset to blank
  useEffect(() => {
    if (editingScore) {
      setScoreValue(String(editingScore.score_value));
      setScoreDate(editingScore.score_date);
      setErrors({});
    } else {
      setScoreValue("");
      setScoreDate(today);
      setErrors({});
    }
  }, [editingScore, today]);

  // ─── VALIDATION ──────────────────────────────
  const validate = () => {
    const newErrors: typeof errors = {};
    const val = parseInt(scoreValue, 10);

    if (!scoreValue) {
      newErrors.scoreValue = "Score is required";
    } else if (isNaN(val) || val < SCORE_CONFIG.MIN_SCORE_VALUE || val > SCORE_CONFIG.MAX_SCORE_VALUE) {
      newErrors.scoreValue = `Score must be between ${SCORE_CONFIG.MIN_SCORE_VALUE} and ${SCORE_CONFIG.MAX_SCORE_VALUE}`;
    }

    if (!scoreDate) {
      newErrors.scoreDate = "Date is required";
    } else if (scoreDate > today) {
      newErrors.scoreDate = "Score date cannot be in the future";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── SUBMIT ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const val = parseInt(scoreValue, 10);

    if (isEditMode) {
      // ─── EDIT FLOW ────────────────────────
      const success = await onScoreUpdated(editingScore!.id, val, scoreDate);
      if (success) {
        toast.success(TOAST_MESSAGES.SCORE_UPDATED);
        onCancelEdit();
      } else {
        toast.error(TOAST_MESSAGES.GENERIC_ERROR);
      }
    } else {
      // ─── ADD FLOW ─────────────────────────
      const success = await onScoreAdded(val, scoreDate);
      if (success) {
        toast.success(
          isAtMax
            ? "Score added — oldest score removed to keep rolling 5."
            : TOAST_MESSAGES.SCORE_ADDED
        );
        setScoreValue("");
        setScoreDate(today);
        setErrors({});
      } else {
        toast.error(TOAST_MESSAGES.GENERIC_ERROR);
      }
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
          {isEditMode ? "Edit Score" : "Add Score"}
        </h2>
        {/* Badge: editing indicator in edit mode, score counter in add mode */}
        {isEditMode ? (
          <span className="badge badge-warning text-[10px]">Editing</span>
        ) : (
          <span className={`badge ${isAtMax ? "badge-warning" : "badge-info"}`}>
            {scoreCount} / {SCORE_CONFIG.MAX_SCORES_PER_USER} scores
          </span>
        )}
      </div>

      {/* Rolling window notice — only in add mode when at max */}
      <AnimatePresence>
        {!isEditMode && isAtMax && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 p-3 mb-5 rounded-btn bg-warning/10 border border-warning/30 text-sm text-[var(--color-text-secondary)]"
          >
            <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
            <span>
              You have 5 scores. Adding a new one will{" "}
              <strong className="text-[var(--color-text-primary)]">remove your oldest</strong> automatically.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {/* Score value */}
        <Input
          label={`Stableford Score (${SCORE_CONFIG.MIN_SCORE_VALUE}–${SCORE_CONFIG.MAX_SCORE_VALUE})`}
          type="number"
          id="scoreValue"
          placeholder="e.g. 32"
          min={SCORE_CONFIG.MIN_SCORE_VALUE}
          max={SCORE_CONFIG.MAX_SCORE_VALUE}
          value={scoreValue}
          onChange={(e) => {
            setScoreValue(e.target.value);
            if (errors.scoreValue) setErrors((p) => ({ ...p, scoreValue: undefined }));
          }}
          error={errors.scoreValue}
        />

        {/* Score date */}
        <Input
          label="Round Date"
          type="date"
          id="scoreDate"
          max={today}
          value={scoreDate}
          onChange={(e) => {
            setScoreDate(e.target.value);
            if (errors.scoreDate) setErrors((p) => ({ ...p, scoreDate: undefined }));
          }}
          error={errors.scoreDate}
        />

        {/* Stableford helper */}
        <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
          <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>Stableford points: Albatross=6, Eagle=5, Birdie=3, Par=2, Bogey=1</span>
        </div>

        {/* Submit button */}
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={isSubmitting}
          loadingText={isEditMode ? "Updating..." : "Adding score..."}
          icon={isEditMode ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        >
          {isEditMode ? "Update Score" : "Add Score"}
        </Button>

        {/* Cancel edit button — only in edit mode */}
        {isEditMode && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={onCancelEdit}
          >
            Cancel Edit
          </Button>
        )}
      </form>
    </div>
  );
}
