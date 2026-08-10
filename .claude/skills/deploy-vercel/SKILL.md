---
name: deploy-vercel
description: Règles de déploiement Vercel pour le pipeline saas-zero — build fail-closed, preview d'abord, smoke test HTTP 200, PR descriptive.
---

# deploy-vercel — Déploiement Vercel (build → PR → preview)

> Utilisé par l'agent `deployer` (phase 4 de `/new-site`). But : livrer en preview Vercel
> un site **buildé sans erreur**, avec une PR descriptive — jamais en production directement.

## Prérequis

- [ ] `pnpm build` passe sans erreur (aucune page en échec)
- [ ] `pnpm typecheck && pnpm lint` passent
- [ ] Vercel CLI connecté au projet (`vercel link` fait une fois)
- [ ] i18n : les deux locales (`fr`, `en`) se buildent

## Étapes

### 1. Build final (fail-closed)

```bash
pnpm build
```

- Si le build échoue → **arrêter**. Pas de commit, pas de PR, pas de deploy.
- Vérifier la sortie : toutes les routes générées, aucune erreur console critique.
- Vérifier que Pagefind a indexé (`pnpm pagefind`) — voir skill `ns-pagefind`.

### 2. Commit & PR (conventional commits)

```bash
git add -A
git commit -m "feat: <changement>"
git push origin <branch>
gh pr create --title "..." --body "..."
```

La description de la PR contient :

- **Quoi** : brève description du changement
- **Pourquoi** : le contexte
- **Comment tester** : instructions pour vérifier sur la preview

Types autorisés : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

### 3. Déploiement preview Vercel

```bash
vercel --preview
```

- Récupérer l'URL de preview retournée par Vercel.
- **Smoke test** : vérifier que la preview répond HTTP 200.

```bash
curl -I <preview-url> | head -5
```

### 4. Résultat

- Reporter l'URL de preview dans la PR (pas en commentaire privé).
- Confirmer que tous les gates sont verts avant de signaler "prêt à merge".

## Règles

1. **Fail-closed** : build cassé = pas de PR, pas de deploy.
2. **Preview d'abord** : jamais en prod directement — sauf `/ns-deploy` explicite.
3. **Conventional commits** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
4. **PR descriptive** : quoi, pourquoi, comment tester.
5. **Smoke test** : vérifier HTTP 200 après déploiement.
6. **i18n** : vérifier les deux locales sur la preview (`/fr`, `/en`).

## Variables d'environnement

Les secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, etc.) sont gérés dans le dashboard
Vercel (Project → Settings → Environment Variables). **Jamais** dans le code ni dans la PR.

## Gate de sortie

- [ ] `pnpm build` passe
- [ ] Commit + PR créée (conventional)
- [ ] Preview Vercel déployée et répond HTTP 200
- [ ] PR description complète (quoi / pourquoi / comment tester)
- [ ] Les deux locales répondent sur la preview

## Liens

- Skill liés : [[ns-deploy]], [[ns-pagefind]], [[ns-quality-gates]], [[ns-visual-regression]]
- Agent appelant : `deployer`

_Skill deploy-vercel v1.0 — Pipeline saas-zero_
