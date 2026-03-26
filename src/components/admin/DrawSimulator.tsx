// ─── DRAW SIMULATOR ───────────────────────────
// Admin: full draw lifecycle management UI
//
// State machine (from CLAUDE.md):
//   scheduled → (simulate) → simulated → (publish) → published
//
// Features:
//   - Create draw form (month + logic: random | algorithmic)
//   - Scheduled draws: Simulate button
//   - Simulated draws: Preview drawn numbers + winner summary + Publish button
//   - Published draws: Read-only results display
//   - Full history list sorted newest first

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dice5,
  Plus,
  Play,
  Send,
  CheckCircle,
  Clock,
  Trophy,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { cn, formatDrawMonth, formatCurrency } from "@/lib/utils";
import type { Draw } from "@/types";

// ─── EXTENDED DRAW TYPE: includes prize pool ──
interface DrawWithPool extends Draw {
  prize_pool?: {
    total_pool_amount: number;
    match_5_amount: number | null;
    match_4_amount: number | null;
    match_3_amount: number | null;
    active_subscriber_count: number | null;
    jackpot_rolled_over: boolean;
  };
}

// ─── STATUS BADGE ─────────────────────────────
function DrawStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { cls: string; icon: React.ReactNode }> = {
    scheduled:  { cls: "bg-blue-50 text-blue-700 border-blue-200", icon: <Clock className="w-3 h-3" /> },
    simulated:  { cls: "bg-amber-50 text-amber-700 border-amber-200", icon: <Dice5 className="w-3 h-3" /> },
    published:  { cls: "bg-green-50 text-green-700 border-green-200", icon: <CheckCircle className="w-3 h-3" /> },
  };
  const s = styles[status] ?? styles.scheduled;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border", s.cls)}>
      {s.icon}
      {status}
    </span>
  );
}

// ─── NUMBER BALL ──────────────────────────────
function NumberBall({ n }: { n: number }) {
  return (
    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-accent)] text-[var(--color-primary-dark)] font-heading font-bold text-sm shadow-md">
      {n}
    </div>
  );
}

