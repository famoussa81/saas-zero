---
name: ns-billing
description: Monétisation Stripe pour un SaaS — page tarifs, checkout, abonnement, customer portal, webhooks, quotas. Utiliser pour la partie "facturation" du SaaS.
---

# ns-billing — Monétisation Stripe

> La partie qui transforme un visiteur en client payant. Stripe = subscriptions + checkout + portal + webhooks.
>
> 📌 **Skill officiel à référencer** : `stripe/stripe-best-practices` (registre VoltAgent/awesome-agent-skills)
> et `stripe/upgrade-stripe` — à charger pour ne pas réinventer les bonnes pratiques Stripe.

## Architecture

```
Pricing page → /api/billing/checkout (CRÉER la session de paiement)
            → provider Stripe → redirect user vers checkout
            → user paie → webhook 'checkout.session.completed'
            → on record l'abonnement dans subscriptions + email
Portail : /api/billing/portal → session de gestion (annuler/changer)
Webhook : handlers sur events Stripe (workers/stripe-webhook.ts)
```

## Lib (lib/stripe.ts)

```ts
import Stripe from "stripe";
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function createCheckout(customerId: string, priceId: string) {
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/facturation/succes?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/facturation/annule`,
  });
}

export async function createPortal(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/facturation`,
  });
}
```

## Webhooks (workers/stripe-webhook.ts)

Événements à gérer (avec vérification de signature `Stripe.webhooks.constructEvent`) :

- `checkout.session.completed` → créer l'abonnement
- `invoice.paid` → MAJ subscription + email reçu
- `customer.subscription.updated` → sync status/plan/période
- `customer.subscription.deleted` → annuler, passer à free
- `payment_method.attached` → MAJ moyen de paiement

Stockage (idempotent) : table `stripe_webhook_events` (event_id UNIQUE, processed).
Table miroir : `stripe_subscriptions`, `stripe_customers`, `stripe_prices`

## Page tarifs

3 tiers (Free / Pro / Entreprise), toggle mensuel/annuel (badge -20 %), tableau de comparaison.
Choix du plan → "S'abonner" → `/api/billing/checkout`.
Limites selon plan → `quota` stocké en DB, vérifié avant usage (voir quotas below).

## Quotas & rétention

- **Quotas** : colonne/table `usage` par org ; `get_my_limits()` selon le plan actif.
- **Factures/reçus** : historique depuis Stripe (via portal ou `stripe.invoices.list`).
- **Upgrade/Downgrade** : via portal ou nouvelle checkout session.

## Env Requises

```env
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Checklist de sortie

- [ ] Page tarifs (3 plans, toggle mensuel/annuel)
- [ ] Checkout → abonnement créé (webhook)
- [ ] Customer portal opérationnel
- [ ] Webhooks vérifiés (signature) + idempotents
- [ ] Quotas en place
- [ ] Factures accessibles
- [ ] Tests E2E paiement (voir ns-qa / charge-sentry load-test)
