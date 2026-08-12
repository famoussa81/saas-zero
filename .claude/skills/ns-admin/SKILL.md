---
name: ns-admin
description: Panneau d'administration du SaaS — vue globale des users et abonnements, stats internes, gestion/résolution. Utiliser pour la partie "owner/SaaS" (vos coulisses).
---

# ns-admin — Le panneau d'administration

> L'endroit où LE owners du SaaS voit tout : users, abonnements, revenus, usage. Non visible des clients.

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

## Accès

- Route protégée réservée au(x) rôle(s) admin/owner (voir ns-auth : `is_admin()`, ou un rôle `admin`).
- Non indexée, non référencée dans la nav publique.
- Vérifie toujours `auth.uid()` + rôle en RLS / server action.

## Contenu

1. **Vue users** : liste (email, org, statut, plan), cherch/match, bannir/suspendre/supprimer.
2. **Vue abonnements** : plans actifs, MRR, churn, moyen de paiement, portail.
3. **Stats / analytics** : signups, MRR, activation, rétention (s'appuie sur ns-analytics).
4. **Actions** : forcer une sync Stripe, résoudre une erreur Sentry, envoyer un email.

## Implémentation

```ts
// app/[locale]/admin/layout  → vérifie le rôle admin
export default async function AdminLayout() {
  const supabase = createClient();
  const isAdmin = await isAdminUser(); // server check
  if (!isAdmin) return notFound();
  // ...
}
```

- Table `user_profiles` (B2C) a `role` admin ; en B2B on peut ajouter `admin` global dans les org OU
  un `user_roles` global. Simplest : un champ ou une table `admin_users` listant les uid admin.

## Sécurité

- Jamais exposé au public.
- Actions mutatives protégées par RLS + server action + vérification rôle.
- Log raisonnable des actions admin (table `admin_audit_log` on si besoin).

## Checklist de sortie

- [ ] Route admin protégée (rôle non-client)
- [ ] Vue users + abonnements + stats
- [ ] Action suspendre/résoudre (server action + RLS)
- [ ] Table d'admins (ou rôle admin) + audit
