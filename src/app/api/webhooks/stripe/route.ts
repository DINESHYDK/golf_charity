// ─── STRIPE WEBHOOK HANDLER ──────────────────
// Receives events from Stripe for subscription lifecycle management
// Events handled:
//   - checkout.session.completed → create subscription record
//   - invoice.payment_succeeded → record payment, calculate splits
//   - invoice.payment_failed → update status, queue notification
//   - customer.subscription.updated → update subscription status
//   - customer.subscription.deleted → mark as cancelled
//
// CRITICAL: This route must receive the RAW body for signature verification
// Do NOT parse the body before verifying — Stripe will reject it

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { REVENUE_SPLIT } from "@/constants";
import type Stripe from "stripe";

// ─── Disable Next.js body parsing (Stripe needs raw body) ───
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    // ─── VERIFY WEBHOOK SIGNATURE ────────────
    // This ensures the event actually came from Stripe, not a malicious actor
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 });
  }

  // ─── Use admin client to bypass RLS for system operations ───
  const supabase = createAdminClient();

  try {
    switch (event.type) {
      // ─── CHECKOUT COMPLETED ──────────────
      // User just subscribed — create subscription record
      // Expand the Stripe subscription to get current_period_end immediately
      // (avoids "Renews Unknown" on the dashboard)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === "subscription" && session.metadata?.user_id) {
          // Fetch full subscription from Stripe to get period dates
          const stripeSub = await stripe.subscriptions.retrieve(
            session.subscription as string
          );

          const { error } = await supabase.from("subscriptions").upsert({
            user_id: session.metadata.user_id,
            plan_type: session.metadata.plan_type || "monthly",
            status: "active",
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            charity_percentage: parseFloat(session.metadata.charity_percentage || "10"),
            current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
          });

          if (error) console.error("Error creating subscription:", error);
        }

        // ─── INDEPENDENT DONATION COMPLETION ─
        // When a one-time donation checkout completes, update
        // status to 'succeeded' and record the real payment_intent_id
        if (session.metadata?.type === "independent_donation" && session.metadata?.user_id) {
          const adminDb = createAdminClient();
          const { error: donationError } = await adminDb
            .from("independent_donations")
            .update({
              status: "succeeded",
              stripe_payment_intent_id: session.payment_intent as string,
            })
            .eq("stripe_payment_intent_id", session.id); // was stored as session.id in POST

          if (donationError) console.error("Error updating donation:", donationError);
        }

        break;
      }

      // ─── PAYMENT SUCCEEDED ───────────────
      // Record payment and calculate charity/prize pool splits
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.subscription && invoice.customer) {
          // Find the subscription in our DB
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id, user_id, charity_percentage")
            .eq("stripe_customer_id", invoice.customer as string)
            .single();

          if (subscription) {
            const amount = (invoice.amount_paid || 0) / 100; // Stripe uses cents
            const charityPct = subscription.charity_percentage || 10;

            // ─── REVENUE SPLIT CALCULATION ───
            // Prize pool is ALWAYS 72% — charity min 10%, rest is platform fee
            const charityCut = (amount * charityPct) / 100;
            const prizePoolCut = (amount * REVENUE_SPLIT.PRIZE_POOL_PERCENTAGE) / 100;

            // ─── PARALLEL DB WRITES ───────────
            // Run payment insert + subscription update concurrently to avoid timeout
            const ops: PromiseLike<unknown>[] = [
              supabase.from("payments").insert({
                user_id: subscription.user_id,
                subscription_id: subscription.id,
                stripe_payment_intent_id: invoice.payment_intent as string,
                amount,
                charity_cut: Math.round(charityCut * 100) / 100,
                prize_pool_cut: Math.round(prizePoolCut * 100) / 100,
                currency: invoice.currency || "gbp",
                status: "succeeded",
              }),
            ];

            if (invoice.lines?.data?.[0]?.period) {
              const period = invoice.lines.data[0].period;
              ops.push(
                supabase
                  .from("subscriptions")
                  .update({
                    status: "active",
                    current_period_start: new Date(period.start * 1000).toISOString(),
                    current_period_end: new Date(period.end * 1000).toISOString(),
                  })
                  .eq("id", subscription.id)
              );
            }

            await Promise.all(ops);
          }
        }
        break;
      }

      // ─── PAYMENT FAILED ──────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        if (invoice.customer) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id, user_id")
            .eq("stripe_customer_id", invoice.customer as string)
            .single();

          if (subscription) {
            // Update subscription status to lapsed
            await supabase
              .from("subscriptions")
              .update({ status: "lapsed" })
              .eq("id", subscription.id);

            // Queue a payment failed notification
            await supabase.from("email_notifications").insert({
              user_id: subscription.user_id,
              type: "payment_failed",
              subject: "Payment failed — please update your payment method",
              status: "queued",
            });
          }
        }
        break;
      }

      // ─── SUBSCRIPTION UPDATED ────────────
      // Also saves current_period_end so dashboard never shows "Renews Unknown"
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;

        const statusMap: Record<string, string> = {
          active: "active",
          past_due: "lapsed",
          canceled: "cancelled",
          unpaid: "lapsed",
          incomplete: "inactive",
          incomplete_expired: "inactive",
          trialing: "active",
          paused: "inactive",
        };

        await supabase
          .from("subscriptions")
          .update({
            status: statusMap[sub.status] || "inactive",
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      // ─── SUBSCRIPTION DELETED ────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;

        await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
