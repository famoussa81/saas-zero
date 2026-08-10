import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { verifyWebhookSignature } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 },
    );
  }

  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(payload, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("stripe_webhook_events")
    .select("id, processed")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing?.processed) {
    return NextResponse.json({ received: true, skipped: true });
  }

  if (!existing) {
    await supabase.from("stripe_webhook_events").insert({
      stripe_event_id: event.id,
      event_type: event.type,
      payload: event as unknown as Record<string, unknown>,
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await syncSubscription(
          supabase,
          event.data.object as Stripe.Subscription,
        );
        break;
      default:
        break;
    }

    await supabase
      .from("stripe_webhook_events")
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq("stripe_event_id", event.id);
  } catch (error) {
    console.error(`Stripe webhook handler error (${event.type}):`, error);
    await supabase
      .from("stripe_webhook_events")
      .update({
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .eq("stripe_event_id", event.id);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  supabase: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  if (!customer) {
    console.warn(`No stripe_customers row for Stripe customer ${customerId}`);
    return;
  }

  const item = subscription.items.data[0];

  await supabase.from("stripe_subscriptions").upsert(
    {
      customer_id: customer.id,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: new Date(
        item.current_period_start * 1000,
      ).toISOString(),
      current_period_end: new Date(
        item.current_period_end * 1000,
      ).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    },
    { onConflict: "stripe_subscription_id" },
  );
}
