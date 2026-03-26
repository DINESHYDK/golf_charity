// ─── ADMIN: WINNER VERIFICATION ──────────────
// Review prize winner claims and manage payouts
//
// Flow:
//   Winner identified (pending) → proof uploaded by user
//   → Admin reviews proof here → approve or reject
//   → Approved → Mark as Paid when payout sent

import type { Metadata } from "next";
import WinnerVerification from "@/components/admin/WinnerVerification";

export const metadata: Metadata = { title: "Winner Verification" };

export default function AdminWinnersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Winner Verification
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Review winner proof uploads, approve or reject claims, and track prize payouts.
        </p>
      </div>

      {/* ─── VERIFICATION FLOW REMINDER ──────── */}
      <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] flex-wrap">
        {[
          "Winner identified → Pending",
          "User uploads proof",
          "Admin reviews → Approve / Reject",
          "Mark as Paid",
        ].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-[var(--color-secondary)] text-[var(--color-text-secondary)] font-medium">
              {step}
            </span>
            {i < arr.length - 1 && <span>→</span>}
          </span>
        ))}
      </div>

      <WinnerVerification />
    </div>
  );
}
