---
name: ns-storybook
description: "Storybook 10 avec le builder Vite pour Next.js : installation, configuration vérifiée, écriture de stories, intégration des stories comme tests vitest, et pièges de versions. Documente les composants et sert de base à la régression visuelle."
---

# Skill `ns-storybook` — Documentation de composants (Storybook 10)

> **But** : développer et documenter les composants isolément, et faire tourner les stories **comme des tests**.
>
> **Version** : Storybook **10.x** avec `@storybook/nextjs-vite`. Vérifié fonctionnel dans ce repo.

---

## Piège de versions (le plus important)

Storybook 8 et 10 ont des noms de paquets **différents et incompatibles**. Un `package.json` qui mélange les deux ne démarre jamais.

| Storybook 8 (obsolète ici)                     | Storybook 10 (à utiliser)            |
| ---------------------------------------------- | ------------------------------------ |
| `@storybook/nextjs`                            | `@storybook/nextjs-vite`             |
| `@storybook/addon-essentials`                  | éclaté : `addon-docs`, `addon-a11y`… |
| `@storybook/addon-interactions`                | intégré / `@storybook/addon-vitest`  |
| `@storybook/blocks`                            | intégré à `addon-docs`               |
| `@storybook/test`                              | `@storybook/addon-vitest` + `vitest` |
| `import type { Meta } from "@storybook/react"` | `from "@storybook/nextjs-vite"`      |

**Vérifier la cohérence** :

```bash
for p in storybook @storybook/nextjs-vite @storybook/addon-a11y @storybook/addon-docs; do
  echo -n "$p: "; node -p "require('./node_modules/$p/package.json').version" 2>/dev/null || echo absent
done
```

Toutes les versions `@storybook/*` doivent partager la même majeure. Sinon : supprimer les paquets 8.x du `package.json`, puis `pnpm install`.

---

## Installation

```bash
npx storybook@latest init
```

L'installeur détecte Next.js, installe le bon builder et écrit `.storybook/`. **Ne pas installer les paquets à la main** — c'est ce qui crée le mélange de versions.

> L'installeur est interactif. Dans un environnement non interactif il peut rester bloqué sans afficher d'erreur : le lancer dans un terminal réel, ou vérifier que `.storybook/main.ts` a bien été écrit.

Il génère aussi un dossier `src/stories/` d'exemples génériques (Button, Header, Page). **Le supprimer** : ce n'est pas le code du projet et il fait échouer le lint.

```bash
rm -rf src/stories
```

---

## Configuration vérifiée

```ts
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs-vite";

const config: StorybookConfig = {
  stories: [
    "../components/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    "../src/**/*.mdx",
  ],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-links",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "storybook-addon-pseudo-states",
  ],
  framework: "@storybook/nextjs-vite",
  staticDirs: ["../public"],
};
export default config;
```

**Les globs doivent viser les vrais dossiers.** Ici les composants sont à la racine (`components/`), pas sous `src/` — l'installeur ne génère que `../src/**` par défaut.

```tsx
// .storybook/preview.tsx
import type { Preview } from "@storybook/nextjs-vite";
import "../src/styles/globals.css"; // sans ça : composants sans styles

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: "todo" }, // 'error' pour bloquer la CI
  },
};
export default preview;
```

---

## Stories comme tests (vitest)

`@storybook/addon-vitest` fait tourner chaque story comme un test dans un vrai navigateur headless. `vitest.config.ts` passe en `projects[]` :

```ts
export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    projects: [
      {
        extends: true,
        test: {
          globals: true,
          environment: "jsdom",
          setupFiles: ["./tests/setup.ts"],
          include: [
            "tests/unit/**/*.test.{ts,tsx}",
            "tests/contracts/**/*.test.{ts,tsx}",
          ],
        },
      },
      {
        extends: true,
        plugins: [
          storybookTest({ configDir: path.join(dirname, ".storybook") }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
```

`pnpm test` couvre alors unitaires **et** stories.

---

## Écrire une story

```tsx
// components/ui/button.stories.tsx
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"], // génère la page de doc
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
      ],
    },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: "Bouton", variant: "default" },
};
export const Disabled: Story = {
  args: { children: "Indisponible", disabled: true },
};
```

**Quoi documenter en priorité** : les primitives (`components/ui/`) et chaque **état** (défaut, hover via pseudo-states, disabled, chargement, erreur, vide). Un composant sans story d'état d'erreur n'est pas documenté.

---

## Configuration du projet à ne pas oublier

```js
// eslint.config.js — le build Storybook est du code généré
ignores: [/* ... */, "storybook-static/"],
```

```json
// tsconfig.eslint.json — les globs ** de TS ignorent les dossiers en point
"include": [/* ... */, ".storybook/**/*.ts", ".storybook/**/*.tsx"]
```

```gitignore
storybook-static
*storybook.log
```

Sans ces trois, le lint échoue sur du code généré ou sur `.storybook/` non couvert par un tsconfig.

---

## Commandes

```bash
pnpm storybook          # dev, port 6006
pnpm storybook:build    # build statique dans storybook-static/
pnpm test               # unitaires + stories
```

---

## Vérification

- [ ] Toutes les versions `@storybook/*` sur la même majeure
- [ ] `pnpm storybook:build` termine par « Storybook build completed successfully »
- [ ] Les stories du projet apparaissent (pas seulement les exemples)
- [ ] Les composants ont leurs styles (globals.css importé dans preview)
- [ ] `src/stories/` supprimé
- [ ] `pnpm lint` vert (storybook-static ignoré)

---

## Liens

- `ns-visual-regression` — baselines à partir des stories
- `ns-design-system` — les tokens doivent être visibles dans Storybook
