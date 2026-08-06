import { createClient } from "@/lib/supabase/server";

// Page Réglages TaskFlow — profil + sécurité. Simple placeholder cohérent.

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export default async function ReglagesPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase pour gérer ton profil et ta sécurité.
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
        <h1 className="text-2xl font-bold">Réglages</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir tes réglages.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Réglages</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          Profil, sessions et sécurité seront gérés ici (via le skill ns-auth).
        </p>
      </div>
    </div>
  );
}
