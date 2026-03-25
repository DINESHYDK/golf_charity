-- ============================================
-- Golf Charity Subscription Platform
-- Initial Database Schema + RLS Policies
-- Run this in Supabase SQL Editor (or as migration)
-- ============================================

-- ─── ENABLE EXTENSIONS ───────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- Extends Supabase auth.users — same UUID as PK
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(100),
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'subscriber' CHECK (role IN ('subscriber', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Auto-create profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url',
    'subscriber'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- TABLE: subscriptions
-- ============================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type VARCHAR(10) NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed')),
  stripe_customer_id VARCHAR(100),
  stripe_subscription_id VARCHAR(100),
  charity_percentage DECIMAL(5,2) DEFAULT 10 CHECK (charity_percentage >= 10),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);


-- ============================================
-- TABLE: payments
-- ============================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  stripe_payment_intent_id VARCHAR(100) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  charity_cut DECIMAL(10,2),
  prize_pool_cut DECIMAL(10,2),
  currency VARCHAR(5) DEFAULT 'gbp',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_subscription_id ON payments(subscription_id);


-- ============================================
-- TABLE: scores
-- Stableford scores — max 5 per user (rolling window)
-- ============================================
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score_value INT NOT NULL CHECK (score_value >= 1 AND score_value <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for rolling 5-score window enforcement
CREATE INDEX idx_scores_user_created ON scores(user_id, created_at);


-- ============================================
-- TABLE: charities
-- ============================================
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TRIGGER set_charities_updated_at
  BEFORE UPDATE ON charities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- TABLE: charity_events
-- ============================================
CREATE TABLE charity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  event_date DATE,
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charity_events_charity_id ON charity_events(charity_id);


-- ============================================
-- TABLE: user_charity_selections
-- One active charity per user (enforced via unique constraint)
-- ============================================
CREATE TABLE user_charity_selections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  contribution_percentage DECIMAL(5,2) NOT NULL DEFAULT 10 CHECK (contribution_percentage >= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TRIGGER set_user_charity_selections_updated_at
  BEFORE UPDATE ON user_charity_selections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- TABLE: independent_donations
-- Standalone donations not tied to subscription
-- ============================================
CREATE TABLE independent_donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  stripe_payment_intent_id VARCHAR(100) UNIQUE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_independent_donations_user ON independent_donations(user_id);


-- ============================================
-- TABLE: draws
-- Monthly draw records
-- ============================================
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_month VARCHAR(7) UNIQUE NOT NULL, -- Format: YYYY-MM
  draw_logic VARCHAR(20) CHECK (draw_logic IN ('random', 'algorithmic')),
  drawn_numbers JSONB, -- Array of 5 ints e.g. [12, 27, 33, 41, 5]
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'simulated', 'published')),
  jackpot_carried_in DECIMAL(10,2) DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TRIGGER set_draws_updated_at
  BEFORE UPDATE ON draws
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================
-- TABLE: prize_pools
-- One prize pool per draw (1:1 relationship)
-- ============================================
CREATE TABLE prize_pools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID UNIQUE NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  total_pool_amount DECIMAL(10,2) NOT NULL,
  match_5_amount DECIMAL(10,2),
  match_4_amount DECIMAL(10,2),
  match_3_amount DECIMAL(10,2),
  active_subscriber_count INT,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================
-- TABLE: draw_entries
-- User entries per draw with frozen score snapshot
-- ============================================
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scores_snapshot JSONB NOT NULL, -- Frozen 5 scores at draw time
  match_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- One entry per user per draw
  UNIQUE(draw_id, user_id)
);

CREATE INDEX idx_draw_entries_draw_id ON draw_entries(draw_id);
CREATE INDEX idx_draw_entries_user_id ON draw_entries(user_id);


-- ============================================
-- TABLE: winners
-- Winner records with verification + payout tracking
-- ============================================
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  draw_entry_id UUID NOT NULL REFERENCES draw_entries(id) ON DELETE CASCADE,
  match_type INT NOT NULL CHECK (match_type IN (3, 4, 5)),
  prize_amount DECIMAL(10,2) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  payout_status VARCHAR(20) DEFAULT 'pending' CHECK (payout_status IN ('pending', 'paid')),
  proof_upload_url TEXT,
  admin_notes TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

CREATE TRIGGER set_winners_updated_at
  BEFORE UPDATE ON winners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_winners_draw_id ON winners(draw_id);
CREATE INDEX idx_winners_user_id ON winners(user_id);
CREATE INDEX idx_winners_verification ON winners(verification_status);


-- ============================================
-- TABLE: email_notifications
-- Notification queue
-- ============================================
CREATE TABLE email_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(20) DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_email_notifications_user ON email_notifications(user_id);
CREATE INDEX idx_email_notifications_status ON email_notifications(status);


