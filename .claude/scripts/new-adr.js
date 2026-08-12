#!/usr/bin/env node
/**
 * new-adr.js
 * ----------
 * Crée un Architecture Decision Record numéroté.
 *
 * `pnpm adr:new` était cité dans CLAUDE.md et AGENTS.md sans exister — un
 * agent qui suivait la consigne « pour créer un ADR : npm run adr:new »
 * tombait sur « command not found ».
 *
 * Usage : pnpm adr:new "Titre de la décision"
 */

const fs = require("node:fs");
const path = require("node:path");

const title = process.argv.slice(2).join(" ").trim();
if (!title) {
  console.error(
    '\n❌ Titre manquant.\n\n   pnpm adr:new "Titre de la décision"\n',
  );
  process.exit(1);
}

const dir = path.resolve(process.cwd(), "docs/adr");
fs.mkdirSync(dir, { recursive: true });

const existing = fs
  .readdirSync(dir)
  .map((f) => parseInt(f.slice(0, 3), 10))
  .filter((n) => !Number.isNaN(n));
const next = String((existing.length ? Math.max(...existing) : 0) + 1).padStart(
  3,
  "0",
);

const slug = title
  .toLowerCase()
  .normalize("NFD")
  .replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

const file = path.join(dir, `${next}-${slug}.md`);
const today = new Date().toISOString().slice(0, 10);

fs.writeFileSync(
  file,
  `# ADR ${next} : ${title}

**Statut** : Proposed
**Date** : ${today}

## Contexte

<!-- Quelle situation impose de trancher ? Quelles contraintes ? -->

## Décision

<!-- Ce qui est décidé, formulé à l'affirmatif. -->

## Alternatives écartées

<!-- Ce qu'on n'a PAS choisi, et pourquoi. C'est souvent la partie la plus
     utile six mois plus tard. -->

## Conséquences

<!-- Ce que ça engage : tables, RLS, pages, gates, dépendances.
     Y compris ce que ça rend plus difficile. -->
`,
);

console.log(`\n✅ ${path.relative(process.cwd(), file)}\n`);
console.log("   Passer le statut à Accepted une fois validé.\n");
