import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-visual-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    navigationTimeout: 60000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  testMatch: ["**/visual/**/*.spec.ts"],
  webServer: {
    command: "cmd /c pnpm next:start",
    url: "http://localhost:3000/fr",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    cwd: process.cwd(),
  },
});
