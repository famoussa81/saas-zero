-- =============================================================================
-- Migration: 20260802000003_b2c_schema.sql
-- Description: B2C Schema - Simple user profiles and roles (no organizations)
-- This migration is for B2C (Single User) architecture
-- =============================================================================

-- =============================================================================
-- USER PROFILES (B2C Variant - no organization link)
-- Table de base créée en 20260802000001_initial_schema.sql (shared core).
-- Ici on AUGMENTE seulement avec role/status/last_login_at (choix B2B vs B2C à la création).
-- =============================================================================

ALTER TABLE public.user_profiles
    ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'premium', 'admin')),
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- =============================================================================
-- USER SUBSCRIPTIONS (B2C - Direct user to subscription link)
-- =============================================================================

-- In B2C, subscriptions link directly to user_profiles via user_id
-- We'll use the common stripe_subscriptions table but add a user_id for direct access
ALTER TABLE public.stripe_subscriptions
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON public.stripe_subscriptions(user_id);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- User Profiles (B2C)
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_status ON public.user_profiles(status);
CREATE INDEX idx_user_profiles_last_login ON public.user_profiles(last_login_at);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE TRIGGER set_updated_at_user_profiles_b2c
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - B2C TABLES
-- =============================================================================

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- USER PROFILES POLICIES (B2C)
-- =============================================================================
-- Les policies de base ("Users can view/insert/update own profile") sont déjà
-- créées dans 20260802000001_initial_schema.sql (table partagée). On n'ajoute ici
-- que les politiques B2C spécifiques (admin global).

-- Admin users can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.user_profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'admin'
        )
    );

-- Admin users can update all profiles
CREATE POLICY "Admins can update all profiles"
    ON public.user_profiles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles up
            WHERE up.id = auth.uid()
            AND up.role = 'admin'
        )
    );

-- =============================================================================
-- STRIPE SUBSCRIPTIONS POLICIES (B2C - Additional to common policies)
-- =============================================================================

-- Users can view their own subscriptions (direct user_id link)
CREATE POLICY "Users can view own subscriptions (B2C)"
    ON public.stripe_subscriptions
    FOR SELECT
    USING (user_id = auth.uid());

-- Users can insert their own subscriptions (B2C)
CREATE POLICY "Users can insert own subscriptions (B2C)"
    ON public.stripe_subscriptions
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions (B2C)
CREATE POLICY "Users can update own subscriptions (B2C)"
    ON public.stripe_subscriptions
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- STRIPE CUSTOMERS POLICIES (B2C - already covered by common, but explicit)
-- =============================================================================

-- The common policies already cover this since user_id is on stripe_customers

-- =============================================================================
-- HELPER FUNCTIONS (B2C)
-- =============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
DECLARE
    user_role TEXT;
BEGIN
    SELECT role INTO user_role
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    SELECT role = 'admin' INTO is_admin_user
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(is_admin_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if current user has premium access
CREATE OR REPLACE FUNCTION public.is_premium()
RETURNS BOOLEAN AS $$
DECLARE
    is_premium_user BOOLEAN;
BEGIN
    SELECT role IN ('premium', 'admin') INTO is_premium_user
    FROM public.user_profiles
    WHERE id = auth.uid()
    LIMIT 1;
    RETURN COALESCE(is_premium_user, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update last login timestamp
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.user_profiles
    SET last_login_at = NOW()
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update last_login on auth.users update (via Supabase Auth)
-- Note: This would need to be connected to Supabase Auth hooks in practice