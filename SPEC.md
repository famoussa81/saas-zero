# SPEC.md — SaaS-Zero Product Specification

## Vision

**SaaS-Zero** : Starter kit complet pour lancer un SaaS B2B en jours, pas mois.

- Site marketing (landing, blog, CMS) + App SaaS (dashboard, billing, team) en un seul repo
- 100% gratuit/abordable (Cloudflare + Supabase Free + Stripe + Brevo Free)
- Pipeline `ns-ship` automatisé : Discovery → Deploy en une commande

## Public Cible

- **Fondateurs solo / petites équipes** qui veulent shipper vite sans infrastructure complexe
- **B2B SaaS** : outils métier, dashboards analytics, APIs, plateformes collaboratives

## Features MVP (Scope v1)

### 1. Site Marketing (Public)

- **Landing page** : Hero, Features, Pricing, Testimonials, FAQ, CTA
- **Blog** : Index + articles MDX, SEO (OG, Twitter, sitemap), i18n fr/en
- **Pages CMS** : À propos, Contact, Mentions, Politique confidentialité (dynamiques via content-collections)
- **Recherche** : Pagefind static search (client-side, zero backend)
- **Analytics** : Plausible (privacy-friendly)

### 2. Authentification (Supabase Auth)

- **Email/Password** : Inscription, Connexion, Déconnexion
- **Magic Link** : Passwordless login
- **OAuth** : GitHub, Google (configurable)
- **MFA** : TOTP (authenticator app) - optionnel
- **Password Reset** : Forgot password → email → new password
- **Email Verification** : Confirmation à l'inscription
- **Session Management** : SSR cookies, auto-refresh, protected routes

### 3. App SaaS (Protected / Dashboard)

- **Layout `(app)`** : Sidebar navigation, user menu, org switcher
- **Tableau de bord** : Stats clés (MRR, users, churn, activity) — mock data v1
- **Équipe** : Liste membres, invitations, rôles (owner/admin/member), suppression
- **Paramètres** : Profil, notifications, sécurité (MFA, sessions), suppression compte
- **Facturation** : Plan actuel, usage, historique factures, portail Stripe, upgrade/downgrade
- **API Keys** : Création, rotation, révocation, scopes (read/write)

### 4. Billing (Stripe)

- **Pricing Page** : 3 tiers (Free, Pro, Enterprise) — mensuel/annuel
- **Checkout** : Stripe Checkout Session → success/cancel URLs
- **Customer Portal** : Gestion abonnement, factures, moyens de paiement
- **Webhooks** : `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated/deleted`, `payment_method.attached`
- **Sync DB** : `subscriptions` table miroir Stripe

### 5. Email (Brevo)

- **Transactional** : Welcome, Magic Link, Password Reset, Invoice, Subscription Change
- **Marketing** : Newsletter (double opt-in), Onboarding sequence
- **Templates** : MJML/HTML responsive, variables dynamiques

### 6. CMS (content-collections)

- **Collections** : `posts` (blog), `pages` (marketing), `components` (reusable blocks)
- **Fields** : title, slug, description, body (MDX), tags, heroImage, date, draft, order
- **Components MDX** : Hero, FeatureGrid, PricingTable, TestimonialCarousel, FAQ, CTA

## Non-Functional Requirements

| Requirement       | Target                                            |
| ----------------- | ------------------------------------------------- |
| **Performance**   | Lighthouse ≥ 90 (Perf, A11y, Best Practices, SEO) |
| **Bundle**        | < 100KB gzipped first load (shared)               |
| **CWV**           | LCP < 2.5s, INP < 200ms, CLS < 0.1                |
| **TypeScript**    | Strict mode, zero `any` in prod                   |
| **RLS**           | 100% tables covered, tested in CI                 |
| **Accessibility** | WCAG 2.1 AA (axe-core)                            |
| **Security**      | CSP, HSTS, rate limiting on auth/billing          |
| **i18n**          | fr/en complet, fallback fr                        |

## Quality Gates (13 Gates)

1. `gate:typecheck` — `tsc --noEmit` strict pass
2. `gate:lint` — ESLint + Prettier zero warnings
3. `gate:test` — Vitest unit tests (critical paths 100%)
4. `gate:e2e` — Playwright: auth, billing, core journey
5. `gate:visual` — Visual regression (Storybook + Playwright)
6. `gate:lighthouse` — Lighthouse CI ≥ 90 all categories
7. `gate:bundle` — Bundle size < budget
8. `gate:cwv` — Core Web Vitals pass
9. `gate:hydration` — No hydration mismatches
10. `gate:rls` — Supabase RLS policies tested
11. `gate:security` — npm audit + CodeQL SAST
12. `gate:accessibility` — axe-core WCAG 2.1 AA
13. `gate:contracts` — API contract tests (OpenAPI)

## Deployment

- **Preview** : `wrangler pages deploy --branch=preview` (chaque PR)
- **Production** : `wrangler pages deploy --branch=main` (merge main)
- **Supabase Migrations** : GitHub Action `supabase db push` sur merge main
- **Stripe/Brevo Webhooks** : Mise à jour URLs via CLI ou dashboard

## Out of Scope (v2+)

- Multi-team par org (v1 = org unique)
- Usage-based billing (v1 = seat-based)
- SSO/SAML (Enterprise only)
- White-labeling
- Marketplace/plugins
- Mobile app

---

_Cette SPEC guide le pipeline `ns-ship`. Toute modification = ADR + approbation humaine._
