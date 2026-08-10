/**
 * Contract tests — la SPEC.md est le contrat exécutable du pipeline.
 *
 * Vérifie que :
 *   1. Les 4 fichiers Discovery existent à la racine (contrat d'entrée du gate)
 *   2. SPEC.md contient les sections obligatoires attendues par discovery-check.js
 *   3. Le dernier discovery-check.json atteste discovery:check = 100%
 *
 * Ce test remplace l'ancien stub `echo 'Contract tests not yet implemented'`.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd());

// Mêmes sections que `discovery-check.js` REQUIRED.spec (référence unique : le gate)
const SPEC_REQUIRED = [
  {
    label: "Product Identity",
    pattern: /Product\s*Identity|Nom\s*du\s*produit/i,
  },
  { label: "Business Model", pattern: /Business\s*Model|Mod[eè]le/i },
  {
    label: "Target Audience",
    pattern: /Target\s*Audience|Public\s*cible|Personas?/i,
  },
  { label: "Core Features", pattern: /Core\s*Features?|Features?\s*MVP/i },
  { label: "Auth", pattern: /Auth|Authentification/i },
  { label: "Billing", pattern: /Billing|Paiement|Stripe/i },
  { label: "Email", pattern: /Email|Notification/i },
  { label: "Design", pattern: /Design|Design\s*System|Motion\s*Tier/i },
  {
    label: "Technical Requirements",
    pattern: /Technical\s*Requirements?|Non[\s-]*Functional/i,
  },
  {
    label: "Pages / Routes",
    pattern: /Pages?\s*(\/|et)\s*Routes?|Routes\s*MVP/i,
  },
  {
    label: "Acceptance Criteria",
    pattern: /Acceptance\s*Criteria|Definition\s*of\s*Done/i,
  },
  { label: "Risques", pattern: /Risques?/i },
];

// Fichiers Discovery attendus à la racine (contrat d'entrée du gate)
const DISCOVERY_FILES = [
  "DISCOVERY.md",
  "SPEC.md",
  "ARCHITECTURE-CHOICE.md",
  "DESIGN-CHOICE.md",
];

let specContent = "";
let discoveryJson: { passed: boolean; score: number } | null = null;

beforeAll(() => {
  const specPath = path.join(ROOT, "SPEC.md");
  if (existsSync(specPath)) specContent = readFileSync(specPath, "utf-8");

  const jsonPath = path.join(ROOT, "discovery-check.json");
  if (existsSync(jsonPath)) {
    try {
      discoveryJson = JSON.parse(readFileSync(jsonPath, "utf-8"));
    } catch {
      discoveryJson = null;
    }
  }
});

describe("Discovery contract (4 fichiers à la racine)", () => {
  it.each(DISCOVERY_FILES)("%s existe", (file) => {
    expect(existsSync(path.join(ROOT, file))).toBe(true);
  });
});

describe("SPEC.md (contrat exécutable) sections obligatoires", () => {
  it.each(SPEC_REQUIRED)("contient $label", ({ label, pattern }) => {
    expect(pattern.test(specContent), `${label} manquant dans SPEC.md`).toBe(
      true,
    );
  });
});

describe("Gate discovery:check attesté", () => {
  it("discovery-check.json existe et atteste PASS 100/100", () => {
    expect(discoveryJson).not.toBeNull();
    expect(discoveryJson?.passed).toBe(true);
    expect(discoveryJson?.score).toBe(100);
  });
});
