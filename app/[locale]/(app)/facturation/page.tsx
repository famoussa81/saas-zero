import { createClient } from "@/lib/supabase/server";

// Page Facturation TaskFlow — plan + abonnement (Stripe). Placeholder simple
// tant que le checkout/portail n'est pas branché (voir skill ns-billing).

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
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

  const supabase = createClient();
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

  return (
    <div>
      <h1 className="text-2xl font-bold">Facturation</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Plan actuel :{" "}
          <span className="font-medium text-foreground">Gratuit</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Le paiement Stripe (abonnement + portail) sera branché ici via le
          skill ns-billing.
        </p>
      </div>
    </div>
  );
}
