// ─── ADMIN CHARITIES API ──────────────────────
// GET:    All charities including inactive (admin view only)
// POST:   Create new charity
// PATCH:  Update charity fields (name, description, featured, active, etc.)
// DELETE: Soft-delete (set is_active = false) — preserves historical data
// Auth:   Admin role required for all methods

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── HELPER: Verify caller is admin ──────────
async function verifyAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, supabase };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return { user: null, supabase };
  return { user, supabase };
}

// ─── GET: All charities (admin view) ─────────
export async function GET() {
  try {
    const { user } = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // Admin sees ALL charities including inactive ones
    const { data: charities, error } = await adminDb
      .from("charities")
      .select("*, charity_events(*)")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: charities });
  } catch (err) {
    console.error("Error fetching charities (admin):", err);
    return NextResponse.json({ error: "Failed to fetch charities" }, { status: 500 });
  }
}

// ─── POST: Create new charity ─────────────────
export async function POST(request: NextRequest) {
  try {
    const { user } = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, image_url, website_url, is_featured } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Charity name is required" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    const { data, error } = await adminDb
      .from("charities")
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        image_url: image_url?.trim() || null,
        website_url: website_url?.trim() || null,
        is_featured: is_featured || false,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    await adminDb.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "create_charity",
      target_table: "charities",
      target_id: data.id,
      notes: `Created charity: ${name}`,
    });

    return NextResponse.json({ data }, { status: 201 });
  } catch (err) {
    console.error("Error creating charity:", err);
    return NextResponse.json({ error: "Failed to create charity" }, { status: 500 });
  }
}

// ─── PATCH: Update charity ────────────────────
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Charity ID is required" }, { status: 400 });
    }

    // ─── WHITELIST: Only allow safe fields ───
    const ALLOWED_FIELDS = ["name", "description", "image_url", "website_url", "is_featured", "is_active"];
    const filteredUpdates: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      if (key in updates) filteredUpdates[key] = updates[key];
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    const { data, error } = await adminDb
      .from("charities")
      .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await adminDb.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "update_charity",
      target_table: "charities",
      target_id: id,
      notes: `Updated fields: ${Object.keys(filteredUpdates).join(", ")}`,
    });

    return NextResponse.json({ data });
  } catch (err) {
    console.error("Error updating charity:", err);
    return NextResponse.json({ error: "Failed to update charity" }, { status: 500 });
  }
}

// ─── DELETE: Soft-delete charity ─────────────
// Preserves referential integrity — historical charity selections remain valid
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await verifyAdmin();
    if (!user) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Charity ID is required" }, { status: 400 });
    }

    const adminDb = createAdminClient();

    // Soft delete: sets is_active = false
    // Does NOT physically delete — preserves charity reference in user_charity_selections
    const { error } = await adminDb
      .from("charities")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    await adminDb.from("admin_audit_log").insert({
      admin_id: user.id,
      action: "deactivate_charity",
      target_table: "charities",
      target_id: id,
      notes: "Soft-deleted (is_active = false)",
    });

    return NextResponse.json({ data: { deactivated: true } });
  } catch (err) {
    console.error("Error deactivating charity:", err);
    return NextResponse.json({ error: "Failed to deactivate charity" }, { status: 500 });
  }
}
