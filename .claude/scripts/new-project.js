#!/usr/bin/env node
/**
 * new-project.js
 * --------------
 * Crée un NOUVEAU projet à partir du socle, dans un dossier séparé.
 *
 * Comble le trou structurel de la pipeline : jusqu'ici tout travaillait EN
 * PLACE. `/ns-ship` lancé dans saas-zero modifiait saas-zero. Impossible de
 * livrer à un client sans ça.
 *
 * Règle aussi ADR-005 (B2B vs B2C) : la variante de schéma est un paramètre
 * de création, pas une copie manuelle après coup.
 *
 * Usage :
 *   node .claude/scripts/new-project.js <nom> --variant=b2b|b2c
 *                                        [--type=saas|ecommerce|vitrine]
 *                                        [--target=<chemin>]
 *   node .claude/scripts/new-project.js boutique-diallo --variant=b2c --type=ecommerce
 *   node .claude/scripts/new-project.js --dry-run mon-saas --variant=b2b
 *
 * Par défaut le projet est créé À CÔTÉ du socle (../<nom>).
 */

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

// --- Arguments --------------------------------------------------------------

const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const name = argv.find((a) => !a.startsWith("--"));
const variantArg = argv.find((a) => a.startsWith("--variant="));
const typeArg = argv.find((a) => a.startsWith("--type="));
const targetArg = argv.find((a) => a.startsWith("--target="));

if (!name) {
  console.error("\n❌ Nom de projet manquant.\n");
  console.error(
    "   node .claude/scripts/new-project.js <nom> --variant=b2b|b2c\n",
  );
  process.exit(1);
}
if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
  console.error(`\n❌ Nom invalide : "${name}"`);
  console.error(
    "   Minuscules, chiffres et tirets uniquement (il sert de nom de paquet npm).\n",
  );
  process.exit(1);
}

const variant = variantArg ? variantArg.split("=")[1] : null;
if (!variant || !["b2b", "b2c"].includes(variant)) {
  console.error("\n❌ Variante manquante ou invalide.");
  console.error("   --variant=b2b  organisations, équipes, invitations, rôles");
  console.error("   --variant=b2c  utilisateur seul, pas d'organisation");
  console.error(
    "\n   Ce choix engage le schéma Supabase, les policies RLS et les pages.",
  );
  console.error(
    "   Il ne se change pas après coup sans migration (voir ADR-005).\n",
  );
  process.exit(1);
}

/**
 * Axe ORTHOGONAL à la variante.
 *
 * `--variant` répond « qui possède la donnée » : un utilisateur seul (b2c) ou
 * une organisation à plusieurs membres (b2b). `--type` répond « qu'est-ce
 * qu'on vend » : un abonnement (saas), des articles (ecommerce), ou rien
 * (vitrine). Les deux se combinent : une boutique B2B qui vend en gros est
 * `--variant=b2b --type=ecommerce`.
 *
 * Confondre les deux — ce que faisait la pipeline, qui n'avait que la
 * variante — obligeait à recoder le domaine boutique à chaque projet.
 */
const TYPES = {
  saas: "abonnement récurrent, quotas, portail de facturation",
  ecommerce: "catalogue, variantes, stock, panier, commandes",
  vitrine: "présentation et contact, aucune transaction",
};
const type = typeArg ? typeArg.split("=")[1] : "saas";
if (!Object.keys(TYPES).includes(type)) {
  console.error(`\n❌ Type invalide : "${type}"`);
  for (const [k, v] of Object.entries(TYPES)) {
    console.error(`   --type=${k.padEnd(10)} ${v}`);
  }
  console.error("\n   Par défaut : --type=saas\n");
  process.exit(1);
}

const SOURCE = process.cwd();
const TARGET = path.resolve(
  targetArg ? targetArg.split("=")[1] : path.join(SOURCE, "..", name),
);

// --- Ce qu'on copie, ce qu'on laisse ---------------------------------------

/** Jamais copiés : secrets, artefacts de build, dépendances, historique git. */
const EXCLUDE = new Set([
  ".git",
  ".env.local",
  ".env",
  "node_modules",
  ".next",
  "storybook-static",
  "test-results",
  "playwright-report",
  "playwright-visual-report",
  "playwright-a11y-report",
  ".lighthouseci",
  ".content-collections",
  ".turbo",
  ".vercel",
  "coverage",
]);

/** Rapports générés : ils décrivent le socle, pas le nouveau projet. */
const EXCLUDE_FILES = new Set([
  "DESIGN-AUDIT.md",
  "DISCOVERY-CHECK.md",
  "design-audit.json",
  "design-inventory.json",
  "design-tokens-audit.json",
  "discovery-check.json",
  "lighthouse-results.json",
  "build-output.txt",
  "BILAN_RAPPORT_COMPLET.md",
  ".mcp.json", // pointe sur le projet Supabase du socle
]);

