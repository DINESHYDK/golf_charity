// ─── ADMIN: DRAW MANAGEMENT ──────────────────
// Full draw lifecycle: create → simulate → publish
// Uses DrawSimulator component which calls /api/draws (POST)

import type { Metadata } from "next";
import DrawSimulator from "@/components/admin/DrawSimulator";

export const metadata: Metadata = { title: "Draw Management" };

export default function AdminDrawsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Draw Management
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Create monthly draws, run simulations, preview results, and publish to subscribers.
        </p>
      </div>

      {/* ─── FLOW REMINDER ───────────────────── */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] flex-wrap">
        {["Create → Scheduled", "Run Simulation → Simulated", "Review Results", "Publish → Live"].map(
          (step, i, arr) => (
            <span key={step} className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[var(--color-secondary)] text-[var(--color-text-secondary)] font-medium">
                {step}
              </span>
              {i < arr.length - 1 && <span className="text-[var(--color-text-muted)]">→</span>}
            </span>
          )
        )}
      </div>

      <DrawSimulator />
    </div>
  );
}
