// ─── SUPABASE ADMIN CLIENT ───────────────────
// Uses service_role key — BYPASSES RLS
// Only use in server-side code for admin operations:
//   - Draw execution
//   - Prize pool calculations
//   - System-level data operations
// NEVER import this in client components

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