/**
 * Documents d'identité : régénérés depuis leur .template pour que le nouveau
 * projet reparte d'une Discovery vierge. Les copier tels quels ferait passer
 * `discovery:check` à 100/100 en décrivant le mauvais produit — exactement le
 * genre de faux succès que la pipeline combat.
 */
const IDENTITY_DOCS = [
  "DISCOVERY.md",
  "SPEC.md",
  "ARCHITECTURE-CHOICE.md",
  "DESIGN-CHOICE.md",
];

function copyRecursive(from, to, rel = "") {
  const entries = fs.readdirSync(from, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDE.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const dst = path.join(to, entry.name);
    const relPath = path.join(rel, entry.name);

    if (entry.isSymbolicLink()) continue; // symlinks de skills tiers : chemins absolus
    if (entry.isDirectory()) {
      if (!DRY) fs.mkdirSync(dst, { recursive: true });
      copyRecursive(src, dst, relPath);
    } else {
      if (rel === "" && EXCLUDE_FILES.has(entry.name)) continue;
      if (rel === "" && IDENTITY_DOCS.includes(entry.name)) continue;
      if (!DRY) fs.copyFileSync(src, dst);
    }
  }
}

// --- Vérifications ----------------------------------------------------------

console.log(
  `\n🌱 Nouveau projet « ${name} » — ${variant.toUpperCase()} / ${type}\n`,
);
console.log(`   ${TYPES[type]}\n`);
console.log(`   Socle  : ${SOURCE}`);
console.log(`   Cible  : ${TARGET}`);
if (DRY) console.log(`   Mode   : simulation, rien n'est écrit`);
console.log("");

if (fs.existsSync(TARGET) && fs.readdirSync(TARGET).length > 0) {
  console.error(`❌ ${TARGET} existe et n'est pas vide. Refus d'écraser.\n`);
  process.exit(1);
}

const variantTemplate = path.join(
  SOURCE,
  "supabase",
  "schema-variants",
  variant,
);
const hasVariantTemplate = fs.existsSync(variantTemplate);

// --- Copie ------------------------------------------------------------------

if (!DRY) fs.mkdirSync(TARGET, { recursive: true });
copyRecursive(SOURCE, TARGET);
console.log(
  "   ✅ Socle copié (hors secrets, node_modules, build, historique git)",
);

// --- Schéma selon la variante ----------------------------------------------

/**
 * Détection PAR CONTENU, pas par nom de fichier.
 *
 * Un premier filtrage sur `_b2b_schema` / `_b2c_schema` laissait passer des
 * migrations tout aussi couplées : `fix_org_owner_membership` et
 * `taskflow_tables` référencent `organizations` et `organization_members`.
 * Dans un projet B2C elles échouaient sur
 *   relation "organizations" does not exist
 *
 * B2B crée des tables ; B2C n'en crée aucune (il ajoute des colonnes à
 * user_profiles) — d'où des marqueurs de nature différente.
 */
const VARIANT_MARKERS = {
  b2b: [
    /\borganizations\b/,
    /\borganization_members\b/,
    /\borganization_invites\b/,
    /\borganization_id\b/,
  ],
  b2c: [/get_my_role\s*\(/, /\bis_premium\s*\(/],
};

const targetMigrations = path.join(TARGET, "supabase", "migrations");
if (!DRY && fs.existsSync(targetMigrations)) {
  const other = variant === "b2b" ? "b2c" : "b2b";
  const otherMarkers = VARIANT_MARKERS[other];
  const parked = path.join(TARGET, "supabase", "schema-variants", other);
  fs.mkdirSync(parked, { recursive: true });

  /**
   * Les commentaires ne comptent pas.
   *
   * Sans ce nettoyage, `initial_schema.sql` était écarté à cause d'une seule
   * ligne de commentaire (« -- migration *_b2b_schema ajoute organization_id »)
   * et `pg_cron_jobs.sql` pour trois commentaires du même genre. Or
   * initial_schema est le SOCLE COMMUN : il crée user_profiles et les tables
   * Stripe. L'écarter laissait le schéma de variante sans rien où s'accrocher.
   */
  const stripSqlComments = (sql) =>
    sql.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/--[^\n]*/g, " ");

  /** Le socle commun ne peut jamais être écarté, quoi qu'il contienne. */
  const isSharedCore = (f) => /initial_schema/.test(f);

  for (const f of fs.readdirSync(targetMigrations)) {
    if (!f.endsWith(".sql")) continue;
    if (isSharedCore(f)) continue;

    const full = path.join(targetMigrations, f);
    const sql = stripSqlComments(fs.readFileSync(full, "utf8"));
    if (!otherMarkers.some((re) => re.test(sql))) continue;

    // Déplacée, pas supprimée : elle reste disponible si le projet bascule.
    fs.renameSync(full, path.join(parked, `${f}.template`));
    console.log(`   ✅ ${f} écartée (dépend du schéma ${other})`);
  }
  // Activer la variante choisie si elle n'est qu'un template
  const chosenTemplate = path.join(
    TARGET,
    "supabase",
    "schema-variants",
    variant,
  );
  if (fs.existsSync(chosenTemplate)) {
    for (const f of fs.readdirSync(chosenTemplate)) {
      if (!f.endsWith(".template")) continue;
      const dest = path.join(targetMigrations, f.replace(/\.template$/, ""));
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(chosenTemplate, f), dest);
        console.log(
          `   ✅ Migration ${variant} activée : ${path.basename(dest)}`,
        );
      }
    }
  }
}
if (!hasVariantTemplate && variant === "b2c") {
  console.log(
    `   ⚠️  Aucun template b2c trouvé — vérifier supabase/schema-variants/`,
  );
}

