#!/usr/bin/env node
/**
 * Stripe Webhook Check - Quality Gate Script
 * Validates that webhook handler covers all required Stripe events + idempotency
 * 
 * Exit codes:
 *   0 = pass (all required events handled, idempotency implemented)
 *   1 = fail (missing events or no idempotency)
 *   2 = not installed (dependencies missing or handler not found)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Required Stripe webhook events for a typical SaaS
const REQUIRED_EVENTS = [
  // Customer lifecycle
  'customer.created',
  'customer.updated',
  'customer.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'customer.subscription.trial_will_end',
  
  // Payment lifecycle
  'invoice.created',
  'invoice.finalized',
  'invoice.paid',
  'invoice.payment_failed',
  'invoice.payment_action_required',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'payment_intent.requires_action',
  'charge.succeeded',
  'charge.failed',
  'charge.refunded',
  'charge.dispute.created',
  
  // Checkout
  'checkout.session.completed',
  'checkout.session.expired',
  
  // Billing portal
  'billing_portal.session.created',
];

// Optional but recommended events
const RECOMMENDED_EVENTS = [
  'customer.source.created',
  'customer.source.updated',
  'customer.source.deleted',
  'setup_intent.created',
  'setup_intent.succeeded',
  'setup_intent.setup_failed',
];

function findWebhookHandler() {
  const searchPaths = [
    'src/app/api/stripe/webhook',
    'src/app/api/webhooks/stripe',
    'src/pages/api/stripe/webhook',
    'src/pages/api/webhooks/stripe',
    'app/api/stripe/webhook',
    'app/api/webhooks/stripe',
    'api/stripe/webhook',
    'api/webhooks/stripe',
    'functions/stripe/webhook',
    'netlify/functions/stripe-webhook',
    'supabase/functions/stripe-webhook',
  ];
  
  for (const searchPath of searchPaths) {
    const fullPath = join(process.cwd(), searchPath);
    if (existsSync(fullPath)) {
      const files = readdirSync(fullPath);
      const handlerFile = files.find(f => 
        f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx')
      );
      if (handlerFile) {
        return join(fullPath, handlerFile);
      }
    }
  }
  
  // Fallback: search for files containing stripe webhook
  const allFiles = findAllTSFiles(process.cwd());
  for (const file of allFiles) {
    try {
      const content = readFileSync(file, 'utf-8');
      if (content.includes('stripe') && content.includes('webhook') && 
          (content.includes('constructEvent') || content.includes('signing_secret') || content.includes('STRIPE_WEBHOOK_SECRET'))) {
        return file;
      }
    } catch {}
  }
  
  return null;
}

function findAllTSFiles(dir, files = []) {
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.vercel', 'coverage', '.turbo'];
  const items = readdirSync(dir);
  
  for (const item of items) {
    const fullPath = join(dir, item);
    if (ignoreDirs.some(d => fullPath.includes(`/${d}/`) || fullPath.endsWith(`/${d}`))) continue;
    
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      findAllTSFiles(fullPath, files);
    } else if (['.ts', '.tsx', '.js', '.jsx'].includes(extname(item))) {
      files.push(fullPath);
    }
  }
  return files;
}

function checkIdempotency(content) {
  const checks = {
    hasEventIdempotencyKey: false,
    hasIdempotencyStorage: false,
    hasDuplicateCheck: false,
    implementation: []
  };
  
  // Check for idempotency key extraction
  if (content.includes('event.id') || content.includes('event.data.object.id') || content.match(/idempotenc(y|yKey)/i)) {
    checks.hasEventIdempotencyKey = true;
    checks.implementation.push('Uses event ID for idempotency');
  }
  
  // Check for storage (Redis, database, in-memory)
  if (content.includes('redis') || content.includes('kv') || content.includes('supabase') || 
      content.includes('prisma') || content.includes('drizzle') || content.includes('Map') ||
      content.includes('Set') || content.includes('idempotency') || content.match(/processed.*event/i)) {
    checks.hasIdempotencyStorage = true;
    checks.implementation.push('Has storage for processed events');
  }
  
  // Check for duplicate detection
  if (content.includes('already processed') || content.includes('duplicate') || 
      content.includes('exists') || content.match(/if.*processed/i) || content.match(/has.*been.*processed/i)) {
    checks.hasDuplicateCheck = true;
    checks.implementation.push('Checks for duplicate events');
  }
  
  return checks;
}

function checkEventHandlers(content) {
  const foundEvents = new Set();
  const missingRequired = [];
  const missingRecommended = [];
  
  // Find event type handling - various patterns
  const eventPatterns = [
    /event\.type\s*===?\s*['"`]([^'"`]+)['"`]/g,
    /switch\s*\(\s*event\.type\s*\)[\s\S]*?case\s+['"`]([^'"`]+)['"`]/g,
    /case\s+['"`]([^'"`]+)['"`]\s*:/g,
    /['"`]([a-z_]+\.[a-z_]+)['"`]/g,
    /handle\w*\([^)]*['"`]([^'"`]+)['"`]/g,
    /on\w*\([^)]*['"`]([^'"`]+)['"`]/g,
  ];
  
  for (const pattern of eventPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const eventType = match[1];
      if (eventType.includes('.')) {
        foundEvents.add(eventType);
      }
    }
  }
  
  // Check required events
  for (const reqEvent of REQUIRED_EVENTS) {
    if (!foundEvents.has(reqEvent)) {
      missingRequired.push(reqEvent);
    }
  }
  
  // Check recommended events
  for (const recEvent of RECOMMENDED_EVENTS) {
    if (!foundEvents.has(recEvent)) {
      missingRecommended.push(recEvent);
    }
  }
  
  return { foundEvents: Array.from(foundEvents), missingRequired, missingRecommended };
}

async function main() {
  console.log('🔍 Stripe Webhook Quality Check\n');
  
  const handlerPath = findWebhookHandler();
  
  if (!handlerPath) {
    console.log('❌ No Stripe webhook handler found.');
    console.log('   Searched in common locations:');
    console.log('   - src/app/api/stripe/webhook');
    console.log('   - src/app/api/webhooks/stripe');
    console.log('   - src/pages/api/stripe/webhook');
    console.log('   - app/api/stripe/webhook');
    console.log('   - api/stripe/webhook');
    console.log('   - functions/stripe/webhook');
    console.log('   - netlify/functions/stripe-webhook');
    console.log('   - supabase/functions/stripe-webhook');
    console.log('\n   Create a webhook handler or ensure it\'s in a discoverable location.');
    process.exit(2);
  }
  
  console.log(`📄 Found webhook handler: ${relative(process.cwd(), handlerPath)}\n`);
  
  const content = readFileSync(handlerPath, 'utf-8');
  
  // Check event coverage
  const eventCheck = checkEventHandlers(content);
  console.log(`📊 Event Coverage: ${eventCheck.foundEvents.length} event types handled`);
  console.log(`   Found: ${eventCheck.foundEvents.join(', ') || 'none'}\n`);
  
  if (eventCheck.missingRequired.length > 0) {
    console.log(`❌ Missing REQUIRED events (${eventCheck.missingRequired.length}):`);
    for (const evt of eventCheck.missingRequired) {
      console.log(`   - ${evt}`);
    }
    console.log('');
  } else {
    console.log('✅ All REQUIRED events are handled\n');
  }
  
  if (eventCheck.missingRecommended.length > 0) {
    console.log(`⚠️  Missing RECOMMENDED events (${eventCheck.missingRecommended.length}):`);
    for (const evt of eventCheck.missingRecommended) {
      console.log(`   - ${evt}`);
    }
    console.log('');
  }
  
  // Check idempotency
  console.log('🔐 Idempotency Check:');
  const idempotency = checkIdempotency(content);
  
  if (idempotency.hasEventIdempotencyKey) {
    console.log('   ✅ Extracts event identifier for idempotency');
  } else {
    console.log('   ❌ No event identifier extraction found');
  }
  
  if (idempotency.hasIdempotencyStorage) {
    console.log('   ✅ Has storage mechanism for processed events');
  } else {
    console.log('   ❌ No storage mechanism for idempotency (Redis, DB, etc.)');
  }
  
  if (idempotency.hasDuplicateCheck) {
    console.log('   ✅ Checks for duplicate events before processing');
  } else {
    console.log('   ❌ No duplicate event detection');
  }
  
  console.log('');
  
  // Determine exit code
  const hasRequiredMissing = eventCheck.missingRequired.length > 0;
  const hasIdempotencyIssues = !idempotency.hasEventIdempotencyKey || !idempotency.hasIdempotencyStorage || !idempotency.hasDuplicateCheck;
  
  if (hasRequiredMissing || hasIdempotencyIssues) {
    console.log('❌ Quality gate FAILED');
    if (hasRequiredMissing) {
      console.log(`   - Add handlers for ${eventCheck.missingRequired.length} required event(s)`);
    }
    if (hasIdempotencyIssues) {
      console.log('   - Implement idempotency: extract event ID, store processed events, check duplicates');
    }
    process.exit(1);
  }
  
  console.log('✅ Quality gate PASSED - All required events handled with idempotency');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error running Stripe webhook check:', err.message);
  process.exit(2);
});