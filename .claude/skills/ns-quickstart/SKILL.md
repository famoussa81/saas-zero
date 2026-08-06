---
name: ns-quickstart
description: Guider un clone frais du starter vers un produit local vérifié, pas-à-pas. Utiliser au tout début d'un nouveau projet (équivaut NS Quickstart de NowStack, en gratuit).
---

# ns-quickstart — Du clone frais au produit local vérifié

> Équivalent gratuit de "NS Quickstart" (NowStack). But : prendre un clone frais de saas-zero
> (ou d'un nouveau SaaS) et le faire tourner LOCALEMENT, vérifié, en 3 étapes claires.

## Quand l'utiliser

Au tout début, sur un dossier neuf ou un clone :

```
/ns-quickstart
```

## Étapes

### 1. Vérifier la toolchain

- `node -v` ≥ 20
- `pnpm -v` ≥ 9
- `supabase` CLI présent (sinon `npm i -g supabase`)
- `wrangler` présent (sinon `npm i -g wrangler`)
- `.env.local` présent (sinon copier depuis `.env.example` et remplir)

### 2. Installer + lancer local

```bash
pnpm install
pnpm content:build              # build du CMS / contenu
pnpm supabase:start           # stack Supabase local (Docker requis)
pnpm supabase:migrate:up      # applique les migrations
pnpm dev                      # lance le dev server
```

### 3. Vérifier que tout tourne "proprement"

- `pnpm typecheck` → 0 erreur
- `pnpm lint` → 0 warning
- `pnpm test` → tests passent
- la home répond (http://localhost:3000)
- auth : inscription/connexion fonctionne (si credentials Supabase OK)

## Fin du quickstart

Un rapport court "Quickstart OK : la stack tourne localement" ou une liste de blocus.

## Checklist de sortie

- [ ] Toolchain vérifiée (node/pnpm/supabase/wrangler/env)
- [ ] `pnpm dev` lance le site localement
- [ ] `typecheck`/`lint`/`test` passent
- [ ] Auth local testée (si dispo)
- [ ] Proche : "Quickstart OK" ou blocages listés
