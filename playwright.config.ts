import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 60000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Ignore unit tests (they're in tests/unit)
  testIgnore: ["**/unit/**", "**/visual/**"],
  webServer: {
    command: "pnpm next:start",
    url: "http://localhost:3000/fr",
    reuseExistingServer: !process.env.CI,
    cwd: "/c/Users/PC/saas-zero",
    timeout: 120000,
  },
});