// ─── DRAW CARD ────────────────────────────────
function DrawCard({
  draw,
  onSimulate,
  onPublish,
  simulating,
  publishing,
}: {
  draw: DrawWithPool;
  onSimulate: (id: string) => void;
  onPublish: (id: string) => void;
  simulating: string | null;
  publishing: string | null;
}) {
  const [expanded, setExpanded] = useState(draw.status === "simulated");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-[var(--color-border)] rounded-xl bg-[var(--color-bg-card)] overflow-hidden"
    >
      {/* ─── HEADER ─────────────────────────── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[var(--color-secondary)]/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <DrawStatusBadge status={draw.status} />
          <span className="font-heading font-semibold text-[var(--color-text-primary)]">
            {formatDrawMonth(draw.draw_month)}
          </span>
          {draw.prize_pool && (
            <span className="text-sm text-[var(--color-text-secondary)]">
              Pool: {formatCurrency(draw.prize_pool.total_pool_amount)}
            </span>
          )}
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />}
      </button>

      {/* ─── EXPANDED CONTENT ─────────────────── */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-[var(--color-border)] pt-4 space-y-4">

              {/* Draw info row */}
              <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                <span>Logic: <strong className="capitalize text-[var(--color-text-primary)]">{draw.draw_logic || "random"}</strong></span>
                {draw.jackpot_carried_in > 0 && (
                  <span className="text-amber-600">
                    Jackpot carried in: {formatCurrency(draw.jackpot_carried_in)}
                  </span>
                )}
                {draw.prize_pool && (
                  <span>
                    Subscribers: <strong className="text-[var(--color-text-primary)]">{draw.prize_pool.active_subscriber_count ?? "—"}</strong>
                  </span>
                )}
              </div>

              {/* Drawn numbers (if simulated or published) */}
              {draw.drawn_numbers && draw.drawn_numbers.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-3">
                    Drawn Numbers
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {draw.drawn_numbers.map((n) => (
                      <NumberBall key={n} n={n} />
                    ))}
                  </div>
                </div>
              )}

              {/* Prize pool breakdown (if simulated or published) */}
              {draw.prize_pool && (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "5-Match (40%)", amount: draw.prize_pool.match_5_amount },
                    { label: "4-Match (35%)", amount: draw.prize_pool.match_4_amount },
                    { label: "3-Match (25%)", amount: draw.prize_pool.match_3_amount },
                  ].map(({ label, amount }) => (
                    <div
                      key={label}
                      className="p-3 rounded-lg bg-[var(--color-secondary)]/40 border border-[var(--color-border)]"
                    >
                      <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                      <p className="font-semibold text-[var(--color-text-primary)] mt-0.5">
                        {amount ? formatCurrency(amount) : "—"}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Jackpot rollover warning */}
              {draw.prize_pool?.jackpot_rolled_over && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  No 5-match winner — jackpot rolls to next month
                </div>
              )}

              {/* ─── ACTION BUTTONS ─────────────────── */}
              <div className="flex gap-3 pt-1">
                {draw.status === "scheduled" && (
                  <button
                    onClick={() => onSimulate(draw.id)}
                    disabled={simulating === draw.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-on-dark)] text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {simulating === draw.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    {simulating === draw.id ? "Simulating…" : "Run Simulation"}
                  </button>
                )}

                {draw.status === "simulated" && (
                  <>
                    <button
                      onClick={() => onSimulate(draw.id)}
                      disabled={simulating === draw.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm font-medium hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-50"
                    >
                      {simulating === draw.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      Re-Simulate
                    </button>
                    <button
                      onClick={() => onPublish(draw.id)}
                      disabled={publishing === draw.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {publishing === draw.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      {publishing === draw.id ? "Publishing…" : "Publish Results"}
                    </button>
                  </>
                )}

                {draw.status === "published" && (
                  <span className="flex items-center gap-2 text-sm text-green-600 font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Published {draw.published_at ? new Date(draw.published_at).toLocaleDateString("en-GB") : ""}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────
export default function DrawSimulator() {
  const [draws, setDraws] = useState<DrawWithPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // ─── Create draw form ─────────────────────
  const [showForm, setShowForm] = useState(false);
  const [drawMonth, setDrawMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [drawLogic, setDrawLogic] = useState<"random" | "algorithmic">("random");
  const [creating, setCreating] = useState(false);

  // ─── FETCH DRAWS ─────────────────────────
  async function fetchDraws() {
    setLoading(true);
    try {
      const res = await fetch("/api/draws");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setDraws(json.data || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDraws();
  }, []);

  // ─── SHOW FEEDBACK ────────────────────────
  function showFeedback(msg: string, type: "success" | "error" = "success") {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ─── CREATE DRAW ─────────────────────────
  async function handleCreate() {
    setCreating(true);
    try {
      const res = await fetch("/api/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", draw_month: drawMonth, draw_logic: drawLogic }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showFeedback(`Draw for ${formatDrawMonth(drawMonth)} created successfully`);
      setShowForm(false);
      fetchDraws();
    } catch (e) {
      showFeedback((e as Error).message, "error");
    } finally {
      setCreating(false);
    }
  }

  // ─── SIMULATE DRAW ────────────────────────
  async function handleSimulate(drawId: string) {
    setSimulating(drawId);
    try {
      const res = await fetch("/api/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "simulate", draw_id: drawId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const d = json.data;
      showFeedback(
        `Simulation complete — ${d.winners} winner(s) from ${d.total_entries} entries. Pool: ${formatCurrency(d.prize_pool)}`
      );
      fetchDraws();
    } catch (e) {
      showFeedback((e as Error).message, "error");
    } finally {
      setSimulating(null);
    }
  }

  // ─── PUBLISH DRAW ─────────────────────────
  async function handlePublish(drawId: string) {
    setPublishing(drawId);
    try {
      const res = await fetch("/api/draws", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", draw_id: drawId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      showFeedback("Draw published! Results are now visible to subscribers.");
      fetchDraws();
    } catch (e) {
      showFeedback((e as Error).message, "error");
    } finally {
      setPublishing(null);
    }
  }

  return (
    <div className="space-y-5">

      {/* ─── HEADER + CREATE BUTTON ──────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage monthly prize draws — create, simulate, and publish results
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-on-dark)] text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Draw
        </button>
      </div>

      {/* ─── CREATE FORM ─────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 space-y-4">
              <h3 className="font-heading font-semibold text-[var(--color-text-primary)]">
                Schedule New Draw
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                    Draw Month
                  </label>
                  <input
                    type="month"
                    value={drawMonth}
                    onChange={(e) => setDrawMonth(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5 uppercase tracking-wider">
                    Draw Logic
                  </label>
                  <select
                    value={drawLogic}
                    onChange={(e) => setDrawLogic(e.target.value as "random" | "algorithmic")}
                    className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                  >
                    <option value="random">Random — 5 random numbers (1–45)</option>
                    <option value="algorithmic">Algorithmic — weighted by score frequency</option>
                  </select>
                </div>
              </div>
              {drawLogic === "algorithmic" && (
                <p className="text-xs text-[var(--color-text-muted)]">
                  Algorithmic mode picks numbers weighted toward common scores across all subscribers, increasing the chance of matches and engagement.
                </p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm font-semibold hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {creating ? "Creating…" : "Create Draw"}
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm hover:bg-[var(--color-secondary)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* ─── ERROR ────────────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ─── DRAW LIST ────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : draws.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--color-secondary)] flex items-center justify-center">
            <Trophy className="w-6 h-6 text-[var(--color-text-muted)]" />
          </div>
          <p className="text-[var(--color-text-secondary)]">No draws yet. Create your first draw above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {draws.map((draw) => (
            <DrawCard
              key={draw.id}
              draw={draw}
              onSimulate={handleSimulate}
              onPublish={handlePublish}
              simulating={simulating}
              publishing={publishing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
