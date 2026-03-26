// ─── USER TABLE ───────────────────────────────
// Admin: searchable table of all users
// Columns: Name, Email, Role, Plan, Status, Charity%, Joined
// Actions: toggle role | view & edit user's scores
// Data: fetched from /api/admin/users

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ShieldCheck, User, RefreshCw, ChevronDown, Target, Pencil } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import Modal from "@/components/ui/Modal";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import type { Profile, Subscription, Score } from "@/types";

// ─── EXTENDED TYPE ────────────────────────────
interface UserRow extends Profile {
  email: string | null;
  subscriptions: Subscription[] | null;
}

// ─── STATUS BADGE ─────────────────────────────
function SubStatusBadge({ status }: { status: string | undefined }) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
        No subscription
      </span>
    );
  }
  const styles: Record<string, string> = {
    active:    "bg-green-100 text-green-700",
    inactive:  "bg-gray-100 text-gray-500",
    cancelled: "bg-red-100 text-red-600",
    lapsed:    "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
        styles[status] ?? "bg-gray-100 text-gray-500"
      )}
    >
      {status}
    </span>
  );
}

// ─── ROLE BADGE ──────────────────────────────
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        role === "admin"
          ? "bg-red-100 text-red-700"
          : "bg-blue-100 text-blue-700"
      )}
    >
      {role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <User className="w-3 h-3" />}
      {role}
    </span>
  );
}

