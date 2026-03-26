// ─── LOGIN FORM ──────────────────────────────
// Email + password login using Supabase Auth
// Loading spinner on submit, toast on success/error
// Redirects to /dashboard on success (or ?redirect= param)
// Includes inline "Forgot password?" flow — no separate page needed

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  // ─── FORGOT PASSWORD STATE ────────────────────
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // ─── VALIDATION ──────────────────────────────
  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── FORGOT PASSWORD SUBMIT ──────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      toast.error("Enter a valid email address");
      return;
    }

    setIsSendingReset(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSendingReset(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    setResetSent(true);
  };

  // ─── SIGN IN SUBMIT ──────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      // Show specific error messages for common cases
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Incorrect email or password");
      } else if (error.message.includes("Email not confirmed")) {
        toast.error("Please verify your email before signing in");
      } else {
        toast.error(error.message);
      }
      return;
    }

    toast.success("Welcome back!");
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="w-full max-w-md"
    >
      <AnimatePresence mode="wait">

        {/* ─── FORGOT PASSWORD VIEW ──────────────── */}
        {showForgotPassword ? (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {/* Back button */}
            <button
              onClick={() => { setShowForgotPassword(false); setResetSent(false); setResetEmail(""); }}
              className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-primary mb-6 transition-colors duration-250"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </button>

            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                Reset password
              </h1>
              <p className="font-body text-sm text-[var(--color-text-secondary)]">
                Enter your email and we&apos;ll send you a reset link.
              </p>
            </div>

            {resetSent ? (
              // ─── SUCCESS STATE ────────────────────
              <div className="rounded-card border border-[var(--color-success)]/30 bg-[var(--color-success)]/5 px-5 py-4 text-center">
                <p className="text-sm font-medium text-[var(--color-success)] mb-1">Email sent!</p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Check <strong>{resetEmail}</strong> for a password reset link.
                  It may take a minute to arrive.
                </p>
              </div>
            ) : (
              // ─── RESET FORM ───────────────────────
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-5" noValidate>
                <Input
                  label="Email address"
                  type="email"
                  id="reset-email"
                  placeholder="you@example.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  icon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  autoFocus
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isSendingReset}
                  loadingText="Sending..."
                >
                  Send reset link
                </Button>
              </form>
            )}
          </motion.div>

        ) : (
          /* ─── SIGN IN VIEW ─────────────────────── */
          <motion.div
            key="login"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                Welcome back
              </h1>
              <p className="font-body text-sm text-[var(--color-text-secondary)]">
                Sign in to your GolfGive account
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

              {/* Email */}
              <Input
                label="Email address"
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                icon={<Mail className="w-4 h-4" />}
                error={errors.email}
                autoComplete="email"
                autoFocus
              />

              {/* Password + forgot link */}
              <div>
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password}
                    autoComplete="current-password"
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
                {/* Forgot password link — sits below the password field */}
                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={() => { setShowForgotPassword(true); setResetEmail(email); }}
                    className="text-xs text-[var(--color-text-secondary)] hover:text-primary transition-colors duration-250"
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                loadingText="Signing in..."
                className="mt-1"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-primary hover:text-accent transition-colors duration-250"
                >
                  Get started
                </Link>
              </p>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
