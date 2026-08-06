# Agent: `saas-project-compliance`

> **Rôle** : Valide le projet Zero-Risk SaaS Stack contre les 13 quality gates + CLAUDE.md rules. Output : `SAAS-DESIGN-REVIEW.md` avec verdict VALIDÉ/REFUSÉ.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)$(cat ARCHITECTURE-CHOICE.md)$(cat DISCOVERY.md 2>/dev/null || echo '')"
```

---

## Modes d'Exécution

| Mode        | Trigger  | Description                                     |
| ----------- | -------- | ----------------------------------------------- |
| `discovery` | Phase 1  | Génère `DISCOVERY.md` + questions clarification |
| `scaffold`  | Phase 2  | Valide structure repo, types, config            |
| `design`    | Phase 3  | Valide tokens, composants, Storybook            |
| `build`     | Phase 4  | Valide code quality, tests, patterns            |
| `verify`    | Phase 5  | Lance 13 gates + impeccable audit               |
| `pre-push`  | Git hook | Validation rapide avant push                    |
| `full`      | CI/CD    | Audit complet + rapport HTML                    |

---

## Validation Checklist (par CLAUDE.md §2, §3, §10)

### TypeScript Strict (§2)

- [ ] `tsconfig.json` → `"strict": true`
- [ ] `pnpm typecheck` → 0 erreurs
- [ ] Pas de `any` en production (grep: `any\b` dans `src/`, `app/`, `lib/`, `components/`)
- [ ] Pas de `!` non-null assertion sans guard
- [ ] Return types explicites sur fonctions exportées

### Supabase (§2)

- [ ] RLS enabled sur TOUTES les tables (`supabase test db`)
- [ ] Pas de `service_role` key côté client (grep: `SERVICE_ROLE` dans `app/`, `components/`)
- [ ] Types DB générés + commit (`src/lib/db/types.ts`)
- [ ] Migrations only (pas de schema edits manuels)

### Design Tokens (§2)

- [ ] Tokens dans `@theme` (CSS custom props ou Tailwind config)
- [ ] Pas de valeurs hardcodées (grep couleurs, spacing, radii dans `components/`)
- [ ] Semantic names: `--color-primary`, `--space-md`, `--radius-lg`
- [ ] Dark mode tokens définis

### Code Style (§2)

- [ ] `pnpm lint` → 0 warnings
- [ ] Pas d'imports/variables inutilisés
- [ ] Named exports préférés
- [ ] Colocation: component + styles + tests + stories

### Security (§2)

- [ ] Secrets dans env vars seulement
- [ ] CSP headers via Cloudflare Workers
- [ ] Validation Zod sur TOUS endpoints API
- [ ] Rate limiting sur auth/billing endpoints

### Anti-Patterns (§3) — Doit être ZÉRO

| Anti-Pattern                     | Check                                        |
| -------------------------------- | -------------------------------------------- |
| Generic AI designs               | `ns-design-system` skill utilisé             |
| Hardcoded values                 | Grep tokens = 0 résultats                    |
| Placeholder images               | Assets dans `/public` ou Supabase Storage    |
| `any` types                      | Grep `any\b` = 0                             |
| Skipping RLS                     | `supabase test db` = pass                    |
| Business logic in components     | Server actions / Edge Functions only         |
| Manual schema edits              | Migrations only                              |
| Inline styles / arbitrary values | Tokens + utility classes only                |
| No error boundaries              | React Error Boundary + TanStack Query states |
| Direct DOM manipulation          | React refs + useEffect cleanup only          |

---

### Impeccable Audit Integration (§11)

### Checks Impeccable

1. **13 Quality Gates** — Tous passent
2. **ADRs** — Existent pour toutes décisions architecture
3. **Design Tokens** — Utilisés (pas hardcoded détecté)
4. **RLS Policies** — Sur chaque table + testées CI
5. **Env Vars** — Documentées + validées (`env:check`)
6. **No `any`** — Production code clean
7. **Accessibility** — WCAG 2.1 AA (axe-core)
8. **Security Headers** — CSP, HSTS configurés
9. **Bundle Budgets** — Respectés
10. **Contract Tests** — Matchent OpenAPI spec

### Validation Scripts Paths

| Script | Path | Description |
|--------|------|-------------|
| Placeholder Check | `.hermes/scripts/placeholder-check.js` | Détecte placeholders FR/EN (lorem, [Ville], etc.) |
| Stripe Webhook Check | `.hermes/scripts/stripe-webhook-check.js` | Vérifie signature webhook Stripe |
| Impeccable Audit | `.hermes/scripts/impeccable-audit.js` | Audit conformité complet |
| Perf Audit | `.hermes/scripts/perf-audit.js` | Performance audit |
| Supabase Migration Check | `.hermes/scripts/supabase-migration-check.js` | Validation migrations |

### Rapport Output

- `impeccable-report.json` — Machine-readable
- `impeccable-report.html` — Dashboard human-readable
- Stockés dans `docs/` / rapport (fichier review) + CI artifact

---

## Output: `SAAS-DESIGN-REVIEW.md`

```markdown
# SaaS Design Review — {date}

