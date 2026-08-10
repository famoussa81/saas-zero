# SPEC.md — SaaS "TaskFlow" (gestion de tâches pour équipes)

> Produit de référence généré par la pipeline `/ns` (Phase Discovery). Ce document est l'idée
> concrète qui permet de valider que toutes les briques du "SaaS complet et beau" s'assemblent.
> (On pourra ensuite créer n'importe quel autre SaaS avec la même pipeline.)

## Vision

**TaskFlow** — un SaaS B2B où une équipe gère ses projets et tâches sur un tableau kanban,
avec des membres, des rôles, et une facturation par siège. Le but : montrer que la pipeline
crée un SaaS complet et beau (wow, zéro bug, rétention) de A à Z.

## Public cible

- **B2B** : petites équipes (3-15 personnes) qui veulent un outil simple et beau, sans apprendre Jira.
- **Architecture** : organisation multi-membres (owner/admin/member), paiement Stripe.

## Features MVP (Scope v1)

1. **Landing** (marketing) : hero wow + preuve sociale + features-bénéfices + tarifs + FAQ + legal.
2. **Auth** : email+password, magic link, OAuth (Google), sessions, reset.
3. **Organisation** : créer une org, inviter des membres (rôles), membres list.
4. **Projets & tâches** : CRUD projet, tableau kanban par statut, assignation, deadlines, commentaires.
5. **Notifications** : in-app (+ email) quand on est assigné, quand un projet change.
6. **Dashboard** : stats (tâches faites, actives, par membre), activité récente.
7. **Billing** : 3 plans (Free/Pro/Entreprise), Stripe : abonnement + portail + webhooks.
8. **Admin** : vue users + abonnements, stats internes.
9. **Qualité** : 14 gates + review + fail-closed + k6 + Sentry.

### Out of scope (v2+)

- Multi-org par user (v1 = une org), usage-based, SSO/SAML, mobile app, API publique.

## Non-Functional Requirements

| Requirement   | Cible                                            |
| ------------- | ------------------------------------------------ |
| Performance   | Lighthouse ≥ 90 (Perf, A11y, Best Practice, SEO) |
| Bundle        | < 100 KB gzipped (first load)                    |
| CWV           | LCP < 2,5 s, INP < 200 ms, CLS < 0,1             |
| TypeScript    | strict, 0 `any` en prod                          |
| RLS           | 100 % tables couvertes, testées en CI            |
| Accessibilité | WCAG 2.1 AA (axe-core)                           |
| Sécurité      | CSP, HSTS, rate limiting sur auth/billing        |
| i18n          | optionnel (fr/en, YAGNI par défaut)              |

## Quality Gates (14)

1. typecheck 2. lint 3. test 4. e2e 5. visual 6. lighthouse 7. bundle 8. cwv
2. hydration 10. rls 11. security 12. accessibility 13. contracts 14. design

## Déploiement

- Preview : `wrangler pages deploy --branch=preview` (par PR).
- Prod : merge main → Cloudflare Pages + `supabase db push` + webhooks Stripe/Brevo.

---

_Généré par la pipeline ns-youtube, Phase 1 Discovery._
