---
name: media-sourcing
description: Source real images for the project via Pexels, Unsplash, or Picsum. Ensures zero placeholder images in production.
---

# Media Sourcing — Pexels / Unsplash / Picsum

> **Purpose**: Replace every gray rectangle with a real photo that fits the brief. No `via.placeholder.com`, no `lorem` images.

## Environment Variables (add to `.env.local`)

```bash
# Pexels — free tier: 200 req/hr, 20,000/mo
PEXELS_API_KEY=

# Unsplash — free tier: 50 req/hr
UNSPLASH_ACCESS_KEY=

# Picsum — no key needed, always available as last resort
# https://picsum.photos/
```

## Installation

```bash
npm i -D axios
```

## Usage (from agents / scripts)

```bash
# Fetch images for a SaaS dashboard
node .claude/scripts/media-fetcher.js \
  --keywords="dashboard,analytics,team,collaboration,finance" \
  --output=public/assets/images \
  --count=12 \
  --theme=saas

# Fetch for a specific page
node .claude/scripts/media-fetcher.js \
  --keywords="hero,saas landing,modern startup" \
  --output=public/assets/images \
  --count=3 \
  --orientation=landscape
```

## Multi-Source Strategy (fallback chain)

| Priority | Source       | Strength                                        | Limit      |
| -------- | ------------ | ----------------------------------------------- | ---------- |
| 1        | **Pexels**   | Best quality/saas relevance, generous free tier | 200 req/hr |
| 2        | **Unsplash** | Beautiful, diverse, good for hero/team          | 50 req/hr  |
| 3        | **Picsum**   | No key, always works, random but usable         | Unlimited  |

**Logic**: Try Pexels first → if rate limited or no results → Unsplash → if rate limited → Picsum → if all fail → **hard error** (do not silently use placeholder).

## Output Structure

```
public/assets/images/
├── dashboard-abc123.jpg
├── team-def456.jpg
├── hero-ghi789.jpg
├── manifest.json        # { filename, alt, width, height, source, photographer, url }
└── attribution.md       # Markdown for legal compliance
```

## Integration in Pipeline

- **Phase 2.5** (post-scaffold, pre-build): auto-fetch based on project type
- **Design Gate**: Fail if `public/assets/images/` missing required images for pages in SPEC.md
- **Attribution**: Auto-injected in footer/component via `manifest.json`

## Attribution Requirements (Legal)

- **Pexels**: "Photo by [Photographer] on Pexels"
- **Unsplash**: "Photo by [Photographer] on Unsplash"
- **Picsum**: "Image from Lorem Picsum"

The script generates `attribution.md` automatically. Include in footer or `/credits` page.
