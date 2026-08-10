# 📋 TABLEAU COMPLET DES SKILLS — Pipeline `ns-*`

> Tous les skills sont des fichiers `SKILL.md` portables (Claude Code + Codex), dans `.claude/skills/`.
> Convention de nommage : `ns-<fonction>` (décision utilisateur).

## 🔑 Socle · Le produit-type "SaaS complet et beau"

| #   | Skill              | Description                                                                                                                    | Domaine             |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------- |
| 1   | `ns-landing`       | Site de vente qui convertit : hero, preuve sociale, features-bénéfices, tarifs, FAQ, legal. Effet wow + rassurance "des pros". | Vente / acquisition |
| 2   | `ns-design-system` | Design non-générique : tokens, palette, ambiance, **élément signature**, dark mode.                                            | **Ta signature**    |
| 3   | `ns-dashboard`     | L'app produit protégée : layout (app), tableau de bord avec stats réelles, pages (équipe, réglages, facturation, clés API).    | Cœur de l'app       |
| 4   | `ns-onboarding`    | Onboarding guidé "wow" à la première connexion : guide pas-à-pas, première valeur le plus tôt possible.                        | Rétention d'arrivée |

## 🔐 Comptes & identité

| #   | Skill              | Description                                                                                                              | Domaine          |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------- |
| 5   | `ns-auth`          | Comptes : email+password, magic link, OAuth, MFA, sessions, RLS.                                                         | Comptes          |
| 6   | `ns-organizations` | Comptes B2B multi-membres : organisations, équipes, rôles, invitations, RLS multi-tenant, passage B2B/B2C à la création. | Comptes / équipe |

## 💳 Monétisation

| #   | Skill        | Description                                                                                 | Domaine |
| --- | ------------ | ------------------------------------------------------------------------------------------- | ------- |
| 7   | `ns-billing` | Monétisation Stripe : page tarifs, checkout, abonnement, customer portal, webhooks, quotas. | Billing |

## 📈 Rétention & analytics

| #   | Skill          | Description                                                                                                                 | Domaine   |
| --- | -------------- | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| 8   | `ns-retention` | Le client reste : emails transactionnels (bienvenue, reset, facture, fin d'essai), notifications in-app, séquences d'usage. | Rétention |
| 9   | `ns-analytics` | Analytics d'usage produit : activation, rétention, funnels (≠ Plausible, marketing).                                        | Pilotage  |

## 🛠️ Opérations

| #   | Skill      | Description                                                                             | Domaine    |
| --- | ---------- | --------------------------------------------------------------------------------------- | ---------- |
| 10  | `ns-admin` | Panneau d'administration : vue users + abonnements, stats internes, gestion/résolution. | Opérations |

## ✅ Qualité · le "zéro bug"

| #   | Skill                  | Description                                                                                                                                                                | Domaine        |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| 11  | `ns-quality-gates`     | Les 14 quality gates déterministes : typecheck, lint, tests, E2E, visual, perf, RLS, sécurité, accessibilité, contracts, design audit. **Zéro bug garanti mécaniquement.** | Qualité        |
| 12  | `ns-load-test`         | Test de charge k6 : l'app tient-elle la charge ? faux positifs, seuils, scénario de pic.                                                                                   | Qualité / prod |
| 13  | `ns-sentry`            | Triage des erreurs de production : classer par coût réel, lire variables, proposer un correctif.                                                                           | Qualité / prod |
| 14  | `ns-visual-regression` | Tests visuels Playwright + pixelmatch : détecter les changements de rendu.                                                                                                 | Qualité        |

## 🚀 Équivalents NowStack recréés en gratuit

| #   | Skill             | Description                                                                                 | Équivalent NowStack |
| --- | ----------------- | ------------------------------------------------------------------------------------------- | ------------------- |
| 15  | `ns-quickstart`   | Clone frais → produit local vérifié, pas-à-pas.                                             | NS Quickstart       |
| 16  | `ns-doctor`       | Diagnostiquer la toolchain de dev (env, CLI, credentials, services).                        | NS Setup Tools      |
| 17  | `ns-docs`         | Documentation produit canonique (README, guide, onboarding, API).                           | NS Build Docs       |
| 18  | `ns-optimize`     | Optimiser un SaaS Next.js : state, data flow, performance (lazy, caching, queries, bundle). | NS Optimize         |
| 19  | `ns-check-launch` | Verdict de lancement evidence-backed : prêt ou non, preuves à l'appui.                      | NS Check Launch     |
| 20  | `ns-release`      | Release SaaS vérifiée : version, changelog, tag git.                                        | NS Ship Release     |

## 📄 Contenu / SEO / i18n (hérités de ship-flow, renommés `ns-*`)

| #   | Skill             | Description                                                              | Domaine             |
| --- | ----------------- | ------------------------------------------------------------------------ | ------------------- |
| 21  | `ns-contentlayer` | CMS markdown/MDX type-safe, builds incrémentaux.                         | Contenu             |
| 22  | `ns-forms`        | Forms backend (contact, newsletter) via Supabase Edge Functions + Brevo. | Contenu             |
| 23  | `ns-pagefind`     | Recherche statique build-time, zéro runtime, instantanée.                | Recherche           |
| 24  | `ns-next-intl`    | Internationalisation (i18n) Next.js : routing, locale detection.         | i18n                |
| 25  | `ns-next-sitemap` | sitemap.xml + robots.txt auto au build.                                  | SEO                 |
| 26  | `ns-json-ld`      | Données structurées Schema.org pour le SEO (rich snippets).              | SEO                 |
| 27  | `ns-plausible`    | Analytics privacy-first, sans cookies, GDPR compliant.                   | Analytics marketing |
| 28  | `ns-storybook`    | Documentation des composants + tests visuels (Chromatic).                | UI docs             |

---

## Résumé

- **Total** : 28 skills `ns-*`
- **Cœur SaaS** (1-10) : vendre, comptes, payer, retenir, administrer
- **Qualité** (11-14) : le "zéro bug" mécanique
- **NowStack en gratuit** (15-20) : quickstart, doctor, docs, optimize, check-launch, release
- **Contenu/SEO/i18n** (21-28) : hérités de ship-flow
- **Format** : SKILL.md portable, sous `.claude/skills/`
- **Alignés sur ta signature** : wow (design-system/landing/onboarding) · zéro bug (quality-gates/load/sentry) · complet (toutes les briques)

---

_Généré depuis `docs/CORRESPONDANCE-NOWSTACK-VS-NS.md` et `.claude/skills/*/SKILL.md`._
