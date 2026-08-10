# `/ns-scaffold` — Phase 2 : Scaffold Repo & Infrastructure

> **Objectif** : Repo prêt à coder — structure, deps, Supabase, Vercel, env, types.

---

## Usage

```bash
/ns-scaffold
# ou
pnpm ns:scaffold
```

> **Prérequis** : `SPEC.md`, `ARCHITECTURE-CHOICE.md`, `DESIGN-CHOICE.md` validés.

---

## Agents Parallèles

| Agent               | Livrable                                                                                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `saas-core-builder` | Routes Next.js 14, layout `(marketing)` + `(app)`, Supabase clients (browser/server/middleware), `lib/utils`, `lib/content`, content-collections config, next-intl i18n, middleware auth |
| `saas-auth-builder` | Tables Supabase (orgs, members, teams, invitations), RLS policies, migrations, Auth UI pages (login, register, forgot, reset, magic-link, 2FA), middleware protected routes              |

---

## Scripts Exécutés

```bash
pnpm install
pnpm content:build
pnpm supabase:gen:types
pnpm typecheck && pnpm lint
```

---

## Structure Repo Cible (conforme `ARCHITECTURE-CHOICE.md`)

```
saas-zero/
├── app/
│   ├── [locale]/
│   │   ├── (marketing)/          # Landing, blog, pages CMS
│   │   │   ├── page.tsx          # Landing (Hero, Features, Pricing, FAQ)
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx      # Blog index
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx  # Article
│   │   │   └── [...slug]/
│   │   │       └── page.tsx      # Pages CMS dynamiques
│   │   ├── (auth)/               # Auth non-protégé
│   │   │   ├── connexion/
│   │   │   ├── inscription/
│   │   │   ├── mot-de-passe-oublie/
│   │   │   └── magie/
│   │   ├── (app)/                # App protégée
│   │   │   ├── layout.tsx        # Sidebar, header, org switcher
│   │   │   ├── tableau-de-bord/
│   │   │   ├── equipe/
│   │   │   ├── reglages/
│   │   │   ├── facturation/
│   │   │   └── cles-api/
│   │   └── api/                  # API routes
│   │       ├── contact/
│   │       ├── newsletter/
│   │       ├── webhooks/
│   │       └── search/
├── components/
│   ├── ui/                       # Primitives shadcn
│   ├── forms/                    # ContactForm, NewsletterForm, CheckoutForm
│   ├── sections/                 # Hero, Features, Pricing, Testimonials, FAQ, CTA
│   └── MDXComponents.tsx         # Composants CMS
├── content/                      # CMS content-collections
│   ├── posts/
│   ├── pages/
│   ├── components/
│   └── data/
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser client
│   │   ├── server.ts             # Server client
│   │   └── middleware.ts         # Middleware auth
│   ├── stripe/                   # Billing helpers
│   ├── brevo/                    # Email helpers
│   ├── content.ts                # Fetch helpers CMS
│   └── utils.ts                  # cn(), etc.
├── messages/
│   ├── fr.json
│   └── en.json
├── supabase/
│   ├── migrations/
│   └── config.toml
├── app/
│   └── api/
│       ├── webhooks/
│       │   ├── stripe/
│       │   └── brevo/
│       └── health/
├── tests/
│   ├── unit/
│   ├── e2e/
│   ├── visual/
│   └── contracts/
└── .claude/
    ├── commands/
    ├── agents/
    └── skills/
```

---

## Supabase Setup

### 1. Lier le projet local

```bash
supabase link --project-ref $SUPABASE_PROJECT_REF
```

### 2. Appliquer migrations existantes

```bash
supabase db push
```

### 3. Générer types TypeScript

```bash
pnpm supabase:gen:types
# → src/lib/db/types.ts
```

---

## Vercel Setup

### `vercel.json`

```json
{
  "framework": "nextjs",
  "regions": ["fra1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Strict-Transport-Security", "value": "max-age=63072000" }
      ]
    }
  ]
}
```

### Route Handlers (App Router)

- `app/api/webhooks/stripe/route.ts` — Stripe webhooks
- `app/api/webhooks/brevo/route.ts` — Email transactionnel
- `app/api/health/route.ts` — Health check endpoint

---

## Variables d'Environnement

### `.env.example` (template)

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Vercel
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=

# Feature Flags
ENABLE_MFA=true
ENABLE_SSO=false
SSO_PROVIDERS=google,github
```

### Validation

```bash
pnpm env:check
```

---

## Gate Scaffold

- ✓ `typecheck` — `tsc --noEmit` 0 erreurs
- ✓ `lint` — ESLint + Prettier 0 warnings
- ✓ Structure repo conforme `ARCHITECTURE-CHOICE.md`
- ✓ Supabase types générés (`src/lib/db/types.ts`)
- ✓ content-collections build passe
- ✓ Middleware auth fonctionnel

---

## Commandes Utiles Post-Scaffold

```bash
# Dev server
pnpm dev

# Storybook
pnpm storybook

# Supabase local
pnpm supabase:start

# Types DB à jour
pnpm supabase:gen:types
```
