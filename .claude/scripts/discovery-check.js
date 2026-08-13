#!/usr/bin/env node
/**
 * discovery-check.js — Gate déterministe de complétude Discovery
 *
 * Vérifie que les 4 fichiers de la phase Discovery sont complets :
 *   DISCOVERY.md, SPEC.md, ARCHITECTURE-CHOICE.md, DESIGN-CHOICE.md
 *
 * Checks :
 *   1. Les 4 fichiers existent
 *   2. Sections obligatoires présentes (parse headers markdown)
 *   3. Aucun placeholder non résolu ([...], TBD, TODO, [e.g., xxxx, etc.)
 *   4. Pricing avec des nombres
 *   5. Au moins 1 persona rempli
 *   6. Tables ≥1 définies dans ARCHITECTURE
 *   7. Design system choisi (pas "Custom" seul)
 *   8. Positionnement rempli (pas de placeholder)
 *   9. Unit economics avec des nombres
 *
 * Output :
 *   - DISCOVERY-CHECK.md (lisible)
 *   - Score 0-100 + exit 0 (pass) / 1 (fail)
 */

const fs = require("fs");
const path = require("path");

// ─── Config ──────────────────────────────────────────────────────────────────
const ROOT = process.cwd();

const FILES = {
  discovery: "DISCOVERY.md",
  spec: "SPEC.md",
  architecture: "ARCHITECTURE-CHOICE.md",
  design: "DESIGN-CHOICE.md",
};

// Placeholders interdits (patterns qui indiquent un remplissage incomplet)
const PLACEHOLDER_PATTERNS = [
  /\[[^\]]*\.{2,3}\]/, // [...], [..], [.....]
  /\be\.g\.\]/, // [e.g.
  /\betc\.\]/, // [etc.
  /\bTBD\b/i,
  /\bTODO\b/i,
  /\bFIXME\b/i,
  /\bxxxx\b/i,
  /\bà compléter\b/i,
  /\b[Àa] remplir\b/i,
  /\b[Àa] définir\b/i,
  /\b[Àa] décider\b/i,
  /\b[Àa] valider\b/i,
  /\bplaceholder\b/i,
  /\b\s*\[\s*e\.g\./, // [e.g. anywhere
  /\b\s*\[\s*\?\]/, // [?] or [ ? ]
  /\bXXX\b/,
  /\byyy\b/i,
  /\bAAA\b/,
  /\bBBBB\b/i,
];

