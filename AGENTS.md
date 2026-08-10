# CLAUDE.md - Zero-Risk SaaS Stack Project Conventions

> **Single source of truth** for all agents, developers, and CI/CD pipelines.
> This file defines the stack, rules, workflows, and quality gates for the project.

---

## 1. Stack Definition

| Layer                                           | Technology          | Version / Notes                                                          |
| ----------------------------------------------- | ------------------- | ------------------------------------------------------------------------ |
| **Framework**                                   | Next.js 14          | App Router, SSR, file-based routing, Vite, server actions                |
| **Database + Auth + Realtime + Edge + Storage** | Supabase            | PostgreSQL, Row Level Security (RLS) mandatory                           |
| **Hosting + Edge Runtime**                      | Vercel              | Edge runtime, preview deploys, global CDN                                |
| **Billing**                                     | Stripe              | Subscriptions, one-time, usage-based, webhooks                           |
| **Email**                                       | Brevo (Sendinblue)  | Transactional + marketing, templates, webhooks                           |
| **Design System**                               | Chosen at discovery | Linear, Vercel, Stripe, Framer, or Custom (via `ns-design-system` skill) |
| **Motion**                                      | 3 Tiers             | Minimal / Moderate / Bold → GSAP / Motion One / HyperFrames              |
| **Package Manager**                             | pnpm                | Workspace support, fast installs                                         |

---

## 2. Non-Negotiable Rules

### TypeScript

- **Strict mode**: `tsconfig.json` → `"strict": true` — **no exceptions**
- **No `any`**: Use `unknown`, generics, or proper types. `// @ts-expect-error` only with comment explaining why.
- **No `non-null assertion` (`!`)** without guard or comment.
- **Explicit return types** on all exported functions and public APIs.

### Supabase

- **RLS enabled on every table** — no exceptions. Policies must be tested in CI.
- **No `service_role` key in client code** — only in Edge Functions / Workers.
- **Type-safe database access**: `supabase gen types` → commit generated types to repo.
- **Migrations only** — no manual schema changes. Use `supabase migration new`.

### Design Tokens

- **All design tokens in `@theme`** (CSS custom properties or Tailwind theme config).
- **No hardcoded colors, spacing, radii, shadows, font sizes** in components.
- **Semantic token names**: `--color-primary`, `--space-md`, `--radius-lg`, etc.
- **Dark mode first**: Define tokens for both themes.

### Code Style

- **ESLint + Prettier** — configured in repo, run in CI.
- **No unused imports/variables** — `eslint-plugin-unused-imports`.
- **Named exports preferred** — default exports only for pages/routes.
- **Colocate files**: Component + styles + tests + stories together.

### Security

- **No secrets in code** — all via environment variables.
- **CSP headers configured via Next.js headers / Vercel.
- **Input validation** with Zod on every API endpoint.
- **Rate limiting** on auth and billing endpoints.

---

## 3. Anti-Patterns to Avoid

| Anti-Pattern                                | Why It Fails                           | Correct Approach                                         |
| ------------------------------------------- | -------------------------------------- | -------------------------------------------------------- |
| Generic AI-generated designs                | Looks like every other SaaS, low trust | Use `ns-design-system` skill → pick a real design system |
| Hardcoded values (colors, spacing, URLs)    | Breaks theming, hard to maintain       | Design tokens in `@theme` + env vars                     |
| Placeholder images / `via.placeholder.com`  | Unprofessional, breaks in production   | Real assets in `/public` or Supabase Storage             |
| `any` types / `as unknown as Type`          | Defeats TypeScript, runtime bugs       | Proper generics, type guards, `unknown` narrowing        |
| Skipping RLS policies                       | Data leaks, multi-tenant bugs          | Every table has RLS + policies tested in CI              |
| Business logic in components                | Untestable, tightly coupled            | Server actions / Edge Functions + React Query            |
| Manual Supabase schema edits                | Drift, no history, broken CI           | Migrations only (`supabase migration new`)               |
| Inline styles / Tailwind `arbitrary values` | Inconsistent, not themeable            | Design tokens + utility classes                          |
| No error boundaries / loading states        | White screens, bad UX                  | React Error Boundary + loading/error states (RSC)        |
| Direct DOM manipulation                     | Breaks SSR, hydration mismatches       | React refs + `useEffect` cleanup only                    |

---

## 4. Architecture Decisions (ADR References)

All architectural decisions are recorded as **ADRs** in `/docs/adr/`.

