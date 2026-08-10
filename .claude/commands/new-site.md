# `/new-site` — Génère un site complet de A à Z depuis un brief

> **Point d'entrée principal de la pipeline saas-zero.**
> Donne un brief en langage naturel → reçois un site complet, beau, testé et prêt à déployer.

---

## Usage

```bash
/new-site "Site de réservation pour un hôtel de charme en Provence"
/new-site "SaaS de facturation pour freelances avec Stripe"
/new-site "Portfolio pour une photographe de mariage"
```

---

## Pipeline (4 agents séquentiels)

### 1. `planner` — Brief → Spec + Design System

- Analyse le brief : public, ton, objectif, features
- Produit `SPEC.md` (vision, pages, features) + `DESIGN-CHOICE.md` (palette, typo, ambiance, élément signature)
- Charge le skill `design-system` pour générer les tokens
- Charge le skill `design-principles` pour éviter les clichés IA
- **Gate** : spec validée (auto si brief clair, sinon question à l'utilisateur)

### 2. `builder` — Implémentation

- Charge le skill `ui-implementation` (shadcn/Tailwind/a11y/responsive/motion)
- Crée les pages, composants, sections, i18n (fr/en), SEO metadata
- Respecte strictement les tokens du design system
- **Gate** : `pnpm typecheck && pnpm lint` passent

### 3. `qa` — Tests

- Charge le skill `visual-regression` (screenshot → critique → itère)
- Écrit et lance les tests e2e (Playwright) + a11y (axe-core)
- Charge le skill `seo-perf` (metadata, OG, Lighthouse)
- **Gate** : `pnpm test && pnpm test:e2e` passent, a11y 0 violation

### 4. `deployer` — Build + PR + Vercel

- Charge le skill `deploy-vercel`
- `pnpm build` propre
- Crée une PR avec description
- Déploie en preview Vercel
- **Gate** : build OK + preview URL accessible

---

## Règles

1. **Économe en tokens** : skills chargés à la demande, boucles courtes, pas de subagents inutiles
2. **Design non-générique** : chaque site a un élément signature (skill `design-principles`)
3. **A11y obligatoire** : WCAG 2.1 AA, 0 violation axe-core
4. **i18n** : fr + en par défaut
5. **Responsive** : mobile-first, testé sur 3 breakpoints
6. **SEO** : metadata, Open Graph, sitemap

---

## Sortie

- Site complet dans le repo
- `SPEC.md` + `DESIGN-CHOICE.md` générés
- Tests verts (unit + e2e + a11y)
- Build propre
- PR + preview Vercel

---

_Commande `new-site` v1.0 — Pipeline saas-zero_
