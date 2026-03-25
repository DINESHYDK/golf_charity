// ─── DASHBOARD SHELL ──────────────────────────
// Wraps all dashboard pages with sidebar + topbar
// Desktop: fixed left sidebar (260px) + scrollable main content
// Mobile: topbar with hamburger + slide-in sidebar drawer

"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Bell } from "lucide-react";
import Sidebar from "@/components/layout/Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-page)]">

      {/* ─── DESKTOP SIDEBAR (fixed, 260px) ─────── */}
      <div className="hidden lg:flex lg:flex-shrink-0 lg:w-64">
        <div className="flex flex-col w-full">
          <Sidebar />
        </div>
      </div>

      {/* ─── MOBILE SIDEBAR OVERLAY ─────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            />
            {/* Sidebar drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-64 lg:hidden"
            >
              <Sidebar onClose={() => setIsMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── MAIN CONTENT AREA ──────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">

        {/* ─── TOPBAR ───────────────────────────── */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 bg-[var(--color-bg-card)] border-b border-border shadow-nav flex-shrink-0">

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMobileOpen(true)}
            className="lg:hidden p-2 rounded-btn text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] transition-colors duration-250"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title placeholder — updated by each page via h1 */}
          <div className="hidden lg:block" />

          {/* Right side: notification bell + user greeting */}
          <div className="flex items-center gap-3 ml-auto">
            <button
              className="relative p-2 rounded-btn text-[var(--color-text-secondary)] hover:bg-[var(--color-secondary)] transition-colors duration-250"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {profile?.full_name ?? "Welcome back"}
              </span>
              <span className="text-xs text-[var(--color-text-muted)] capitalize">
                {profile?.role ?? "subscriber"}
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
