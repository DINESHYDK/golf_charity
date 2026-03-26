// ─── CHARITY MANAGER ──────────────────────────
// Admin: full CRUD for the charity directory
//
// Features:
//   - Charity list table with all fields (including inactive)
//   - Add charity form (inline toggle)
//   - Toggle is_featured and is_active per row
//   - Edit charity name/description/website/image
//   - Soft-delete (deactivate) via DELETE API
//
// API: /api/admin/charities (GET, POST, PATCH, DELETE)

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  RefreshCw,
  Star,
  StarOff,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Check,
  X,
  Heart,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Charity } from "@/types";

// ─── INLINE EDIT STATE ────────────────────────
interface EditState {
  name: string;
  description: string;
  website_url: string;
  image_url: string;
}

// ─── CHARITY ROW ─────────────────────────────
function CharityRow({
  charity,
  onToggleFeatured,
  onToggleActive,
  onUpdate,
  onDelete,
  mutating,
}: {
  charity: Charity;
  onToggleFeatured: (id: string, val: boolean) => void;
  onToggleActive: (id: string, val: boolean) => void;
  onUpdate: (id: string, data: EditState) => void;
  onDelete: (id: string) => void;
  mutating: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState<EditState>({
    name: charity.name,
    description: charity.description || "",
    website_url: charity.website_url || "",
    image_url: charity.image_url || "",
  });

  function handleSave() {
    onUpdate(charity.id, editState);
    setEditing(false);
  }

  const isMutating = mutating === charity.id;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "border-b border-[var(--color-border)] last:border-0 transition-colors",
        !charity.is_active && "opacity-50 bg-gray-50",
        charity.is_active && "hover:bg-[var(--color-secondary)]/20"
      )}
    >
      {/* Name / Description */}
      <td className="px-4 py-3">
        {editing ? (
          <div className="space-y-1.5">
            <input
              value={editState.name}
              onChange={(e) => setEditState((s) => ({ ...s, name: e.target.value }))}
              placeholder="Charity name"
              className="w-full text-sm px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <input
              value={editState.description}
              onChange={(e) => setEditState((s) => ({ ...s, description: e.target.value }))}
              placeholder="Description"
              className="w-full text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        ) : (
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">{charity.name}</p>
            {charity.description && (
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate max-w-[220px]">
                {charity.description}
              </p>
            )}
          </div>
        )}
      </td>

      {/* Website */}
      <td className="px-4 py-3">
        {editing ? (
          <input
            value={editState.website_url}
            onChange={(e) => setEditState((s) => ({ ...s, website_url: e.target.value }))}
            placeholder="https://…"
            className="w-full text-xs px-2 py-1 border border-[var(--color-border)] rounded focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        ) : charity.website_url ? (
          <a
            href={charity.website_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
          >
            Visit <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">—</span>
        )}
      </td>

      {/* Featured toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleFeatured(charity.id, !charity.is_featured)}
          disabled={isMutating}
          title={charity.is_featured ? "Unfeature" : "Feature"}
          className="p-1.5 rounded hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-40"
        >
          {charity.is_featured ? (
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          ) : (
            <StarOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </td>

      {/* Active toggle */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggleActive(charity.id, !charity.is_active)}
          disabled={isMutating}
          title={charity.is_active ? "Deactivate" : "Activate"}
          className="p-1.5 rounded hover:bg-[var(--color-secondary)] transition-colors disabled:opacity-40"
        >
          {charity.is_active ? (
            <Eye className="w-4 h-4 text-green-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </td>

      {/* Actions */}
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          {isMutating ? (
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--color-text-muted)]" />
          ) : editing ? (
            <>
              <button
                onClick={handleSave}
                className="p-1.5 rounded bg-green-50 hover:bg-green-100 text-green-600 transition-colors"
                title="Save"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditState({
                    name: charity.name,
                    description: charity.description || "",
                    website_url: charity.website_url || "",
                    image_url: charity.image_url || "",
                  });
                }}
                className="p-1.5 rounded bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(charity.id)}
                className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                title="Deactivate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
}

