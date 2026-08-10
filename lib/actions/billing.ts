"use server";

import { createClient } from "@/lib/supabase/server";
import {
  PLANS,
  createCheckoutSession,
  createPortalSession,
  getOrCreateCustomer,
} from "@/lib/stripe";
import { z } from "zod";

const planKeySchema = z.enum(["starter", "pro", "enterprise"]);

export async function startCheckout(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { success: false, error: "Non authentifié" };
  }

  const parsed = planKeySchema.safeParse(formData.get("plan"));
  if (!parsed.success) {
    return { success: false, error: "Plan invalide" };
  }

  const plan = PLANS[parsed.data];
  if (!plan.stripePriceId) {
    return { success: false, error: "Ce plan n'a pas de price Stripe" };
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const customer = await getOrCreateCustomer({
    userId: user.id,
    email: user.email,
    name: profile?.full_name ?? undefined,
  });

  await supabase.from("stripe_customers").upsert(
    {
      user_id: user.id,
      stripe_customer_id: customer.id,
      email: user.email,
    },
    { onConflict: "stripe_customer_id" },
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await createCheckoutSession({
    customerId: customer.id,
    priceId: plan.stripePriceId,
    successUrl: `${appUrl}/fr/facturation?checkout=success`,
    cancelUrl: `${appUrl}/fr/facturation?checkout=canceled`,
    metadata: { userId: user.id },
  });

  if (!session.url) {
    return { success: false, error: "Impossible de créer la session Stripe" };
  }

  return { success: true, url: session.url };
}

export async function openBillingPortal() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Non authentifié" };
  }

  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer) {
    return { success: false, error: "Aucun abonnement Stripe trouvé" };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const session = await createPortalSession({
    customerId: customer.stripe_customer_id,
    returnUrl: `${appUrl}/fr/facturation`,
  });

  return { success: true, url: session.url };
}
