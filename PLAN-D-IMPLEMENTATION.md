# 🗺️ GRAND PLAN D'IMPLEMENTATION — Pipeline `/ship` SaaS "Union parfaite"

> **Document vivant** : c'est le contrat de ce qu'on construit. Mis à jour à chaque décision.
> Dernière mise à jour : 2026-08-06.

---

## 0. La vision en une phrase

Construire une **pipeline de commandes** qui crée des **SaaS complets et beaux** — la beauté/qualité de `ship-flow` + le moteur SaaS de `saas-zero`, le tout **gratuit**, **égal ou supérieur** au workflow payant de Melvynx (NowStack).

### 0.1 Les piliers de l'utilisateur (non négociables — signature de marque)

| Pilier                                   | Traduction technique                                                                                             |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Effet WOW** qui attire et fait acheter | Design non-générique : palette, ambiance, élément signature, animations (GSAP/Motion/scroll/3D/vidéo)            |
| **Zéro bug, tout fonctionnel**           | 13 quality gates **+** isolation agent écrivain≠relecteur **+** fail-closed **+** load testing (k6) **+** Sentry |
| **Complet**                              | Toutes les briques présentes (socle, comptes, monétisation, beau, qualité)                                       |
| **Rétention**                            | Le client reste : onboarding guidé, emails, habitude, valeur continue                                            |

(← les 3 premières lignes sont dans la vision sergie ; y organse par dominances.)

## 1. Le stack (déjà décidé)

- **Framework** : Next.js 14 App Router (PAS TanStack — pas migr)
- **DB+Auth+Realtime+Storage** : Supabase (RLS obligatoire)
- **Hébergement** : Cloudflare Pages + Workers
- **Billing** : Stripe
- **Émail** : Brevo
- **Vision agent** : ModLens (Gemini, gratuit)
- **Le big de la qualité** : Vitest, Playwright, Storybook, k6, Sentry

## 2. Les étapes (ordre d'implémentation)

### Étape A — Mettre saas-zero au net (la base propre) ✅ DONE

- [x] Checkpoint git du travail non commité (commit `5e3d7b8`)
- [x] **Réparer l'orchestrateur `/ns`** : `ns-ship.ts` aligné sur les agents réels (commit `bb16122`)
- [x] **Résoudre le conflit B2B/B2C** : schémas mutuellement exclusifs, table partagée (commit `b1581ce`)
- [x] **Corriger les docs** : CLAUDE.md + README + AGENTS → Next.js 14 (commit `37662fc`)
- [x] Aligner les 9 skills existants sur la convention `ns-*` (commit `0a709c4`)
- [x] Nettoyer : `.gitignore` exclut `.hermes-tmp.*`, `.content-collections/`, `playwright-visual-report/`

### Étape B — Construire le "quoi" : la liste des briques SaaS (le contenu à produire)

Un SaaS "complet et beau + contract" contient au minimum :

1. **Site de vente** : landing (hero + preuves sociales + social proof), page tarifs, FAQ, mentions/CGU/confidentialité, docs/intro
2. **Comptes** : inscription/connexion (email, magic link, Google/GitHub), profil + sessions + sécurité, organisation multi-membres + rôles + invitations (ou utilisateur seul)
3. **L'app produit** : onboarding guidé, dashboard, la fonction qui résout le problème, (éventuellement dashboard clients)
4. **Monétisation** : Stripe (checkout, abonnement, portail, webhooks), factures/reçus, quotas selon plan + usage-based (v2)
5. **Rétention** : emails (bienvenue, reset, onboude, facture), notifications, onboarding séquencé
6. **Support** : contact + FAQ
7. **Admin** : panneau admin (users, stats interne, fixes)
8. **Observability** : analytics d'usage, Sentry, load testing

### Étape C — Construire la pipeline (le workflow commandé) ✅ DONE

Réussir à assembler les commandes `/ns` (discovery → scaffold → design → build → verify → deploy + `ship`), avec :

- [x] **Socle de 22 skills `ns-*`** (produit + vente + qualité) en SKILL.md portables (commits `0a709c4`, `ddf8107`)
- [x] **Isolation des agents** : agent `ns-reviewer` (lecture seule, contexte vierge) + commande `/ns-review` (commit `07127da`)
- [x] **Fail-closed** : hook pre-push qui bloque si `REVIEW.md` dit "À REVOIR" + les 13 gates (commit `07127da`)
- [x] **Qualité k6 + Sentry** : `gate:load`, `gate:sentry`, scénario `tests/load/scenario.js` (commit `87f808c`)
- [x] **Pipeline câblée** : commandes/agents pointent vers les skills/agents réels (commit `c2f671e`)
- [x] Typecheck global passe (0 erreur)

### Étape D — Déployer & valider

- un SaaS de démo complet créé PAR la pipeline, jusqu'en production
- les 13 gates + qualité + zéro bug démontrés sur ce SaaS

## 3. Ce qui est déjà prêt (dans saas-zero)

- Stripe, Brevo, orgs, RLS, auth UI FR, workers Cloudflare, edge functions
- la structure d'agents/skills/commandes existe (à aligner/réparer)

## 4. Risques / pièges à éviter

- Ne pas revenir à TanStack/Convex (finitude de budget)
- Ne pas reviewer dans le même contexte qui écrit (trous aveugles)
- Ne pas déployer sans gates / load test / Sentry (le "zéro bug" doit être garanti mécaniquement)

---

_Le plan est évalué; on exécute l'Étape A, `une brique à` la fois._
