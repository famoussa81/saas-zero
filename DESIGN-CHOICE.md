# DESIGN-CHOICE.md — Design System Decision (Pipeline saas-zero)

> **Généré par le skill `ns-discovery` (Phase 1 Discovery).**
> Ce document est la constitution design de la pipeline saas-zero et du SaaS de référence.
> Reflète la signature utilisateur : **effet wow** (attire et fait acheter), **zéro bug**, **complet**.

---

## 1. Design Philosophy & Principles

### 1.1 Core Design Principles

| Principle                          | Description                                                   | Trade-off Accepted                               |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------ |
| **Clarity over cleverness**        | L'évident bat le mignon ; les utilisateurs ne devinent jamais | Peut sembler moins "delightful" au premier abord |
| **Consistency over customization** | Patterns partagés, pas de one-off                             | Moins de flexibilité par feature                 |
| **Performance as a feature**       | Rapide = beau ; pas de jank                                   | Contraint la complexité d'animation              |
| **Accessibility by default**       | Inclusive dès le jour 1, pas en retrofit                      | Investissement upfront                           |
| **Zéro bug visible**               | Un bug à l'inscription détruit la rassurance                  | Gates qualité intégrés au design                 |

### 1.2 Brand Personality Attributes

- **Professional** — Digne de confiance, compétent, poli
- **Minimal** — Propre, centré, essentiel
- **Technical** — Précis, détaillé, expert (public développeur)
- **Bold** sur l'élément signature uniquement

### 1.3 Design Token Philosophy

- **Semantic tokens** — `color-primary`, `color-error`, `space-md`, `radius-lg`
- **Mode-aware tokens** — Light/dark/auto intégrés à la structure
- **Aucune valeur hardcodée** dans les composants (audit `design-tokens-audit`)

### 1.4 Élément Signature (le "wow" reconnaissable)

> **Doctrine utilisateur** : _attirer avec le wow → convaincre avec la qualité → rassurer avec le zéro bug._

| Champ                  | Définition                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Quoi**               | Un **terminal qui exécute la vraie commande du produit** (`/ns-ship "mon-saas"`) et déroule ses 6 phases en boucle |
| **Où**                 | Hero de la landing (`components/marketing/PipelineHero.tsx`)                                                       |
| **Pourquoi il marque** | Le produit EST une pipeline en ligne de commande — le hero le démontre au lieu de le décrire                       |
| **Motion associée**    | Tier Modéré, timeline GSAP en boucle, `power2.out` / `back.out(3)` sur les checks                                  |
| **Ne PAS faire**       | Forme abstraite décorative, orbes floutés en dégradé, capture statique                                             |

**Hero de la landing** : deux colonnes — la promesse à gauche, le terminal qui tourne à droite. Le visiteur voit le produit fonctionner avant d'avoir scrollé.

**Prolongements du même langage** : la section « Comment ça marche » reprend les mêmes 6 phases en timeline verticale liée au scroll (`PipelineTimeline.tsx`), et le fond de page est une grille de précision (`.precision-grid`) plutôt qu'un décor abstrait.

**Critère d'acceptation** : un visiteur identifie la marque en < 3 secondes sans lire le logo.

### 1.5 Conversion Design

| Arme de conversion       | Où                    | Principe                                               |
| ------------------------ | --------------------- | ------------------------------------------------------ |
| **Hero wow**             | Landing top           | La promesse + l'élément signature, sans scroll         |
| **Preuve sociale**       | Sous le hero, pricing | Logos, avis, chiffres (rétention, MRR, users)          |
| **Bénéfices > features** | Sections features     | "Gagne 5h/semaine" > "Export CSV"                      |
| **CTA sans ambiguïté**   | Hero, nav, pricing    | 1 action par écran, verbe d'action                     |
| **Zéro bug visible**     | Toute l'app           | Performance + absence d'erreurs = rassurance implicite |
| **Pricing rassurant**    | /pricing              | Toggle mensuel/annuel (-20%), FAQ, garantie            |

---

## 2. Color System

### 2.1 Palette Strategy

