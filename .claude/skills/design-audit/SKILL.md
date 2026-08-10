---
name: design-audit
description: Deterministic design audit skill. Wraps Impeccable semantic audit + custom scripts for hardcoded value detection, token drift, component inventory. Gate #14 in ns-verify.
---

# Design Audit — Deterministic + Semantic

> **Purpose**: Single gate (`design:check`) that runs 3 scripts + Impeccable. Fails on ANY hardcoded value, token drift, or semantic violation.

---

## Architecture

```
.claude/scripts/
├── design-tokens-audit.js    # Detect hardcoded colors/spacing/radii in components
├── design-inventory.js       # Inventory: components, tokens used, coverage %
├── design-check.js           # Orchestrator — runs all 3, outputs DESIGN-AUDIT.md
```

```bash
# Single command in CI (gate #14)
pnpm design:check
```

---

## Script 1: design-tokens-audit.js

**Detects**: Any hardcoded design value in `src/components/`, `src/app/`, `src/lib/`

```javascript
// Checks for:
// - Hex colors: #abc, #abcdef, #aabbccdd
// - RGB/RGBA: rgb(), rgba()
// - Arbitrary Tailwind: bg-[#abc], p-[12px], rounded-[8px]
// - Hardcoded spacing: px-4, py-2 (if not using --space-* tokens)
// - Hardcoded radii: rounded-lg, rounded-xl (if not using --radius-* tokens)
// - Hardcoded shadows: shadow-md, shadow-lg (if not using --shadow-* tokens)
// - Font sizes: text-lg, text-xl (if not using --font-size-* tokens)
```

**Exit codes**: 0 = clean, 1 = violations found

**Output**: `design-tokens-audit.json` + console report

---

## Script 2: design-inventory.js

**Generates**: Complete inventory of design system usage

```json
{
  "components": {
    "total": 47,
    "usingTokens": 45,
    "violations": 2,
    "coverage": "95.7%"
  },
  "tokens": {
    "defined": 156,
    "used": 89,
    "unused": 67,
    "coverage": "57.1%"
  },
  "byCategory": {
    "color": { "defined": 48, "used": 32 },
    "spacing": { "defined": 24, "used": 18 },
    "typography": { "defined": 12, "used": 8 },
    "radius": { "defined": 8, "used": 6 },
    "shadow": { "defined": 6, "used": 4 },
    "motion": { "defined": 10, "used": 3 }
  },
  "files": [
    {
      "path": "src/components/ui/Button.tsx",
      "tokensUsed": 12,
      "violations": 0
    },
    { "path": "src/components/ui/Card.tsx", "tokensUsed": 8, "violations": 0 }
  ]
}
```

**Use cases**:

- CI: Fail if `coverage < 90%` for components using tokens
- CI: Warn if `token unused > 50%` (bloat detection)
- Designer handoff: See what's actually used

---

## Script 3: design-check.js (Orchestrator)

```bash
node .claude/scripts/design-check.js
```

**Runs in sequence**:

1. `design-tokens-audit.js` → must pass (exit 0)
2. `design-inventory.js` → must meet thresholds
3. `impeccable` semantic audit (if available) → score ≥ 95

**Outputs**:

- `DESIGN-AUDIT.md` — Human-readable report
- `design-audit.json` — Machine-readable for CI

**Thresholds (configurable via `.design-auditrc.json`)**:

```json
{
  "minComponentTokenCoverage": 90,
  "maxUnusedTokenRatio": 0.5,
  "impeccableMinScore": 95,
  "failOnHardcodedValues": true
}
```

---

## Impeccable Integration (Semantic Layer)

> **Impeccable** = deterministic compliance audit (not LLM-based). Already part of your stack per CLAUDE.md §11.

### What Impeccable Checks (Design-Relevant)

- Design tokens used (no hardcoded values detected)
- Accessibility WCAG 2.1 AA
- Color contrast ratios
- Semantic HTML structure
- Focus management
- Motion respects `prefers-reduced-motion`

