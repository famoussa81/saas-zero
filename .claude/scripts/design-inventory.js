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
  includePaths: [
    "src/components/**/*.tsx",
    "src/app/**/*.tsx",
    "src/lib/**/*.ts",
  ],
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
        if (excludeRegex.test(file)) {
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

function main() {
  console.log("\n📊 Design Inventory\n");

  // 1. Get component files
  const componentFiles = getFiles(config.includePaths);
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

  // 4. Analyze each component file for token usage
  const fileReports = [];
  let totalComponentsUsingTokens = 0;
  let totalComponents = componentFiles.length;
  const usedTokens = new Set();

  for (const file of componentFiles) {
    const content = fs.readFileSync(file, "utf-8");
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

    const hasTokens = tokensInFile.size > 0;
    if (hasTokens) totalComponentsUsingTokens++;

    fileReports.push({
      path: path.relative(process.cwd(), file),
      tokensUsed: Array.from(tokensInFile).sort(),
      tokenCount: tokensInFile.size,
      hasTokens,
    });
  }

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
