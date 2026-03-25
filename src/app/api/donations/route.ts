// ─── DONATIONS API ROUTE ─────────────────────
// POST: Create an independent donation via Stripe
// GET: Fetch user's donation history
// PRD: "Independent donation option (not tied to gameplay)"

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

// ─── POST: Create a donation ─────────────────
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // Create Stripe Payment Intent for one-time donation
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: "gbp",
      metadata: {
        user_id: user.id,
        charity_id,
        type: "independent_donation",
      },
    });

    // Record in database as pending
    const { data: donation, error } = await supabase
      .from("independent_donations")
      .insert({
        user_id: user.id,
        charity_id,
        amount,
        stripe_payment_intent_id: paymentIntent.id,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: {
        donation,
        client_secret: paymentIntent.client_secret,
      },
    });
  } catch (err) {
    console.error("Error creating donation:", err);
    return NextResponse.json({ error: "Failed to create donation" }, { status: 500 });
  }
}
