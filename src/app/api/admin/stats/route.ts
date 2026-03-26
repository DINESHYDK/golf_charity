// ─── ADMIN STATS API ──────────────────────────
// GET: High-level metrics for the admin overview dashboard
// Queries: users, active subscribers, prize pool totals,
//          charity contributions, draw count, pending verifications
// Auth: Admin role required (checked via profiles.role)

import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── ADMIN GUARD ─────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // ─── PARALLEL QUERIES ─────────────────────
    // All queries run concurrently to minimize response time
    const [
      { count: totalUsers },
      { count: activeSubscribers },
      { data: prizePoolData },
      { data: charityData },
      { count: totalDraws },
      { count: pendingVerifications },
    ] = await Promise.all([
      adminDb.from("profiles").select("*", { count: "exact", head: true }),
      adminDb
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      adminDb.from("prize_pools").select("total_pool_amount"),
      adminDb
        .from("payments")
        .select("charity_cut")
        .eq("status", "succeeded"),
      adminDb.from("draws").select("*", { count: "exact", head: true }),
      adminDb
        .from("winners")
        .select("*", { count: "exact", head: true })
        .eq("verification_status", "pending"),
    ]);

    // ─── AGGREGATE CALCULATIONS ───────────────
    const totalPrizePool =
      prizePoolData?.reduce((sum, p) => sum + (p.total_pool_amount || 0), 0) || 0;
    const totalCharityContributions =
      charityData?.reduce((sum, p) => sum + (p.charity_cut || 0), 0) || 0;

    return NextResponse.json({
      data: {
        total_users: totalUsers || 0,
        active_subscribers: activeSubscribers || 0,
        total_prize_pool: totalPrizePool,
        total_charity_contributions: totalCharityContributions,
        total_draws: totalDraws || 0,
        pending_verifications: pendingVerifications || 0,
      },
    });
  } catch (err) {
    console.error("Error fetching admin stats:", err);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
