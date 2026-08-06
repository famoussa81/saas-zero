// =============================================================================
// Health Check - Cloudflare Worker
// Verifies connectivity to Supabase, Stripe, and Brevo
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from './database.types';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  BREVO_API_KEY: string;
}

type SupabaseClientTyped = SupabaseClient<Database>;

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    supabase: ServiceCheck;
    stripe: ServiceCheck;
    brevo: ServiceCheck;
  };
  version: string;
}

interface ServiceCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency_ms: number;
  details?: Record<string, unknown>;
  error?: string;
}

// =============================================================================
// Configuration
// =============================================================================

const VERSION = '1.0.0';
const TIMEOUT_MS = 5000;
const BREVO_API_URL = 'https://api.brevo.com/v3/account';

// =============================================================================
// Main Worker Export
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/health' || path === '/') {
        return await handleHealthCheck(env);
      }

      if (path === '/health/live') {
        return await handleLivenessCheck();
      }

      if (path === '/health/ready') {
        return await handleReadinessCheck(env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Unhandled error in health-check worker:', error);
      return new Response(
        JSON.stringify({ status: 'unhealthy', error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  },
};

// =============================================================================
// Health Check Handlers
// =============================================================================

async function handleHealthCheck(env: Env): Promise<Response> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  // Run all checks in parallel
  const [supabaseCheck, stripeCheck, brevoCheck] = await Promise.all([
    checkSupabase(env),
    checkStripe(env),
    checkBrevo(env),
  ]);

  const checks = {
    supabase: supabaseCheck,
    stripe: stripeCheck,
    brevo: brevoCheck,
  };

  // Determine overall status
  const statuses = Object.values(checks).map(c => c.status);
  let overallStatus: HealthCheckResult['status'] = 'healthy';

  if (statuses.includes('unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp,
    checks,
    version: VERSION,
  };

  const httpStatus = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

  return new Response(JSON.stringify(result, null, 2), {
    status: httpStatus,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}

async function handleLivenessCheck(): Promise<Response> {
  // Simple liveness check - just confirms the worker is running
  return new Response(
    JSON.stringify({
      status: 'alive',
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

async function handleReadinessCheck(env: Env): Promise<Response> {
  // Readiness check - confirms all dependencies are available
  const [supabaseCheck, stripeCheck, brevoCheck] = await Promise.all([
    checkSupabase(env),
    checkStripe(env),
    checkBrevo(env),
  ]);

  const allHealthy = supabaseCheck.status === 'healthy' &&
                     stripeCheck.status === 'healthy' &&
                     brevoCheck.status === 'healthy';

  return new Response(
    JSON.stringify({
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: { supabase: supabaseCheck, stripe: stripeCheck, brevo: brevoCheck },
    }),
    {
      status: allHealthy ? 200 : 503,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

// =============================================================================
// Individual Service Checks
// =============================================================================

async function checkSupabase(env: Env): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Test database connectivity with a simple query
    const { data, error } = await supabase
      .from('app_config')
      .select('key')
      .limit(1);

    const latency = Date.now() - startTime;

    if (error) {
      return {
        status: 'unhealthy',
        latency_ms: latency,
        error: error.message,
        details: { code: error.code },
      };
    }

    // Also test auth connectivity
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({ perPage: 1 });

    if (authError) {
      return {
        status: 'degraded',
        latency_ms: latency,
        error: `Auth check failed: ${authError.message}`,
        details: { db: 'ok', auth: 'failed' },
      };
    }

    return {
      status: 'healthy',
      latency_ms: latency,
      details: {
        db: 'connected',
        auth: 'connected',
        sample_config_count: data?.length || 0,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    return {
      status: 'unhealthy',
      latency_ms: latency,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkStripe(env: Env): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    // Test Stripe connectivity by fetching account info
    const account = await stripe.accounts.retrieve();

    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency_ms: latency,
      details: {
        account_id: account.id,
        country: account.country,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Determine if it's a configuration issue vs connectivity issue
    const isConfigError = errorMessage.includes('Invalid API Key') ||
                          errorMessage.includes('Authentication') ||
                          errorMessage.includes('permission');

    return {
      status: isConfigError ? 'unhealthy' : 'degraded',
      latency_ms: latency,
      error: errorMessage,
      details: { type: isConfigError ? 'configuration' : 'connectivity' },
    };
  }
}

async function checkBrevo(env: Env): Promise<ServiceCheck> {
  const startTime = Date.now();

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'GET',
      headers: {
        'api-key': env.BREVO_API_KEY,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as Record<string, unknown>;
      return {
        status: 'unhealthy',
        latency_ms: latency,
        error: `Brevo API returned ${response.status}: ${errorData.message as string || response.statusText}`,
        details: { status_code: response.status },
      };
    }

    const data = await response.json() as {
      email?: string;
      firstName?: string;
      lastName?: string;
      companyName?: string;
      plan?: string;
    };

    return {
      status: 'healthy',
      latency_ms: latency,
      details: {
        email: data.email,
        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        company: data.companyName,
        plan: data.plan,
      },
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check for timeout
    const isTimeout = errorMessage.includes('timeout') || errorMessage.includes('Timeout');

    return {
      status: isTimeout ? 'degraded' : 'unhealthy',
      latency_ms: latency,
      error: errorMessage,
      details: { type: isTimeout ? 'timeout' : 'connectivity' },
    };
  }
}