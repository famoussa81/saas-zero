import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// Page Projets TaskFlow — liste les projets de l'utilisateur (B2B, scoped org).
// Gère le cas "Supabase non configuré" proprement.

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export default async function ProjetsPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Projets</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase pour créer et voir tes projets ici.
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
        <h1 className="text-2xl font-bold">Projets</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir tes projets.
        </p>
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id as string | undefined;

  let projects: { id: string; name: string; color: string | null }[] = [];
  if (orgId) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, color")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false });
    projects = (data ?? []) as {
      id: string;
      name: string;
      color: string | null;
    }[];
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projets</h1>
        <Link
          href="#nouveau-projet"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Nouveau projet
        </Link>
      </div>

      {projects.length === 0 ? (
        <p className="mt-6 text-muted-foreground">
          Aucun projet pour l&apos;instant. Crée ton premier projet pour
          commencer.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projets/${p.id}`}
              className="block rounded-xl border border-border bg-card p-5 transition-colors hover:bg-accent/50"
            >
              <div
                className="mb-3 h-1.5 w-10 rounded-full"
                style={{ backgroundColor: p.color || "var(--color-primary)" }}
              />
              <div className="font-semibold">{p.name}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