// ─── MAIN COMPONENT ───────────────────────────
export default function CharityManager() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // ─── Add form state ────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCharity, setNewCharity] = useState({
    name: "",
    description: "",
    website_url: "",
    image_url: "",
    is_featured: false,
  });
  const [adding, setAdding] = useState(false);

  // ─── FETCH ────────────────────────────────
  async function fetchCharities() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/charities");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCharities(json.data || []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCharities();
  }, []);

  // ─── FEEDBACK HELPER ─────────────────────
  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  }

  // ─── PATCH HELPER ─────────────────────────
  async function patch(id: string, updates: Record<string, unknown>) {
    setMutating(id);
    try {
      const res = await fetch("/api/admin/charities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setCharities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...json.data } : c))
      );
      showFeedback("Charity updated");
    } catch (e) {
      showFeedback(`Error: ${(e as Error).message}`);
    } finally {
      setMutating(null);
    }
  }

  function handleToggleFeatured(id: string, val: boolean) {
    patch(id, { is_featured: val });
  }

  function handleToggleActive(id: string, val: boolean) {
    patch(id, { is_active: val });
  }

  function handleUpdate(id: string, data: EditState) {
    patch(id, data as unknown as Record<string, unknown>);
  }

  // ─── DELETE (soft) ────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Deactivate this charity? It will be hidden from subscribers but historical data is preserved.")) return;
    setMutating(id);
    try {
      const res = await fetch("/api/admin/charities", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCharities((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_active: false } : c))
      );
      showFeedback("Charity deactivated");
    } catch (e) {
      showFeedback(`Error: ${(e as Error).message}`);
    } finally {
      setMutating(null);
    }
  }

  // ─── ADD CHARITY ─────────────────────────
  async function handleAdd() {
    if (!newCharity.name.trim()) {
      showFeedback("Charity name is required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("/api/admin/charities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCharity),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCharities((prev) => [json.data, ...prev]);
      setNewCharity({ name: "", description: "", website_url: "", image_url: "", is_featured: false });
      setShowAddForm(false);
      showFeedback("Charity added successfully");
    } catch (e) {
      showFeedback(`Error: ${(e as Error).message}`);
    } finally {
      setAdding(false);
    }
  }

  const activeCount = charities.filter((c) => c.is_active).length;
  const featuredCount = charities.filter((c) => c.is_featured).length;

  return (
    <div className="space-y-4">

      {/* ─── TOOLBAR ────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-4 text-sm text-[var(--color-text-secondary)]">
          <span>{activeCount} active</span>
          <span>·</span>
          <span>{featuredCount} featured</span>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-primary)] text-[var(--color-text-on-dark)] text-sm font-medium hover:bg-[var(--color-primary-light)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Charity
        </button>
      </div>

      {/* ─── ADD FORM ─────────────────────────── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 rounded-xl border border-[var(--color-accent)]/40 bg-[var(--color-accent)]/5 space-y-3">
              <h3 className="font-heading font-semibold text-[var(--color-text-primary)]">
                Add New Charity
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={newCharity.name}
                  onChange={(e) => setNewCharity((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Charity name *"
                  className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                />
                <input
                  value={newCharity.website_url}
                  onChange={(e) => setNewCharity((s) => ({ ...s, website_url: e.target.value }))}
                  placeholder="Website URL (https://…)"
                  className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                />
                <input
                  value={newCharity.description}
                  onChange={(e) => setNewCharity((s) => ({ ...s, description: e.target.value }))}
                  placeholder="Short description"
                  className="sm:col-span-2 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                />
                <input
                  value={newCharity.image_url}
                  onChange={(e) => setNewCharity((s) => ({ ...s, image_url: e.target.value }))}
                  placeholder="Image URL (optional)"
                  className="px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-card)] focus:outline-none focus:ring-2 focus:ring-[rgba(26,60,52,0.2)] focus:border-[var(--color-primary)] transition-colors"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCharity.is_featured}
                    onChange={(e) => setNewCharity((s) => ({ ...s, is_featured: e.target.checked }))}
                    className="w-4 h-4 accent-[var(--color-accent)]"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">Feature on landing page</span>
                </label>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-[var(--color-primary-dark)] text-sm font-semibold hover:bg-[var(--color-accent-dark)] transition-colors disabled:opacity-50"
                >
                  {adding ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {adding ? "Adding…" : "Add Charity"}
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
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
            className="px-4 py-2 rounded-lg bg-green-50 border border-green-200 text-sm text-green-700"
          >
            {feedback}
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
              {["Charity", "Website", "Featured", "Active", "Actions"].map((h) => (
                <th
                  key={h}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider",
                    ["Featured", "Active"].includes(h) ? "text-center" : "text-left",
                    h === "Actions" && "text-right"
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            ) : charities.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Heart className="w-8 h-8 text-[var(--color-text-muted)]" />
                    <p className="text-[var(--color-text-muted)]">No charities yet. Add one above.</p>
                  </div>
                </td>
              </tr>
            ) : (
              charities.map((charity) => (
                <CharityRow
                  key={charity.id}
                  charity={charity}
                  onToggleFeatured={handleToggleFeatured}
                  onToggleActive={handleToggleActive}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  mutating={mutating}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

