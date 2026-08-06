---
name: ns-next-intl
description: next-intl for internationalization (i18n) in Next.js. Provides routing, message formatting, and locale detection with App Router support.
---

# next-intl - Internationalization for Next.js

## Installation

```bash
npm install next-intl
```

## Configuration

### 1. Middleware for Locale Routing

```typescript
// middleware.ts
import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/request";

export default createMiddleware({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always", // Always show locale in URL
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
```

### 2. Request Configuration

```typescript
// i18n/request.ts
import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'

export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = (cookieStore.get('locale')?.value as Locale) || 'fr'

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  }
}
```

### 3. Messages Files

```json
// messages/fr.json
{
  "common": {
    "loading": "Chargement...",
    "error": "Une erreur est survenue",
    "retry": "Réessayer",
    "back": "Retour",
    "submit": "Envoyer",
    "cancel": "Annuler"
  },
  "nav": {
    "home": "Accueil",
    "about": "À propos",
    "blog": "Blog",
    "contact": "Contact"
  }
}

// messages/en.json
{
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "retry": "Retry",
    "back": "Back",
    "submit": "Submit",
    "cancel": "Cancel"
  },
  "nav": {
    "home": "Home",
    "about": "About",
    "blog": "Blog",
    "contact": "Contact"
  }
}
```

## Usage in Components

### Server Components

```tsx
// app/[locale]/page.tsx
import { getTranslations } from "next-intl/server";

export default async function Page({ params }: { params: { locale: string } }) {
  const t = await getTranslations("common");

  return <h1>{t("welcome")}</h1>;
}
```

### Client Components

```tsx
"use client";

import { useTranslations } from "next-intl";

export function Header() {
  const t = useTranslations("nav");

  return (
    <nav>
      <Link href={`/${locale}/`}>{t("home")}</Link>
      <Link href={`/${locale}/about`}>{t("about")}</Link>
    </nav>
  );
}
```

### Dynamic Messages

```tsx
const t = useTranslations("common");
const tFeature = useTranslations("features");

// With interpolation
t("welcome", { name: "John" });
// "Welcome, John!"

// With pluralization
t("items", { count: 5 });
// "5 items" / "1 item"
```

## Routing Configuration

### Locale Prefix Options

```typescript
// next-intl/middleware options
createMiddleware({
  locales: ["fr", "en"],
  defaultLocale: "fr",
  localePrefix: "always", // /fr/, /en/ (default)
  // localePrefix: 'as-needed'  // /, /en/
  // localePrefix: 'never'      // no locale in URL
});
```

### Locale Switcher Component

```tsx
"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { locales } from "@/i18n/request";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("common");

  const currentLocale = usePathname().split("/")[1] || "fr";

  const switchLocale = (locale: string) => {
    const pathname = usePathname();
    const newPathname = pathname.replace(`/${currentLocale}/`, `/${locale}/`);
    router.push(newPathname);
  };

  return (
    <select
      value={currentLocale}
      onChange={(e) => switchLocale(e.target.value)}
      className="px-3 py-2 bg-background border border-border rounded-lg"
    >
      {locales.map((locale) => (
        <option key={locale} value={locale}>
          {locale.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
```

## Messages Structure

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    "retry": "Retry"
  },
  "nav": {
    "home": "Home",
    "about": "About"
  },
  "hero": {
    "title": "Welcome to {siteName}",
    "description": "Build better products faster"
  },
  "features": {
    "title": "Features",
    "items": {
      "analytics": "Analytics",
      "team": "Team collaboration"
    }
  },
  "pricing": {
    "monthly": "Monthly",
    "yearly": "Yearly",
    "save": "Save 20%"
  }
}
```

## Best Practices

1. **Organize by namespace** - Group related translations
2. **Use consistent keys** - Flat structure with dots
3. **Avoid HTML in messages** - Use components instead
4. **Use ICU syntax** for plurals, dates, numbers
5. **Extract to JSON files** - Not TypeScript objects
6. **Keep keys flat** - Avoid deep nesting
7. **Use descriptive keys** - `hero.title` not `h1`

## Pluralization (ICU Syntax)

```json
{
  "items": "{count, plural, one {# item} other {# items}}",
  "users": "{count, plural, =0 {No users} one {One user} other {# users}}"
}
```

```tsx
t("items", { count: 1 }); // "1 item"
t("items", { count: 5 }); // "5 items"
```

## Date/Number Formatting

```tsx
"use client";
import { useFormatter } from "next-intl";

export function FormattedDate({ date }: { date: Date }) {
  const formatDate = useFormatter().dateTime;

  return (
    <time dateTime={date.toISOString()}>
      {formatDate(date, { dateStyle: "long" })}
    </time>
  );
}

export function FormattedNumber({ value }: { value: number }) {
  const formatNumber = useFormatter().number;

  return (
    <span>{formatNumber(value, { style: "currency", currency: "EUR" })}</span>
  );
}
```

## TypeScript Configuration

```json
// tsconfig.json
{
  "compilerOptions": {
    "plugins": [{ "name": "next-intl" }]
  }
}
```

## Common Patterns

### Nested Namespaces

```json
{
  "auth": {
    "login": {
      "title": "Sign in",
      "submit": "Sign in",
      "forgotPassword": "Forgot password?"
    },
    "register": {
      "title": "Create account",
      "submit": "Create account"
    }
  }
}
```

```tsx
const t = useTranslations("auth.login");
t("title"); // "Sign in"
```

### Dynamic Locale Routes

```tsx
// app/[locale]/blog/[slug]/page.tsx
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  return [
    { locale: "fr", slug: "article-1" },
    { locale: "en", slug: "article-1" },
  ];
}

export default async function Page({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const t = await getTranslations("blog");

  return <article>{/* content */}</article>;
}
```

## TypeScript Types

```typescript
// types/next-intl.d.ts
declare module "next-intl" {
  interface AppConfig {
    Messages: {
      common: {
        loading: string;
        error: string;
      };
      nav: {
        home: string;
        about: string;
      };
      // ... your namespaces
    };
  }
}
```

## Common Issues

| Issue                | Solution                                  |
| -------------------- | ----------------------------------------- |
| Locale not in URL    | Check `localePrefix` in middleware        |
| Messages not found   | Check file path: `messages/{locale}.json` |
| Hydration mismatch   | Ensure locale matches on server/client    |
| Type errors          | Run `next-intl` types generator           |
| Locale not switching | Check `localePrefix` and router.push      |

## Resources

- [next-intl Documentation](https://next-intl-docs.vercel.app/)
- [GitHub Repository](https://github.com/amannn/next-intl)
- [ICU Message Format](https://unicode-org.github.io/icu/userguide/format_parse/messages/)
