/**
 * Pixelmatch configuration for visual regression testing
 * Adjust thresholds per component/page type
 */

export interface VisualTestConfig {
  testName: string;
  url: string;
  viewport: { width: number; height: number };
  threshold: number;
  waitForSelector?: string;
  waitForTimeout?: number;
  hideSelectors?: string[];
  maskSelectors?: string[];
  deviceScaleFactor?: number;
}

// Global default thresholds
export const DEFAULT_THRESHOLD = 0.99; // 99% similarity required
export const DEFAULT_VIEWPORT = { width: 1280, height: 720 };

// Per-page/component configurations
export const VISUAL_TEST_CONFIGS: VisualTestConfig[] = [
  // Landing page - full page screenshot
  {
    testName: "landing-full",
    url: "/fr",
    viewport: { width: 1280, height: 2400 },
    threshold: 0.99,
    waitForSelector: '[data-testid="landing-hero"]',
    waitForTimeout: 1000,
    hideSelectors: [
      '[data-testid="cookie-banner"]',
      '[data-testid="chat-widget"]',
    ],
  },
  // Hero section only
  {
    testName: "landing-hero",
    url: "/fr",
    viewport: { width: 1280, height: 900 },
    threshold: 0.995,
    waitForSelector: '[data-testid="landing-hero"]',
    waitForTimeout: 500,
  },
  // Features section
  {
    testName: "landing-features",
    url: "/fr",
    viewport: { width: 1280, height: 1000 },
    threshold: 0.99,
    waitForSelector: '[data-testid="landing-features"]',
    waitForTimeout: 500,
  },
  // Pricing section
  {
    testName: "landing-pricing",
    url: "/fr",
    viewport: { width: 1280, height: 1000 },
    threshold: 0.99,
    waitForSelector: '[data-testid="landing-pricing"]',
    waitForTimeout: 500,
  },
  // Auth pages
  {
    testName: "auth-login",
    url: "/fr/connexion",
    viewport: { width: 1280, height: 900 },
    threshold: 0.995,
    waitForSelector: 'form[data-testid="login-form"]',
    waitForTimeout: 500,
  },
  {
    testName: "auth-register",
    url: "/fr/inscription",
    viewport: { width: 1280, height: 900 },
    threshold: 0.995,
    waitForSelector: 'form[data-testid="register-form"]',
    waitForTimeout: 500,
  },
  // Dashboard
  {
    testName: "dashboard",
    url: "/fr/tableau-de-bord",
    viewport: { width: 1280, height: 1200 },
    threshold: 0.98,
    waitForSelector: '[data-testid="dashboard-stats"]',
    waitForTimeout: 1000,
  },
  // Projects page
  {
    testName: "projects-list",
    url: "/fr/projets",
    viewport: { width: 1280, height: 1200 },
    threshold: 0.98,
    waitForSelector: '[data-testid="projects-list"]',
    waitForTimeout: 1000,
  },
  // Billing page
  {
    testName: "billing",
    url: "/fr/facturation",
    viewport: { width: 1280, height: 1200 },
    threshold: 0.98,
    waitForSelector: '[data-testid="billing-plan"]',
    waitForTimeout: 1000,
  },
  // Settings page
  {
    testName: "settings",
    url: "/fr/reglages",
    viewport: { width: 1280, height: 1200 },
    threshold: 0.98,
    waitForSelector: '[data-testid="settings-tabs"]',
    waitForTimeout: 1000,
  },
  // Components demo page (for testing all UI components)
  {
    testName: "components-demo",
    url: "/fr/components-demo",
    viewport: { width: 1280, height: 2400 },
    threshold: 0.99,
    waitForSelector: '[data-testid="components-demo"]',
    waitForTimeout: 1000,
  },
];

// Mobile viewport tests
export const MOBILE_VIEWPORT = { width: 375, height: 667 };
export const MOBILE_CONFIGS: VisualTestConfig[] = [
  {
    testName: "landing-mobile",
    url: "/fr",
    viewport: MOBILE_VIEWPORT,
    threshold: 0.98,
    waitForSelector: '[data-testid="landing-hero"]',
    waitForTimeout: 500,
  },
  {
    testName: "auth-login-mobile",
    url: "/fr/connexion",
    viewport: MOBILE_VIEWPORT,
    threshold: 0.985,
    waitForSelector: 'form[data-testid="login-form"]',
    waitForTimeout: 500,
  },
];

// Dark mode configs (run with color-scheme: dark)
export const DARK_MODE_CONFIGS: VisualTestConfig[] = [
  {
    testName: "landing-dark",
    url: "/fr",
    viewport: DEFAULT_VIEWPORT,
    threshold: 0.99,
    waitForSelector: '[data-testid="landing-hero"]',
    waitForTimeout: 500,
  },
  {
    testName: "dashboard-dark",
    url: "/fr/tableau-de-bord",
    viewport: DEFAULT_VIEWPORT,
    threshold: 0.98,
    waitForSelector: '[data-testid="dashboard-stats"]',
    waitForTimeout: 1000,
  },
];

export function getConfigForTest(
  testName: string,
): VisualTestConfig | undefined {
  return [...VISUAL_TEST_CONFIGS, ...MOBILE_CONFIGS, ...DARK_MODE_CONFIGS].find(
    (c) => c.testName === testName,
  );
}

export function getAllConfigs(): VisualTestConfig[] {
  return [...VISUAL_TEST_CONFIGS, ...MOBILE_CONFIGS, ...DARK_MODE_CONFIGS];
}
