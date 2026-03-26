// ─── PROFILE API ROUTE ───────────────────────
// GET:   Fetch the current authenticated user's profile
// PATCH: Update full_name and/or avatar_url on the user's own profile
//
// Auth: Any logged-in user — RLS ensures only their own row is touched
// Server client (NOT admin) is used intentionally so RLS is respected
// The profiles table PK is `id` which equals `auth.uid()`

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Returns true if the string is a valid absolute URL (http/https) or empty. */
function isValidAvatarUrl(url: string): boolean {
  if (url === "") return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

// ─── GET: Fetch current user's profile ────────────────────────────────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch their profile row — RLS ensures only their own row is returned
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    return NextResponse.json({ data: profile as Profile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// ─── PATCH: Update current user's profile ─────────────────────────────────────
// Body: { full_name?: string; avatar_url?: string }
// Validation rules:
//   - full_name: max 100 characters
//   - avatar_url: must be a valid http/https URL, or empty string to clear it
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ─── PARSE BODY ─────────────────────────────────────────────────────────
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { full_name, avatar_url } = body as {
      full_name?: string;
      avatar_url?: string;
    };

    // ─── VALIDATION ─────────────────────────────────────────────────────────

    // At least one field must be provided
    if (full_name === undefined && avatar_url === undefined) {
      return NextResponse.json(
        { error: "Provide at least one field: full_name or avatar_url" },
        { status: 400 }
      );
    }

    // Build the update payload, validating each provided field
    const updates: { full_name?: string | null; avatar_url?: string | null; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) {
      if (typeof full_name !== "string") {
        return NextResponse.json({ error: "full_name must be a string" }, { status: 400 });
      }
      const trimmed = full_name.trim();
      if (trimmed.length > 100) {
        return NextResponse.json(
          { error: "full_name must be 100 characters or fewer" },
          { status: 400 }
        );
      }
      // Allow empty string → stored as null (clears the name)
      updates.full_name = trimmed === "" ? null : trimmed;
    }

    if (avatar_url !== undefined) {
      if (typeof avatar_url !== "string") {
        return NextResponse.json({ error: "avatar_url must be a string" }, { status: 400 });
      }
      const trimmedUrl = avatar_url.trim();
      if (!isValidAvatarUrl(trimmedUrl)) {
        return NextResponse.json(
          { error: "avatar_url must be a valid http/https URL, or empty to clear it" },
          { status: 400 }
        );
      }
      // Allow empty string → stored as null (clears the avatar)
      updates.avatar_url = trimmedUrl === "" ? null : trimmedUrl;
    }

    // ─── UPDATE — RLS ensures the user can only update their own row ─────────
    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ data: updatedProfile as Profile });
  } catch (err) {
    console.error("Error updating profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
