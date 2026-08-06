# `/ns-design` — Phase 3 : Design System Complet

> **Objectif** : Design system complet + composants + Storybook + baselines visuels.

---

## Usage

```bash
/ns-design
# ou
pnpm ns:design
```

> **Prérequis** : Phase 2 Scaffold terminée, `DESIGN-CHOICE.md` validé.

---

## Agents

- `design-architect` + `saas-ui-builder` (séquentiel)

---

## Livrables

### 1. `DESIGN-SPEC.md`

- **Tokens** : colors, spacing, radii, shadows, fonts (depuis design system choisi)
- **Semantic aliases** : `--color-primary`, `--color-muted`, `--color-destructive`, `--space-md`, `--radius-lg`, `--shadow-md`
- **Dark mode** : tokens pour les deux thèmes
- **Typography** : font families, sizes, weights, line heights
- **Motion** : durées, easings, reduced-motion support

### 2. `components/ui/*` — Primitives shadcn (Radix + Tailwind + CVA)

```
Button, Input, Card, Dialog, Table, Form, Select, Toast, Tooltip,
Avatar, Badge, Tabs, Accordion, Dropdown, Sheet, Popover, HoverCard,
ContextMenu, Menubar, NavigationMenu, Pagination, Progress, Slider,
Switch, Checkbox, RadioGroup, Label, Separator, ScrollArea, Resizable,
Command, Calendar, DatePicker, Chart, Carousel, Toast, Sonner
```

### 3. `components/forms/*` — Formulaires métier

```
ContactForm, NewsletterForm, CheckoutForm, InviteForm, ApiKeyForm
```

### 4. `components/sections/*` — Sections marketing

```
Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Navbar
```

### 5. `components/MDXComponents.tsx` — Composants CMS

```
Hero, FeatureGrid, PricingTable, TestimonialCarousel, FAQ, CTA
```

### 6. `.storybook/*` — Config + Stories

```
main.ts, preview.ts, stories pour CHAQUE composant ui/
```

### 7. `tests/visual/baselines/*` — Captures Playwright

```
Baselines pour regression visuelle (chromatic-like local)
```

---

## Étapes Détaillées

### Étape 1 : Design Architect (`design-architect` agent)

Délègue au sous-agent `design-architect` (`.claude/agents/design-architect.md`) :
"Generate DESIGN-SPEC.md from DESIGN-CHOICE.md" — contexte CLAUDE.md + DESIGN-CHOICE.md (Claude Code).

- Lit `DESIGN-CHOICE.md` (design system, motion tier)
- Utilise `ns-design-system` skill pour tokens, palette et élément signature du système choisi
- Produit `DESIGN-SPEC.md` complet

### Étape 2 : UI Builder (`saas-ui-builder` agent)

Délègue au sous-agent `saas-ui-builder` (`.claude/agents/saas-ui-builder.md`) :
"Build all components from DESIGN-SPEC.md" — contexte CLAUDE.md + DESIGN-SPEC.md (Claude Code).

- Génère tous les composants `ui/`, `forms/`, `sections/`, `MDXComponents.tsx`
- Configure Storybook
- Capture baselines visuels

---

## Gate Design

- ✓ **Storybook build** — `pnpm storybook:build` passe
- ✓ **Visual baselines capturées** — `tests/visual/baselines/` non vide
- ✓ **Tokens utilisés partout** — `grep` pas de valeurs hardcodées (couleurs, spacing, radii)
- ✓ **Dark mode fonctionnel** — Toggle dans Storybook
- ✓ **Accessibilité de base** — axe-core sur composants Storybook

---

## Vérification Rapide

```bash
# Storybook local
pnpm storybook

# Build Storybook
pnpm storybook:build

# Visual regression baseline
pnpm test:visual -- --update-snapshots

# Vérifier tokens (pas de hardcoded)
grep -r "bg-blue-500\|text-gray-900\|p-4\|rounded-lg" components/ --include="*.tsx" || echo "OK: tokens only"
```

---

## Design System de Référence : ship-flow

Le repo [`famoussa81/ship-flow`](https://github.com/famoussa81/ship-flow) fournit :

- Composants shadcn/ui étendus (Button, Card, Input, etc. avec variants CVA)
- Sections marketing prêtes (Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Navbar)
- Formulaires (Contact, Newsletter, Checkout)
- Tokens Tailwind configurés
- Motion avec Framer Motion / GSAP selon tier

**Réutiliser** : Copier/adapté les composants, sections, tokens — PAS le workflow.
