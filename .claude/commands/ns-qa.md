# `/ns-qa` — Phase 5 : Verify (Quality Gates)

> **Objectif** : 14 gates déterministes — zéro jugement subjectif, tout par scripts.

---

## Usage

```bash
/ns-qa
# ou
/ns-verify
# ou
pnpm gates:all
```

> **Prérequis** : Phase 4 Build terminée, `pnpm build` passe.

---

## Exécution

```bash
# Via script unifié (recommandé)
./.claude/commands/ns-verify.sh

# Ou gates individuels
pnpm gate:typecheck
pnpm gate:lint
pnpm gate:test
pnpm gate:e2e
pnpm gate:visual
pnpm gate:lighthouse
pnpm gate:bundle
pnpm gate:cwv
pnpm gate:hydration
pnpm gate:rls
pnpm gate:security
pnpm gate:accessibility
pnpm gate:contracts
```

---

## 14 Gates (Scripts dans `package.json`)

| #   | Gate                 | Commande                                               | Critère de Succès                   |
| --- | -------------------- | ------------------------------------------------------ | ----------------------------------- |
| 1   | `gate:typecheck`     | `tsc --noEmit`                                         | 0 erreurs TypeScript strict         |
| 2   | `gate:lint`          | `next lint --max-warnings=0`                           | 0 warnings ESLint/Prettier          |
| 3   | `gate:test`          | `vitest run --coverage`                                | 100% critical paths couverts        |
| 4   | `gate:e2e`           | `playwright test`                                      | Auth, Billing, Core journey passent |
| 5   | `gate:visual`        | `playwright test --config=playwright.visual.config.ts` | 0 régressions vs baselines          |
| 6   | `gate:lighthouse`    | `lighthouse-ci`                                        | ≥ 90 Perf/A11y/BP/SEO               |
| 7   | `gate:bundle`        | `next build && analyze`                                | < budget gzipped (100KB first load) |
| 8   | `gate:cwv`           | `web-vitals` + Lighthouse                              | LCP<2.5s, INP<200ms, CLS<0.1        |
| 9   | `gate:hydration`     | `next build` + check                                   | 0 hydration mismatches              |
| 10  | `gate:rls`           | `supabase test db`                                     | Toutes policies RLS passent         |
| 11  | `gate:security`      | `npm audit --audit-level=high` + `codeql`              | 0 critical/high vulnerabilities     |
| 12  | `gate:accessibility` | `axe-core`                                             | WCAG 2.1 AA                         |
| 13  | `gate:contracts`     | `pact` / OpenAPI                                       | Contracts matchent spec             |
| 14  | `gate:design`        | `pnpm design:check`                                    | Tokens, couverture, Impeccable ≥ 95 |

---

## Détail Gates Critiques

### Gate 3 : Unit Tests (`gate:test`)

```bash
pnpm test -- --coverage
```

- **Critical paths** : auth helpers, stripe utils, content fetch, form validation
- **Seuil** : 100% sur fichiers `lib/**/*.ts`, `app/**/actions/*.ts`

### Gate 4 : E2E (`gate:e2e`)

```bash
pnpm test:e2e
```

**Scénarios obligatoires** (`tests/e2e/`):

1. **Auth** : login → dashboard → logout | register → email verify → login | magic link | password reset
2. **Billing** : pricing → checkout → success → portal → cancel subscription
3. **Core** : dashboard load → team invite → accept → settings → api keys CRUD

### Gate 5 : Visual Regression (`gate:visual`)

```bash
pnpm test:visual
```

- Config : `playwright.visual.config.ts`
- Baselines : `tests/visual/baselines/`
- Threshold : 0.1% pixel diff
- Update : `pnpm test:visual -- --update-snapshots`

### Gate 6 : Lighthouse CI (`gate:lighthouse`)

```bash
pnpm gate:lighthouse
```

- Config : `lighthouse-ci.json`
- URLs testées : `/`, `/fr/blog`, `/fr/connexion`, `/fr/tableau-de-bord`
- Budgets : Perf≥90, A11y≥90, BP≥90, SEO≥90

### Gate 10 : RLS (`gate:rls`)

```bash
pnpm gate:rls
```

