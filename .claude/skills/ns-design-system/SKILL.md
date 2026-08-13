---
name: ns-design-system
description: Design system non-générique pour SaaS — tokens, palette, ambiance, élément signature, dark mode. Utiliser à la phase design et quand on crée l'UI du SaaS.
---

# ns-design-system — Design system "wow" non-générique

> C'est **ta signature**. Pas un thème ChatGPT : une palette, une ambiance, un élément signature
> qui rendent le SaaS reconnaissable au premier coup d'œil et donnent envie d'acheter.
>
> 📌 **Skills officiels à référencer** : `greensock/gsap-core`, `gsap-scrolltrigger`, `gsap-react`,
> `gsap-performance` (registre VoltAgent) — pour l'animation "wow" sans tout réinventer.
> Aussi `anthropics/frontend-design` pour l'UI/UX.

## Principe

1. **Tous les tokens dans `src/styles/` ou `@theme`** — aucune couleur, espace, rayon, ombre, font en dur dans les composants.
2. **Dark mode d'abord** — définir les deux, forcer le thème sombre par défaut si le design l'exige.
3. **Élément signature** : chaque SaaS doit avoir UNE chose qu'on ne retrouve nulle part ailleurs
   (un motif, une animation, une forme, un grain, un dégradé). C'est ce qui fait "wow".

## Tokens (structure)

```ts
// src/styles/tokens.ts
export const tokens = {
  colors: {
    primary: { DEFAULT: "#6366f1", foreground: "#ffffff", muted: "#a5b4fc" },
    background: { DEFAULT: "#0a0a0f", subtle: "#13131c", card: "#1a1a26" },
    accent: { DEFAULT: "#22d3ee", foreground: "#082f36" }, // signature
    success: { 500: "#22c55e" },
    warning: { 500: "#f59e0b" },
    error: { 500: "#ef4444" },
  },
  spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "24px", 6: "32px" },
  radius: { sm: "8px", md: "12px", lg: "16px", xl: "24px", full: "9999px" },
  shadows: {
    sm: "0 1px 2px rgb(0 0 0 / 0.4)",
    lg: "0 12px 40px -8px rgb(0 0 0 / 0.6)",
  },
  typography: {
    fontFamilies: {
      sans: "Inter, system-ui",
      display: "Sora, sans-serif",
      mono: "JetBrains Mono",
    },
    sizes: {
      xs: "12px",
      sm: "14px",
      base: "16px",
      lg: "18px",
      xl: "24px",
      "2xl": "32px",
      "3xl": "44px",
    },
    weights: { normal: 400, medium: 500, semibold: 600, bold: 700 },
  },
} as const;
```

## Étapes de création (phase design)

1. **Choisir une ambiance** (héro : startup audacieuse / éditeur sobre / agency artistique).
2. **Définir 2-3 couleurs max** + 1 accent signature. Pas de rainbow.
3. **Choisir une police d'affichage distinctive** (Sora, Space Grotesk, Outfit…) différente de la police de corps.
4. **Définir l'élément signature** et le placer sur : hero, logo, empty-states, pricing, footer.
5. **Configurer le dark mode** (next-themes) + `color-scheme` + `suppressHydrationWarning`.
6. **Scaffolder les composants de base** (Button, Input, Card, Badge, Dialog, Toast) branchés sur les tokens.
7. **Gréer Storybook** pour chaque composant (via `ns-storybook`).

## Garde-fous (anti-générique)

- `grep -rE "#[0-9a-fA-F]{6}|rgba?\(" components/` → ne doit renvoyer QUE les fichiers de tokens.
- Pas de placeholder `via.placeholder.com` : vraies images (voir `media-sourcing`/`media-sourcing`).
- Le hero doit avoir un élément signature ACTIF (animation ou motif), pas une image statique seule.

## Quand passer à Style Dictionary

Fusionne l'ancien skill design-system, qui décrivait la même chose par un
autre outil — deux skills pour un seul sujet obligeaient à hésiter à chaque
projet.

**Par défaut : les tokens à la main dans `src/styles/globals.css`.** Un
fichier, lisible, versionné, que `pnpm design:tokens:audit` vérifie. C'est
suffisant pour un produit avec deux thèmes.

**Passer à Style Dictionary quand l'un de ces trois cas se présente :**

1. **Plus de deux thèmes** — clair, sombre, contraste élevé, marque blanche
   par client. Tenir quatre blocs de variables à la main diverge en un mois.
2. **Les tokens doivent sortir de l'application** — être consommés par une
   application mobile, un e-mail, une charte imprimée. Style Dictionary génère
   depuis une source JSON unique vers CSS, TypeScript, Swift, XML.
3. **Une équipe design édite les tokens sans toucher au code** — le JSON est
   un format d'échange, `globals.css` ne l'est pas.

Hors de ces cas, c'est de la plomberie en plus sans bénéfice : un build de
plus, un format de plus, et une source de vérité éloignée du code qui la
consomme.

### La bascule, si elle est justifiée

```bash
pnpm add -D style-dictionary
```

`tokens/core.json` (valeurs brutes) et `tokens/semantic.json` (alias par
rôle : `color-primary` pointe vers une primitive). Le build produit
`globals.css`, qui devient alors **généré** — donc à ne plus éditer à la main,
et à faire ignorer par `design:tokens:audit` en tant que source.

## Checklist de sortie

- [ ] Tokens dans `@theme` (pas de valeurs en dur)
- [ ] Dark mode configuré et testé
- [ ] Élément signature défini et visible sur 3+ sections
- [ ] `grep` tokens → propre (aucune couleur en dur)
- [ ] Storybook pour les composants de base
