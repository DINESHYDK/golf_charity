// ─── NEXT.JS MIDDLEWARE ──────────────────────
// Runs on every matched request before the page loads
// Handles: auth checks, subscription validation, role-based access
// PRD: "Real-time subscription status check on every authenticated request"

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
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

  // Refresh session — IMPORTANT: must be called before getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ─── AUTH ROUTES (login/signup) ────────────
  // If already logged in, redirect away from auth pages
  if (user && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ─── PROTECTED ROUTES: /dashboard/* ────────
  // Require authentication + active subscription
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/scores") || pathname.startsWith("/charity") || pathname.startsWith("/draws") || pathname.startsWith("/winnings")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // ─── SUBSCRIPTION CHECK ────────────────
    // PRD: subscription status checked on EVERY authenticated request
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    // If no active subscription, allow dashboard but with restricted view
    // The dashboard page itself will handle showing the "subscribe" CTA
    // We don't hard-block here because the user needs to see their account
  }

  // ─── ADMIN ROUTES: /admin/* ────────────────
  // Require authentication + admin role
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", pathname);
      return NextResponse.redirect(url);
    }

    // Check admin role from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      // Non-admin trying to access admin routes → redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

// ─── ROUTE MATCHER ───────────────────────────
// Only run middleware on these paths (skip static assets, api, etc.)
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scores/:path*",
    "/charity/:path*",
    "/draws/:path*",
    "/winnings/:path*",
    "/admin/:path*",
    "/login",
    "/signup",
  ],
};
