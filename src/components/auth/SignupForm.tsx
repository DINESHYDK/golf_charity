// ─── SIGNUP FORM ─────────────────────────────
// New user registration using Supabase Auth
// Fields: full name, email, password, confirm password
// On success: Supabase creates auth.users entry → DB trigger creates profiles row
// Redirects to /signup?plan= if a plan was pre-selected from pricing page

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { User, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlan = searchParams.get("plan") || "monthly";

  const { signUp } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // ─── VALIDATION ──────────────────────────────
  const validate = () => {
    const newErrors: typeof errors = {};

    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── SUBMIT ──────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    const { error } = await signUp(email, password, fullName.trim());
    setIsLoading(false);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("An account with this email already exists");
        setErrors((prev) => ({ ...prev, email: "Email already in use" }));
      } else {
        toast.error(error.message);
      }
      return;
    }

    // ─── SUCCESS STATE ────────────────────────
    // Supabase sends a confirmation email if email confirmation is enabled
    // If disabled (dev mode), user is logged in immediately
    setIsSuccess(true);
  };

  // ─── SUCCESS SCREEN ──────────────────────────
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-success/10">
            <CheckCircle2 className="w-8 h-8 text-success" />
          </div>
        </div>
        <h2 className="font-heading text-2xl font-bold text-[var(--color-text-primary)] mb-3">
          Account created!
        </h2>
        <p className="font-body text-sm text-[var(--color-text-secondary)] mb-8 max-w-xs mx-auto">
          Check your email for a confirmation link, then come back to sign in
          and choose your subscription plan.
        </p>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onClick={() => router.push("/login")}
        >
          Go to Sign In
        </Button>
      </motion.div>
    );
  }

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
          Create your account
        </h1>
        <p className="font-body text-sm text-[var(--color-text-secondary)]">
          Join GolfGive and start playing for prizes
        </p>
        {/* Show selected plan */}
        {selectedPlan && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold">
            Selected plan: {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}
          </div>
        )}
      </div>

      {/* ─── FORM ───────────────────────────────── */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Full name */}
        <Input
          label="Full name"
          type="text"
          id="fullName"
          placeholder="Dinesh YDK"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          icon={<User className="w-4 h-4" />}
          error={errors.fullName}
          autoComplete="name"
          autoFocus
        />

        {/* Email */}
        <Input
          label="Email address"
          type="email"
          id="email"
          placeholder="your_name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          icon={<Mail className="w-4 h-4" />}
          error={errors.email}
          autoComplete="email"
        />

        {/* Password */}
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            id="password"
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            icon={<Lock className="w-4 h-4" />}
            error={errors.password}
            helperText="At least 8 characters"
            autoComplete="new-password"
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
        <div className="relative">
          <Input
            label="Confirm password"
            type={showConfirmPassword ? "text" : "password"}
            id="confirmPassword"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            icon={<Lock className="w-4 h-4" />}
            error={errors.confirmPassword}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-[38px] text-[var(--color-text-muted)] hover:text-primary transition-colors duration-250"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Terms note */}
        <p className="text-xs text-[var(--color-text-muted)] text-center">
          By creating an account you agree to our{" "}
          <a href="#" className="text-primary hover:text-accent transition-colors duration-250 underline underline-offset-2">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-primary hover:text-accent transition-colors duration-250 underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </p>

        {/* Submit */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isLoading}
          loadingText="Creating account..."
        >
          Create Account
        </Button>
      </form>

      {/* ─── FOOTER LINKS ───────────────────────── */}
      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary hover:text-accent transition-colors duration-250"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
