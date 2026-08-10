-- =============================================================================
-- RLS enablement tests — every table must have Row Level Security enabled.
-- Uses pgTAP (installed by the Supabase local stack). Run via: supabase test db
-- =============================================================================

BEGIN;

SELECT plan(16);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.user_profiles'::regclass),
  'user_profiles has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stripe_customers'::regclass),
  'stripe_customers has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stripe_prices'::regclass),
  'stripe_prices has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stripe_subscriptions'::regclass),
  'stripe_subscriptions has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.stripe_webhook_events'::regclass),
  'stripe_webhook_events has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.email_queue'::regclass),
  'email_queue has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.app_config'::regclass),
  'app_config has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.organizations'::regclass),
  'organizations has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.organization_members'::regclass),
  'organization_members has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.organization_invites'::regclass),
  'organization_invites has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.contact_submissions'::regclass),
  'contact_submissions has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.newsletter_subscriptions'::regclass),
  'newsletter_subscriptions has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.projects'::regclass),
  'projects has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.tasks'::regclass),
  'tasks has RLS enabled'
);

SELECT ok(
  (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.task_comments'::regclass),
  'task_comments has RLS enabled'
);

-- Sanity: every table in the public schema that exists in the migration set
-- must have RLS. This catches any future table created without enabling RLS.
SELECT ok(
  NOT EXISTS (
    SELECT 1
    FROM pg_tables t
    WHERE t.schemaname = 'public'
      AND t.tablename NOT IN (
        'user_profiles', 'stripe_customers', 'stripe_prices',
        'stripe_subscriptions', 'stripe_webhook_events', 'email_queue',
        'app_config', 'organizations', 'organization_members',
        'organization_invites', 'contact_submissions',
        'newsletter_subscriptions', 'projects', 'tasks', 'task_comments'
      )
  ),
  'no unexpected tables exist without a known baseline'
);

SELECT * FROM finish();

ROLLBACK;
