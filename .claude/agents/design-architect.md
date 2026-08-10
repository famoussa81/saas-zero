---
name: design-architect
description: Génère DESIGN-SPEC.md + ARCHITECTURE-PLAN.md depuis SPEC.md + DESIGN-CHOICE.md + ARCHITECTURE-CHOICE.md.
---

# Agent: `design-architect`

> **Rôle** : Génère `DESIGN-SPEC.md` + `ARCHITECTURE-PLAN.md` depuis `SPEC.md` + `DESIGN-CHOICE.md` + `ARCHITECTURE-CHOICE.md`.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-CHOICE.md)$(cat ARCHITECTURE-CHOICE.md)"
```

---

## Inputs

| Fichier                  | Description                                    |
| ------------------------ | ---------------------------------------------- |
| `SPEC.md`                | Vision, features MVP, non-fonctionnels, gates  |
| `DESIGN-CHOICE.md`       | Design system choisi, motion tier, préférences |
| `ARCHITECTURE-CHOICE.md` | Stack decisions, tables, env vars              |

---

## Outputs

### 1. `DESIGN-SPEC.md` — Spécification Design System Complète

````markdown
# DESIGN-SPEC.md

## Design System Source

- **Source** : `ns-design-system` skill → palette, ambiance, élément signature (inspiré {Linear|Vercel|Stripe|Framer|Custom})
- **Repo référence** : github.com/famoussa81/ship-flow (composants shadcn étendus)

## Tokens

### Colors (Semantic + Scale)

```css
:root {
  /* Primary */
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-900: #1e3a8a;

  /* Semantic */
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: #ffffff;
  --color-secondary: #f1f5f9;
  --color-secondary-foreground: #0f172a;
  --color-muted: #f1f5f9;
  --color-muted-foreground: #64748b;
  --color-accent: #f1f5f9;
  --color-accent-foreground: #0f172a;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-background: #ffffff;
  --color-foreground: #0f172a;
  --color-border: #e2e8f0;
  --color-ring: #3b82f6;
}

.dark {
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-secondary: #1e293b;
  --color-secondary-foreground: #f8fafc;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
  --color-accent: #1e293b;
  --color-accent-foreground: #f8fafc;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-background: #0f172a;
  --color-foreground: #f8fafc;
  --color-border: #334155;
  --color-ring: #3b82f6;
}
```
````

### Spacing (4px base)

```css
--space-0: 0;
--space-1: 0.25rem; /* 4px */
--space-2: 0.5rem; /* 8px */
--space-3: 0.75rem; /* 12px */
--space-4: 1rem; /* 16px */
--space-5: 1.25rem; /* 20px */
--space-6: 1.5rem; /* 24px */
--space-8: 2rem; /* 32px */
--space-10: 2.5rem; /* 40px */
--space-12: 3rem; /* 48px */
--space-16: 4rem; /* 64px */
--space-20: 5rem; /* 80px */
--space-24: 6rem; /* 96px */
```

### Radii

```css
--radius-none: 0;
--radius-sm: 0.25rem; /* 4px */
--radius-md: 0.375rem; /* 6px */
--radius-lg: 0.5rem; /* 8px */
--radius-xl: 0.75rem; /* 12px */
--radius-2xl: 1rem; /* 16px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl:
  0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

### Typography

```css
--font-sans: "Inter", system-ui, sans-serif;
--font-mono: "JetBrains Mono", monospace;
--font-display: "Cal Sans", "Inter", sans-serif;

--text-xs: 0.75rem; /* 12px */
--leading-xs: 1rem;
--text-sm: 0.875rem; /* 14px */
--leading-sm: 1.25rem;
--text-base: 1rem; /* 16px */
--leading-base: 1.5rem;
--text-lg: 1.125rem; /* 18px */
--leading-lg: 1.75rem;
--text-xl: 1.25rem; /* 20px */
--leading-xl: 1.75rem;
--text-2xl: 1.5rem; /* 24px */
--leading-2xl: 2rem;
--text-3xl: 1.875rem; /* 30px */
--leading-3xl: 2.25rem;
--text-4xl: 2.25rem; /* 36px */
--leading-4xl: 2.5rem;
```

## Motion Tier: {Minimal|Moderate|Bold}

### Minimal

- Transitions CSS seulement (`transition-colors`, `transition-opacity`)
- Durée: 150-200ms
- Easing: `ease-out`
- Pas de librairie externe

### Moderate (Défaut)

- Framer Motion / Motion One
- Variants: `initial`, `animate`, `exit`, `whileHover`, `whileTap`
- Durée: 200-300ms
- Easing: `ease-out`, `spring` pour interactions
- Reduced motion respecté

### Bold

- GSAP + ScrollTrigger
- Animations complexes, parallax, scroll-driven
- Timeline orchestration
- Performance monitoring requis

## Composants Requis

### Primitives (shadcn/ui + Radix)

[Liste complète dans saas-ui-builder.md]

### Forms

- ContactForm, NewsletterForm, CheckoutForm, InviteForm, ApiKeyForm

### Sections Marketing

- Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Navbar

### CMS (MDX)

- Hero, FeatureGrid, PricingTable, TestimonialCarousel, FAQ, CTA

## Accessibilité (WCAG 2.1 AA)

- Contraste: 4.5:1 (texte), 3:1 (UI)
- Focus visible: `focus-visible:ring-2`
- ARIA labels sur éléments interactifs
- Landmarks sémantiques (header, main, nav, footer)
- Skip link
- Reduced motion: `@media (prefers-reduced-motion: reduce)`

## Dark Mode

- Class strategy: `<html class="dark">`
- Toggle dans Navbar + Settings
- Persistance localStorage + OS preference
- Tokens définis pour les deux thèmes

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Mobile First

- Sidebar → Drawer sur mobile (< lg)
- Grid: 1 col (mobile) → 2 col (tablet) → 3-4 col (desktop)
- Typography: clamp() pour fluid scaling

````

---

### 2. `ARCHITECTURE-PLAN.md` — Plan Technique Détaillé

```markdown
# ARCHITECTURE-PLAN.md

