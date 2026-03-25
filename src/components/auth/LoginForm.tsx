// ─── LOGIN FORM ──────────────────────────────
// Email + password login using Supabase Auth
// Loading spinner on submit, toast on success/error
// Redirects to /dashboard on success (or ?redirect= param)

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

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

  // ─── SUBMIT ──────────────────────────────────
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
      {/* ─── HEADER ─────────────────────────────── */}
      <div className="text-center mb-8">
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)] mb-2">
          Welcome back
        </h1>
        <p className="font-body text-sm text-[var(--color-text-secondary)]">
          Sign in to your GolfGive account
        </p>
      </div>

      {/* ─── FORM ───────────────────────────────── */}
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

        {/* Password */}
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
          {/* Show/hide password toggle */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-primary transition-colors duration-250"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Signing in..."
          className="mt-2"
        >
          Sign In
        </Button>
      </form>

      {/* ─── FOOTER LINKS ───────────────────────── */}
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
  );
}
