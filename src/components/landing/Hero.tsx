// ─── HERO SECTION ────────────────────────────
// Full-viewport hero with golf course background image
// Headline + subtext + dual CTAs + animated stats row
// Image: /public/images/hero.png

"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Heart, Ticket } from "lucide-react";
import Button from "@/components/ui/Button";
import AnimatedCounter from "@/components/shared/AnimatedCounter";

// ─── HERO STATS ──────────────────────────────
// Placeholder values — these can be replaced with real DB aggregates later
const STATS = [
  { icon: Trophy, label: "Prize Pool", value: 12500, prefix: "£", suffix: "+" },
  { icon: Heart, label: "Donated to Charity", value: 8400, prefix: "£", suffix: "+" },
  { icon: Ticket, label: "Active Subscribers", value: 420, prefix: "", suffix: "+" },
] as const;

// ─── ANIMATION VARIANTS ──────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">

      {/* ─── BACKGROUND IMAGE ──────────────────── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero.png"
          alt="Golf course at sunset"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        {/* Dark gradient overlay — ensures text legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-dark)]/80 via-[var(--color-primary-dark)]/60 to-[var(--color-primary-dark)]/90" />
      </div>

      {/* ─── HERO CONTENT ──────────────────────── */}
      <div className="relative z-10 container-custom pt-28 pb-16 md:pt-36 md:pb-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-3xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/40 text-accent text-sm font-semibold">
              <Trophy className="w-4 h-4" />
              Monthly Prize Draws · Charitable Giving
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.h1
            variants={itemVariants}
            className="font-heading text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--color-text-on-dark)] leading-tight mb-6"
          >
            Play Golf.{" "}
            <span className="text-accent">Win Prizes.</span>{" "}
            <br className="hidden sm:block" />
            Change Lives.
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="font-body text-lg md:text-xl text-[var(--color-text-on-dark)]/75 max-w-xl mb-10 leading-relaxed"
          >
            Subscribe, enter your Stableford scores each month, and compete in
            our prize draw — while every subscription contributes to the
            charity of your choice.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Link href="/signup">
              <Button
                size="lg"
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
              >
                Get Started
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button
                size="lg"
                variant="ghost"
                className="text-[var(--color-text-on-dark)] hover:bg-white/10 border border-white/20"
              >
                How It Works
              </Button>
            </a>
          </motion.div>
        </motion.div>

        {/* ─── STATS ROW ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.6 }}
          className="mt-16 md:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
        >
          {STATS.map(({ icon: Icon, label, value, prefix, suffix }) => (
            <div
              key={label}
              className="flex items-center gap-4 px-5 py-4 rounded-card glass border border-white/10"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/20 flex-shrink-0">
                <Icon className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="font-heading text-2xl font-bold text-[var(--color-text-on-dark)]">
                  <AnimatedCounter
                    target={value}
                    prefix={prefix}
                    suffix={suffix}
                    duration={2000}
                  />
                </p>
                <p className="text-xs text-[var(--color-text-on-dark)]/60 font-medium">
                  {label}
                </p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* ─── SCROLL INDICATOR ──────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1"
      >
        <span className="text-xs text-[var(--color-text-on-dark)]/40 font-medium tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-0.5 h-8 bg-gradient-to-b from-[var(--color-text-on-dark)]/40 to-transparent rounded-full"
        />
      </motion.div>
    </section>
  );
}
