import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

const pages = ["/fr", "/fr/connexion", "/fr/inscription", "/fr/blog"];

for (const pagePath of pages) {
  test(`a11y: ${pagePath}`, async ({ page }) => {
    await page.goto(`${BASE_URL}${pagePath}`, {
      waitUntil: "domcontentloaded",
    });
    // Skip if we hit Next.js error page (missing Supabase config)
    const isErrorPage = await page.locator("#__next_error__").isVisible();
    if (isErrorPage) {
      test.skip(
        true,
        "Skipping - Next.js error page (Supabase not configured)",
      );
    }
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
