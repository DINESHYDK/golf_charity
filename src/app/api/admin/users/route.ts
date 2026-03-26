// ─── ADMIN USERS API ──────────────────────────
// GET: All user profiles joined with subscription data
//      Supports ?search= query param for name search
//      Merges auth.users (email) with profiles via admin SDK
// PATCH: Update a user's role (subscriber ↔ admin)
// Auth: Admin role required

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

// ─── GET: Fetch all users with subscriptions ─
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const adminDb = createAdminClient();
    const search = request.nextUrl.searchParams.get("search");

    // ─── FETCH PROFILES + SUBSCRIPTIONS ──────
    let query = adminDb
      .from("profiles")
      .select(
        `
        *,
        subscriptions(status, plan_type, charity_percentage, current_period_end, created_at)
      `
      )
      .order("created_at", { ascending: false });

    if (search) {
      query = query.ilike("full_name", `%${search}%`);
    }

    const { data: profiles, error } = await query;
    if (error) throw error;

    // ─── FETCH EMAILS FROM AUTH ───────────────
    // auth.admin.listUsers() is the only way to get emails
    // as they live in auth.users, not the public profiles table
    const {
      data: { users: authUsers },
    } = await adminDb.auth.admin.listUsers({ perPage: 1000 });

    const emailMap = new Map(authUsers.map((u) => [u.id, u.email]));

    // Merge email into each profile
    const usersWithEmail = profiles?.map((p) => ({
      ...p,
      email: emailMap.get(p.id) || null,
    }));

    return NextResponse.json({ data: usersWithEmail });
  } catch (err) {
    console.error("Error fetching admin users:", err);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

// ─── PATCH: Update user role ──────────────────
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const admin = await verifyAdmin(supabase);
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, role } = body;

    if (!user_id || !role || !["subscriber", "admin"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid user_id or role. Role must be 'subscriber' or 'admin'" },
        { status: 400 }
      );
    }

    // Prevent admin from removing their own admin role
    if (user_id === admin.id && role === "subscriber") {
      return NextResponse.json(
        { error: "Cannot remove your own admin role" },
        { status: 400 }
      );
    }

    const adminDb = createAdminClient();

    const { error } = await adminDb
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", user_id);

    if (error) throw error;

    // ─── AUDIT LOG ────────────────────────────
    await adminDb.from("admin_audit_log").insert({
      admin_id: admin.id,
      action: "update_user_role",
      target_table: "profiles",
      target_id: user_id,
      notes: `Changed role to ${role}`,
    });

    return NextResponse.json({ data: { updated: true, role } });
  } catch (err) {
    console.error("Error updating user role:", err);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
