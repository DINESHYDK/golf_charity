// ─── DRAWS API ROUTE ─────────────────────────
// GET: Fetch published draws (public) or all draws (admin)
// POST: Create/simulate/publish draw (admin only)
//
// Draw Flow:
//   1. Admin creates draw → status = 'scheduled'
//   2. Admin runs simulation → snapshots scores, generates numbers → status = 'simulated'
//   3. Admin publishes → status = 'published' (NO re-run, just flip status)

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DRAW_CONFIG } from "@/constants";
import { generateRandomDrawNumbers, calculateMatchCount } from "@/lib/utils";

// ─── GET: Fetch draws ────────────────────────
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    // RLS handles visibility — published draws are public,
    // admins see all via their RLS policy
    const { data: draws, error } = await supabase
      .from("draws")
      .select(`
        *,
        prize_pool:prize_pools(*)
      `)
      .order("draw_month", { ascending: false });

    if (error) throw error;

    // If user is logged in, also fetch their entries for each draw
    if (user) {
      const { data: entries } = await supabase
        .from("draw_entries")
        .select("*")
        .eq("user_id", user.id);

      // Attach user's entry to each draw
      const drawsWithEntries = draws?.map((draw) => ({
        ...draw,
        my_entry: entries?.find((e) => e.draw_id === draw.id) || null,
      }));

      return NextResponse.json({ data: drawsWithEntries });
    }

    return NextResponse.json({ data: draws });
  } catch (err) {
    console.error("Error fetching draws:", err);
    return NextResponse.json({ error: "Failed to fetch draws" }, { status: 500 });
  }
}

