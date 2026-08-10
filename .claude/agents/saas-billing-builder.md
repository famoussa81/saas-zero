---
name: saas-billing-builder
description: Stripe billing complet — pricing, checkout, portal, webhooks, subscription sync, usage metering, emails Brevo.
---

# Agent: `saas-billing-builder`

> **Rôle** : Stripe billing complet — pricing, checkout, portal, webhooks, subscription sync, usage metering, Brevo emails.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)$(cat ARCHITECTURE-CHOICE.md)"
```

---

## Responsabilités

### 1. `lib/stripe.ts` — Core Library

```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-04-10",
  typescript: true,
});

// Products & Prices (synced from Stripe Dashboard)
export async function getProducts(): Promise<Stripe.Product[]>;
export async function getPrices(productId: string): Promise<Stripe.Price[]>;

// Checkout Sessions
export async function createCheckoutSession(params: {
  orgId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  trialDays?: number;
}): Promise<Stripe.Checkout.Session>;

// Portal Sessions
export async function createPortalSession(params: {
  orgId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session>;

// Webhook Verification
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): Stripe.Event;
```

### 2. Pricing Page (`app/[locale]/(marketing)/pricing/page.tsx`)

**Structure** :

- Toggle Mensuel/Annuel (badge -20% annuel)
- 3 Tiers : Free, Pro, Enterprise
- Feature comparison table (checkmarks)
- CTA buttons → `/api/billing/checkout`

**Data Source** : `lib/stripe.ts` → `getProducts()` + `getPrices()` (cached)

### 3. Checkout Flow

```
User clicks "Commencer" on Pro/Enterprise
    ↓
POST /api/billing/checkout { priceId, orgId }
    ↓
Server Action → stripe.checkout.sessions.create()
    ↓
Redirect to Stripe Checkout (stripe.redirectToCheckout)
    ↓
User pays → Stripe redirects to /facturation/succes?session_id=xxx
    ↓
Webhook: checkout.session.completed → create subscription record
    ↓
Email: invoice.paid → Brevo receipt
```

**API Route** : `app/[locale]/api/billing/checkout/route.ts`

```typescript
export async function POST(request: Request) {
  const { priceId, orgId } = await request.json();
  const session = await createCheckoutSession({
    orgId,
    priceId,
    successUrl: `${url}/facturation/succes`,
    cancelUrl: `${url}/pricing`,
  });
  return Response.json({ url: session.url });
}
```

### 4. Success / Cancel Pages

| Page    | Route                 | Description                                         |
| ------- | --------------------- | --------------------------------------------------- |
| Success | `/facturation/succes` | Sync subscription, show confirmation, email receipt |
| Cancel  | `/facturation/annule` | Message "Paiement annulé", link back to pricing     |

### 5. Customer Portal

**API Route** : `app/[locale]/api/billing/portal/route.ts`

```typescript
export async function POST(request: Request) {
  const { orgId } = await request.json();
  const session = await createPortalSession({
    orgId,
    returnUrl: `${url}/facturation`,
  });
  return Response.json({ url: session.url });
}
```

### 6. Webhook Handler (`workers/stripe-webhook.ts`)

```typescript
import { verifyWebhookSignature } from "@/lib/stripe";
import {
  handleSubscriptionCreated,
  handleInvoicePaid,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handlePaymentMethodAttached,
} from "@/lib/billing/webhook-handlers";

export default async function handler(request: Request) {
  const signature = request.headers.get("stripe-signature")!;
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = verifyWebhookSignature(payload, signature);
  } catch (err) {
    return new Response("Invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleSubscriptionCreated(
        event.data.object as Stripe.Checkout.Session,
      );
      break;
    case "invoice.paid":
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
    case "customer.subscription.updated":
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
      break;
    case "payment_method.attached":
      await handlePaymentMethodAttached(
        event.data.object as Stripe.PaymentMethod,
      );
      break;
  }

  return new Response("OK", { status: 200 });
}
```

### 7. Webhook Handlers (`lib/billing/webhook-handlers.ts`)

```typescript
// checkout.session.completed
export async function handleSubscriptionCreated(
  session: Stripe.Checkout.Session,
) {
  const orgId = session.metadata?.orgId;
  const subscriptionId = session.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  await supabase.from("subscriptions").upsert({
    org_id: orgId,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    current_period_end: new Date(
      subscription.current_period_end * 1000,
    ).toISOString(),
  });

  // Email welcome/pro subscription
  await sendBrevoEmail("subscription_activated", {
    orgId,
    plan: subscription.items.data[0].price.nickname,
  });
}

// invoice.paid
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const orgId = subscription.metadata?.orgId;

  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
    })
    .eq("stripe_subscription_id", subscriptionId);

  // Email receipt
  await sendBrevoEmail("invoice_receipt", {
    orgId,
    invoiceUrl: invoice.hosted_invoice_url,
  });
}

// customer.subscription.updated
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
) {
  await supabase
    .from("subscriptions")
    .update({
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      current_period_end: new Date(
        subscription.current_period_end * 1000,
      ).toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);

  // Email plan change
  if (subscription.status === "past_due") {
    await sendBrevoEmail("payment_failed", {
      orgId: subscription.metadata?.orgId,
    });
  }
}

// customer.subscription.deleted
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
) {
  await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      price_id: null,
    })
    .eq("stripe_subscription_id", subscription.id);

  // Email cancellation
  await sendBrevoEmail("subscription_canceled", {
    orgId: subscription.metadata?.orgId,
  });
}

