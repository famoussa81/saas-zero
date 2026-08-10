#!/usr/bin/env node
/**
 * design-tokens-audit.js
 * ----------------------
 * Detects hardcoded design values in components.
 * Fails if ANY hardcoded color, spacing, radius, shadow, or typography value is found.
 *
 * Usage:
 *   node .claude/scripts/design-tokens-audit.js
 *   node .claude/scripts/design-tokens-audit.js --config=.design-auditrc.json
 */

const fs = require("node:fs");
const path = require("node:path");
const { globSync } = require("glob");

// --- Configuration -----------------------------------------------------------
const DEFAULT_CONFIG = {
  minComponentTokenCoverage: 90,
  maxUnusedTokenRatio: 0.5,
  failOnHardcodedValues: true,
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
  allowedHardcoded: [
    "transparent",
    "currentColor",
    "inherit",
    "initial",
    "unset",
  ],
};

let config = { ...DEFAULT_CONFIG };

// Load config file if exists
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

// Hex colors: #abc, #abcdef, #aabbccdd (3, 6, 8 chars)
const HEX_COLOR = /#[0-9a-fA-F]{3,8}\b/g;

// RGB/RGBA colors
const RGB_COLOR = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)/g;

// Arbitrary Tailwind values: bg-[#abc], p-[12px], rounded-[8px], text-[#fff]
const ARBITRARY_TAILWIND =
  /(bg|text|border|ring|fill|stroke|shadow|outline|ring|divide|accent|caret|decoration|shadow|shadow|shadow|shadow|placeholder|placeholder|placeholder)-\[([^\]]+)\]/g;

// Hardcoded Tailwind spacing (px-4, py-2, m-4, etc.) - but we allow if using tokens
// We detect: p-4, px-4, py-4, m-4, mx-4, my-4, mt-4, mb-4, ml-4, mr-4,
//            space-x-4, space-y-4, gap-4, gap-x-4, gap-y-4
const TAILWIND_SPACING =
  /\b(p|px|py|ps|pe|m|mx|my|ms|me|mt|mr|mb|ml|space-x|space-y|gap|gap-x|gap-y)-(\d+(\.\d+)?)\b/g;

// Hardcoded Tailwind radius: rounded-lg, rounded-xl, rounded-2xl, rounded-full
const TAILWIND_RADIUS = /\brounded-(none|sm|md|lg|xl|2xl|3xl|full)\b/g;

// Hardcoded Tailwind shadows: shadow-sm, shadow-md, shadow-lg, shadow-xl, shadow-2xl, shadow-inner
const TAILWIND_SHADOW = /\bshadow-(sm|md|lg|xl|2xl|inner)\b/g;

// Hardcoded Tailwind font sizes: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl, text-4xl, text-5xl, text-6xl, text-7xl, text-8xl, text-9xl
const TAILWIND_FONT_SIZE =
  /\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;

// Hardcoded Tailwind font weights: font-thin, font-extralight, font-light, font-normal, font-medium, font-semibold, font-bold, font-extrabold, font-black
const TAILWIND_FONT_WEIGHT =
  /\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g;

// CSS custom properties (these are GOOD - tokens)
const CSS_VAR = /var\(--[a-zA-Z0-9-]+\)/g;

// --- Helpers -----------------------------------------------------------------

