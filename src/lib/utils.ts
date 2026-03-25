// ─── SHARED UTILITIES ────────────────────────
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes with clsx — handles conditional classes
 * Usage: cn("base-class", isActive && "active-class", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount for display
 * Uses GBP by default (golf platform context)
 */
export function formatCurrency(
  amount: number,
  currency: string = "GBP"
): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string for display
 */
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

/**
 * Format draw month (YYYY-MM) to readable format
 * e.g., "2026-04" → "April 2026"
 */
export function formatDrawMonth(drawMonth: string): string {
  const [year, month] = drawMonth.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

/**
 * Calculate revenue split from a payment amount
 * Returns charity_cut, prize_pool_cut, and platform_fee
 */
export function calculateRevenueSplit(
  amount: number,
  charityPercentage: number
) {
  // ─── REVENUE SPLIT LOGIC ───────────────────
  // Prize pool is ALWAYS 72% — never changes
  // If charity > 10%, extra comes from platform fee
  // Example: charity=15% → prize=72%, platform=13%
  const PRIZE_POOL_PCT = 72;

  const charityCut = (amount * charityPercentage) / 100;
  const prizePoolCut = (amount * PRIZE_POOL_PCT) / 100;
  const platformFee = amount - charityCut - prizePoolCut;

  return {
    charity_cut: Math.round(charityCut * 100) / 100,
    prize_pool_cut: Math.round(prizePoolCut * 100) / 100,
    platform_fee: Math.round(platformFee * 100) / 100,
  };
}

/**
 * Validate a Stableford score value
 */
export function isValidScore(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 45;
}

/**
 * Generate a random set of draw numbers (for random draw mode)
 * Returns array of 5 unique integers between 1-45
 */
export function generateRandomDrawNumbers(): number[] {
  const numbers = new Set<number>();
  while (numbers.size < 5) {
    numbers.add(Math.floor(Math.random() * 45) + 1);
  }
  return Array.from(numbers).sort((a, b) => a - b);
}

/**
 * Calculate match count between user scores and drawn numbers
 */
export function calculateMatchCount(
  userScores: number[],
  drawnNumbers: number[]
): number {
  const matches = userScores.filter((score) =>
    drawnNumbers.includes(score)
  ).length;
  // Only 3, 4, or 5 matches count — below 3 is 0
  return matches >= 3 ? matches : 0;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Sleep utility for artificial delays (loading states demo)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
