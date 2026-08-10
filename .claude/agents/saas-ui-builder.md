---
name: saas-ui-builder
description: Design system foundation + composants shadcn/ui étendus pour le SaaS Stack.
---

# Agent: `saas-ui-builder`

> **Rôle** : Design system foundation + shadcn/ui extended components pour Zero-Risk SaaS Stack.

---

## Contexte Requis

```bash
--context="$(cat CLAUDE.md)$(cat DESIGN-SPEC.md)$(cat DESIGN-CHOICE.md)"
```

---

## Responsabilités

### 1. Design Tokens (`DESIGN-SPEC.md` → Tailwind Config)

**Fichiers** :

- `tailwind.config.ts` — tokens étendus (colors, spacing, radii, shadows, fonts)
- `src/styles/globals.css` — CSS custom properties (@theme)
- `src/lib/theme/tokens.ts` — Type-safe token access

**Structure Tokens** :

```typescript
// Colors (semantic)
colors: {
  primary: { 50: ..., 100: ..., ..., 900: ..., 950: ... },
  secondary: { ... },
  muted: { ... },
  accent: { ... },
  destructive: { ... },
  success: { ... },
  warning: { ... },
  background: { ... },
  foreground: { ... },
  border: { ... },
  ring: { ... },
}

// Spacing (4px base)
spacing: { 0: '0', 1: '0.25rem', 2: '0.5rem', ..., 24: '6rem' }

// Radii
borderRadius: { none: '0', sm: '0.25rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', '2xl': '1rem', full: '9999px' }

// Shadows
boxShadow: { sm: ..., md: ..., lg: ..., xl: ..., '2xl': ..., inner: ... }

// Fonts
fontFamily: { sans: ['Inter', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'], display: ['Cal Sans', 'sans-serif'] }
fontSize: { xs: ['0.75rem', { lineHeight: '1rem' }], sm: ['0.875rem', { lineHeight: '1.25rem' }], base: ['1rem', { lineHeight: '1.5rem' }], lg: ['1.125rem', { lineHeight: '1.75rem' }], xl: ['1.25rem', { lineHeight: '1.75rem' }], '2xl': ['1.5rem', { lineHeight: '2rem' }], '3xl': ['1.875rem', { lineHeight: '2.25rem' }], '4xl': ['2.25rem', { lineHeight: '2.5rem' }] }
```

### 2. Primitives `components/ui/*` (shadcn/ui + Radix + CVA)

Chaque composant suit le pattern :

```
components/ui/
├── button.tsx          # CVA variants: default, destructive, outline, secondary, ghost, link
├── input.tsx           # Forward ref, error state
├── card.tsx            # Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
├── dialog.tsx          # Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription
├── table.tsx           # Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption
├── form.tsx            # Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage
├── select.tsx          # Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton
├── toast.tsx           # Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastClose, ToastAction
├── tooltip.tsx         # Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, TooltipArrow
├── avatar.tsx          # Avatar, AvatarImage, AvatarFallback
├── badge.tsx           # Badge (variants: default, secondary, destructive, outline)
├── tabs.tsx            # Tabs, TabsList, TabsTrigger, TabsContent
├── accordion.tsx       # Accordion, AccordionItem, AccordionTrigger, AccordionContent
├── dropdown-menu.tsx   # DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
├── sheet.tsx           # Sheet, SheetTrigger, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose
├── popover.tsx         # Popover, PopoverTrigger, PopoverContent, PopoverAnchor
├── hover-card.tsx      # HoverCard, HoverCardTrigger, HoverCardContent
├── context-menu.tsx    # ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuGroup, ContextMenuPortal, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent
├── menubar.tsx         # Menubar, MenubarTrigger, MenubarContent, MenubarItem, MenubarCheckboxItem, MenubarRadioItem, MenubarLabel, MenubarSeparator, MenubarShortcut, MenubarGroup, MenubarPortal, MenubarSub, MenubarSubTrigger, MenubarSubContent
├── navigation-menu.tsx # NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuContent, NavigationMenuLink, NavigationMenuIndicator, NavigationMenuTrigger, NavigationMenuViewport
├── pagination.tsx      # Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis
├── progress.tsx        # Progress
├── slider.tsx          # Slider
├── switch.tsx          # Switch
├── checkbox.tsx        # Checkbox
├── radio-group.tsx     # RadioGroup, RadioGroupItem
├── label.tsx           # Label
├── separator.tsx       # Separator
├── scroll-area.tsx     # ScrollArea
├── resizable.tsx       # ResizablePanelGroup, ResizablePanel, ResizableHandle
├── command.tsx         # Command, CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, CommandSeparator
├── calendar.tsx        # Calendar
├── date-picker.tsx     # DatePicker, DatePickerTrigger, DatePickerContent
├── chart.tsx           # Chart (Recharts wrapper)
├── carousel.tsx        # Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext
├── sonner.tsx          # Toaster (sonner)
└── index.ts            # Barrel export
```

