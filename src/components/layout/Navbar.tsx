// ─── NAVBAR ───────────────────────────────────
// Floating pill-shaped centered navbar — always dark glass
// Desktop: logo | animated nav links | Sign In + Get Started
// Mobile: pill expands to rounded-xl with dropdown menu
// Adapted from mini-navbar design pattern

"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Charities", href: "#charities" },
  { label: "Pricing", href: "#pricing" },
] as const;

// ─── ANIMATED NAV LINK ───────────────────────
// Vertical text-scroll on hover — two stacked spans that slide up
function AnimatedNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="group relative inline-flex items-center overflow-hidden h-5 text-sm"
    >
      <div className="flex flex-col transition-transform duration-300 ease-out group-hover:-translate-y-1/2">
        <span className="text-gray-300 leading-5">{children}</span>
        <span className="text-white leading-5">{children}</span>
      </div>
    </a>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // ─── SHAPE TRANSITION ────────────────────────
  // Shape changes instantly when opening, delays back to pill after close
  const [shapeClass, setShapeClass] = useState("rounded-full");
  const shapeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (shapeTimeout.current) clearTimeout(shapeTimeout.current);
    if (isOpen) {
      setShapeClass("rounded-2xl");
    } else {
      shapeTimeout.current = setTimeout(() => setShapeClass("rounded-full"), 300);
    }
    return () => {
      if (shapeTimeout.current) clearTimeout(shapeTimeout.current);
    };
  }, [isOpen]);

  // Close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        // ─── FLOATING PILL POSITION ──────────────
        "fixed top-6 left-1/2 -translate-x-1/2 z-50",
        "flex flex-col items-center",
        "px-6 py-3",
        "border border-[#2D5A4E]/70",
        "bg-[#0D2818]/65 backdrop-blur-md",
        "w-[calc(100%-2rem)] sm:w-auto",
        // Shape transitions (instant open, delayed close)
        shapeClass,
        "transition-[border-radius] duration-0"
      )}
    >
      {/* ─── MAIN ROW ──────────────────────────── */}
      <div className="flex items-center justify-between w-full gap-x-6 sm:gap-x-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-accent)]">
            <Trophy className="w-3.5 h-3.5 text-[var(--color-primary-dark)]" />
          </div>
          <span className="font-heading text-base font-bold text-white group-hover:text-[var(--color-accent)] transition-colors duration-200">
            GolfGive
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden sm:flex items-center space-x-6">
          {NAV_LINKS.map((link) => (
            <AnimatedNavLink key={link.href} href={link.href}>
              {link.label}
            </AnimatedNavLink>
          ))}
        </nav>

        {/* Desktop CTA buttons */}
        <div className="hidden sm:flex items-center gap-2">
          {/* Sign In — dark bordered */}
          <Link href="/login">
            <button className="px-4 py-1.5 text-sm border border-[#2D5A4E] bg-[rgba(13,40,24,0.5)] text-gray-300 rounded-full hover:border-white/40 hover:text-white transition-colors duration-200">
              Sign In
            </button>
          </Link>

          {/* Get Started — warm cream gradient with glow */}
          <Link href="/signup">
            <div className="relative group">
              {/* Glow blur behind button */}
              <div className="absolute inset-0 -m-2 rounded-full bg-[var(--color-accent)] opacity-30 blur-lg pointer-events-none transition-all duration-300 group-hover:opacity-50 group-hover:blur-xl group-hover:-m-3" />
              <button className="relative z-10 px-4 py-1.5 text-sm font-semibold text-[var(--color-primary-dark)] bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-accent)] rounded-full hover:from-[var(--color-accent)] hover:to-[var(--color-accent-dark)] transition-all duration-200">
                Get Started
              </button>
            </div>
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300 focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* ─── MOBILE DROPDOWN ───────────────────── */}
      <div
        className={cn(
          "sm:hidden flex flex-col items-center w-full overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100 pt-4" : "max-h-0 opacity-0 pt-0 pointer-events-none"
        )}
      >
        {/* Mobile nav links */}
        <nav className="flex flex-col items-center space-y-4 w-full">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-gray-300 hover:text-white transition-colors duration-200 w-full text-center text-base py-1"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Mobile buttons */}
        <div className="flex flex-col items-center gap-3 mt-4 w-full border-t border-[#2D5A4E]/50 pt-4">
          <Link href="/login" className="w-full">
            <button className="w-full px-4 py-2 text-sm border border-[#2D5A4E] bg-[rgba(13,40,24,0.5)] text-gray-300 rounded-full hover:border-white/40 hover:text-white transition-colors duration-200">
              Sign In
            </button>
          </Link>
          <Link href="/signup" className="w-full">
            <button className="w-full px-4 py-2 text-sm font-semibold text-[var(--color-primary-dark)] bg-gradient-to-br from-[var(--color-accent-light)] to-[var(--color-accent)] rounded-full hover:opacity-90 transition-all duration-200">
              Get Started
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