### How We Wrap It

```bash
# In design-check.js
const impeccableResult = await runCommand('npx impeccable audit --format=json');
if (impeccableResult.score < config.impeccableMinScore) {
  fail(`Impeccable score ${impeccableResult.score} < ${config.impeccableMinScore}`);
}
```

**If Impeccable not installed**: Script logs warning but doesn't fail (optional dependency).

---

## CI Integration (Gate #14)

Add to `package.json`:

```json
{
  "scripts": {
    "design:tokens:audit": "node .claude/scripts/design-tokens-audit.js",
    "design:inventory": "node .claude/scripts/design-inventory.js",
    "design:check": "node .claude/scripts/design-check.js",
    "gates:all": "pnpm gate:typecheck && pnpm gate:lint && ... && pnpm design:check"
  }
}
```

Add to `ns-verify.sh` (Phase 5):

```bash
# Gate 14: Design Audit
echo "🎨 Gate 14: Design Audit"
pnpm design:check || exit 1
```

---

## Configuration (`.design-auditrc.json` at repo root)

```json
{
  "minComponentTokenCoverage": 90,
  "maxUnusedTokenRatio": 0.5,
  "impeccableMinScore": 95,
  "failOnHardcodedValues": true,
  "includePaths": [
    "src/components/**/*.tsx",
    "src/app/**/*.tsx",
    "src/lib/**/*.ts"
  ],
  "excludePaths": [
    "**/*.stories.tsx",
    "**/*.test.tsx",
    "**/tokens/**",
    "**/build/**"
  ],
  "allowedHardcoded": [
    "transparent",
    "currentColor",
    "inherit",
    "initial",
    "unset"
  ]
}
```

---

## Output: DESIGN-AUDIT.md (Example)

```markdown
# Design Audit Report

**Project**: saas-zero
**Date**: 2026-08-08
**Status**: ✅ PASSED

---

## Gate Results

| Check                     | Status  | Details                       |
| ------------------------- | ------- | ----------------------------- |
| Hardcoded Values          | ✅ PASS | 0 violations in 47 components |
| Component Token Coverage  | ✅ PASS | 95.7% (threshold: 90%)        |
| Token Usage Efficiency    | ⚠️ WARN | 57.1% used (67 unused tokens) |
| Impeccable Semantic Score | ✅ PASS | 97/100 (threshold: 95)        |

---

## Violations (if any)

None.

---

## Token Inventory Summary

- **Total tokens defined**: 156
- **Tokens used in components**: 89
- **Unused tokens**: 67 (consider cleanup)
- **Coverage by category**:
  - Color: 32/48 used
  - Spacing: 18/24 used
  - Typography: 8/12 used
  - Radius: 6/8 used
  - Shadow: 4/6 used
  - Motion: 3/10 used

---

## Recommendations

1. Remove 67 unused tokens from `tokens/core.json` to reduce bloat
2. Motion tokens underutilized — consider applying to more components
3. All critical paths covered by design tokens ✅
```

---

## Quick Reference for Agents

```text
# design-architect (after building design system)
"Exécute pnpm design:check — doit passer à 100%.
Si violations: corrige les composants concernés.
Output: DESIGN-AUDIT.md validé."

# saas-ui-builder (during component creation)
"AVANT de commit: pnpm design:tokens:audit
Zéro tolérance pour valeurs hardcodées.
Utilise var(--color-*), var(--space-*), var(--radius-*)."
```

---

## Dependencies

```bash
# Required
npm i -D glob fast-glob

# Optional (for Impeccable wrapper)
npm i -D impeccable  # if available/published
```

---

## Related Skills

- `design-system` — Style Dictionary token pipeline
- `design-principles` — Anti-generic rules (signature element, motion tier)
- `media-sourcing` — Real images (no placeholders)

---

_Skill `design-audit` v1.0 — Pipeline saas-zero_
