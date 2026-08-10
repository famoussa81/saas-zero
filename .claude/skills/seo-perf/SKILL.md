---
name: seo-perf
description: SEO et performance — metadata, Open Graph, sitemap, robots, Core Web Vitals, Lighthouse. À charger avant de finaliser une page ou le build pour garantir un référencement et des performances optimales.
---

# seo-perf — SEO & Performance

> Règles pour que chaque page soit bien référencée, partageable sur les réseaux
> sociaux et rapide (Core Web Vitals verts, Lighthouse ≥ 90 sur Perf/A11y/BP/SEO).

---

## SEO par page (Next.js App Router)

```tsx
// app/[locale]/page.tsx (exemple)
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Titre de la page | Marque",
  description: "Description unique et pertinente (150-160 caractères)",
  openGraph: {
    title: "Titre OG",
    description: "Description OG",
    type: "website",
    url: "https://example.com/",
    siteName: "Marque",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "..." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Titre Twitter",
    description: "Description Twitter",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://example.com/",
    languages: { en: "https://example.com/en", fr: "https://example.com/fr" },
  },
};
```

### Règles

- **Une seule H1 par page**, hiérarchie H2/H3 logique
- **Meta description unique** par page (pas de doublon)
- **Images** : balise `alt` descriptive, jamais vide sauf décorative
- **URLs canoniques** + `alternates.languages` pour i18n
- **JSON-LD** structuré : Product, Service, Organization, FAQPage, BlogPosting
- **Sitemap** généré (`next-sitemap`) et référencé dans robots.txt

## Open Graph

| Image         | Taille recommandée  |
| ------------- | ------------------- |
| og:image      | 1200×630px, max 5MB |
| twitter:image | 1200×675px          |

- Générer une image OG par défaut (pas d'image manquante)
- Tester avec [og.rip](https://og.rip) ou l'outil de debug Meta

## Performance — Core Web Vitals

| Métrique | Cible   |
| -------- | ------- |
| LCP      | < 2.5s  |
| INP      | < 200ms |
| CLS      | < 0.1   |

### Pratiques

1. **Images** : `next/image` avec `sizes`, format WebP/AVIF, lazy-load hors viewport
2. **Fonts** : `next/font` avec `display: swap`, précharger la police display
3. **JS** : minimiser le client JS, `dynamic()` + `ssr: false` pour les libs lourdes (recharts, drei)
4. **CSS** : Tailwind purge (déjà actif), pas de CSS inline critique manuel
5. **Cache** : `stale-while-revalidate` pour le contenu statique
6. **Analytics** : `plausible-tracker` (léger, pas de cookie banner requis)

## Vérifications

```bash
# Lighthouse CI (si configuré)
pnpm gate:lighthouse

# Vérifier les métadonnées
pnpm build
grep -r "og:image" .next/server/app --include="*.html" | head

# A11y + perf combinées
npx playwright test --config=playwright.a11y.config.ts
```

## Checklist de sortie

- [ ] Metadata complète sur chaque page (title, description, OG, twitter)
- [ ] Canonical + hreflang i18n
- [ ] JSON-LD structuré sur les pages clés
- [ ] Sitemap + robots.txt générés
- [ ] Images optimisées (`next/image`, alt)
- [ ] Lighthouse ≥ 90 Perf/A11y/BP/SEO
- [ ] 0 erreur console, 0 mismatch hydration

---

_Skill `seo-perf` v1.0 — Pipeline saas-zero_
