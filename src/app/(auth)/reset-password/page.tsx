// ─── RESET PASSWORD PAGE ──────────────────────
// User lands here after clicking the email reset link from Supabase.
// Supabase appends ?code=<pkce_code> to the URL.
// 1. Exchange the code for a session (auth.exchangeCodeForSession)
// 2. Show a form to set a new password
// 3. Call auth.updateUser({ password }) and redirect to /dashboard

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Trophy } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExchanging, setIsExchanging] = useState(true);
  const [exchangeError, setExchangeError] = useState("");

  // ─── EXCHANGE CODE FOR SESSION ────────────────
  // Supabase sends ?code=... in the redirect URL.
  // We must exchange it for a session before updateUser will work.
  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setExchangeError("Invalid or expired reset link. Please request a new one.");
      setIsExchanging(false);
      return;
    }

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setExchangeError("This reset link has expired. Please request a new one.");
      }
      setIsExchanging(false);
    });
  }, [searchParams]);

  // ─── SUBMIT NEW PASSWORD ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setIsSaving(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated! Signing you in...");
    router.push("/dashboard");
    router.refresh();
  };

  // ─── LOADING STATE ────────────────────────────
  if (isExchanging) {
    return <LoadingSpinner size="md" text="Verifying reset link..." />;
  }

  // ─── ERROR STATE ─────────────────────────────
  if (exchangeError) {
    return (
      <div className="w-full max-w-md text-center">
        <p className="text-sm text-[var(--color-error)] mb-4">{exchangeError}</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-primary hover:text-accent transition-colors duration-250"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  // ─── NEW PASSWORD FORM ────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Set new password
        </h1>
        <p className="font-body text-sm text-[var(--color-text-secondary)]">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* New password */}
        <div className="relative">
          <Input
            label="New password"
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-primary transition-colors duration-250"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Confirm password */}
        <Input
          label="Confirm password"
          type={showPassword ? "text" : "password"}
          id="confirm"
          placeholder="Repeat your new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSaving}
          loadingText="Saving..."
          className="mt-2"
        >
          Update password
        </Button>
      </form>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex bg-[var(--color-bg-page)]">

      {/* Left branding panel (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent">
            <Trophy className="w-5 h-5 text-primary-dark" />
          </div>
          <span className="font-heading text-xl font-bold text-[var(--color-text-on-dark)]">
            GolfGive
          </span>
        </Link>
        <div>
          <blockquote className="font-heading text-3xl font-bold text-[var(--color-text-on-dark)] leading-snug mb-4">
            &ldquo;Back on the fairway in seconds.&rdquo;
          </blockquote>
          <p className="text-sm text-[#fedf]/60">Set your new password and pick up where you left off.</p>
        </div>
        <div />
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="flex items-center gap-2 mb-10 lg:hidden">
          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent">
            <Trophy className="w-5 h-5 text-primary-dark" />
          </div>
          <span className="font-heading text-xl font-bold text-primary">GolfGive</span>
        </Link>

        <Suspense fallback={<LoadingSpinner size="md" text="Loading..." />}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
