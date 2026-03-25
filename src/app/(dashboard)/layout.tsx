// ─── DASHBOARD LAYOUT ────────────────────────
// Shared layout for all dashboard pages
// Wraps children in DashboardShell (sidebar + topbar)
// Auth guard is enforced by middleware.ts

import type { Metadata } from "next";
import DashboardShell from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: {
    template: "%s | Dashboard",
    default: "Dashboard",
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
