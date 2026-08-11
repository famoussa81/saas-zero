#!/usr/bin/env node
/**
 * env-check.js
 * ------------
 * Vérifie les variables d'environnement RÉELLEMENT utilisées par le code.
 *
 * Remplace l'ancien one-liner npm qui était faux sur trois plans :
 *   1. il faisait `require("dotenv")` — paquet non installé, donc il plantait
 *      en MODULE_NOT_FOUND avant même de vérifier quoi que ce soit ;
 *   2. il exigeait SUPABASE_URL, SUPABASE_ANON_KEY et STRIPE_PUBLISHABLE_KEY,
 *      trois variables qu'aucun fichier du projet ne lit (le code utilise
 *      NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY) ;
 *   3. il exigeait Stripe et Brevo en dur, rendant impossible un déploiement
 *      sans billing ni email.
 *
 * Trois niveaux :
 *   - REQUIRED    : l'app ne démarre pas sans
 *   - CONDITIONAL : requis seulement si la fonctionnalité est activée
 *   - OPTIONAL    : dégradation propre si absent
 *
 * Détecte aussi les valeurs factices (placeholder, xxx, your-…) : une variable
 * présente mais bidon est plus dangereuse qu'une variable absente, parce
 * qu'elle passe silencieusement.
 */

const fs = require("node:fs");
const path = require("node:path");

// --- Chargement de .env.local (sans dépendance externe) ---------------------

function loadEnvFile(file) {
  const full = path.resolve(process.cwd(), file);
  if (!fs.existsSync(full)) return {};
  const out = {};
  for (const raw of fs.readFileSync(full, "utf8").split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const fileEnv = loadEnvFile(".env.local");
const env = { ...fileEnv, ...process.env };

const flag = (name, fallback = false) => {
  const v = env[name];
  if (v === undefined) return fallback;
  return v.toLowerCase() === "true" || v === "1";
};

// --- Définition ------------------------------------------------------------

const PLACEHOLDER =
  /placeholder|your-|xxx+|\.\.\.|changeme|<.*>|^sk_test_123$/i;
const looksReal = (v) => Boolean(v) && !PLACEHOLDER.test(v);

const ENABLE_BILLING = flag("ENABLE_BILLING");
// Pas de flag ENABLE_EMAIL explicite dans la plupart des projets : on considère
// l'email activé dès qu'une clé Brevo VRAIE est présente. Une clé factice ne
// compte pas — sinon le check exigerait de configurer une fonctionnalité que
// personne n'a demandée.
const ENABLE_EMAIL = flag("ENABLE_EMAIL", looksReal(env.BREVO_API_KEY));

const CHECKS = [
  // Toujours nécessaires
  {
    key: "NEXT_PUBLIC_APP_URL",
    level: "REQUIRED",
    why: "URL publique (OAuth, emails, webhooks)",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_URL",
    level: "REQUIRED",
    why: "Client Supabase",
  },
  {
    key: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    level: "REQUIRED",
    why: "Client Supabase",
  },
  {
    key: "SUPABASE_SERVICE_ROLE_KEY",
    level: "REQUIRED",
    why: "Webhooks / opérations hors RLS",
  },

  // Billing — seulement si ENABLE_BILLING=true
  {
    key: "STRIPE_SECRET_KEY",
    level: "CONDITIONAL",
    on: ENABLE_BILLING,
    feature: "ENABLE_BILLING",
    why: "Checkout, portail",
  },
  {
    key: "STRIPE_WEBHOOK_SECRET",
    level: "CONDITIONAL",
    on: ENABLE_BILLING,
    feature: "ENABLE_BILLING",
    why: "Vérification de signature du webhook",
  },
  {
    key: "STRIPE_PRICE_STARTER_MONTHLY",
    level: "CONDITIONAL",
    on: ENABLE_BILLING,
    feature: "ENABLE_BILLING",
    why: "Prix du plan Starter",
  },
  {
    key: "STRIPE_PRICE_PRO_MONTHLY",
    level: "CONDITIONAL",
    on: ENABLE_BILLING,
    feature: "ENABLE_BILLING",
    why: "Prix du plan Pro",
  },
  {
    key: "STRIPE_PRICE_ENTERPRISE_MONTHLY",
    level: "CONDITIONAL",
    on: ENABLE_BILLING,
    feature: "ENABLE_BILLING",
    why: "Prix du plan Enterprise",
  },

  // Email transactionnel
  {
    key: "BREVO_API_KEY",
    level: "CONDITIONAL",
    on: ENABLE_EMAIL,
    feature: "ENABLE_EMAIL",
    why: "Emails transactionnels",
  },
  {
    key: "BREVO_SENDER_EMAIL",
    level: "CONDITIONAL",
    on: ENABLE_EMAIL,
    feature: "ENABLE_EMAIL",
    why: "Expéditeur des emails",
  },

  // Optionnels
  { key: "SENTRY_DSN", level: "OPTIONAL", why: "Monitoring d'erreurs" },
];

// --- Détection de valeurs factices ------------------------------------------

function inspect({ key }) {
  const value = env[key];
  if (value === undefined || value === "") return { state: "missing" };
  if (PLACEHOLDER.test(value)) return { state: "placeholder", value };
  return { state: "ok" };
}

// --- Exécution --------------------------------------------------------------

console.log("\n🔑 Vérification des variables d'environnement\n");
console.log(`   Billing : ${ENABLE_BILLING ? "activé" : "désactivé"}`);
console.log(`   Email   : ${ENABLE_EMAIL ? "activé" : "désactivé"}\n`);

const errors = [];
const warnings = [];

for (const check of CHECKS) {
  const applicable =
    check.level === "REQUIRED" ||
    (check.level === "CONDITIONAL" && check.on) ||
    check.level === "OPTIONAL";

  if (!applicable) {
    console.log(`   ⏭️  ${check.key} — ignoré (${check.feature} désactivé)`);
    continue;
  }

  const { state, value } = inspect(check);
  const blocking =
    check.level === "REQUIRED" || (check.level === "CONDITIONAL" && check.on);

  if (state === "ok") {
    console.log(`   ✅ ${check.key}`);
  } else if (state === "placeholder") {
    const msg = `${check.key} = valeur factice ("${value}") — ${check.why}`;
    if (blocking) {
      console.log(`   ❌ ${msg}`);
      errors.push(msg);
    } else {
      console.log(`   ⚠️  ${msg}`);
      warnings.push(msg);
    }
  } else {
    const msg = `${check.key} manquante — ${check.why}`;
    if (blocking) {
      console.log(`   ❌ ${msg}`);
      errors.push(msg);
    } else {
      console.log(`   ⚠️  ${msg} (optionnel)`);
      warnings.push(msg);
    }
  }
}

console.log("");
if (warnings.length) {
  console.log(
    `⚠️  ${warnings.length} avertissement(s) — dégradation acceptée.`,
  );
}
if (errors.length) {
  console.error(`\n❌ ${errors.length} variable(s) bloquante(s) :\n`);
  errors.forEach((e) => console.error(`   • ${e}`));
  console.error(
    "\nRenseigner .env.local, ou désactiver la fonctionnalité concernée.\n",
  );
  process.exit(1);
}

console.log("✅ Environnement valide.\n");
process.exit(0);