- Lance `supabase test db` sur migrations
- Chaque table avec RLS = policies testées (select, insert, update, delete)
- Multi-tenant : org isolation vérifiée

### Gate 11 : Security (`gate:security`)

```bash
pnpm gate:security
```

- `npm audit --audit-level=high` : 0 high/critical
- CodeQL SAST : GitHub Action ou local `codeql database analyze`

### Gate 12 : Accessibility (`gate:accessibility`)

```bash
pnpm gate:accessibility
```

- `axe-core` sur pages rendues (Playwright + axe)
- WCAG 2.1 AA : contraste, focus, ARIA, landmarks, labels

### Gate 13 : Contracts (`gate:contracts`)

```bash
pnpm gate:contracts
```

- OpenAPI spec : `docs/openapi.yaml`
- Tests Pact ou `zod-to-openapi` validation
- API routes matchent spec exactement

---

## Gate Verify — Règle d'Or

| Résultat                | Action                          |
| ----------------------- | ------------------------------- |
| **Tous les 14 passent** | ✓ → Phase 6 Deploy              |
| **Un seul échoue**      | ❌ STOP → Fix → Re-run `/ns-qa` |

**Pas de "presque", pas de "waiver" — gates sont déterministes.**

---

## Résumé Visuel (sortie `ns-verify.sh`)

```
═══════════════════════════════════════════════════════════════
  Zero-Risk SaaS Stack — Quality Gate Verification
═══════════════════════════════════════════════════════════════

▶ Running: TypeScript strict
  Command: pnpm run gate:typecheck
✓ PASS: TypeScript strict

▶ Running: ESLint + Prettier
  Command: pnpm run gate:lint
✓ PASS: ESLint + Prettier

...

═══════════════════════════════════════════════════════════════
  Summary
═══════════════════════════════════════════════════════════════

✓ TypeScript strict
✓ ESLint + Prettier
✓ Unit tests (100% critical paths)
✓ Playwright E2E (auth, billing, core)
✓ Visual regression
✓ Lighthouse CI ≥90 all categories
✓ Bundle size budget
✓ Core Web Vitals (LCP, INP, CLS)
✓ No hydration mismatches
✓ RLS policies tested
✓ Security (npm audit + CodeQL)
✓ Accessibility (axe-core WCAG 2.1 AA)
✓ API contract tests
✓ Design audit (tokens, coverage, Impeccable)

All 14 quality gates passed! 🎉
```

---

## Dépannage Rapide

| Gate          | Problème Fréquent            | Fix                                                    |
| ------------- | ---------------------------- | ------------------------------------------------------ |
| typecheck     | Import manquant / type `any` | Ajouter types, remplacer `any` par `unknown`           |
| lint          | Import inutilisé / Prettier  | `pnpm lint:fix`                                        |
| test          | Couverture < 100%            | Ajouter tests sur chemins critiques                    |
| e2e           | Flaky test / timeout         | `await expect(page).toHaveURL()` + timeouts réalistes  |
| visual        | Baseline obsolète            | `--update-snapshots` après validation visuelle         |
| lighthouse    | Perf < 90                    | Optimiser images, fonts, bundle, CWV                   |
| bundle        | > 100KB gzipped              | Dynamic imports, tree-shaking, analyzer                |
| cwv           | LCP/INP/CLS fail             | `next/image`, `font-display: swap`, layout shift fixes |
| hydration     | Mismatch serveur/client      | `suppressHydrationWarning` uniquement si justifié      |
| rls           | Policy fail                  | Vérifier `auth.uid()` dans policy, tester en SQL       |
| security      | Vulnérabilité high           | `pnpm audit fix` ou mettre à jour dépendance           |
| accessibility | axe violations               | Corriger contraste, labels, ARIA, focus visible        |
| contracts     | Spec drift                   | Régénérer OpenAPI depuis code, valider                 |

---

## CI/CD Integration

Le script `ns-verify.sh` est appelé dans `.github/workflows/ci.yml` :

```yaml
- name: Quality Gates
  run: ./.claude/commands/ns-verify.sh
```

**Push bloqué** si un gate échoue (via pre-push hook + CI).