- **Fond** : neutre teinté vers le primaire (jamais un gris pur — cf. `ns-design-direction`)
- **Primaire** : **violet-indigo** (précision technique, confiance)
- **Accent secondaire** : **ambre chaud** — contrepoint qui réchauffe une palette autrement froide, utilisé en dégradé sur les barres de progression et le texte signature

> Les couleurs vivent en HSL sans fonction (format Tailwind/shadcn) dans `src/styles/globals.css`, et sont exposées via `tailwind.config.ts`. Les valeurs hex ci-dessous sont indicatives, la source de vérité est le CSS.

### 2.2 Base Palette Definition

| Variable CSS         | Light           | Dark             | Hex (indicatif) | Usage                        |
| -------------------- | --------------- | ---------------- | --------------- | ---------------------------- |
| `--primary`          | `255 85% 45%`   | `255 85% 55%`    | `#6d5bd0`       | **Primaire violet-indigo**   |
| `--accent`           | `38 92% 50%`    | `38 92% 55%`     | `#f5a524`       | **Accent ambre** (signature) |
| `--background`       | `0 0% 100%`     | `240 10% 3.9%`   | —               | Fond de page                 |
| `--foreground`       | `240 10% 3.9%`  | `0 0% 98%`       | —               | Texte principal              |
| `--muted-foreground` | `240 5% 35%`    | `240 5% 75%`     | —               | Texte secondaire (WCAG AA)   |
| `--border`           | `240 5.9% 90%`  | `240 3.7% 15.9%` | —               | Bordures, séparateurs        |
| `--destructive`      | `0 84.2% 60.2%` | `0 62.8% 30.6%`  | —               | Erreurs                      |

### 2.3 Semantic Color Aliases

| Semantic Token              | Light Maps To | Dark Maps To  |
| --------------------------- | ------------- | ------------- |
| `color-bg-primary`          | `neutral-50`  | `neutral-950` |
| `color-bg-secondary`        | `neutral-100` | `neutral-900` |
| `color-text-primary`        | `neutral-900` | `neutral-50`  |
| `color-text-secondary`      | `neutral-600` | `neutral-400` |
| `color-border-subtle`       | `neutral-200` | `neutral-800` |
| `color-interactive-primary` | `brand-600`   | `brand-400`   |

### 2.4 Accessibility Requirements

- **AA contrast** (4.5:1 texte, 3:1 UI) — minimum
- **Color-blind safe** — testé protanopia/deuteranopia/tritanopia

---

## 3. Typography

### 3.1 Font Strategy

- **Single variable font** : Geist (ou Inter en fallback), `font-display: swap`
- Preload de la fonte critique

### 3.2 Type Scale Definition

| Token             | Font Size       | Line Height | Weight | Use Case         |
| ----------------- | --------------- | ----------- | ------ | ---------------- |
| `text-display-xl` | 72px / 4.5rem   | 1.1         | 700    | Marketing hero   |
| `text-display-md` | 48px / 3rem     | 1.2         | 600    | Section headers  |
| `text-heading-lg` | 24px / 1.5rem   | 1.3         | 600    | H2               |
| `text-body-md`    | 16px / 1rem     | 1.6         | 400    | **Body default** |
| `text-body-sm`    | 14px / 0.875rem | 1.5         | 400    | Secondary text   |
| `text-caption`    | 12px / 0.75rem  | 1.5         | 500    | Labels, meta     |

---

## 4. Motion

### 4.1 Motion Tier

**Modéré à Bold** : GSAP + ScrollTrigger sur la landing (hero, pricing), Framer Motion dans l'app.

### 4.2 Animation Tokens

| Token           | Duration | Easing        | Use Case                  |
| --------------- | -------- | ------------- | ------------------------- |
| `motion-fast`   | 100ms    | `ease-out`    | Hover, focus, tap         |
| `motion-normal` | 200ms    | `ease-in-out` | **Default** — transitions |
| `motion-slow`   | 300ms    | `ease-out`    | Modals, drawers, toasts   |
| `motion-slower` | 500ms    | `ease-in-out` | Page transitions          |

