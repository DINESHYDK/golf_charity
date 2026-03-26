// ─── WINNER VERIFICATION ──────────────────────
// Admin: review and manage prize winners
//
// Winner flow (CLAUDE.md):
//   pending → admin reviews proof → approved | rejected
//   approved → admin marks paid → paid
//
// Features:
//   - Tab filter: All | Pending | Approved | Rejected
//   - Winner table: name, draw month, match type, prize, proof link, status
//   - Approve/Reject with optional admin notes textarea
//   - Mark as Paid button (only for approved + payout pending)
//   - Payout status badge

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Banknote,
  RefreshCw,
  ExternalLink,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn, formatCurrency, formatDrawMonth } from "@/lib/utils";
import type { Winner, Profile, Draw } from "@/types";

// ─── EXTENDED WINNER TYPE ─────────────────────
// Omit base profile/draw so we can redefine with partial (API-queried) shapes
interface WinnerRow extends Omit<Winner, "profile" | "draw"> {
  profile: Pick<Profile, "id" | "full_name"> | null;
  draw: Pick<Draw, "id" | "draw_month" | "drawn_numbers" | "status"> | null;
}

// ─── MATCH TYPE BADGE ─────────────────────────
function MatchBadge({ matchType }: { matchType: 3 | 4 | 5 }) {
  const styles: Record<number, string> = {
    5: "bg-[var(--color-accent)]/20 text-[var(--color-accent-dark)] border-[var(--color-accent)]/30",
    4: "bg-blue-50 text-blue-700 border-blue-200",
    3: "bg-purple-50 text-purple-700 border-purple-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border",
        styles[matchType]
      )}
    >
      <Trophy className="w-3 h-3" />
      {matchType}-Match
    </span>
  );
}

// ─── VERIFICATION STATUS BADGE ────────────────
function VerificationBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:  "bg-amber-50 text-amber-700 border-amber-200",
    approved: "bg-green-50 text-green-700 border-green-200",
    rejected: "bg-red-50 text-red-600 border-red-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border capitalize",
        styles[status] ?? "bg-gray-50 text-gray-600 border-gray-200"
      )}
    >
      {status}
    </span>
  );
}

// ─── PAYOUT BADGE ────────────────────────────
function PayoutBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize",
        status === "paid"
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-gray-50 text-gray-500 border-gray-200"
      )}
    >
      {status}
    </span>
  );
}

