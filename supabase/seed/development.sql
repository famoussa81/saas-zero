-- =============================================================================
-- Seed: development.sql
-- Description: Development seed data for local testing
-- Run with: supabase db seed
-- =============================================================================

-- =============================================================================
-- APP CONFIG (Common)
-- =============================================================================

INSERT INTO public.app_config (key, value, description, is_public) VALUES
    ('app_name', '"ZeroRisk SaaS"', 'Application name', TRUE),
    ('app_url', '"http://localhost:3000"', 'Application URL', TRUE),
    ('api_url', '"http://localhost:3001"', 'API URL', TRUE),
    ('stripe_publishable_key', '"pk_test_..."', 'Stripe publishable key', TRUE),
    ('email_from', '"noreply@zerorisk.dev"', 'Default from email', FALSE),
    ('email_provider', '"brevo"', 'Email provider', FALSE),
    ('max_file_size_mb', '10', 'Maximum file upload size in MB', TRUE),
    ('allowed_file_types', '["image/png", "image/jpeg", "application/pdf"]', 'Allowed file types', TRUE),
    ('maintenance_mode', 'false', 'Maintenance mode flag', TRUE),
    ('signup_enabled', 'true', 'Allow new signups', TRUE)
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    description = EXCLUDED.description,
    is_public = EXCLUDED.is_public,
    updated_at = NOW();

-- =============================================================================
-- STRIPE PRICES (Common - Sample prices for testing)
-- =============================================================================

INSERT INTO public.stripe_prices (stripe_price_id, stripe_product_id, active, currency, unit_amount, type, interval, interval_count, metadata) VALUES
    ('price_test_monthly_basic', 'prod_test_basic', TRUE, 'usd', 999, 'recurring', 'month', 1, '{"tier": "basic", "features": ["feature1", "feature2"]}'),
    ('price_test_monthly_pro', 'prod_test_pro', TRUE, 'usd', 2999, 'recurring', 'month', 1, '{"tier": "pro", "features": ["feature1", "feature2", "feature3", "feature4"]}'),
    ('price_test_yearly_basic', 'prod_test_basic', TRUE, 'usd', 9999, 'recurring', 'year', 1, '{"tier": "basic", "features": ["feature1", "feature2"], "discount": "20%"}'),
    ('price_test_yearly_pro', 'prod_test_pro', TRUE, 'usd', 29999, 'recurring', 'year', 1, '{"tier": "pro", "features": ["feature1", "feature2", "feature3", "feature4"], "discount": "20%"}'),
    ('price_test_onetime_setup', 'prod_test_setup', TRUE, 'usd', 4999, 'one_time', NULL, NULL, '{"type": "setup_fee"}')
ON CONFLICT (stripe_price_id) DO UPDATE SET
    active = EXCLUDED.active,
    updated_at = NOW();

-- =============================================================================
-- B2B SEED DATA (Organizations, Members, Invites)
-- Only runs if B2B migration (20260802000002) has been applied
-- =============================================================================

DO $$
BEGIN
    -- Check if B2B tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'organizations') THEN
        
        -- Create test organization
        INSERT INTO public.organizations (id, name, slug, description, billing_email, settings) VALUES
            ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Acme Corporation', 'acme-corp', 'Test organization for development', 'billing@acme.test', '{"theme": "dark", "notifications": true}')
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = NOW();

        -- Create test organization 2
        INSERT INTO public.organizations (id, name, slug, description, billing_email, settings) VALUES
            ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Globex Inc', 'globex-inc', 'Another test organization', 'billing@globex.test', '{"theme": "light", "notifications": false}')
        ON CONFLICT (slug) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = NOW();

    END IF;
END $$;

-- =============================================================================
-- USER PROFILES SEED DATA
-- Note: These reference auth.users which must exist first
-- In development, users are created via Supabase Auth signup
-- This seed provides profile data for known test users
-- =============================================================================

-- Test user profiles will be created when users sign up via auth
-- The profile is typically created via a database trigger on auth.users insert
-- This is just reference data for known test accounts

-- =============================================================================
-- EMAIL QUEUE SAMPLES (for testing email templates)
-- =============================================================================

INSERT INTO public.email_queue (to_email, to_name, subject, html_content, text_content, template_id, template_data, status) VALUES
    ('test@example.com', 'Test User', 'Welcome to ZeroRisk SaaS', '<h1>Welcome!</h1><p>Thanks for joining us.</p>', 'Welcome!\n\nThanks for joining us.', 'welcome', '{"user_name": "Test User"}', 'pending'),
    ('admin@example.com', 'Admin User', 'New Organization Created', '<h1>New Organization</h1><p>Acme Corporation has been created.</p>', 'New Organization\n\nAcme Corporation has been created.', 'org_created', '{"org_name": "Acme Corporation"}', 'pending');

-- =============================================================================
-- DEVELOPMENT HELPERS
-- =============================================================================

-- Function to create a test user with profile (for manual testing)
-- Usage: SELECT create_test_user('test@example.com', 'Test User', 'password123');
CREATE OR REPLACE FUNCTION public.create_test_user(
    p_email TEXT,
    p_full_name TEXT,
    p_password TEXT,
    p_role TEXT DEFAULT 'user'
) RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- This would normally be done via Supabase Auth API
    -- This function is a placeholder for documentation
    RAISE NOTICE 'Use Supabase Auth API to create users: supabase.auth.signUp({email: %, password: %})', p_email, p_password;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old webhook events (run periodically)
CREATE OR REPLACE FUNCTION public.cleanup_webhook_events()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.stripe_webhook_events
    WHERE processed = TRUE
    AND processed_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up old email queue entries
CREATE OR REPLACE FUNCTION public.cleanup_email_queue()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.email_queue
    WHERE status IN ('sent', 'failed', 'cancelled')
    AND created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;