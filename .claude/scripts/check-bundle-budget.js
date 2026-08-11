#!/usr/bin/env node
/**
 * check-bundle-budget.js
 * ----------------------
 * Vérifie que le JavaScript envoyé au navigateur reste sous budget.
 *
 * L'ancien gate:bundle était `cross-env ANALYZE=true pnpm build` : il ouvrait
 * un rapport visuel, ne comparait rien à un seuil, et ne pouvait donc jamais
 * échouer. Un gate qui ne peut pas échouer n'est pas un gate.
 *
 * Contexte du projet : cible des marchés à bande passante coûteuse. Chaque Ko
 * de JS est payé par l'utilisateur final, pas par nous.
 *
 * Budgets dans .claude/gates.config.js ou via variables d'environnement.
 */

const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

/**
 * MÉTRIQUE — ce qu'on mesure et ce qu'on n'enforce PAS.
 *
 * La somme de tous les fichiers de .next/static/chunks n'est PAS le poids
 * d'une page : chaque route a ses propres chunks, un visiteur n'en télécharge
 * qu'un sous-ensemble. L'enforcer punirait le fait d'ajouter des routes, même
 * parfaitement découpées.
 *
 * On enforce donc :
 *   - le PLUS GROS chunk isolé (proxy fiable d'une dépendance trop lourde)
 *   - le total des chunks PARTAGÉS (framework, main, webpack) — eux, tout le
 *     monde les télécharge sur la première visite
 * Le total global reste affiché, en information seulement.
 */
const CHUNK_BUDGET_KB = Number(process.env.CHUNK_BUDGET_KB || 250);
const SHARED_BUDGET_KB = Number(process.env.SHARED_BUDGET_KB || 300);

/**
 * Les chunks partagés sont lus dans .next/build-manifest.json (`rootMainFiles`),
 * pas devinés d'après leur nom : Turbopack produit des noms hashés opaques
 * (`1su4vfh6y8f5n.js`), donc tout filtre par motif ne matcherait rien et le
 * check mesurerait silencieusement zéro.
 */
function readSharedChunkNames() {
  const manifest = path.resolve(process.cwd(), ".next/build-manifest.json");
  if (!fs.existsSync(manifest)) return null;
  try {
    const m = JSON.parse(fs.readFileSync(manifest, "utf8"));
    const files = [...(m.rootMainFiles || []), ...(m.polyfillFiles || [])];
    return files
      .filter((f) => f.endsWith(".js"))
      .map((f) => f.replace(/^static\/chunks\//, ""));
  } catch {
    return null;
  }
}

const CHUNKS_DIR = path.resolve(process.cwd(), ".next/static/chunks");

if (!fs.existsSync(CHUNKS_DIR)) {
  console.log("\n⏭️  Pas de build trouvé (.next/static/chunks absent).");
  console.log("   Lancer `pnpm build` d'abord — gate ignoré, non bloquant.\n");
  process.exit(0);
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith(".js")) out.push(full);
  }
  return out;
}

const files = walk(CHUNKS_DIR).map((file) => {
  const raw = fs.readFileSync(file);
  return {
    name: path.relative(CHUNKS_DIR, file),
    gzipKb: zlib.gzipSync(raw).length / 1024,
  };
});

if (!files.length) {
  console.log("\n⏭️  Aucun chunk JS trouvé — gate ignoré.\n");
  process.exit(0);
}

const totalKb = files.reduce((s, f) => s + f.gzipKb, 0);
const sorted = files.sort((a, b) => b.gzipKb - a.gzipKb);
const biggest = sorted[0];
const sharedNames = readSharedChunkNames();
const shared =
  sharedNames === null
    ? null
    : files.filter((f) => sharedNames.includes(f.name.replace(/\\/g, "/")));
const sharedKb = shared ? shared.reduce((s, f) => s + f.gzipKb, 0) : null;

console.log("\n📦 Budget de bundle (gzip)\n");
console.log(
  `   Plus gros chunk : ${biggest.gzipKb.toFixed(1)} Ko   (budget ${CHUNK_BUDGET_KB} Ko)`,
);
console.log(`                     ${biggest.name}`);
if (shared === null) {
  console.log(
    `   Chunks partagés : non mesurable (build-manifest.json illisible) — check ignoré`,
  );
} else {
  console.log(
    `   Chunks partagés : ${sharedKb.toFixed(1)} Ko   (budget ${SHARED_BUDGET_KB} Ko, ${shared.length} fichier(s))`,
  );
}
console.log(
  `   Total toutes routes : ${totalKb.toFixed(1)} Ko   (information — un visiteur n'en charge qu'une partie)`,
);

console.log("\n   Top 5 :");
sorted.slice(0, 5).forEach((f) => {
  console.log(`     ${f.gzipKb.toFixed(1).padStart(7)} Ko  ${f.name}`);
});

const errors = [];
if (biggest.gzipKb > CHUNK_BUDGET_KB) {
  errors.push(
    `Chunk ${biggest.name} : ${biggest.gzipKb.toFixed(1)} Ko > budget ${CHUNK_BUDGET_KB} Ko`,
  );
}
if (shared !== null && sharedKb > SHARED_BUDGET_KB) {
  errors.push(
    `Chunks partagés ${sharedKb.toFixed(1)} Ko > budget ${SHARED_BUDGET_KB} Ko ` +
      `(chargés sur TOUTES les pages)`,
  );
}

if (errors.length) {
  console.error("\n❌ Budget dépassé :\n");
  errors.forEach((e) => console.error(`   • ${e}`));
  console.error(
    "\nPistes : import dynamique des grosses libs, retirer une dépendance,\n" +
      "vérifier qu'une lib serveur n'a pas fui côté client.\n" +
      "Ajuster le seuil : CHUNK_BUDGET_KB=350 pnpm gate:bundle\n",
  );
  process.exit(1);
}

console.log("\n✅ Bundle dans les budgets.\n");
process.exit(0);
