#!/usr/bin/env node
/**
 * run-load-test.js
 * ----------------
 * Lance le test de charge k6 (gate:load).
 *
 * Pourquoi ce script plutôt qu'un one-liner npm :
 *
 * 1. k6 n'est PAS un paquet npm. Le paquet `k6` en devDependencies est
 *    explicitement un "Dummy package for autocompleting k6 scripts" (v0.0.0) —
 *    il fournit les types pour l'éditeur, jamais un binaire exécutable.
 *    Le vrai k6 est un binaire Go à installer séparément.
 *
 * 2. L'ancienne commande était :
 *      k6 run tests/load/scenario.js 2>/dev/null || echo 'k6 not installed'
 *    Elle avait deux défauts : elle pointait vers scenario.js alors que le
 *    fichier est scenario.ts, et le `|| echo` faisait passer le gate quoi
 *    qu'il arrive — y compris quand le test échouait vraiment.
 *
 * Comportement voulu :
 *   - k6 absent           → skip explicite, exit 0 (on ne bloque pas un dev
 *                           qui n'a pas le binaire)
 *   - k6 présent, test OK → exit 0
 *   - k6 présent, test KO → exit 1 (le gate DOIT bloquer)
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const SCENARIO = path.join("tests", "load", "scenario.ts");

function k6IsAvailable() {
  const probe = spawnSync("k6", ["version"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });
  return probe.status === 0;
}

function main() {
  if (!fs.existsSync(SCENARIO)) {
    console.error(`\n❌ Scénario de charge introuvable : ${SCENARIO}`);
    process.exit(1);
  }

  if (!k6IsAvailable()) {
    console.log("\n⏭️  k6 non installé — test de charge ignoré.");
    console.log(
      "   Le paquet npm `k6` ne fournit que les types, pas le binaire.",
    );
    console.log("   Installer le vrai k6 :");
    console.log("     Windows : winget install k6 --source winget");
    console.log("     macOS   : brew install k6");
    console.log(
      "     Linux   : voir https://grafana.com/docs/k6/latest/set-up/install-k6/",
    );
    console.log("   En CI : grafana/setup-k6-action@v1\n");
    process.exit(0);
  }

  const baseUrl = process.env.LOAD_TEST_BASE_URL || "http://localhost:3000";
  console.log(`\n🔥 Test de charge k6 sur ${baseUrl}\n`);

  const run = spawnSync("k6", ["run", SCENARIO], {
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, BASE_URL: baseUrl },
  });

  if (run.status !== 0) {
    console.error("\n❌ Test de charge échoué (seuils k6 non tenus).\n");
    process.exit(1);
  }

  console.log("\n✅ Test de charge passé.\n");
  process.exit(0);
}

main();
