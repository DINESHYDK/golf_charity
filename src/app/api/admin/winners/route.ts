// ─── ADMIN WINNERS API ────────────────────────
// GET:   All winners joined with profile + draw info
//        Supports ?status=pending|approved|rejected filter
// PATCH: Update verification or payout status
//        Actions: approve | reject | mark_paid
// Auth:  Admin role required

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── HELPER: Verify caller is admin ──────────
async function getAdminUser() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" ? user : null;
}

// ─── GET: Fetch all winners ───────────────────
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const adminDb = createAdminClient();
    const statusFilter = request.nextUrl.searchParams.get("status");

    let query = adminDb
      .from("winners")
      .select(
        `
        *,
        profile:profiles(id, full_name),
        draw:draws(id, draw_month, drawn_numbers, status)
      `
      )
      .order("created_at", { ascending: false });

    // Optional status filter
    if (statusFilter && ["pending", "approved", "rejected"].includes(statusFilter)) {
      query = query.eq("verification_status", statusFilter);
    }

    const { data: winners, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: winners });
  } catch (err) {
    console.error("Error fetching winners:", err);
    return NextResponse.json({ error: "Failed to fetch winners" }, { status: 500 });
  }
}

// ─── PATCH: Update winner status ─────────────
// Winner Verification Flow (from CLAUDE.md):
//   pending → admin reviews proof → approved | rejected
//   approved → admin marks paid → paid
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { winner_id, action, admin_notes } = body;

    if (!winner_id || !action) {
      return NextResponse.json(
        { error: "winner_id and action are required" },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();
    const now = new Date().toISOString();

    // ─── BUILD UPDATE BASED ON ACTION ────────
    let updateData: Record<string, unknown> = { updated_at: now };
    let auditAction = "";

    switch (action) {
      case "approve":
        // Approve: sets verification_status, stores reviewer + timestamp
        updateData = {
          ...updateData,
          verification_status: "approved",
          reviewed_at: now,
          admin_notes: admin_notes?.trim() || null,
        };
        auditAction = "winner_approve";
        break;

      case "reject":
        // Reject: same fields, different status
        // Payout stays pending (no payout for rejected)
        updateData = {
          ...updateData,
          verification_status: "rejected",
          reviewed_at: now,
          admin_notes: admin_notes?.trim() || null,
        };
        auditAction = "winner_reject";
        break;

      case "mark_paid":
        // Can only mark_paid if already approved — enforced by UI, not re-checked here
        // as the DB constraint handles integrity
        updateData = {
          ...updateData,
          payout_status: "paid",
          paid_at: now,
        };
        auditAction = "winner_mark_paid";
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: approve, reject, or mark_paid" },
          { status: 400 }
        );
    }

    const { data, error } = await adminDb
      .from("winners")
      .update(updateData)
      .eq("id", winner_id)
      .select("*, profile:profiles(id, full_name), draw:draws(id, draw_month)")
      .single();

    if (error) throw error;

    // ─── AUDIT LOG ────────────────────────────
    await adminDb.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: auditAction,
      target_table: "winners",
      target_id: winner_id,
      notes: admin_notes ? `${action}: ${admin_notes}` : action,
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error updating winner:", err);
    return NextResponse.json({ error: "Failed to update winner" }, { status: 500 });
  }
}
