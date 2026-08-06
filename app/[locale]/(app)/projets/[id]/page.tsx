import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Détail projet TaskFlow — tableau kanban par statut (todo / in_progress / review / done).

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

const COLUMNS = [
  { key: "todo", label: "À faire" },
  { key: "in_progress", label: "En cours" },
  { key: "review", label: "En revue" },
  { key: "done", label: "Terminé" },
] as const;

type Status = (typeof COLUMNS)[number]["key"];

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: Props) {
  const resolvedParams = await params;

  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Projet</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase pour voir le tableau du projet.
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
        <h1 className="text-2xl font-bold">Projet</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir le projet.
        </p>
      </div>
    );
  }

  // Charger le projet + ses tâches (RLS : uniquement si membre de l'org).
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, organization_id")
    .eq("id", resolvedParams.id)
    .single();

  if (!project) {
    notFound();
  }

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, status, assignee_id")
    .eq("project_id", resolvedParams.id)
    .order("position", { ascending: true });

  const tasksByStatus = new Map<string, { id: string; title: string }[]>();
  for (const c of COLUMNS) tasksByStatus.set(c.key, []);
  for (const t of (tasks ?? []) as {
    id: string;
    title: string;
    status: Status;
  }[]) {
    const col = tasksByStatus.get(t.status);
    if (col) col.push(t);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {COLUMNS.map((col) => {
          const items = tasksByStatus.get(col.key) ?? [];
          return (
            <div
              key={col.key}
              className="rounded-xl border border-border bg-muted/30 p-3"
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-sm font-semibold">{col.label}</span>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                  {items.length}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-lg border border-border bg-card p-3 text-sm"
                  >
                    {t.title}
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="px-1 text-xs text-muted-foreground">
                    Aucune tâche
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
