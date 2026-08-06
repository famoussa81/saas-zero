---
name: ns-plausible
description: Plausible Analytics - privacy-friendly, lightweight analytics alternative to Google Analytics. No cookies, GDPR compliant, lightweight (<1KB).
---

# Plausible Analytics

Plausible is a lightweight, privacy-friendly analytics alternative to Google Analytics. No cookies, GDPR/CCPA/PECR compliant, <1KB script.

## Installation

```bash
npm install plausible-tracker
```

## Basic Setup

```tsx
// app/[locale]/layout.tsx
import Script from "next/script";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <Script
          defer
          data-domain="votre-domaine.com"
          src="https://plausible.io/js/script.js"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

## Configuration Options

```tsx
<Script
  defer
  data-domain="votre-domaine.com"
  data-api-host="https://plausible.io" // Custom domain if self-hosted
  data-track-localhost="true" // Track localhost in dev
  data-hash="true" // Track hash changes (SPA)
  data-tag="campaign-name" // Tag for campaign tracking
  src="https://plausible.io/js/script.js"
/>
```

## Custom Events

```tsx
"use client";

import { usePlausible } from "next-plausible";

export function TrackButton() {
  const plausible = usePlausible();

  const handleClick = () => {
    plausible("signup_click", {
      props: { plan: "pro", source: "hero" },
    });
  };

  return <button onClick={handleClick}>S'inscrire</button>;
}
```

## Installation with next-plausible

```bash
npm install next-plausible
```

```tsx
// app/providers.tsx
"use client";

import { PlausibleProvider } from "next-plausible";

export function PlausibleProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlausibleProvider
      domain="votre-domaine.com"
      apiHost="https://plausible.io"
    >
      {children}
    </PlausibleProvider>
  );
}
```

```tsx
// Usage in components
"use client";

import { usePlausible } from "next-plausible";

export function SignupButton() {
  const plausible = usePlausible();

  return (
    <button onClick={() => plausible("signup", { plan: "pro" })}>
      S'inscrire
    </button>
  );
}
```

## Configuration Options

| Prop                   | Type    | Default                | Description                    |
| ---------------------- | ------- | ---------------------- | ------------------------------ |
| `data-domain`          | string  | Required               | Your domain                    |
| `data-api-host`        | string  | `https://plausible.io` | Custom API host (self-hosted)  |
| `data-track-localhost` | boolean | `false`                | Track localhost in development |
| `data-hash`            | boolean | `false`                | Track hash changes (SPA)       |
| `data-tag`             | string  | -                      | Campaign tag                   |

## Privacy Features

- **No cookies** - No cookies stored
- **No personal data** - No IP addresses stored
- **GDPR/CCPA/PECR compliant** - By design
- **No cross-site tracking** - No fingerprinting
- **Open source** - Self-hostable
- **< 1KB** - Lightweight script

## Self-Hosting

```bash
# Docker
docker run -d \
  -p 8000:8000 \
  -e DATABASE_URL=postgres://user:pass@db/plausible \
  -e SECRET_KEY_BASE=your-secret \
  plausible/analytics:latest
```

## Custom Events Examples

```tsx
// Track form submissions
plausible("form_submit", {
  props: { form: "contact", success: true },
});

// Track purchases
plausible("purchase", {
  props: {
    plan: "pro",
    amount: 2900,
    currency: "EUR",
  },
});

// Track feature usage
plausible("feature_used", {
  props: { feature: "export_pdf", plan: "pro" },
});

// Track errors
plausible("error", {
  props: {
    error_type: "payment_failed",
    context: "checkout",
  },
});
```

## Pageview Tracking (SPA)

```tsx
// app/[locale]/layout.tsx
"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { usePlausible } from "next-plausible";
import { useEffect } from "react";

export function PlausiblePageview() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const plausible = usePlausible();

  useEffect(() => {
    const url = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    plausible("pageview", { props: { path: url } });
  }, [pathname, searchParams]);

  return null;
}
```

## Excluding Paths

```tsx
<Script
  defer
  data-domain="votre-domaine.com"
  data-ignore-tags="no-track"
  src="https://plausible.io/js/script.js"
/>
```

```tsx
// Exclude specific elements
<a href="/admin" data-plausible-ignore>
  Admin
</a>
```

## Debug Mode

```tsx
<Script
  defer
  data-domain="votre-domaine.com"
  data-api-host="https://plausible.io"
  data-debug="true"
  src="https://plausible.io/js/script.js"
/>
```

## Self-Hosting with Docker

```yaml
# docker-compose.yml
version: "3.8"
services:
  plausible:
    image: plausible/analytics:latest
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/plausible
      - SECRET_KEY_BASE=your-secret-key
      - BASE_URL=https://analytics.votre-domaine.com
    depends_on:
      - db
    volumes:
      - plausible_data:/var/lib/postgresql/data

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: plausible
      POSTGRES_USER: plausible
      POSTGRES_PASSWORD: secure-password
    volumes:
      - plausible_data:/var/lib/postgresql/data

volumes:
  plausible_data:
```

## Configuration via Environment Variables

```env
# .env.local
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=votre-domaine.com
NEXT_PUBLIC_PLAUSIBLE_API_HOST=https://plausible.io
NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST=true
```

```tsx
// app/[locale]/layout.tsx
<Script
  defer
  data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
  data-api-host={process.env.NEXT_PUBLIC_PLAUSIBLE_API_HOST}
  data-track-localhost={
    process.env.NEXT_PUBLIC_PLAUSIBLE_TRACK_LOCALHOST === "true"
  }
  src="https://plausible.io/js/script.js"
/>
```

## Resources

- [Plausible Documentation](https://plausible.io/docs)
- [GitHub Repository](https://github.com/plausible/analytics)
- [Self-Hosting Guide](https://plausible.io/docs/self-hosting)
- [Next.js Integration](https://github.com/vercel/next.js/tree/canary/examples/with-plausible-analytics)
