// ─── CHARITIES API ROUTE ─────────────────────
// GET: Fetch active charities (public) + user's selection (if logged in)
// POST: Set or update user's charity selection
// PATCH: Update charity contribution percentage

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

// ─── GET: Fetch charities ────────────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Fetch all active charities (public via RLS)
    const { data: charities, error } = await supabase
      .from("charities")
      .select(`
        *,
        charity_events(*)
      `)
      .eq("is_active", true)
      .order("is_featured", { ascending: false });

    if (error) throw error;

    // If user is logged in, also fetch their charity selection
    const { data: { user } } = await supabase.auth.getUser();

    let userSelection = null;
    if (user) {
      const { data } = await supabase
        .from("user_charity_selections")
        .select("*, charity:charities(*)")
        .eq("user_id", user.id)
        .single();

      userSelection = data;
    }

    return NextResponse.json({ data: { charities, userSelection } });
  } catch (err) {
    console.error("Error fetching charities:", err);
    return NextResponse.json({ error: "Failed to fetch charities" }, { status: 500 });
  }
}

// ─── POST: Select a charity ──────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { charity_id, contribution_percentage } = body;

    if (!charity_id) {
      return NextResponse.json({ error: "charity_id is required" }, { status: 400 });
    }

    const percentage = contribution_percentage || 10;
    if (percentage < 10) {
      return NextResponse.json({ error: "Minimum contribution is 10%" }, { status: 400 });
    }

    // ─── UPSERT: One charity per user (unique constraint on user_id) ───
    const { data, error } = await supabase
      .from("user_charity_selections")
      .upsert(
        {
          user_id: user.id,
          charity_id,
          contribution_percentage: percentage,
        },
        { onConflict: "user_id" }
      )
      .select("*, charity:charities(*)")
      .single();

    if (error) throw error;

    // ─── SYNC: Update subscription's charity_percentage too ───
    // This ensures the next billing cycle uses the new percentage
    await supabase
      .from("subscriptions")
      .update({ charity_percentage: percentage })
      .eq("user_id", user.id)
      .eq("status", "active");

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error selecting charity:", err);
    return NextResponse.json({ error: "Failed to select charity" }, { status: 500 });
  }
}

// ─── PATCH: Update contribution percentage ───
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { contribution_percentage } = body;

    if (!contribution_percentage || contribution_percentage < 10) {
      return NextResponse.json({ error: "Minimum contribution is 10%" }, { status: 400 });
    }

    // Update charity selection percentage
    const { error: selError } = await supabase
      .from("user_charity_selections")
      .update({ contribution_percentage })
      .eq("user_id", user.id);

    if (selError) throw selError;

    // ─── SYNC: Update subscription percentage ───
    // PRD: "Users may voluntarily increase their charity percentage"
    // Change applies to NEXT billing cycle only
    const { error: subError } = await supabase
      .from("subscriptions")
      .update({ charity_percentage: contribution_percentage })
      .eq("user_id", user.id)
      .eq("status", "active");

    if (subError) throw subError;

    return NextResponse.json({ data: { updated: true, contribution_percentage } });
  } catch (err) {
    console.error("Error updating contribution:", err);
    return NextResponse.json({ error: "Failed to update contribution" }, { status: 500 });
  }
}
