"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";

const NAV_LINKS = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Charities", href: "#charities" },
  { label: "Pricing", href: "#pricing" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] sm:w-auto">
      <div
        className={`
          bg-[#0D2818]/75 backdrop-blur-md
          border border-[#2D5A4E]/70
          px-6 py-3
          ${isOpen ? "rounded-2xl" : "rounded-full"}
          transition-all duration-300
        `}
      >
        {/* ── MAIN ROW ── */}
        <div className="flex items-center justify-between gap-8">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#D4AF37]">
              <Trophy className="w-3.5 h-3.5 text-[#0D2818]" />
            </div>
            <span className="text-base font-bold text-white">GolfGive</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden sm:flex items-center gap-7">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <Link href="/login">
              <button className="px-4 py-1.5 text-sm text-gray-300 border border-[#2D5A4E] rounded-full hover:text-white hover:border-white/40 transition-colors duration-200">
                Sign In
              </button>
            </Link>
            <Link href="/signup">
              <button className="px-4 py-1.5 text-sm font-semibold text-[#0D2818] bg-[#D4AF37] rounded-full hover:bg-[#c9a430] transition-colors duration-200">
                Get Started
              </button>
            </Link>
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="sm:hidden flex items-center justify-center w-8 h-8 text-gray-300"
            aria-label="Toggle menu"
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

        {/* ── MOBILE DROPDOWN ── */}
        {isOpen && (
          <div className="sm:hidden mt-4 pt-4 border-t border-[#2D5A4E]/50 flex flex-col items-center gap-4">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-gray-300 hover:text-white transition-colors duration-200 text-base"
              >
                {link.label}
              </a>
            ))}
            <div className="flex flex-col gap-3 w-full mt-2">
              <Link href="/login">
                <button className="w-full px-4 py-2 text-sm text-gray-300 border border-[#2D5A4E] rounded-full hover:text-white hover:border-white/40 transition-colors duration-200">
                  Sign In
                </button>
              </Link>
              <Link href="/signup">
                <button className="w-full px-4 py-2 text-sm font-semibold text-[#0D2818] bg-[#D4AF37] rounded-full hover:bg-[#c9a430] transition-colors duration-200">
                  Get Started
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}