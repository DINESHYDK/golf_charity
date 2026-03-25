// ─── ADMIN: CHARITY MANAGEMENT ───────────────
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Charity Management" };

export default function AdminCharitiesPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary mb-6">Charity Management</h1>
      {/* TODO: CharityTable, AddCharity, EditCharity, ManageEvents */}
      <p className="text-[var(--color-text-secondary)]">Charity management coming soon.</p>
    </div>
  );
}
