// ─── useAuth HOOK ────────────────────────────
// Manages authentication state, user profile, and subscription status
// Used across the app for auth guards and user data display

"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile, Subscription } from "@/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSubscribed: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    subscription: null,
    isLoading: true,
    isAdmin: false,
    isSubscribed: false,
  });

  const supabase = createClient();

  // ─── FETCH USER DATA ──────────────────────
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      // Fetch profile and subscription in parallel
      const [profileResult, subscriptionResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .single(),
      ]);

      const profile = profileResult.data as Profile | null;
      const subscription = subscriptionResult.data as Subscription | null;

      setState((prev) => ({
        ...prev,
        profile,
        subscription,
        isAdmin: profile?.role === "admin",
        isSubscribed: subscription?.status === "active",
        isLoading: false,
      }));
    } catch {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [supabase]);

  // ─── INITIALIZE AUTH STATE ────────────────
  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState((prev) => ({ ...prev, user }));
      if (user) {
        fetchUserData(user.id);
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes (login, logout, token refresh)
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;
        setState((prev) => ({ ...prev, user }));

        if (user) {
          fetchUserData(user.id);
        } else {
          setState({
            user: null,
            profile: null,
            subscription: null,
            isLoading: false,
            isAdmin: false,
            isSubscribed: false,
          });
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, [supabase, fetchUserData]);

  // ─── AUTH ACTIONS ─────────────────────────
  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    refreshUserData: () => state.user && fetchUserData(state.user.id),
  };
}