| ADR   | Title                                                           | Status   |
| ----- | --------------------------------------------------------------- | -------- |
| `001` | Next.js 14 as framework                                         | Accepted |
| `002` | Supabase as unified backend                                     | Accepted |
| `003` | Vercel + Workers runtime                                        | Accepted |
| `004` | Stripe for billing + Brevo for email                            | Accepted |
| `005` | B2B (Organizations) vs B2C (Single user) — decided at discovery | Pending  |
| `006` | Design system selection via `ns-design-system`                  | Pending  |
| `007` | Motion tier system (Minimal/Moderate/Bold)                      | Accepted |
| `008` | 14 deterministic quality gates (scripts, not LLM judgment)      | Accepted |
| `009` | Impeccable audit integration for compliance                     | Accepted |

> **To create a new ADR**: `npm run adr:new "Title"` → edit `/docs/adr/NNN-title.md` → commit.

---

## 5. Workflow: `/ns-ship`

The **only** way to ship features. Six phases, each with deterministic gates.

```
/ns-ship "Feature description"
```

### Phase 1: Discovery (15-30 min)

- Clarify: B2B vs B2C? Design system? Motion tier?
- Run `saas-project-compliance` agent → outputs `DISCOVERY.md`
- **Gate**: Discovery doc approved by human

### Phase 2: Scaffold (5-10 min)

- `saas-core-builder` → routes, layout, Supabase client, env schema
- `saas-auth-builder` → auth flow, RLS policies, org/team setup
- **Gate**: `npm run typecheck && npm run lint` pass

### Phase 3: Design (15-30 min)

- `design-architect` + `saas-ui-builder` → components, tokens, motion
- Uses chosen design system via `ns-design-system` skill
- **Gate**: Visual regression baseline captured (Playwright)

### Phase 4: Build (30-60 min)

- `saas-core-builder` → business logic, server actions, API
- `saas-billing-builder` → Stripe products, webhooks, portal
- `saas-auth-builder` → advanced auth (MFA, SSO, invites)
- **Gate**: Unit tests pass (`vitest run`), typecheck, lint

### Phase 5: Verify (10-20 min)

- `saas-qa-e2e` → Playwright E2E: auth, billing, core flows
- `saas-perf-auditor` → Lighthouse CI, bundle analysis, Core Web Vitals
- **Gate**: All 14 quality gates pass (see §10)

### Phase 6: Deploy (5 min)

- `vercel --prod`
- Supabase migrations applied via GitHub Actions
- Stripe/Brevo webhooks updated
- **Gate**: Smoke tests on preview URL pass

---

## 6. Commands

| Command           | Description                         | Aliases            |
| ----------------- | ----------------------------------- | ------------------ |
| `/ns-ship "desc"` | Full discovery → deploy pipeline    | `/ship`            |
| `/ns-verify`      | Run all 14 quality gates locally    | `/verify`, `/gate` |
| `/ns-ship-deploy` | Deploy only (assumes verify passed) | `/deploy`          |
| `/ns-discovery`   | Run discovery phase only            |                    |
| `/ns-scaffold`    | Run scaffold phase only             |                    |
| `/ns-design`      | Run design phase only               |                    |
| `/ns-build`       | Run build phase only                |                    |
| `/ns-qa`          | Run E2E + perf audit                |                    |

> **Implementation**: Commandes Claude Code dans `.claude/commands/` (Codex lit `AGENTS.md` + `.agents/`)

---

## 7. Agents Available

| Agent                     | Role                                             | Trigger                          |
| ------------------------- | ------------------------------------------------ | -------------------------------- |
| `design-architect`        | Design system, tokens, motion, accessibility     | `/ns-design`, `/ns-ship` phase 3 |
| `saas-ui-builder`         | Components, pages, forms, data display           | `/ns-design`, `/ns-build`        |
| `saas-auth-builder`       | Auth flows, RLS, org/team, MFA, SSO              | `/ns-scaffold`, `/ns-build`      |
| `saas-billing-builder`    | Stripe products, subscriptions, webhooks, portal | `/ns-build`                      |
| `saas-core-builder`       | Business logic, server actions, API, DB          | `/ns-scaffold`, `/ns-build`      |
| `saas-qa-e2e`             | Playwright E2E tests, visual regression          | `/ns-verify`, `/ns-qa`           |
| `saas-project-compliance` | Validates project against this CLAUDE.md         | `/ns-discovery`, pre-push        |
| `saas-perf-auditor`       | Lighthouse, bundle size, CWV, hydration          | `/ns-verify`, `/ns-qa`           |

> **Agent invocation**: Claude Code délègue au sous-agent via l'outil Agent (`.claude/agents/<agent>.md`).
> Tous les agents lisent ce CLAUDE.md + `DISCOVERY.md` en contexte.

---

## 8. Skills Available

### Project-Specific Skills

| Skill                | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `saas-design-system` | Token architecture, component specs, design token sync |
| `saas-architecture`  | ADR templates, decision log, architecture diagrams     |