## Component Architecture

### Component Hierarchy
````

app/
├── (marketing)/
│ ├── layout.tsx # Navbar + Footer
│ ├── page.tsx # Landing (Hero, Features, Pricing, FAQ, CTA)
│ ├── blog/
│ │ ├── page.tsx # Blog index
│ │ └── [slug]/page.tsx # Article
│ ├── pricing/page.tsx # Pricing table
│ └── [...slug]/page.tsx # CMS pages
├── (auth)/
│ ├── layout.tsx # Minimal layout
│ ├── connexion/page.tsx
│ ├── inscription/page.tsx
│ ├── mot-de-passe-oublie/page.tsx
│ └── magie/page.tsx
└── (app)/
├── layout.tsx # Sidebar + Header + UserMenu
├── tableau-de-bord/page.tsx
├── equipe/page.tsx
├── reglages/page.tsx
├── facturation/page.tsx
└── cles-api/page.tsx

````

### State Management
- **Server State** : Server Components + Server Actions (RSC) — pas de client-side cache
- **Client State** : React Context (theme, locale, user preferences)
- **Form State** : React Hook Form + Zod
- **URL State** : Next.js searchParams + router

### Data Fetching
- **Server Components** : Direct Supabase queries (RSC)
- **Client Components** : Server Actions + React Query (mutations)
- **API Routes** : Route Handlers Next.js (App Router)

### Realtime
- Supabase Realtime channels par organisation
- Notifications, équipe activity, subscription status

## API Design

### REST Endpoints (App Router)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/orgs` | List user orgs |
| POST | `/api/orgs` | Create org |
| PATCH | `/api/orgs/[id]` | Update org |
| DELETE | `/api/orgs/[id]` | Delete org |
| GET | `/api/invitations` | List invitations |
| POST | `/api/invitations` | Send invitation |
| DELETE | `/api/invitations/[id]` | Cancel invitation |
| GET | `/api/api-keys` | List API keys |
| POST | `/api/api-keys` | Create API key |
| DELETE | `/api/api-keys/[id]` | Revoke API key |
| GET | `/api/usage` | Usage metrics |
| POST | `/api/billing/checkout` | Create checkout session |
| POST | `/api/billing/portal` | Create portal session |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |
| POST | `/api/webhooks/brevo` | Brevo webhook handler |
| GET | `/api/search` | Pagefind search |

