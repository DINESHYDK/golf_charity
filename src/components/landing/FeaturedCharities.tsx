// ─── FEATURED CHARITIES ──────────────────────
// Showcases 3 example charities on the landing page
// Uses static mock data here — real charities come from DB in the subscriber dashboard
// Intent: show visitors the kind of causes they'd support

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, ExternalLink, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";

// ─── MOCK CHARITY DATA ───────────────────────
// Static examples for the public landing page
// Real charity data is managed via Admin Panel → /admin/charities
const FEATURED_CHARITIES = [
  {
    id: "1",
    name: "Golf Foundation",
    category: "Youth Development",
    description:
      "Inspiring young people through golf — providing coaching, equipment, and pathways into the game for children from all backgrounds.",
    impact: "2,400+ young golfers supported",
    color: "from-[var(--color-primary)] to-[var(--color-primary-light)]",
    emoji: "⛳",
  },
  {
    id: "2",
    name: "Macmillan Cancer Support",
    category: "Health & Wellbeing",
    description:
      "Whatever cancer throws your way, Macmillan is there. They provide medical, emotional, and financial support for people living with cancer.",
    impact: "Helped 6.8M+ people last year",
    color: "from-[var(--color-accent-dark)] to-[var(--color-accent)]",
    emoji: "💚",
  },
  {
    id: "3",
    name: "Help for Heroes",
    category: "Veterans Support",
    description:
      "Supporting wounded, injured, and sick armed forces veterans to rebuild their lives by providing physical, psychological, and social support.",
    impact: "Supported 25,000+ veterans",
    color: "from-[var(--color-primary-dark)] to-[var(--color-primary)]",
    emoji: "🎖️",
  },
] as const;

// ─── ANIMATION ───────────────────────────────
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function FeaturedCharities() {
  return (
    <section id="charities" className="py-20 md:py-28 bg-[var(--color-bg-page)]">
      <div className="container-custom">

        {/* ─── SECTION HEADER ────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55 }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14"
        >
          <div>
            <span className="text-sm font-semibold uppercase tracking-widest text-accent mb-3 block">
              Make A Difference
            </span>
            <h2 className="section-heading mb-3">Choose Your Charity</h2>
            <p className="section-subheading">
              Pick from our curated list of verified charities. Your
              subscription contribution goes directly to the cause you care about.
            </p>
          </div>
          <Link href="/signup" className="flex-shrink-0">
            <Button
              variant="secondary"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              See All Charities
            </Button>
          </Link>
        </motion.div>

        {/* ─── CHARITY CARDS ─────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {FEATURED_CHARITIES.map((charity) => (
            <motion.div
              key={charity.id}
              variants={cardVariants}
              className="card overflow-hidden group flex flex-col"
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
            >
              {/* Coloured header banner */}
              <div className={`h-24 bg-gradient-to-br ${charity.color} flex items-center justify-center`}>
                <span className="text-4xl">{charity.emoji}</span>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col flex-1 gap-4">
                {/* Category badge */}
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent uppercase tracking-wider">
                  <Heart className="w-3 h-3" />
                  {charity.category}
                </span>

                <div>
                  <h3 className="font-heading text-lg font-bold text-[var(--color-text-primary)] mb-2">
                    {charity.name}
                  </h3>
                  <p className="font-body text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    {charity.description}
                  </p>
                </div>

                {/* Impact stat */}
                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                    {charity.impact}
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-accent transition-colors duration-250" />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── BOTTOM NOTE ───────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="text-center text-sm text-[var(--color-text-muted)] mt-8"
        >
          All charities are verified and curated by our team. New charities are added regularly.
        </motion.p>
      </div>
    </section>
  );
}