// Sections obligatoires par fichier (headers level 2+ ou patterns de contenu)
const REQUIRED = {
  discovery: [
    { id: "header", label: "Header / Projet", pattern: /Header|Projet\s*\|/i },
    { id: "lean_canvas", label: "Lean Canvas", pattern: /Lean\s*Canvas/i },
    {
      id: "personas",
      label: "Personas / ICP",
      pattern: /Personas?\s*(\/\s*ICP)?/i,
    },
    {
      id: "jtbd",
      label: "Jobs-to-be-done",
      pattern: /Jobs[\s-]*to[\s-]*be[\s-]*done|JTBD/i,
    },
    {
      id: "concurrentiel",
      label: "Matrice concurrentielle",
      pattern: /concurrenti/i,
    },
    {
      id: "positionnement",
      label: "Positionnement",
      pattern: /Positionnement|Pour\s*\[/i,
    },
    {
      id: "pricing",
      label: "Pricing / Monétisation",
      pattern: /Pricing|Mon[eé]tisation|Tiers|Tier/i,
    },
    {
      id: "unit_economics",
      label: "Unit economics",
      pattern: /Unit\s*Economics|ACV|Churn|LTV|MRR/i,
    },
    {
      id: "funnel",
      label: "Funnel conversion",
      pattern: /Funnel|Conversion\s*(\&|et)\s*R[eé]tention/i,
    },
    {
      id: "decisions",
      label: "Décisions verrouillées",
      pattern: /D[eé]cisions?\s*Verrouill[eé]es?/i,
    },
    {
      id: "impact",
      label: "Impact traceability",
      pattern: /Impact\s*Traceab|Feature.*Tables.*Pages/i,
    },
    {
      id: "metriques",
      label: "Métriques de succès",
      pattern: /M[eé]triques?\s*de\s*[Ss]ucc[eè]s|North\s*Star/i,
    },
    {
      id: "risques",
      label: "Risques",
      pattern: /Risques?\s*(\&|et)\s*Mitigation/i,
    },
  ],
  spec: [
    {
      id: "identity",
      label: "Product Identity",
      pattern: /Product\s*Identity|Nom\s*du\s*produit/i,
    },
    {
      id: "business",
      label: "Business Model",
      pattern: /Business\s*Model|Mod[eè]le/i,
    },
    {
      id: "audience",
      label: "Target Audience",
      pattern: /Target\s*Audience|Public\s*cible|Personas?/i,
    },
    {
      id: "features",
      label: "Core Features",
      pattern: /Core\s*Features?|Features?\s*MVP/i,
    },
    { id: "auth", label: "Auth", pattern: /Auth|Authentification/i },
    { id: "billing", label: "Billing", pattern: /Billing|Paiement|Stripe/i },
    { id: "email", label: "Email", pattern: /Email|Notification/i },
    {
      id: "design",
      label: "Design",
      pattern: /Design|Design\s*System|Motion\s*Tier/i,
    },
    {
      id: "technical",
      label: "Technical Requirements",
      pattern: /Technical\s*Requirements?|Non[\s-]*Functional/i,
    },
    {
      id: "pages",
      label: "Pages / Routes",
      pattern: /Pages?\s*(\/|et)\s*Routes?|Routes\s*MVP/i,
    },
    {
      id: "acceptance",
      label: "Acceptance Criteria",
      pattern: /Acceptance\s*Criteria|Definition\s*of\s*Done/i,
    },
    { id: "risks", label: "Risks", pattern: /Risques?/i },
  ],
  architecture: [
    {
      id: "stack",
      label: "Stack decisions",
      pattern: /Stack|Layer|Framework|Choix/i,
    },
    {
      id: "tables",
      label: "Tables Supabase",
      pattern: /Tables?\s*Supabase|CREATE\s*TABLE|schema/i,
    },
    {
      id: "rls",
      label: "RLS",
      pattern: /RLS|Row\s*Level\s*Security|Policy|policy/i,
    },
    {
      id: "env_vars",
      label: "Env vars",
      pattern: /Env\s*Vars?|Variables?\s*d[']environnement/i,
    },
    {
      id: "pipeline",
      label: "Pipeline",
      pattern: /Pipeline\s*appliqu[eé]|Phase\s*[1-6]/i,
    },
  ],
  design: [
    {
      id: "philosophy",
      label: "Design Philosophy",
      pattern: /Design\s*Philosophy|Principles?/i,
    },
    {
      id: "color",
      label: "Color System",
      pattern: /Color\s*System|Palette|Couleurs?/i,
    },
    { id: "typography", label: "Typography", pattern: /Typography|Typo|Font/i },
    { id: "motion", label: "Motion", pattern: /Motion|Animation|Tier/i },
    {
      id: "signature",
      label: "Élément signature",
      pattern: /Signature|WOW|Wow|Wow[\s-]*factor/i,
    },
    {
      id: "dark_mode",
      label: "Dark Mode",
      pattern: /Dark\s*Mode|Dark\s*Theme/i,
    },
    {
      id: "responsive",
      label: "Responsive",
      pattern: /Responsive|Breakpoint/i,
    },
    { id: "a11y", label: "Accessibility", pattern: /Accessib|A11y|WCAG/i },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function readFile(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf-8");
}

function findAll(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return [];
  const content = fs.readFileSync(full, "utf-8");
  const matches = [];
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = content.match(pat);
    if (m) matches.push({ pattern: pat.source, matched: m[0] });
  }
  return matches;
}

function hasPlaceholders(content) {
  for (const pat of PLACEHOLDER_PATTERNS) {
    if (pat.test(content)) return true;
  }
  return false;
}

function checkPlaceholders(rel) {
  const content = readFile(rel);
  if (!content) return [];
  const matches = [];
  for (const pat of PLACEHOLDER_PATTERNS) {
    const m = content.match(pat);
    if (m) matches.push(m[0]);
  }
  return matches;
}

function checkSections(rel, requirements) {
  const content = readFile(rel) || "";
  const results = [];
  for (const req of requirements) {
    const found = req.pattern.test(content);
    results.push({ ...req, found });
  }
  return results;
}

function checkPricingNumbers(content) {
  // Vérifie qu'il y a au moins un prix avec nombre (ex: 9$, 29, $0)
  return (
    /(\$\s*\d+|\d+\s*\$)/.test(content) ||
    /\d+€/.test(content) ||
    /gratuit|free|0\s*\$/.test(content)
  );
}

function checkPersona(content) {
  // Vérifie qu'au moins 1 persona a un rôle rempli
  return /Rôle\s*\|/i.test(content) || /Role\s*\|/i.test(content);
}

function checkTables(content) {
  // Vérifie au moins 1 table mentionnée (CREATE TABLE, ou nom de table listé)
  return /CREATE\s*TABLE|TABLES?\s*Supabase|id,\s*\w+_id/i.test(content);
}

function checkDesignSystem(content) {
  // Vérifie qu'un design system est choisi (pas "Custom" seul sans description)
  if (/Custom\s*$/im.test(content)) return false;
  return /Linear|Vercel|Stripe|Framer|shadcn|Material|Tailwind/i.test(content);
}

function checkPositionnement(content) {
  // Vérifie la ligne de positionnement (pas de placeholder)
  return (
    /Pour\s*\[?[^\]]+\]\s*qui\s*\[?[^\]]+\]/i.test(content) ||
    /For\s*\[?[^\]]+\]\s*who/i.test(content) ||
    /Pour\s+\w+/i.test(content)
  );
}

