#!/usr/bin/env node
/**
 * check-hydration.js
 * ------------------
 * Détecte les mismatchs d'hydratation dans la sortie du build.
 *
 * Remplace l'ancienne commande npm :
 *   pnpm build 2>&1 | findstr /i "hydration mismatch" || echo No hydration mismatches
 *
 * Elle était fausse deux fois :
 *   1. `findstr` n'existe que sur Windows — la CI tourne sur ubuntu-latest,
 *      le gate y plantait systématiquement pour une raison sans rapport ;
 *   2. la logique était inversée : si findstr TROUVAIT « hydration mismatch »,
 *      il sortait en code 0 — donc trouver un bug faisait passer le gate. Et
 *      s'il ne trouvait rien, le `|| echo` faisait passer aussi. Le gate
 *      passait dans tous les cas.
 */

const { spawnSync } = require("node:child_process");

const PATTERNS = [
  /hydration failed/i,
  /hydration mismatch/i,
  /text content does not match/i,
  /did not match server-rendered/i,
  /server rendered html didn't match/i,
];

console.log("\n💧 Vérification des mismatchs d'hydratation\n");
console.log("   Build en cours (peut prendre 1-2 min)…\n");

const build = spawnSync("pnpm build", {
  shell: true,
  encoding: "utf8",
  timeout: 10 * 60 * 1000,
});

const output = `${build.stdout || ""}${build.stderr || ""}`;

if (build.status !== 0) {
  console.error(
    "❌ Le build a échoué — impossible de conclure sur l'hydratation.\n",
  );
  output
    .trim()
    .split("\n")
    .slice(-15)
    .forEach((l) => console.error(`   │ ${l}`));
  console.error("");
  process.exit(1);
}

const hits = [];
for (const line of output.split("\n")) {
  if (PATTERNS.some((p) => p.test(line))) hits.push(line.trim());
}

if (hits.length) {
  console.error(`❌ ${hits.length} mismatch(s) d'hydratation détecté(s) :\n`);
  hits.slice(0, 20).forEach((l) => console.error(`   • ${l}`));
  console.error(
    "\nCauses fréquentes : Date.now()/Math.random() au rendu, accès à window\n" +
      "hors useEffect, HTML invalide (<div> dans <p>), extension de navigateur.\n",
  );
  process.exit(1);
}

console.log("✅ Aucun mismatch d'hydratation dans la sortie du build.\n");
process.exit(0);
