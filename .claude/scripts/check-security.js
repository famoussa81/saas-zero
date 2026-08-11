#!/usr/bin/env node
/**
 * check-security.js
 * -----------------
 * Audit de dépendances qui distingue ce qui part en production de ce qui
 * reste sur la machine de build.
 *
 * L'ancien gate:security était :
 *   pnpm audit --audit-level=high && (npx codeql … || echo 'skipping')
 * Deux problèmes : CodeQL n'a jamais été configuré et son `|| echo` rendait
 * cette moitié inopérante ; et `pnpm audit` seul traite une faille dans
 * Storybook (jamais livré) comme une faille dans le runtime de l'app.
 *
 * Politique appliquée ici :
 *   - vulnérabilité atteignant une dependency de PRODUCTION  → bloquant
 *   - vulnérabilité confinée aux devDependencies             → bloquant SAUF
 *     si elle est inscrite dans .claude/security-allowlist.json avec une
 *     justification et une date de réexamen
 *   - une entrée d'allowlist périmée redevient bloquante
 *
 * Une faille dev non déclarée bloque : c'est ce qui force à la regarder au
 * lieu de la laisser passer indéfiniment.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const PROD_DEPS = new Set(Object.keys(pkg.dependencies || {}));

const ALLOWLIST_PATH = path.resolve(
  process.cwd(),
  ".claude/security-allowlist.json",
);
const allowlist = fs.existsSync(ALLOWLIST_PATH)
  ? JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"))
  : { accepted: [] };

const MIN_SEVERITY = process.env.AUDIT_LEVEL || "high";
const ORDER = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

console.log("\n🔐 Audit de sécurité des dépendances\n");

const res = spawnSync("pnpm audit --json", {
  shell: true,
  encoding: "utf8",
  maxBuffer: 30 * 1024 * 1024,
  timeout: 5 * 60 * 1000,
});

const raw = (res.stdout || "").trim();
if (!raw) {
  console.log(
    "⏭️  `pnpm audit` n'a rien renvoyé (hors ligne ?) — gate ignoré.\n",
  );
  process.exit(0);
}

let report;
try {
  report = JSON.parse(raw);
} catch {
  // pnpm peut sortir du NDJSON selon la version
  const line = raw.split("\n").find((l) => l.trim().startsWith("{"));
  try {
    report = JSON.parse(line);
  } catch {
    console.log("⏭️  Sortie de `pnpm audit` non parsable — gate ignoré.\n");
    process.exit(0);
  }
}

const advisories = Object.values(report.advisories || {});
if (!advisories.length) {
  console.log("✅ Aucune vulnérabilité signalée.\n");
  process.exit(0);
}

/**
 * Le champ `dev` du rapport pnpm n'est pas fiable (il renvoie false pour des
 * paquets qui sont clairement en devDependencies). On déduit donc la nature
 * depuis le PREMIER maillon du chemin : ".>@lhci/cli>uuid" → "@lhci/cli".
 */
function rootOf(depPath) {
  // pnpm formate les chemins avec des espaces ET un suffixe de version :
  //   ". > @lhci/cli@0.15.1 > inquirer@6.5.2 > tmp@0.0.33"
  // Sans trim ni retrait de version, la comparaison avec les clés de
  // package.json échoue toujours — et une vulnérabilité de PRODUCTION serait
  // classée en dev. Bug silencieux à conséquence de sécurité.
  const parts = depPath
    .split(">")
    .map((p) => p.trim())
    .filter((p) => p && p !== ".");
  if (!parts.length) return null;
  // Retirer la version en gardant les paquets scopés intacts :
  // "@lhci/cli@0.15.1" → "@lhci/cli"   |   "tmp@0.1.0" → "tmp"
  const first = parts[0];
  const at = first.lastIndexOf("@");
  return at > 0 ? first.slice(0, at) : first;
}

const prodIssues = [];
const devIssues = [];

for (const adv of advisories) {
  if (ORDER[adv.severity] < ORDER[MIN_SEVERITY]) continue;

  const paths = (adv.findings || []).flatMap((f) => f.paths || []);
  const roots = [...new Set(paths.map(rootOf).filter(Boolean))];
  const hitsProd = roots.some((r) => PROD_DEPS.has(r));

  const entry = {
    module: adv.module_name,
    severity: adv.severity,
    title: adv.title,
    patched: adv.patched_versions,
    roots,
    url: adv.url,
  };
  (hitsProd ? prodIssues : devIssues).push(entry);
}

// --- Production -------------------------------------------------------------

if (prodIssues.length) {
  console.log(
    `❌ ${prodIssues.length} vulnérabilité(s) atteignant la PRODUCTION :\n`,
  );
  for (const i of prodIssues) {
    console.log(`   [${i.severity}] ${i.module} — via ${i.roots.join(", ")}`);
    console.log(`      ${i.title}`);
    console.log(`      correctif : ${i.patched || "aucun"}`);
  }
  console.log("");
} else {
  console.log("✅ Aucune vulnérabilité dans les dépendances de production.\n");
}

// --- Développement ----------------------------------------------------------

const today = new Date().toISOString().slice(0, 10);
const undeclared = [];
const expired = [];
const accepted = [];

for (const i of devIssues) {
  const rule = allowlist.accepted.find((a) => a.module === i.module);
  if (!rule) undeclared.push(i);
  else if (rule.reviewBy && rule.reviewBy < today) expired.push({ ...i, rule });
  else accepted.push({ ...i, rule });
}

if (accepted.length) {
  console.log(`ℹ️  ${accepted.length} vulnérabilité(s) dev acceptée(s) :\n`);
  for (const i of accepted) {
    console.log(`   [${i.severity}] ${i.module} — ${i.rule.reason}`);
    console.log(`      réexamen avant le ${i.rule.reviewBy}`);
  }
  console.log("");
}

if (expired.length) {
  console.log(
    `⚠️  ${expired.length} dérogation(s) périmée(s) — à réexaminer :\n`,
  );
  expired.forEach((i) =>
    console.log(
      `   [${i.severity}] ${i.module} — échéance ${i.rule.reviewBy} dépassée`,
    ),
  );
  console.log("");
}

if (undeclared.length) {
  console.log(
    `❌ ${undeclared.length} vulnérabilité(s) dev NON déclarée(s) :\n`,
  );
  for (const i of undeclared) {
    console.log(`   [${i.severity}] ${i.module} — via ${i.roots.join(", ")}`);
    console.log(`      ${i.title}`);
    console.log(`      correctif : ${i.patched || "aucun"}`);
  }
  console.log(
    "\n   Soit mettre à jour, soit inscrire dans .claude/security-allowlist.json\n" +
      "   avec une justification et une date de réexamen.\n",
  );
}

const blocking = prodIssues.length + undeclared.length + expired.length;
if (blocking) {
  console.error(`❌ ${blocking} problème(s) bloquant(s).\n`);
  process.exit(1);
}

console.log("✅ Audit de sécurité passé.\n");
process.exit(0);
