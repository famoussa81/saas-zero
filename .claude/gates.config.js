/**
 * gates.config.js
 * ---------------
 * Registre déclaratif des quality gates.
 *
 * Chaque gate déclare ses PRÉREQUIS. Le runner (.claude/scripts/run-gates.js)
 * les sonde avant d'exécuter :
 *
 *   PASS  le gate a tourné et réussi
 *   FAIL  le gate a tourné et trouvé un vrai problème  → bloquant
 *   SKIP  un prérequis manque → non bloquant, avec la commande d'installation
 *
 * Aucun gate ne doit jamais « passer » sans avoir tourné. Un `|| echo skipping`
 * dans une commande npm est un faux succès : le runner refuse ce pattern en
 * rendant le SKIP explicite et visible dans le résumé.
 */

module.exports = [
  // ---- Toujours exécutables (aucun prérequis externe) ----------------------
  {
    id: "discovery",
    n: 0,
    name: "Discovery complète",
    command: "pnpm discovery:check",
    requires: [],
  },
  {
    id: "typecheck",
    n: 1,
    name: "TypeScript strict",
    command: "pnpm typecheck",
    requires: [],
  },
  {
    id: "lint",
    n: 2,
    name: "ESLint + Prettier",
    command: "pnpm lint",
    requires: [],
  },
  {
    id: "test",
    n: 3,
    name: "Tests unitaires + stories",
    command: "pnpm test",
    // vitest lance les stories dans un chromium headless
    requires: [{ kind: "playwright" }],
  },
  {
    id: "contracts",
    n: 13,
    name: "Contrats d'API",
    command: "pnpm exec vitest run tests/contracts",
    requires: [],
  },
  {
    id: "design",
    n: 14,
    name: "Audit design",
    command: "pnpm design:check",
    requires: [],
  },
  {
    id: "env",
    n: 15,
    name: "Variables d'environnement",
    command: "pnpm env:check",
    requires: [],
  },

  // ---- Nécessitent un build ------------------------------------------------
  {
    id: "build",
    n: 4,
    name: "Build production",
    command: "pnpm build",
    requires: [],
    slow: true,
  },
  {
    id: "hydration",
    n: 9,
    name: "Aucun mismatch d'hydratation",
    // Script dédié : l'ancienne commande utilisait `findstr` (Windows only,
    // donc cassée sur la CI ubuntu) ET sa logique était inversée — trouver
    // une erreur renvoyait exit 0.
    command: "node .claude/scripts/check-hydration.js",
    requires: [],
    slow: true,
  },

  // ---- Nécessitent des navigateurs Playwright ------------------------------
  {
    id: "e2e",
    n: 5,
    name: "Playwright E2E",
    command: "pnpm test:e2e",
    requires: [
      { kind: "playwright" },
      { kind: "capability", name: "supabase" },
    ],
  },
  {
    id: "visual",
    n: 6,
    name: "Régression visuelle",
    command: "pnpm test:visual",
    requires: [{ kind: "playwright" }],
  },
  {
    id: "accessibility",
    n: 12,
    name: "Accessibilité (axe-core)",
    command: "pnpm exec playwright test --config=playwright.a11y.config.ts",
    requires: [{ kind: "playwright" }],
  },

  // ---- Nécessitent Supabase CLI + Docker -----------------------------------
  {
    id: "rls",
    n: 10,
    name: "Politiques RLS (pgTAP)",
    command: "pnpm exec supabase test db",
    requires: [{ kind: "bin", name: "supabase" }, { kind: "docker" }],
  },

  // ---- Performance ---------------------------------------------------------
  {
    id: "lighthouse",
    n: 7,
    name: "Lighthouse CI",
    command: "pnpm exec lhci autorun",
    requires: [{ kind: "playwright" }],
    slow: true,
  },
  {
    id: "cwv",
    n: 8,
    name: "Core Web Vitals",
    command: "pnpm exec lhci autorun --config=lighthouse-ci.json",
    requires: [{ kind: "playwright" }],
    slow: true,
  },
  {
    id: "bundle",
    n: 11,
    name: "Budget de bundle",
    command: "node .claude/scripts/check-bundle-budget.js",
    requires: [],
  },

  // ---- Sécurité ------------------------------------------------------------
  {
    id: "security",
    n: 16,
    name: "Audit de dépendances",
    // Script dédié : sépare les vulnérabilités atteignant la production (toujours
    // bloquantes) de celles confinées aux devDependencies (dérogeables, avec
    // justification et date de réexamen). L'ancienne commande enchaînait un
    // CodeQL jamais configuré suivi d'un `|| echo skipping`.
    command: "node .claude/scripts/check-security.js",
    requires: [],
  },

  // ---- Charge --------------------------------------------------------------
  {
    id: "load",
    n: 17,
    name: "Test de charge (k6)",
    command: "node .claude/scripts/run-load-test.js",
    requires: [],
    optional: true,
  },
];
