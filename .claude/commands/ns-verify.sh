#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 14 Quality Gates (matching ns-ship.md Phase 5)
GATES=(
  "typecheck:TypeScript strict"
  "lint:ESLint + Prettier"
  "test:Unit tests (100% critical paths)"
  "e2e:Playwright E2E (auth, billing, core)"
  "visual:Visual regression (Playwright)"
  "lighthouse:Lighthouse CI ≥90 all categories"
  "bundle:Bundle size budget"
  "cwv:Core Web Vitals (LCP, INP, CLS)"
  "hydration:No hydration mismatches"
  "rls:RLS policies tested"
  "security:npm audit + CodeQL SAST"
  "accessibility:axe-core WCAG 2.1 AA"
  "contracts:API contract tests"
  "design:Design audit (tokens, coverage, Impeccable)"
)

SELECTED_GATES=()
SKIP_GATES=()

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
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--gate=typecheck,lint] [--skip=e2e]"
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
  local cmd="pnpm run gate:$name"

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
  echo -e "${GREEN}All 14 quality gates passed! 🎉${NC}"
  exit 0
else
  echo -e "${RED}${#FAILED[@]} gate(s) failed.${NC}"
  exit 1
fi