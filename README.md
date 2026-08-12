# Zero-Risk SaaS Stack

> **Ship with confidence. Verify before deploy. Zero risk, maximum velocity.**

A complete, production-ready SaaS starter built on the **Zero-Risk methodology** — where every feature is verified locally before it touches production, every deployment is gated by 14 quality checks, and the developer experience is optimized for flow, not friction.

---

## 📖 Table of Contents

1. [Overview & Philosophy](#-overview--philosophy)
2. [Quick Start](#-quick-start)
3. [Architecture Overview](#-architecture-overview)
4. [Commands Reference](#-commands-reference)
5. [Design System Selection](#-design-system-selection)
6. [Quality Gates (14 Gates)](#-quality-gates-14-gates)
7. [CI/CD Pipeline](#-cicd-pipeline)
8. [Deployment Guide](#-deployment-guide)
9. [Troubleshooting](#-troubleshooting)
10. [Contributing](#-contributing)
11. [License](#-license)

---

## 🎯 Overview & Philosophy

### The Zero-Risk Methodology

Traditional SaaS development follows a linear path: **code → push → pray**. The Zero-Risk Stack inverts this:

```
┌─────────────────────────────────────────────────────────────────┐
│                      ZERO-RISK WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│   │  /ns-ship│───▶│ /ns-verify│───▶│ /ns-ship │───▶│  Deploy  │ │
│   │  (build) │    │ (test)   │    │ (deploy) │    │  (prod)  │ │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘ │
│        │              │              │              │           │
│        ▼              ▼              ▼              ▼           │
│   • TypeCheck    • Unit Tests   • Staging      • Canary       │
│   • Lint         • E2E Tests    • Preview      • Rollback     │
│   • Format       • Contract     • Smoke        • Monitoring   │
│   • Build        • A11y         • Tests        • Alerts       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Principles

| Principle                | Description                                                           |
| ------------------------ | --------------------------------------------------------------------- |
| **Verify Before Ship**   | No code reaches production without passing 14 quality gates locally   |
| **Local-First DX**       | All verification runs on your machine — no CI wait times for feedback |
| **Fail Fast, Fail Loud** | Errors surface immediately with actionable diagnostics                |
| **One Command**          | `/ns-ship`, `/ns-verify`, `/ns-ship-deploy` — that's all you need     |
| **Stack Agnostic**       | Works with any design system, any database, any deployment target     |

### The Stack

| Layer          | Technology            | Purpose                                                                                      |
| -------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| **Framework**  | Next.js 14            | Full-stack React with App Router file-based routing, SSR, server actions, and type-safe APIs |
| **Database**   | Supabase (PostgreSQL) | Auth, realtime, storage, edge functions                                                      |
| **Deployment** | Vercel                | Preview deploys, instant rollbacks, edge network, zero-config                                |
| **Payments**   | Stripe                | Subscriptions, checkout, billing portal, webhooks                                            |
| **Email**      | Brevo (Sendinblue)    | Transactional & marketing emails, templates                                                  |
| **Styling**    | Your Choice           | shadcn/ui, Radix, Tailwind, or bring your own                                                |

---

## 🚀 Quick Start

### Prerequisites

```bash
# Required
node >= 20.0.0
pnpm >= 9.0.0
git >= 2.40.0

# Optional but recommended
gh CLI (for GitHub integration)
vercel CLI (for Vercel deploys)
supabase CLI (for local dev)
```

### Installation

```bash
git clone https://github.com/famoussa81/saas-zero.git <dossier>
cd <dossier>
pnpm install
```

C'est tout — `.claude/` (skills, agents, commandes, gates) voyage avec le dépôt.

Détails, vérifications et création d'un projet client : **[BOOTSTRAP.md](BOOTSTRAP.md)**.

> Les commandes `npx create-zero-risk-saas` et `pnpm ns:bootstrap` qui figuraient ici
> n'ont jamais existé : le paquet npm n'a jamais été publié (404) et le script
> n'est pas dans package.json. Un agent suivant ce README échouait sur la
> première commande.

### First Feature in 3 Minutes

```bash
# 1. Start the dev server
pnpm dev

# 2. In another terminal, create a feature
/ns-ship "add user dashboard with revenue chart"

# 3. Verify it works
/ns-verify

# 4. Deploy to staging
/ns-ship-deploy staging

# 5. Promote to production
/ns-ship-deploy production
```

---

## 🏗 Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ZERO-RISK SAAS ARCHITECTURE                     │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐             │
│  │   Client    │     │   Server    │     │  Services   │             │
│  │  (Browser)  │────▶│  (Edge)     │────▶│  (External) │             │
│  └─────────────┘     └─────────────┘     └─────────────┘             │
│        │                   │                   │                     │
│        ▼                   ▼                   ▼                     │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    NEXT.JS 14                            │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│  │  │ Routes   │ │  API     │ │  Middle  │ │  Auth    │       │    │
│  │  │ (File)   │ │  Routes  │ │  ware    │ │  (Supa)  │       │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│        │                   │                   │                     │
│        ▼                   ▼                   ▼                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────┐   │
│  │  Supabase   │  │  Stripe     │  │  Brevo      │  │  Vercel  │   │
│  │  (DB/Auth)  │  │  (Payments) │  │  (Email)    │  │  (Edge)  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └──────────┘   │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
my-app/
├── .github/
│   └── workflows/           # CI/CD pipelines
├── .husky/                  # Git hooks
├── public/                  # Static assets
├── src/
│   ├── app/                 # Next.js App Router routes (file-based)
│   │   ├── (auth)/          # Auth route group
│   │   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── api/             # API routes
│   │   └── _layout.tsx      # Root layout
│   ├── components/          # Shared UI components
│   │   ├── ui/              # Design system primitives
│   │   ├── forms/           # Form components
│   │   └── charts/          # Data visualization
│   ├── lib/                 # Core utilities
│   │   ├── supabase/        # Supabase client & helpers
│   │   ├── stripe/          # Stripe client & webhooks
│   │   ├── email/           # Brevo email templates
│   │   ├── auth/            # Auth utilities
│   │   └── utils/           # General utilities
│   ├── hooks/               # Custom React hooks
│   ├── stores/              # State management (Zustand/Jotai)
│   ├── types/               # TypeScript types
│   └── styles/              # Global styles & design tokens
├── supabase/                # Supabase local dev & migrations
│   ├── migrations/
│   ├── seed.sql
│   └── config.toml
├── scripts/                 # Automation scripts
│   ├── ns-ship.ts
│   ├── ns-verify.ts
│   └── ns-ship-deploy.ts
├── .env.example             # Environment template
├── .env.local               # Local overrides (gitignored)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── playwright.config.ts
└── README.md
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Request   │────▶│  Middleware │────▶│   Route     │
│  (Browser)  │     │  (Auth,     │     │  Handler    │
│             │     │   Rate Limit)│     │             │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                                │
                    ┌─────────────┐     ┌───────▼───────┐
                    │  Response   │◀────│  Business     │
                    │  (JSON/HTML)│     │  Logic        │
                    └─────────────┘     └───────┬───────┘
                                                │
                    ┌─────────────┐     ┌───────▼───────┐
                    │  Database   │────▶│  Supabase/    │
                    │  (Postgres) │     │  Stripe/      │
                    └─────────────┘     │  Brevo        │
                                        └───────────────┘
```

---

## ⌨️ Commands Reference

The Zero-Risk Stack exposes three primary commands via `package.json` scripts and a CLI wrapper.

### `/ns-ship` — Build & Scaffold

```bash
# Basic usage
pnpm ns:ship "feature description"

# Options
pnpm ns:ship "add billing page" --design-system=shadcn --with-tests --with-storybook

# What it does:
# 1. Scaffolds route, component, and API files
# 2. Generates TypeScript types from Supabase schema
# 3. Creates test files (unit + e2e)
# 4. Adds Storybook stories if requested
# 5. Updates route manifest & navigation
# 6. Runs type-check on new files only (fast)
```

**Output Example:**

```bash
$ pnpm ns:ship "add team settings page with role management"

🚀  Shipping: "add team settings page with role management"
✓  Scaffolded: src/app/(dashboard)/teams/$teamId/settings.tsx
✓  Scaffolded: src/components/teams/TeamSettingsForm.tsx
✓  Scaffolded: src/app/api/teams/$teamId/settings/route.ts
✓  Generated: src/types/teams.ts (from Supabase)
✓  Created: src/app/(dashboard)/teams/$teamId/settings.test.tsx
✓  Created: tests/e2e/teams-settings.spec.ts
✓  Updated: navigation manifest
⚡  Type-check: passed (234ms)
✨  Ready for verification! Run: pnpm ns:verify
```

### `/ns-verify` — Quality Gates

```bash
# Run all 14 gates
pnpm ns:verify

# Run specific gates
pnpm ns:verify --gates=typecheck,lint,test

# Watch mode for development
pnpm ns:verify --watch

# CI mode (non-interactive, exits with code)
pnpm ns:verify --ci
```

**The 14 Gates (see [Quality Gates](#-quality-gates-14-gates) for details):**

| #   | Gate              | Command                   | Time |
| --- | ----------------- | ------------------------- | ---- |
| 1   | TypeScript        | `tsc --noEmit`            | ~2s  |
| 2   | ESLint            | `eslint src --ext ts,tsx` | ~3s  |
| 3   | Prettier          | `prettier --check src`    | ~1s  |
| 4   | Unit Tests        | `vitest run`              | ~10s |
| 5   | E2E Tests         | `playwright test`         | ~30s |
| 6   | Build             | `pnpm build`              | ~15s |
| 7   | Bundle Size       | `bundlesize`              | ~2s  |
| 8   | Accessibility     | `axe-core`                | ~5s  |
| 9   | Contract Tests    | `pact`                    | ~8s  |
| 10  | Security Audit    | `npm audit`               | ~5s  |
| 11  | Dependency Check  | `depcheck`                | ~2s  |
| 12  | Schema Validation | `supabase db diff`        | ~3s  |
| 13  | Smoke Tests       | `pnpm test:smoke`         | ~10s |
| 14  | Design Audit      | `pnpm design:check`       | ~5s  |

### `/ns-ship-deploy` — Deploy

```bash
# Deploy to staging (preview)
pnpm ns:ship-deploy staging

# Deploy to production
pnpm ns:ship-deploy production

# Deploy with custom message
pnpm ns:ship-deploy production --message="Release v1.2.0: Team settings"

# Rollback
pnpm ns:ship-deploy rollback --to=deployment-abc123

# Options
pnpm ns:ship-deploy staging --skip-verification  # DANGER: bypasses gates
pnpm ns:ship-deploy production --canary=10       # 10% canary release
```

**Deployment Flow:**

```
staging deploy:
  1. /ns-verify (all gates must pass)
  2. Build production bundle
  3. Deploy to Vercel preview URL
  4. Run smoke tests against preview
  5. Post preview URL to PR/comment

production deploy:
  1. /ns-verify (all gates must pass)
  2. Create deployment tag (v1.2.0)
  3. Deploy to Vercel production
  4. Run smoke tests against production
  5. Verify Stripe webhooks
  6. Send deployment notification (Slack/Email)
  7. Update status badge
```

---

## 🎨 Design System Selection

The Zero-Risk Stack is **design system agnostic**. Choose at bootstrap or migrate later.

### Supported Systems

| System          | Command                       | Best For                                 | Bundle Size |
| --------------- | ----------------------------- | ---------------------------------------- | ----------- |
| **shadcn/ui**   | `--design-system=shadcn`      | Full control, Radix primitives, Tailwind | ~45kb       |
| **Radix UI**    | `--design-system=radix`       | Headless, unstyled, maximum flexibility  | ~38kb       |
| **Tailwind UI** | `--design-system=tailwind-ui` | Pre-built components, marketing sites    | ~52kb       |
| **Mantine**     | `--design-system=mantine`     | Batteries included, forms, hooks         | ~68kb       |
| **Chakra UI**   | `--design-system=chakra`      | Themeable, accessible out of box         | ~72kb       |
| **Custom**      | `--design-system=custom`      | Your own component library               | You decide  |

### Bootstrap with Design System

```bash
# At project creation
pnpm ns:new my-app --variant=b2b

# Add to existing project
pnpm ns:design-system add shadcn
pnpm ns:design-system switch radix  # Migrate (experimental)
```

### Design Tokens (Shared)

Regardless of choice, all systems consume the same token architecture:

```typescript
// src/styles/tokens.ts
export const tokens = {
  colors: {
    primary: { 50: '#f0f9ff', ..., 900: '#0c4a6e' },
    neutral: { 50: '#fafafa', ..., 950: '#030712' },
    success: { 500: '#22c55e' },
    warning: { 500: '#f59e0b' },
    error: { 500: '#ef4444' },
  },
  spacing: { 1: '4px', 2: '8px', 3: '12px', 4: '16px', ... },
  radius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', full: '9999px' },
  typography: {
    fontFamilies: { sans: 'Inter, system-ui', mono: 'JetBrains Mono' },
    fontSizes: { xs: '12px', sm: '14px', base: '16px', lg: '18px', xl: '20px' },
    fontWeights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
  shadows: { sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', ... },
  transitions: { fast: '150ms ease', normal: '200ms ease', slow: '300ms ease' },
} as const;
```

### Component Mapping

Each design system implements the same component interface:

```typescript
// src/components/ui/button.tsx (shadcn example)
import { Button as ShadcnButton } from '@/components/ui/shadcn/button';

export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof ShadcnButton> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => (
    <ShadcnButton
      ref={ref}
      variant={variant}
      size={size}
      disabled={disabled || loading}
      className={cn('transition-all', loading && 'opacity-50 cursor-wait')}
      {...props}
    >
      {loading && <Spinner className="mr-2 h-4 w-4" />}
      {children}
    </ShadcnButton>
  )
);
```

---

## ✅ Quality Gates (14 Gates)

Every commit must pass all 14 gates before merging. Gates run in parallel where possible.

### Gate Details

#### 1. TypeScript (`typecheck`)

```bash
# Command
pnpm typecheck
# or
npx tsc --noEmit --project tsconfig.json

# Validates
# - Strict mode compliance
# - No implicit any
# - Unused locals/parameters
# - Exact optional property types
# - No unchecked indexed access
```

#### 2. ESLint (`lint`)

```bash
# Command
pnpm lint

# Rules (extends)
# - eslint:recommended
# - plugin:@typescript-eslint/recommended-type-checked
# - plugin:react-hooks/recommended
# - plugin:jsx-a11y/recommended
# - prettier (formatting)
# - custom: zero-risk rules
```

#### 3. Prettier (`format`)

```bash
# Command
pnpm format:check

# Config
# - Single quotes
# - Trailing commas: es5
# - Print width: 100
# - Tab width: 2
# - Semi: true
```

#### 4. Unit Tests (`test:unit`)

```bash
# Command
pnpm test:unit

# Coverage thresholds
# - Statements: 80%
# - Branches: 70%
# - Functions: 80%
# - Lines: 80%

# Config: vitest.config.ts
```

#### 5. E2E Tests (`test:e2e`)

```bash
# Command
pnpm test:e2e

# Browser matrix
# - Chromium (Desktop)
# - Firefox (Desktop)
# - WebKit (Desktop)
# - Mobile Chrome (Pixel 5)
# - Mobile Safari (iPhone 12)

# Config: playwright.config.ts
```

#### 6. Build (`build`)

```bash
# Command
pnpm build

# Validates
# - Production build succeeds
# - No TypeScript errors
# - No runtime errors in SSR
# - Static assets generated
```

#### 7. Bundle Size (`bundlesize`)

```bash
# Command
pnpm bundlesize

# Budgets (configurable in bundlesize.config.json)
# - Main JS: < 170kb gzipped
# - Vendor JS: < 120kb gzipped
# - CSS: < 30kb gzipped
# - Total: < 350kb gzipped
```

#### 8. Accessibility (`a11y`)

```bash
# Command
pnpm test:a11y

# Checks (axe-core)
# - Color contrast (WCAG AA)
# - Keyboard navigation
# - ARIA attributes
# - Focus management
# - Heading hierarchy
# - Landmarks
# - Form labels
```

#### 9. Contract Tests (`contract`)

```bash
# Command
pnpm test:contract

# Validates
# - API request/response schemas (Zod)
# - Supabase RPC signatures
# - Stripe webhook payloads
# - Brevo email templates
# - Version compatibility
```

#### 10. Security Audit (`security`)

```bash
# Command
pnpm audit

# Checks
# - npm audit (moderate+)
# - SCA: known vulnerabilities
# - SAST: hardcoded secrets (trufflehog)
# - Dependency confusion
# - License compliance
```

#### 11. Dependency Check (`deps`)

```bash
# Command
pnpm deps:check

# Validates
# - No unused dependencies (depcheck)
# - No missing dependencies
# - No circular dependencies (madge)
# - Version consistency (workspace)
```

#### 12. Schema Validation (`schema`)

```bash
# Command
pnpm schema:validate

# Validates
# - Supabase migrations apply cleanly
# - No breaking schema changes
# - RLS policies exist for all tables
# - Indexes for foreign keys
# - Type generation matches DB
```

#### 13. Smoke Tests (`smoke`)

```bash
# Command
pnpm test:smoke

# Runs against deployed URL
# - Health endpoint: 200 OK
# - Auth flow: signup → login → session
# - Critical path: dashboard loads
# - API: /api/health, /api/user
# - Stripe: webhook endpoint responds
# - Email: test email sends
```

### Gate Summary Table

| Gate              | Parallel | Timeout | Required | Skip Flag          |
| ----------------- | -------- | ------- | -------- | ------------------ |
| TypeScript        | ✅       | 60s     | ✅       | `--skip-typecheck` |
| ESLint            | ✅       | 60s     | ✅       | `--skip-lint`      |
| Prettier          | ✅       | 30s     | ✅       | `--skip-format`    |
| Unit Tests        | ✅       | 120s    | ✅       | `--skip-unit`      |
| E2E Tests         | ❌       | 300s    | ✅       | `--skip-e2e`       |
| Build             | ❌       | 180s    | ✅       | `--skip-build`     |
| Bundle Size       | ✅       | 30s     | ⚠️       | `--skip-bundle`    |
| Accessibility     | ✅       | 60s     | ✅       | `--skip-a11y`      |
| Contract Tests    | ✅       | 60s     | ✅       | `--skip-contract`  |
| Security Audit    | ✅       | 60s     | ✅       | `--skip-security`  |
| Dependency Check  | ✅       | 30s     | ✅       | `--skip-deps`      |
| Schema Validation | ❌       | 60s     | ✅       | `--skip-schema`    |
| Smoke Tests       | ❌       | 120s    | ✅       | `--skip-smoke`     |

> ⚠️ **Bundle size is a warning gate** — fails CI but allows local override for experimentation.

### Running Gates Locally

```bash
# All gates (default)
pnpm ns:verify

# Fast feedback loop (core gates only)
pnpm ns:verify --fast  # typecheck, lint, format, unit, build

# Specific gates
pnpm ns:verify --gates=typecheck,lint,test:unit

# Watch mode
pnpm ns:verify --watch --gates=typecheck,lint

# CI mode (for GitHub Actions)
pnpm ns:verify --ci
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: Zero-Risk CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: "20"
  PNPM_VERSION: "9"

jobs:
  verify:
    name: Quality Gates
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run quality gates
        run: pnpm ns:verify --ci
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
          BREVO_API_KEY: ${{ secrets.BREVO_API_KEY }}

  deploy-staging:
    name: Deploy to Staging
    needs: verify
    if: github.ref == 'refs/heads/develop' || github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install & Build
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Deploy to Vercel (Preview)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: false

  deploy-production:
    name: Deploy to Production
    needs: verify
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install & Build
        run: |
          pnpm install --frozen-lockfile
          pnpm build

      - name: Create Release Tag
        id: tag
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "tag=v$VERSION" >> $GITHUB_OUTPUT
          git tag "v$VERSION"
          git push origin "v$VERSION"

      - name: Deploy to Vercel (Production)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: true

      - name: Run Smoke Tests
        run: pnpm test:smoke --url=https://${{ secrets.VERCEL_PROJECT_ID }}.vercel.app

      - name: Notify Deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d "{\"text\":\"🚀 Deployed v${{ steps.tag.outputs.tag }} to production\"}"
```

### Pipeline Visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CI/CD PIPELINE                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Push/PR ──▶ [Verify: 14 Gates] ──▶ Pass? ──▶ No ──▶ ❌ Block     │
│                    │                         │                     │
│                    │ Yes                     │                     │
│                    ▼                         ▼                     │
│           ┌───────────────┐         ┌───────────────┐             │
│           │ develop branch│         │  main branch  │             │
│           └───────┬───────┘         └───────┬───────┘             │
│                   │                         │                     │
│                   ▼                         ▼                     │
│         [Deploy Staging]            [Deploy Production]           │
│         (Preview URL)               (Production URL)              │
│                   │                         │                     │
│                   ▼                         ▼                     │
│         [Smoke Tests]               [Smoke Tests + Notify]        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Branch Strategy

| Branch      | Purpose          | Deploys To                | Protection                                   |
| ----------- | ---------------- | ------------------------- | -------------------------------------------- |
| `main`      | Production-ready | Production                | Required reviews, passing CI, signed commits |
| `develop`   | Integration      | Staging                   | Passing CI                                   |
| `feature/*` | Feature work     | None (local only)         | None                                         |
| `hotfix/*`  | Urgent fixes     | Production (after verify) | Fast-track review                            |
| `release/*` | Release prep     | Staging (RC)              | Passing CI, version bump                     |

---

## 🚀 Deployment Guide

### Environment Variables

```bash
# .env.example (commit this)
# .env.local (gitignored - your local overrides)
# .env.production (for CI/CD secrets)

# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://my-app.vercel.app
NEXT_PUBLIC_APP_NAME="My SaaS"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server only!

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_MONTHLY=price_...
NEXT_PUBLIC_STRIPE_PRICE_YEARLY=price_...

# Brevo
BREVO_API_KEY=xkeysib-...
BREVO_SENDER_EMAIL=noreply@myapp.com
BREVO_SENDER_NAME="My App"

# Vercel
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...

# Optional: Analytics, Error Tracking
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Supabase Setup

```bash
# 1. Create project at supabase.com
# 2. Link local development
supabase link --project-ref <project-ref>

# 3. Run migrations locally
supabase db reset

# 4. Generate types
supabase gen types typescript --local > src/types/supabase.ts

# 5. Configure Auth
# - Enable Email/Password
# - Enable OAuth (GitHub, Google)
# - Set redirect URLs
# - Configure Row Level Security

# 6. Set up Realtime
# - Enable on tables needing live updates
# - Configure publication
```

### Stripe Setup

```bash
# 1. Create account at stripe.com
# 2. Get API keys from Dashboard > Developers > API Keys
# 3. Create products & prices
#    - Monthly subscription
#    - Yearly subscription
# 4. Set up webhook endpoint
#    - URL: https://my-app.vercel.app/api/stripe/webhook
#    - Events: checkout.session.completed, customer.subscription.*, invoice.payment_failed
# 5. Configure Customer Portal
# 6. Test with Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Brevo Setup

```bash
# 1. Create account at brevo.com
# 2. Get API key from SMTP & API > API Keys
# 3. Verify sender domain
# 4. Create email templates
#    - Welcome email
#    - Password reset
#    - Invoice receipt
#    - Subscription cancelled
# 5. Test send
curl -X POST https://api.brevo.com/v3/smtp/email \
  -H "api-key: $BREVO_API_KEY" \
  -d '{"to":[{"email":"test@example.com"}],"templateId":1}'
```

### Vercel Setup

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Link project
vercel link

# 4. Configure build
# Framework preset: Next.js (auto-detected)
# Build command: pnpm build
# Output directory: .next

# 5. Add environment variables in Vercel Dashboard
# Project > Settings > Environment Variables

# 6. Custom domain (optional)
# Pages > my-app > Custom domains > Add domain
```

### Deploy Commands

```bash
# Local preview deploy
pnpm ns:ship-deploy preview

# Staging deploy (develop branch)
git push origin develop
# Or manually:
pnpm ns:ship-deploy staging

# Production deploy (main branch)
git push origin main
# Or manually:
pnpm ns:ship-deploy production

# Rollback
pnpm ns:ship-deploy rollback --to=<deployment-id>

# List deployments
pnpm ns:ship-deploy list
```

### Post-Deploy Verification

```bash
# Automated smoke tests run after every deploy
# Manual verification checklist:
# ☐ Health endpoint: https://my-app.vercel.app/api/health
# ☐ Home page loads
# ☐ Sign up flow works
# ☐ Sign in flow works
# ☐ Dashboard loads with data
# ☐ Stripe checkout completes
# ☐ Email received (check inbox/spam)
# ☐ Supabase realtime works
# ☐ Error tracking (Sentry) receives events
```

---

## 🔧 Troubleshooting

### Common Issues Table

| Issue                            | Symptoms                                       | Root Cause                                             | Solution                                                                               |
| -------------------------------- | ---------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| **TypeScript errors after pull** | `tsc --noEmit` fails with "Cannot find module" | Missing generated types or outdated `node_modules`     | `pnpm install`                                                                         |
| **Supabase types out of sync**   | Type errors on `supabase.from('table')`        | Schema changed but types not regenerated               | `supabase db reset && supabase gen types typescript --local > src/types/supabase.ts`   |
| **Stripe webhook fails**         | 400/500 on `/api/stripe/webhook`               | Wrong webhook secret or missing events                 | Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard; check event selection         |
| **Brevo emails not sending**     | No emails received, no errors in logs          | Unverified sender domain or template ID wrong          | Verify domain in Brevo; check template IDs in `src/lib/email/templates.ts`             |
| **Vercel deploy fails**          | "Build failed" in Vercel dashboard             | Build command wrong or env vars missing                | Check `package.json` build script; verify all env vars in Vercel settings              |
| **Hydration mismatch**           | "Text content does not match" in console       | Server/client render difference (date, random, window) | Use `useEffect` for client-only code; `suppressHydrationWarning` for known differences |
| **RLS policy blocks query**      | "Row level security policy violation"          | Missing or incorrect RLS policy                        | Check `supabase/policies/`; ensure `auth.uid()` matches user                           |
| **Bundle size exceeded**         | `bundlesize` gate fails                        | Large dependency added                                 | Run `pnpm analyze` to visualize; consider dynamic import or lighter alternative        |
| **E2E tests flaky**              | Playwright tests pass locally, fail in CI      | Timing issues, missing waitFor                         | Add `await expect(locator).toBeVisible()`; use `page.waitForLoadState('networkidle')`  |
| **Supabase local won't start**   | `supabase start` fails with Docker error       | Docker not running or port conflicts                   | Start Docker Desktop; `supabase stop && supabase start`                                |
| **Auth redirect loop**           | Infinite redirect between login/dashboard      | Middleware/auth config mismatch                        | Check `middleware.ts` public routes; verify `NEXT_PUBLIC_APP_URL`                      |
| **Stripe checkout returns 404**  | "No such price" error                          | Price ID mismatch or test/live mode confusion          | Use test prices with test keys; verify `NEXT_PUBLIC_STRIPE_PRICE_*` env vars           |
| **Type generation fails**        | `supabase gen types` exits with error          | Database connection issue or schema conflict           | `supabase db reset` to clean state; check migration order                              |
| **pnpm install hangs**           | Stuck on "resolving dependencies"              | Lockfile corruption or network                         | `rm pnpm-lock.yaml && pnpm install`                                                    |
| **Git hooks not running**        | Commits bypass lint/typecheck                  | Husky not installed                                    | `pnpm prepare` or `npx husky install`                                                  |

### Debugging Commands

```bash
# Full diagnostic
pnpm ns:doctor

# Check environment
pnpm ns:env:check

# Verify Supabase connection
pnpm ns:db:ping

# Test Stripe webhook locally
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-json

# Test email sending
pnpm ns:email:test --to=you@example.com

# Analyze bundle
pnpm analyze

# View CI logs locally
act -j verify  # Requires 'act' tool
```

### Error Code Reference

| Code     | Meaning                       | Action                                    |
| -------- | ----------------------------- | ----------------------------------------- |
| `ZR-001` | TypeScript compilation failed | Run `pnpm typecheck` for details          |
| `ZR-002` | ESLint violations found       | Run `pnpm lint --fix`                     |
| `ZR-003` | Prettier formatting issues    | Run `pnpm format`                         |
| `ZR-004` | Unit tests failed             | Run `pnpm test:unit --reporter=verbose`   |
| `ZR-005` | E2E tests failed              | Run `pnpm test:e2e --headed`              |
| `ZR-006` | Production build failed       | Check `pnpm build` output                 |
| `ZR-007` | Bundle size exceeded          | Run `pnpm analyze`                        |
| `ZR-008` | Accessibility violations      | Run `pnpm test:a11y --reporter=html`      |
| `ZR-009` | Contract test mismatch        | Check API schemas in `src/lib/contracts/` |
| `ZR-010` | Security vulnerabilities      | Run `pnpm audit fix`                      |
| `ZR-011` | Unused/missing dependencies   | Run `pnpm deps:check`                     |
| `ZR-012` | Schema validation failed      | Run `supabase db diff`                    |
| `ZR-013` | Smoke tests failed            | Check deployed URL manually               |

### Getting Help

```bash
# Built-in help
pnpm ns:ship --help
pnpm ns:verify --help
pnpm ns:ship-deploy --help

# Verbose output
DEBUG=1 pnpm ns:verify

# Report an issue
# https://github.com/zero-risk-saas/zero-risk-stack/issues/new
```

---

## 🤝 Contributing

### Development Setup

```bash
# Fork & clone
git clone https://github.com/your-username/zero-risk-saas.git
cd zero-risk-saas

# Install
pnpm install

# Bootstrap (sets up local Supabase, Stripe CLI, etc.)
pnpm install

# Start dev
pnpm dev
```

### Contribution Guidelines

1. **Follow Zero-Risk workflow**: Every PR must pass `/ns-verify` locally
2. **Write tests**: Unit tests for logic, E2E for user flows
3. **Update docs**: README, code comments, type definitions
4. **Conventional commits**: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
5. **Small PRs**: One feature/fix per PR, < 400 lines changed

### Pull Request Template

```markdown
## Summary

Brief description of changes

## Type

- [ ] Feature
- [ ] Bug Fix
- [ ] Documentation
- [ ] Refactor
- [ ] Test
- [ ] Chore

## Verification

- [ ] `pnpm ns:verify` passes locally
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Documentation updated

## Screenshots (if UI)

<!-- Add screenshots -->

## Breaking Changes

<!-- List any breaking changes -->
```

### Code Style

- **TypeScript**: Strict mode, no `any`, explicit return types for public APIs
- **React**: Functional components, hooks, Server Components by default
- **Testing**: Vitest for unit, Playwright for E2E, Testing Library for React
- **Commits**: Conventional Commits + semantic-release

---

## 📄 License

```
MIT License

Copyright (c) 2024 Zero-Risk SaaS Stack Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **Next.js** — For the framework, routing, and server components
- **Supabase** — For the best PostgreSQL platform
- **Vercel** — For the edge network that makes deployment instant
- **Stripe** — For payment infrastructure that just works
- **Brevo** — For reliable email delivery
- **shadcn/ui** — For beautiful, accessible components
- **The Open Source Community** — For the tools that make this possible

---

## 📚 Additional Resources

- [Zero-Risk Methodology Guide](docs/ZERO_RISK_METHODOLOGY.md)
- [API Reference](docs/API_REFERENCE.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)
- [Security Policy](SECURITY.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)

---

<div align="center">

**Built with ❤️ using the Zero-Risk methodology**

[Website](https://zero-risk-saas.dev) • [Discord](https://discord.gg/zero-risk) • [Twitter](https://twitter.com/zero_risk_saas)

</div>
