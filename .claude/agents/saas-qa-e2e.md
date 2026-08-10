---
name: saas-qa-e2e
description: Playwright E2E pour 3 flux critiques SaaS (Auth, Billing, Core Journey) + responsive, accessibilité, visual regression.
---

# Agent: `saas-qa-e2e`

> **Rôle** : Playwright E2E tests pour 3 flux critiques SaaS (Auth, Billing, Core Journey) + responsive, accessibilité, visual regression.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)"
```

---

## Responsabilités

### 1. Configuration Playwright

**`playwright.config.ts`** :

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

**`playwright.visual.config.ts`** (Visual Regression) :

```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/baselines",
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
```

### 2. Test Helpers (`tests/e2e/helpers/`)

**`auth.ts`** :

```typescript
import { test, type Page } from "@playwright/test";

export async function login(
  page: Page,
  email: string,
  password: string,
  locale = "fr",
) {
  await page.goto(`/${locale}/connexion`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`/${locale}/tableau-de-bord`);
}

export async function register(
  page: Page,
  data: { email: string; password: string; name: string },
  locale = "fr",
) {
  await page.goto(`/${locale}/inscription`);
  await page.fill('input[name="name"]', data.name);
  await page.fill('input[name="email"]', data.email);
  await page.fill('input[name="password"]', data.password);
  await page.fill('input[name="confirmPassword"]', data.password);
  await page.click('button[type="submit"]');
  // Email verification handled in test
}

export async function logout(page: Page, locale = "fr") {
  await page.click('[data-testid="user-menu-trigger"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL(`/${locale}`);
}
```

**`billing.ts`** :

```typescript
import { test, type Page } from "@playwright/test";

export async function startCheckout(
  page: Page,
  plan: "pro" | "enterprise",
  locale = "fr",
) {
  await page.goto(`/${locale}/pricing`);
  await page.click(`[data-testid="pricing-${plan}-cta"]`);
  // Redirect to Stripe Checkout (test mode)
  await page.waitForURL(/checkout\.stripe\.com/);
}

export async function openPortal(page: Page, locale = "fr") {
  await page.goto(`/${locale}/facturation`);
  await page.click('[data-testid="open-portal-button"]');
  await page.waitForURL(/billing\.stripe\.com/);
}
```

### 3. Test Suites Obligatoires

#### A. Auth Flow (`tests/e2e/auth.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";
import { login, register, logout } from "./helpers/auth";

test.describe("Auth Flow", () => {
  test("login with email/password", async ({ page }) => {
    await login(page, "test@example.com", "password123");
    await expect(page).toHaveURL(/\/tableau-de-bord/);
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test("register new user", async ({ page }) => {
    const email = `test-${Date.now()}@example.com`;
    await register(page, { email, password: "password123", name: "Test User" });
    // Check email verification flow
    await expect(page.locator("text=Vérifiez votre email")).toBeVisible();
  });

  test("magic link login", async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button:has-text("Lien magique")');
    await expect(page.locator("text=Vérifiez votre email")).toBeVisible();
  });

  test("password reset flow", async ({ page }) => {
    await page.goto("/fr/mot-de-passe-oublie");
    await page.fill('input[name="email"]', "test@example.com");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Email envoyé")).toBeVisible();
  });

  test("logout", async ({ page }) => {
    await login(page, "test@example.com", "password123");
    await logout(page);
    await expect(page).toHaveURL("/fr");
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/fr/tableau-de-bord");
    await expect(page).toHaveURL(/\/connexion\?redirect/);
  });
});
```

#### B. Billing Flow (`tests/e2e/billing.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";
import { login, startCheckout, openPortal } from "./helpers/billing";

test.describe("Billing Flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "billing-test@example.com", "password123");
  });

  test("pricing page loads with 3 tiers", async ({ page }) => {
    await page.goto("/fr/pricing");
    await expect(page.locator('[data-testid="tier-free"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-pro"]')).toBeVisible();
    await expect(page.locator('[data-testid="tier-enterprise"]')).toBeVisible();
  });

  test("monthly/yearly toggle works", async ({ page }) => {
    await page.goto("/fr/pricing");
    await page.click('[data-testid="billing-toggle-yearly"]');
    await expect(page.locator('[data-testid="yearly-badge"]')).toBeVisible();
    await expect(
      page.locator('[data-testid="price-pro-yearly"]'),
    ).toContainText("€/an");
  });

  test("checkout initiates for Pro plan", async ({ page }) => {
    await startCheckout(page, "pro");
    await expect(page).toHaveURL(/checkout\.stripe\.com/);
    // Verify Stripe Checkout elements
    await expect(page.locator('[data-testid="stripe-checkout"]')).toBeVisible();
  });

  test("customer portal opens", async ({ page }) => {
    await openPortal(page);
    await expect(page).toHaveURL(/billing\.stripe\.com/);
  });

  test("billing page shows current plan", async ({ page }) => {
    await page.goto("/fr/facturation");
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="invoices-table"]')).toBeVisible();
  });
});
```

#### C. Core Journey (`tests/e2e/core.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";
import { login, logout } from "./helpers/auth";

