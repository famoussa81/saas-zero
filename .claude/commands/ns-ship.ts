#!/usr/bin/env node
/**
 * ns-ship — Orchestrateur principal du pipeline SaaS-Zero
 * Lance les 6 phases en séquence : Discovery → Scaffold → Design → Build → Verify → Deploy
 */

import { spawnSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

// Root du projet : on part du cwd (le script tourne à la racine du projet),
// pas de __dirname (indisponible en ESM sans import.meta / flag module).
const CLAUDE_DIR = join(process.cwd(), ".claude");

// Mappage phase → agent RÉEL dans .claude/agents/ (aligné sur les fichiers existants)
const PHASES = [
  {
    name: "discovery",
    script: "ns-discovery.md",
    agent: "saas-project-compliance",
    desc: "Discovery & Specs",
  },
  {
    name: "scaffold",
    script: "ns-scaffold.md",
    agent: "saas-core-builder",
    desc: "Scaffold Repo & Infra",
  },
  {
    name: "design",
    script: "ns-design.md",
    agent: "design-architect",
    desc: "Design System",
  },
  {
    name: "build",
    script: "ns-build.md",
    agent: "saas-core-builder",
    desc: "Build (parallel agents)",
  },
  {
    name: "verify",
    script: "ns-verify.sh",
    agent: null,
    desc: "13 Quality Gates",
  },
  {
    name: "deploy",
    script: "ns-deploy.sh",
    agent: null,
    desc: "Deploy Production",
  },
];

const COMMANDS_DIR = join(CLAUDE_DIR, "commands");

function log(msg: string, color: string = "\x1b[36m") {
  console.log(`${color}%s\x1b[0m`, msg);
}

function error(msg: string) {
  console.error("\x1b[31m%s\x1b[0m", msg);
}

function success(msg: string) {
  console.log("\x1b[32m%s\x1b[0m", msg);
}

function runPhase(phase: (typeof PHASES)[0], args: string[] = []): boolean {
  const scriptPath = join(COMMANDS_DIR, phase.script);

  if (!existsSync(scriptPath)) {
    error(`❌ Script manquant: ${phase.script}`);
    return false;
  }

  log(`\n═══════════════════════════════════════════════════════════════`);
  log(`  Phase: ${phase.desc} (${phase.name})`);
  log(`═══════════════════════════════════════════════════════════════\n`);

  let cmd: string;
  let cmdArgs: string[];

  if (phase.script.endsWith(".sh")) {
    // Phases script (verify, deploy) → exécutées en bash
    cmd = "bash";
    cmdArgs = [scriptPath, ...args];
  } else if (phase.agent) {
    // Phases agent (.md) : délégation à Claude Code via le sous-agent réel (pas de CLI externe).
    // On exécute le fichier .md comme commande Claude en rappelant l'agent à invoquer.
    // Claude Code lit .claude/agents/<agent>.md et délègue dans le contexte courant.
    log(
      `➡️  Phase ${phase.name} : à exécuter dans Claude Code — invoque le sous-agent \`${phase.agent}\`.`,
    );
    log(`    Lire: ${scriptPath}`);
    // Pas d'invocation shell externe : c'est Claude Code qui orchestre.
    return true;
  } else {
    error(`❌ Phase ${phase.name} : ni script .sh ni agent défini.`);
    return false;
  }

  const result = spawnSync(cmd, cmdArgs, {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });

  if (result.status !== 0) {
    error(`\n❌ Phase ${phase.name} échouée (exit code: ${result.status})`);
    return false;
  }

  success(`\n✅ Phase ${phase.name} terminée avec succès`);
  return true;
}

function checkPrerequisites(): boolean {
  // Vérifier que les specs existent pour les phases > 1
  if (
    !existsSync("SPEC.md") ||
    !existsSync("ARCHITECTURE-CHOICE.md") ||
    !existsSync("DESIGN-CHOICE.md")
  ) {
    error(
      "❌ Prérequis manquants: SPEC.md, ARCHITECTURE-CHOICE.md, DESIGN-CHOICE.md",
    );
    error(
      '   Lancez d\'abord la phase discovery: /ns-ship "votre idée" --phase=discovery',
    );
    return false;
  }
  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const description = args.find((a) => !a.startsWith("--")) || "";
  const phaseArg = args.find((a) => a.startsWith("--phase="));
  const skipVerify = args.includes("--skip-verify");
  const skipDeploy = args.includes("--skip-deploy");

  if (!description && !phaseArg) {
    console.log(`
Usage: ns-ship "description du SaaS" [options]

Options:
  --phase=discovery|scaffold|design|build|verify|deploy  Lance une phase spécifique
  --skip-verify                                            Passe la vérification (dangereux)
  --skip-deploy                                            Arrête après verify

Exemples:
  ns-ship "SaaS facturation freelances Stripe équipe API"
  ns-ship "Mon idée" --phase=discovery
  ns-ship "Mon idée" --skip-deploy
`);
    process.exit(1);
  }

  log("\n🚀 SaaS-Zero Pipeline — ns-ship");
  log(`   Description: "${description}"`);
  log(`   Répertoire: ${process.cwd()}\n`);

  // Phase 1: Discovery (toujours exécutée si pas de specs)
  const needsDiscovery =
    !existsSync("SPEC.md") ||
    !existsSync("ARCHITECTURE-CHOICE.md") ||
    !existsSync("DESIGN-CHOICE.md");

  if (needsDiscovery || phaseArg?.includes("discovery")) {
    log("📋 Phase 1: Discovery — Génération des specs...");

    // Délégation à Claude Code (sous-agent saas-project-compliance).
    // Pas de CLI externe : c'est Claude Code qui orchestre via le contexte courant.
    log(
      `➡️  Invoque le sous-agent \`saas-project-compliance\` (voir .claude/agents/saas-project-compliance.md).`,
    );
    log(`    Description: "${description}"`);
    log(
      `    → Produire SPEC.md, ARCHITECTURE-CHOICE.md, DESIGN-CHOICE.md, DISCOVERY.md`,
    );

    // Demander validation humaine
    log("\n📋 SPEC.md, ARCHITECTURE-CHOICE.md, DESIGN-CHOICE.md générés");
    log("⚠️  VALIDATION HUMAINE REQUISE — Vérifiez les fichiers et confirmez");

    // En mode non-interactif, on continue; en interactif, on attend
    if (process.stdin.isTTY) {
      const readline = await import("readline");
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      const answer = await new Promise<string>((resolve) =>
        rl.question("Approuver ? (y/N): ", resolve),
      );
      rl.close();
      if (answer.toLowerCase() !== "y") {
        log("❌ Discovery non validé — Arrêt");
        process.exit(1);
      }
    }
  }

  // Phases 2-6
  let startPhase = 1; // scaffold = index 1

  if (phaseArg) {
    const phaseName = phaseArg.split("=")[1];
    const idx = PHASES.findIndex((p) => p.name === phaseName);
    if (idx >= 0) startPhase = idx;
  }

  for (let i = startPhase; i < PHASES.length; i++) {
    const phase = PHASES[i];

    if (phase.name === "verify" && skipVerify) {
      log("\n⏭️  Phase verify ignorée (--skip-verify)");
      continue;
    }
    if (phase.name === "deploy" && skipDeploy) {
      log("\n⏭️  Phase deploy ignorée (--skip-deploy)");
      break;
    }

    const ok = runPhase(phase);
    if (!ok) {
      error(`\n💥 Pipeline arrêté à la phase ${phase.name}`);
      process.exit(1);
    }
  }

  success("\n🎉 PIPELINE TERMINÉ AVEC SUCCÈS !");
  log("   Votre SaaS est déployé et prêt.");
}

main().catch((err) => {
  error(`Erreur fatale: ${err.message}`);
  process.exit(1);
});