// ─── WINNER ROW ──────────────────────────────
function WinnerRow({
  winner,
  onAction,
  mutating,
}: {
  winner: WinnerRow;
  onAction: (id: string, action: string, notes?: string) => void;
  mutating: string | null;
}) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState("");

  const isPending = winner.verification_status === "pending";
  const isApproved = winner.verification_status === "approved";
  const isPayoutPending = winner.payout_status === "pending";
  const isMutating = mutating === winner.id;

  return (
    <>
      <tr
        className={cn(
          "border-b border-[var(--color-border)] transition-colors",
          isPending && "bg-amber-50/30",
          "hover:bg-[var(--color-secondary)]/20"
        )}
      >
        {/* Winner name */}
        <td className="px-4 py-3">
          <p className="font-medium text-[var(--color-text-primary)]">
            {winner.profile?.full_name || "Unknown"}
          </p>
        </td>

        {/* Draw month */}
        <td className="px-4 py-3 text-[var(--color-text-secondary)]">
          {winner.draw ? formatDrawMonth(winner.draw.draw_month) : "—"}
        </td>

        {/* Match type */}
        <td className="px-4 py-3">
          <MatchBadge matchType={winner.match_type} />
        </td>

        {/* Prize amount */}
        <td className="px-4 py-3 font-semibold text-[var(--color-text-primary)]">
          {formatCurrency(winner.prize_amount)}
        </td>

        {/* Proof */}
        <td className="px-4 py-3">
          {winner.proof_upload_url ? (
            <a
              href={winner.proof_upload_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              View Proof <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Not submitted</span>
          )}
        </td>

        {/* Verification status */}
        <td className="px-4 py-3">
          <VerificationBadge status={winner.verification_status} />
        </td>

        {/* Payout status */}
        <td className="px-4 py-3">
          <PayoutBadge status={winner.payout_status} />
        </td>

        {/* Actions */}
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            {isMutating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
            ) : (
              <>
                {/* Mark paid (approved + payout pending) */}
                {isApproved && isPayoutPending && (
                  <button
                    onClick={() => onAction(winner.id, "mark_paid")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors"
                  >
                    <Banknote className="w-3 h-3" />
                    Mark Paid
                  </button>
                )}

                {/* Expand for approve/reject (pending only) */}
                {isPending && (
                  <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    <FileText className="w-3 h-3" />
                    Review
                    {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </>
            )}
          </div>
        </td>
      </tr>

      {/* ─── REVIEW PANEL (inline expand) ─────── */}
      {expanded && isPending && (
        <tr className="border-b border-[var(--color-border)] bg-amber-50/50">
          <td colSpan={8} className="px-4 py-4">
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                Admin Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Score screenshot verified, membership confirmed…"
                rows={2}
                className="w-full max-w-lg px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] resize-none transition-colors"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    onAction(winner.id, "approve", notes);
                    setExpanded(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => {
                    onAction(winner.id, "reject", notes);
                    setExpanded(false);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-xs hover:bg-[var(--color-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
              {winner.admin_notes && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Previous note: <em>{winner.admin_notes}</em>
                </p>
              )}
            </motion.div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── FILTER TABS ──────────────────────────────
const TABS = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
] as const;

// ─── MAIN COMPONENT ───────────────────────────
export default function WinnerVerification() {
  const [winners, setWinners] = useState<WinnerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("");
  const [mutating, setMutating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ─── FETCH ────────────────────────────────
  async function fetchWinners(status = "") {
    setLoading(true);
    setError(null);
    try {
      const params = status ? `?status=${status}` : "";
      const res = await fetch(`/api/admin/winners${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setWinners(json.data || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWinners(activeTab);
  }, [activeTab]);

  // ─── FEEDBACK ─────────────────────────────
  function showFeedback(msg: string, type: "success" | "error" = "success") {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ─── ACTION: approve | reject | mark_paid ─
  async function handleAction(winnerId: string, action: string, notes = "") {
    setMutating(winnerId);
    try {
      const res = await fetch("/api/admin/winners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ winner_id: winnerId, action, admin_notes: notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      // Update local state optimistically
      setWinners((prev) =>
        prev.map((w) => (w.id === winnerId ? { ...w, ...json.data } : w))
      );

      const messages: Record<string, string> = {
        approve:   "Winner approved — payout pending",
        reject:    "Winner rejected",
        mark_paid: "Payout marked as paid",
      };
      showFeedback(messages[action] || "Updated");
    } catch (e) {
      showFeedback((e as Error).message, "error");
    } finally {
      setMutating(null);
    }
  }

  const pendingCount = winners.filter((w) => w.verification_status === "pending").length;

  return (
    <div className="space-y-4">

      {/* ─── FILTER TABS ─────────────────────── */}
      <div className="flex items-center gap-1 border-b border-[var(--color-border)] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              activeTab === tab.value
                ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            )}
          >
            {tab.label}
            {tab.value === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 font-semibold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── FEEDBACK ─────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "px-4 py-3 rounded-lg border text-sm",
              feedback.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            )}
          >
            {feedback.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ─── TABLE ───────────────────────────── */}
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-secondary)]/40">
              {["Winner", "Draw", "Match", "Prize", "Proof", "Verification", "Payout", "Actions"].map(
                (h) => (
                  <th
                    key={h}
                    className={cn(
                      "px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider",
                      h === "Actions" ? "text-right" : "text-left"
                    )}
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : winners.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-[var(--color-text-muted)]" />
                    </div>
                    <p className="text-[var(--color-text-muted)]">
                      {activeTab ? `No ${activeTab} winners` : "No winners yet"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              winners.map((winner) => (
                <WinnerRow
                  key={winner.id}
                  winner={winner}
                  onAction={handleAction}
                  mutating={mutating}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {!loading && winners.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {winners.length} winner{winners.length !== 1 ? "s" : ""} shown
        </p>
      )}
    </div>
  );
}
