// ─── ADMIN: USER MANAGEMENT ──────────────────
import type { Metadata } from "next";
export const metadata: Metadata = { title: "User Management" };

export default function AdminUsersPage() {
  return (
    <div>
      <h1 className="font-heading text-3xl text-primary mb-6">User Management</h1>
      {/* TODO: UserTable with search, edit profiles, manage subscriptions */}
      <p className="text-[var(--color-text-secondary)]">User management coming soon.</p>
    </div>
  );
}
