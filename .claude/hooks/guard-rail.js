#!/usr/bin/env node
/**
 * Garde-fou anti-destruction — hook Claude Code
 *
 * Bloque les opérations destructrices dangereuses :
 * - Suppression de dossiers critiques (app, components, lib, src, .claude, .github)
 * - Suppression de fichiers de config essentiels (package.json, next.config.js, etc.)
 * - `rm -rf` sur des chemins sensibles
 *
 * Usage : configuré dans .claude/settings.json → hooks.PreToolUse
 */

const CRITICAL_DIRS = [
  "app",
  "components",
  "lib",
  "src",
  ".claude",
  ".github",
  "supabase",
  "messages",
  "content",
];

const CRITICAL_FILES = [
  "package.json",
  "next.config.js",
  "next.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
  "middleware.ts",
  "content-collections.ts",
  "pnpm-lock.yaml",
];

/** Frontière de mot tolérant l'espace, les slashes et les guillemets. */
const boundary = (word) =>
  new RegExp(`(^|[\\s/\\\\"'])${word.replace(/\./g, "\\.")}([\\s/\\\\"']|$)`);

function isDestructiveCommand(command) {
  const lower = command.toLowerCase();

  // Suppression simple d'un fichier de config : `rm package.json` n'a ni -rf
  // ni -Recurse, mais casse le projet aussi sûrement.
  if (/(^|[\s;&|])(rm|del|erase|remove-item)\s/.test(lower)) {
    for (const file of CRITICAL_FILES) {
      if (boundary(file).test(command)) {
        return `Suppression de fichier critique détectée : ${file}`;
      }
    }
  }

  // rm -rf / rmdir / del sur chemins sensibles
  if (
    /(rm\s+-[a-z]*r|rmdir\s+\/s|del\s+\/f|remove-item\s+-recurse)/.test(lower)
  ) {
    for (const dir of CRITICAL_DIRS) {
      // La frontière doit accepter l'espace : `rm -rf src` a « src » précédé
      // d'une espace, ni début de chaîne ni slash. Sans `\s` ici, la cible la
      // plus courante — et la plus destructrice — passait au travers.
      if (boundary(dir).test(command)) {
        return `Suppression de dossier critique détectée : ${dir}`;
      }
    }
  }
  return null;
}

/**
 * Claude Code envoie la charge utile du hook sur STDIN, en JSON — pas en
 * arguments de ligne de commande. La première version lisait `process.argv`
 * et comparait le nom d'outil à « execute_command », qui n'existe pas : le
 * garde-fou n'a donc jamais bloqué quoi que ce soit.
 *
 * Forme reçue :
 *   { "hook_event_name": "PreToolUse",
 *     "tool_name": "Bash",
 *     "tool_input": { "command": "…" } }
 *
 * Sortie : code 2 = outil bloqué, stderr renvoyé à l'agent. Tout autre code
 * laisse passer.
 */

/** Outils capables d'exécuter un shell. */
const SHELL_TOOLS = new Set(["Bash", "PowerShell"]);

function readStdin() {
  const fs = require("node:fs");
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function main() {
  let payload;
  try {
    payload = JSON.parse(readStdin());
  } catch {
    // Charge utile illisible : ne pas bloquer sur une erreur de plomberie.
    return;
  }

  if (!SHELL_TOOLS.has(payload.tool_name)) return;

  const command = (payload.tool_input && payload.tool_input.command) || "";
  const reason = isDestructiveCommand(command);
  if (reason) {
    console.error(`⛔ Garde-fou : ${reason}`);
    console.error(
      "Opération bloquée. Si c'est intentionnel, confirme explicitement.",
    );
    process.exit(2);
  }
}

main();
