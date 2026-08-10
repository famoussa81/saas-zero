# Pipeline saas-zero

> **Donne un brief → reçois un site complet, beau, testé et prêt à déployer.**

saas-zero est une **pipeline génératrice** : elle transforme un brief en langage naturel en site complet (landing + auth + dashboard + i18n + responsive), avec un design system propre, des tests verts et un déploiement Vercel.

---

## 🚀 Commandes principales

### `/new-site "brief"` — Génère un site complet de A à Z

```bash
/new-site "Site de réservation pour un hôtel de charme en Provence"
/new-site "SaaS de facturation pour freelances avec Stripe"
/new-site "Portfolio pour une photographe de mariage"
```

**Pipeline (4 agents séquentiels) :**

| #   | Agent      | Rôle                                                   | Gate de sortie                         |
| --- | ---------- | ------------------------------------------------------ | -------------------------------------- |
| 1   | `planner`  | Brief → `SPEC.md` + `DESIGN-CHOICE.md` (design system) | Spec validée                           |
| 2   | `builder`  | Implémente pages, composants, i18n, SEO                | `typecheck` + `lint`                   |
| 3   | `qa`       | Tests e2e + a11y + visual regression + SEO/perf        | `test` + `test:e2e` + a11y 0 violation |
| 4   | `deployer` | Build + PR + preview Vercel                            | Build OK + preview HTTP 200            |

### `/ship` — Livre l'état actuel du repo

```bash
/ship
/ship "fix: corrige le contraste des badges sur le blog"
```

**Pipeline :** Build & Gates → Review (agent `qa`) → Commit & PR → Deploy Preview.

---

## 🧩 Skills (chargés à la demande)

| Skill               | Rôle                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| `design-system`     | Génère les tokens (palette, typo, spacing) depuis le brief                    |
| `design-principles` | Anti-clichés IA (pas de dégradés violet, pas d'emojis, pas de "Élevez votre") |
| `visual-regression` | Boucle screenshot → critique → itère                                          |
| `ui-implementation` | shadcn/Tailwind, a11y, responsive, motion                                     |
| `seo-perf`          | Metadata, Open Graph, sitemap, Lighthouse                                     |
| `deploy-vercel`     | Preview, env vars, production                                                 |

## 🤖 Agents

| Agent      | Rôle                                   |
| ---------- | -------------------------------------- |
| `planner`  | Brief → spec + design system           |
| `builder`  | Implémente le site                     |
| `qa`       | Tests, a11y, visual regression, review |
| `deployer` | Build, PR, déploiement Vercel          |

---

## 🛡️ Garde-fous

- **Hook anti-destruction** (`.claude/hooks/guard-rail.js`) : bloque la suppression de dossiers/fichiers critiques (app, components, lib, src, .claude, .github, package.json, etc.)
- **Hooks husky** : `pre-commit` (lint-staged + typecheck), `pre-push` (typecheck + lint, fail-closed)
- **CI/CD** : `ci.yml` (typecheck, lint, test, build, e2e, visual, lighthouse, security, a11y, rls, deploy preview/prod Vercel) + `deploy.yml` (deploy prod Vercel avec approbation manuelle)

---

## 📁 Structure de la pipeline

```
.claude/
├── commands/
│   ├── new-site.md        # Génère un site complet depuis un brief
│   ├── ship.md            # Livre l'état actuel (build → review → PR → deploy)
│   └── ns-ship.md         # Pipeline SaaS complet (6 phases)
├── agents/
│   ├── planner.md         # Brief → spec + design
│   ├── builder.md         # Implémentation
│   ├── qa.md              # Tests + review
│   └── deployer.md        # Build + PR + deploy
├── skills/
│   ├── design-principles/ # Anti-clichés IA
│   ├── ui-implementation/ # Règles d'implémentation UI
│   ├── seo-perf/          # SEO & performance
│   ├── deploy-vercel/     # Déploiement Vercel
│   └── ... (ns-* existants)
├── hooks/
│   └── guard-rail.js      # Garde-fou anti-destruction
└── settings.json          # Active le hook garde-fou
```

---

## ➕ Ajouter un skill

1. Créer un dossier `.claude/skills/<nom>/`
2. Créer `SKILL.md` avec le frontmatter :
   ```markdown
   ---
   name: <nom>
   description: <quand l'utiliser>
   ---
   ```
3. Documenter les règles, exemples et checklist de sortie

## ➕ Ajouter un agent

1. Créer `.claude/agents/<nom>.md`
2. Documenter : rôle, contexte requis, inputs, outputs, règles, gate de sortie

---

## 🚀 Déployer

### Preview (déploiement de test)

```bash
vercel --preview
```

### Production

```bash
vercel --prod
```

Ou via CI : push sur `main` → `ci.yml` déploie en production (avec approbation manuelle via `deploy.yml`).

### Variables d'environnement requises

```bash
# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Brevo
BREVO_API_KEY=
```

---

## ✅ Gates de qualité

```bash
pnpm gates:all   # typecheck + lint + test + test:e2e
pnpm build       # build de production
```

Tous les gates doivent passer avant de déployer. Un gate qui échoue bloque la livraison (fail-closed).

---

_Pipeline saas-zero v1.0 — Next.js 14 + Supabase + Vercel_
