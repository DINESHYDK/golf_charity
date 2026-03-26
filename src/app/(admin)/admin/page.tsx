// ─── ADMIN OVERVIEW ───────────────────────────
// High-level metrics + quick actions
// Stats: total users, active subscribers, prize pool,
//        charity contributions, total draws, pending verifications
// "use client" — uses useState/useEffect for async stats fetch
// Metadata provided by (admin)/layout.tsx title template

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Trophy,
  Heart,
  Dice5,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { formatCurrency } from "@/lib/utils";
import type { AdminStats } from "@/types";

// ─── QUICK ACTION CARD ────────────────────────
function QuickAction({
  href,
  icon: Icon,
  label,
  description,
  delay,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        href={href}
        className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-secondary)]/30 group transition-all duration-200"
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex-shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-text-on-dark)] transition-colors">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--color-text-primary)] text-sm">{label}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{description}</p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </Link>
    </motion.div>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setStats(json.data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="space-y-8">

      {/* ─── PAGE HEADER ─────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Admin Overview
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Platform health, engagement metrics, and quick access to all admin tools.
        </p>
      </motion.div>

      {/* ─── ERROR STATE ─────────────────────── */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          Failed to load stats: {error}
        </div>
      )}

      {/* ─── STATS GRID ──────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] animate-pulse" />
          ))
        ) : stats ? (
          <>
            <AdminStatCard
              label="Total Users"
              value={stats.total_users.toLocaleString()}
              icon={Users}
              delay={0}
            />
            <AdminStatCard
              label="Active Subscribers"
              value={stats.active_subscribers.toLocaleString()}
              icon={Activity}
              variant="success"
              subLabel={`${stats.total_users > 0 ? Math.round((stats.active_subscribers / stats.total_users) * 100) : 0}% conversion rate`}
              delay={0.05}
            />
            <AdminStatCard
              label="Total Prize Pool"
              value={formatCurrency(stats.total_prize_pool)}
              icon={Trophy}
              variant="default"
              delay={0.1}
            />
            <AdminStatCard
              label="Total Charity Contributions"
              value={formatCurrency(stats.total_charity_contributions)}
              icon={Heart}
              variant="success"
              delay={0.15}
            />
            <AdminStatCard
              label="Total Draws Run"
              value={stats.total_draws.toLocaleString()}
              icon={Dice5}
              delay={0.2}
            />
            <AdminStatCard
              label="Pending Verifications"
              value={stats.pending_verifications.toLocaleString()}
              icon={ShieldAlert}
              variant={stats.pending_verifications > 0 ? "warning" : "default"}
              subLabel={stats.pending_verifications > 0 ? "Requires attention" : "All clear"}
              delay={0.25}
            />
          </>
        ) : null}
      </div>

      {/* ─── QUICK ACTIONS ───────────────────── */}
      <div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="font-heading text-lg font-semibold text-[var(--color-text-primary)] mb-4"
        >
          Quick Actions
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <QuickAction
            href="/admin/draws"
            icon={Dice5}
            label="Manage Draws"
            description="Create, simulate, and publish monthly prize draws"
            delay={0.35}
          />
          <QuickAction
            href="/admin/winners"
            icon={Trophy}
            label="Verify Winners"
            description="Review proof uploads and approve or reject claims"
            delay={0.4}
          />
          <QuickAction
            href="/admin/users"
            icon={Users}
            label="User Management"
            description="Search users, view subscriptions, and manage roles"
            delay={0.45}
          />
          <QuickAction
            href="/admin/charities"
            icon={Heart}
            label="Charity Directory"
            description="Add, edit, and manage featured charities"
            delay={0.5}
          />
        </div>
      </div>

      {/* ─── REVENUE SPLIT REMINDER ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.4 }}
        className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-secondary)]/30"
      >
        <h3 className="font-heading text-sm font-bold text-[var(--color-text-primary)] mb-3 uppercase tracking-wider">
          Revenue Split Reference
        </h3>
        <div className="flex flex-wrap gap-6">
          {[
            { label: "Prize Pool", pct: "72%", color: "text-[var(--color-primary)]" },
            { label: "Charity (min)", pct: "10%", color: "text-green-600" },
            { label: "Platform", pct: "18%", color: "text-[var(--color-text-secondary)]" },
          ].map(({ label, pct, color }) => (
            <div key={label}>
              <p className={`text-2xl font-heading font-bold ${color}`}>{pct}</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-3">
          Prize pool is always fixed at 72%. If charity % increases beyond 10%, the extra comes from the platform fee.
        </p>
      </motion.div>
    </div>
  );
}
