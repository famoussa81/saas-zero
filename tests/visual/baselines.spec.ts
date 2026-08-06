import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Visual Regression - Baselines", () => {
  test("Home page visual baseline", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr`);
    await expect(page).toHaveScreenshot("home-fr.png", { fullPage: true });
  });

  test("Blog page visual baseline", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/blog`);
    await expect(page).toHaveScreenshot("blog-fr.png", { fullPage: true });
  });
});
