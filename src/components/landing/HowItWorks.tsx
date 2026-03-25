// ─── HOW IT WORKS ────────────────────────────
// 4-step process explaining the platform to new visitors
// Animated cards revealed on scroll via Framer Motion

"use client";

import { motion } from "framer-motion";
import { UserPlus, Target, Dice5, Trophy } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: UserPlus,
    title: "Subscribe",
    description:
      "Choose a monthly or yearly plan. A portion of every payment goes directly to the charity you select — minimum 10%, more if you choose.",
    color: "bg-[var(--color-primary)]",
  },
  {
    step: "02",
    icon: Target,
    title: "Enter Your Scores",
    description:
      "Log up to 5 Stableford golf scores from your rounds. Your most recent 5 are always kept — the oldest rolls off when you add a new one.",
    color: "bg-[var(--color-primary-light)]",
  },
  {
    step: "03",
    icon: Dice5,
    title: "Monthly Draw",
    description:
      "Each month, 5 numbers between 1–45 are drawn. Match 3, 4, or 5 of your scores to those numbers and you win a share of the prize pool.",
    color: "bg-accent",
  },
  {
    step: "04",
    icon: Trophy,
    title: "Win & Give",
    description:
      "Winners upload proof, admin verifies, and payouts are processed. The jackpot rolls over if no 5-match winner — it keeps growing.",
    color: "bg-[var(--color-primary-dark)]",
  },
] as const;

// ─── ANIMATION ───────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-[var(--color-secondary)]"
    >
      <div className="container-custom">

        {/* ─── SECTION HEADER ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold uppercase tracking-widest text-accent mb-3 block">
            Simple & Transparent
          </span>
          <h2 className="section-heading mb-4">How GolfGive Works</h2>
          <p className="section-subheading mx-auto">
            Four simple steps that turn your golf game into prize money and
            meaningful charitable impact.
          </p>
        </motion.div>

        {/* ─── STEPS GRID ────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {STEPS.map(({ step, icon: Icon, title, description, color }) => (
            <motion.div
              key={step}
              variants={cardVariants}
              className="relative card p-6 flex flex-col gap-4 group"
            >
              {/* Step number — top right corner */}
              <span className="absolute top-4 right-4 font-heading text-4xl font-bold text-[var(--color-border)] select-none">
                {step}
              </span>

              {/* Icon circle */}
              <div
                className={`flex items-center justify-center w-12 h-12 rounded-full ${color} flex-shrink-0`}
              >
                <Icon
                  className={`w-6 h-6 ${color === "bg-accent" ? "text-primary-dark" : "text-[var(--color-text-on-dark)]"}`}
                />
              </div>

              {/* Text */}
              <div>
                <h3 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-2">
                  {title}
                </h3>
                <p className="font-body text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {description}
                </p>
              </div>

              {/* Hover accent line */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-card bg-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-350 origin-left" />
            </motion.div>
          ))}
        </motion.div>

        {/* ─── PRIZE SPLIT CALLOUT ───────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-12 p-6 md:p-8 rounded-card bg-[var(--color-primary)] text-[var(--color-text-on-dark)]"
        >
          <h3 className="font-heading text-xl font-bold text-accent mb-4 text-center">
            Every Subscription Breakdown
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="font-heading text-3xl font-bold text-accent">72%</p>
              <p className="text-sm text-[var(--color-text-on-dark)]/70 mt-1">Prize Pool</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-accent">10%+</p>
              <p className="text-sm text-[var(--color-text-on-dark)]/70 mt-1">Charity</p>
            </div>
            <div>
              <p className="font-heading text-3xl font-bold text-[var(--color-text-on-dark)]/50">18%</p>
              <p className="text-sm text-[var(--color-text-on-dark)]/70 mt-1">Platform</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-on-dark)]/50 text-center mt-4">
            Increase your charity % anytime — the extra always comes from the platform fee, never the prize pool.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
