# `/ship` — Build → Review → Tests → PR → Deploy

> **Commande de livraison** : prend l'état actuel du repo et le livre proprement.
> Vérifie tout, corrige ce qui casse, puis crée une PR et déploie en preview.

---

## Usage

```bash
/ship
/ship "fix: corrige le contraste des badges sur le blog"
```

---

## Pipeline

### 1. Build & Gates

- `pnpm typecheck` — 0 erreur
- `pnpm lint` — 0 warning
- `pnpm test` — unit tests verts
- `pnpm test:e2e` — e2e verts
- `pnpm build` — build propre

**Si un gate échoue** : corrige le problème, relance, jusqu'à ce que tout passe.

### 2. Review (agent `qa`)

- Relit les changements (git diff)
- Vérifie : a11y, responsive, i18n, SEO, cohérence design
- Corrige les problèmes trouvés
- **Gate** : a11y 0 violation, pas de régression visuelle

### 3. Commit & PR

- Commit avec message conventionnel (conventional commits)
- Crée une PR avec description claire des changements
- **Gate** : PR créée

### 4. Deploy Preview (agent `deployer`)

- Déploie en preview Vercel
- Vérifie que la preview URL répond
- **Gate** : preview accessible

---

## Règles

1. **Fail-closed** : un gate qui échoue bloque la livraison, on corrige pas on contourne
2. **Économe en tokens** : pas de subagents inutiles, boucles courtes
3. **Conventional commits** : `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`
4. **PR descriptive** : quoi, pourquoi, comment tester

---

## Sortie

- Tous les gates verts
- Code corrigé si nécessaire
- PR créée
- Preview Vercel déployée

---

_Commande `ship` v1.0 — Pipeline saas-zero_
