#!/usr/bin/env node
/**
 * design-inventory.js
 * -------------------
 * Generates complete inventory of design system usage.
 * Outputs component token coverage, token usage efficiency, and file-by-file breakdown.
 *
 * Usage:
 *   node .claude/scripts/design-inventory.js
 *   node .claude/scripts/design-inventory.js --config=.design-auditrc.json --output=inventory.json
 */

const fs = require("node:fs");
const path = require("node:path");
const { globSync } = require("glob");

// --- Configuration -----------------------------------------------------------
const DEFAULT_CONFIG = {
  // Component token coverage only makes sense for files that render JSX —
  // lib/**/*.ts is server logic with no visual output, scanning it here
  // would count non-UI files as "components missing tokens" (a category
  // error). design-tokens-audit.js still scans .ts files separately for
  // stray hardcoded values, which is a different, valid question.
  componentPaths: ["components/**/*.tsx", "app/**/*.tsx"],
  excludePaths: [
    "**/*.stories.tsx",
    "**/*.test.tsx",
    "**/tokens/**",
    "**/build/**",
    "**/*.d.ts",
  ],
  tokenPaths: [
    "tokens/**/*.json",
    "src/lib/design-tokens.ts",
    "src/styles/tokens.css",
    "build/css/variables.css",
  ],
};

let config = { ...DEFAULT_CONFIG };
const configPath = path.resolve(process.cwd(), ".design-auditrc.json");
if (fs.existsSync(configPath)) {
  try {
    config = {
      ...DEFAULT_CONFIG,
      ...JSON.parse(fs.readFileSync(configPath, "utf-8")),
    };
  } catch (e) {
    console.warn(`⚠ Failed to parse .design-auditrc.json: ${e.message}`);
  }
}

// --- Regex Patterns ----------------------------------------------------------

// CSS custom properties (tokens being USED)
const CSS_VAR_USAGE = /var\(--([a-zA-Z0-9-]+)\)/g;

// Tailwind utility classes that tailwind.config.ts wires to CSS custom
// properties (see theme.extend.colors/fontSize/fontWeight/boxShadow/
// borderRadius). Using `bg-primary` IS using the --primary token — same as
// `var(--primary)` would be, just spelled through Tailwind's utility layer.
const COLOR_TOKEN_NAMES = [
  "background",
  "foreground",
  "card",
  "popover",
  "primary",
  "secondary",
  "destructive",
  "muted",
  "accent",
  "border",
  "input",
  "ring",
];
const TAILWIND_COLOR_CLASS = new RegExp(
  `\\b(?:bg|text|border|ring|fill|stroke|accent|caret|decoration|placeholder|outline|divide|from|via|to)-(${COLOR_TOKEN_NAMES.join("|")})(?:-foreground)?\\b`,
  "g",
);
const TAILWIND_FONT_SIZE_CLASS =
  /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;
const TAILWIND_FONT_WEIGHT_CLASS =
  /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g;
const TAILWIND_SHADOW_CLASS = /\bshadow-(sm|md|lg|xl|2xl|inner)\b/g;
const TAILWIND_RADIUS_CLASS = /\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/g;

function findTailwindTokenClasses(content) {
  const found = new Set();
  let m;

  TAILWIND_COLOR_CLASS.lastIndex = 0;
  while ((m = TAILWIND_COLOR_CLASS.exec(content)) !== null) found.add(m[1]);

  TAILWIND_FONT_SIZE_CLASS.lastIndex = 0;
  while ((m = TAILWIND_FONT_SIZE_CLASS.exec(content)) !== null)
    found.add(`font-size-${m[1]}`);

  TAILWIND_FONT_WEIGHT_CLASS.lastIndex = 0;
  while ((m = TAILWIND_FONT_WEIGHT_CLASS.exec(content)) !== null)
    found.add(`font-weight-${m[1]}`);

  TAILWIND_SHADOW_CLASS.lastIndex = 0;
  while ((m = TAILWIND_SHADOW_CLASS.exec(content)) !== null)
    found.add(`shadow-${m[1]}`);

  TAILWIND_RADIUS_CLASS.lastIndex = 0;
  while ((m = TAILWIND_RADIUS_CLASS.exec(content)) !== null) {
    // sm/md/lg map to the base --radius token; xl/2xl/3xl/full have their own
    found.add(["sm", "md", "lg"].includes(m[1]) ? "radius" : `radius-${m[1]}`);
  }

  return found;
}