test.describe("Core Journey", () => {
  test.beforeEach(async ({ page }) => {
    await login(page, "core-test@example.com", "password123");
  });

  test("dashboard loads with stats", async ({ page }) => {
    await page.goto("/fr/tableau-de-bord");
    await expect(page.locator('[data-testid="stat-mrr"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="stat-churn"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-feed"]')).toBeVisible();
  });

  test("team page: list members, invite, remove", async ({ page }) => {
    await page.goto("/fr/equipe");
    await expect(page.locator('[data-testid="members-list"]')).toBeVisible();

    // Invite member
    await page.click('[data-testid="invite-button"]');
    await page.fill('input[name="email"]', "newmember@example.com");
    await page.selectOption('select[name="role"]', "member");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=Invitation envoyée")).toBeVisible();
  });

  test("settings: update profile, notifications", async ({ page }) => {
    await page.goto("/fr/reglages");
    await page.fill('input[name="name"]', "Updated Name");
    await page.click('[data-testid="save-profile"]');
    await expect(page.locator("text=Profil mis à jour")).toBeVisible();
  });

  test("api keys: create, revoke", async ({ page }) => {
    await page.goto("/fr/cles-api");
    await page.click('[data-testid="create-key-button"]');
    await page.fill('input[name="name"]', "Test Key");
    await page.check('input[value="read"]');
    await page.click('button[type="submit"]');
    await expect(page.locator('[data-testid="api-key-created"]')).toBeVisible();
    await expect(page.locator('[data-testid="key-value"]')).toBeVisible();

    // Revoke
    await page.click('[data-testid="revoke-key-button"]');
    await page.click('[data-testid="confirm-revoke"]');
    await expect(page.locator("text=Clé révoquée")).toBeVisible();
  });

  test("blog: index + article + search", async ({ page }) => {
    await page.goto("/fr/blog");
    await expect(
      page.locator('[data-testid="blog-post-card"]').first(),
    ).toBeVisible();

    // Click first article
    await page.click('[data-testid="blog-post-card"]:first-child a');
    await expect(page.locator("article")).toBeVisible();

    // Search
    await page.goto("/fr/recherche?q=test");
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });
});
```

### 4. Visual Regression Tests (`tests/visual/`)

```typescript
// tests/visual/components.spec.ts
import { test, expect } from "@playwright/test";

const components = [
  {
    name: "button",
    variants: [
      "default",
      "destructive",
      "outline",
      "secondary",
      "ghost",
      "link",
    ],
  },
  { name: "card", variants: ["default", "outlined"] },
  { name: "input", variants: ["default", "error"] },
  { name: "dialog", variants: ["default", "form"] },
  // ... all ui components
];

for (const { name, variants } of components) {
  for (const variant of variants) {
    for (const theme of ["light", "dark"]) {
      test(`${name}-${variant}-${theme}`, async ({ page }) => {
        await page.goto(`/visual/${name}?variant=${variant}&theme=${theme}`);
        await expect(page).toHaveScreenshot(`${name}-${variant}-${theme}.png`, {
          maxDiffPixels: 100,
          threshold: 0.1,
        });
      });
    }
  }
}
```

### 5. Accessibility Tests (`tests/e2e/a11y.spec.ts`)

```typescript
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const pages = [
  "/fr",
  "/fr/connexion",
  "/fr/inscription",
  "/fr/tableau-de-bord",
  "/fr/pricing",
];

for (const pagePath of pages) {
  test(`a11y: ${pagePath}`, async ({ page }) => {
    await page.goto(pagePath);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
}
```

### 6. Responsive Tests

```typescript
// tests/e2e/responsive.spec.ts
import { test, expect } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 900 },
];

for (const viewport of viewports) {
  test(`responsive: dashboard ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto("/fr/tableau-de-bord");
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    // Mobile: sidebar should be drawer
    if (viewport.name === "mobile") {
      await expect(
        page.locator('[data-testid="mobile-drawer-trigger"]'),
      ).toBeVisible();
    }
  });
}
```

---

## Gate QA (Phase 5 Verify)

- ✓ `pnpm test:e2e` — Auth, Billing, Core passent
- ✓ `pnpm test:visual` — 0 régressions vs baselines
- ✓ `pnpm gate:accessibility` — axe-core 0 violations
- ✓ Responsive tests passent (mobile, tablet, desktop)
- ✓ Cross-browser : Chromium, Firefox, WebKit
- ✓ CI : tests parallèles, retries, traces, screenshots, videos

---

## Patterns Obligatoires

### Data Test IDs

```tsx
// Tous les éléments interactifs ont data-testid
<button data-testid="submit-button">Submit</button>
<input data-testid="email-input" />
<div data-testid="user-menu">...</div>
```

### Wait for State, Not Time

```typescript
// ✓ Bon
await page.waitForURL("/tableau-de-bord");
await expect(page.locator('[data-testid="stat-mrr"]')).toBeVisible();

// ✗ Mauvais
await page.waitForTimeout(2000);
```

### Isolated Tests

```typescript
// Chaque test crée ses propres données
// Pas de dépendance entre tests
// Cleanup via beforeEach/afterEach si nécessaire
```

### Visual Baselines

```typescript
// Baselines commit dans repo
// Update seulement après validation visuelle : --update-snapshots
// Threshold strict : 0.1%
```

---

## Checklist Qualité

- [ ] `pnpm test:e2e` — 0 flaky tests
- [ ] `pnpm test:visual` — baselines à jour
- [ ] `pnpm gate:accessibility` — 0 violations
- [ ] Tests couvrent : Auth (5), Billing (5), Core (5+) scenarios
- [ ] Responsive : mobile, tablet, desktop
- [ ] Cross-browser : chromium, firefox, webkit
- [ ] CI config : retries, traces, artifacts
- [ ] Helpers réutilisables (auth, billing)