// payment_method.attached
export async function handlePaymentMethodAttached(
  paymentMethod: Stripe.PaymentMethod,
) {
  // Update default payment method on customer
  await stripe.customers.update(paymentMethod.customer as string, {
    invoice_settings: { default_payment_method: paymentMethod.id },
  });
}
```

### 8. Subscription Sync (Cron / Manual)

```typescript
// lib/stripe/sync-subscriptions.ts (Cron — Vercel Cron ou server action manuelle)
export default async function handler() {
  const subscriptions = await stripe.subscriptions.list({ limit: 100 });

  for (const sub of subscriptions.data) {
    await supabase.from("subscriptions").upsert({
      org_id: sub.metadata.orgId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.items.data[0].price.id,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    });
  }
}
```

### 9. Billing Page (`app/(app)/facturation/page.tsx`)

**Sections** :

- Plan actuel (badge Free/Pro/Enterprise)
- Usage métriques (si usage-based v2)
- Factures historiques (table + download PDF)
- Bouton "Gérer l'abonnement" → Portal
- Bouton "Changer de plan" → Pricing

### 10. Brevo Email Integration

**Templates** (créer dans Brevo Dashboard) :

| Template ID              | Nom               | Variables                      |
| ------------------------ | ----------------- | ------------------------------ |
| `welcome`                | Bienvenue         | `firstName`, `loginUrl`        |
| `invoice_receipt`        | Reçu facture      | `invoiceUrl`, `amount`, `date` |
| `subscription_activated` | Abonnement activé | `planName`, `billingCycle`     |
| `payment_failed`         | Échec paiement    | `retryUrl`, `dueDate`          |
| `subscription_canceled`  | Abonnement annulé | `planName`, `endDate`          |

**Helper** : `lib/brevo/billing.ts`

```typescript
import { createClient } from "@sendinblue/client";

const brevo = createClient({ apiKey: process.env.BREVO_API_KEY! });

export async function sendBillingEmail(
  templateId: string,
  to: string,
  params: Record<string, any>,
) {
  await brevo.sendTransacEmail({
    templateId: parseInt(templateId),
    to: [{ email: to }],
    params,
  });
}
```

---

## Migration DB (Subscriptions Table)

```sql
-- supabase/migrations/20240101000003_billing.sql
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null check (status in ('trialing','active','past_due','canceled','incomplete','incomplete_expired','paused')),
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_subscriptions_org_id on subscriptions(org_id);
create index idx_subscriptions_stripe_sub_id on subscriptions(stripe_subscription_id);
create index idx_subscriptions_status on subscriptions(status);

-- RLS
alter table subscriptions enable row level security;

create policy "sub_select" on subscriptions
  for select using (
    org_id in (select org_id from org_members where user_id = auth.uid() and role in ('owner','admin'))
  );
```

---

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Brevo (pour emails billing)
BREVO_API_KEY=xkeysib-...
BREVO_TEMPLATE_INVOICE_RECEIPT_ID=1
BREVO_TEMPLATE_SUB_ACTIVATED_ID=2
BREVO_TEMPLATE_PAYMENT_FAILED_ID=3
BREVO_TEMPLATE_SUB_CANCELED_ID=4
```

---

## Gate Billing (Phase 4 Build)

- ✓ `lib/stripe.ts` complet avec types
- ✓ Pricing page fonctionnelle (3 tiers, toggle mensuel/annuel)
- ✓ Checkout flow : pricing → checkout → success → webhook → DB sync
- ✓ Portal flow : billing page → portal → return
- ✓ Webhook handler : 5 events gérés + signature verification
- ✓ Migration subscriptions + RLS + indexes
- ✓ Brevo emails : invoice receipt, activation, failed, canceled
- ✓ Unit tests sur webhook handlers
- ✓ E2E test : full checkout flow

---

## Patterns Obligatoires

### Webhook Signature Verification

```typescript
// JAMAIS faire confiance au payload sans vérifier la signature
const event = verifyWebhookSignature(payload, signature);
```

### Idempotency

```typescript
// Webhooks peuvent être redélivrés → upsert avec stripe_subscription_id unique
await supabase.from('subscriptions').upsert({ ... }, { onConflict: 'stripe_subscription_id' })
```

### Server-Side Only

```typescript
// STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET → Server Actions / Route Handlers UNIQUEMENT
// Jamais dans composants client
```

### Error Handling

```typescript
try {
  await stripe.checkout.sessions.create(...)
} catch (err) {
  if (err instanceof Stripe.errors.StripeError) {
    // Log structured error
    return { success: false, error: err.message }
  }
  throw err
}
```

---

## Checklist Qualité

- [ ] `pnpm typecheck` — 0 erreurs
- [ ] `pnpm lint` — 0 warnings
- [ ] Webhook signature verification obligatoire
- [ ] Idempotency sur tous les webhook handlers
- [ ] Secrets Stripe/Brevo uniquement côté serveur
- [ ] RLS sur table subscriptions
- [ ] Emails Brevo via templates (pas inline HTML)
- [ ] Unit tests webhook handlers (mock Stripe events)
- [ ] E2E test checkout complet
