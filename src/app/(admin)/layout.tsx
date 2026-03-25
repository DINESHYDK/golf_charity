// ─── ADMIN LAYOUT ────────────────────────────
// Wraps all admin pages in AdminShell (sidebar + topbar)
// Admin role guard is enforced by middleware.ts

import type { Metadata } from "next";
import AdminShell from "@/components/layout/AdminShell";

export const metadata: Metadata = {
  title: { template: "%s | Admin", default: "Admin Panel" },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
