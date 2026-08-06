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
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/visual',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
}
```

## Visual Regression Test

```typescript
// tests/visual/homepage.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Homepage Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1000);
  });

  test("Homepage - Desktop", async ({ page }) => {
    await expect(page).toHaveScreenshot("homepage-desktop.png", {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("Homepage - Mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page).toHaveScreenshot("homepage-mobile.png", {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("Homepage - Tablet", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page).toHaveScreenshot("homepage-tablet.png", {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe("Blog Page Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/blog");
    await page.waitForLoadState("networkidle");
  });

  test("Blog Index - Desktop", async ({ page }) => {
    await expect(page).toHaveScreenshot("blog-index-desktop.png", {
      fullPage: true,
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});

test.describe("Component Visual Regression", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/components-demo");
    await page.waitForLoadState("networkidle");
  });

  test("Button Variants", async ({ page }) => {
    await expect(
      page.locator('[data-testid="button-variants"]'),
    ).toHaveScreenshot("button-variants.png", {
      maxDiffPixels: 50,
      threshold: 0.1,
    });
  });

  test("Form Components", async ({ page }) => {
    await expect(
      page.locator('[data-testid="form-components"]'),
    ).toHaveScreenshot("form-components.png", {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});
```

## Pixelmatch Configuration

```typescript
// tests/visual/pixelmatch-config.ts
import { expect } from "@playwright/test";

expect.extend({
  toHaveScreenshot(
    received: Buffer,
    expected: Buffer | string,
    options?: {
      maxDiffPixels?: number;
      threshold?: number;
      maxDiffPixelRatio?: number;
    },
  ) {
    const { diffPixels, diffRatio } = compareImages(received, expected);

    const maxDiffPixels = options?.maxDiffPixels ?? 100;
    const threshold = options?.threshold ?? 0.2;

    const pass = diffPixels <= maxDiffPixels && diffRatio <= threshold;

    return {
      pass,
      message: () =>
        pass
          ? `Images match within threshold`
          : `Images differ: ${diffPixels} pixels (${(diffRatio * 100).toFixed(2)}%)`,
    };
  },
});
```

## Pixelmatch Helper

```typescript
// tests/visual/pixelmatch-helper.ts
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export interface ImageComparisonResult {
  diffPixels: number;
  diffRatio: number;
  diffImage?: Buffer;
}

export async function compareImages(
  actualPath: string,
  expectedPath: string,
  options: {
    threshold?: number;
    includeAA?: boolean;
    alpha?: number;
  } = {},
): Promise<{ diffPixels: number; diffRatio: number; diffImage?: Buffer }> {
  const actualImg = PNG.sync.read(readFileSync(actualPath));
  const expectedImg = PNG.sync.read(readFileSync(expectedPath));

  const { width, height } = actualImg;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    actualImg.data,
    expectedImg.data,
    diff.data,
    width,
    height,
    {
      threshold: 0.1,
      includeAA: true,
      alpha: 0.1,
      ...options,
    },
  );

  const diffRatio = diffPixels / (width * height);

  return {
    diffPixels,
    diffRatio,
    diffImage: PNG.sync.write(diff),
  };
}

export async function saveScreenshot(
  page: any,
  name: string,
  options: {
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
  } = {},
) {
  const screenshotDir = join(process.cwd(), "tests", "visual", "screenshots");
  const actualDir = join(screenshotDir, "actual");
  const expectedDir = join(screenshotDir, "expected");

  await mkdir(actualDir, { recursive: true });
  await mkdir(expectedDir, { recursive: true });

  const path = join(actualDir, `${name}.png`);
  await page.screenshot({ path, fullPage: true, ...options });

  return path;
}

export async function compareWithBaseline(
  page: any,
  name: string,
  options: { threshold?: number } = {},
): Promise<boolean> {
  const actualPath = await saveScreenshot(page, name);
  const expectedPath = join(
    process.cwd(),
    "tests",
    "visual",
    "expected",
    `${name}.png`,
  );

  const { diffPixels, diffRatio } = await compareImages(
    actualPath,
    expectedPath,
  );

  const threshold = 0.2;
  const maxDiffPixels = 100;

  if (diffPixels <= 100 && diffRatio <= threshold) {
    return true;
  }

  const { diffImage } = await compareImages(
    join(process.cwd(), "tests", "visual", "actual", `${name}.png`),
    expectedPath,
  );

  if (diffImage) {
    writeFileSync(
      join(process.cwd(), "tests", "visual", "diff", `${name}-diff.png`),
      diffImage,
    );
  }

  return false;
}
```
