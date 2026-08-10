---
name: design-principles
description: Anti-generic SaaS design principles. Prevents "looks like every other SaaS" by enforcing signature element, intentional asymmetry, motion with purpose, and content-first hierarchy.
---

# Design Principles — Anti-Generic SaaS

> **Purpose**: Every project gets a **signature design element** — the one thing users remember. No cream backgrounds, no serif-only headings, no generic dashboards.

---

## The Anti-Generic Checklist (All Must Pass)

| Principle             | Generic (Fail)                               | Distinctive (Pass)                                                                                                               |
| --------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Signature Element** | None — looks like Linear/Stripe/Vercel clone | One bold, ownable decision (color slash, motion logo, asymmetric grid, custom illustration style)                                |
| **Color**             | Blue-500 primary, gray neutrals, white bg    | **Custom palette** — at least one non-standard hue (e.g., emerald/amber/violet primary, or dark-mode-first with colored accents) |
| **Typography**        | Inter + system mono, standard scale          | **Display font** for headlines + UI font for body, or intentional monospace hierarchy                                            |
| **Layout**            | Centered 12-col grid, card rows              | **Asymmetric / editorial** — broken grid, overlapping elements, intentional whitespace                                           |
| **Motion**            | Fade-in everything, 200ms ease               | **Motion tier applied** — Minimal (0), Moderate (meaningful), Bold (cinematic). Each animation has a _reason_.                   |
| **Imagery**           | Abstract 3D blobs, undraw illustrations      | **Real photos** (Pexels/Unsplash) or **custom 3D/illustration** with consistent style                                            |
| **Data Display**      | Standard tables, basic charts                | **Opinionated visualization** — sparklines in cards, interactive explorers, narrative dashboards                                 |
| **Empty States**      | "No data yet" + illustration                 | **Actionable guidance** — what to do, why it matters, one-click CTA                                                              |
| **Onboarding**        | Generic tooltip tour                         | **Progressive disclosure** — blank slate → first value → habit formation                                                         |
| **Microcopy**         | "Manage your team", "Get started"            | **Voice with personality** — specific to domain, human, not corporate                                                            |

---

## Signature Element Framework (Pick ONE per project)

| Type                       | Example                                 | Implementation                               |
| -------------------------- | --------------------------------------- | -------------------------------------------- |
| **Color Slash**            | Diagonal brand color cut across hero    | CSS clip-path + gradient, animated on scroll |
| **Motion Logo**            | Logo that reacts to cursor/scroll       | GSAP / Motion One, reduced-motion respect    |
| **Asymmetric Grid**        | Content breaks container, overlaps      | CSS Grid with named lines, negative margins  |
| **Custom Illustration**    | Hand-drawn / 3D style unique to brand   | Figma → SVG → component library              |
| **Data-as-Design**         | Live metrics in hero, animated counters | Real-time Supabase subscriptions + motion    |
| **Typographic Scale**      | Extreme contrast (96px / 14px)          | Clamp fluid type, variable fonts             |
| **Interactive Background** | WebGL/shader responding to input        | Canvas/WebGL, fallback to static             |
| **Component Signature**    | Unique Button/Card/Input style          | Rounded-0, thick borders, inner shadows      |

---

## Motion Tier System (Enforced)

### Minimal (Default)

- **Zero** decorative animation
- Only: focus states, loading spinners, toast slide-in
- `prefers-reduced-motion` = all off

### Moderate (Recommended for SaaS)

- **Meaningful** transitions: page (150ms), modal (200ms), drawer (250ms)
- **Feedback** animations: button press, form validation, toast
- **Progressive** disclosure: accordion, tabs, dropdowns
- Stagger: 50ms max per item

### Bold (Landing pages, marketing)

- **Cinematic**: hero reveal (600ms+), scroll-triggered scenes
- **3D/Parallax**: mouse-follow, scroll velocity
- **Brand choreography**: logo morph, color transitions
- **Must** have `prefers-reduced-motion` static fallback

---

## Content-First Hierarchy (No "Dashboard Syndrome")

| Anti-Pattern               | Fix                                                                   |
| -------------------------- | --------------------------------------------------------------------- |
| 12 KPI cards at top        | **One** north-star metric + 3 supporting                              |
| Sidebar nav 20 items       | Progressive disclosure: primary 5, secondary in "More"                |
| Data tables as default     | Cards → Table (on demand) → Export                                    |
| Generic "Activity Feed"    | Contextual: "Your team's actions" / "Billing events"                  |
| Settings as dumping ground | Grouped by _user intent_: Security, Appearance, Integrations, Billing |

---

## Accessibility = Design Quality (Not Checklist)

- **Color**: 4.5:1 minimum, 7:1 for text — test in Figma + axe
- **Focus**: Visible, branded (not browser default), consistent
- **Motion**: `prefers-reduced-motion` disables ALL non-essential
- **Semantic HTML**: Landmarks, headings, labels — no `div` soup
- **Language**: `lang` attr, RTL support if i18n

---

## Design Token Enforcement (CI Gates)

```bash
# Gate: No hardcoded values
grep -r "#[0-9a-fA-F]\{3,8\}" src/components --include="*.tsx" && exit 1

# Gate: No arbitrary Tailwind values
grep -r "\[.*\]" src/components --include="*.tsx" | grep -v "var(--" && exit 1

# Gate: Semantic tokens used
grep -r "var(--color-" src/components --include="*.tsx" | wc -l  # must be > 0
```

---

## Deliverables (Generated by `design-architect` agent)

1. **`DESIGN-CHOICE.md`** — Decision log: palette, typography, motion tier, signature element
2. **`tokens/`** — Style Dictionary source (core, semantic, themes)
3. **`components/ui/`** — Primitives using tokens only
4. **`DESIGN-AUDIT.md`** — Post-build audit report (gate #14)

---

## Integration in `/ns-ship`

- **Phase 1 Discovery**: Choose design system + motion tier + signature element
- **Phase 3 Design**: Generate tokens + components + Storybook
- **Phase 3.5 Design Check** (NEW): Run `design:check` gate — tokens, inventory, audit
- **Phase 5 Verify**: Gate #14 = `design:check` passes

---

## Quick Reference for Agents

```text
# design-architect prompt
"Conçois le design system pour [B2B SaaS].
Signature element: [Color Slash / Motion Logo / Asymmetric Grid / etc.]
Motion tier: Moderate
Palette: [custom — not blue/gray]
Output: DESIGN-CHOICE.md + tokens/ + components/ui/"
```

```text
# saas-ui-builder prompt
"Implémente les composants ui/ depuis DESIGN-CHOICE.md.
ZÉRO valeurs hardcodées — tokens uniquement.
Motion: Moderate (page 150ms, modal 200ms, stagger 50ms).
Output: components/ui/* + stories + visual baselines"
```
