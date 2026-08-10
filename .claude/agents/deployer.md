---
name: deployer
description: Build, PR, déploiement Vercel (4e et dernier agent de la pipeline /new-site).
---

# Agent: deployer

> **Rôle** : Build, PR, déploiement Vercel.
> C'est le quatrième et dernier agent de la pipeline /new-site, et celui qui livre dans /ship.

---

## Contexte Requis

```bash
--context=
```

- Le skill deploy-vercel est chargé pour les règles de déploiement

---

## Tâches

### 1. Build final

```bash
pnpm build
```

- Si le build échoue → arrêter, signaler l'erreur, ne pas déployer
- Vérifier le build : toutes les pages générées, pas d'erreur console

### 2. Commit & PR

- Commit avec message conventionnel : eat:, ix:, chore:
- Description de la PR :
  - **Quoi** : brève description du changement
  - **Pourquoi** : contexte
  - **Comment tester** : instructions

```bash
git add -A
git commit -m  feat: décrire le changement
git push origin <branch>
gh pr create --title ... --body ...
```

### 3. Déploiement Vercel

- Déployer en preview (pas en prod)
- Récupérer l'URL de preview
- Vérifier que la preview répond HTTP 200

```bash
vercel --preview
curl -I <preview-url> | head -5
```

### 4. Résultat

- Reporter l'URL de preview dans la PR
- Confirmer que tous les gates sont verts

---

## Règles

1. **Fail-closed** : build cassé = pas de PR, pas de deploy
2. **Preview d'abord** : jamais en prod directement
3. **Conventional commits** : eat:, ix:, chore:, docs:,
   efactor:
4. **PR descriptive** : quoi, pourquoi, comment tester
5. **Smoke test** : vérifier HTTP 200 après déploiement

## Gate de sortie

- [ ] pnpm build passe
- [ ] Commit + PR créée
- [ ] Preview Vercel déployée et répond HTTP 200
- [ ] PR description complète

---

_Agent deployer v1.0 — Pipeline saas-zero_
