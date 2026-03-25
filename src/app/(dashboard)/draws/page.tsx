// ─── DRAWS PAGE ──────────────────────────────
// Shows: latest draw (with animated number reveal) + past draws history
// Uses useDraws hook — data is published draws with user's entry attached

"use client";

import { motion } from "framer-motion";
import { Ticket, Calendar, Info } from "lucide-react";
import { useDraws } from "@/hooks/useDraws";
import DrawCard from "@/components/draws/DrawCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import { formatDrawMonth } from "@/lib/utils";

export default function DrawsPage() {
  const { latestDraw, pastDraws, isLoading, error } = useDraws();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading draws..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ─── PAGE HEADER ─────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Prize Draws
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Match 3, 4, or 5 of your scores to the drawn numbers to win.
        </p>
      </div>

      {/* ─── HOW THE DRAW WORKS INFO BOX ─────── */}
      <div className="flex items-start gap-3 p-4 rounded-card bg-[var(--color-secondary)] border border-border">
        <Info className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--color-text-secondary)]">
          Each month, 5 numbers between 1–45 are drawn. Your 5 registered scores are compared.{" "}
          <strong className="text-[var(--color-text-primary)]">3 matches = 25% of pool · 4 matches = 35% · 5 matches = 40% + jackpot.</strong>{" "}
          The jackpot rolls over if no one gets 5 matches.
        </p>
      </div>

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}

      {/* ─── LATEST DRAW ─────────────────────── */}
      {latestDraw ? (
        <section>
          <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Latest Draw — {formatDrawMonth(latestDraw.draw_month)}
          </h2>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <DrawCard draw={latestDraw} />
          </motion.div>
        </section>
      ) : (
        <EmptyState
          icon={<Ticket className="w-10 h-10" />}
          title="No draws yet"
          description="The first monthly draw hasn't been published yet. Check back soon!"
        />
      )}

      {/* ─── PAST DRAWS ──────────────────────── */}
      {pastDraws.length > 1 && (
        <section>
          <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-4">
            Draw History
          </h2>
          <div className="flex flex-col gap-4">
            {/* Skip index 0 (that's latestDraw shown above) */}
            {pastDraws.slice(1).map((draw, i) => (
              <motion.div
                key={draw.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.07 }}
              >
                <DrawCard draw={draw} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
