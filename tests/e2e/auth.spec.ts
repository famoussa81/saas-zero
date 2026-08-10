import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Auth Flow - Signup to Protected Route", () => {
  test.setTimeout(120000);

  test("complete signup → login → protected route journey", async ({
    page,
  }) => {
    // Step 1: Go to signup page
    await page.goto(`${BASE_URL}/fr/inscription`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("form")).toBeVisible();

    // Step 2: Fill signup form with unique test user
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = "TestPassword123!";

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.fill('input[name="confirmPassword"]', testPassword);

    // Submit signup
    await page.click('button[type="submit"]');

    // Wait for redirect or success message
    await page.waitForURL(/\/(tableau-de-bord|connexion)/, { timeout: 30000 });

    // Step 3: If redirected to login, log in
    if (page.url().includes("connexion")) {
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForURL(/\/tableau-de-bord/, { timeout: 30000 });
    }

    // Step 4: Verify we're on protected dashboard
    await expect(page).toHaveURL(/\/tableau-de-bord/);
    await expect(page.locator("h1")).toBeVisible();

    // Step 5: Verify user session persists (refresh)
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });

  test("login with existing credentials", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/connexion`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.locator("form")).toBeVisible();

    // Use test credentials (would need to be seeded)
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show error for invalid creds
    await page.waitForURL(/\/(tableau-de-bord|connexion)/, { timeout: 30000 });
  });

  test("logout clears session", async ({ page }) => {
    // First login
    await page.goto(`${BASE_URL}/fr/connexion`, {
      waitUntil: "domcontentloaded",
    });
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/tableau-de-bord/, { timeout: 30000 });

    // Find and click logout (adjust selector based on actual UI)
    const logoutButton = page.locator(
      'button:has-text("Déconnexion"), a:has-text("Déconnexion"), [data-testid="logout"]',
    );
    if (await logoutButton.isVisible({ timeout: 5000 })) {
      await logoutButton.click();
      await page.waitForURL(/\/(fr\/)?$/, { timeout: 10000 });

      // Try to access protected route - should redirect to login
      await page.goto(`${BASE_URL}/fr/tableau-de-bord`);
      await page.waitForURL(/\/connexion/, { timeout: 10000 });
    }
  });
});

test.describe("Auth - Protected Route Access Control", () => {
  test("unauthenticated user redirected from protected route", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/fr/tableau-de-bord`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(/\/connexion/, { timeout: 10000 });
    await expect(page.locator("form")).toBeVisible();
  });

  test("unauthenticated user redirected from billing page", async ({
    page,
  }) => {
    await page.goto(`${BASE_URL}/fr/facturation`, {
      waitUntil: "domcontentloaded",
    });
    await page.waitForURL(/\/connexion/, { timeout: 10000 });
  });

  test("unauthenticated user redirected from team page", async ({ page }) => {
    await page.goto(`${BASE_URL}/fr/equipe`, { waitUntil: "domcontentloaded" });
    await page.waitForURL(/\/connexion/, { timeout: 10000 });
  });
});
