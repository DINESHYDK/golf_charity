// ─── CTA SECTION ─────────────────────────────
// Bottom-of-page conversion section
// Final push before footer — strong headline + single CTA

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Trophy, Heart, Target } from "lucide-react";
import Button from "@/components/ui/Button";

const MINI_STATS = [
  { icon: Trophy, label: "Prize pool grows every month" },
  { icon: Heart, label: "Real charities, real impact" },
  { icon: Target, label: "Stableford scores you already have" },
] as const;

export default function CTASection() {
  return (
    <section className="py-20 md:py-28 bg-[var(--color-primary)]">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Headline */}
          <h2 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-[var(--color-text-on-dark)] mb-6 max-w-3xl mx-auto">
            Ready to make your golf game{" "}
            <span className="text-accent">mean more?</span>
          </h2>

          <p className="font-body text-lg text-[var(--color-text-on-dark)]/70 max-w-xl mx-auto mb-10">
            Join hundreds of golfers already winning prizes and giving back.
            Your first subscription is just one click away.
          </p>

          {/* Mini stat icons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
            {MINI_STATS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent/20 flex-shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-sm text-[var(--color-text-on-dark)]/70 font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                variant="primary"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                className="animate-pulse-gold"
              >
                Start Your Subscription
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="text-[var(--color-text-on-dark)] hover:bg-white/10 border border-white/20"
              >
                I already have an account
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
