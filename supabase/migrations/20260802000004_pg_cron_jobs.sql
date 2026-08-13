-- =============================================================================
-- Migration: 20260802000004_pg_cron_jobs.sql
-- Description: pg_cron jobs for scheduled maintenance tasks
-- =============================================================================

-- Enable pg_cron extension (requires superuser, run manually in Supabase Dashboard)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- =============================================================================
-- PG_CRON JOBS FOR SCHEDULED MAINTENANCE
-- =============================================================================

-- Note: pg_cron must be enabled in Supabase Dashboard > Database > Extensions
-- These jobs use service_role key via Supabase Edge Functions or direct SQL

-- =============================================================================
-- 1. HEALTH CHECK - Every 5 minutes
-- =============================================================================
-- pg_cron_guard : la planification ne s'exécute que si l'extension est là.
--
-- pg_cron demande les droits superutilisateur et n'est PAS activé par défaut
-- sur un projet Supabase. Sans cette garde, la migration échoue sur
--   ERROR: schema "cron" does not exist (SQLSTATE 3F000)
-- et bloque toutes les migrations suivantes, dont le schéma boutique.
--
-- Pour activer : Dashboard > Database > Extensions > pg_cron, puis rejouer
-- cette migration. Sans elle, le produit fonctionne — seules les tâches
-- planifiées de maintenance sont absentes.
DO $pg_cron_guard$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.schedule(
        'health-check-every-5min',
        '*/5 * * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/health-check',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "health-check"}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 2. USAGE METRICS AGGREGATION - Every hour
    -- =============================================================================
    PERFORM cron.schedule(
        'usage-metrics-hourly',
        '0 * * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/aggregate-usage',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "usage-metrics", "window": "1h"}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 3. TRIAL ENDING REMINDERS - Daily at 9 AM
    -- Sends reminders at 3 days, 1 day, and day of trial end
    -- =============================================================================
    PERFORM cron.schedule(
        'trial-ending-reminders-daily-9am',
        '0 9 * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/trial-ending-reminders',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "trial-ending-reminders", "days": [3, 1, 0]}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 4. CHURN ANALYSIS - Weekly on Monday at 6 AM
    -- =============================================================================
    PERFORM cron.schedule(
        'churn-analysis-weekly-monday-6am',
        '0 6 * * 1',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/churn-analysis',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "churn-analysis", "window": "7d"}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 5. EMAIL QUEUE PROCESSING - Every minute
    -- =============================================================================
    PERFORM cron.schedule(
        'email-queue-every-minute',
        '* * * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/process-email-queue',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "process-email-queue", "batch_size": 50}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 6. STALE INVITE CLEANUP - Daily at 2 AM
    -- Removes expired organization invites
    -- =============================================================================
    PERFORM cron.schedule(
        'stale-invite-cleanup-daily-2am',
        '0 2 * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/cleanup-stale-invites',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "cleanup-stale-invites", "expired_hours": 72}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 7. SUBSCRIPTION STATUS SYNC - Every 15 minutes
    -- Syncs Stripe subscription status with Supabase
    -- =============================================================================
    PERFORM cron.schedule(
        'subscription-sync-every-15min',
        '*/15 * * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/sync-subscriptions',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "subscription-sync"}'::jsonb
        );
        $$
    );

    -- =============================================================================
    -- 8. USAGE LIMIT ENFORCEMENT - Every 30 minutes
    -- Checks and enforces usage limits for all organizations
    -- =============================================================================
    PERFORM cron.schedule(
        'usage-limit-enforcement-every-30min',
        '*/30 * * * *',
        $$
        SELECT net.http_post(
            url := 'https://your-project.supabase.co/functions/v1/enforce-usage-limits',
            headers := jsonb_build_object(
                'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
                'Content-Type', 'application/json'
            ),
            body := '{"source": "pg_cron", "job": "enforce-usage-limits"}'::jsonb
        );
        $$
    );
  ELSE
    RAISE NOTICE 'pg_cron absent : taches planifiees ignorees. Activer l''extension puis rejouer cette migration.';
  END IF;
END
$pg_cron_guard$;

-- =============================================================================
-- JOB MANAGEMENT QUERIES
-- =============================================================================

-- View all scheduled jobs
-- SELECT * FROM cron.job ORDER BY schedule;

-- View job run history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('job-name');

-- =============================================================================
-- EDGE FUNCTION ENDPOINTS THAT THESE JOBS CALL
-- =============================================================================
-- These must be deployed as Supabase Edge Functions:
--
-- 1. /functions/v1/health-check
--    - Checks: Supabase connectivity, Stripe API, Brevo API
--    - Returns: { status: 'healthy'|'degraded'|'unhealthy', checks: {...} }
--
-- 2. /functions/v1/aggregate-usage
--    - Aggregates hourly usage metrics per organization
--    - Stores in usage_metrics table
--
-- 3. /functions/v1/trial-ending-reminders
--    - Finds orgs with trial ending in 3, 1, 0 days
--    - Sends reminder emails via Brevo
--
-- 4. /functions/v1/churn-analysis
--    - Analyzes cancellations, downgrades, engagement drops
--    - Stores in churn_metrics table, alerts if threshold exceeded
--
-- 5. /functions/v1/process-email-queue
--    - Processes pending emails from email_queue table
--    - Sends via Brevo API, handles retries
--
-- 6. /functions/v1/cleanup-stale-invites
--    - Removes organization_invites older than expired_hours
--    - Marks as 'expired' status
--
-- 7. /functions/v1/sync-subscriptions
--    - Syncs Stripe subscription status to Supabase
--    - Handles: created, updated, deleted, trial_will_end
--
-- 8. /functions/v1/enforce-usage-limits
--    - Checks org usage against plan limits
--    - Disables features/alerts if exceeded
--    - Sends notification emails

-- =============================================================================
-- SETUP INSTRUCTIONS
-- =============================================================================
--
-- 1. Enable pg_cron in Supabase Dashboard:
--    - Go to Database > Extensions
--    - Search for "pg_cron" and enable it
--
-- 2. Set service_role_key as a database setting:
--    ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
--    (Or use Supabase Vault for secrets)
--
-- 3. Deploy Edge Functions:
--    supabase functions deploy health-check
--    supabase functions deploy aggregate-usage
--    supabase functions deploy trial-ending-reminders
--    supabase functions deploy churn-analysis
--    supabase functions deploy process-email-queue
--    supabase functions deploy cleanup-stale-invites
--    supabase functions deploy sync-subscriptions
--    supabase functions deploy enforce-usage-limits
--
-- 4. Verify jobs are scheduled:
--    SELECT * FROM cron.job ORDER BY schedule;
--
-- 5. Monitor job runs:
--    SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 50;
--
-- 6. To unschedule a job:
--    SELECT cron.unschedule('job-name');
--
-- 7. To view job run details:
--    SELECT * FROM cron.job_run_details WHERE job_name = 'health-check-every-5min' ORDER BY start_time DESC LIMIT 10;