import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/empty-state";
import { LayoutDashboard } from "lucide-react";

/**
 * Squelette de tableau de bord.
 *
 * Ce fichier fait partie du SOCLE : il est copié dans chaque projet généré par
 * `ns:new`. Il ne doit donc porter aucune métrique d'un domaine particulier.
 *
 * Sa version précédente comptait les `projects` et les `tasks` de la démo
 * TaskFlow — des tables supprimées du socle. Elle serait partie cassée dans
 * tous les projets clients.
 *
 * La phase Build de `/ns-ship` remplace cet état vide par les vraies métriques
 * du produit, définies en Discovery.
 */

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export default async function TableauDeBordPage() {
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase pour afficher tes données.
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
          Connecte-toi pour accéder à ton tableau de bord.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <div className="mt-6">
        <EmptyState
          variant="first-run"
          icon={<LayoutDashboard className="h-10 w-10" />}
          title="Aucune métrique pour le moment"
          description="Les indicateurs de ton produit s'afficheront ici. La phase Build de la pipeline les génère à partir des décisions prises en Discovery."
        />
      </div>
    </div>
  );
}
