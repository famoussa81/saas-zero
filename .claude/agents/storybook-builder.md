---
name: storybook-builder
description: Builds Storybook configuration with component stories, Chromatic integration, and visual regression testing setup.
---

# Storybook Builder Agent

## Mission

Build complete Storybook configuration with component stories, Chromatic integration, visual regression testing, and component testing for the website workflow.

## Inputs

- `SPEC.md` - Product specification
- `DESIGN-SPEC.md` - Design specification

## Outputs

- `.storybook/main.ts` - Storybook main configuration
- `.storybook/preview.tsx` - Storybook preview configuration
- `*.stories.tsx` - Component stories
- `.github/workflows/chromatic.yml` - Chromatic CI workflow
- `chromatic.config.js` - Chromatic configuration

## Phase 1: Storybook Configuration

### 1.1 Main Configuration

```typescript
// .storybook/main.ts
import type { StorybookConfig } from "@storybook/nextjs";
import path from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-links",
    "@storybook/addon-a11y",
  ],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  staticDirs: ["../public"],
  webpackFinal: async (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve?.alias,
      "@": path.resolve(__dirname, "../src"),
    };
    return config;
  },
};

export default config;
```

### 1.2 Preview Configuration

```tsx
// .storybook/preview.tsx
import type { Preview } from "@storybook/react";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f0f0f" },
      ],
    },
    layout: "centered",
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => (
      <div className={context.globals.theme}>
        <Story {...context} />
      </div>
    ),
  ],
};

export default preview;
```

## Phase 2: Component Stories

### 2.1 Button Stories

```tsx
// components/ui/Button.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A versatile button component with multiple variants and sizes.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "outline", "ghost", "destructive"],
      description: "The visual style of the button",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "The size of the button",
    },
    disabled: {
      control: "boolean",
      description: "Whether the button is disabled",
    },
    loading: {
      control: "boolean",
      description: "Shows loading spinner",
    },
    onClick: { action: "clicked" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    children: "Button",
    variant: "primary",
  },
};

export const Secondary: Story = {
  args: {
    children: "Button",
    variant: "secondary",
  },
};

export const Outline: Story = {
  args: {
    children: "Button",
    variant: "outline",
  },
};

export const Ghost: Story = {
  args: {
    children: "Button",
    variant: "ghost",
  },
};

export const Destructive: Story = {
  args: {
    children: "Delete",
    variant: "destructive",
  },
};

export const Small: Story = {
  args: {
    children: "Small",
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    children: "Large",
    size: "lg",
  },
};

export const Loading: Story = {
  args: {
    children: "Loading...",
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    children: "Disabled",
    disabled: true,
  },
};

export const AsChild: Story = {
  render: () => (
    <Button asChild>
      <a href="/dashboard" className="text-primary-foreground">
        Dashboard
      </a>
    </Button>
  ),
};
```

### 2.2 Complex Component Stories

```tsx
// components/forms/ContactForm.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { ContactForm } from '@/components/forms/ContactForm'

const meta: Meta<typeof ContactForm> = {
  title: 'Forms/ContactForm',
  component: ContactForm,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof ContactForm>

export const Default: Story = {}

export const WithSuccess: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '500px' }}>
        <Story />
      </div>
    ],
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByLabelText(/prénom/i), 'Jean')
    await userEvent.type(canvas.getByLabelText(/nom/i), 'Dupont')
    await userEvent.type(canvas.getByLabelText(/email/i), 'jean@example.com')
    await userEvent.selectOptions(canvas.getByLabelText(/sujet/i), 'Nouveau projet')
    await userEvent.type(canvas.getByLabelText(/message/i), 'Bonjour, je souhaite...')
    await userEvent.click(canvas.getByRole('button', { name: /envoyer/i }))
  ),
}

export const WithErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /envoyer/i }))
  },
}
```

## Phase 3: Testing with Storybook

```tsx
// Button.test.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
import { within, userEvent } from '@storybook/testing-library'
import { expect } from '@storybook/jest'

const meta: Meta<typeof Button> = {
  title: 'UI/Button/Tests',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const ClickTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button', { name: /click me/i })

    await userEvent.click(button)
    await expect(button).toHaveBeenCalledTimes(1)
  ),
}

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const button = canvas.getByRole('button')

    await userEvent.tab()
    await expect(button).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(button).toHaveBeenCalledTimes(1)
  ),
}
```

## Phase 4: Chromatic Integration

```bash
# Install Chromatic
npm install --save-dev chromatic

# Run Chromatic
npx chromatic --project-token=<your-token>

# With options
npx chromatic --project-token=<token> --build-script-name=build-storybook --exit-on-changes
```

```yaml
# .github/workflows/chromatic.yml
name: Chromatic
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm chromatic --project-token=${{ secrets.CHROMATIC_TOKEN }}
```

## Chromatic Configuration

```javascript
// chromatic.config.js
module.exports = {
  projectToken: process.env.CHROMATIC_TOKEN,
  buildScriptName: "build-storybook",
  exitOnChanges: true,
  exitZeroOnChanges: false,
  autoAcceptChanges: "main",
  autoAcceptChanges: ["main", "develop"],
  onlyChanged: true,
  diffThreshold: 0.2,
  mode: "full",
  viewport: ["mobile", "tablet", "desktop"],
};
```

## Scripts

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "chromatic": "npx chromatic --project-token=$CHROMATIC_TOKEN",
    "storybook:test": "test-storybook"
  }
}
```

## Best Practices

1. **One story per component state** - Default, loading, error, disabled, etc.
2. **Use `play` functions** - For interaction testing
3. **Use `argTypes`** - For proper controls in Storybook UI
4. **Group related stories** - Use `title` with slashes
5. **Test interactions** - Use `play` functions with `userEvent`
6. **Document props** - Use `argTypes` descriptions
7. **Use decorators** - For theme providers, context providers
8. **Test accessibility** - Use `@storybook/addon-a11y`
9. **Version control** - Commit stories with components
10. **Review in Chromatic** - Visual regression testing