function getFiles() {
  const files = new Set();

  for (const pattern of config.includePaths) {
    const matches = globSync(pattern, { absolute: true, nodir: true });
    for (const file of matches) {
      // Check exclude patterns
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

function isAllowed(value) {
  return config.allowedHardcoded.some((allowed) =>
    value.toLowerCase().includes(allowed.toLowerCase()),
  );
}

function analyzeFile(filepath) {
  const content = fs.readFileSync(filepath, "utf-8");
  const lines = content.split("\n");

  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip lines that are comments or imports
    const trimmed = line.trimStart();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("import") ||
      trimmed.startsWith("export")
    ) {
      continue;
    }

    // Check for hex colors
    let match;
    while ((match = HEX_COLOR.exec(line)) !== null) {
      if (!isAllowed(match[0])) {
        violations.push({
          file: filepath,
          line: lineNum,
          column: match.index + 1,
          type: "hex-color",
          value: match[0],
          context: line.trim(),
        });
      }
    }

    // Check for RGB colors
    while ((match = RGB_COLOR.exec(line)) !== null) {
      if (!isAllowed(match[0])) {
        violations.push({
          file: filepath,
          line: lineNum,
          column: match.index + 1,
          type: "rgb-color",
          value: match[0],
          context: line.trim(),
        });
      }
    }

    // Check for arbitrary Tailwind values (but allow CSS vars inside)
    while ((match = ARBITRARY_TAILWIND.exec(line)) !== null) {
      const value = match[2];
      if (!value.includes("var(--") && !isAllowed(value)) {
        violations.push({
          file: filepath,
          line: lineNum,
          column: match.index + 1,
          type: "arbitrary-tailwind",
          value: match[0],
          context: line.trim(),
        });
      }
    }

    // Check for hardcoded Tailwind spacing
    while ((match = TAILWIND_SPACING.exec(line)) !== null) {
      violations.push({
        file: filepath,
        line: lineNum,
        column: match.index + 1,
        type: "tailwind-spacing",
        value: match[0],
        context: line.trim(),
        suggestion: `Use var(--space-${match[2]}) or Tailwind config token`,
      });
    }

    // Check for hardcoded Tailwind radius
    while ((match = TAILWIND_RADIUS.exec(line)) !== null) {
      violations.push({
        file: filepath,
        line: lineNum,
        column: match.index + 1,
        type: "tailwind-radius",
        value: match[0],
        context: line.trim(),
        suggestion: `Use var(--radius-${match[1]}) or rounded-[var(--radius-md)]`,
      });
    }

    // Check for hardcoded Tailwind shadows
    while ((match = TAILWIND_SHADOW.exec(line)) !== null) {
      violations.push({
        file: filepath,
        line: lineNum,
        column: match.index + 1,
        type: "tailwind-shadow",
        value: match[0],
        context: line.trim(),
        suggestion: `Use var(--shadow-${match[1]}) or shadow-[var(--shadow-md)]`,
      });
    }

    // Check for hardcoded Tailwind font sizes
    while ((match = TAILWIND_FONT_SIZE.exec(line)) !== null) {
      violations.push({
        file: filepath,
        line: lineNum,
        column: match.index + 1,
        type: "tailwind-font-size",
        value: match[0],
        context: line.trim(),
        suggestion: `Use var(--font-size-${match[1]}) or text-[var(--font-size-lg)]`,
      });
    }

    // Check for hardcoded Tailwind font weights
    while ((match = TAILWIND_FONT_WEIGHT.exec(line)) !== null) {
      violations.push({
        file: filepath,
        line: lineNum,
        column: match.index + 1,
        type: "tailwind-font-weight",
        value: match[0],
        context: line.trim(),
        suggestion: `Use var(--font-weight-${match[1]}) or font-[var(--font-weight-medium)]`,
      });
    }
  }

  return violations;
}

// --- Main --------------------------------------------------------------------

function main() {
  console.log("\n🔍 Design Tokens Audit\n");

  const files = getFiles();
  console.log(`Scanning ${files.length} files...\n`);

  let totalViolations = 0;
  const filesWithViolations = new Set();
  const allViolations = [];

  for (const file of files) {
    const violations = analyzeFile(file);
    if (violations.length > 0) {
      filesWithViolations.add(file);
      totalViolations += violations.length;
      allViolations.push(...violations);
    }
  }

  // Output results
  if (totalViolations === 0) {
    console.log("✅ No hardcoded design values found!\n");
    // Write empty report for CI
    fs.writeFileSync(
      path.resolve(process.cwd(), "design-tokens-audit.json"),
      JSON.stringify(
        {
          violations: [],
          filesScanned: files.length,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    process.exit(0);
  }

  console.log(
    `❌ Found ${totalViolations} violations in ${filesWithViolations.size} files:\n`,
  );

  // Group by file
  const byFile = {};
  for (const v of allViolations) {
    if (!byFile[v.file]) byFile[v.file] = [];
    byFile[v.file].push(v);
  }

  for (const [file, violations] of Object.entries(byFile)) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`  📄 ${relPath} (${violations.length})`);
    for (const v of violations.slice(0, 10)) {
      // Show first 10 per file
      console.log(`     Line ${v.line}:${v.column} — ${v.type}: ${v.value}`);
      if (v.suggestion) console.log(`       💡 ${v.suggestion}`);
      console.log(`       ${v.context}`);
    }
    if (violations.length > 10) {
      console.log(`     ... and ${violations.length - 10} more`);
    }
    console.log("");
  }

  // Write detailed report
  const report = {
    violations: allViolations,
    summary: {
      totalViolations,
      filesWithViolations: filesWithViolations.size,
      filesScanned: files.length,
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.resolve(process.cwd(), "design-tokens-audit.json"),
    JSON.stringify(report, null, 2),
  );

  console.log(`📝 Report written to design-tokens-audit.json\n`);

  if (config.failOnHardcodedValues) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err.message);
  process.exit(1);
});
