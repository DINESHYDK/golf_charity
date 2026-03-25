// ─── LAMP CONTAINER ───────────────────────────
// Conic-gradient "lamp light" effect shining down from the top
// Original design: Aceternity UI — adapted for GolfGive
// Color: yellow-orange (amber) — "giving hope" warmth
// Usage: wrap content that should appear lit from above

"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const LampContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden w-full z-0",
        className
      )}
    >
      {/* ─── LAMP LIGHT RAYS ─────────────────────── */}
      <div className="relative flex w-full flex-1 scale-y-125 items-center justify-center isolate z-0">

        {/* Left conic ray */}
        <motion.div
          initial={{ opacity: 0.5, width: "10rem" }}
          whileInView={{ opacity: 1, width: "22rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto right-1/2 h-48 overflow-visible w-[22rem] bg-gradient-conic from-amber-500 via-transparent to-transparent text-white [--conic-position:from_70deg_at_center_top]"
        >
          {/* Fade bottom edge */}
          <div className="absolute w-full left-0 bg-[var(--color-bg-dark)] h-32 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
          <div className="absolute w-36 h-full left-0 bg-[var(--color-bg-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_right,white,transparent)]" />
        </motion.div>

        {/* Right conic ray */}
        <motion.div
          initial={{ opacity: 0.5, width: "10rem" }}
          whileInView={{ opacity: 1, width: "22rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          style={{
            backgroundImage: `conic-gradient(var(--conic-position), var(--tw-gradient-stops))`,
          }}
          className="absolute inset-auto left-1/2 h-48 w-[22rem] bg-gradient-conic from-transparent via-transparent to-amber-500 text-white [--conic-position:from_290deg_at_center_top]"
        >
          {/* Fade bottom edge */}
          <div className="absolute w-36 h-full right-0 bg-[var(--color-bg-dark)] bottom-0 z-20 [mask-image:linear-gradient(to_left,white,transparent)]" />
          <div className="absolute w-full right-0 bg-[var(--color-bg-dark)] h-32 bottom-0 z-20 [mask-image:linear-gradient(to_top,white,transparent)]" />
        </motion.div>

        {/* Dark base overlay (hides bottom of rays) */}
        <div className="absolute top-1/2 h-40 w-full translate-y-10 scale-x-150 bg-[var(--color-bg-dark)] blur-2xl" />
        {/* Frosted glass strip */}
        <div className="absolute top-1/2 z-50 h-40 w-full bg-transparent opacity-10 backdrop-blur-md" />

        {/* Central amber glow orb */}
        <div className="absolute inset-auto z-50 h-28 w-96 -translate-y-1/2 rounded-full bg-amber-500 opacity-40 blur-3xl" />

        {/* Bright amber beam line */}
        <motion.div
          initial={{ width: "6rem" }}
          whileInView={{ width: "14rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-30 h-28 w-56 -translate-y-[5rem] rounded-full bg-amber-400 blur-2xl opacity-80"
        />

        {/* Thin horizontal beam */}
        <motion.div
          initial={{ width: "10rem" }}
          whileInView={{ width: "22rem" }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-auto z-50 h-0.5 w-[22rem] -translate-y-[6rem] bg-amber-400"
        />

        {/* Dark cap — hides top overflow */}
        <div className="absolute inset-auto z-40 h-36 w-full -translate-y-[11rem] bg-[var(--color-bg-dark)]" />
      </div>

      {/* ─── CONTENT SLOT ────────────────────────── */}
      {/* Positioned below the lamp so it looks "lit from above" */}
      <div className="relative z-50 flex -translate-y-24 flex-col items-center px-5 w-full">
        {children}
      </div>
    </div>
  );
};
