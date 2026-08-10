---
name: design-system
description: Centralized design tokens via Style Dictionary. Single source of truth for colors, spacing, typography, shadows, motion. Generates CSS variables, TypeScript types, Tailwind config.
---

# Design System — Style Dictionary Pipeline

> **Purpose**: One source of truth (`tokens/`) → builds `@theme` CSS, TS types, Tailwind config. Zero hardcoded values anywhere.

## Architecture

```
tokens/
├── core.json              # Primitives (blue-500, size-4, font-sans)
├── semantic.json          # Semantic aliases (--color-primary, --space-md)
├── themes/
│   ├── light.json         # Light theme overrides
│   └── dark.json          # Dark theme overrides
└── component-overrides/   # Per-component token overrides (optional)

build/
├── css/variables.css      # CSS custom properties (imported in globals.css)
├── js/tokens.ts           # TypeScript types + runtime object
├── tailwind.config.js     # Tailwind plugin (auto-generated)
└── figma-tokens.json      # Export for Figma Tokens plugin
```

## Installation

```bash
npm i -D style-dictionary @tokens-studio/sd-transforms
# For Tailwind v4 (CSS-first):
npm i -D @tailwindcss/postcss
```

## Token Structure (core.json example)

```json
{
  "color": {
    "blue": {
      "50": { "value": "#eff6ff", "type": "color" },
      "100": { "value": "#dbeafe", "type": "color" },
      "500": { "value": "#3b82f6", "type": "color" },
      "600": { "value": "#2563eb", "type": "color" },
      "900": { "value": "#1e3a5f", "type": "color" }
    },
    "neutral": {
      "50": { "value": "#fafafa", "type": "color" },
      "950": { "value": "#030712", "type": "color" }
    }
  },
  "spacing": {
    "0": { "value": "0", "type": "dimension" },
    "1": { "value": "0.25rem", "type": "dimension" },
    "4": { "value": "1rem", "type": "dimension" },
    "8": { "value": "2rem", "type": "dimension" }
  },
  "fontFamilies": {
    "sans": { "value": "Inter, system-ui, sans-serif", "type": "fontFamily" },
    "mono": { "value": "JetBrains Mono, monospace", "type": "fontFamily" }
  },
  "fontSizes": {
    "base": { "value": "1rem", "type": "fontSize" },
    "lg": { "value": "1.125rem", "type": "fontSize" },
    "xl": { "value": "1.25rem", "type": "fontSize" }
  },
  "borderRadius": {
    "none": { "value": "0", "type": "borderRadius" },
    "md": { "value": "0.375rem", "type": "borderRadius" },
    "lg": { "value": "0.5rem", "type": "borderRadius" },
    "full": { "value": "9999px", "type": "borderRadius" }
  },
  "shadow": {
    "sm": { "value": "0 1px 2px 0 rgb(0 0 0 / 0.05)", "type": "boxShadow" },
    "md": { "value": "0 4px 6px -1px rgb(0 0 0 / 0.1)", "type": "boxShadow" },
    "lg": { "value": "0 10px 15px -3px rgb(0 0 0 / 0.1)", "type": "boxShadow" }
  },
  "duration": {
    "fast": { "value": "150ms", "type": "duration" },
    "normal": { "value": "200ms", "type": "duration" },
    "slow": { "value": "300ms", "type": "duration" }
  },
  "easing": {
    "easeInOut": {
      "value": "cubic-bezier(0.4, 0, 0.2, 1)",
      "type": "transition"
    }
  }
}
```

## Semantic Aliases (semantic.json)