// Token definitions in JSON (Style Dictionary format)
const TOKEN_DEF = /"([a-zA-Z0-9-]+)":\s*\{\s*"value"/g;

// Token definitions in CSS
const CSS_TOKEN_DEF = /--([a-zA-Z0-9-]+):\s*[^;]+;/g;

// Tailwind config tokens (if using generated config)
const TAILWIND_TOKEN = /(--[a-zA-Z0-9-]+):/g;

// --- Helpers -----------------------------------------------------------------

function getFiles(patterns) {
  const files = new Set();
  for (const pattern of patterns) {
    const matches = globSync(pattern, { absolute: true, nodir: true });
    for (const file of matches) {
      let excluded = false;
      for (const excludePattern of config.excludePaths) {
        const excludeRegex = new RegExp(
          excludePattern.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*"),
        );
        if (excludeRegex.test(file.replace(/\\/g, "/"))) {
          excluded = true;
          break;
        }
      }
      if (!excluded) {
        files.add(file);
      }
    }
  }
  return Array.from(files).sort();
}

function categorizeToken(tokenName) {
  const categories = {
    color: [
      "color",
      "bg",
      "text",
      "border",
      "ring",
      "fill",
      "stroke",
      "accent",
      "caret",
      "decoration",
      "placeholder",
      "outline",
    ],
    spacing: [
      "space",
      "gap",
      "padding",
      "margin",
      "inset",
      "top",
      "right",
      "bottom",
      "left",
      "width",
      "height",
      "size",
    ],
    typography: ["font", "text", "leading", "tracking", "letter", "line"],
    radius: ["radius", "rounded", "corner"],
    shadow: ["shadow", "box-shadow", "elevation"],
    motion: [
      "duration",
      "easing",
      "transition",
      "animation",
      "delay",
      "timing",
    ],
    breakpoint: ["breakpoint", "screen", "container"],
    zIndex: ["z-index", "zindex", "layer"],
  };

  const lower = tokenName.toLowerCase();
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((k) => lower.includes(k))) return cat;
  }
  return "other";
}

function extractTokensFromFile(filepath, patterns) {
  const content = fs.readFileSync(filepath, "utf-8");
  const tokens = new Set();

  for (const pattern of patterns) {
    let match;
    const regex = new RegExp(pattern, "g");
    while ((match = regex.exec(content)) !== null) {
      tokens.add(match[1]);
    }
  }

  return tokens;
}

// --- Main --------------------------------------------------------------------

