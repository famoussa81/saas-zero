import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Smoke Tests - Local Dev", () => {
  test("Home page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page).toHaveTitle(/Accueil/);
  });

  test("Blog page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/blog`);
    await expect(page.locator("h1")).toContainText("Notre Blog");
  });

  test("Connexion page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/connexion`);
    await expect(page.locator("form")).toBeVisible();
  });

  test("Inscription page loads", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/inscription`);
    await expect(page.locator("form")).toBeVisible();
  });

  test("Search API responds", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/search?q=test`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data).toHaveProperty("results");
  });
});
