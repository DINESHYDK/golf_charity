// ─── PRICING PLANS ───────────────────────────
// Monthly vs Yearly plan cards — drives signup CTA
// Prices are display-only here; actual billing is handled by Stripe
// Yearly plan is highlighted as "Best Value"

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import Button from "@/components/ui/Button";
import { PLANS } from "@/constants";
import { cn } from "@/lib/utils";

// ─── PLAN DISPLAY CONFIG ─────────────────────
// Prices are for display. Actual amounts come from Stripe dashboard.
const PLAN_DISPLAY = {
  monthly: {
    price: "£9.99",
    period: "/month",
    priceNote: "Billed monthly",
    highlighted: false,
  },
  yearly: {
    price: "£99.99",
    period: "/year",
    priceNote: "Save £19.89 vs monthly",
    highlighted: true,
  },
} as const;

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

export default function PricingPlans() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-[var(--color-secondary)]">
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
            Simple Pricing
          </span>
          <h2 className="section-heading mb-4">Choose Your Plan</h2>
          <p className="section-subheading mx-auto">
            No hidden fees. Cancel anytime. Access continues until the end of
            your current billing period.
          </p>
        </motion.div>

        {/* ─── PLAN CARDS ────────────────────────── */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto"
        >
          {(["monthly", "yearly"] as const).map((planKey) => {
            const plan = PLANS[planKey];
            const display = PLAN_DISPLAY[planKey];
            const isHighlighted = display.highlighted;

            return (
              <motion.div
                key={planKey}
                variants={cardVariants}
                className={cn(
                  "relative flex flex-col rounded-card border overflow-hidden",
                  isHighlighted
                    ? "border-accent shadow-[0_0_0_2px_var(--color-accent)] bg-[var(--color-primary)] text-[var(--color-text-on-dark)]"
                    : "border-border bg-[var(--color-bg-card)] text-[var(--color-text-primary)] shadow-card"
                )}
              >
                {/* Best Value badge */}
                {isHighlighted && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full bg-accent text-primary-dark text-xs font-bold">
                    <Star className="w-3 h-3 fill-primary-dark" />
                    Best Value
                  </div>
                )}

                <div className="p-8 flex flex-col flex-1 gap-6">
                  {/* Plan name */}
                  <div>
                    <h3 className={cn(
                      "font-heading text-2xl font-bold mb-1",
                      isHighlighted ? "text-accent" : "text-[var(--color-text-primary)]"
                    )}>
                      {plan.name}
                    </h3>
                    <p className={cn(
                      "text-sm",
                      isHighlighted ? "text-[var(--color-text-on-dark)]/60" : "text-[var(--color-text-muted)]"
                    )}>
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className={cn(
                        "font-heading text-4xl font-bold",
                        isHighlighted ? "text-[var(--color-text-on-dark)]" : "text-[var(--color-text-primary)]"
                      )}>
                        {display.price}
                      </span>
                      <span className={cn(
                        "text-sm",
                        isHighlighted ? "text-[var(--color-text-on-dark)]/60" : "text-[var(--color-text-muted)]"
                      )}>
                        {display.period}
                      </span>
                    </div>
                    <p className={cn(
                      "text-xs mt-1",
                      isHighlighted ? "text-accent font-semibold" : "text-[var(--color-text-muted)]"
                    )}>
                      {display.priceNote}
                    </p>
                  </div>

                  {/* Features list */}
                  <ul className="flex flex-col gap-3 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={cn(
                          "flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0 mt-0.5",
                          isHighlighted ? "bg-accent/20" : "bg-[var(--color-primary)]/10"
                        )}>
                          <Check className={cn(
                            "w-3 h-3",
                            isHighlighted ? "text-accent" : "text-primary"
                          )} />
                        </div>
                        <span className={cn(
                          "text-sm leading-relaxed",
                          isHighlighted ? "text-[var(--color-text-on-dark)]/80" : "text-[var(--color-text-secondary)]"
                        )}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link href={`/signup?plan=${planKey}`}>
                    <Button
                      variant={isHighlighted ? "primary" : "secondary"}
                      size="md"
                      fullWidth
                      className={!isHighlighted ? "border-primary" : ""}
                    >
                      Get Started — {plan.name}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* ─── FINE PRINT ────────────────────────── */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="text-center text-xs text-[var(--color-text-muted)] mt-8 max-w-lg mx-auto"
        >
          Secure payments via Stripe. Cancel anytime — access continues until
          your billing period ends. No partial refunds. 10% minimum of every
          payment goes directly to your chosen charity.
        </motion.p>
      </div>
    </section>
  );
}
