import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Client Stripe paresseux.
 *
 * La version précédente construisait le client À L'IMPORT, avec
 * `new Stripe(secretKey || "")`. Ce module étant importé par les pages
 * facturation et tarifs, `next build` échouait dès qu'aucune
 * `STRIPE_SECRET_KEY` n'était présente — c'est-à-dire sur tout clone frais :
 *
 *     Error: Failed to collect page data for /[locale]/facturation
 *
 * Le client n'est désormais créé qu'au premier appel réel. Importer `PLANS`
 * ou lire un tarif ne déclenche plus rien, et l'absence de clé produit une
 * erreur explicite au moment de l'appel plutôt qu'un build cassé.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY manquante — appel Stripe impossible");
  }
  _stripe = new Stripe(secretKey, {
    apiVersion: "2026-07-29.dahlia",
  });
  return _stripe;
}

export interface Plan {
  name: string;
  stripePriceId: string | null;
  priceId: string | null;
  price: number;
  features: string[];
  limits: {
    projects: number;
    members: number;
    storage: number;
  };
}

function plan(
  name: string,
  stripePriceId: string | null,
  price: number,
  features: string[],
  limits: Plan["limits"],
): Plan {
  return {
    name,
    stripePriceId,
    priceId: stripePriceId,
    price,
    features,
    limits,
  };
}

export const PLANS: Record<"free" | "starter" | "pro" | "enterprise", Plan> = {
  free: plan("Free", null, 0, ["1 projet", "Auth", "Communauté"], {
    projects: 1,
    members: 1,
    storage: 1,
  }),
  starter: plan(
    "Starter",
    process.env.STRIPE_PRICE_STARTER_MONTHLY || "price_starter_default",
    19,
    ["5 projets", "5 membres", "Support email"],
    { projects: 5, members: 5, storage: 10 },
  ),
  pro: plan(
    "Pro",
    process.env.STRIPE_PRICE_PRO_MONTHLY || "price_pro_default",
    49,
    ["Projets illimités", "20 membres", "Support prioritaire"],
    { projects: -1, members: 20, storage: 100 },
  ),
  enterprise: plan(
    "Enterprise",
    process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || "price_enterprise_default",
    199,
    ["Projets illimités", "Membres illimités", "SSO", "Support dédié"],
    { projects: -1, members: -1, storage: -1 },
  ),
};

export function getPlanByPriceId(priceId: string): Plan | null {
  if (!priceId) return null;
  return Object.values(PLANS).find((p) => p.stripePriceId === priceId) ?? null;
}

export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata,
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  return getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: "required",
    tax_id_collection: { enabled: true },
  });
}

export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  return getStripe().billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

export async function getOrCreateCustomer({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}): Promise<Stripe.Customer> {
  const existing = await getStripe().customers.list({ email, limit: 1 });
  if (existing.data.length > 0) {
    return existing.data[0];
  }
  return getStripe().customers.create({
    email,
    name,
    metadata: { userId },
  });
}

export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string,
): Stripe.Event {
  return getStripe().webhooks.constructEvent(payload, signature, secret);
}
