// ─── SUBSCRIPTION API ROUTE ──────────────────
// POST: Create a Stripe Checkout session for subscription
// GET: Fetch current user's subscription status
// DELETE: Cancel subscription via Stripe

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";
import { STRIPE_PLANS } from "@/lib/stripe/config";
import type { PlanType } from "@/types";

// ─── GET: Fetch subscription status ──────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: subscription, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows

    return NextResponse.json({ data: subscription || null });
  } catch (err) {
    console.error("Error fetching subscription:", err);
    return NextResponse.json({ error: "Failed to fetch subscription" }, { status: 500 });
  }
}

// ─── POST: Create Stripe Checkout session ────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const planType: PlanType = body.plan_type || "monthly";
    const charityPercentage: number = body.charity_percentage || 10;

    // Validate plan type
    if (!["monthly", "yearly"].includes(planType)) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    // Validate charity percentage (min 10%)
    if (charityPercentage < 10) {
      return NextResponse.json(
        { error: "Minimum charity contribution is 10%" },
        { status: 400 }
      );
    }

    const plan = STRIPE_PLANS[planType];
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // ─── CREATE STRIPE CHECKOUT SESSION ──────
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      // Pass metadata so the webhook can link to our user
      metadata: {
        user_id: user.id,
        plan_type: planType,
        charity_percentage: charityPercentage.toString(),
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
      },
      success_url: `${appUrl}/dashboard?subscription=success`,
      cancel_url: `${appUrl}/dashboard?subscription=cancelled`,
      customer_email: user.email,
    });

    return NextResponse.json({ data: { url: session.url } });
  } catch (err) {
    console.error("Error creating checkout session:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}

// ─── DELETE: Cancel subscription ─────────────
export async function DELETE() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find active subscription
    const { data: subscription, error: fetchError } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (fetchError || !subscription?.stripe_subscription_id) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    // Cancel at period end (user keeps access until billing period ends)
    await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ data: { cancelled: true } });
  } catch (err) {
    console.error("Error cancelling subscription:", err);
    return NextResponse.json({ error: "Failed to cancel subscription" }, { status: 500 });
  }
}
