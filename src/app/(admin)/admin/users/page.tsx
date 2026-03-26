// ─── ADMIN: USER MANAGEMENT ──────────────────
// Searchable table of all platform users
// Shows: name, email, role, subscription plan, status, charity %
// Actions: toggle role between subscriber ↔ admin

import type { Metadata } from "next";
import UserTable from "@/components/admin/UserTable";

export const metadata: Metadata = { title: "User Management" };

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          User Management
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Search users, view subscription status, and manage admin roles.
        </p>
      </div>
      <UserTable />
    </div>
  );
}
