// ─── DONATIONS API ROUTE ─────────────────────
// POST: Create a Stripe Checkout Session for one-time donation
// GET: Fetch user's donation history
// PRD: "Independent donation option (not tied to gameplay)"
//
// Decision: Checkout Session (not PaymentIntent) — consistent with
// subscription flow, avoids @stripe/react-stripe-js dependency.
// Frontend redirects to session.url, completes payment on Stripe hosted page.

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe/client";

// ─── GET: Fetch user's donations ─────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: donations, error } = await supabase
      .from("independent_donations")
      .select("*, charity:charities(name, image_url)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: donations });
  } catch (err) {
    console.error("Error fetching donations:", err);
    return NextResponse.json({ error: "Failed to fetch donations" }, { status: 500 });
  }
}

// ─── POST: Create a Checkout Session for donation ──
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { charity_id, amount } = body;

    if (!charity_id || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "charity_id and a positive amount are required" },
        { status: 400 }
      );
    }

    // Fetch charity name for Stripe line item display
    const { data: charity } = await supabase
      .from("charities")
      .select("name")
      .eq("id", charity_id)
      .single();

    const charityName = charity?.name ?? "Charity Donation";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // ─── CREATE CHECKOUT SESSION ──────────────
    // mode: "payment" = one-time charge (not subscription)
    // price_data: dynamic — no pre-created Stripe price needed
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            unit_amount: Math.round(amount * 100), // Stripe uses pence
            product_data: {
              name: `Donation to ${charityName}`,
              description: "One-time charitable donation via GolfGive",
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: user.id,
        charity_id,
        type: "independent_donation",
      },
      success_url: `${appUrl}/charity?donation=success`,
      cancel_url: `${appUrl}/charity?donation=cancelled`,
      customer_email: user.email ?? undefined,
    });

    // Record as pending — webhook will update to 'succeeded' on completion
    // Store session.id temporarily; webhook replaces with real payment_intent_id
    const { data: donation, error } = await supabase
      .from("independent_donations")
      .insert({
        user_id: user.id,
        charity_id,
        amount,
        stripe_payment_intent_id: session.id, // replaced by webhook on completion
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        donation,
        url: session.url, // frontend redirects to this URL
      },
    });
  } catch (err) {
    console.error("Error creating donation:", err);
    return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
  }
}
