/**
 * capabilities.js
 * ---------------
 * Source unique de vérité sur "de quoi dispose cette machine / ce projet".
 *
 * Principe directeur du projet : **rien ne doit casser parce qu'un outil
 * manque**. Un prérequis absent donne un SKIP explicite avec la commande
 * d'installation — jamais un échec dur, jamais un faux succès silencieux.
 *
 * Utilisé par env-check.js et run-gates.js pour qu'ils ne divergent jamais.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

// --- Lecture de .env.local sans dépendance externe --------------------------

function loadEnvFile(file = ".env.local") {
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

const env = { ...loadEnvFile(), ...process.env };

// --- Valeurs factices -------------------------------------------------------

const PLACEHOLDER =
  /placeholder|your-|xxx+|\.\.\.|changeme|<.*>|^sk_test_123$|^price_.*_default$/i;

/** Une variable présente mais bidon est plus dangereuse qu'une absente :
 *  elle passe silencieusement et casse au runtime. */
const looksReal = (v) => Boolean(v) && !PLACEHOLDER.test(v);

const flag = (name, fallback = false) => {
  const v = env[name];
  if (v === undefined) return fallback;
  return v.toLowerCase() === "true" || v === "1";
};

// --- Détection de binaires --------------------------------------------------

const binCache = new Map();

/** Un binaire est disponible si `<bin> <versionArg>` sort en code 0. */
function hasBinary(bin, versionArg = "--version") {
  if (binCache.has(bin)) return binCache.get(bin);
  let ok = false;
  try {
    const probe = spawnSync(bin, [versionArg], {
      stdio: "ignore",
      shell: process.platform === "win32",
      timeout: 15000,
    });
    ok = probe.status === 0;
  } catch {
    ok = false;
  }
  binCache.set(bin, ok);
  return ok;
}

/** Docker installé ET démon qui répond — `docker --version` marche même
 *  quand le démon est éteint, ce qui donne un faux positif. */
function hasDockerRunning() {
  if (binCache.has("__docker_daemon")) return binCache.get("__docker_daemon");
  let ok = false;
  try {
    const probe = spawnSync("docker", ["info"], {
      stdio: "ignore",
      shell: process.platform === "win32",
      timeout: 20000,
    });
    ok = probe.status === 0;
  } catch {
    ok = false;
  }
  binCache.set("__docker_daemon", ok);
  return ok;
}

/** Navigateurs Playwright téléchargés (le paquet npm ne suffit pas). */
function hasPlaywrightBrowsers() {
  const roots = [
    process.env.PLAYWRIGHT_BROWSERS_PATH,
    path.join(process.env.LOCALAPPDATA || "", "ms-playwright"),
    path.join(process.env.HOME || "", ".cache", "ms-playwright"),
    path.join(process.env.HOME || "", "Library", "Caches", "ms-playwright"),
  ].filter(Boolean);
  return roots.some(
    (r) =>
      fs.existsSync(r) &&
      fs.readdirSync(r).some((d) => /chromium|firefox|webkit/.test(d)),
  );
}

const INSTALL = {
  supabase: {
    win32:
      "pnpm add -D supabase  (déjà en devDependencies, utiliser `pnpm exec supabase`)",
    darwin: "brew install supabase/tap/supabase",
    linux:
      "https://supabase.com/docs/guides/local-development/cli/getting-started",
  },
  docker: {
    win32:
      "Docker Desktop — https://docs.docker.com/desktop/install/windows-install/ (admin + WSL2 + redémarrage)",
    darwin: "brew install --cask docker",
    linux: "https://docs.docker.com/engine/install/",
  },
  k6: {
    win32: "winget install k6 --source winget",
    darwin: "brew install k6",
    linux: "https://grafana.com/docs/k6/latest/set-up/install-k6/",
  },
  playwright: {
    win32: "pnpm exec playwright install --with-deps chromium",
    darwin: "pnpm exec playwright install --with-deps chromium",
    linux: "pnpm exec playwright install --with-deps chromium",
  },
};

function installHint(tool) {
  const entry = INSTALL[tool];
  if (!entry) return null;
  return entry[process.platform] || entry.linux;
}

// --- Capacités du projet ----------------------------------------------------

const capabilities = {
  // Services externes — pilotés par les clés réellement renseignées
  supabase:
    looksReal(env.NEXT_PUBLIC_SUPABASE_URL) &&
    looksReal(env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  supabaseAdmin: looksReal(env.SUPABASE_SERVICE_ROLE_KEY),
  billing: flag("ENABLE_BILLING") && looksReal(env.STRIPE_SECRET_KEY),
  email: flag("ENABLE_EMAIL", looksReal(env.BREVO_API_KEY)),
  sentry: looksReal(env.SENTRY_DSN),
  analytics: flag("ENABLE_ANALYTICS"),

  // Outils locaux
  get supabaseCli() {
    return (
      hasBinary("supabase") ||
      fs.existsSync(path.resolve("node_modules/.bin/supabase"))
    );
  },
  get docker() {
    return hasDockerRunning();
  },
  get k6() {
    return hasBinary("k6", "version");
  },
  get playwrightBrowsers() {
    return hasPlaywrightBrowsers();
  },
};

module.exports = {
  env,
  flag,
  looksReal,
  PLACEHOLDER,
  hasBinary,
  hasDockerRunning,
  hasPlaywrightBrowsers,
  installHint,
  capabilities,
};
