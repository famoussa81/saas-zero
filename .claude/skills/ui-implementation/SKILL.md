---
name: ui-implementation
description: Implémentation UI de qualité — shadcn/Tailwind, a11y, responsive, motion. À charger quand on crée ou modifie des composants/pages React pour garantir une implémentation cohérente, accessible et soignée.
---

# ui-implementation — Implémentation UI de qualité

> Règles d'implémentation pour produire des composants React/Tailwind
> accessibles, responsive et cohérents avec le design system.

---

## Principes

1. **Tokens uniquement** — aucune couleur/rayon/ombre/font en dur dans les composants. Tout vient du design system (`src/styles/globals.css` CSS vars ou `tokens.ts`).
2. **Composants shadcn/ui** — utiliser les primitives Radix déjà présentes dans `components/ui/`, ne pas réinventer.
3. **A11y d'abord** — chaque composant interactif : focus visible, labels, ARIA, clavier.
4. **Mobile-first** — tester à 3 breakpoints (360px, 768px, 1280px).
5. **Motion sobre** — respecter `prefers-reduced-motion`, animations courtes (150-300ms), easing cohérent.

---

## Structure des composants

```tsx
// components/ui/button.tsx (exemple)
import { forwardRef } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
```

---

## A11y — checklist

- [ ] `aria-label` sur les boutons icône seuls
- [ ] `aria-expanded` / `aria-controls` sur les accordéons et menus
- [ ] Focus visible partout : `focus-visible:ring-2 focus-visible:ring-ring`
- [ ] Contraste ≥ 4.5:1 texte normal, ≥ 3:1 gros texte/UI
- [ ] Labels associés aux inputs (htmlFor + id)
- [ ] `prefers-reduced-motion` respecté
- [ ] Landmarks sémantiques : header, main, footer, nav
- [ ] Skip-link présent (« Aller au contenu »)

## Responsive — breakpoints

| Breakpoint   | Usage                             |
| ------------ | --------------------------------- |
| `< 640px`    | mobile : une colonne, menu burger |
| `640-1023px` | tablette : 2 colonnes             |
| `≥ 1024px`   | desktop : layout complet          |

- Toujours `min-h` et `py` généreux sur mobile
- Tests de texte longs (pas de textes coupés)
- Images responsives : `srcSet` ou `next/image` avec `sizes`

## Motion

```ts
// easing cohérent
const EASE = [0.16, 1, 0.3, 1] as const;

// animations : 150-300ms
// apparition : opacity + translateY(8px) → 0
// micro-interaction hover : transform scale(1.02) ou y(-2px)
```

- Jamais d'animation infinie sauf loading
- `motion` ou `gsap` selon le besoin, chargé à la demande

## Checklist de sortie

- [ ] `pnpm typecheck` passe
- [ ] `pnpm lint` passe
- [ ] Pas de couleurs/espaces en dur (grep tokens)
- [ ] A11y vérifié (axe-core 0 violation)
- [ ] Responsive testé 3 breakpoints
- [ ] `prefers-reduced-motion` respecté

---

_Skill `ui-implementation` v1.0 — Pipeline saas-zero_
