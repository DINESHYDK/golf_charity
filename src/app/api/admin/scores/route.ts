// ─── ADMIN SCORES API ─────────────────────────
// GET: Fetch all scores for a specific user (?user_id=)
// PATCH: Update any user's score (admin-only, bypasses RLS)
// Auth: Admin role required
// PRD: §11 "Edit golf scores" under Admin management

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SCORE_CONFIG } from "@/constants";

// ─── HELPER: Verify caller is admin ──────────
async function verifyAdmin(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return user;
}

// ─── GET: Fetch scores for a user ────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id query param required" }, { status: 400 });
    }

    const adminDb = createAdminClient();
    const { data: scores, error } = await adminDb
      .from("scores")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: scores });
  } catch (err) {
    console.error("Error fetching user scores:", err);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

// ─── PATCH: Update any user's score ──────────
// Admin bypasses RLS using service-role client
// Writes audit log for accountability
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { score_id, score_value, score_date } = body;

    if (!score_id) {
      return NextResponse.json({ error: "score_id is required" }, { status: 400 });
    }

    const val = parseInt(score_value, 10);
    if (isNaN(val) || val < SCORE_CONFIG.MIN_SCORE_VALUE || val > SCORE_CONFIG.MAX_SCORE_VALUE) {
      return NextResponse.json(
        { error: `Score must be between ${SCORE_CONFIG.MIN_SCORE_VALUE} and ${SCORE_CONFIG.MAX_SCORE_VALUE}` },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split("T")[0];
    if (!score_date || score_date > today) {
      return NextResponse.json(
        { error: "Score date is required and cannot be in the future" },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();

    const { data: updatedScore, error } = await adminDb
      .from("scores")
      .update({ score_value: val, score_date })
      .eq("id", score_id)
      .select()
      .single();

    if (error || !updatedScore) {
      return NextResponse.json({ error: "Score not found" }, { status: 404 });
    }

    // ─── AUDIT LOG ────────────────────────────
    await adminDb.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "update_user_score",
      target_table: "scores",
      target_id: score_id,
      notes: `Updated score to ${val} on ${score_date}`,
    });

    return NextResponse.json({ data: updatedScore });
  } catch (err) {
    console.error("Error updating score:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
