// ─── SCORES API ROUTE ────────────────────────
// GET: Fetch user's scores (max 5, reverse chronological)
// POST: Add new score (enforces rolling 5-score window)
// DELETE: Remove a specific score
//
// PRD: "Only the latest 5 scores are retained at any time"
// Decision: oldest by created_at (when entered, NOT score_date)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SCORE_CONFIG } from "@/constants";

// ─── GET: Fetch user's scores ────────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: scores, error } = await supabase
      .from("scores")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(SCORE_CONFIG.MAX_SCORES_PER_USER);

    if (error) throw error;

    return NextResponse.json({ data: scores });
  } catch (err) {
    console.error("Error fetching scores:", err);
    return NextResponse.json({ error: "Failed to fetch scores" }, { status: 500 });
  }
}

// ─── POST: Add new score ─────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { score_value, score_date } = body;

    // ─── VALIDATION ──────────────────────────
    if (!score_value || !score_date) {
      return NextResponse.json(
        { error: "score_value and score_date are required" },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(score_value) ||
      score_value < SCORE_CONFIG.MIN_SCORE_VALUE ||
      score_value > SCORE_CONFIG.MAX_SCORE_VALUE
    ) {
      return NextResponse.json(
        { error: `Score must be between ${SCORE_CONFIG.MIN_SCORE_VALUE} and ${SCORE_CONFIG.MAX_SCORE_VALUE}` },
        { status: 400 }
      );
    }

    // ─── ROLLING 5-SCORE WINDOW ──────────────
    // Check current score count for this user
    const { data: existingScores, error: countError } = await supabase
      .from("scores")
      .select("id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (countError) throw countError;

    // If user already has 5 scores, delete the oldest (by created_at)
    if (existingScores && existingScores.length >= SCORE_CONFIG.MAX_SCORES_PER_USER) {
      const oldestScore = existingScores[0]; // Already sorted ASC by created_at
      const { error: deleteError } = await supabase
        .from("scores")
        .delete()
        .eq("id", oldestScore.id);

      if (deleteError) throw deleteError;
    }

    // ─── INSERT NEW SCORE ────────────────────
    const { data: newScore, error: insertError } = await supabase
      .from("scores")
      .insert({
        user_id: user.id,
        score_value,
        score_date,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ data: newScore }, { status: 201 });
  } catch (err) {
    console.error("Error adding score:", err);
    return NextResponse.json({ error: "Failed to add score" }, { status: 500 });
  }
}

// ─── DELETE: Remove a score ──────────────────
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scoreId = searchParams.get("id");

    if (!scoreId) {
      return NextResponse.json({ error: "Score ID is required" }, { status: 400 });
    }

    // RLS ensures users can only delete their own scores
    const { error } = await supabase
      .from("scores")
      .delete()
      .eq("id", scoreId)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    console.error("Error deleting score:", err);
    return NextResponse.json({ error: "Failed to delete score" }, { status: 500 });
  }
}

// ─── PUT: Update an existing score ───────────
// Edit mode: updates score_value + score_date in place
// Rolling window does NOT apply — editing is not a new entry
// Security: user can only update their own scores (double-checked below + RLS)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, score_value, score_date } = body;

    if (!id) {
      return NextResponse.json({ error: "Score ID is required" }, { status: 400 });
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

    const { data: updatedScore, error } = await supabase
      .from("scores")
      .update({ score_value: val, score_date })
      .eq("id", id)
      .eq("user_id", user.id) // Security: only own scores
      .select()
      .single();

    if (error || !updatedScore) {
      return NextResponse.json(
        { error: "Score not found or not owned by you" },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: updatedScore });
  } catch (err) {
    console.error("Error updating score:", err);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
