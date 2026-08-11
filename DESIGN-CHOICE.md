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

### 2.3 Usage sémantique (classes Tailwind)

Les variables du §2.2 sont exposées comme utilitaires Tailwind via `tailwind.config.ts`. Les composants utilisent **ces classes**, jamais les valeurs.

| Intention          | Classe                  | Résout vers                    |
| ------------------ | ----------------------- | ------------------------------ |
| Fond de page       | `bg-background`         | `hsl(var(--background))`       |
| Surface / carte    | `bg-card`               | `hsl(var(--card))`             |
| Texte principal    | `text-foreground`       | `hsl(var(--foreground))`       |
| Texte secondaire   | `text-muted-foreground` | `hsl(var(--muted-foreground))` |
| Action principale  | `bg-primary`            | `hsl(var(--primary))`          |
| Accent / signature | `text-accent`           | `hsl(var(--accent))`           |
| Bordure            | `border-border`         | `hsl(var(--border))`           |
| Anneau de focus    | `ring-ring`             | `hsl(var(--ring))`             |

> Les échelles `--font-size-*`, `--font-weight-*`, `--shadow-*`, `--radius-*` sont câblées de la même façon : `text-sm` compile vers `font-size: var(--font-size-sm)`. C'est pourquoi `text-sm` **est** un token et non une valeur en dur (cf. `.claude/scripts/design-tokens-audit.js`).

### 2.4 Accessibility Requirements

- **AA contrast** (4.5:1 texte, 3:1 UI) — minimum
- **Color-blind safe** — testé protanopia/deuteranopia/tritanopia

---

## 3. Typography

### 3.1 Font Strategy

Deux fontes, deux rôles distincts — chargées via `next/font/google` dans `app/[locale]/layout.tsx`, avec `display: "swap"` et preconnect.

| Rôle        | Fonte          | Variable CSS     | Pourquoi                                                            |
| ----------- | -------------- | ---------------- | ------------------------------------------------------------------- |
| **Display** | **Syne**       | `--font-display` | Caractère marqué (le `S`, le `y`) — reconnaissable en un coup d'œil |
| **Body**    | **DM Sans**    | `--font-sans`    | Grande hauteur d'x, lisible à 15-16px, neutre sans être fade        |
| **Mono**    | JetBrains Mono | `--font-mono`    | Terminal du hero, chiffres alignés (`tabular-nums`)                 |

> **Ni Inter ni Space Grotesk** : ce sont les choix « sûrs » par défaut, donc invisibles (cf. liste rouge de `ns-design-direction`).

### 3.2 Type Scale Definition

L'échelle vit dans `--font-size-*` (globals.css) et s'utilise via les classes Tailwind standard, qui résolvent vers ces variables.

| Classe      | Variable           | Valeur   | Usage              |
| ----------- | ------------------ | -------- | ------------------ |
| `text-7xl`  | `--font-size-7xl`  | 4.5rem   | Hero marketing     |
| `text-5xl`  | `--font-size-5xl`  | 3rem     | Titres de section  |
| `text-2xl`  | `--font-size-2xl`  | 1.5rem   | H2                 |
| `text-base` | `--font-size-base` | 1rem     | **Corps de texte** |
| `text-sm`   | `--font-size-sm`   | 0.875rem | Texte secondaire   |
| `text-xs`   | `--font-size-xs`   | 0.75rem  | Labels, méta       |

Texte courant : viser ~65 caractères par ligne.

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

### 5.2 Mécanisme d'inversion

Le thème sombre redéfinit **les mêmes variables** sous `.dark` dans `globals.css` (`darkMode: "class"` dans `tailwind.config.ts`). Les composants ne changent jamais : ils lisent `bg-background`, la variable change sous eux.

| Variable             | Light          | Dark           | Règle appliquée                                   |
| -------------------- | -------------- | -------------- | ------------------------------------------------- |
| `--background`       | `0 0% 100%`    | `240 10% 3.9%` | Luminosité inversée, teinte conservée             |
| `--foreground`       | `240 10% 3.9%` | `0 0% 98%`     | Idem, en miroir                                   |
| `--primary`          | `255 85% 45%`  | `255 85% 55%`  | Même teinte, éclaircie sur fond sombre            |
| `--muted-foreground` | `240 5% 35%`   | `240 5% 75%`   | Ajusté dans les deux sens pour tenir le WCAG AA   |
| `--shadow-*`         | inchangé       | inchangé       | Noir avec opacité : fonctionne sur les deux fonds |

**Règle** : on inverse les **luminosités**, jamais les teintes. Une inversion naïve casse l'identité de la marque.

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
