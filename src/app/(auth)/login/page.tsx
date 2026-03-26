// ─── LOGIN PAGE ──────────────────────────────
// Split layout: branding panel (desktop left) + form (right)
// Suspense wraps LoginForm because it uses useSearchParams

import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Trophy } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
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

        {/* Hero quote */}
        <div>
          <blockquote className="font-heading text-3xl font-bold text-[var(--color-text-on-dark)] leading-snug mb-4">
            &ldquo;Every round you play could win you prizes and change someone&apos;s life.&rdquo;
          </blockquote>
          <p className="text-sm text-[#fedf]/60">
            Join golfers who play with purpose.
          </p>
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="px-4 py-3 rounded-card bg-[var(--color-primary-light)]/40 border border-[var(--color-border-dark)]">
            <p className="font-heading text-2xl font-bold text-accent">72%</p>
            <p className="text-xs text-[#fedf]/60">goes to the prize pool</p>
          </div>
          <div className="px-4 py-3 rounded-card bg-[var(--color-primary-light)]/40 border border-[var(--color-border-dark)]">
            <p className="font-heading text-2xl font-bold text-accent">10%+</p>
            <p className="text-xs text-[#fedf]/60">goes to charity</p>
          </div>
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

        {/* Suspense needed because LoginForm uses useSearchParams */}
        <Suspense fallback={<LoadingSpinner size="md" text="Loading..." />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
