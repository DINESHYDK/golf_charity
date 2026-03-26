// ─── SIGNUP PAGE ─────────────────────────────
// Split layout: branding panel (desktop left) + form (right)
// Suspense wraps SignupForm because it uses useSearchParams (?plan=)

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Trophy, Check } from "lucide-react";
import SignupForm from "@/components/auth/SignupForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const metadata: Metadata = {
  title: "Create Account",
};

const BENEFITS = [
  "Enter up to 5 Stableford scores",
  "Monthly prize draw entry",
  "Choose a charity to support",
  "Jackpot grows every month with no 5-match winner",
] as const;

export default function SignupPage() {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg-page)]">

      {/* ─── LEFT PANEL — Branding (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col justify-between p-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent">
            <Trophy className="w-5 h-5 text-primary-dark" />
          </div>
          <span className="font-heading text-xl font-bold text-[var(--color-text-on-dark)]">
            GolfGive
          </span>
        </Link>

        {/* Value prop */}
        <div>
          <h2 className="font-heading text-3xl font-bold text-[var(--color-text-on-dark)] mb-6">
            Everything you get with{" "}
            <span className="text-accent">GolfGive</span>
          </h2>
          <ul className="flex flex-col gap-4">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 flex-shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm text-[#efff]/80 leading-relaxed">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust badge */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-card bg-[var(--color-primary-light)]/40 border border-[var(--color-border-dark)]">
          <Trophy className="w-5 h-5 text-accent flex-shrink-0" />
          <p className="text-xs text-[#eeff]/60 leading-relaxed">
            Secure payments via Stripe. Cancel anytime.
            Your charity donation starts from your first payment.
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL — Form ──────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent">
            <Trophy className="w-5 h-5 text-primary-dark" />
          </div>
          <span className="font-heading text-xl font-bold text-primary">
            GolfGive
          </span>
        </Link>

        {/* Suspense needed because SignupForm uses useSearchParams */}
        <Suspense fallback={<LoadingSpinner size="md" text="Loading..." />}>
          <SignupForm />
        </Suspense>
      </div>
    </div>
  );
}
