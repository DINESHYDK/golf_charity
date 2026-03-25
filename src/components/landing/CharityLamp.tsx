// ─── CHARITY LAMP SECTION ─────────────────────
// Sits between CTASection and Footer
// Lamp light (yellow-orange) shines down on the charity pledge message
// Design intent: warmth + hope — every subscription gives back

"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { LampContainer } from "@/components/ui/lamp";

export default function CharityLamp() {
  return (
    <div className="bg-[var(--color-bg-dark)]">
      <LampContainer className="min-h-[32rem]">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeInOut" }}
          viewport={{ once: true }}
          className="flex flex-col items-center text-center gap-5 max-w-xl px-4"
        >
          {/* Amber heart icon — lit by the lamp above */}
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 border border-amber-500/30">
            <Heart className="w-7 h-7 text-amber-400 fill-amber-400/30" />
          </div>

          {/* Main pledge line */}
          <h2
            className="font-heading text-3xl md:text-4xl font-bold bg-clip-text text-transparent"
            style={{
              backgroundImage: "linear-gradient(to bottom right, #fde68a, #f59e0b, #d97706)",
            }}
          >
            10% min. of every subscription
            <br />
            goes to charity
          </h2>

          {/* Sub copy */}
          <p className="font-body text-base text-[var(--color-text-on-dark)]/60 max-w-sm leading-relaxed">
            Every month, without exception. You choose the cause — we make sure
            it happens. Increase your percentage anytime.
          </p>

          {/* Pill stats row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            {[
              { label: "Charity", value: "10%+" },
              { label: "Prize Pool", value: "72%" },
              { label: "Real Impact", value: "Always" },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/5"
              >
                <span className="font-heading font-bold text-amber-400 text-sm">{value}</span>
                <span className="text-xs text-[var(--color-text-on-dark)]/50">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </LampContainer>
    </div>
  );
}
