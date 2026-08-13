#!/usr/bin/env node
/**
 * doctor.js
 * ---------
 * Vérifie que le dépôt est cohérent POUR UN AGENT QUI ARRIVE À FROID.
 *
 * Hypothèse de travail du projet : chaque session part d'un agent neuf, sans
 * mémoire, dans le dossier du projet. Tout ce qu'il lit doit donc être vrai.
 * Une commande citée dans une doc mais absente de package.json lui fait
 * exécuter « command not found » et le laisse sans issue.
 *
 * Ce script a été écrit après avoir découvert que les cinq commandes de phase
 * (`pnpm ns:discovery`, `ns:scaffold`, `ns:design`, `ns:build`, `ns:deploy`)
 * étaient documentées dans leurs propres fichiers sans exister nulle part, et
 * que ns-verify.md citait encore des scripts `.hermes/` supprimés.
 *
 * Usage : pnpm doctor
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8"),
);
const SCRIPTS = new Set(Object.keys(pkg.scripts || {}));

/** Sous-commandes de pnpm/npm qui ne sont pas des scripts du projet. */
const NATIVE = new Set([
  "install",
  "add",
  "remove",
  "run",
  "exec",
  "audit",
  "why",
  "update",
  "dlx",
  "test",
  "start",
  "build",
  "init",
  "publish",
  "link",
  "list",
  "outdated",
  "prune",
  "store",
  "config",
  "create",
]);

const problems = [];
const warnings = [];

function listFiles(dir, filter) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return listFiles(full, filter);
    return filter(e.name) ? [full] : [];
  });
}

const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

// --- 1. Commandes citées dans les docs ---------------------------------------

console.log("\n🩺 Diagnostic du dépôt (perspective agent à froid)\n");

const docs = [
  ...listFiles(path.join(ROOT, ".claude", "commands"), (f) =>
    f.endsWith(".md"),
  ),
  ...listFiles(path.join(ROOT, ".claude", "skills"), (f) => f.endsWith(".md")),
  ...["CLAUDE.md", "README.md", "BOOTSTRAP.md", "AGENTS.md", "PIPELINE.md"]
    .map((f) => path.join(ROOT, f))
    .filter(fs.existsSync),
];

// `pnpm <script>` / `npm run <script>` — le nom peut contenir chiffres et `:`
const CMD_RE =
  /\b(?:pnpm(?:\s+run)?|npm\s+run|yarn)\s+([a-z][a-z0-9]*(?::[a-z0-9-]+)*)/g;

/**
 * On ne cherche QUE dans le code : blocs ``` et spans `…`.
 *
 * Sans ce filtre, la prose française déclenche des faux positifs — « les
 * overrides pnpm ont ramené 13 vulnérabilités » était signalé comme la
 * commande inexistante `pnpm ont`. Un vérificateur qui crie au loup finit
 * ignoré, ce qui le rend pire qu'inutile.
 */
function codeOnly(text) {
  const parts = [];
  for (const m of text.matchAll(/```[\s\S]*?```/g)) parts.push(m[0]);
  for (const m of text.matchAll(/`[^`\n]+`/g)) parts.push(m[0]);
  return parts.join("\n");
}

let cmdRefs = 0;
for (const doc of docs) {
  const text = codeOnly(fs.readFileSync(doc, "utf8"));
  for (const m of text.matchAll(CMD_RE)) {
    const name = m[1];
    if (NATIVE.has(name)) continue;
    cmdRefs++;
    if (!SCRIPTS.has(name)) {
      problems.push(
        `${rel(doc)} cite \`pnpm ${name}\` — script absent de package.json`,
      );
    }
  }
}
console.log(`   Commandes citées dans la doc : ${cmdRefs} vérifiées`);

// --- 2. Scripts pointés par package.json existent-ils ? ----------------------

