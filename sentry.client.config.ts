import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === "development",

  // Release tracking
  release: process.env.npm_package_version,

  // Environment
  environment: process.env.NODE_ENV,

  // Ignore certain errors
  ignoreErrors: [
    // Ignore network errors
    "NetworkError",
    "Failed to fetch",
    // Ignore hydration mismatches in development
    "hydration",
    // Ignore ResizeObserver loop limit exceeded
    "ResizeObserver loop limit exceeded",
  ],

  // Before send hook to filter/modify events
  beforeSend(event, _hint) {
    // Don't send events in development unless explicitly enabled
    if (process.env.NODE_ENV === "development" && !process.env.SENTRY_DEBUG) {
      return null;
    }

    // Filter out known non-actionable errors
    if (event.exception) {
      for (const exception of event.exception.values || []) {
        // Ignore cancelled requests
        if (
          exception.value?.includes("Aborted") ||
          exception.value?.includes("cancelled")
        ) {
          return null;
        }
      }
    }

    return event;
  },

  // Custom tags
  initialScope: {
    tags: {
      service: "saas-zero",
      platform: "nextjs",
    },
  },
});
