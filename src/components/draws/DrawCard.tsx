// ─── DRAW CARD ────────────────────────────────
// Shows a published draw: drawn numbers, user's scores, match count
// Match logic: numbers in both user scores AND drawn numbers → highlighted

"use client";

import { motion } from "framer-motion";
import { Trophy, Ticket, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDrawMonth, formatCurrency } from "@/lib/utils";
import type { Draw, DrawEntry } from "@/types";

interface DrawWithEntry extends Draw {
  my_entry: DrawEntry | null;
}

interface DrawCardProps {
  draw: DrawWithEntry;
}

// ─── NUMBER BALL ─────────────────────────────
// Highlights a number if it's matched between drawn and user scores
function NumberBall({
  number,
  isMatch,
  isDrawn,
}: {
  number: number;
  isMatch: boolean;
  isDrawn: boolean; // true = from drawn numbers, false = from user scores
}) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-full font-heading font-bold text-sm",
        isMatch
          ? "bg-accent text-primary-dark shadow-[0_0_0_2px_var(--color-accent),0_0_12px_var(--color-accent)]"
          : isDrawn
          ? "bg-[var(--color-primary)] text-[var(--color-text-on-dark)]"
          : "bg-[var(--color-secondary)] text-[var(--color-text-secondary)] border border-border"
      )}
    >
      {number}
    </motion.div>
  );
}

// ─── MATCH TIER LABEL ────────────────────────
function MatchBadge({ matchCount }: { matchCount: number }) {
  if (matchCount === 5) return <span className="badge badge-success animate-pulse-gold">🏆 5 Matches — Jackpot!</span>;
  if (matchCount === 4) return <span className="badge badge-success">🥇 4 Matches — Winner!</span>;
  if (matchCount === 3) return <span className="badge badge-info">🥈 3 Matches — Winner!</span>;
  return <span className="badge badge-warning">{matchCount} matches — No prize</span>;
}

export default function DrawCard({ draw }: DrawCardProps) {
  const entry = draw.my_entry;
  const drawnNumbers = draw.drawn_numbers ?? [];
  const userScores = entry?.scores_snapshot ?? [];
  const matchCount = entry?.match_count ?? 0;

  // Numbers that appear in both lists = matches
  const matchedNumbers = new Set(
    userScores.filter((s) => drawnNumbers.includes(s))
  );

  return (
    <div className="card p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-[var(--color-text-muted)]" />
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              {formatDrawMonth(draw.draw_month)}
            </span>
          </div>
          <h3 className="font-heading text-lg font-bold text-[var(--color-text-primary)]">
            Monthly Draw
          </h3>
        </div>
        {entry && <MatchBadge matchCount={matchCount} />}
        {!entry && (
          <span className="badge badge-warning">No entry</span>
        )}
      </div>

      {/* Drawn numbers row */}
      {drawnNumbers.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Drawn Numbers
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {drawnNumbers.map((n) => (
              <NumberBall
                key={`drawn-${n}`}
                number={n}
                isMatch={matchedNumbers.has(n)}
                isDrawn={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* User scores row */}
      {userScores.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
            Your Scores
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {userScores.map((n) => (
              <NumberBall
                key={`score-${n}`}
                number={n}
                isMatch={matchedNumbers.has(n)}
                isDrawn={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* No entry message */}
      {!entry && (
        <div className="flex items-center gap-2 p-3 rounded-btn bg-[var(--color-secondary)] text-sm text-[var(--color-text-secondary)]">
          <Ticket className="w-4 h-4 flex-shrink-0" />
          You had no active scores when this draw ran.
        </div>
      )}

      {/* Prize amount (if winner) */}
      {entry && matchCount >= 3 && draw.prize_pool && (
        <div className="flex items-center gap-3 p-4 rounded-btn bg-success/10 border border-success/30">
          <Trophy className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Prize won — check Winnings for verification status
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
