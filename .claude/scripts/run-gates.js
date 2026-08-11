#!/usr/bin/env node
/**
 * run-gates.js
 * ------------
 * Exécute les quality gates avec dégradation propre.
 *
 * Règle du projet : **rien ne casse parce qu'un outil manque.**
 *   PASS  a tourné, réussi
 *   FAIL  a tourné, vrai problème        → exit 1
 *   SKIP  prérequis absent, avec la commande d'installation → n'échoue pas
 *
 * Usage :
 *   node .claude/scripts/run-gates.js                 # tous
 *   node .claude/scripts/run-gates.js typecheck lint  # une sélection
 *   node .claude/scripts/run-gates.js --fast          # saute les gates lents
 *   node .claude/scripts/run-gates.js --strict        # un SKIP devient bloquant
 *   node .claude/scripts/run-gates.js --list          # inventaire + prérequis
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { capabilities, installHint } = require("./lib/capabilities.js");

const GATES = require(path.resolve(process.cwd(), ".claude/gates.config.js"));

const argv = process.argv.slice(2);
const FAST = argv.includes("--fast");
const STRICT = argv.includes("--strict");
const LIST = argv.includes("--list");
const selected = argv.filter((a) => !a.startsWith("--"));

// --- Évaluation des prérequis ----------------------------------------------

function checkRequirement(req) {
  switch (req.kind) {
    case "bin": {
      const ok =
        capabilities.supabaseCli && req.name === "supabase"
          ? true
          : require("./lib/capabilities.js").hasBinary(req.name);
      return ok
        ? { ok: true }
        : {
            ok: false,
            reason: `binaire \`${req.name}\` absent`,
            hint: installHint(req.name),
          };
    }
    case "docker":
      return capabilities.docker
        ? { ok: true }
        : {
            ok: false,
            reason: "démon Docker non démarré",
            hint: installHint("docker"),
          };
    case "playwright":
      return capabilities.playwrightBrowsers
        ? { ok: true }
        : {
            ok: false,
            reason: "navigateurs Playwright non téléchargés",
            hint: installHint("playwright"),
          };
    case "capability":
      return capabilities[req.name]
        ? { ok: true }
        : {
            ok: false,
            reason: `capacité \`${req.name}\` non configurée`,
            hint: "renseigner les variables correspondantes dans .env.local (voir pnpm env:check)",
          };
    default:
      return { ok: true };
  }
}

// --- Inventaire -------------------------------------------------------------

if (LIST) {
  console.log("\n📋 Gates déclarés\n");
  for (const g of GATES) {
    const reqs = g.requires.length
      ? g.requires.map((r) => r.name || r.kind).join(", ")
      : "aucun";
    const state = g.requires.every((r) => checkRequirement(r).ok)
      ? "✅ exécutable"
      : "⏭️  skip";
    console.log(
      `   ${String(g.n).padStart(2)}. ${g.id.padEnd(15)} ${state.padEnd(16)} prérequis: ${reqs}`,
    );
  }
  console.log("\n🔧 Capacités détectées\n");
  for (const key of [
    "supabase",
    "supabaseAdmin",
    "billing",
    "email",
    "sentry",
    "supabaseCli",
    "docker",
    "k6",
    "playwrightBrowsers",
  ]) {
    console.log(`   ${capabilities[key] ? "✅" : "❌"} ${key}`);
  }
  console.log("");
  process.exit(0);
}

// --- Exécution --------------------------------------------------------------

const toRun = GATES.filter((g) => {
  if (selected.length) return selected.includes(g.id);
  if (FAST && g.slow) return false;
  return true;
});

console.log(
  `\n🔒 Quality gates — ${toRun.length} gate(s)${FAST ? " (mode rapide)" : ""}\n`,
);

const results = [];

for (const gate of toRun) {
  const label = `[${gate.id}] ${gate.name}`;

  const failedReq = gate.requires.map(checkRequirement).find((r) => !r.ok);
  if (failedReq) {
    console.log(`⏭️  ${label}\n     ${failedReq.reason}`);
    if (failedReq.hint) console.log(`     → ${failedReq.hint}`);
    results.push({ gate, status: "SKIP", reason: failedReq.reason });
    continue;
  }

  process.stdout.write(`▶️  ${label} … `);
  const started = Date.now();
  const run = spawnSync(gate.command, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    encoding: "utf8",
    timeout: 15 * 60 * 1000,
  });
  const secs = ((Date.now() - started) / 1000).toFixed(1);

  if (run.status === 0) {
    console.log(`✅ (${secs}s)`);
    results.push({ gate, status: "PASS" });
  } else {
    console.log(`❌ (${secs}s)`);
    const output = `${run.stdout || ""}${run.stderr || ""}`.trim().split("\n");
    // On ne déverse pas tout le log : les dernières lignes portent la cause
    output.slice(-12).forEach((l) => console.log(`     │ ${l}`));
    results.push({ gate, status: "FAIL", code: run.status });
  }
}

// --- Résumé -----------------------------------------------------------------

const pass = results.filter((r) => r.status === "PASS");
const fail = results.filter((r) => r.status === "FAIL");
const skip = results.filter((r) => r.status === "SKIP");

console.log("\n" + "═".repeat(60));
console.log(
  `  ✅ ${pass.length} réussi(s)   ❌ ${fail.length} échec(s)   ⏭️  ${skip.length} ignoré(s)`,
);
console.log("═".repeat(60));

if (skip.length) {
  console.log("\nIgnorés (prérequis absents, non bloquant) :");
  skip.forEach((r) => console.log(`   • ${r.gate.id} — ${r.reason}`));
}
if (fail.length) {
  console.log("\nÉchecs :");
  fail.forEach((r) => console.log(`   • ${r.gate.id} — ${r.gate.name}`));
}

const blocking = fail.filter((r) => !r.gate.optional);
if (blocking.length) {
  console.log(`\n❌ ${blocking.length} gate(s) bloquant(s) en échec.\n`);
  process.exit(1);
}
if (STRICT && skip.length) {
  console.log("\n❌ Mode strict : des gates ont été ignorés.\n");
  process.exit(1);
}

console.log("\n✅ Aucun gate bloquant en échec.\n");
process.exit(0);
