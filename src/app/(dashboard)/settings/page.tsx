// ─── SUBSCRIBER SETTINGS PAGE ────────────────
// Allows the logged-in subscriber to update their profile (name + avatar),
// view their account email (read-only), and see subscription info.
//
// Route: /settings
// Layout: (dashboard) shell — Sidebar, DashboardShell wrapper

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Link as LinkIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

// ─── ANIMATION VARIANTS ───────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function SettingsPage() {
  const { profile } = useAuth();

  // ─── LOCAL FORM STATE ──────────────────────
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ─── ACCOUNT EMAIL STATE ───────────────────
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // ─── SYNC FORM FROM PROFILE ────────────────
  // Once the profile loads from the useAuth hook, populate the form fields
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setAvatarUrl(profile.avatar_url ?? "");
    }
  }, [profile]);

  // ─── FETCH EMAIL FROM SUPABASE AUTH ───────
  // Email lives in auth.users, not profiles — fetch it via the browser client
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email ?? null);
    });
  }, []);

  // ─── HANDLE SAVE ──────────────────────────
  // PATCH /api/profile with the updated fields
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: avatarUrl,
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        toast.error(json.error ?? "Failed to save profile");
      } else {
        toast.success("Profile updated successfully!");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ─── PAGE TITLE ──────────────────────── */}
      <motion.div variants={cardVariants}>
        <h1 className="font-heading text-3xl font-bold text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1">
          Manage your profile and account preferences.
        </p>
      </motion.div>

      {/* ─── PROFILE INFORMATION CARD ─────────── */}
      <motion.div variants={cardVariants}>
        <Card>
          {/* Section heading */}
          <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)] mb-6">
            Profile Information
          </h2>

          {/* ─── AVATAR PREVIEW ─────────────────── */}
          <div className="flex items-center gap-4 mb-6">
            {avatarUrl ? (
              /* Show actual image when a URL is set */
              <img
                src={avatarUrl}
                alt={fullName || "Avatar"}
                className="w-20 h-20 rounded-full object-cover border-2 border-[var(--color-border)]"
                onError={(e) => {
                  // Gracefully fall back to placeholder if the URL is broken
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              /* Placeholder div with User icon when no avatar URL */
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "var(--color-primary-light)" }}
              >
                <User className="w-8 h-8 text-[var(--color-text-on-dark)]" />
              </div>
            )}

            <div>
              <p className="font-medium text-[var(--color-text-primary)]">
                {fullName || "Your Name"}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">Profile photo</p>
            </div>
          </div>

          {/* ─── FORM FIELDS ────────────────────── */}
          <div className="flex flex-col gap-5">
            {/* Full Name */}
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              maxLength={100}
              icon={<User className="w-4 h-4" />}
            />

            {/* Avatar URL */}
            <Input
              label="Avatar URL"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              helperText="Paste a public image URL (http/https). Leave empty to remove your avatar."
              icon={<LinkIcon className="w-4 h-4" />}
            />
          </div>

          {/* ─── SAVE BUTTON ────────────────────── */}
          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </motion.div>

      {/* ─── ACCOUNT CARD ─────────────────────── */}
      <motion.div variants={cardVariants}>
        <Card>
          <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)] mb-6">
            Account
          </h2>

          {/* Email — read-only, comes from Supabase auth */}
          <div className="flex flex-col gap-1 mb-4">
            <label className="label">Email Address</label>
            <div
              className="input flex items-center opacity-70 cursor-not-allowed"
              aria-label="Email address (read-only)"
            >
              {userEmail ?? "—"}
            </div>
            <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
              Your email address cannot be changed here.
            </p>
          </div>

          {/* Password note */}
          <div
            className="rounded-btn px-4 py-3 text-sm text-[var(--color-text-secondary)]"
            style={{ backgroundColor: "rgba(var(--color-primary-rgb, 30 58 92), 0.06)" }}
          >
            <strong className="font-semibold text-[var(--color-text-primary)]">
              Password changes
            </strong>{" "}
            are managed via email — use the&nbsp;
            <span className="text-[var(--color-accent)] font-medium">
              forgot password
            </span>{" "}
            flow on the login page to reset your password.
          </div>
        </Card>
      </motion.div>

      {/* ─── SUBSCRIPTION CARD ────────────────── */}
      <motion.div variants={cardVariants}>
        <Card>
          <h2 className="font-heading text-xl font-bold text-[var(--color-text-primary)] mb-4">
            Subscription
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm">
            Manage your subscription, billing, and prize draw entries from the{" "}
            <a
              href="/dashboard"
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              Dashboard
            </a>
            .
          </p>
        </Card>
      </motion.div>
    </motion.div>
  );
}