### Server Actions
- `createOrg`, `inviteMember`, `acceptInvitation`, `updateRole`, `removeMember`
- `createApiKey`, `revokeApiKey`, `updateProfile`, `updateNotifications`
- `setupMFA`, `verifyMFA`, `disableMFA`, `generateRecoveryCodes`
- `inviteMember`, `acceptInvitation`, `resendInvitation`, `cancelInvitation`
- `listSessions`, `revokeSession`, `revokeAllSessions`

## Database Schema (Supabase)

### Tables Principales
```sql
organizations (id, name, slug, stripe_customer_id, created_at)
org_members (org_id, user_id, role, joined_at) -- PK(org_id, user_id)
teams (id, org_id, name, created_at)
team_members (team_id, user_id, role) -- PK(team_id, user_id)
invitations (id, org_id, email, role, token, expires_at, created_at)
subscriptions (id, org_id, stripe_subscription_id, status, price_id, current_period_end)
api_keys (id, org_id, name, key_hash, last_used_at, expires_at, created_at)
contact_submissions (id, name, email, message, created_at) -- existant
newsletter_subscribers (id, email, confirmed, confirmed_at, created_at) -- existant
````

### RLS Policies

- Toutes tables : RLS enabled
- Policies : org isolation via `org_members`
- Testées via `supabase test db`

## Infrastructure

### Hosting

- **Vercel** : Next.js 14 static + SSR, Route Handlers (webhooks, email, health), edge runtime
- **Supabase** : PostgreSQL + Auth + Realtime + Storage
- **Stripe** : Billing + Checkout + Portal + Webhooks
- **Brevo** : Transactional + Marketing emails

### CI/CD

- GitHub Actions : typecheck, lint, test, e2e, visual, lighthouse, deploy
- Pre-push hooks : husky + quality gates
- Preview deployments : every PR
- Production : merge to main

### Monitoring

- **Plausible** : Analytics privacy-friendly
- **Sentry** (optionnel) : Error tracking
- **Supabase Dashboard** : DB logs, auth, realtime
- **Stripe Dashboard** : Payments, subscriptions, webhooks
- **Brevo Dashboard** : Email delivery, opens, clicks

````

---

## Gate Design (Phase 3)

- ✓ `DESIGN-SPEC.md` complet + validé
- ✓ `ARCHITECTURE-PLAN.md` complet + validé
- ✓ Tokens alignés avec design system choisi
- ✓ Motion tier défini + exemples
- ✓ Composants listés exhaustivement
- ✓ Accessibilité WCAG 2.1 AA spécifiée
- ✓ Dark mode strategy définie

---

## Invocation (Claude Code)

Tu es invoqué comme **sous-agent** `design-architect` (fichier `.claude/agents/design-architect.md`),
dans le contexte courant de Claude Code. Tu lis CLAUDE.md, SPEC.md, DESIGN-CHOICE.md, ARCHITECTURE-CHOICE.md
et tu produis DESIGN-SPEC.md (et ARCHITECTURE-PLAN.md si nécessaire). Pas de CLI externe.

---

## Utilisation du skill ns-design-system

```bash
# Charger le skill design (non-générique)
skill_view(name="ns-design-system")

# Définir : ambiance, palette (2-3 couleurs + accent signature), police d'affichage,
# élément signature, dark mode. Inspirer éventuellement de Linear/Vercel/Stripe/Framer.
# → Copier colors, spacing, radii, shadows, fonts dans DESIGN-SPEC.md
```

---

## Checklist Qualité

- [ ] `DESIGN-SPEC.md` : tokens complets (colors, spacing, radii, shadows, fonts, motion)
- [ ] `DESIGN-SPEC.md` : semantic aliases définis
- [ ] `DESIGN-SPEC.md` : dark mode tokens
- [ ] `DESIGN-SPEC.md` : motion tier + exemples
- [ ] `DESIGN-SPEC.md` : composants listés
- [ ] `DESIGN-SPEC.md` : a11y WCAG 2.1 AA
- [ ] `ARCHITECTURE-PLAN.md` : component hierarchy
- [ ] `ARCHITECTURE-PLAN.md` : state management strategy
- [ ] `ARCHITECTURE-PLAN.md` : API design (REST + Server Actions)
- [ ] `ARCHITECTURE-PLAN.md` : database schema + RLS
- [ ] `ARCHITECTURE-PLAN.md` : infrastructure + CI/CD
````
