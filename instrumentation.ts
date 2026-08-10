export { onCLS, onINP, onLCP, onTTFB } from "web-vitals";

export function register() {
  if (process.env.NODE_ENV === "production") {
    // Initialize client-side Sentry
    import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
        debug: false,
        release: process.env.npm_package_version,
        environment: process.env.NODE_ENV,
        ignoreErrors: [
          "NetworkError",
          "Failed to fetch",
          "hydration",
          "ResizeObserver loop limit exceeded",
        ],
        beforeSend(event, _hint) {
          if (event.exception) {
            for (const exception of event.exception.values || []) {
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
        initialScope: {
          tags: {
            service: "saas-zero",
            platform: "nextjs",
          },
        },
      });
    });
  }
}
