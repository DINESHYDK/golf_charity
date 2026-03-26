// ============================================
// Golf Charity Subscription Platform
// Constants — Business Logic Configuration
// ============================================

// ─── REVENUE SPLIT ───────────────────────────
// Decision: 10% charity (min) + 72% prize pool + 18% platform
// If user increases charity %, it comes from platform fee
// Prize pool ALWAYS stays at 72%

export const REVENUE_SPLIT = {
  CHARITY_MIN_PERCENTAGE: 10, // Minimum charity contribution
  PRIZE_POOL_PERCENTAGE: 72, // Fixed — never changes
  PLATFORM_FEE_PERCENTAGE: 18, // Decreases if charity % increases
} as const;

// ─── SCORE SYSTEM ────────────────────────────
export const SCORE_CONFIG = {
  MAX_SCORES_PER_USER: 5,
  MIN_SCORE_VALUE: 1,
  MAX_SCORE_VALUE: 45, // Stableford format max
} as const;

// ─── DRAW SYSTEM ─────────────────────────────
export const DRAW_CONFIG = {
  NUMBERS_PER_DRAW: 5,
  MIN_DRAW_NUMBER: 1,
  MAX_DRAW_NUMBER: 45,

  // Prize pool distribution percentages
  MATCH_5_POOL_PERCENTAGE: 40,
  MATCH_4_POOL_PERCENTAGE: 35,
  MATCH_3_POOL_PERCENTAGE: 25,

  // Match types
  MATCH_TIERS: [5, 4, 3] as const,
} as const;

// ─── SUBSCRIPTION PLANS ──────────────────────
export const PLANS = {
  monthly: {
    name: "Monthly",
    interval: "month" as const,
    description: "Billed every month",
    features: [
      "Enter up to 5 golf scores",
      "Monthly prize draw entry",
      "Choose your charity",
      "Full dashboard access",
    ],
  },
  yearly: {
    name: "Yearly",
    interval: "year" as const,
    description: "Save with annual billing",
    badge: "Best Value",
    features: [
      "Everything in Monthly",
      "Discounted annual rate",
      "Priority support",
      "Early draw results access",
    ],
  },
} as const;

// ─── NAVIGATION ──────────────────────────────
export const DASHBOARD_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "My Scores", href: "/scores", icon: "Target" },
  { label: "Charity", href: "/charity", icon: "Heart" },
  { label: "Draws", href: "/draws", icon: "Ticket" },
  { label: "Winnings", href: "/winnings", icon: "Trophy" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const ADMIN_NAV = [
  { label: "Overview", href: "/admin", icon: "BarChart3" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Draws", href: "/admin/draws", icon: "Dice5" },
  { label: "Charities", href: "/admin/charities", icon: "Heart" },
  { label: "Winners", href: "/admin/winners", icon: "Trophy" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
] as const;

// ─── STABLEFORD SCORING REFERENCE ────────────
// For UI display / educational tooltips only
export const STABLEFORD_POINTS = [
  { performance: "Albatross (4 under par)", points: 6 },
  { performance: "Eagle (3 under par)", points: 5 },
  { performance: "2 under par", points: 4 },
  { performance: "Birdie (1 under par)", points: 3 },
  { performance: "Par", points: 2 },
  { performance: "Bogey (1 over par)", points: 1 },
  { performance: "2+ over par", points: 0 },
] as const;

// ─── UI CONSTANTS ────────────────────────────
export const ANIMATION_DURATION = {
  FAST: 0.15,
  BASE: 0.25,
  SLOW: 0.35,
  PAGE_TRANSITION: 0.5,
} as const;

export const TOAST_MESSAGES = {
  SCORE_ADDED: "Score added successfully!",
  SCORE_DELETED: "Score removed",
  CHARITY_SELECTED: "Charity selection updated",
  CHARITY_PERCENTAGE_UPDATED: "Contribution percentage updated",
  PROOF_UPLOADED: "Proof submitted for verification",
  SUBSCRIPTION_ACTIVE: "Subscription activated! Welcome aboard.",
  SUBSCRIPTION_CANCELLED: "Subscription cancelled",
  GENERIC_ERROR: "Something went wrong. Please try again.",
  AUTH_ERROR: "Please sign in to continue",
  SUBSCRIPTION_REQUIRED: "An active subscription is required",
  SCORE_UPDATED: "Score updated successfully!",
} as const;