### Creative Skills (from registry)

| Skill                  | Purpose                                                                   |
| ---------------------- | ------------------------------------------------------------------------- |
| `popular-web-designs`  | 54 real design systems (Linear, Vercel, Stripe, Framer, etc.) as HTML/CSS |
| `ckm:design-system`    | Token architecture, component specifications, slide generation            |
| `ckm:ui-styling`       | Beautiful, accessible UIs with shadcn/ui + Tailwind                       |
| `ckm:slides`           | Strategic HTML presentations with Chart.js                                |
| `baoyu-infographic`    | Infographics: 21 layouts × 21 styles                                      |
| `architecture-diagram` | Dark-themed SVG architecture/cloud/infra diagrams                         |

> **Load skill**: `skill_view(name="saas-design-system")` or via agent context.

---

## 9. Environment Variables

### Required (all environments)

```bash
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # Server-only (Edge Functions, Workers)
SUPABASE_DB_URL=                    # For migrations (postgresql://...)

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Brevo
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=

# Vercel
# VERCEL_ORG_ID= (Vercel project org ID)
VERCEL_TOKEN=...          # For vercel deploy
```

### Optional / Feature Flags

```bash
# Auth
ENABLE_MFA=true
ENABLE_SSO=false
SSO_PROVIDERS=google,github,microsoft

# Billing
STRIPE_BILLING_PORTAL_URL=
ENABLE_USAGE_BASED_BILLING=false

# Email
BREVO_TEMPLATE_WELCOME_ID=
BREVO_TEMPLATE_INVOICE_ID=

# Feature flags
FLAG_NEW_DASHBOARD=false
FLAG_TEAM_INVITES=true
```

### Local Development (`.env.local`)

```bash
# Copy from .env.example → fill in values
# NEVER commit .env.local
```

> **Validation**: `npm run env:check` runs at scaffold + build + deploy.

---

## 10. Useful Commands

### Development

```bash
# Start dev server (Next.js)
npm run dev

# Type-check (tsc --noEmit)
npm run typecheck

# Lint (ESLint + Prettier)
npm run lint

# Format (Prettier --write)
npm run format

# Run unit tests (Vitest)
npm run test

# Run unit tests with UI
npm run test:ui

# Generate Supabase types from local DB
npm run supabase:gen:types

# Start Supabase local stack
npm run supabase:start

# Apply migrations locally
npm run supabase:migrate:up

# Vercel Workers dev (Wrangler)
npx vercel dev

# Deploy to Vercel preview
npm run deploy:preview
```

### Quality Gates (14 Gates)

```bash
# Run all gates (called by /ns-verify)
npm run gates:all

# Individual gates
npm run gate:typecheck      # 1. TypeScript strict pass
npm run gate:lint           # 2. ESLint + Prettier pass
npm run gate:test           # 3. Unit tests pass (100% critical paths)
npm run gate:e2e            # 4. Playwright E2E pass
npm run gate:visual         # 5. Visual regression pass
npm run gate:lighthouse     # 6. Lighthouse CI ≥ 90 all categories
npm run gate:bundle         # 7. Bundle size < budget (gzipped)
npm run gate:cwv            # 8. Core Web Vitals pass (LCP, INP, CLS)
npm run gate:hydration      # 9. No hydration mismatches
npm run gate:rls            # 10. RLS policies tested (supabase test)
npm run gate:security       # 11. npm audit + SAST (CodeQL)
npm run gate:accessibility  # 12. axe-core WCAG 2.1 AA
npm run gate:contracts      # 13. API contract tests (Pact/OpenAPI)
npm run gate:design         # 14. Design audit (tokens, coverage, Impeccable)
```

### Database

```bash
# New migration
supabase migration new <name>

# Reset local DB + apply all migrations
supabase db reset

# Push local migrations to remote
supabase db push

# Generate types from remote
supabase gen types typescript --project-id <ref> > src/lib/db/types.ts
```

### Deployment

```bash
# Full deploy (runs gates first)
/ns-ship-deploy

# Preview deploy only
vercel --preview

# Production deploy
vercel --prod
```

---

## 11. Impeccable Audit Integration

**Impeccable** = deterministic compliance audit (not LLM-based).

### Integration Points

1. **Pre-push hook** → runs `saas-project-compliance` agent
2. **CI pipeline** → `npm run gates:all` + impeccable report
3. **Deploy gate** → impeccable score ≥ 95 required

### What Impeccable Checks

- All 14 quality gates pass
- ADRs exist for all architectural decisions
- Design tokens used (no hardcoded values detected)
- RLS policies on every table + tested
- Environment variables documented + validated
- No `any` types in production code
- Accessibility WCAG 2.1 AA
- Security headers (CSP, HSTS, etc.)
- Bundle budgets met
- Contract tests match OpenAPI spec

