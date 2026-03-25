// ─── ADMIN SHELL ─────────────────────────────
// Wraps all admin pages with the admin sidebar + topbar
// Mirrors DashboardShell but uses AdminSidebar

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, ShieldCheck } from "lucide-react";
import AdminSidebar from "@/components/layout/AdminSidebar";
import { useAuth } from "@/hooks/useAuth";

interface AdminShellProps {
  children: React.ReactNode;
}

export default function AdminShell({ children }: AdminShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-page)]">

      {/* ─── DESKTOP ADMIN SIDEBAR ──────────────── */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
        <div className="flex flex-col w-full">
          <AdminSidebar />
        </div>
      </div>

      {/* ─── MOBILE SIDEBAR OVERLAY ─────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <AdminSidebar onClose={() => setIsMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT AREA ──────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ─── ADMIN TOPBAR ─────────────────────── */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-[var(--color-bg-card)] border-b border-border shadow-nav flex-shrink-0">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-btn text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] transition-colors duration-250"
            aria-label="Open admin sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden lg:block" />

          {/* Admin badge + user name */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-error/10 border border-error/20">
              <ShieldCheck className="w-3.5 h-3.5 text-error" />
              <span className="text-xs font-semibold text-error">Admin</span>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {profile?.full_name ?? "Administrator"}
              </span>
            </div>
          </div>
        </header>

        {/* ─── SCROLLABLE PAGE CONTENT ──────────── */}
        <main className="flex-1 overflow-y-auto">
          <div className="container-custom py-6 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
