import { defineConfig, devices } from "@playwright/test";

/**
 * Smoke tests — exécutés CONTRE UN DÉPLOIEMENT, jamais contre localhost.
 *
 * L'URL était codée en dur sur `https://saas-zero.vercel.app`, le domaine de
 * démonstration du starter. Deux conséquences :
 *
 *  1. Un projet généré par `pnpm ns:new` visait un domaine qui n'est pas le
 *     sien. Au mieux un 404, au pire le site de quelqu'un d'autre.
 *  2. Les specs de `tests/e2e/` construisent leurs URL depuis
 *     `PLAYWRIGHT_BASE_URL || "http://localhost:3000"` et ignorent le
 *     `baseURL` de cette config. `pnpm test:smoke` testait donc localhost
 *     tout en affichant « testing against deployed URL » — un faux succès.
 *
 * L'URL vient maintenant de l'environnement, et l'absence de valeur est une
 * erreur explicite : un smoke test qui retombe silencieusement sur localhost
 * ne vérifie pas le déploiement, il ment.
 */
const baseURL =
  process.env.SMOKE_BASE_URL ??
  process.env.PLAYWRIGHT_BASE_URL ??
  process.env.NEXT_PUBLIC_APP_URL;

if (!baseURL) {
  throw new Error(
    "Smoke tests : URL de déploiement absente.\n" +
      "Définir SMOKE_BASE_URL (ou PLAYWRIGHT_BASE_URL / NEXT_PUBLIC_APP_URL) :\n" +
      "  SMOKE_BASE_URL=https://mon-projet.vercel.app pnpm test:smoke",
  );
}

// Les specs lisent PLAYWRIGHT_BASE_URL directement ; on l'aligne pour que
// `use.baseURL` et les specs visent la même cible.
process.env.PLAYWRIGHT_BASE_URL = baseURL;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/e2e/smoke.spec.ts"],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Pas de webServer : on teste un déploiement, pas un serveur local.
});
