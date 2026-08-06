---
name: ns-dashboard
description: L'app produit protégée — layout (app), tableau de bord avec stats réelles, pages (tableau de bord, équipe, réglages, facturation, clés API). Utiliser pour le cœur de l'app après login.
---

# ns-dashboard — L'app produit (zone protégée)

> Layout `(app)` protégé par le middleware. C'est là que l'utilisateur "reste" : habitude, valeur, onboarding.

## Structure de routes (Next App Router)

```
app/[locale]/app/  (ou (app))
    tableau-de-bord/   → stats clés
    equipe/            → membres + invitations + rôles
    reglages/          → profil, notifications, sécurité (MFA/sessions), suppression compte
    facturation/       → plan, usage, factures, portal Stripe
    cles-api/          → CRUD API keys (si le SaaS en expose)
```

## Layout (app)

- **Sidebar** responsive (drawer mobile) : nav principale + org switcher (B2B).
- **Header** : user menu (avatar, nom, déconnexion), notifications.
- **Loading/Error boundaries** par route (`loading.tsx`, `error.tsx`).

## Dashboard avec stats réelles

> Pas de mock v1 permanent : de vraies données de la fonction produit + metrics utiles.
> Si certains chiffres n'existent pas encore, empty-states jolis, pas de fausses valeurs.

```tsx
// RSC serveur — fetch des stats
export default async function DashboardPage() {
  const supabase = createClient()
  const { data: stats } = await supabase.rpc("get_dashboard_stats") // selon produit
  return <StatsGrid items={...} />
}
```

- KPI : MRR, users, churn, activité (selon le SaaS) — branchées sur la vraie data.
- Graphiques : `recharts` + dark mode tokens.

## Empty states & onboarding

- Première visite → seele state "wow" : expliquer la valeur + CTA "Configurer" (→ ns-onboarding).
- Ne pas laisser un dashboard vide sans guide.

## Server actions / mutations

`createOrg`, `inviteMember`, `updateRole`, `createApiKey`, `updateProfile`…
→ validation Zod + RLS (voir ns-auth, ns-organizations).

## Checklist de sortie

- [ ] Middleware protège `/app`
- [ ] Layout sidebar + header + org switcher + user menu
- [ ] Dashboard avec stats réelles (pas de mock éternel)
- [ ] Loading/error boundaries par route
- [ ] Empty states avec parcours d'action
