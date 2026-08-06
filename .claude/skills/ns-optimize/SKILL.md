---
name: ns-optimize
description: Optimiser un SaaS Next.js — state, data flow, performance (lazy, caching, queries, bundle). Équivalent gratuit de NS Optimize (NowStack). Utiliser après le build, avant/après deploy.
---

# ns-optimize — Optimiser state, data flow et performance

> Équivalent de "NS Optimize" (NowStack). But : rendre le SaaS rapide et léger sans réécrire.
> S'appuie sur le gate:lighthouse, gate:bundle, gate:cwv (voir ns-quality-gates).

## Les 3 axes

### 1. Data flow & queries

- **Serveur d'abord** : préférer Server Components / RSC pour les données, minimiser le JS client.
- **Queries optimisées** : `SELECT` limités, index sur FK, éviter N+1, utiliser `supabase.rpc`
  quand c'est un agrégat.
- **Caching** : revalidation (`revalidatePath`/`revalidateTag`), `stale-while-revalidate`.
- **Éviter les re-fetch** : état partagé réutilisé, pas de fetch dupliqué par client.

### 2. Bundle & lazy

- **Dynamic import** pour les grosses libs (charts, 3D, éditeurs) → `next/dynamic`.
- **Ne pas importer toute une lib pour un util**.
- **Treeshaking** : importer depuis les chemins exacts (ex: `lucide-react/icons/x`).
- Vérifier avec `pnpm build:analyze` (bundle analyzer).

### 3. Runtime & réseau

- **Images** : `next/image` avec dimensions, priority sur le hero, formats modernes (avif/webp).
- **Fonts** : `next/font` (self-host, pas de FOUT).
- **Lighthouse** : `pnpm gate:lighthouse` ≥ 90 ; **CWV** : LCP<2,5s, INP<200ms, CLS<0,1.

## Ordre d'action (le plus rentable d'abord)

1. Images + fonts (gros gain rapide)
2. Dynamic import des libs lourdes
3. Queries/N+1 + caching
4. Vérifier par Lighthouse + bundle analyze avant/après

## Checklist de sortie

- [ ] LCP < 2,5s (Lighthouse)
- [ ] Bundle gzip < budget
- [ ] Pas de N+1 / fetch dupliqué évident
- [ ] Images/fonts optimisées
- [ ] Mesure avant/après pour prouver le gain
