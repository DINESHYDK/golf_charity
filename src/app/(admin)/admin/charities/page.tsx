// ─── ADMIN: CHARITY MANAGEMENT ───────────────
// Full CRUD for the charity directory
// Add, edit, toggle featured/active, soft-delete

import type { Metadata } from "next";
import CharityManager from "@/components/admin/CharityManager";

export const metadata: Metadata = { title: "Charity Management" };

export default function AdminCharitiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Charity Management
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage the charity directory — add new charities, feature them on the landing page,
          and control which charities subscribers can select.
        </p>
      </div>
      <CharityManager />
    </div>
  );
}
