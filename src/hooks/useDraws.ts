// ─── useDraws HOOK ───────────────────────────
// Fetches published draws, user's entries, and match results

"use client";

import { useState, useEffect, useCallback } from "react";
import type { Draw, DrawEntry } from "@/types";

interface DrawWithEntry extends Draw {
  my_entry: DrawEntry | null;
}

export function useDraws() {
  const [draws, setDraws] = useState<DrawWithEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── FETCH DRAWS ──────────────────────────
  const fetchDraws = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/draws");
      const result = await response.json();

      if (!response.ok) throw new Error(result.error);

      setDraws(result.data || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch draws";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDraws();
  }, [fetchDraws]);

  // ─── DERIVED STATE ────────────────────────
  const latestDraw = draws.length > 0 ? draws[0] : null;
  const pastDraws = draws.filter((d) => d.status === "published");
  const myWinningDraws = draws.filter(
    (d) => d.my_entry && d.my_entry.match_count >= 3
  );

  return {
    draws,
    latestDraw,
    pastDraws,
    myWinningDraws,
    isLoading,
    error,
    refreshDraws: fetchDraws,
  };
}
