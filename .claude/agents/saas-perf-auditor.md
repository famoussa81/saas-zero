---
name: saas-perf-auditor
description: Lighthouse CI, bundle analysis, Core Web Vitals, hydration checks — gates de performance déterministes.
---

# Agent: `saas-perf-auditor`

> **Rôle** : Lighthouse CI, bundle analysis, Core Web Vitals, hydration checks — performance gates déterministes.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat SPEC.md)$(cat DESIGN-SPEC.md)"
```

---

## Responsabilités

### 1. Lighthouse CI (`gate:lighthouse`)

**Config** : `lighthouse-ci.json`

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "startServerCommand": "pnpm dev",
      "url": [
        "http://localhost:3000/fr",
        "http://localhost:3000/fr/blog",
        "http://localhost:3000/fr/connexion",
        "http://localhost:3000/fr/tableau-de-bord",
        "http://localhost:3000/fr/pricing"
      ],
      "settings": {
        "headless": true,
        "preset": "desktop",
        "staticDistDir": ".next/server"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }],
        "first-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "interactive": ["error", { "maxNumericValue": 3500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

**Commande** :

```bash
pnpm gate:lighthouse
# ou
npx lhci autorun
```

### 2. Bundle Size Analysis (`gate:bundle`)

**Config** : `next.config.js` + `@next/bundle-analyzer`

```javascript
// next.config.js
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  // ...
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-*"],
  },
});
```

**Budgets** (gzipped) :

| Bundle                    | Budget   |
| ------------------------- | -------- |
| First Load JS (shared)    | < 100 KB |
| First Load JS (per route) | < 150 KB |
| Largest chunk             | < 50 KB  |

**Commande** :

```bash
pnpm gate:bundle
# ou
ANALYZE=true pnpm build
# Rapport : .next/analyze/client.html
```

**Vérifications** :

- [ ] `lucide-react` → tree-shaken (import { Icon } from 'lucide-react')
- [ ] `@radix-ui/*` → import par composant
- [ ] Dynamic imports pour code splitting (`dynamic(() => import(...))`)
- [ ] Pas de dépendances inutilisées (`depcheck`)

### 3. Core Web Vitals (`gate:cwv`)

**Métriques Cibles** :

| Métrique | Bon     | À améliorer | Mauvais |
| -------- | ------- | ----------- | ------- |
| LCP      | ≤ 2.5s  | 2.5-4s      | > 4s    |
| INP      | ≤ 200ms | 200-500ms   | > 500ms |
| CLS      | ≤ 0.1   | 0.1-0.25    | > 0.25  |

**Mesure** :

- `web-vitals` library en production
- Lighthouse CI en CI
- `next-dev-tools` en dev

**Optimisations LCP** :

- `next/image` avec `priority` + `fetchPriority="high"` sur hero
- Fonts : `next/font` avec `display: 'swap'` + preload
- Critical CSS inlined

**Optimisations INP** :

- `useTransition` pour updates non-urgents
- `React.memo` / `useMemo` / `useCallback` sur composants fréquents
- Éviter gros trees React dans interactions

**Optimisations CLS** :

- `aspect-ratio` / `width`/`height` sur images
- `font-display: swap` + `size-adjust` fallback fonts
- Pas d'injections DOM dynamiques sans réservation espace

### 4. Hydration Check (`gate:hydration`)

**Problèmes Courants** :

- `Date.now()` / `Math.random()` / `new Date()` côté client seulement
- `window` / `document` / `navigator` dans Server Components
- Extensions navigateur modifiant DOM
- Timestamps non synchronisés

**Détection** :

```bash
# Build production + check console
pnpm build 2>&1 | grep -i "hydration\|mismatch"
```

**Fix Patterns** :

```tsx
// ✗ Mauvais : window dans Server Component
const theme = window.localStorage.getItem("theme");

// ✓ Bon : useEffect + suppressHydrationWarning si justifié
("use client");
useEffect(() => {
  const theme = window.localStorage.getItem("theme");
  setTheme(theme);
}, []);

// ✓ Bon : next-themes gère l'hydration
import { ThemeProvider } from "next-themes";
<ThemeProvider attribute="class" defaultTheme="system">
  ...
</ThemeProvider>;
```

### 5. Performance Budgets (CI)

**`.github/workflows/ci.yml`** :

```yaml
- name: Lighthouse CI
  run: npx lhci autorun

- name: Bundle Analysis
  run: ANALYZE=true pnpm build

- name: Check Bundle Size
  run: |
    MAX_SHARED=102400  # 100KB
    SHARED_SIZE=$(gzip -c .next/static/chunks/webpack-*.js | wc -c)
    if [ $SHARED_SIZE -gt $MAX_SHARED ]; then
      echo "Bundle too large: $SHARED_SIZE bytes (max $MAX_SHARED)"
      exit 1
    fi
```

### 6. Web Vitals Collection (Production)

**`lib/web-vitals.ts`** :

```typescript
import { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } from "web-vitals";

export function initWebVitals() {
  if (typeof window === "undefined") return;

  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
  onINP(sendToAnalytics);
}

function sendToAnalytics(metric) {
  // Send to Plausible, GA, or custom endpoint
  fetch("/api/analytics/vitals", {
    method: "POST",
    body: JSON.stringify(metric),
    headers: { "Content-Type": "application/json" },
  }).catch(() => {}); // Fail silently
}
```

**Appelé dans** : `app/(app)/layout.tsx` (client component wrapper)

---

## Gate Perf (Phase 5 Verify)

- ✓ `pnpm gate:lighthouse` — ≥ 90 sur les 4 catégories
- ✓ `pnpm gate:bundle` — < budgets gzipped
- ✓ `pnpm gate:cwv` — LCP<2.5s, INP<200ms, CLS<0.1
- ✓ `pnpm gate:hydration` — 0 mismatches en build prod

---

## Patterns Obligatoires

### Dynamic Imports pour Code Splitting

```tsx
// Pages lourdes
const HeavyChart = dynamic(() => import("@/components/HeavyChart"), {
  ssr: false,
});
const SettingsForm = dynamic(() => import("@/components/SettingsForm"));
```

### Font Optimization

```typescript
// app/layout.tsx
import { Inter, Cal_Sans } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const calSans = Cal_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-display' })

<html className={`${inter.variable} ${calSans.variable} antialiased`}>
```

### Image Optimization

```tsx
// Hero image
<Image
  src="/hero.png"
  alt="Hero"
  fill
  priority
  fetchPriority="high"
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>

// Blog images
<Image
  src={post.heroImage}
  alt={post.title}
  width={1200}
  height={630}
  placeholder="blur"
  blurDataURL={post.blurDataURL}
/>
```

### Script Loading Strategy

```typescript
// next.config.js
module.exports = {
  // ...
  scriptStrategy: "lazyOnload", // ou 'afterInteractive' pour critical
};
```

---

## Checklist Qualité

- [ ] `pnpm gate:lighthouse` — 4 catégories ≥ 90
- [ ] `pnpm gate:bundle` — shared < 100KB gzipped
- [ ] `pnpm gate:cwv` — LCP/INP/CLS dans cibles
- [ ] `pnpm gate:hydration` — 0 mismatches
- [ ] Dynamic imports sur routes lourdes
- [ ] Fonts optimisés (`next/font`, `display: swap`)
- [ ] Images optimisées (`next/image`, priority, sizes)
- [ ] Web vitals collectés en prod
- [ ] CI fail si budgets dépassés
