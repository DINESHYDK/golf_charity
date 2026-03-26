# GolfGive — Golf Charity Subscription Platform

> Trainee selection assignment for **Digital Heroes** agency.
> A full-stack subscription platform combining Stableford golf score tracking, monthly lottery-style prize draws, and charitable giving.

---

## Table of Contents

- [Overview](#overview)
- [Live Product Flow](#live-product-flow)
- [Tech Stack](#tech-stack)
- [Features Implemented](#features-implemented)
- [Business Logic & Resolved Ambiguities](#business-logic--resolved-ambiguities)
- [Database Schema](#database-schema)
- [API Routes](#api-routes)
- [Project Structure](#project-structure)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Stripe Integration](#stripe-integration)
- [Design System](#design-system)

---

## Overview

GolfGive lets golfers subscribe monthly or yearly, enter their Stableford scores, and compete in a monthly prize draw — while a guaranteed percentage of every subscription is donated to a charity of the subscriber's choice.

**Three roles:**

| Role | Access |
|------|--------|
| Public | Landing page, charity directory, how it works, pricing |
| Subscriber | Dashboard, score entry, charity selection, draws, winnings |
| Admin | All subscriber features + full admin panel (users, draws, charities, winners) |

---

## Live Product Flow

```
Subscribe (monthly/yearly)
  → Enter up to 5 Stableford scores
    → Monthly draw picks 5 numbers (1–45)
      → Match 3, 4, or 5 scores to win
        → Upload proof of win
          → Admin verifies
            → Payout processed
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v3 + CSS Custom Properties |
| Animations | Framer Motion v11 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (JWT, SSR via `@supabase/ssr`) |
| Payments | Stripe Checkout + Webhooks (test mode) |
| State | Zustand + custom React hooks |
| Toasts | react-hot-toast |
| Icons | Lucide React |
| Dates | date-fns |
| Deployment | Vercel |

---

## Features Implemented

### Landing Page
- Full-viewport hero with golf course background, dual gradient overlay for text legibility
- Animated stat counters (prize pool, donations, subscribers)
- **How It Works** — bento grid layout with 4-step process, gold border glow on hover
- Featured Charities section
- Pricing Plans (monthly / yearly toggle)
- Charity Lamp section (Aceternity UI–style ambient lamp with amber conic gradient)
- Footer — 3-column links (2-column on mobile), Framer Motion spring bounce on hover
- Floating pill navbar — `fixed top-6 left-1/2`, glass morphism, shape-morphs on mobile open

### Authentication
- Email + password signup with full name capture
- Login with redirect-back support (`?redirect=` param)
- Supabase SSR session management via middleware
- Auto-create `profiles` row via Postgres trigger on signup

### Subscriber Dashboard (5 pages)
- **Dashboard** — subscription status, renewal date, quick actions, draw results summary
- **Scores** — score entry form, rolling 5-score window enforced client and server side, score history
- **Charity** — charity browser with search/filter, one-active-charity-per-user selection, contribution percentage slider (min 10%)
- **Draws** — draw participation view, match highlighting, jackpot display
- **Winnings** — winner records, proof upload, payout status tracker

### Admin Panel (5 pages)
- **Overview** — platform stats, revenue breakdown, recent activity audit log
- **Users** — subscriber list, subscription status, role management
- **Draws** — create draws, run simulation, review results, publish
- **Charities** — charity CRUD, featured/active flags
- **Winners** — verification queue, approve/reject proof, mark paid

### Stripe Payment Flow
- Server-side Checkout Session creation (`/api/subscription` POST)
- `user_id`, `plan_type`, `charity_percentage` passed via session metadata
- Webhook handler at `/api/webhooks/stripe` — processes 5 event types
- Cancel subscription via `cancel_at_period_end: true` (access until billing period ends)

### Middleware & Auth Guard
- Every request to `/dashboard/*`, `/scores/*`, `/charity/*`, `/draws/*`, `/winnings/*` requires authentication
- `/admin/*` requires `profiles.role = 'admin'`
- Subscription status checked on every authenticated request
- Unauthenticated users redirected to `/login?redirect=<original-path>`

---

## Business Logic & Resolved Ambiguities

These decisions were made deliberately during development and are documented here.

### 1. Revenue Split

```
Prize Pool:   72%  — fixed, never changes
Charity:      10%  — minimum, user can increase
Platform Fee: 18%  — absorbs any charity % increase above 10%
```

If a user sets charity to 15%: prize pool stays at 72%, platform drops to 13%. The extra charity percentage **always comes from the platform fee**, never the prize pool.

### 2. Score Rolling Window

- Maximum **5 scores** per user at any time
- On the 6th score entry: the oldest score (by `created_at`) is deleted before the new one is inserted
- "Oldest" is determined by **when the user entered it** (`created_at`), not the `score_date` field
- Score range: 1–45 (standard Stableford format)
- Display order: reverse chronological (most recent first)

### 3. Draw Engine — Two Modes

**Random Mode:**
- 5 unique random integers drawn from 1–45

**Algorithmic Mode (weighted):**
- Counts frequency of all scores across active subscribers
- Higher-frequency scores have proportionally higher draw probability
- Intent: more matches → more winners → higher engagement

**Draw Execution Flow:**
1. Admin creates draw → `status = 'scheduled'`
2. System snapshots all active subscribers' scores into `draw_entries.scores_snapshot`
3. Admin runs simulation → numbers generated, matches calculated → `status = 'simulated'`
4. Admin reviews results
5. Admin publishes → `status = 'published'` → email notifications queued
6. **Critical rule: On publish, do NOT re-run the draw. Use the simulation data as-is.**

### 4. Prize Pool Distribution

| Match Count | Prize Share | Rolls Over? |
|-------------|-------------|-------------|
| 5 matches | 40% + jackpot carried in | Yes — if no winner |
| 4 matches | 35% | No |
| 3 matches | 25% | No |

- Multiple winners in the same tier split the prize equally
- 3-match and 4-match pools with no winners: money stays on platform (does **not** roll over)
- Jackpot compounds — query `jackpot_carried_in` from previous draw, don't hardcode it

### 5. Winner Verification Flow

```
Winner identified (match_count ≥ 3)
  → verification_status = 'pending'
    → User uploads screenshot (proof_upload_url set, submitted_at stamped)
      → Admin reviews
        → 'approved'  → payout_status = 'pending' → admin marks 'paid' → paid_at stamped
        → 'rejected'  → user notified
```

### 6. Charity Percentage Updates

- User can increase `charity_percentage` anytime (minimum 10%, no cap)
- Changes apply to the **next billing cycle** — current month is already processed
- Update both `user_charity_selections.contribution_percentage` AND `subscriptions.charity_percentage`

### 7. Webhook Timeout Prevention

The `invoice.payment_succeeded` event requires two DB writes (payment record + subscription period update). These are run with `Promise.all` in parallel to halve the round-trip time and prevent Stripe CLI timeout (`context deadline exceeded`).

### 8. Renews Date Fix

`checkout.session.completed` now calls `stripe.subscriptions.retrieve()` immediately to get the real `current_period_end` from Stripe. `customer.subscription.updated` also persists both period dates on every renewal. This ensures the dashboard always displays an actual renewal date rather than "Unknown".

---

## Database Schema

13 tables, all with Row Level Security (RLS) enabled.

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` — stores `full_name`, `role` |
| `subscriptions` | Plan type, status, Stripe IDs, charity %, period dates |
| `payments` | Every charge with `charity_cut` + `prize_pool_cut` calculated |
| `scores` | User scores (max 5, rolling window enforced at insert) |
| `charities` | Charity directory with `featured` + `active` flags |
| `charity_events` | Events linked to charities |
| `user_charity_selections` | One active charity per user + contribution % |
| `independent_donations` | One-off donations outside subscription |
| `draws` | Monthly draw records + drawn numbers + status |
| `prize_pools` | Prize distribution per draw (40/35/25 split) |
| `draw_entries` | User entries with `scores_snapshot` (immutable at draw time) |
| `winners` | Match results + verification + payout status |
| `email_notifications` | Notification queue (processed by Edge Function / cron) |
| `admin_audit_log` | Admin action tracking |

**Triggers:**
- `on_auth_user_created` — auto-creates `profiles` row on signup
- `set_*_updated_at` — auto-stamps `updated_at` on every UPDATE

**Key RLS policies:**
- Users can only read/write their own rows
- Admins (`role = 'admin'`) bypass user-level restrictions
- `charities` and `draws` (when `status = 'published'`) are publicly readable

Full migration: `supabase/migrations/001_initial_schema.sql`

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/subscription` | Fetch current user's subscription |
| POST | `/api/subscription` | Create Stripe Checkout session |
| DELETE | `/api/subscription` | Cancel subscription (at period end) |
| GET | `/api/scores` | Fetch user's scores |
| POST | `/api/scores` | Add score (enforces 5-score rolling window) |
| DELETE | `/api/scores/[id]` | Delete a score |
| GET | `/api/draws` | Fetch draws |
| POST | `/api/draws` | Create draw (admin) |
| GET | `/api/charities` | Fetch charity list |
| POST | `/api/charities` | Create charity (admin) |
| POST | `/api/donations` | Record independent donation |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    Landing page
│   ├── globals.css                 CSS variables + Tailwind base
│   ├── (auth)/login                Login page
│   ├── (auth)/signup               Signup page
│   ├── (dashboard)/dashboard       Subscriber overview
│   ├── (dashboard)/scores          Score entry + history
│   ├── (dashboard)/charity         Charity selection
│   ├── (dashboard)/draws           Draw participation
│   ├── (dashboard)/winnings        Winnings + proof upload
│   ├── (admin)/admin               Admin overview
│   ├── (admin)/admin/users         User management
│   ├── (admin)/admin/draws         Draw management + simulator
│   ├── (admin)/admin/charities     Charity management
│   ├── (admin)/admin/winners       Winner verification
│   └── api/                        API routes (see table above)
│
├── components/
│   ├── ui/                         Button, Input, Card, Modal, Loader, Lamp
│   ├── layout/                     Navbar, Footer, Sidebar, DashboardShell
│   ├── landing/                    Hero, HowItWorks, FeaturedCharities, PricingPlans, CharityLamp
│   ├── auth/                       LoginForm, SignupForm
│   ├── dashboard/                  StatCard, SubscriptionStatus, QuickActions
│   ├── scores/                     ScoreEntryForm, ScoreCard, ScoreHistory
│   ├── draws/                      DrawCard, DrawResult, MatchAnimation
│   ├── charity/                    CharityCard, CharityGrid, ContributionSlider
│   ├── admin/                      AdminTable, DrawSimulator, WinnerVerification
│   └── shared/                     AnimatedCounter, LoadingSpinner, EmptyState
│
├── hooks/
│   ├── useAuth.ts                  Auth state + subscription status
│   ├── useSubscription.ts          Subscription lifecycle
│   ├── useScores.ts                Score CRUD with rolling 5 logic
│   └── useDraws.ts                 Draw data + participation
│
├── lib/
│   ├── supabase/client.ts          Browser client
│   ├── supabase/server.ts          Server-side client
│   ├── supabase/admin.ts           Service-role client (bypasses RLS)
│   ├── stripe/client.ts            Stripe instance
│   └── stripe/config.ts            Plans + price IDs
│
├── types/index.ts                  All TypeScript interfaces
├── constants/index.ts              Revenue splits, score limits, plan config
└── middleware.ts                   Auth guard + admin check + subscription check
```

---

## Local Development Setup

### Prerequisites
- Node.js 18+
- A Supabase project
- A Stripe account (test mode)
- Stripe CLI (for local webhook testing)

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in all values (see [Environment Variables](#environment-variables) below).

### 3. Run the Supabase migration

In your Supabase dashboard → SQL Editor, paste and run the contents of:
```
supabase/migrations/001_initial_schema.sql
```

### 4. Set your admin user

After signing up via `/signup`, go to Supabase → Table Editor → `profiles`, find your row, and set `role = 'admin'`.

### 5. Add Stripe Price IDs

In `src/lib/stripe/config.ts`, replace the placeholder `priceId` values with the real IDs from your Stripe Dashboard → Products.

### 6. Start development

```bash
# Terminal 1 — Next.js dev server
npm run dev

# Terminal 2 — Stripe CLI webhook forwarding
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` secret printed by the CLI and add it to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

### 7. Test the subscription flow

Use Stripe test card: `4242 4242 4242 4242` — any future expiry, any CVC.

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Never commit `.env.local` to git. It is listed in `.gitignore`.

---

## Stripe Integration

### Checkout Flow

1. User clicks Subscribe → POST `/api/subscription` with `plan_type` + `charity_percentage`
2. Server creates a Stripe Checkout Session with metadata: `{ user_id, plan_type, charity_percentage }`
3. User is redirected to Stripe hosted checkout
4. On success → redirected to `/dashboard?subscription=success`
5. Stripe fires `checkout.session.completed` → webhook creates subscription record with real period dates

### Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create subscription row, fetch `current_period_end` from Stripe |
| `invoice.payment_succeeded` | Record payment, calculate splits, update period dates (parallel DB writes) |
| `invoice.payment_failed` | Set status to `lapsed`, queue payment-failed email |
| `customer.subscription.updated` | Sync status + period dates |
| `customer.subscription.deleted` | Set status to `cancelled` |

### Cancellation

Cancellation uses `cancel_at_period_end: true` — the user retains access until the end of their current billing period.

---

## Design System

### Colours (60-30-10 rule)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#1A3C34` | Deep Forest Green — dominant (60%) |
| `--color-primary-dark` | `#0D2818` | Navbar, footer, dark sections |
| `--color-secondary` | `#F5F0E8` | Off-White / Cream — backgrounds (30%) |
| `--color-accent` | `#D4AF37` | Bright Gold — CTAs, highlights (10%) |

### Typography

- **Headings** — Playfair Display (serif, via Google Fonts)
- **Body** — DM Sans (sans-serif, via Google Fonts)

### Key UI Decisions

- **Navbar** — floating pill (`fixed top-6 left-1/2 -translate-x-1/2`), glass morphism (`bg-[#0D2818]/65 backdrop-blur-md`), shape morphs `rounded-full` ↔ `rounded-2xl` on mobile
- **Tailwind opacity on CSS variables** — `var(--color-*)` with `/20` opacity modifiers don't work at build time; all opacity values use `rgba()` arbitrary values instead
- **Framer Motion** — `framer-motion` package directly (not the `motion/react` alias)
- **Lamp effect** — Aceternity UI–style conic gradient amber lamp, sits between Pricing and Footer as a charity pledge section

---

*Built by Dinesh — Digital Heroes Trainee Assignment, 2026*
