"use client";

// ─── FOOTER ───────────────────────────────────
// Landing page footer — dark green bg
// Sections: Logo/tagline | Links | Legal

import Link from "next/link";
import { Trophy, Heart } from "lucide-react";
import { motion } from "framer-motion";

const FOOTER_LINKS = {
  Platform: [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Charities", href: "#charities" },
  ],
  Account: [
    { label: "Sign In", href: "/login" },
    { label: "Get Started", href: "/signup" },
    { label: "Dashboard", href: "/dashboard" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
  ],
} as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[var(--color-bg-dark)] text-[var(--color-text-on-dark)]">
      <div className="container-custom py-16">
        {/* ─── TOP SECTION ───────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand column — wider than the others */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center w-9 h-9 rounded-full bg-accent">
                <Trophy className="w-5 h-5 text-primary-dark" />
              </div>
              <span className="font-heading text-xl font-bold text-[var(--color-text-on-dark)]">
                GolfGive
              </span>
            </Link>
            <p className="font-body text-sm text-[var(--color-text-on-dark)]/60 max-w-xs leading-relaxed">
              A subscription-based golf platform combining Stableford score
              tracking, monthly prize draws, and charitable giving. Every swing
              makes a difference.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([group, links]) => (
            <div key={group}>
              <h4 className="font-heading text-sm font-bold text-[var(--color-text-on-dark)] mb-4 uppercase tracking-wider">
                {group}
              </h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <motion.li
                    key={link.label}
                    whileHover={{ x: 5 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <Link
                      href={link.href}
                      className="font-body text-sm text-[var(--color-text-on-dark)]/60 hover:text-[#D4AF37] transition-colors duration-200 inline-block"
                    >
                      {link.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── BOTTOM BAR ────────────────────────── */}
        <div className="pt-8 border-t border-[var(--color-border-dark)] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-[var(--color-text-on-dark)]/40">
            © {currentYear} GolfGive. All rights reserved.
          </p>
          <p className="font-body text-xs text-[var(--color-text-on-dark)]/40">
            Built with care for golfers and charities worldwide.
          </p>
        </div>
        <a
          href="https://portfolio-lemon-sigma-ttzklk8yxq.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
        >
          developed by YDK
        </a>
      </div>
    </footer>
  );
}