```json
{
  "color": {
    "primary": { "value": "{color.blue.600}", "type": "color" },
    "primaryHover": { "value": "{color.blue.700}", "type": "color" },
    "background": { "value": "{color.neutral.50}", "type": "color" },
    "surface": { "value": "{color.neutral.100}", "type": "color" },
    "text": { "value": "{color.neutral.950}", "type": "color" },
    "textMuted": { "value": "{color.neutral.500}", "type": "color" },
    "border": { "value": "{color.neutral.200}", "type": "color" },
    "focus": { "value": "{color.blue.500}", "type": "color" },
    "error": { "value": "{color.red.500}", "type": "color" },
    "success": { "value": "{color.green.500}", "type": "color" },
    "warning": { "value": "{color.amber.500}", "type": "color" }
  },
  "spacing": {
    "xs": { "value": "{spacing.1}", "type": "dimension" },
    "sm": { "value": "{spacing.2}", "type": "dimension" },
    "md": { "value": "{spacing.4}", "type": "dimension" },
    "lg": { "value": "{spacing.6}", "type": "dimension" },
    "xl": { "value": "{spacing.8}", "type": "dimension" }
  },
  "radius": {
    "sm": { "value": "{borderRadius.md}", "type": "borderRadius" },
    "md": { "value": "{borderRadius.lg}", "type": "borderRadius" },
    "full": { "value": "{borderRadius.full}", "type": "borderRadius" }
  }
}
```

## Dark Theme (themes/dark.json)

```json
{
  "color": {
    "background": { "value": "{color.neutral.950}", "type": "color" },
    "surface": { "value": "{color.neutral.900}", "type": "color" },
    "text": { "value": "{color.neutral.50}", "type": "color" },
    "textMuted": { "value": "{color.neutral.400}", "type": "color" },
    "border": { "value": "{color.neutral.700}", "type": "color" }
  }
}
```

## Build Config (style-dictionary.config.js)

```javascript
// style-dictionary.config.js
const { transforms, formatters } = require("@tokens-studio/sd-transforms");

module.exports = {
  source: ["tokens/**/*.json"],
  platforms: {
    css: {
      transformGroup: "tokens-studio",
      buildPath: "build/css/",
      files: [
        {
          destination: "variables.css",
          format: "css/variables",
          options: { outputReferences: true },
        },
      ],
    },
    ts: {
      transformGroup: "tokens-studio",
      buildPath: "build/js/",
      files: [
        {
          destination: "tokens.ts",
          format: "typescript/module-flat",
          options: { outputReferences: false },
        },
      ],
    },
    tailwind: {
      transformGroup: "tokens-studio",
      buildPath: "build/",
      files: [
        {
          destination: "tailwind.config.js",
          format: "javascript/es6",
          filter: {
            attributes: {
              category: [
                "color",
                "spacing",
                "fontSizes",
                "fontFamilies",
                "borderRadius",
                "shadow",
                "duration",
                "easing",
              ],
            },
          },
        },
      ],
    },
  },
};
```

## NPM Scripts (add to package.json)

```json
{
  "scripts": {
    "design:tokens:build": "style-dictionary build --config style-dictionary.config.js",
    "design:tokens:watch": "style-dictionary build --config style-dictionary.config.js --watch",
    "design:tokens:check": "node .claude/scripts/design-tokens-audit.js"
  }
}
```

## Usage in Code

```tsx
// Import types (auto-generated)
import { tokens } from '@/lib/design-tokens';

// Use in components — ZERO hardcoded values
export function Button({ variant = 'primary' }) {
  const bg = variant === 'primary' ? tokens.color.primary : tokens.color.surface;
  return <button className="px-[var(--space-md)] py-[var(--space-sm)]" style={{ background: bg }} />;
}

// In CSS (globals.css)
@import '@/build/css/variables.css';

:root {
  /* Auto-generated from tokens — do not edit manually */
}

[data-theme="dark"] {
  /* Auto-generated dark overrides */
}
```

## Figma Integration

1. Install **Figma Tokens** plugin
2. Sync tokens from `tokens/` → Figma (or Figma → `tokens/`)
3. Export from Figma → `build/figma-tokens.json` → commit
4. Pipeline: `design:tokens:build` runs on every PR

## Gate Integration

Run in CI (ns-verify):

```bash
pnpm design:tokens:build  # fails if tokens invalid
pnpm design:tokens:check  # fails if hardcoded values detected
```
