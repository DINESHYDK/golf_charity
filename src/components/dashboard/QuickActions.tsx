// ─── QUICK ACTIONS ────────────────────────────
// Shortcut buttons on the dashboard overview
// Navigates to key subscriber pages

import Link from "next/link";
import { motion } from "framer-motion";
import { Target, Heart, Ticket, Trophy, ArrowRight } from "lucide-react";

const ACTIONS = [
  {
    icon: Target,
    label: "Add Score",
    description: "Log today's round",
    href: "/scores",
    color: "bg-[var(--color-primary)] text-[var(--color-text-on-dark)]",
  },
  {
    icon: Heart,
    label: "My Charity",
    description: "Update selection or %",
    href: "/charity",
    color: "bg-accent text-primary-dark",
  },
  {
    icon: Ticket,
    label: "View Draws",
    description: "See results & history",
    href: "/draws",
    color: "bg-[var(--color-primary-light)] text-[var(--color-text-on-dark)]",
  },
  {
    icon: Trophy,
    label: "My Winnings",
    description: "Upload proof & track payouts",
    href: "/winnings",
    color: "bg-[var(--color-primary-dark)] text-[var(--color-text-on-dark)]",
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export default function QuickActions() {
  return (
    <section>
      <h2 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-4">
        Quick Actions
      </h2>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {ACTIONS.map(({ icon: Icon, label, description, href, color }) => (
          <motion.div key={href} variants={itemVariants}>
            <Link
              href={href}
              className="group flex flex-col justify-between h-full p-5 rounded-card border border-border bg-[var(--color-bg-card)] hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-250"
            >
              {/* Icon */}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              {/* Text */}
              <div>
                <p className="font-semibold text-sm text-[var(--color-text-primary)]">{label}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{description}</p>
              </div>
              {/* Arrow */}
              <ArrowRight className="w-4 h-4 text-[var(--color-text-muted)] mt-3 group-hover:text-primary group-hover:translate-x-1 transition-all duration-250" />
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
