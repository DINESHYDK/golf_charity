// ─── STRIPE SERVER CLIENT ────────────────────
// Only use server-side (API routes, webhooks)
// NEVER import in client components — sk_test_ must stay on server

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
});
