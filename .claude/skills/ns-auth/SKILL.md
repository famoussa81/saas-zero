---
name: ns-auth
description: Comptes et authentification pour un SaaS — email+password, magic link, OAuth, MFA, sessions. Utiliser pour la partie "comptes" du SaaS.
---

# ns-auth — Authentification & comptes

> Supabase Auth + Next.js App Router avec SSR (cookies). RLS obligatoire partout.
>
> 📌 **Skills officiels à référencer** : `better-auth/create-auth`, `organization`, `twoFactor`,
> `providers` (registre VoltAgent/awesome-agent-skills) — inspirer les patterns d'auth bien rodés.

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 21 primitives Radix + CVA déjà là. Ne pas les réécrire (et ne jamais en créer dans `components/ui/`).
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Architecture

```
app/[locale]/connexion · inscription · mot-de-passe-oublie
    → lib/supabase/client.ts (createBrowserClient)
    → lib/supabase/server.ts   (createServerClient, SSR)
    → middleware.ts             (auth + cookie refresh + routes protégées)
```

## Client + serveur (SSR)

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // cookie refresh dans un composant serveur (middleware/route) — ok
          }
        },
      },
    },
  );
}
```

## Middleware de protection

```ts
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  const isAuthPage = ["/connexion", "/inscription", "/mot-de-passe-oublie"].some(p => request.nextUrl.pathname.includes(p))
  const isProtected = request.nextUrl.pathname.startsWith("/app") // (app) protégé

  if (isProtected && !user) return redirect("/connexion?next=" + pathname)
  if (isAuthPage && user) return redirect("/app/tableau-de-bord")
  return await updateSession(request)
}
```

## Types d'authentification à couvrir

| Type             | Config Supabase                                     | Rendu                                          |
| ---------------- | --------------------------------------------------- | ---------------------------------------------- |
| Email + password | `signUp` / `signInWithPassword`                     | formulaires connexion/inscription              |
| Magic link       | `signInWithOtp({ email, options })`                 | envoi email avec lien                          |
| OAuth            | `signInWithOAuth({ provider: 'google'\|'github' })` | boutons Google/GitHub (redirection configurée) |
| MFA TOTP         | `supabase.auth.mfa`                                 | setup QR + verify + recovery codes             |
| Reset            | `resetPasswordForEmail` + nouveau mot de passe      | formulaire "mot de passe oublié"               |

## RLS = non négociable

Chaque table liée à un utilisateur a une policy `auth.uid() = user_id` (voir ns-organizations pour B2B).
**Jamais de `service_role` en client** — côté serveur/Worker seulement.

## Sessions

- Gérer le refresh : `supabase.auth.onAuthStateChange` + récupérer.
- Sessions actives : les lister/délever (table dédiée ou via `listSessions`).
- Culture : après MFA setup, proposer des recovery codes.

## Checklist de sortie

- [ ] Inscription/connexion (email+pwd) ✓
- [ ] Magic link / OAuth selon le choix
- [ ] Middleware protège `/app`
- [ ] `user_profiles` créé après signup (trigger ou hook) + RLS
- [ ] MFA si activé
- [ ] Tests E2E du préflight auth (voir ns-qa / ns-load-test)
