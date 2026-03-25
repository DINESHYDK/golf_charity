// ============================================
// Golf Charity Subscription Platform
// Type Definitions — Single source of truth
// ============================================

// ─── USER & AUTH ─────────────────────────────

export type UserRole = "subscriber" | "admin";

export type SubscriptionStatus = "active" | "inactive" | "cancelled" | "lapsed";

export type PlanType = "monthly" | "yearly";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string | null;
}

// ─── SUBSCRIPTION & PAYMENTS ─────────────────

export interface Subscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  charity_percentage: number; // Min 10, user can increase
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string | null;
}

export type PaymentStatus = "succeeded" | "failed" | "pending" | "refunded";

export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string | null;
  stripe_payment_intent_id: string | null;
  amount: number;
  charity_cut: number | null;
  prize_pool_cut: number | null;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

// ─── SCORES ──────────────────────────────────

export interface Score {
  id: string;
  user_id: string;
  score_value: number; // 1–45 Stableford
  score_date: string; // ISO date string
  created_at: string;
}

// ─── CHARITIES ───────────────────────────────

export interface Charity {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  website_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  location: string | null;
  created_at: string;
}

export interface UserCharitySelection {
  id: string;
  user_id: string;
  charity_id: string;
  contribution_percentage: number; // Min 10
  created_at: string;
  updated_at: string | null;
  // Joined data
  charity?: Charity;
}

export interface IndependentDonation {
  id: string;
  user_id: string;
  charity_id: string;
  amount: number;
  stripe_payment_intent_id: string | null;
  status: "pending" | "succeeded" | "failed";
  created_at: string;
}

// ─── DRAW ENGINE ─────────────────────────────

export type DrawStatus = "scheduled" | "simulated" | "published";

export type DrawLogic = "random" | "algorithmic";

export interface Draw {
  id: string;
  draw_month: string; // Format: YYYY-MM
  draw_logic: DrawLogic | null;
  drawn_numbers: number[] | null; // Array of 5 integers
  status: DrawStatus;
  jackpot_carried_in: number;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined data
  prize_pool?: PrizePool;
}

export interface PrizePool {
  id: string;
  draw_id: string;
  total_pool_amount: number;
  match_5_amount: number | null;
  match_4_amount: number | null;
  match_3_amount: number | null;
  active_subscriber_count: number | null;
  jackpot_rolled_over: boolean;
  created_at: string;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  scores_snapshot: number[]; // Frozen 5 scores at draw time
  match_count: number; // 0, 3, 4, or 5
  created_at: string;
}

// ─── WINNERS & VERIFICATION ──────────────────

export type VerificationStatus = "pending" | "approved" | "rejected";

export type PayoutStatus = "pending" | "paid";

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  draw_entry_id: string;
  match_type: 3 | 4 | 5;
  prize_amount: number;
  verification_status: VerificationStatus;
  payout_status: PayoutStatus;
  proof_upload_url: string | null;
  admin_notes: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string | null;
  // Joined data
  profile?: Profile;
  draw?: Draw;
}

// ─── NOTIFICATIONS ───────────────────────────

export type NotificationType =
  | "draw_result"
  | "winner_alert"
  | "subscription_renewal"
  | "payment_failed"
  | "winner_verified";

export interface EmailNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  subject: string | null;
  status: "queued" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

// ─── ADMIN ───────────────────────────────────

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  notes: string | null;
  created_at: string;
}

// ─── API RESPONSE SHAPES ─────────────────────

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  code?: number;
}

// ─── DASHBOARD STATS ─────────────────────────

export interface DashboardStats {
  subscription_status: SubscriptionStatus;
  plan_type: PlanType | null;
  renewal_date: string | null;
  total_scores: number;
  selected_charity: string | null;
  charity_percentage: number;
  draws_entered: number;
  total_winnings: number;
  pending_payouts: number;
}

export interface AdminStats {
  total_users: number;
  active_subscribers: number;
  total_prize_pool: number;
  total_charity_contributions: number;
  total_draws: number;
  pending_verifications: number;
}
