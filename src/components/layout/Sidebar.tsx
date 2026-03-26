// ─── DASHBOARD SIDEBAR ────────────────────────
// Left navigation panel for the subscriber dashboard
// Renders nav links from DASHBOARD_NAV constant
// Shows current user info + sign out at the bottom

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Target,
  Heart,
  Ticket,
  Trophy,
  LogOut,
  User,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { DASHBOARD_NAV } from "@/constants";
import toast from "react-hot-toast";

// ─── ICON MAP ────────────────────────────────
// Maps icon name strings from constants to Lucide components
const ICON_MAP = {
  LayoutDashboard,
  Target,
  Heart,
  Ticket,
  Trophy,
  Settings,
} as const;

type IconName = keyof typeof ICON_MAP;

interface SidebarProps {
  onClose?: () => void; // Called when a nav link is clicked on mobile
}

export default function Sidebar({ onClose }: SidebarProps) {
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

      {/* ─── LOGO ──────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--color-border-dark)]">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent flex-shrink-0">
          <Trophy className="w-4 h-4 text-primary-dark" />
        </div>
        <span className="font-heading text-lg font-bold text-[var(--color-text-on-dark)]">
          GolfGive
        </span>
      </div>

      {/* ─── NAVIGATION LINKS ──────────────────── */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-1">
          {DASHBOARD_NAV.map((item) => {
            const Icon = ICON_MAP[item.icon as IconName];
            const isActive = pathname === item.href;

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
                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.span
                      layoutId="sidebar-active-dot"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-dark"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ─── USER INFO + SIGN OUT ──────────────── */}
      <div className="px-3 pb-4 pt-2 border-t border-[var(--color-border-dark)]">
        {/* User profile row */}
        <div className="flex items-center gap-3 px-3 py-3 mb-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--color-primary-light)] flex-shrink-0">
            <User className="w-4 h-4 text-[var(--color-text-on-dark)]/70" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-on-dark)] truncate">
              {profile?.full_name ?? "Golfer"}
            </p>
            <p className="text-xs text-[var(--color-text-on-dark)]/50 capitalize">
              {profile?.role ?? "subscriber"}
            </p>
          </div>
        </div>

        {/* Sign out button */}
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
