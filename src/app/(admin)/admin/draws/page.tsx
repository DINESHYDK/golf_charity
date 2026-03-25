// ─── ADMIN: DRAW MANAGEMENT ──────────────────
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Draw Management" };

export default function AdminDrawsPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary mb-6">Draw Management</h1>
      {/* TODO: DrawSimulator, DrawConfig, PublishControls */}
      <p className="text-[var(--color-text-secondary)]">Draw management coming soon.</p>
    </div>
  );
}
