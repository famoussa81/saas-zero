---
name: ns-release
description: Préparer et publier une release SaaS vérifiée (version, changelog, tag git, associée à la review et aux gates). Équivalent gratuit de NS Ship Release (NowStack).
---

# ns-release — Préparer + publier une release vérifiée

> Équivalent de "NS Ship Release" (NowStack). But : publier une version propre, tracée,
> vérifiée — pas un "push à l'aveugle".

## Prérequis (avant release)

- [ ] `pnpm gates:all` passent (typecheck, lint, test, e2e, visual...)
- [ ] `/ns-review` → REVIEW.md dit "PRÊT" (fail-closed)
- [ ] (si con) `k6` load test OK
- [ ] working tree propre (`git status` vide)

## Étapes

### 1. Version

Bump semver (ex: 1.2.0) dans `package.json` :

```bash
# choisis : major / minor / patch
npm version minor --no-git-tag-version   # ou édite package.json à la main
```

### 2. Changelog

- `CHANGELOG.md` : section à la nouvelle version, lister les changements en `conventional commits`
  (feat/fix/docs...). Ne pas écrire d'entrées fake.

### 3. Commit + tag

```bash
git add package.json CHANGELOG.md
git commit -m "chore(release): v1.2.0"
git tag v1.2.0
```

### 4. Build final vérifié

```bash
pnpm build   # production build 0 erreur
```

### 5. Déployer (voir ns-deploy) + vérifier

- Preview ou prod déployé, smoke test OK.
- `CHANGELOG` reflète la réalité.

## Règles

- Un release = 1 tag = 1 build vérifié.
- Ne jamais taguer sans gates + review.
- Ne pas écrire de changelog mensonger : "fait" seulement ce qui est réellement fait.

## Checklist de sortie

- [ ] Version semver bumpée
- [ ] CHANGELOG.md cohérent (pas d'inventaire)
- [ ] Tag git vX.Y.Z créé
- [ ] Build final 0 erreur
- [ ] Déployé + smoke OK (ou blocus déclaré)
