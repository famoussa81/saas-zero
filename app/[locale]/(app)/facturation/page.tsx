import { createClient } from "@/lib/supabase/server";
import { PLANS, getPlanByPriceId } from "@/lib/stripe";
import { startCheckout, openBillingPortal } from "@/lib/actions/billing";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

async function handleCheckout(formData: FormData) {
  "use server";
  const result = await startCheckout(formData);
  if (result.success && result.url) {
    redirect(result.url);
  }
}

async function handlePortal() {
  "use server";
  const result = await openBillingPortal();
  if (result.success && result.url) {
    redirect(result.url);
  }
}

export default async function FacturationPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase + Stripe pour gérer ton abonnement.
        </p>
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir ta facturation.
        </p>
      </div>
    );
  }

  const { data: customer } = await supabase
    .from("stripe_customers")
    .select("id, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let currentPlan = PLANS.free;
  let hasActiveSubscription = false;

  if (customer) {
    const { data: subscription } = await supabase
      .from("stripe_subscriptions")
      .select("status, stripe_price_id, stripe_prices(stripe_price_id)")
      .eq("customer_id", customer.id)
      .in("status", ["active", "trialing", "past_due"])
      .maybeSingle();

    if (subscription) {
      hasActiveSubscription = true;
      const priceId = (
        subscription.stripe_prices as { stripe_price_id?: string } | null
      )?.stripe_price_id;
      currentPlan = priceId
        ? (getPlanByPriceId(priceId) ?? PLANS.free)
        : PLANS.free;
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Facturation</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Plan actuel :{" "}
          <span className="font-medium text-foreground">
            {currentPlan.name}
          </span>
        </p>

        {hasActiveSubscription ? (
          <form action={handlePortal} className="mt-4">
            <Button type="submit">Gérer mon abonnement</Button>
          </form>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {(["starter", "pro", "enterprise"] as const).map((key) => {
              const plan = PLANS[key];
              return (
                <form key={key} action={handleCheckout}>
                  <input type="hidden" name="plan" value={key} />
                  <div className="rounded-lg border border-border p-4">
                    <p className="font-medium">{plan.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.price}$/mois
                    </p>
                    <Button type="submit" className="mt-3 w-full">
                      Choisir {plan.name}
                    </Button>
                  </div>
                </form>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
