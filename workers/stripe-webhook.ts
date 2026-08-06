// =============================================================================
// Stripe Webhook Handler - Cloudflare Worker
// Handles Stripe webhook events with idempotency and signature verification
// =============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// =============================================================================
// Types & Interfaces
// =============================================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

// =============================================================================
// Event Handlers
// =============================================================================

type EventHandler = (event: Stripe.Event, supabase: SupabaseClient) => Promise<void>;

const eventHandlers: Record<string, EventHandler> = {
  'customer.created': handleCustomerCreated,
  'customer.updated': handleCustomerUpdated,
  'customer.deleted': handleCustomerDeleted,
  'customer.subscription.created': handleSubscriptionCreated,
  'customer.subscription.updated': handleSubscriptionUpdated,
  'customer.subscription.deleted': handleSubscriptionDeleted,
  'invoice.payment_succeeded': handleInvoicePaymentSucceeded,
  'invoice.payment_failed': handleInvoicePaymentFailed,
  'checkout.session.completed': handleCheckoutSessionCompleted,
  'payment_intent.succeeded': handlePaymentIntentSucceeded,
  'payment_intent.payment_failed': handlePaymentIntentFailed,
};

// =============================================================================
// Main Worker Export
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Initialize Supabase client with service role
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Initialize Stripe
    const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    });

    try {
      // Get raw body for signature verification
      const body = await request.text();
      const signature = request.headers.get('stripe-signature');

      if (!signature) {
        console.error('Missing stripe-signature header');
        return new Response('Missing stripe-signature header', { status: 400 });
      }

      // Verify webhook signature
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error('Webhook signature verification failed:', err);
        return new Response('Webhook signature verification failed', { status: 400 });
      }

      // Check idempotency - has this event already been processed?
      const { data: existingEvent, error: checkError } = await supabase
        .from('stripe_webhook_events')
        .select('id, processed')
        .eq('stripe_event_id', event.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new events
        console.error('Error checking idempotency:', checkError);
        return new Response('Internal server error', { status: 500 });
      }

      if (existingEvent) {
        if (existingEvent.processed) {
          console.log(`Event ${event.id} already processed, skipping`);
          return new Response('OK', { status: 200 });
        }
        // Event exists but not processed - continue processing
        console.log(`Event ${event.id} exists but not processed, processing now`);
      }

      // Insert or update webhook event record
      const { error: upsertError } = await supabase
        .from('stripe_webhook_events')
        .upsert({
          stripe_event_id: event.id,
          event_type: event.type,
          processed: false,
          payload: event.data.object,
          error: null,
        }, {
          onConflict: 'stripe_event_id',
        });

      if (upsertError) {
        console.error('Error upserting webhook event:', upsertError);
        return new Response('Internal server error', { status: 500 });
      }

      // Process the event
      try {
        const handler = eventHandlers[event.type];
        if (handler) {
          await handler(event, supabase);
        } else {
          console.log(`No handler for event type: ${event.type}`);
        }

        // Mark as processed
        const { error: updateError } = await supabase
          .from('stripe_webhook_events')
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
          })
          .eq('stripe_event_id', event.id);

        if (updateError) {
          console.error('Error marking event as processed:', updateError);
        }

        return new Response('OK', { status: 200 });
      } catch (processError) {
        console.error(`Error processing event ${event.id}:`, processError);

        // Mark event as failed with error
        await supabase
          .from('stripe_webhook_events')
          .update({
            processed: false,
            error: processError instanceof Error ? processError.message : 'Unknown error',
          })
          .eq('stripe_event_id', event.id);

        return new Response('Event processing failed', { status: 500 });
      }
    } catch (error) {
      console.error('Unhandled error in webhook handler:', error);
      return new Response('Internal server error', { status: 500 });
    }
  },
};

// =============================================================================
// Event Handler Implementations
// =============================================================================

async function handleCustomerCreated(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  console.log(`Processing customer.created: ${customer.id}`);

  // Find user by email if metadata has user_id
  const userId = customer.metadata?.user_id;

  if (userId) {
    const { error } = await supabase
      .from('stripe_customers')
      .upsert({
        user_id: userId,
        stripe_customer_id: customer.id,
        email: customer.email,
        metadata: customer.metadata,
      }, {
        onConflict: 'stripe_customer_id',
      });

    if (error) {
      console.error('Error upserting stripe_customer:', error);
      throw error;
    }
  }
}

async function handleCustomerUpdated(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  console.log(`Processing customer.updated: ${customer.id}`);

  const { error } = await supabase
    .from('stripe_customers')
    .update({
      email: customer.email,
      metadata: customer.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);

  if (error) {
    console.error('Error updating stripe_customer:', error);
    throw error;
  }
}

async function handleCustomerDeleted(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const customer = event.data.object as Stripe.Customer;
  console.log(`Processing customer.deleted: ${customer.id}`);

  const { error } = await supabase
    .from('stripe_customers')
    .delete()
    .eq('stripe_customer_id', customer.id);

  if (error) {
    console.error('Error deleting stripe_customer:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Processing customer.subscription.created: ${subscription.id}`);

  // Get customer to find our internal customer_id
  const { data: customerRecord, error: customerError } = await supabase
    .from('stripe_customers')
    .select('id')
    .eq('stripe_customer_id', subscription.customer as string)
    .single();

  if (customerError || !customerRecord) {
    console.error('Customer not found for subscription:', subscription.customer);
    return;
  }

  // Get price info
  const priceId = subscription.items.data[0]?.price.id;
  const { data: priceRecord } = await supabase
    .from('stripe_prices')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();

  const { error } = await supabase
    .from('stripe_subscriptions')
    .upsert({
      customer_id: customerRecord.id,
      stripe_subscription_id: subscription.id,
      stripe_price_id: priceRecord?.id || null,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      metadata: subscription.metadata,
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting stripe_subscription:', error);
    throw error;
  }
}

async function handleSubscriptionUpdated(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Processing customer.subscription.updated: ${subscription.id}`);

  const priceId = subscription.items.data[0]?.price.id;
  const { data: priceRecord } = await supabase
    .from('stripe_prices')
    .select('id')
    .eq('stripe_price_id', priceId)
    .single();

  const { error } = await supabase
    .from('stripe_subscriptions')
    .update({
      stripe_price_id: priceRecord?.id || null,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating stripe_subscription:', error);
    throw error;
  }
}

async function handleSubscriptionDeleted(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const subscription = event.data.object as Stripe.Subscription;
  console.log(`Processing customer.subscription.deleted: ${subscription.id}`);

  const { error } = await supabase
    .from('stripe_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating stripe_subscription on delete:', error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`Processing invoice.payment_succeeded: ${invoice.id}`);
}

async function handleInvoicePaymentFailed(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const invoice = event.data.object as Stripe.Invoice;
  console.log(`Processing invoice.payment_failed: ${invoice.id}`);
}

async function handleCheckoutSessionCompleted(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const session = event.data.object as Stripe.Checkout.Session;
  console.log(`Processing checkout.session.completed: ${session.id}`);

  if (session.mode === 'subscription' && session.subscription) {
    console.log('Subscription checkout completed, subscription will be created via separate webhook');
  }
}

async function handlePaymentIntentSucceeded(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(`Processing payment_intent.succeeded: ${paymentIntent.id}`);
}

async function handlePaymentIntentFailed(event: Stripe.Event, supabase: SupabaseClient): Promise<void> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  console.log(`Processing payment_intent.payment_failed: ${paymentIntent.id}`);
}