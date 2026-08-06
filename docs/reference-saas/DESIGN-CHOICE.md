# DESIGN-CHOICE.md — TaskFlow (SaaS de référence)

> Choix de design du produit de référence, issu de la Phase Discovery. Reflète la signature
> de l'utilisateur : **effet wow** (attire et fait acheter), **zéro bug**, **complet**.

## Design system

Basé sur le skill `ns-design-system` (non-générique). Ambiance : **productivité agile**
(un outil de travail qui a de la personnalité, pas un clone générique).

## Palette (2-3 couleurs + 1 accent signature)

- **Fond** : neutre gris foncé (dark mode) — crédible "pro".
- **Primaire** : indigo vif (action, confiance).
- **Accent signature** : vert émeraude (complétion, tâche faite). Ce check vert devient un point
  récurrent (hero, onboarding, kanban) — c'est le fil qui fait reconnaître le SaaS.

## Élément signature (le "wow")

- **Animation de complétion** : quand une tâche passe à "done", un _check_ émerge (scale + bounce)
  avec la couleur émeraude. C'est ce petit "wow" qui apporte de la satisfaction (rétention).
- **Hero de la landing** : le tableau kanban bouge légèrement (parallax) pour attirer l'oeil →
  donne envie d'essayer → inscription.

## Motion tier

- **Modéré à Bold** : GSAP + ScrollTrigger sur la landing (hero, pricing), Framer Motion dans l'app.
- `prefers-reduced-motion` respecté (accessibilité).

## Composants

- Primitives shadcn/Radix branchées sur tokens (Button, Input, Card, Dialog, Badge, Table, Select...).
- **Kanban** : colonnes par statut, on drag & drop léger, compteurs par colonne, accessible.

## Accessibilité (WCAG 2.1 AA)

- Contraste ≥ 4.5:1, focus visible, skip link, ARIA sur les éléments interactifs, reduced motion.

## Dark mode

- Par défaut sombre (cohérent "pro"), toggle clair, persistance localStorage + préférence OS.

---

_Généré par la pipeline ns-ship, Phase 1 Discovery._