/**
 * Unit economics : un mot-clé du domaine ET un montant chiffré.
 *
 * La version précédente exigeait un montant EN DOLLARS :
 *
 *     return /(\$\s*\d+|\d+\s*\$)/i.test(content);
 *
 * Une Discovery rédigée en francs CFA, en euros ou en dirhams échouait donc
 * quels que soient ses chiffres — le gate refusait « AOV 25k F, CAC 3k F,
 * LTV 30k F » et laissait passer un document vide contenant « $0 » quelque
 * part. Il mesurait la devise, pas la complétude.
 *
 * La version actuelle est agnostique à la devise et plus stricte : elle exige
 * à la fois le vocabulaire (le sujet est traité) et un nombre unitaire (il est
 * chiffré). Un pourcentage compte — une marge est une unit economic.
 */
function checkUnitEconomics(content) {
  const KEYWORDS =
    /\b(unit\s*economics|ACV|CAC|LTV|churn|MRR|ARR|AOV|panier\s*moyen|marge|payback)\b/i;
  const AMOUNT =
    /\d[\d\s.,]*\s*(?:k|K|M)?\s*(?:F\b|FCFA|XOF|CFA|MAD|DH|€|EUR|\$|USD|%)|[$€]\s*\d/;
  return KEYWORDS.test(content) && AMOUNT.test(content);
}