-- ============================================
-- TABLE: admin_audit_log
-- Admin action tracking for accountability
-- ============================================
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_table VARCHAR(50),
  target_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_admin ON admin_audit_log(admin_id);
CREATE INDEX idx_audit_log_action ON admin_audit_log(action);


-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- CRITICAL: Every table must have RLS enabled
-- ============================================

-- Helper: Check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─── PROFILES ────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());


-- ─── SUBSCRIPTIONS ───────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all subscriptions"
  ON subscriptions FOR SELECT
  USING (is_admin());

CREATE POLICY "System can insert subscriptions"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage subscriptions"
  ON subscriptions FOR ALL
  USING (is_admin());


-- ─── PAYMENTS ────────────────────────────────
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all payments"
  ON payments FOR SELECT
  USING (is_admin());


-- ─── SCORES ──────────────────────────────────
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scores"
  ON scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scores"
  ON scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scores"
  ON scores FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all scores"
  ON scores FOR ALL
  USING (is_admin());


-- ─── CHARITIES ───────────────────────────────
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;

-- Charities are publicly readable (for landing page, directory)
CREATE POLICY "Anyone can read active charities"
  ON charities FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can read all charities"
  ON charities FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage charities"
  ON charities FOR ALL
  USING (is_admin());


-- ─── CHARITY EVENTS ──────────────────────────
ALTER TABLE charity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read charity events"
  ON charity_events FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage charity events"
  ON charity_events FOR ALL
  USING (is_admin());


-- ─── USER CHARITY SELECTIONS ─────────────────
ALTER TABLE user_charity_selections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own charity selection"
  ON user_charity_selections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own charity selection"
  ON user_charity_selections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own charity selection"
  ON user_charity_selections FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all charity selections"
  ON user_charity_selections FOR SELECT
  USING (is_admin());


-- ─── INDEPENDENT DONATIONS ───────────────────
ALTER TABLE independent_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own donations"
  ON independent_donations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own donations"
  ON independent_donations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all donations"
  ON independent_donations FOR SELECT
  USING (is_admin());


-- ─── DRAWS ───────────────────────────────────
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;

-- Public can only see published draws
CREATE POLICY "Anyone can read published draws"
  ON draws FOR SELECT
  USING (status = 'published');

-- Admins have full access to all draws (including scheduled/simulated)
CREATE POLICY "Admins have full draw access"
  ON draws FOR ALL
  USING (is_admin());


-- ─── PRIZE POOLS ─────────────────────────────
ALTER TABLE prize_pools ENABLE ROW LEVEL SECURITY;

-- Prize pools visible for published draws
CREATE POLICY "Anyone can read published prize pools"
  ON prize_pools FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM draws WHERE draws.id = prize_pools.draw_id AND draws.status = 'published'
    )
  );

CREATE POLICY "Admins have full prize pool access"
  ON prize_pools FOR ALL
  USING (is_admin());


-- ─── DRAW ENTRIES ────────────────────────────
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own draw entries"
  ON draw_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full draw entry access"
  ON draw_entries FOR ALL
  USING (is_admin());


-- ─── WINNERS ─────────────────────────────────
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own winner records"
  ON winners FOR SELECT
  USING (auth.uid() = user_id);

-- Users can only update proof_upload_url on their own records
CREATE POLICY "Users can upload proof on own records"
  ON winners FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full winner access"
  ON winners FOR ALL
  USING (is_admin());


-- ─── EMAIL NOTIFICATIONS ─────────────────────
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON email_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins have full notification access"
  ON email_notifications FOR ALL
  USING (is_admin());


-- ─── ADMIN AUDIT LOG ─────────────────────────
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit log"
  ON admin_audit_log FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can insert audit log"
  ON admin_audit_log FOR INSERT
  WITH CHECK (is_admin());


-- ============================================
-- SEED DATA: Sample charities for development
-- ============================================
INSERT INTO charities (name, description, image_url, is_featured, is_active) VALUES
  ('Golf For Good Foundation', 'Bringing the joy of golf to underprivileged communities worldwide. We provide equipment, coaching, and facilities to young people who otherwise would never have the opportunity to play.', NULL, TRUE, TRUE),
  ('Green Fairways Trust', 'Dedicated to environmental conservation on and around golf courses. We work to protect biodiversity, reduce water usage, and promote sustainable groundskeeping practices.', NULL, FALSE, TRUE),
  ('Junior Tees Initiative', 'Supporting youth golf programs across the UK. Every child deserves a chance to discover the game, regardless of their background or financial situation.', NULL, TRUE, TRUE),
  ('Veterans on the Green', 'Using golf as therapy and community-building for military veterans. Our programs help with mental health recovery, physical rehabilitation, and social reintegration.', NULL, FALSE, TRUE),
  ('Swing For Hope', 'Raising funds for cancer research through golf events and community engagement. 100% of donations go directly to approved research institutions.', NULL, FALSE, TRUE);
