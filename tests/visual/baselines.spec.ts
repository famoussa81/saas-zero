import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

/**
 * Régression visuelle — la page DOIT être déterministe avant capture.
 *
 * Le hero contient une timeline GSAP en boucle infinie (PipelineHero), des
 * reveals au scroll et un `animate-pulse`. Une capture plein écran prise à un
 * instant arbitraire attrape l'animation à une frame différente à chaque
 * exécution : le test échouait alors sans qu'aucun code n'ait changé.
 *
 * Trois verrous, complémentaires :
 *  1. `reducedMotion: "reduce"` — les composants du projet respectent cette
 *     préférence et rendent directement leur état final (voir ns-motion) ;
 *  2. `animations: "disabled"` de Playwright — fige les animations CSS et Web
 *     Animations restantes sur leur dernière frame ;
 *  3. attente des polices — sans elle, la capture peut partir avant le swap
 *     et décaler toute la mise en page.
 */
async function prepare(page: import("@playwright/test").Page, url: string) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
}

test.describe("Visual Regression - Baselines", () => {
  test("Home page visual baseline", async ({ page }) => {
    await prepare(page, `${BASE_URL}/fr`);
    await expect(page).toHaveScreenshot("home-fr.png", {
      fullPage: true,
      animations: "disabled",
      // Tolère le bruit de rendu sous-pixel entre exécutions sans masquer
      // une vraie régression visuelle.
      maxDiffPixelRatio: 0.01,
    });
  });

  test("Blog page visual baseline", async ({ page }) => {
    await prepare(page, `${BASE_URL}/fr/blog`);
    await expect(page).toHaveScreenshot("blog-fr.png", {
      fullPage: true,
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
    });
  });
});
