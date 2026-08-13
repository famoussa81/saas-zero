---
name: ns-analytics
description: Analytics d'usage du SaaS — comment les users utilisent le produit, activation, rétention, funnels. Distinguer du marketing analytics (Plausible). Utiliser pour piloter le produit et la rétention.
---

# ns-analytics — Analytics d'usage produit

> Distinguer deux couches :
>
> - **Marketing** : Plausible, privacy-first, exempté de cookie banner (voir skill `seo-perf`).
> - **Produit** (ce skill) : ce que les users font DANS l'app (funnels, activation, rétention).

## Ce qu'on mesure (fungele produit)

- **Signups** → **activation** (% qui atteignent le premier valeur) → **retention** (qui revient).
- Événements clés : signup, onboarding_step, first_action, feature_used, upgrade, cancel.
- **Cohorte de rétention** : % de users actifs J+7/J+30 par cohorte d'inscription.
- Funnel de conversion (signup → paiement).

## Implémentation (nancoût)

Option légère : table `events` (scoped by org + RLS) + un agent côté serveur qui enregistre
les événements keyed (ou un client minimal).

```sql
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),  -- B2B
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,           -- 'signup' | 'onboarding.step.end' | 'first_action' ...
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- RLS: scoped par org (ou id), + aggregate pour admin
```

- Écrire les événements côté serveur (server actions / edge) pour fiabilité.
- Requêtes analytics : agréger les events (fonction RPC `get_retention_cohorts`, `get_funnel`).

## Tableau de bord analytics (admin)

- MRR, signups, activation rate, retention cohorts.
- Qui entre : progression d'un graphique (recharts) branché sur les vrais events.
- Permet de déclencher les séquences de rétention (voir ns-retention).

## Privacy

- Données agrégées, respect RGPD, pas de donnée personnelle inutile.
- Opt-out si nécessaire.

## Checklist de sortie

- [ ] Table events + RLS
- [ ] Événements clés enregistrés (signup, onboarding, first action, payment)
- [ ] Rétention par cohortes calculable
- [ ] Funnel (signup → activation → paiement) visible
- [ ] Données branchées sur les tokens / graphiques sombres
