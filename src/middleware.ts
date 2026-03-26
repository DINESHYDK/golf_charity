// ─── NEXT.JS MIDDLEWARE ──────────────────────
// Runs on every matched request before the page loads
// Handles: auth checks, subscription validation, role-based access
// PRD: "Real-time subscription status check on every authenticated request"

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// ─── GET USER ROLE ────────────────────────────
// First try JWT app_metadata (zero DB call — works after Supabase JWT hook is enabled)
// Falls back to DB query if JWT claim not present (works before hook setup)
async function getUserRole(supabase: SupabaseClient, userId: string): Promise<string> {
  // Attempt to read role directly from the session JWT (no DB round-trip)
  const { data: { session } } = await supabase.auth.getSession();
  const jwtRole = session?.user?.app_metadata?.user_role;
  if (jwtRole) return jwtRole;

  // Fallback: query the profiles table (used before JWT hook is configured)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return profile?.role ?? "subscriber";
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // ─── SUPABASE CLIENT (SSR) ────────────────────
  // Cookie handling pattern required by @supabase/ssr for session refresh.
  // Do NOT modify — setAll/getAll are needed to propagate the refreshed session
  // cookie back to the browser on every request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ─── SESSION REFRESH ──────────────────────────
  // IMPORTANT: getUser() must be called to refresh the session cookie.
  // Do not remove — without this the session will expire silently.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ─── AUTH ROUTES: /login and /signup ─────────
  // Logged-in users should never see the auth pages.
  // Redirect admins to /admin, all other users to /dashboard.
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const role = await getUserRole(supabase, user.id);
    const url = request.nextUrl.clone();
    url.pathname = role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(url);
  }

  // ─── DASHBOARD + SETTINGS ROUTES ─────────────
  // /dashboard, /dashboard/*, /settings
  // Require authentication. Admins should not land here — send them to /admin.
  if (
    pathname.startsWith("/dashboard") ||
    pathname === "/settings"
  ) {
    // Unauthenticated → /login with ?redirect= so user returns after signing in
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Admin visiting subscriber area → redirect to admin dashboard
    const role = await getUserRole(supabase, user.id);
    if (role === "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }

    // ─── SUBSCRIPTION CHECK ──────────────────
    // PRD: subscription status checked on EVERY authenticated request.
    // We query here but do NOT hard-block — the dashboard page itself renders
    // the appropriate "subscribe" CTA when no active subscription is found.
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // subscription variable intentionally unused here — page-level components
    // handle the restricted view when subscription is null/inactive.
    void subscription;
  }

  // ─── ADMIN ROUTES: /admin and /admin/* ───────
  // Require authentication + admin role.
  // Non-admins (subscribers) are sent back to their dashboard.
  if (pathname.startsWith("/admin")) {
    // Unauthenticated → /login with ?redirect= so user returns after signing in
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Resolve role and reject any non-admin user
    const role = await getUserRole(supabase, user.id);
    if (role !== "admin") {
      // Non-admin (subscriber) trying to reach admin routes → subscriber dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  // ─── OTHER PROTECTED ROUTES ───────────────────
  // /scores/*, /charity/*, /draws/*, /winnings/*
  // Require authentication only — no role restriction beyond being logged in.
  if (
    pathname.startsWith("/scores") ||
    pathname.startsWith("/charity") ||
    pathname.startsWith("/draws") ||
    pathname.startsWith("/winnings")
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }
  }

  // ─── PASS THROUGH ────────────────────────────
  // Return the (potentially cookie-refreshed) response for all other cases
  return supabaseResponse;
}

// ─── ROUTE MATCHER ───────────────────────────
// Only run middleware on these paths (skip static assets, _next, api, etc.)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/settings",           // subscriber settings page
    "/scores/:path*",
    "/charity/:path*",
    "/draws/:path*",
    "/winnings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
