# RUNBOOK — Créer un SaaS de démo complet avec la pipeline

> **Objectif** : prouver que la pipeline `/ns` crée un SaaS complet, beau, zéro bug, jusqu'en production.
> Ce runbook est la marche à suivre pour le premier SaaS de démo.

---

## Prérequis (une fois)

| Outil                    | État         | Action si absent     |
| ------------------------ | ------------ | -------------------- |
| Node.js ≥ 20             | ✅ (v24)     | installer            |
| pnpm ≥ 9                 | ✅           | `npm i -g pnpm`      |
| Claude Code (ou Codex)   | ✅           | —                    |
| `supabase` CLI           | ❌ absent    | `npm i -g supabase`  |
| `wrangler` CLI           | ✅ (dép dev) | `npm i -g wrangler`  |
| Credentials `.env.local` | ✅ présent   | voir `.env.example`  |
| Compte Stripe test       | à vérifier   | stripe.com test mode |
| Compte Brevo             | à vérifier   | brevo.com            |
| Projet Supabase cloud    | à vérifier   | supabase.com         |
| Projet Cloudflare Pages  | à vérifier   | cloudflare.com       |

---

## Étapes

### 1. Préparer les credentials

1. Copier `.env.example` → `.env.local` (déjà présent, vérifier les valeurs).
2. `SENTRY_DSN` : optionnel, sinon gate:sentry skip.
3. Configurer Stripe (test keys + webhook), Brevo (clé API), Supabase (URL/anon/service_role).

### 2. Démarrer Supabase local (optionnel pour dev)

```bash
npm i -g supabase
supabase start          # lance le stack local (Docker requis)
supabase db reset       # applique toutes les migrations proprement
```

### 3. Lancer la pipeline pour l'idée de SaaS

```bash
/ns-ship "description de ton SaaS"
```

Ou phase par phase :

```bash
/ns-discovery "description"   # → SPEC.md + ARCHITECTURE-CHOICE.md + DESIGN-CHOICE.md (validation humaine)
/ns-scaffold                  # → repo structuré, types, env
/ns-design                    # → design system + tokens + composants
/ns-build                     # → logique métier + auth + billing + dashboard
/ns-review                    # → relecture en contexte vierge (REVIEW.md)
/ns-verify                    # → 13 gates qualité
/ns-deploy                    # → Cloudflare Pages + migrations + webhooks
```

### 4. Vérifier la qualité (le "zéro bug")

```bash
pnpm typecheck   # 0 erreur
pnpm lint        # 0 warning
pnpm test        # unités passent
pnpm test:e2e    # Playwright (auth, billing, core)
k6 run tests/load/scenario.js   # load test (si k6 installé)
```

### 5. Le review fail-closed

- `/ns-review` → produit `REVIEW.md`.
- `git push` **bloqué** si `REVIEW.md` dit `À REVOIR` (hook pre-push).

---

## Critères de succès d'un SaaS "complet et beau" (ta signature)

- [ ] Landing qui **rassure** ("des pros") et montre la solution en 2s
- [ ] Effet **wow** : élément signature + animations (niveau choisi)
- [ ] **Comptes** : inscription/connexion (+ org si B2B)
- [ ] **Monétisation** : tarifs + Stripe + portail
- [ ] **Dashboard** avec stats réelles + **onboarding** guidé
- [ ] **Rétention** : emails + notifications
- [ ] **Admin** + **analytics** + **Sentry** branchés
- [ ] **Zéro bug** : gates passent + review passée + load test + Sentry

---

_Étape D du grand plan. La pipeline est prête (Étapes A + C ✅). À toi de lancer le premier SaaS._
