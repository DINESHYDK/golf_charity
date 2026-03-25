// ─── ADMIN SIDEBAR ────────────────────────────
// Left navigation panel for the admin panel
// Mirrors Sidebar.tsx but uses ADMIN_NAV constant
// Includes a red "Admin" badge to distinguish from subscriber view

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Users,
  Dice5,
  Heart,
  Trophy,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ADMIN_NAV } from "@/constants";
import toast from "react-hot-toast";

// ─── ICON MAP ────────────────────────────────
const ICON_MAP = {
  BarChart3,
  Users,
  Dice5,
  Heart,
  Trophy,
} as const;

type IconName = keyof typeof ICON_MAP;

interface AdminSidebarProps {
  onClose?: () => void;
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <aside className="flex flex-col h-full bg-[var(--color-primary-dark)] text-[var(--color-text-on-dark)]">

      {/* ─── LOGO + ADMIN BADGE ────────────────── */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--color-border-dark)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent flex-shrink-0">
          <ShieldCheck className="w-4 h-4 text-primary-dark" />
        </div>
        <div>
          <span className="font-heading text-lg font-bold text-[var(--color-text-on-dark)] block">
            GolfGive
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-error">
            Admin Panel
          </span>
        </div>
      </div>

      {/* ─── NAVIGATION LINKS ──────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {ADMIN_NAV.map((item) => {
            const Icon = ICON_MAP[item.icon as IconName];
            // Active if exact match or starts with the path (for nested admin routes)
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-btn",
                    "font-body text-sm font-medium transition-all duration-250",
                    isActive
                      ? "bg-accent text-primary-dark"
                      : "text-[var(--color-text-on-dark)]/70 hover:bg-[var(--color-primary-light)] hover:text-[var(--color-text-on-dark)]"
                  )}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "w-4 h-4 flex-shrink-0",
                        isActive ? "text-primary-dark" : "text-[var(--color-text-on-dark)]/70"
                      )}
                    />
                  )}
                  {item.label}
                  {isActive && (
                    <motion.span
                      layoutId="admin-sidebar-active-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-dark"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ─── SWITCH TO SUBSCRIBER VIEW ─────────── */}
        <div className="mt-6 px-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs text-[var(--color-text-on-dark)]/40 hover:text-accent transition-colors duration-250"
          >
            <Trophy className="w-3 h-3" />
            Switch to subscriber view
          </Link>
        </div>
      </nav>

      {/* ─── USER INFO + SIGN OUT ──────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--color-border-dark)]">
        <div className="flex items-center gap-3 px-3 py-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error/20 flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-error" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-on-dark)] truncate">
              {profile?.full_name ?? "Admin"}
            </p>
            <p className="text-xs text-error font-semibold">Administrator</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-btn font-body text-sm font-medium text-[var(--color-text-on-dark)]/60 hover:bg-[var(--color-primary-light)] hover:text-error transition-all duration-250"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