// ─── POST: Create / Simulate / Publish draw (Admin only) ───
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { action, draw_month, draw_logic, draw_id } = body;

    // Use admin client to bypass RLS for system operations
    const adminDb = createAdminClient();

    switch (action) {
      // ─── CREATE: Schedule a new draw ───────
      case "create": {
        if (!draw_month) {
          return NextResponse.json({ error: "draw_month is required (YYYY-MM)" }, { status: 400 });
        }

        // Check for previous month's jackpot rollover
        const { data: previousDraws } = await adminDb
          .from("prize_pools")
          .select("match_5_amount, jackpot_rolled_over, draw_id")
          .eq("jackpot_rolled_over", true)
          .order("created_at", { ascending: false })
          .limit(1);

        const jackpotCarriedIn = previousDraws?.[0]?.match_5_amount || 0;

        const { data: draw, error } = await adminDb
          .from("draws")
          .insert({
            draw_month,
            draw_logic: draw_logic || "random",
            status: "scheduled",
            jackpot_carried_in: jackpotCarriedIn,
          })
          .select()
          .single();

        if (error) throw error;

        // ─── AUDIT LOG ──────────────────────
        await adminDb.from("admin_audit_log").insert({
          admin_id: user.id,
          action: "create_draw",
          target_table: "draws",
          target_id: draw.id,
          notes: `Created draw for ${draw_month} with ${draw_logic || "random"} logic`,
        });

        return NextResponse.json({ data: draw }, { status: 201 });
      }

      // ─── SIMULATE: Run draw without publishing ───
      case "simulate": {
        if (!draw_id) {
          return NextResponse.json({ error: "draw_id is required" }, { status: 400 });
        }

        // Fetch the draw
        const { data: draw, error: drawError } = await adminDb
          .from("draws")
          .select("*")
          .eq("id", draw_id)
          .single();

        if (drawError || !draw) {
          return NextResponse.json({ error: "Draw not found" }, { status: 404 });
        }

        if (draw.status === "published") {
          return NextResponse.json({ error: "Cannot re-simulate a published draw" }, { status: 400 });
        }

        // ─── STEP 1: Generate drawn numbers ───
        let drawnNumbers: number[];

        if (draw.draw_logic === "algorithmic") {
          // Weighted toward common scores — more engagement
          drawnNumbers = await generateAlgorithmicNumbers(adminDb);
        } else {
          drawnNumbers = generateRandomDrawNumbers();
        }

        // ─── STEP 2: Snapshot all active subscribers' scores ───
        const { data: activeUsers } = await adminDb
          .from("subscriptions")
          .select("user_id")
          .eq("status", "active");

        if (!activeUsers || activeUsers.length === 0) {
          return NextResponse.json({ error: "No active subscribers for draw" }, { status: 400 });
        }

        // Clear previous simulation entries for this draw (in case of re-simulation)
        await adminDb.from("draw_entries").delete().eq("draw_id", draw_id);
        await adminDb.from("winners").delete().eq("draw_id", draw_id);
        await adminDb.from("prize_pools").delete().eq("draw_id", draw_id);

        // Snapshot each user's scores
        const entries = [];
        for (const sub of activeUsers) {
          const { data: scores } = await adminDb
            .from("scores")
            .select("score_value")
            .eq("user_id", sub.user_id)
            .order("created_at", { ascending: false })
            .limit(5);

          if (scores && scores.length > 0) {
            const snapshot = scores.map((s) => s.score_value);
            const matchCount = calculateMatchCount(snapshot, drawnNumbers);

            entries.push({
              draw_id,
              user_id: sub.user_id,
              scores_snapshot: snapshot,
              match_count: matchCount,
            });
          }
        }

        // Insert all entries
        if (entries.length > 0) {
          await adminDb.from("draw_entries").insert(entries);
        }

        // ─── STEP 3: Calculate prize pool ───
        const { data: payments } = await adminDb
          .from("payments")
          .select("prize_pool_cut")
          .eq("status", "succeeded")
          .gte("created_at", `${draw.draw_month}-01`);

        const totalPool = payments?.reduce((sum, p) => sum + (p.prize_pool_cut || 0), 0) || 0;

        const match5Amount = (totalPool * DRAW_CONFIG.MATCH_5_POOL_PERCENTAGE) / 100 + draw.jackpot_carried_in;
        const match4Amount = (totalPool * DRAW_CONFIG.MATCH_4_POOL_PERCENTAGE) / 100;
        const match3Amount = (totalPool * DRAW_CONFIG.MATCH_3_POOL_PERCENTAGE) / 100;

        // Check if there are any 5-match winners
        const fiveMatchWinners = entries.filter((e) => e.match_count === 5);
        const jackpotRolledOver = fiveMatchWinners.length === 0;

        await adminDb.from("prize_pools").insert({
          draw_id,
          total_pool_amount: totalPool + draw.jackpot_carried_in,
          match_5_amount: match5Amount,
          match_4_amount: match4Amount,
          match_3_amount: match3Amount,
          active_subscriber_count: activeUsers.length,
          jackpot_rolled_over: jackpotRolledOver,
        });

        // ─── STEP 4: Create winner records ───
        const winnerRecords = [];
        for (const entry of entries) {
          if (entry.match_count >= 3) {
            // Find the entry ID we just inserted
            const { data: entryRow } = await adminDb
              .from("draw_entries")
              .select("id")
              .eq("draw_id", draw_id)
              .eq("user_id", entry.user_id)
              .single();

            if (entryRow) {
              // Calculate prize: tier pool / number of winners in same tier
              const sameMatchWinners = entries.filter((e) => e.match_count === entry.match_count).length;
              let tierPool = 0;
              if (entry.match_count === 5) tierPool = match5Amount;
              else if (entry.match_count === 4) tierPool = match4Amount;
              else if (entry.match_count === 3) tierPool = match3Amount;

              const prizeAmount = Math.round((tierPool / sameMatchWinners) * 100) / 100;

              winnerRecords.push({
                draw_id,
                user_id: entry.user_id,
                draw_entry_id: entryRow.id,
                match_type: entry.match_count,
                prize_amount: prizeAmount,
              });
            }
          }
        }

        if (winnerRecords.length > 0) {
          await adminDb.from("winners").insert(winnerRecords);
        }

        // ─── STEP 5: Update draw status ─────
        await adminDb
          .from("draws")
          .update({ drawn_numbers: drawnNumbers, status: "simulated" })
          .eq("id", draw_id);

        // Audit log
        await adminDb.from("admin_audit_log").insert({
          admin_id: user.id,
          action: "simulate_draw",
          target_table: "draws",
          target_id: draw_id,
          notes: `Simulated draw: ${drawnNumbers.join(", ")} | ${winnerRecords.length} winners | Pool: ${totalPool}`,
        });

        return NextResponse.json({
          data: {
            drawn_numbers: drawnNumbers,
            total_entries: entries.length,
            winners: winnerRecords.length,
            prize_pool: totalPool + draw.jackpot_carried_in,
            jackpot_rolled_over: jackpotRolledOver,
          },
        });
      }

      // ─── PUBLISH: Make results visible to users ───
      case "publish": {
        if (!draw_id) {
          return NextResponse.json({ error: "draw_id is required" }, { status: 400 });
        }

        // CRITICAL: Do NOT re-run draw — just flip status
        const { data: draw, error } = await adminDb
          .from("draws")
          .update({ status: "published", published_at: new Date().toISOString() })
          .eq("id", draw_id)
          .eq("status", "simulated") // Can only publish simulated draws
          .select()
          .single();

        if (error || !draw) {
          return NextResponse.json(
            { error: "Draw not found or not in simulated state" },
            { status: 400 }
          );
        }

        // TODO: Queue email notifications for all subscribers + winners

        // Audit log
        await adminDb.from("admin_audit_log").insert({
          admin_id: user.id,
          action: "publish_draw",
          target_table: "draws",
          target_id: draw_id,
          notes: `Published draw for ${draw.draw_month}`,
        });

        return NextResponse.json({ data: draw });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: create, simulate, or publish" },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Error in draw operation:", err);
    return NextResponse.json({ error: "Draw operation failed" }, { status: 500 });
  }
}

// ─── ALGORITHMIC DRAW NUMBER GENERATION ──────
// Weighted toward common scores = more winners = more engagement
// Decision documented in CLAUDE.md
async function generateAlgorithmicNumbers(adminDb: ReturnType<typeof createAdminClient>): Promise<number[]> {
  // Get frequency distribution of all active user scores
  const { data: allScores } = await adminDb.from("scores").select("score_value");

  if (!allScores || allScores.length === 0) {
    return generateRandomDrawNumbers(); // Fallback to random
  }

  // Count frequency of each score value
  const frequency = new Map<number, number>();
  for (const s of allScores) {
    frequency.set(s.score_value, (frequency.get(s.score_value) || 0) + 1);
  }

  // Build weighted array — more frequent scores have more entries
  const weightedPool: number[] = [];
  for (const [value, count] of frequency) {
    // Weight = frequency squared (amplify common scores)
    for (let i = 0; i < count * count; i++) {
      weightedPool.push(value);
    }
  }

  // Pick 5 unique numbers from weighted pool
  const numbers = new Set<number>();
  let attempts = 0;
  while (numbers.size < 5 && attempts < 1000) {
    const idx = Math.floor(Math.random() * weightedPool.length);
    numbers.add(weightedPool[idx]);
    attempts++;
  }

  // If we couldn't get 5 unique from weighted, fill with random
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }

  return Array.from(numbers).sort((a, b) => a - b);
}
