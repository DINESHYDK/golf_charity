// ─── WINNINGS PAGE ────────────────────────────
// Lists the user's prize wins with verification status + proof upload
// Winner verification flow:
//   pending → user uploads proof → admin reviews → approved/rejected → paid

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Upload, CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { formatCurrency, formatDate, formatDrawMonth } from "@/lib/utils";
import { TOAST_MESSAGES } from "@/constants";
import type { Winner } from "@/types";

// ─── VERIFICATION STATUS BADGE ────────────────
function VerificationBadge({ status }: { status: Winner["verification_status"] }) {
  if (status === "approved") return <span className="badge badge-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
  if (status === "rejected") return <span className="badge badge-error flex items-center gap-1"><XCircle className="w-3 h-3" /> Rejected</span>;
  return <span className="badge badge-warning flex items-center gap-1"><Clock className="w-3 h-3" /> Pending Review</span>;
}

// ─── PAYOUT STATUS BADGE ──────────────────────
function PayoutBadge({ status }: { status: Winner["payout_status"] }) {
  if (status === "paid") return <span className="badge badge-success">Paid</span>;
  return <span className="badge badge-warning">Pending Payout</span>;
}

// ─── MATCH TIER LABEL ─────────────────────────
function MatchLabel({ matchType }: { matchType: 3 | 4 | 5 }) {
  if (matchType === 5) return <span className="text-accent font-bold">🏆 5-Match Jackpot</span>;
  if (matchType === 4) return <span className="text-success font-bold">🥇 4-Match Win</span>;
  return <span className="text-info font-bold">🥈 3-Match Win</span>;
}

// ─── PROOF UPLOAD FORM ────────────────────────
// The user pastes a URL to a screenshot (e.g. Imgur, Google Drive link)
function ProofUploadRow({
  winner,
  onSubmit,
}: {
  winner: Winner;
  onSubmit: (winnerId: string, url: string) => Promise<void>;
}) {
  const [url, setUrl] = useState(winner.proof_upload_url ?? "");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) { toast.error("Please enter a URL"); return; }
    setIsLoading(true);
    await onSubmit(winner.id, url.trim());
    setIsLoading(false);
  };

  // Already submitted — show submitted state
  if (winner.submitted_at) {
    return (
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
        Proof submitted {formatDate(winner.submitted_at)}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 mt-3">
      <input
        type="url"
        placeholder="Paste screenshot URL (Imgur, Google Drive, etc.)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="input flex-1 text-sm py-2"
      />
      <Button
        type="submit"
        variant="primary"
        size="sm"
        isLoading={isLoading}
        loadingText="Uploading..."
        icon={<Upload className="w-3.5 h-3.5" />}
      >
        Submit Proof
      </Button>
    </form>
  );
}

// ─── MAIN PAGE ────────────────────────────────
export default function WinningsPage() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ─── FETCH WINNINGS ───────────────────────────
  const fetchWinnings = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/draws?type=winners");
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setWinners(result.data ?? []);
    } catch {
      toast.error("Failed to load winnings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWinnings();
  }, [fetchWinnings]);

  // ─── SUBMIT PROOF ──────────────────────────────
  const handleProofSubmit = async (winnerId: string, proofUrl: string) => {
    try {
      const res = await fetch(`/api/draws?winner_id=${winnerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_upload_url: proofUrl }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      toast.success(TOAST_MESSAGES.PROOF_UPLOADED);
      // Update local state
      setWinners((prev) =>
        prev.map((w) =>
          w.id === winnerId
            ? { ...w, proof_upload_url: proofUrl, submitted_at: new Date().toISOString() }
            : w
        )
      );
    } catch {
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading winnings..." />
      </div>
    );
  }

  // ─── DERIVED TOTALS ───────────────────────────
  const totalWon = winners
    .filter((w) => w.payout_status === "paid")
    .reduce((sum, w) => sum + w.prize_amount, 0);

  const pendingAmount = winners
    .filter((w) => w.payout_status === "pending" && w.verification_status === "approved")
    .reduce((sum, w) => sum + w.prize_amount, 0);

  return (
    <div className="flex flex-col gap-8">

      {/* ─── PAGE HEADER ─────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          My Winnings
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Upload proof for pending wins. Track your payout status here.
        </p>
      </div>

      {/* ─── SUMMARY CARDS ───────────────────── */}
      {winners.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Total Paid Out</p>
            <p className="font-heading text-2xl font-bold text-success mt-1">
              {formatCurrency(totalWon)}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-[var(--color-text-secondary)]">Pending Payout</p>
            <p className="font-heading text-2xl font-bold text-warning mt-1">
              {formatCurrency(pendingAmount)}
            </p>
          </div>
        </div>
      )}

      {/* ─── WINNINGS LIST ───────────────────── */}
      {winners.length === 0 ? (
        <EmptyState
          icon={<Trophy className="w-10 h-10" />}
          title="No winnings yet"
          description="Match 3, 4, or 5 of your scores to the monthly drawn numbers to win a prize."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence initial={false}>
            {winners.map((winner, i) => (
              <motion.div
                key={winner.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
                className="card p-6 flex flex-col gap-4"
              >
                {/* Top row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    {winner.draw && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        {formatDrawMonth(winner.draw.draw_month)} Draw
                      </span>
                    )}
                    <MatchLabel matchType={winner.match_type} />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-heading text-xl font-bold text-[var(--color-text-primary)]">
                      {formatCurrency(winner.prize_amount)}
                    </span>
                    <VerificationBadge status={winner.verification_status} />
                    {winner.verification_status === "approved" && (
                      <PayoutBadge status={winner.payout_status} />
                    )}
                  </div>
                </div>

                {/* Proof upload — only for pending verification without proof yet */}
                {winner.verification_status === "pending" && (
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        Action required: Upload proof of your winning scores
                      </p>
                    </div>
                    <ProofUploadRow winner={winner} onSubmit={handleProofSubmit} />
                  </div>
                )}

                {/* Admin notes (if rejected) */}
                {winner.verification_status === "rejected" && winner.admin_notes && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-xs text-[var(--color-text-muted)] mb-1">Admin note:</p>
                    <p className="text-sm text-error">{winner.admin_notes}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
