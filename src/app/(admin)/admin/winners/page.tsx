// ─── ADMIN: WINNER VERIFICATION ──────────────
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Winner Verification" };

export default function AdminWinnersPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary mb-6">Winner Verification</h1>
      {/* TODO: WinnerTable, ProofReview, PayoutControls */}
      <p className="text-[var(--color-text-secondary)]">Winner verification coming soon.</p>
    </div>
  );
}
