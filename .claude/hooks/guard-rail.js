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

function isDestructiveCommand(command) {
  const lower = command.toLowerCase();
  // rm -rf / rmdir / del sur chemins sensibles
  if (/(rm\s+-rf|rmdir\s+\/s|del\s+\/f|remove-item\s+-recurse)/.test(lower)) {
    for (const dir of CRITICAL_DIRS) {
      if (new RegExp(`(^|[\\/\\\\])${dir}([\\/\\\\]|$)`).test(command)) {
        return `Suppression de dossier critique détectée : ${dir}`;
      }
    }
    for (const file of CRITICAL_FILES) {
      if (command.includes(file)) {
        return `Suppression de fichier critique détectée : ${file}`;
      }
    }
  }
  return null;
}

function main() {
  const toolName = process.argv[2] || "";
  const input = process.argv[3] || "";

  if (toolName === "execute_command") {
    let parsed;
    try {
      parsed = JSON.parse(input);
    } catch {
      return;
    }
    const command = parsed.command || "";
    const reason = isDestructiveCommand(command);
    if (reason) {
      console.error(`⛔ Garde-fou : ${reason}`);
      console.error(
        "Opération bloquée. Si c'est intentionnel, confirme explicitement.",
      );
      process.exit(2); // code 2 = bloquer l'outil
    }
  }
}

main();