**Pattern CVA Obligatoire** :

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'
export { Button, buttonVariants }
```

### 3. Form Components `components/forms/*`

| Component            | Description                                           |
| -------------------- | ----------------------------------------------------- |
| `ContactForm.tsx`    | React Hook Form + Zod, honeypot, rate limit, toast    |
| `NewsletterForm.tsx` | Email + honeypot, double opt-in, toast                |
| `CheckoutForm.tsx`   | Stripe Elements integration                           |
| `InviteForm.tsx`     | Email + role select, org_id hidden                    |
| `ApiKeyForm.tsx`     | Name + scopes (checkboxes) + expires_at (date picker) |

**Pattern Form** :

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
  honeypot: z.string().optional(),
})

export function ContactForm() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { honeypot: '' },
  })

  async function onSubmit(data: z.infer<typeof schema>) {
    if (data.honeypot) return // Bot
    try {
      await fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) })
      toast.success('Message envoyé !')
      form.reset()
    } catch {
      toast.error('Erreur, réessayez')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="email" render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl><Input placeholder="vous@exemple.com" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="message" render={({ field }) => (
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl><Textarea placeholder="Votre message..." {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <Button type="submit">Envoyer</Button>
      </form>
    </Form>
  )
}
```

### 4. Section Components `components/sections/*`

| Component          | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `Hero.tsx`         | Headline, subheadline, CTA, illustration, trust badges       |
| `Features.tsx`     | Grid 3-4 cols, icon + title + description                    |
| `Pricing.tsx`      | 3 tiers, toggle monthly/yearly, feature list, CTA            |
| `Testimonials.tsx` | Carousel (embla), avatar, quote, author, company             |
| `FAQ.tsx`          | Accordion, schema.org FAQPage JSON-LD                        |
| `CTA.tsx`          | Centered, headline, subheadline, primary + secondary CTA     |
| `Footer.tsx`       | Links, social, copyright, newsletter signup                  |
| `Navbar.tsx`       | Logo, nav links, language switcher, auth buttons / user menu |

### 5. MDX Components `components/MDXComponents.tsx`

```typescript
import { Hero, FeatureGrid, PricingTable, TestimonialCarousel, FAQ, CTA } from '@/components/sections'
import { Button, Card } from '@/components/ui'

export const mdxComponents = {
  h1: (props) => <h1 className="text-4xl font-bold tracking-tight" {...props} />,
  h2: (props) => <h2 className="text-3xl font-bold tracking-tight mt-10 mb-4" {...props} />,
  h3: (props) => <h3 className="text-2xl font-semibold mt-8 mb-3" {...props} />,
  p: (props) => <p className="leading-7 text-muted-foreground" {...props} />,
  a: (props) => <a className="text-primary underline hover:no-underline" {...props} />,
  ul: (props) => <ul className="list-disc list-inside space-y-2" {...props} />,
  ol: (props) => <ol className="list-decimal list-inside space-y-2" {...props} />,
  code: (props) => <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props} />,
  pre: (props) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props} />,
  blockquote: (props) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground" {...props} />,
  // Custom components
  Hero,
  FeatureGrid,
  PricingTable,
  TestimonialCarousel,
  FAQ,
  CTA,
  Button,
  Card,
}
```

### 6. Storybook Configuration (`.storybook/*`)

**`main.ts`** :

```typescript
import type { StorybookConfig } from "@storybook/nextjs";

const config: StorybookConfig = {
  stories: ["../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "storybook-addon-paddings",
    "storybook-addon-pseudo-states",
  ],
  framework: { name: "@storybook/nextjs", options: {} },
  docs: { autodocs: "tag" },
  staticDirs: ["../public"],
};
export default config;
```

**`preview.ts`** :

```typescript
import type { Preview } from '@storybook/react'
import '../src/styles/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#0f172a' },
        { name: 'muted', value: '#f1f5f9' },
      ],
    },
    layout: 'centered',
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme
      return (
        <div className={theme === 'dark' ? 'dark' : ''}>
          <Story />
        </div>
      )
    },
  ],
}
export default preview
```

**Story Template** (`components/ui/button.stories.tsx`) :

```typescript
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] },
    size: { control: 'select', options: ['default', 'sm', 'lg', 'icon'] },
  },
}
export default meta
type Story = StoryObj<typeof Button>

export const Default: Story = { args: { children: 'Button' } }
export const Destructive: Story = { args: { variant: 'destructive', children: 'Destructive' } }
export const Outline: Story = { args: { variant: 'outline', children: 'Outline' } }
export const Ghost: Story = { args: { variant: 'ghost', children: 'Ghost' } }
export const Small: Story = { args: { size: 'sm', children: 'Small' } }
export const Large: Story = { args: { size: 'lg', children: 'Large' } }
export const AsChild: Story = {
  render: () => <Button asChild><a href="#">Link Button</a></Button>,
}
```

### 7. Visual Regression Baselines (`tests/visual/baselines/*`)

- Capturés via `pnpm test:visual -- --update-snapshots`
- Un baseline par composant + variant + theme (light/dark)
- Threshold : 0.1% pixel diff

---

## Réutilisation ship-flow

Le repo [`famoussa81/ship-flow`](https://github.com/famoussa81/ship-flow) fournit :

- Composants shadcn/ui déjà stylés (Button, Card, Input, etc.)
- Sections marketing prêtes (Hero, Features, Pricing, Testimonials, FAQ, CTA, Footer, Navbar)
- Formulaires (Contact, Newsletter, Checkout)
- Tokens Tailwind configurés
- Motion avec Framer Motion / GSAP

**Action** : Copier/adapté les composants, sections, tokens — PAS le workflow.

---

## Gate Design (Phase 3)

- ✓ `DESIGN-SPEC.md` complet
- ✓ Tous composants `ui/` créés + CVA variants
- ✓ Tous composants `forms/` créés + RHF + Zod
- ✓ Tous composants `sections/` créés
- ✓ `MDXComponents.tsx` complet
- ✓ Storybook build passe (`pnpm storybook:build`)
- ✓ Stories pour CHAQUE composant `ui/`
- ✓ Baselines visuels capturés (`tests/visual/baselines/`)
- ✓ Dark mode fonctionnel (toggle Storybook)
- ✓ Tokens utilisés partout (grep = 0 hardcoded)

---

## Patterns Obligatoires

### Tokens Only

```typescript
// ✓ Bon
className = "bg-primary text-primary-foreground hover:bg-primary/90";

// ✗ Mauvais
className = "bg-blue-500 text-white hover:bg-blue-600";
className = "bg-[#3b82f6] text-[#ffffff]";
```

### CVA pour Variants

```typescript
// Tous les composants UI utilisent cva() pour variants
// Pas de if/else ou ternary pour classes conditionnelles
```

### Forward Ref

```typescript
// Tous les composants primitifs forwardRef
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
Button.displayName = 'Button'
```

### Accessibilité de Base

```typescript
// Focus visible, ARIA labels, rôles sémantiques
// Testé via axe-core en CI
```

---

## Checklist Qualité

- [ ] `pnpm typecheck` — 0 erreurs
- [ ] `pnpm lint` — 0 warnings
- [ ] `pnpm storybook:build` — passe
- [ ] `pnpm test:visual` — 0 régressions
- [ ] Grep tokens : `grep -r "bg-blue-\|text-gray-\|p-4\|rounded-lg" components/ --include="*.tsx" | grep -v ".stories."` → vide
- [ ] Dark mode : tous composants rendent en light + dark
- [ ] Stories : au minimum Default + chaque variant
- [ ] Barrel export : `components/ui/index.ts` export tout