// ─── INLINE SCORE EDIT ROW ────────────────────
function AdminScoreEditRow({
  score,
  onSave,
  onCancel,
  isSaving,
}: {
  score: Score;
  onSave: (id: string, value: number, date: string) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [val, setVal] = useState(String(score.score_value));
  const [date, setDate] = useState(score.score_date);
  const [err, setErr] = useState<string | null>(null);
  const today = new Date().toISOString().split("T")[0];

  const handleSave = async () => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1 || parsed > 45) {
      setErr("Score must be 1–45");
      return;
    }
    if (!date || date > today) {
      setErr("Date cannot be in the future");
      return;
    }
    setErr(null);
    await onSave(score.id, parsed, date);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="number"
          min={1}
          max={45}
          value={val}
          onChange={(e) => { setVal(e.target.value); setErr(null); }}
          className="w-20 px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)]"
        />
        <input
          type="date"
          max={today}
          value={date}
          onChange={(e) => { setDate(e.target.value); setErr(null); }}
          className="px-2 py-1 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)]"
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-3 py-1 text-xs font-semibold bg-[var(--color-primary)] text-[var(--color-text-on-dark)] rounded-lg hover:bg-[var(--color-primary-light)] transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="px-3 py-1 text-xs text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-secondary)] transition-colors"
        >
          Cancel
        </button>
      </div>
      {err && <p className="text-xs text-red-600">{err}</p>}
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────
export default function UserTable() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // ─── SCORE MODAL STATE ────────────────────
  const [scoringUserId, setScoringUserId] = useState<string | null>(null);
  const [scoringUserName, setScoringUserName] = useState<string>("");
  const [userScores, setUserScores] = useState<Score[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [editingAdminScore, setEditingAdminScore] = useState<Score | null>(null);
  const [adminScoreSaving, setAdminScoreSaving] = useState(false);

  // ─── FETCH USERS ─────────────────────────
  const fetchUsers = useCallback(async (query = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`/api/admin/users${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers(json.data || []);
    } catch (e) {
      setError((e as Error).message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ─── SEARCH: debounce 400ms ───────────────
  useEffect(() => {
    const timeout = setTimeout(() => fetchUsers(search), 400);
    return () => clearTimeout(timeout);
  }, [search, fetchUsers]);

  // ─── TOGGLE ROLE ─────────────────────────
  async function toggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "admin" ? "subscriber" : "admin";
    setUpdatingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole as "admin" | "subscriber" } : u))
      );
      setFeedback(`Role updated to ${newRole}`);
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback(`Error: ${(e as Error).message}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setUpdatingId(null);
    }
  }

  // ─── OPEN SCORES MODAL ────────────────────
  async function openScoresModal(userId: string, name: string) {
    setScoringUserId(userId);
    setScoringUserName(name);
    setEditingAdminScore(null);
    setScoresLoading(true);
    try {
      const res = await fetch(`/api/admin/scores?user_id=${userId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUserScores(json.data || []);
    } catch (e) {
      setFeedback(`Error loading scores: ${(e as Error).message}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setScoresLoading(false);
    }
  }

  // ─── ADMIN SCORE UPDATE ───────────────────
  async function handleAdminScoreUpdate(scoreId: string, scoreValue: number, scoreDate: string) {
    setAdminScoreSaving(true);
    try {
      const res = await fetch("/api/admin/scores", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score_id: scoreId, score_value: scoreValue, score_date: scoreDate }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      // Optimistic local update
      setUserScores((prev) =>
        prev.map((s) =>
          s.id === scoreId ? { ...s, score_value: scoreValue, score_date: scoreDate } : s
        )
      );
      setEditingAdminScore(null);
      setFeedback("Score updated");
      setTimeout(() => setFeedback(null), 3000);
    } catch (e) {
      setFeedback(`Error: ${(e as Error).message}`);
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setAdminScoreSaving(false);
    }
  }

  function getActiveSub(subs: Subscription[] | null) {
    return subs?.find((s) => s.status === "active") || subs?.[0] || null;
  }

  return (
    <div className="space-y-4">

      {/* ─── TOOLBAR ────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
          />
        </div>
        <button
          onClick={() => fetchUsers(search)}
          className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-secondary)] transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* ─── FEEDBACK ────────────────────────── */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700"
          >
            {feedback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── ERROR ───────────────────────────── */}
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
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Charity %</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Joined</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  {search ? "No users match your search." : "No users found."}
                </td>
              </tr>
            ) : (
              users.map((user, idx) => {
                const activeSub = getActiveSub(user.subscriptions);
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-secondary)]/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">{user.full_name || "—"}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{user.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 capitalize text-[var(--color-text-secondary)]">{activeSub?.plan_type || "—"}</td>
                    <td className="px-4 py-3"><SubStatusBadge status={activeSub?.status} /></td>
                    <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                      {activeSub ? `${activeSub.charity_percentage}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Scores button */}
                        <button
                          onClick={() => openScoresModal(user.id, user.full_name ?? user.email ?? "User")}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors"
                        >
                          <Target className="w-3 h-3" />
                          Scores
                        </button>
                        {/* Role toggle */}
                        <button
                          onClick={() => toggleRole(user.id, user.role)}
                          disabled={updatingId === user.id}
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                            user.role === "admin"
                              ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                              : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200",
                            updatingId === user.id && "opacity-50 cursor-not-allowed"
                          )}
                        >
                          {updatingId === user.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                          {user.role === "admin" ? "Demote" : "Make Admin"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && users.length > 0 && (
        <p className="text-xs text-[var(--color-text-muted)] text-right">
          {users.length} user{users.length !== 1 ? "s" : ""} shown
        </p>
      )}

      {/* ─── USER SCORES MODAL ───────────────── */}
      <Modal
        isOpen={scoringUserId !== null}
        onClose={() => { setScoringUserId(null); setEditingAdminScore(null); setUserScores([]); }}
        title={`Scores — ${scoringUserName}`}
        size="md"
      >
        {scoresLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="md" text="Loading scores..." />
          </div>
        ) : userScores.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-8">
            No scores on record for this user.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {userScores.map((score) => (
              <li key={score.id} className="py-4 flex items-center justify-between gap-4">
                {editingAdminScore?.id === score.id ? (
                  <AdminScoreEditRow
                    score={score}
                    onSave={handleAdminScoreUpdate}
                    onCancel={() => setEditingAdminScore(null)}
                    isSaving={adminScoreSaving}
                  />
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[var(--color-primary)] text-[var(--color-text-on-dark)] flex items-center justify-center font-heading font-bold text-base flex-shrink-0">
                        {score.score_value}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          Round on {formatDate(score.score_date)}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Entered {formatDate(score.created_at)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingAdminScore(score)}
                      className="p-2 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors"
                      aria-label="Edit score"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