const FILE_RE = /(?:node|tsx?|bash|sh)\s+([.\w/-]+\.(?:js|mjs|cjs|ts|sh))/;
let scriptFiles = 0;
for (const [name, cmd] of Object.entries(pkg.scripts || {})) {
  const m = cmd.match(FILE_RE);
  if (!m) continue;
  scriptFiles++;
  if (!fs.existsSync(path.join(ROOT, m[1]))) {
    problems.push(
      `package.json > "${name}" pointe vers ${m[1]} — fichier inexistant`,
    );
  }
}
console.log(
  `   Fichiers pointés par les scripts npm : ${scriptFiles} vérifiés`,
);

// --- 3. Skills : frontmatter et références croisées --------------------------

const skillsDir = path.join(ROOT, ".claude", "skills");
const skillNames = fs.existsSync(skillsDir)
  ? fs
      .readdirSync(skillsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory() || e.isSymbolicLink())
      .map((e) => e.name)
  : [];

for (const s of skillNames) {
  const f = path.join(skillsDir, s, "SKILL.md");
  if (!fs.existsSync(f)) {
    problems.push(`skill "${s}" n'a pas de SKILL.md`);
    continue;
  }
  const head = fs.readFileSync(f, "utf8").slice(0, 400);
  if (head.charCodeAt(0) === 0xfeff) {
    problems.push(
      `${rel(f)} commence par un BOM UTF-8 — casse le parsing du frontmatter`,
    );
  }
  if (!/^\s*---[\s\S]*?\nname:/.test(head)) {
    problems.push(`${rel(f)} : frontmatter sans champ \`name:\``);
  }
}
console.log(`   Skills : ${skillNames.length} vérifiés`);

// Références `ns-xxx` entre skills
const known = new Set(skillNames);
for (const doc of docs) {
  const text = fs.readFileSync(doc, "utf8");
  for (const m of text.matchAll(/`(ns-[a-z][a-z0-9-]*)`/g)) {
    if (!known.has(m[1])) {
      warnings.push(`${rel(doc)} référence le skill \`${m[1]}\` — inexistant`);
    }
  }
}

// --- 4. Agents ---------------------------------------------------------------

const agentsDir = path.join(ROOT, ".claude", "agents");
const agents = fs.existsSync(agentsDir)
  ? fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"))
  : [];
for (const a of agents) {
  const head = fs.readFileSync(path.join(agentsDir, a), "utf8").slice(0, 400);
  if (!/^\s*---[\s\S]*?\nname:/.test(head)) {
    problems.push(`.claude/agents/${a} : frontmatter sans \`name:\``);
  }
}
console.log(`   Agents : ${agents.length} vérifiés`);

// --- 5. Caractères de contrôle (corruption d'échappement) -------------------

for (const doc of docs) {
  const text = fs.readFileSync(doc, "utf8");
  if (/[]/.test(text)) {
    problems.push(
      `${rel(doc)} contient des caractères de contrôle — séquences d'échappement mangées`,
    );
  }
}

// --- 5b. Composants dupliqués entre les deux racines -------------------------

/**
 * `tsconfig.json` mappe `@/components/*` sur DEUX dossiers :
 *
 *   "@/components/*": ["./src/components/*", "./components/*"]
 *
 * TypeScript retient le premier qui existe. Un même nom présent des deux
 * côtés crée donc un composant fantôme : celui de `components/` n'est jamais
 * rendu, mais reste modifiable, testable et documentable — on corrige un
 * bouton que personne ne voit.
 *
 * Le dépôt a vécu avec onze doublons dont neuf divergeaient (`select` avait
 * 159 lignes d'un côté, 94 de l'autre : Radix contre `<select>` natif), et
 * deux stories Storybook documentaient la version morte.
 */
const dupRoots = [
  path.join(ROOT, "src", "components"),
  path.join(ROOT, "components"),
];
if (dupRoots.every((d) => fs.existsSync(d))) {
  const namesOf = (root) =>
    new Map(
      listFiles(root, (f) => /\.(tsx|ts)$/.test(f) && !/\.stories\./.test(f))
        .map((f) => [path.relative(root, f).replace(/\\/g, "/"), f])
        .map(([k, v]) => [k, v]),
    );
  const [inSrc, inRoot] = dupRoots.map(namesOf);
  for (const [name, srcFile] of inSrc) {
    const rootFile = inRoot.get(name);
    if (!rootFile) continue;
    const same =
      fs.readFileSync(srcFile, "utf8") === fs.readFileSync(rootFile, "utf8");
    problems.push(
      `composant dupliqué "${name}" dans src/components/ ET components/ ` +
        `— seule la version src/ est rendue` +
        (same ? " (copies identiques)" : " ET LES DEUX DIVERGENT"),
    );
  }
  console.log(`   Composants : ${inSrc.size + inRoot.size} vérifiés`);
}