/**
 * Schéma du TYPE, posé par-dessus celui de la variante.
 *
 * `vitrine` n'a pas de schéma : c'est le point, elle ne stocke rien de
 * métier. `saas` n'en a pas non plus — abonnements et quotas vivent déjà
 * dans le socle commun (tables Stripe). Seul `ecommerce` ajoute son domaine.
 */
if (!DRY) {
  const typeTemplate = path.join(TARGET, "supabase", "schema-variants", type);
  const targetMigrationsDir = path.join(TARGET, "supabase", "migrations");
  if (fs.existsSync(typeTemplate) && fs.existsSync(targetMigrationsDir)) {
    for (const f of fs.readdirSync(typeTemplate)) {
      if (!f.endsWith(".template")) continue;
      const dest = path.join(targetMigrationsDir, f.replace(/\.template$/, ""));
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(typeTemplate, f), dest);
        console.log(`   ✅ Migration ${type} activée : ${path.basename(dest)}`);
      }
    }
  } else if (type === "ecommerce") {
    console.log(
      `   ⚠️  Aucun template ecommerce trouvé — vérifier supabase/schema-variants/ecommerce/`,
    );
  }
}

// --- Documents d'identité, repartis des templates --------------------------

if (!DRY) {
  for (const doc of IDENTITY_DOCS) {
    const tpl = path.join(SOURCE, `${doc}.template`);
    const dst = path.join(TARGET, doc);
    if (fs.existsSync(tpl)) {
      fs.copyFileSync(tpl, dst);
    } else {
      fs.writeFileSync(
        dst,
        `# ${doc}\n\n> À remplir par \`/ns-discovery\`.\n> Tant que ce document contient des placeholders, \`discovery:check\` échoue — c'est voulu.\n`,
      );
    }
  }
  console.log("   ✅ Discovery repartie de zéro (SPEC, ARCHITECTURE, DESIGN)");
}

// --- package.json ------------------------------------------------------------

if (!DRY) {
  const pkgPath = path.join(TARGET, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.name = name;
  pkg.version = "0.1.0";
  delete pkg.description;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`   ✅ package.json renommé en « ${name} »`);

  // .env.local à partir de l'exemple, jamais depuis le socle
  const example = path.join(TARGET, ".env.example");
  if (fs.existsSync(example)) {
    fs.copyFileSync(example, path.join(TARGET, ".env.local"));
    console.log("   ✅ .env.local créé depuis .env.example (à renseigner)");
  }
}

// --- Git vierge --------------------------------------------------------------

if (!DRY) {
  const git = spawnSync("git", ["init", "-q", "-b", "main"], { cwd: TARGET });
  if (git.status === 0) {
    console.log("   ✅ Dépôt git vierge (aucun historique du socle)");
  }
}

// --- Suite ------------------------------------------------------------------

console.log(`
${DRY ? "Simulation terminée — relancer sans --dry-run pour créer." : "Projet créé."}

Suite :
   cd ${path.relative(path.dirname(SOURCE), TARGET) || TARGET}
   pnpm install
   pnpm env:check          # dira exactement quelles clés renseigner
   /ns-discovery           # puis /ns-ship

Variante ${variant.toUpperCase()} verrouillée : le schéma ${variant === "b2b" ? "b2c" : "b2b"} a été retiré
des migrations actives. Changer d'avis après coup demande une migration (ADR-005).
`);
