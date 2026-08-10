import { createClient } from "@/lib/supabase/server";

// Page Équipe TaskFlow — membres de l'organisation (B2B). Placeholder simple
// tant que les server actions d'invitation ne sont pas branchées.

function hasSupabaseConfig(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  if (url.includes("placeholder.supabase.co")) return false;
  if (key.startsWith("placeholder-")) return false;
  return true;
}

export default async function EquipePage() {
  if (!hasSupabaseConfig()) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte Supabase pour gérer les membres de ton organisation.
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
        <h1 className="text-2xl font-bold">Équipe</h1>
        <p className="mt-2 text-muted-foreground">
          Connecte-toi pour voir ton équipe.
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

  let members: { email: string; role: string }[] = [];
  if (orgId) {
    const { data } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", orgId);
    members = (data ?? []).map((m) => ({ email: "", role: m.role }));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Équipe</h1>
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">
          {orgId
            ? "Membres de l'organisation"
            : "Rejoins une organisation pour voir les membres."}
        </p>
        {orgId && (
          <ul className="mt-4 space-y-2">
            {members.map((m, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span className="text-sm font-medium">
                  {m.email || "Membre"}
                </span>
                <span className="text-xs text-muted-foreground">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
