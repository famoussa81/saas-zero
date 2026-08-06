# Correspondance — Skills NowStack (Melvynx) → Notre socle `ns-*`

> Les skills NowStack sont PAYANTS et basés sur Convex. On les **recrée en gratuit** sur Next.js
>
> - Supabase, nommés `ns-<fonction>`. Ce doc mappe chaque skill NowStack → notre équivalent,
>   ou signale "À créer" s'il manque.

## Setup & Configuration

| NowStack (payant) | Rôle                                          | Notre équivalent `ns-*`                         | Statut                             |
| ----------------- | --------------------------------------------- | ----------------------------------------------- | ---------------------------------- |
| NS Setup Project  | Initialiser le produit réel depuis le starter | `ns-scaffold` (commande) + saas-core-builder    | ✅ couvert                         |
| NS Setup R2       | Storage R2 scoped                             | Supabase Storage → à ajouter dans `ns-scaffold` | 🟡 adapter (R2 → Supabase Storage) |
| NS Setup Admin    | accès admin de confiance                      | `ns-admin`                                      | ✅ couvert                         |
| NS Setup Check    | valider config déterministiquement            | `ns-quality-gates` (gate:rls, gate:typecheck)   | ✅ couvert                         |
| NS Setup Email    | configurer + prouver délivrabilité email      | `ns-retention` (email)                          | ✅ couvert                         |
| NS Setup OAuth    | configurer clients OAuth                      | `ns-auth` (OAuth)                               | ✅ couvert                         |
| NS Setup Tools    | diagnostiquer la toolchain de dev             | **ns-doctor** (à créer)                         | 🆕 à créer                         |
| NS Setup Stripe   | configurer + vérifier billing                 | `ns-billing`                                    | ✅ couvert                         |

## Développement & Documentation

| NS Plan/Docs   | Rôle                                          | Notre équivalent                                | Statut      |
| -------------- | --------------------------------------------- | ----------------------------------------------- | ----------- |
| NS Quickstart  | guider un clone frais → produit local vérifié | **ns-quickstart** (à créer)                     | 🆕 à créer  |
| NS Build Docs  | docs produit canonique                        | **ns-docs** (à créer)                           | 🆕 à créer  |
| NS Build Brand | système d'assets produit cohérent             | `ns-design-system` (partiellement, à compléter) | 🟡 enrichir |
| NS Build Tests | coverage unit + e2e                           | `ns-quality-gates` (gate:test, gate:e2e)        | ✅ couvert  |
| NS Optimize    | optimiser state/data flow/perf                | **ns-optimize** (à créer)                       | 🆕 à créer  |

## Conception & Planning

| NowStack           | Rôle                            | Notre équivalent                                   | Statut     |
| ------------------ | ------------------------------- | -------------------------------------------------- | ---------- |
| NS Plan Product    | idée → plan produit exécutable  | `ns-discovery` (SPEC.md) + saas-project-compliance | ✅ couvert |
| NS Plan Onboarding | design onboarding via discovery | `ns-onboarding`                                    | ✅ couvert |

## Déploiement & Publication

| NowStack        | Rôle                                    | Notre équivalent              | Statut     |
| --------------- | --------------------------------------- | ----------------------------- | ---------- |
| NS Ship Deploy  | déployer avec gates de prod             | `ns-deploy` (commande .sh)    | ✅ couvert |
| NS Check Launch | verdict readiness launch                | **ns-check-launch** (à créer) | 🆕 à créer |
| NS Ship Release | préparer + publier une release vérifiée | **ns-release** (à créer)      | 🆕 à créer |

## Execution & Validation

| NowStack    | Rôle                                          | Notre équivalent                                   | Statut     |
| ----------- | --------------------------------------------- | -------------------------------------------------- | ---------- |
| APEX / Apex | implémenter avec review adversariale + checks | `ns-reviewer` (agent) + `/ns-review` + fail-closed | ✅ couvert |

---

## Résumé — ce qui manque à créer (5 skills)

1. `ns-quickstart` — clone frais → produit local vérifié (guide pas-à-pas)
2. `ns-docs` — documentation produit canonique
3. `ns-optimize` — optimiser state/data flow/performance
4. `ns-check-launch` — verdict de readiness launch (evidence-backed)
5. `ns-release` — release vérifiée (version, changelog, tag)
6. `ns-doctor` — diagnostiquer la toolchain (env : supabase, wrangler, Claude Code/Codex)

→ **Bonus** : on par là en gratuit, avec l'avantage Next.js + Supabase + la beauté de ship-flow.
→ Notre `ns-reviewer` (adversarial) et notre fail-closed DEPASSE déjà APEX sur le coté isolation.

Voir [[nowstack-skill-list-complete]] et [[vision-pipeline-unifiee]].