async function main() {
  console.log("\n📊 Design Inventory\n");

  // 1. Get component files
  const componentFiles = getFiles(config.componentPaths || config.includePaths);
  console.log(`Scanning ${componentFiles.length} component files...`);

  // 2. Get token definition files
  const tokenFiles = getFiles(config.tokenPaths);
  console.log(`Scanning ${tokenFiles.length} token definition files...`);

  // 3. Extract all defined tokens
  const definedTokens = new Map(); // tokenName -> { category, files: [] }
  const tokenDefPatterns = [
    /"([a-zA-Z0-9-]+)":\s*\{\s*"value"/g,
    /--([a-zA-Z0-9-]+):\s*[^;]+;/g,
  ];

  for (const file of tokenFiles) {
    const content = fs.readFileSync(file, "utf-8");
    for (const pattern of tokenDefPatterns) {
      let match;
      const regex = new RegExp(pattern.source, "g");
      while ((match = regex.exec(content)) !== null) {
        const tokenName = match[1];
        if (!definedTokens.has(tokenName)) {
          definedTokens.set(tokenName, {
            category: categorizeToken(tokenName),
            files: [],
          });
        }
        definedTokens
          .get(tokenName)
          .files.push(path.relative(process.cwd(), file));
      }
    }
  }

  console.log(`Found ${definedTokens.size} defined tokens`);

  // 4. Analyze each component file for token usage.
  // Files with no className/style attribute at all render no styled markup
  // of their own (typical for Server Component route wrappers that just
  // check auth/fetch data and delegate to a child component) — "coverage"
  // doesn't apply to them, so they're excluded from both the numerator and
  // the denominator rather than counted as violations.
  const HAS_STYLING_SURFACE = /className\s*=|style\s*=\s*\{/;
  const fileReports = [];
  let totalComponentsUsingTokens = 0;
  let skippedNoStylingSurface = 0;
  const scoredFiles = [];
  const usedTokens = new Set();

  for (const file of componentFiles) {
    const content = fs.readFileSync(file, "utf-8");

    if (!HAS_STYLING_SURFACE.test(content)) {
      skippedNoStylingSurface++;
      fileReports.push({
        path: path.relative(process.cwd(), file),
        tokensUsed: [],
        tokenCount: 0,
        hasTokens: null,
        skipped: "no styling surface (no className/style)",
      });
      continue;
    }
    scoredFiles.push(file);

    const tokensInFile = new Set();

    // Find all var(--token-name) usages
    let match;
    const regex = new RegExp(CSS_VAR_USAGE.source, "g");
    while ((match = regex.exec(content)) !== null) {
      tokensInFile.add(match[1]);
      usedTokens.add(match[1]);
    }

    // Count Tailwind arbitrary values with tokens (var(--...) inside [])
    const arbitraryWithVar = content.match(/\[var\(--[^)]+\)\]/g) || [];
    for (const m of arbitraryWithVar) {
      const tokenMatch = m.match(/var\(--([^)]+)\)/);
      if (tokenMatch) {
        tokensInFile.add(tokenMatch[1]);
        usedTokens.add(tokenMatch[1]);
      }
    }

    // Count Tailwind utility classes backed by tokens via tailwind.config.ts
    for (const tokenName of findTailwindTokenClasses(content)) {
      tokensInFile.add(tokenName);
      usedTokens.add(tokenName);
    }

    const hasTokens = tokensInFile.size > 0;
    if (hasTokens) totalComponentsUsingTokens++;

    fileReports.push({
      path: path.relative(process.cwd(), file),
      tokensUsed: Array.from(tokensInFile).sort(),
      tokenCount: tokensInFile.size,
      hasTokens,
    });
  }

  const totalComponents = scoredFiles.length;

  // 5. Calculate coverage stats
  const componentCoverage =
    totalComponents > 0
      ? Math.round((totalComponentsUsingTokens / totalComponents) * 1000) / 10
      : 100;

  const tokenUsageRatio =
    definedTokens.size > 0 ? usedTokens.size / definedTokens.size : 1;

  const unusedTokens = [];
  for (const [tokenName, info] of definedTokens) {
    if (!usedTokens.has(tokenName)) {
      unusedTokens.push({
        name: tokenName,
        category: info.category,
        definedIn: info.files,
      });
    }
  }

  // 6. By category breakdown
  const byCategory = {};
  for (const [tokenName, info] of definedTokens) {
    if (!byCategory[info.category]) {
      byCategory[info.category] = { defined: 0, used: 0 };
    }
    byCategory[info.category].defined++;
    if (usedTokens.has(tokenName)) {
      byCategory[info.category].used++;
    }
  }

  // 7. Output
  const report = {
    components: {
      total: totalComponents,
      usingTokens: totalComponentsUsingTokens,
      violations: totalComponents - totalComponentsUsingTokens,
      coverage: `${componentCoverage}%`,
      skippedNoStylingSurface,
    },
    tokens: {
      defined: definedTokens.size,
      used: usedTokens.size,
      unused: unusedTokens.length,
      usageRatio: `${Math.round(tokenUsageRatio * 1000) / 10}%`,
    },
    byCategory,
    files: fileReports,
    unusedTokens: unusedTokens.slice(0, 50), // Limit for readability
    timestamp: new Date().toISOString(),
  };

  // Write JSON output
  const outputPath = path.resolve(process.cwd(), "design-inventory.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n📝 Inventory written to ${outputPath}\n`);

  // Console summary
  console.log("=== SUMMARY ===");
  console.log(
    `Components: ${totalComponentsUsingTokens}/${totalComponents} using tokens (${componentCoverage}%)`,
  );
  if (skippedNoStylingSurface > 0) {
    console.log(
      `  (${skippedNoStylingSurface} files skipped — no className/style, no styling surface)`,
    );
  }
  console.log(
    `Tokens: ${usedTokens.size}/${definedTokens.size} used (${Math.round(tokenUsageRatio * 1000) / 10}%)`,
  );
  console.log(`Unused tokens: ${unusedTokens.length}`);

  console.log("\nBy Category:");
  for (const [cat, stats] of Object.entries(byCategory)) {
    const pct =
      stats.defined > 0
        ? Math.round((stats.used / stats.defined) * 1000) / 10
        : 100;
    console.log(`  ${cat}: ${stats.used}/${stats.defined} (${pct}%)`);
  }

  if (unusedTokens.length > 0) {
    console.log("\n⚠ Top unused tokens:");
    for (const t of unusedTokens.slice(0, 10)) {
      console.log(`  --${t.name} (${t.category})`);
    }
    if (unusedTokens.length > 10)
      console.log(`  ... and ${unusedTokens.length - 10} more`);
  }

  console.log("\n✨ Done!\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err.message);
  process.exit(1);
});