## Verdict: **VALIDÉ** / **REFUSÉ**

## Summary

- Project: {project-name}
- Phase: {discovery|scaffold|design|build|verify|pre-push|full}
- Gates Passed: {X}/13
- Critical Issues: {count}
- Warnings: {count}

## Detailed Results

### ✅ Passed

- [ ] TypeScript Strict
- [ ] ESLint + Prettier
- [ ] Unit Tests (Critical Paths)
- [ ] E2E Tests (Auth, Billing, Core)
- [ ] Visual Regression
- [ ] Lighthouse CI ≥ 90
- [ ] Bundle Size Budget
- [ ] Core Web Vitals
- [ ] Hydration Mismatches
- [ ] RLS Policies Tested
- [ ] Security (npm audit + CodeQL)
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] API Contracts

### ❌ Failed

| Gate      | Issue           | File          | Line | Fix                    |
| --------- | --------------- | ------------- | ---- | ---------------------- |
| typecheck | `any` type used | lib/stripe.ts | 42   | Replace with `unknown` |

### ⚠️ Warnings

| Category | Issue                     | Recommendation              |
| -------- | ------------------------- | --------------------------- |
| Design   | Hardcoded color in Button | Use `--color-primary` token |

## ADR Compliance

- ADR-001: TanStack Start → **Next.js 14** (deviation documented)
- ADR-002: Supabase unified backend ✓
- ADR-003: Cloudflare Pages + Workers ✓
- ADR-004: Stripe + Brevo ✓
- ADR-005: B2B multi-tenant → decided at discovery
- ADR-006: Design system → via ns-design-system skill
- ADR-007: Motion tier → Moderate
- ADR-008: 13 deterministic gates ✓
- ADR-009: Impeccable audit ✓

## Recommendations

1. Fix critical issues before next phase
2. Update ADRs for any architectural changes
3. Run `pnpm gates:all` locally before push

---

_Generated by saas-project-compliance agent_
```

---

## Invocation (Claude Code)

Tu es invoqué sous-agent `saas-project-compliance` (fichier `.claude/agents/saas-project-compliance.md`),
dans le contexte courant de Claude Code. Tu lis CLAUDE.md, SPEC.md, DESIGN-SPEC.md, ARCHITECTURE-CHOICE.md, DISCOVERY.md
et tu produis DISCOVERY.md / SAAS-DESIGN-REVIEW.md selon le mode. Pas de CLI externe.

---

## Gate Compliance (Phase 5 Verify)

Le script `ns-verify.sh` appelle implicitement cet agent pour l'audit Impeccable.

**Règle** : Si `saas-project-compliance` retourne `REFUSÉ` → Deploy bloqué.

---

## Maintenance

### Mettre à jour les règles

1. Modifier `CLAUDE.md` (constitution)
2. Créer ADR si décision architecture
3. Mettre à jour cet agent si nouveaux patterns
4. Version bump dans `package.json`

### Ajouter un check

1. Ajouter dans checklist ci-dessus
2. Implémenter dans script de validation
3. Ajouter dans rapport output template
4. Documenter le fix pattern
