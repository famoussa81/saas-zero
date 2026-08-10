import { createClient } from "@/lib/supabase/server";

// Tableau de bord TaskFlow — stats réelles des projets/tâches de l'utilisateur.
// Gère proprement le cas "Supabase non configuré" (dev sans credentials).

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export default async function DashboardPage() {
  // Pas encore de credentials Supabase → on affiche un état d'invitation propre.
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Bienvenue sur TaskFlow. Connecte Supabase (depuis .env.local) pour
          voir tes projets et tâches ici.
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
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir tes projets.
        </p>
      </div>
    );
  }

  // Récupérer l'org de l'utilisateur (B2B) + stats projets/tâches.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single();

  const orgId = profile?.organization_id as string | undefined;

  let projects = 0;
  let tasksTodo = 0;
  let tasksDone = 0;

  if (orgId) {
    const [p, t] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact" })
        .eq("organization_id", orgId),
      supabase
        .from("tasks")
        .select("status", { count: "exact" })
        .eq("organization_id", orgId),
    ]);
    projects = p.count ?? 0;
    const tasks = t.data ?? [];
    tasksTodo = tasks.filter(
      (x: { status: string }) => x.status !== "done",
    ).length;
    tasksDone = tasks.filter(
      (x: { status: string }) => x.status === "done",
    ).length;
  }

  const cards = [
    { label: "Projets", value: projects },
    { label: "Tâches en cours", value: tasksTodo },
    { label: "Tâches terminées", value: tasksDone },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-5"
          >
            <div className="text-sm text-muted-foreground">{c.label}</div>
            <div className="mt-1 text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