// ─── Main ────────────────────────────────────────────────────────────────────
function main() {
  const results = [];
  let totalScore = 0;
  let maxScore = 0;

  console.log(
    "═══════════════════════════════════════════════════════════════",
  );
  console.log("  Discovery Check — Gate déterministe de complétude");
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  // ── Check 1 : Les 4 fichiers existent ──────────────────────────────────────
  console.log("📂 Vérification des fichiers...");
  for (const [key, file] of Object.entries(FILES)) {
    const content = readFile(file);
    const exists = content !== null;
    const pass = exists;
    const weight = 8; // 4 fichiers × 8 = 32 points
    maxScore += weight;
    if (pass) totalScore += weight;
    results.push({
      check: `Fichier ${file}`,
      pass,
      weight,
      detail: exists ? "Trouvé" : "MANQUANT",
    });
    console.log(
      `  ${pass ? "✅" : "❌"} ${file} — ${results[results.length - 1].detail}`,
    );
  }

  // ── Check 2 : Sections obligatoires ────────────────────────────────────────
  console.log("\n📋 Vérification des sections obligatoires...");
  for (const [key, file] of Object.entries(FILES)) {
    const requirements = REQUIRED[key];
    if (!requirements) continue;
    const sectionResults = checkSections(file, requirements);
    const weightPerSection = 1; // 1 point par section
    for (const s of sectionResults) {
      maxScore += weightPerSection;
      if (s.found) totalScore += weightPerSection;
      results.push({
        check: `Section: ${s.label}`,
        pass: s.found,
        weight: weightPerSection,
        detail: `Dans ${file}`,
      });
    }
    const missing = sectionResults.filter((s) => !s.found);
    if (missing.length > 0) {
      console.log(
        `  ⚠️  ${file} : sections manquantes : ${missing.map((m) => m.label).join(", ")}`,
      );
    } else {
      console.log(`  ✅ ${file} : toutes les sections présentes`);
    }
  }

  // ── Check 3 : Placeholders interdits ───────────────────────────────────────
  console.log("\n🔍 Vérification des placeholders...");
  for (const [key, file] of Object.entries(FILES)) {
    const placeholders = checkPlaceholders(file);
    const weight = 3;
    maxScore += weight;
    const pass = placeholders.length === 0;
    if (pass) totalScore += weight;
    results.push({
      check: `Pas de placeholder (${file})`,
      pass,
      weight,
      detail: pass ? "Clean" : `Trouvé: ${placeholders.join(", ")}`,
    });
    console.log(
      `  ${pass ? "✅" : "❌"} ${file} — ${results[results.length - 1].detail}`,
    );
  }

  // ── Check 4 : Pricing avec nombres ─────────────────────────────────────────
  console.log("\n💰 Vérification du pricing...");
  const specContent = readFile(FILES.spec) || "";
  const discContent = readFile(FILES.discovery) || "";
  const hasPricing =
    checkPricingNumbers(specContent) || checkPricingNumbers(discContent);
  maxScore += 5;
  if (hasPricing) totalScore += 5;
  results.push({
    check: "Pricing (nombres)",
    pass: hasPricing,
    weight: 5,
    detail: hasPricing ? "Prix trouvés" : "Pas de prix détectés",
  });
  console.log(
    `  ${hasPricing ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Check 5 : Au moins 1 persona rempli ────────────────────────────────────
  console.log("\n👤 Vérification des personas...");
  const hasPersona = checkPersona(discContent) || checkPersona(specContent);
  maxScore += 5;
  if (hasPersona) totalScore += 5;
  results.push({
    check: "Persona / ICP",
    pass: hasPersona,
    weight: 5,
    detail: hasPersona ? "Persona trouvé" : "Aucun persona détecté",
  });
  console.log(
    `  ${hasPersona ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Check 6 : Tables définies ──────────────────────────────────────────────
  console.log("\n🗄️  Vérification des tables...");
  const archContent = readFile(FILES.architecture) || "";
  const hasTables = checkTables(archContent);
  maxScore += 5;
  if (hasTables) totalScore += 5;
  results.push({
    check: "Tables Supabase",
    pass: hasTables,
    weight: 5,
    detail: hasTables ? "Tables trouvées" : "Aucune table détectée",
  });
  console.log(
    `  ${hasTables ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Check 7 : Design system choisi ─────────────────────────────────────────
  console.log("\n🎨 Vérification du design system...");
  const designContent = readFile(FILES.design) || "";
  const hasDesignSystem = checkDesignSystem(designContent);
  maxScore += 5;
  if (hasDesignSystem) totalScore += 5;
  results.push({
    check: "Design system",
    pass: hasDesignSystem,
    weight: 5,
    detail: hasDesignSystem
      ? "Design system choisi"
      : "Design system non défini",
  });
  console.log(
    `  ${hasDesignSystem ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Check 8 : Positionnement rempli ────────────────────────────────────────
  console.log("\n🎯 Vérification du positionnement...");
  const hasPositioning = checkPositionnement(discContent);
  maxScore += 5;
  if (hasPositioning) totalScore += 5;
  results.push({
    check: "Positionnement",
    pass: hasPositioning,
    weight: 5,
    detail: hasPositioning
      ? "Positionnement trouvé"
      : "Positionnement non rempli",
  });
  console.log(
    `  ${hasPositioning ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Check 9 : Unit economics ───────────────────────────────────────────────
  console.log("\n📊 Vérification des unit economics...");
  const hasEconomics = checkUnitEconomics(discContent);
  maxScore += 5;
  if (hasEconomics) totalScore += 5;
  results.push({
    check: "Unit economics",
    pass: hasEconomics,
    weight: 5,
    detail: hasEconomics
      ? "Unit economics trouvés"
      : "Unit economics non remplis",
  });
  console.log(
    `  ${hasEconomics ? "✅" : "❌"} ${results[results.length - 1].detail}`,
  );

  // ── Score ──────────────────────────────────────────────────────────────────
  const score = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
  const allPassed = results.every((r) => r.pass);

  console.log(
    "\n═══════════════════════════════════════════════════════════════",
  );
  console.log(`  SCORE : ${score}/100`);
  console.log(`  STATUT : ${allPassed ? "✅ PASSED" : "❌ FAILED"}`);
  console.log(
    "═══════════════════════════════════════════════════════════════\n",
  );

  // ── Générer DISCOVERY-CHECK.md ─────────────────────────────────────────────
  const now = new Date().toISOString().split("T")[0];
  let md = `# Discovery Check Report\n\n`;
  md += `**Date** : ${now}\n`;
  md += `**Score** : ${score}/100\n`;
  md += `**Statut** : ${allPassed ? "✅ PASSED" : "❌ FAILED"}\n\n`;
  md += `---\n\n`;
  md += `## Résultats\n\n`;
  md += `| Check | Status | Poids | Détail |\n`;
  md += `|-------|--------|-------|--------|\n`;
  for (const r of results) {
    md += `| ${r.check} | ${r.pass ? "✅ PASS" : "❌ FAIL"} | ${r.weight} | ${r.detail} |\n`;
  }
  md += `\n---\n\n`;
  md += `## Critères d'échec\n\n`;
  md += `| Critère | Statut |\n`;
  md += `|---------|--------|\n`;
  md += `| Tous les fichiers existent | ${results.filter((r) => r.check.startsWith("Fichier")).every((r) => r.pass) ? "✅" : "❌"} |\n`;
  md += `| Aucun placeholder | ${results.filter((r) => r.check.startsWith("Pas de placeholder")).every((r) => r.pass) ? "✅" : "❌"} |\n`;
  md += `| Pricing avec nombres | ${hasPricing ? "✅" : "❌"} |\n`;
  md += `| Au moins 1 persona | ${hasPersona ? "✅" : "❌"} |\n`;
  md += `| Tables définies | ${hasTables ? "✅" : "❌"} |\n`;
  md += `| Design system choisi | ${hasDesignSystem ? "✅" : "❌"} |\n`;
  md += `| Positionnement rempli | ${hasPositioning ? "✅" : "❌"} |\n`;
  md += `| Unit economics remplis | ${hasEconomics ? "✅" : "❌"} |\n`;
  md += `\n> **${score >= 100 ? "Tous les critères remplis — Phase 2 débloquée." : "Des sections manquent — complétez avant Phase 2."}**\n`;
  md += `\n---\n_Généré par discovery-check.js — Pipeline saas-zero_\n`;

  const outPath = path.join(ROOT, "DISCOVERY-CHECK.md");
  fs.writeFileSync(outPath, md, "utf-8");

  // ── Sortie JSON (CI-readable) ──────────────────────────────────────────────
  const json = {
    date: now,
    score,
    maxScore,
    totalScore,
    passed: allPassed,
    results: results.map((r) => ({
      check: r.check,
      pass: r.pass,
      weight: r.weight,
      detail: r.detail,
    })),
  };
  const jsonPath = path.join(ROOT, "discovery-check.json");
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2), "utf-8");

  process.exit(allPassed ? 0 : 1);
}

main();
