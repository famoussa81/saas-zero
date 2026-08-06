-- =============================================================================
-- Migration: 20260802000001_initial_schema.sql
-- Description: Common tables for both B2B and B2C architectures
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- STRIPE TABLES (Common for both B2B and B2C)
-- =============================================================================

-- Stripe Customers
CREATE TABLE public.stripe_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    stripe_customer_id TEXT NOT NULL UNIQUE,
    email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe Prices
CREATE TABLE public.stripe_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_price_id TEXT NOT NULL UNIQUE,
    stripe_product_id TEXT NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    currency TEXT NOT NULL DEFAULT 'usd',
    unit_amount BIGINT,
    type TEXT NOT NULL CHECK (type IN ('one_time', 'recurring')),
    interval TEXT CHECK (interval IN ('day', 'week', 'month', 'year')),
    interval_count INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe Subscriptions
CREATE TABLE public.stripe_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES public.stripe_customers(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT NOT NULL UNIQUE,
    stripe_price_id UUID REFERENCES public.stripe_prices(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('incomplete', 'incomplete_expired', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
    current_period_start TIMESTAMPTZ NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stripe Webhook Events (idempotency)
CREATE TABLE public.stripe_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    payload JSONB NOT NULL,
    error TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- EMAIL QUEUE (Common for both B2B and B2C)
-- =============================================================================

CREATE TABLE public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    to_name TEXT,
    from_email TEXT,
    from_name TEXT,
    subject TEXT NOT NULL,
    html_content TEXT,
    text_content TEXT,
    template_id TEXT,
    template_data JSONB DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed', 'cancelled')),
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    last_error TEXT,
    scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- USER PROFILES (Shared core - created ONCE, then extended by B2B or B2C)
-- =============================================================================
-- Le choix B2B vs B2C se fait à la création (voir ARCHITECTURE-CHOICE.md /ns-discovery) :
--  - migration *_b2b_schema ajoute organization_id (multi-tenant)
--  - migration *_b2c_schema ajoute role/status (utilisateur seul)
-- Cette table ne DOIT PAS être recréée en 02/03, seulement ALTER.

CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    timezone TEXT DEFAULT 'UTC',
    locale TEXT DEFAULT 'en',
    metadata JSONB DEFAULT '{}',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    onboarding_step TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Politiques de base (vues/insérées/modifiées par le propriétaire)
CREATE POLICY "Users can view own profile"
    ON public.user_profiles
    FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.user_profiles
    FOR INSERT
    WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.user_profiles
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

CREATE INDEX idx_user_profiles_id ON public.user_profiles(id);

-- =============================================================================
-- APP CONFIG (Common for both B2B and B2C)
-- =============================================================================

CREATE TABLE public.app_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Stripe Customers
CREATE INDEX idx_stripe_customers_user_id ON public.stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_customer_id ON public.stripe_customers(stripe_customer_id);

-- Stripe Prices
CREATE INDEX idx_stripe_prices_stripe_product_id ON public.stripe_prices(stripe_product_id);
CREATE INDEX idx_stripe_prices_active ON public.stripe_prices(active);

-- Stripe Subscriptions
CREATE INDEX idx_stripe_subscriptions_customer_id ON public.stripe_subscriptions(customer_id);
CREATE INDEX idx_stripe_subscriptions_stripe_subscription_id ON public.stripe_subscriptions(stripe_subscription_id);
CREATE INDEX idx_stripe_subscriptions_status ON public.stripe_subscriptions(status);

-- Stripe Webhook Events
CREATE INDEX idx_stripe_webhook_events_stripe_event_id ON public.stripe_webhook_events(stripe_event_id);
CREATE INDEX idx_stripe_webhook_events_processed ON public.stripe_webhook_events(processed);

-- Email Queue
CREATE INDEX idx_email_queue_status ON public.email_queue(status);
CREATE INDEX idx_email_queue_scheduled_for ON public.email_queue(scheduled_for);
CREATE INDEX idx_email_queue_to_email ON public.email_queue(to_email);

-- App Config
CREATE INDEX idx_app_config_key ON public.app_config(key);
CREATE INDEX idx_app_config_is_public ON public.app_config(is_public);

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_updated_at_stripe_customers
    BEFORE UPDATE ON public.stripe_customers
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_stripe_prices
    BEFORE UPDATE ON public.stripe_prices
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_stripe_subscriptions
    BEFORE UPDATE ON public.stripe_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_email_queue
    BEFORE UPDATE ON public.email_queue
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_app_config
    BEFORE UPDATE ON public.app_config
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) - COMMON TABLES
-- =============================================================================

-- Enable RLS on all common tables
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- stripe_customers: Users can only see their own customer record
CREATE POLICY "Users can view their own stripe customer"
    ON public.stripe_customers
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stripe customer"
    ON public.stripe_customers
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stripe customer"
    ON public.stripe_customers
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- stripe_prices: Public read access for active prices
CREATE POLICY "Anyone can view active prices"
    ON public.stripe_prices
    FOR SELECT
    USING (active = TRUE);

-- stripe_subscriptions: Users can only see their own subscriptions
CREATE POLICY "Users can view their own subscriptions"
    ON public.stripe_subscriptions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.stripe_customers sc
            WHERE sc.id = stripe_subscriptions.customer_id
            AND sc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own subscriptions"
    ON public.stripe_subscriptions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stripe_customers sc
            WHERE sc.id = stripe_subscriptions.customer_id
            AND sc.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own subscriptions"
    ON public.stripe_subscriptions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.stripe_customers sc
            WHERE sc.id = stripe_subscriptions.customer_id
            AND sc.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stripe_customers sc
            WHERE sc.id = stripe_subscriptions.customer_id
            AND sc.user_id = auth.uid()
        )
    );

-- stripe_webhook_events: Only service role can access (processed via edge functions)
CREATE POLICY "Service role full access to webhook events"
    ON public.stripe_webhook_events
    FOR ALL
    USING (auth.role() = 'service_role');

-- email_queue: Users can view their own emails, service role can manage all
CREATE POLICY "Users can view their own emails"
    ON public.email_queue
    FOR SELECT
    USING (to_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Service role full access to email queue"
    ON public.email_queue
    FOR ALL
    USING (auth.role() = 'service_role');

-- app_config: Public configs readable by all, private only by service role
CREATE POLICY "Anyone can view public configs"
    ON public.app_config
    FOR SELECT
    USING (is_public = TRUE);

CREATE POLICY "Service role full access to app config"
    ON public.app_config
    FOR ALL
    USING (auth.role() = 'service_role');

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user's stripe customer id
CREATE OR REPLACE FUNCTION public.get_my_stripe_customer_id()
RETURNS UUID AS $$
DECLARE
    customer_id UUID;
BEGIN
    SELECT id INTO customer_id
    FROM public.stripe_customers
    WHERE user_id = auth.uid()
    LIMIT 1;
    RETURN customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription()
RETURNS BOOLEAN AS $$
DECLARE
    has_sub BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.stripe_subscriptions ss
        JOIN public.stripe_customers sc ON sc.id = ss.customer_id
        WHERE sc.user_id = auth.uid()
        AND ss.status IN ('active', 'trialing')
        AND ss.current_period_end > NOW()
    ) INTO has_sub;
    RETURN has_sub;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;