### 4.3 Reduced Motion

- Toutes les animations respectent `prefers-reduced-motion` (accessibilité)

---

## 5. Dark Mode

### 5.1 Implementation

- **Par défaut sombre** (cohérent "pro"), toggle clair
- Persistance : localStorage + préférence OS

### 5.2 Color Inversion Rules

| Light                        | Dark                   | Rule                                      |
| ---------------------------- | ---------------------- | ----------------------------------------- |
| `neutral-50` → `neutral-950` | Backgrounds invert     |
| `neutral-900` → `neutral-50` | Text inverts           |
| `brand-600` → `brand-400`    | Primary shifts lighter |
| `shadow-*`                   | Same values            | Shadows work on dark (black with opacity) |

---

## 6. Responsive

### 6.1 Breakpoint Tokens

| Token    | Min Width | Target Devices                    |
| -------- | --------- | --------------------------------- |
| `bp-sm`  | 640px     | Large phones / small tablets      |
| `bp-md`  | 768px     | Tablets portrait                  |
| `bp-lg`  | 1024px    | Tablets landscape / small laptops |
| `bp-xl`  | 1280px    | Desktops                          |
| `bp-2xl` | 1536px    | Large desktops                    |

### 6.2 Approach

- **Mobile-first** — base mobile, `min-width` media queries up (Tailwind default)
- Le kanban s'adapte : colonnes verticales sur mobile, drag & drop léger sur desktop

---

## 7. Accessibility

### 7.1 Standard

- **WCAG 2.1 AA** : contraste ≥ 4.5:1, focus visible, skip link, ARIA sur les éléments interactifs
- axe-core automatisé en CI (`gate:accessibility`)
- Keyboard-only, zoom 200%, reduced motion

### 7.2 Component Library

- **ship-flow** : shadcn/ui + Radix primitives branchées sur tokens (Button, Input, Card, Dialog, Badge, Table, Select)
- **CVA** (Class Variance Authority) pour les variantes type-safe

---

## 8. Decision Log

| Date       | Decision          | Chosen                                                                                                | Rationale                                                                                                                                                                                          |
| ---------- | ----------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | Design system     | ship-flow (shadcn + Radix + Tailwind + CVA)                                                           | Déjà en place, beau rendu, accessible                                                                                                                                                              |
| 2026-08-09 | Élément signature | Check vert émeraude + hero kanban parallax                                                            | Fil reconnaissable qui vend la promesse                                                                                                                                                            |
| 2026-08-09 | Motion tier       | Modéré à Bold (GSAP + Framer Motion)                                                                  | Effet wow sans surcharge                                                                                                                                                                           |
| 2026-08-09 | Dark mode         | Sombre par défaut + toggle                                                                            | Cohérent "pro"                                                                                                                                                                                     |
| 2026-08-11 | Élément signature | **Remplacé** : terminal `/ns-ship` animé (remplace le check émeraude + hero kanban)                   | Le doc décrivait la démo TaskFlow, pas le produit réel. La landing vend une pipeline en ligne de commande : le hero doit la montrer tourner. Le kanban reste pertinent côté app (`/projets/[id]`). |
| 2026-08-11 | Palette           | **Corrigée** : primaire violet-indigo `#6d5bd0` + accent ambre (remplace indigo `#4f46e5` + émeraude) | Le doc ne correspondait pas au code (`globals.css`). Alignement du doc sur l'implémentation vérifiée.                                                                                              |
| 2026-08-11 | Fond de page      | Grille de précision + halo unique (remplace 3 orbes floutés en dégradé)                               | Les orbes floutés sont un marqueur reconnaissable de design généré par IA (`ns-anti-generic-audit`) et contredisaient la direction « technique, précis ».                                          |

---

> **Template Version** : 1.0
> **Last Updated** : 2026-08-11
> **Owner** : Design Architect (pipeline saas-zero)
> **Review Cadence** : par release majeure

_Généré par le skill `ns-discovery` — Pipeline saas-zero_
