---
name: ns-visual-regression
description: Visual regression testing with Playwright and pixelmatch. Captures screenshots and compares against baselines to detect visual changes.
---

# Visual Regression Testing with Playwright

## Installation

```bash
npm install -D @playwright/test pixelmatch pngjs
```

## Configuration

```typescript
// playwright.visual.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
});
```

## Visual Regression Test (using pixelmatch-helper)

```typescript
// tests/visual/landing.spec.ts
import { test, expect } from "@playwright/test";
import {
  compareWithBaseline,
  assertVisualMatch,
  updateBaseline,
} from "./pixelmatch-helper";

test.describe("Landing Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Landing - Hero section", async ({ page }) => {
    const hero = page.locator('[data-testid="landing-hero"]');
    await expect(hero).toBeVisible();

    // Take screenshot of hero section
    const screenshotPath = await hero.screenshot({
      path: "tests/visual/screenshots/actual/landing-hero.png",
    });

    // Compare with baseline
    const result = await compareWithBaseline("landing-hero", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.99);
  });

  test("Landing - Features section", async ({ page }) => {
    const features = page.locator('[data-testid="landing-features"]');
    await expect(features).toBeVisible();

    const screenshotPath = await features.screenshot({
      path: "tests/visual/screenshots/actual/landing-features.png",
    });
    const result = await compareWithBaseline(
      "landing-features",
      screenshotPath,
    );
    expect(result.similarity).toBeGreaterThanOrEqual(0.99);
  });

  test("Landing - Full page", async ({ page }) => {
    const screenshotPath = await page.screenshot({
      path: "tests/visual/screenshots/actual/landing-full.png",
      fullPage: true,
    });
    const result = await compareWithBaseline("landing-full", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.99);
  });
});

test.describe("Auth Pages Visual Regression", () => {
  test("Login page", async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const screenshotPath = await page.screenshot({
      path: "tests/visual/screenshots/actual/auth-login.png",
      fullPage: true,
    });
    const result = await compareWithBaseline("auth-login", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.995);
  });

  test("Register page", async ({ page }) => {
    await page.goto("/fr/inscription");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(500);

    const screenshotPath = await page.screenshot({
      path: "tests/visual/screenshots/actual/auth-register.png",
      fullPage: true,
    });
    const result = await compareWithBaseline("auth-register", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.995);
  });
});

test.describe("Dashboard Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    // Assumes auth is handled or page is accessible
    await page.goto("/fr/tableau-de-bord");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Dashboard", async ({ page }) => {
    const screenshotPath = await page.screenshot({
      path: "tests/visual/screenshots/actual/dashboard.png",
      fullPage: true,
    });
    const result = await compareWithBaseline("dashboard", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.98);
  });
});

test.describe("Components Demo Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/components-demo");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("All components", async ({ page }) => {
    const screenshotPath = await page.screenshot({
      path: "tests/visual/screenshots/actual/components-demo.png",
      fullPage: true,
    });
    const result = await compareWithBaseline("components-demo", screenshotPath);
    expect(result.similarity).toBeGreaterThanOrEqual(0.99);
  });
});
```

## Update Baselines

```bash
# Update all baselines (run when intentional visual changes)
UPDATE_SNAPSHOTS=1 pnpm test:visual

# Or programmatically in tests:
import { updateBaseline } from "./pixelmatch-helper";
// After taking screenshot:
await updateBaseline('test-name', actualScreenshotPath);
```

## Pixelmatch Configuration

```typescript
// tests/visual/pixelmatch-config.ts
// Defines per-page thresholds, viewports, wait selectors
// Use getAllConfigs() to run all configured visual tests
```

## Pixelmatch Helper (tests/visual/pixelmatch-helper.ts)

The helper provides:

- `compareImages()` - Compare two PNG files
- `compareWithBaseline()` - Compare actual screenshot with baseline
- `updateBaseline()` - Save actual as new baseline
- `assertVisualMatch()` - Assert similarity >= threshold (throws on failure)

## Commands

```bash
# Run visual regression tests
pnpm test:visual

# Update baselines (after intentional design changes)
UPDATE_SNAPSHOTS=1 pnpm test:visual

# Run with specific config
pnpm test:visual --project=chromium
```

## CI Integration

```yaml
# .github/workflows/visual-regression.yml
- name: Visual Regression Tests
  run: |
    pnpm build
    pnpm dev &
    sleep 10
    pnpm test:visual
  env:
    UPDATE_SNAPSHOTS: ${{ github.event_name == 'workflow_dispatch' }}
```
