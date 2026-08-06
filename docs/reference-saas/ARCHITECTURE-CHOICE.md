# ARCHITECTURE-CHOICE.md — TaskFlow (SaaS de référence)

> Choix d'architecture du produit de référence, issu de la Phase Discovery de la pipeline `/ns`.
> S'appuie sur `docs/REFERENCE-SAAS-COMPLET-ET-BEAU.md` et `docs/CORRESPONDANCE-NOWSTACK-VS-NS.md`.

## Stack (déjà décidé, aligné sur saas-zero)

| Layer                          | Choix                                           | Raison                               |
| ------------------------------ | ----------------------------------------------- | ------------------------------------ |
| Framework                      | Next.js 14 App Router                           | SSR, server actions, écosystème SaaS |
| DB + Auth + Realtime + Storage | Supabase (PostgreSQL + RLS)                     | gratuit, RLS obligatoire             |
| Hébergement                    | Cloudflare Pages + Workers                      | edge, gratuit                        |
| Billing                        | Stripe                                          | subscriptions, portal, webhooks      |
| Email                          | Brevo                                           | transactionnel + marketing, gratuit  |
| Vision agent                   | ModLens (Gemini)                                | analyse visuels/screenshots          |
| Design                         | `ns-design-system` (tokens + élément signature) | non-générique                        |
| Qualité                        | 13 gates + k6 + Sentry + review                 | zéro bug mécanique                   |

## Architecture B2B (multi-tenant)

- **Organisations** = tenant (billing owner)
- **Membres** = users avec rôle (owner/admin/member)
- **RLS** : toute table liée a `organization_id` ; policy vérifie l'appartenance via `organization_members`.
- Monaco: B2B choisi à la création (cf. migrations 01-style + 02 B2B ; ne PAS appliquer B2C en même temps).

## Tables Supabase (pour TaskFlow)

```sql
-- Reprise du core saas-zero (déjà en migrations) :
-- stripe_customers, stripe_prices, stripe_subscriptions, stripe_webhook_events,
-- email_queue, app_config, user_profiles (partagé)

-- B2B (migration b2b existante) :
organizations(id, name, slug, billing_email, settings)
organization_members(organization_id, user_id, role, status)
organization_invites(organization_id, email, role, token, expires_at)

-- ~Produit TaskFlow~ (nouveau, scoped org) :
projects(id, organization_id, name, color, archived_at, ...)         -- RLS par org
tasks(id, project_id, organization_id, title, status, assignee_id,
      due_date, position, ...)                                        -- kanban + RLS par org
task_comments(id, task_id, user_id, body, created_at)                 -- RLS par org
```

Chaque nouvelle table : RLS `organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())`.

## Pipeline appliquée (Phase 1 → 6)

1. **Discovery** → SPEC.md + ARCHITECTURE-CHOICE.md + DESIGN-CHOICE.md (ce dossier)
2. **Scaffold** → repo structuré, Supabase, env, types
3. **Design** → tokens + élément signature + composants
4. **Build** → auth/org + projets/tâches + billing + dashboard + notifications
5. **Verify** → 13 gates + review
6. **Deploy** → Cloudflare + migrations + webhooks

## Env Vars (taskflow)

```env
NEXT_PUBLIC_APP_URL=
SUPABASE_URL= SUPABASE_ANON_KEY= SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY= STRIPE_PUBLISHABLE_KEY= STRIPE_WEBHOOK_SECRET=
BREVO_API_KEY= BREVO_SENDER_EMAIL= BREVO_SENDER_NAME=
CLOUDFLARE_ACCOUNT_ID= CLOUDFLARE_API_TOKEN=
SENTRY_DSN=
```

---

_Généré par la pipeline ns-ship, Phase 1 Discovery._