### Reports

- `impeccable-report.json` → machine-readable
- `impeccable-report.html` → human-readable dashboard
- Stored in `docs/`/review + uploaded as CI artifact

---

## 12. Git Hooks

### Pre-commit (`.husky/pre-commit`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Fast checks only
npm run lint -- --max-warnings=0
npm run typecheck
```

### Pre-push (`.husky/pre-push`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# FULL QUALITY GATES - BLOCKS PUSH ON FAILURE
echo "🔒 Running pre-push quality gates..."
npm run gates:all

# Contrôle fail-closed : le hook pre-push bloque si REVIEW.md dit "À REVOIR"
# (voir .husky/pre-push) — pas de CLI externe.

# Exit code propagates → push blocked if any gate fails
```

### Commit Message Hook (`.husky/commit-msg`)

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Conventional commits enforced
npx commitlint --edit "$1"
```

### Install Hooks

```bash
npm run prepare  # Runs husky install
```

---

## 13. Project Structure

```
├── .claude/
│   ├── commands/           # /ns-* command implementations (Claude Code)
│   ├── agents/             # Sous-agents (ns-reviewer, saas-*-builder, design-architect...)
│   ├── skills/             # Skills ns-* (SKILL.md, portables)
│   └── hooks/ scripts/     # Hooks + scripts de la pipeline
├── .husky/                 # Git hooks
├── docs/
│   └── adr/                # Architecture Decision Records
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router routes (file-based)
│   │   ├── (auth)/         # Auth layout group
│   │   ├── (app)/          # App layout group
│   │   └── api/            # API routes (Edge Functions)
│   ├── components/         # Shared UI components
│   │   ├── ui/             # Design system primitives
│   │   ├── forms/          # Form components
│   │   └── data-display/   # Tables, charts, etc.
│   ├── lib/
│   │   ├── supabase/       # Supabase client + helpers
│   │   ├── stripe/         # Stripe helpers
│   │   ├── brevo/          # Brevo helpers
│   │   ├── auth/           # Auth utilities
│   │   ├── db/             # Database types (generated)
│   │   ├── utils/          # Shared utilities
│   │   └── theme/          # Design tokens (@theme)
│   ├── hooks/              # Custom React hooks
│   ├── server/             # Server-only code (actions, utils)
│   └── styles/             # Global CSS, Tailwind config
├── supabase/
│   ├── migrations/         # SQL migrations
│   ├── seed/               # Seed data
│   └── config.toml         # Supabase config
├── tests/
│   ├── unit/               # Vitest unit tests
│   ├── e2e/                # Playwright E2E tests
│   ├── visual/             # Visual regression baselines
│   └── contracts/          # API contract tests
├── vercel.json             # Vercel config (headers, redirects, rewrites)
├── package.json
├── tsconfig.json
├── eslint.config.js
├── prettier.config.js
├── vitest.config.ts
├── playwright.config.ts
├── lighthouse-ci.json
└── CLAUDE.md               # THIS FILE
```

---

## 14. Quick Reference: Agent Prompts

When delegating to a sub-agent (Claude Code), always pass context:

```bash
# Discovery → sous-agent saas-project-compliance
Claude Code : "Invoque le sous-agent 'saas-project-compliance' en mode discovery.
Contexte : CLAUDE.md + DISCOVERY.md. Produis SPEC.md, ARCHITECTURE-CHOICE.md, DESIGN-CHOICE.md."

# Design → sous-agent design-architect
Claude Code : "Invoque 'design-architect'. Contexte : CLAUDE.md + DISCOVERY.md.
Tâche : concevoir le design system du SaaS (tokens, élément signature)."

# Build → sous-agent saas-core-builder
Claude Code : "Invoque 'saas-core-builder'. Contexte : CLAUDE.md + DISCOVERY.md.
Tâche : 'Implémenter le flux d'invitation d'équipe avec RLS'."
```

---

## 15. Escalation & Overrides

| Situation                                       | Action                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------- |
| Gate fails but must ship                        | **Human approval required** → document in ADR + create follow-up ticket |
| Design system not covered by `ns-design-system` | Build custom tokens + élément signature dans le skill                   |
| New provider needed (e.g., different email)     | Add ADR → update CLAUDE.md → update agents                              |
| TypeScript strict blocks valid pattern          | `// @ts-expect-error` with comment + GitHub issue                       |

---

**Last Updated**: 2026-08-02
**Version**: 1.0.0
**Maintainers**: Solo founder + Claude Code agents

> This file is the **constitution** of the project. All agents, CI, and developers MUST follow it. Changes require ADR + human approval.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
