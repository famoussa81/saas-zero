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

## Sitemap, robots et données structurées

Trois skills séparés couvraient ces sujets — ns-next-sitemap, ns-json-ld,
ns-plausible — sur près de 1 150 lignes qui reproduisaient la documentation
amont. Deux d'entre eux décrivaient des paquets **jamais installés** dans ce
dépôt, si bien que le projet n'avait ni sitemap ni robots.txt pendant que
391 lignes expliquaient comment les configurer.

Ils sont fondus ici, et la capacité est désormais réelle.

### Sitemap et robots — natifs, aucune dépendance

`app/sitemap.ts` et `app/robots.ts` sont générés par l'App Router. Les URL
viennent des collections de contenu via `lib/content`, donc elles suivent le
contenu au lieu d'une configuration à tenir à jour.

Deux points qui se ratent facilement :

- **Les brouillons sont exclus.** `getAllPosts()` filtre déjà `draft` — c'est
  pourquoi le sitemap passe par le helper et non par la collection brute.
- **Les alternates de langue sont obligatoires** en multilingue. Sans elles,
  Google traite `/fr/blog` et `/en/blog` comme du contenu dupliqué au lieu de
  servir la bonne version.

`robots.ts` exclut `/api/` et les zones d'administration. Ce n'est **pas** une
mesure de sécurité : un robots.txt n'empêche aucun accès, il demande seulement
aux moteurs bien élevés de ne pas indexer. La protection reste le middleware
et la RLS.

### Données structurées

`src/components/ui/JsonLd.tsx` expose `OrganizationJsonLd`, `WebsiteJsonLd` et
`SoftwareApplicationJsonLd`. Les poser dans le layout suffit ; valider ensuite
avec l'outil de test des résultats enrichis de Google.

Pour une boutique, ajouter `Product` et `Offer` sur la fiche produit — c'est
ce qui fait apparaître le prix et la disponibilité dans les résultats. Le prix
déclaré doit être **celui réellement affiché** : un écart est sanctionné.

### Analytics

Plausible est déjà branché — script dans `app/[locale]/layout.tsx` et
fournisseur dans `src/components/providers/plausible-provider.tsx`. Sans
cookie, sans bandeau de consentement, moins d'1 Ko.

Ne pas installer `next-plausible` : le montage actuel fonctionne, et deux
implémentations concurrentes comptent les visites en double.

À distinguer de `ns-analytics`, qui mesure l'usage **produit** (activation,
rétention) et non l'audience.

---

## Checklist de sortie

- [ ] Metadata complète sur chaque page (title, description, OG, twitter)
- [ ] Canonical + hreflang i18n
- [ ] JSON-LD structuré sur les pages clés
- [ ] Sitemap + robots.txt générés
- [ ] Images optimisées (`next/image`, alt)
- [ ] Lighthouse ≥ 90 Perf/A11y/BP/SEO
- [ ] 0 erreur console, 0 mismatch hydration
- [ ] `/sitemap.xml` et `/robots.txt` répondent, brouillons absents
- [ ] Alternates de langue présentes sur chaque URL multilingue

---

_Skill `seo-perf` v1.0 — Pipeline saas-zero_
