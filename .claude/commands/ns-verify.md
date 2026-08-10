---
name: ns-verify
description: Run all 14 quality gates for the Zero-Risk SaaS Stack
category: verification
---

# ns-verify — Auto-verification Command

Run all 14 quality gates plus additional checks. Exit code 0 = all pass, non-zero = failure with details.

## Usage

```bash
# Run all gates
/ns-verify

# Run specific gate(s)
/ns-verify --gate=typecheck
/ns-verify --gate=lint,test,e2e
/ns-verify --gate=all --skip=visual  # skip specific gates
```

## Quality Gates (14 Core)

| #   | Gate              | Command                      | Description                                 |
| --- | ----------------- | ---------------------------- | ------------------------------------------- |
| 1   | **typecheck**     | `npm run gate:typecheck`     | TypeScript strict mode pass                 |
| 2   | **lint**          | `npm run gate:lint`          | ESLint + Prettier pass                      |
| 3   | **test**          | `npm run gate:test`          | Unit tests pass                             |
| 4   | **e2e**           | `npm run gate:e2e`           | Playwright E2E tests pass                   |
| 5   | **visual**        | `npm run gate:visual`        | Visual regression tests pass                |
| 6   | **lighthouse**    | `npm run gate:lighthouse`    | Lighthouse CI ≥ 90 all categories           |
| 7   | **bundle**        | `npm run gate:bundle`        | Bundle size < budget                        |
| 8   | **cwv**           | `npm run gate:cwv`           | Core Web Vitals pass                        |
| 9   | **hydration**     | `npm run gate:hydration`     | No hydration mismatches                     |
| 10  | **rls**           | `npm run gate:rls`           | RLS policies tested                         |
| 11  | **security**      | `npm run gate:security`      | npm audit + SAST                            |
| 12  | **accessibility** | `npm run gate:accessibility` | axe-core WCAG 2.1 AA                        |
| 14  | **design**        | `npm run gate:design`        | Design audit (tokens, coverage, Impeccable) |

## Additional Checks

| Check              | Command                        | Description                               |
| ------------------ | ------------------------------ | ----------------------------------------- |
| **audit**          | `npm run check:audit`          | Impeccable audit (no high/critical vulns) |
| **placeholder**    | `npm run check:placeholder`    | Placeholder content detection             |
| **stripe-webhook** | `npm run check:stripe-webhook` | Stripe webhook signature verification     |

## Implementation

```bash
#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

GATES=(
  "typecheck:TypeScript strict"
  "lint:ESLint + Prettier"
  "test:Unit tests"
  "e2e:Playwright E2E"
  "visual:Visual regression"
  "lighthouse:Lighthouse CI ≥90"
  "bundle:Bundle size budget"
  "cwv:Core Web Vitals"
  "hydration:No hydration mismatches"
  "rls:RLS policies"
  "security:npm audit + SAST"
  "accessibility:axe-core WCAG 2.1 AA"
  "contracts:API contracts"
  "design:Design audit (tokens, coverage, Impeccable)"
)

ADDITIONAL=(
  "audit:Impeccable audit"
  "placeholder:Placeholder check"
  "stripe-webhook:Stripe webhook check"
)

SELECTED_GATES=()
SKIP_GATES=()
RUN_ADDITIONAL=true

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --gate=*)
      IFS=',' read -ra SELECTED_GATES <<< "${1#*=}"
      shift
      ;;
    --skip=*)
      IFS=',' read -ra SKIP_GATES <<< "${1#*=}"
      shift
      ;;
    --no-additional)
      RUN_ADDITIONAL=false
      shift
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Determine which gates to run
RUN_GATES=()
if [[ ${#SELECTED_GATES[@]} -eq 0 || "${SELECTED_GATES[0]}" == "all" ]]; then
  for gate in "${GATES[@]}"; do
    name="${gate%%:*}"
    if [[ ! " ${SKIP_GATES[*]} " =~ " ${name} " ]]; then
      RUN_GATES+=("$name")
    fi
  done
else
  for gate in "${SELECTED_GATES[@]}"; do
    if [[ ! " ${SKIP_GATES[*]} " =~ " ${gate} " ]]; then
      RUN_GATES+=("$gate")
    fi
  done
fi

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Zero-Risk SaaS Stack — Quality Gate Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

FAILED=()
PASSED=()

run_gate() {
  local name=$1
  local label=$2
  local cmd="npm run gate:$name"

  echo -e "${YELLOW}▶ Running: $label${NC}"
  echo -e "  Command: $cmd"
  echo ""

  if eval "$cmd"; then
    echo -e "${GREEN}✓ PASS: $label${NC}"
    PASSED+=("$label")
  else
    echo -e "${RED}✗ FAIL: $label${NC}"
    FAILED+=("$label")
  fi
  echo ""
}

# Run selected gates
for gate in "${RUN_GATES[@]}"; do
  # Find label
  label=""
  for g in "${GATES[@]}"; do
    if [[ "${g%%:*}" == "$gate" ]]; then
      label="${g#*:}"
      break
    fi
  done
  run_gate "$gate" "$label"
done

# Run additional checks
if [[ "$RUN_ADDITIONAL" == true ]]; then
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo -e "${BLUE}  Additional Checks${NC}"
  echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
  echo ""

  for check in "${ADDITIONAL[@]}"; do
    name="${check%%:*}"
    label="${check#*:}"
    cmd="npm run check:$name"
    run_gate "$name" "$label"
  done
fi

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

for pass in "${PASSED[@]}"; do
  echo -e "${GREEN}✓ $pass${NC}"
done

for fail in "${FAILED[@]}"; do
  echo -e "${RED}✗ $fail${NC}"
done

echo ""
if [[ ${#FAILED[@]} -eq 0 ]]; then
  echo -e "${GREEN}All checks passed! 🎉${NC}"
  exit 0
else
  echo -e "${RED}${#FAILED[@]} check(s) failed.${NC}"
  exit 1
fi
```

## Package.json Scripts Required

Add these to your `package.json`:

```json
{
  "scripts": {
    "gate:typecheck": "tsc --noEmit",
    "gate:lint": "eslint . --ext .ts,.tsx && prettier --check .",
    "gate:test": "vitest run",
    "gate:e2e": "playwright test",
    "gate:visual": "playwright test --project=visual",
    "gate:lighthouse": "lhci autorun",
    "gate:bundle": "bundlesize",
    "gate:cwv": "web-vitals-ci",
    "gate:hydration": "npm run build && node scripts/check-hydration.js",
    "gate:rls": "supabase db test",
    "gate:security": "npm audit --audit-level=high && semgrep --config=auto",
    "gate:accessibility": "axe-cli http://localhost:3000",
    "gate:contracts": "pactum test",
    "check:audit": "npm audit --audit-level=critical",
    "check:placeholder": "node scripts/check-placeholders.js",
    "check:stripe-webhook": "stripe verify-webhook",
    "verify": "bash .claude/commands/ns-verify.sh",
    "verify:all": "bash .claude/commands/ns-verify.sh --gate=all",
    "verify:ci": "bash .claude/commands/ns-verify.sh --gate=all --no-additional"
  }
}
```

## CI/CD Integration

```yaml
# .github/workflows/verify.yml
name: Quality Gates
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npm run verify:ci
```
