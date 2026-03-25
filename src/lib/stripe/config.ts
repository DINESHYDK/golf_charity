// ─── STRIPE CONFIGURATION ────────────────────
// Plan pricing and Stripe Price IDs
// Price IDs come from env vars (set in Stripe Dashboard)

export const STRIPE_PLANS = {
  monthly: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
    name: "Monthly Plan",
    interval: "month" as const,
  },
  yearly: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID!,
    name: "Yearly Plan",
    interval: "year" as const,
  },
} as const;

// ─── WEBHOOK EVENTS WE HANDLE ────────────────
export const STRIPE_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;
