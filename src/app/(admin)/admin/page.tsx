// ─── ADMIN OVERVIEW ──────────────────────────
// Reports & analytics: total users, prize pool, charity totals, draw stats
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary mb-6">Admin Overview</h1>
      {/* TODO: AdminStats, RevenueChart, RecentActivity */}
      <p className="text-[var(--color-text-secondary)]">Admin analytics coming soon.</p>
    </div>
  );
}
