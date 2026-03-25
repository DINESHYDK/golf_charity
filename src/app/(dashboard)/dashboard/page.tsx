// ─── DASHBOARD OVERVIEW ──────────────────────
// Subscriber home: subscription banner + stat cards + quick actions
// Client component — uses useAuth, useScores, useDraws hooks

"use client";

import { Target, Heart, Ticket, Trophy } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useScores } from "@/hooks/useScores";
import { useDraws } from "@/hooks/useDraws";
import StatCard from "@/components/dashboard/StatCard";
import SubscriptionBanner from "@/components/dashboard/SubscriptionBanner";
import QuickActions from "@/components/dashboard/QuickActions";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function DashboardPage() {
  const { profile, subscription, isLoading: authLoading } = useAuth();
  const { scores, isLoading: scoresLoading } = useScores();
  const { myWinningDraws, isLoading: drawsLoading } = useDraws();

  const isLoading = authLoading || scoresLoading || drawsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ─── PAGE TITLE ──────────────────────── */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Here&apos;s your GolfGive overview.
        </p>
      </div>

      {/* ─── SUBSCRIPTION STATUS BANNER ──────── */}
      <SubscriptionBanner subscription={subscription} />

      {/* ─── STAT CARDS ──────────────────────── */}
      <section>
        <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-4">
          Your Stats
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="Scores Logged"
            value={`${scores.length} / 5`}
            subText="Rolling 5-score window"
          />
          <StatCard
            icon={<Heart className="w-5 h-5" />}
            label="Charity %"
            value={`${subscription?.charity_percentage ?? 10}%`}
            subText="of each payment donated"
          />
          <StatCard
            icon={<Ticket className="w-5 h-5" />}
            label="Draws Won"
            value={myWinningDraws.length}
            subText="3, 4, or 5 match wins"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5" />}
            label="Prize Pool Share"
            value="72%"
            subText="of every subscription"
            accent
          />
        </div>
      </section>

      {/* ─── QUICK ACTIONS ───────────────────── */}
      <QuickActions />
    </div>
  );
}
