import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

// Le libellé disait « Local Dev » alors que ces tests visent un déploiement
// (voir playwright.smoke.config.ts, qui exige SMOKE_BASE_URL).
test.describe("Smoke Tests - Deployment", () => {
  test("Home page loads", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/fr`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle(/Accueil/);
  });

  test("Blog page loads", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/fr/blog`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator("h1")).toContainText("Notre Blog");
  });

  test("Connexion page loads", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/fr/connexion`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator("form")).toBeVisible();
  });

  test("Inscription page loads", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto(`${BASE_URL}/fr/inscription`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await expect(page.locator("form")).toBeVisible();
  });

  test("Search API responds", async ({ request }) => {
    test.setTimeout(60000);
    const response = await request.get(`${BASE_URL}/api/search?q=test`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("results");
  });
});