// --- 5c. Les primitives promises existent-elles VRAIMENT ? -------------------

/**
 * Le contrôle 5b ne cherchait que les doublons. Il ne vérifiait jamais que les
 * composants EXISTENT, et il se sautait entièrement quand `components/` à la
 * racine était absent — le cas normal.
 *
 * Conséquence observée sur un vrai projet : un agent a supprimé les 36
 * primitives de `src/components/ui/` pour faire taire des imports qui ne
 * résolvaient pas, puis `doctor` a répondu « Dépôt cohérent ». Le build
 * échouait sur 72 erreurs.
 *
 * On vérifie donc que chaque composant nommé dans le UI-CONTRACT a bien un
 * fichier. Le contrat est la source de vérité : y ajouter une ligne rend
 * automatiquement le composant obligatoire.
 */
const contractPath = path.join(ROOT, ".claude", "design", "UI-CONTRACT.md");
const uiDir = path.join(ROOT, "src", "components", "ui");

if (fs.existsSync(contractPath)) {
  const contract = fs.readFileSync(contractPath, "utf8");
  // Les tableaux du kit listent les composants en `CodeSpan` en début de
  // ligne : | `DataTable` | … |
  const promised = new Set();
  for (const m of contract.matchAll(/^\s*\|\s*`([A-Z][A-Za-z0-9]*)`\s*\|/gm)) {
    promised.add(m[1]);
  }

  if (promised.size > 0) {
    if (!fs.existsSync(uiDir)) {
      problems.push(
        `src/components/ui/ est ABSENT alors que le UI-CONTRACT promet ` +
          `${promised.size} composants — un agent suivant la doc ne trouvera rien`,
      );
    } else {
      const files = listFiles(uiDir, (f) => /\.tsx$/.test(f)).map((f) =>
        path.basename(f, ".tsx"),
      );
      // `DataTable` vit dans data-table.tsx : on compare en kebab-case.
      const kebab = (s) =>
        s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
      const have = new Set(files.map(kebab));
      const missing = [...promised].filter((c) => !have.has(kebab(c)));
      for (const c of missing) {
        problems.push(
          `le UI-CONTRACT promet le composant \`${c}\` — aucun fichier ` +
            `correspondant dans src/components/ui/`,
        );
      }
      console.log(
        `   Primitives promises : ${promised.size - missing.length}/${promised.size} présentes`,
      );
    }
  }
}

// --- 6. Gates déclarés -------------------------------------------------------

const gatesPath = path.join(ROOT, ".claude", "gates.config.js");
if (fs.existsSync(gatesPath)) {
  const gates = require(gatesPath);
  for (const g of gates) {
    const m = g.command.match(FILE_RE);
    if (m && !fs.existsSync(path.join(ROOT, m[1]))) {
      problems.push(`gate "${g.id}" lance ${m[1]} — fichier inexistant`);
    }
  }
  console.log(`   Gates : ${gates.length} vérifiés`);
} else {
  warnings.push(
    "gates.config.js absent — `pnpm gates:all` ne fonctionnera pas",
  );
}

// --- Rapport -----------------------------------------------------------------

console.log("");
if (warnings.length) {
  console.log(`⚠️  ${warnings.length} avertissement(s) :\n`);
  warnings.forEach((w) => console.log(`   • ${w}`));
  console.log("");
}

if (problems.length) {
  console.error(
    `❌ ${problems.length} problème(s) — un agent à froid s'y casserait les dents :\n`,
  );
  problems.forEach((p) => console.error(`   • ${p}`));
  console.error("");
  process.exit(1);
}

console.log(
  "✅ Dépôt cohérent. Un agent arrivant à froid trouvera ce que la doc annonce.\n",
);
process.exit(0);
