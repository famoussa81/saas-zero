# ARCHITECTURE-CHOICE.md

## Stack Décisions (actées)

| Layer                | Choix                                              | Raison                                               |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Framework            | **Next.js 14 App Router**                          | Code existant fonctionnel, support Vercel natif      |
| CMS                  | **content-collections**                            | Successeur maintenu de Contentlayer, même sémantique |
| Auth + DB + Realtime | **Supabase** (PostgreSQL + RLS)                    | Free tier généreux, RLS obligatoire, types générés   |
| Hosting              | **Vercel**                                         | Preview deploys, edge runtime, global CDN            |
| Billing              | **Stripe**                                         | Subscriptions, checkout, portal, webhooks            |
| Email                | **Brevo**                                          | Transactionnel + marketing, templates, free tier     |
| Design System        | **ship-flow** (shadcn/ui + Radix + Tailwind + CVA) | Déjà en place, beau rendu, accessible                |
| Motion               | **Moderate** (Framer Motion / Motion One)          | Animations fluides sans surcharge                    |
| i18n                 | **next-intl**                                      | [locale] routing, messages JSON, SSR                 |
| Search               | **Pagefind**                                       | Build-time static search, zero backend               |
| Analytics            | **Plausible**                                      | Privacy-friendly, léger                              |
| Package Manager      | **pnpm**                                           | Workspaces, fast installs                            |

## Architecture B2B Multi-tenant

- **Organizations** = tenant principal (billing owner)
- **Teams** = sous-groupes au sein d'une org (optionnel v1)
- **Users** = membres avec rôles (owner, admin, member)
- **RLS** : toutes les tables ont `organization_id`, policies `auth.uid() IN (SELECT user_id FROM org_members WHERE org_id = ...)`

## Tables Supabase (migrations existantes + à créer)

```sql
-- Existant : contact_submissions, newsletter_subscribers
-- À créer :
organizations (id, name, slug, stripe_customer_id, created_at)
org_members (org_id, user_id, role, joined_at)
teams (id, org_id, name, created_at)
team_members (team_id, user_id, role)
invitations (id, org_id, email, role, token, expires_at)
subscriptions (id, org_id, stripe_subscription_id, status, price_id, current_period_end)
api_keys (id, org_id, name, key_hash, last_used_at, expires_at)
```

## Pipeline appliqué (`ns-ship`, 6 phases)

| Phase       | Description                                                                     | Gate de sortie                |
| ----------- | ------------------------------------------------------------------------------- | ----------------------------- |
| **Phase 1** | Discovery → DISCOVERY.md + SPEC.md + ARCHITECTURE-CHOICE.md + DESIGN-CHOICE.md  | `discovery:check` = 100%      |
| **Phase 2** | Scaffold → Repo structure, Supabase link, Vercel, deps, env                     | typecheck + lint              |
| **Phase 3** | Design → Tokens, composants, Storybook, baselines visuels                       | `design:check`                |
| **Phase 4** | Build (parallèle) → saas-core + saas-auth + saas-billing + cms + forms + search | unit tests + typecheck + lint |
| **Phase 5** | Verify → 14 gates déterministes                                                 | `gates:all`                   |
| **Phase 6** | Deploy → Supabase migrations + Vercel + Stripe/Brevo webhooks                   | smoke tests preview           |

## Env vars (requises)

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=
VERCEL_TOKEN=
```

---

_Décisions validées par défaut pour SaaS B2B standard. Modifiable via ADR._
