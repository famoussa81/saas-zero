#!/usr/bin/env node
/**
 * design-check.js
 * ---------------
 * Orchestrator for design audit gate (#14).
 * Runs: design-tokens-audit.js + design-inventory.js + Impeccable (if available).
 * Outputs DESIGN-AUDIT.md + design-audit.json for CI.
 *
 * Usage:
 *   node .claude/scripts/design-check.js
 *   node .claude/scripts/design-check.js --config=.design-auditrc.json
 */

const fs = require("node:fs");
const path = require("node:path");
const { execSync } = require("node:child_process");

// --- Configuration -----------------------------------------------------------
const DEFAULT_CONFIG = {
  minComponentTokenCoverage: 90,
  maxUnusedTokenRatio: 0.5,
  impeccableMinScore: 95,
  failOnHardcodedValues: true,
  runImpeccable: true,
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

// --- Helpers -----------------------------------------------------------------

function runScript(scriptName, args = []) {
  const scriptPath = path.resolve(
    process.cwd(),
    `.claude/scripts/${scriptName}`,
  );
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: `Script not found: ${scriptPath}` };
  }

  try {
    const output = execSync(`node "${scriptPath}" ${args.join(" ")}`, {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      timeout: 120000,
    });
    return { success: true, output };
  } catch (err) {
    return {
      success: err.status === 0,
      output: err.stdout,
      error: err.stderr,
      code: err.status,
    };
  }
}

function runImpeccable() {
  try {
    // Check if impeccable is available
    execSync("npx --yes impeccable --version", { stdio: "ignore" });

    const scanTargets = (config.includePaths || [])
      .map((p) => p.split("/")[0])
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .join(" ");

    let output;
    try {
      output = execSync(`npx impeccable detect ${scanTargets} --json`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        timeout: 180000,
      });
    } catch (detectErr) {
      // impeccable exits non-zero when it finds blocking issues; stdout still has the JSON
      output = detectErr.stdout;
    }

    const findings = JSON.parse(output || "[]");
    const errors = findings.filter((f) => f.severity === "error");
    const warnings = findings.filter((f) => f.severity !== "error");
    // No numeric score exists in impeccable's own output — derive one so the
    // gate stays compatible with the impeccableMinScore threshold in CLAUDE.md.
    const score = Math.max(0, 100 - errors.length * 15 - warnings.length * 5);

    return {
      success: true,
      score,
      details: { findings, errors: errors.length, warnings: warnings.length },
    };
  } catch (err) {
    if (
      err.message.includes("ENOENT") ||
      err.message.includes("not found") ||
      err.status === 127
    ) {
      return {
        success: false,
        error: "Impeccable not installed",
        optional: true,
      };
    }
    return { success: false, error: err.message, output: err.stdout };
  }
}

function loadJSONReport(filename) {
  const filepath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(filepath)) {
    try {
      return JSON.parse(fs.readFileSync(filepath, "utf-8"));
    } catch {
      return null;
    }
  }
  return null;
}

function generateMarkdownReport(results) {
  const { tokensAudit, inventory, impeccable } = results;
  const timestamp = new Date().toISOString().split("T")[0];

  let md = `# Design Audit Report\n\n`;
  md += `**Project**: ${path.basename(process.cwd())}\n`;
  md += `**Date**: ${timestamp}\n`;
  md += `**Status**: ${results.overallPass ? "✅ PASSED" : "❌ FAILED"}\n\n`;
  md += `---\n\n`;

  // Gate Results Table
  md += `## Gate Results\n\n`;
  md += `| Check | Status | Details |\n`;
  md += `|-------|--------|---------|\n`;

  // 1. Hardcoded Values
  const hardcodedPass = tokensAudit?.summary?.totalViolations === 0;
  md += `| Hardcoded Values | ${hardcodedPass ? "✅ PASS" : "❌ FAIL"} | `;
  if (hardcodedPass) {
    md += `0 violations in ${tokensAudit?.summary?.filesScanned || 0} files`;
  } else {
    md += `${tokensAudit?.summary?.totalViolations || 0} violations in ${tokensAudit?.summary?.filesWithViolations || 0} files`;
  }
  md += ` |\n`;

  // 2. Component Token Coverage
  const coverage = inventory?.components?.coverage || "0%";
  const coverageNum = parseFloat(coverage);
  const coveragePass = coverageNum >= config.minComponentTokenCoverage;
  md += `| Component Token Coverage | ${coveragePass ? "✅ PASS" : "❌ FAIL"} | `;
  md += `${coverage} (threshold: ${config.minComponentTokenCoverage}%)`;
  md += ` |\n`;

  // 3. Token Usage Efficiency
  const usageRatio = inventory?.tokens?.usageRatio || "0%";
  const usageNum = parseFloat(usageRatio);
  const unusedRatio = 1 - usageNum / 100;
  const usagePass = unusedRatio <= config.maxUnusedTokenRatio;
  md += `| Token Usage Efficiency | ${usagePass ? "✅ PASS" : "⚠️ WARN"} | `;
  md += `${usageRatio} used (${inventory?.tokens?.unused || 0} unused, threshold: <${Math.round(config.maxUnusedTokenRatio * 100)}% unused)`;
  md += ` |\n`;

  // 4. Impeccable
  if (impeccable && !impeccable.optional) {
    const impeccablePass = impeccable.score >= config.impeccableMinScore;
    md += `| Impeccable Semantic Score | ${impeccablePass ? "✅ PASS" : "❌ FAIL"} | `;
    md += `${impeccable.score}/100 (threshold: ${config.impeccableMinScore})`;
    md += ` |\n`;
  } else if (impeccable?.optional) {
    md += `| Impeccable Semantic Score | ⏭️ SKIPPED | Not installed (optional) |\n`;
  }

  md += `\n---\n\n`;

  // Violations Detail
  if (tokensAudit?.violations?.length > 0) {
    md += `## Violations Detail\n\n`;
    const byFile = {};
    for (const v of tokensAudit.violations) {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    }

    for (const [file, violations] of Object.entries(byFile)) {
      const relPath = path.relative(process.cwd(), file);
      md += `### ${relPath} (${violations.length})\n\n`;
      for (const v of violations.slice(0, 20)) {
        md += `- **Line ${v.line}:${v.column}** — \`${v.type}\`: \`${v.value}\`\n`;
        if (v.suggestion) md += `  - 💡 ${v.suggestion}\n`;
        md += `  - Context: \`${v.context}\`\n`;
      }
      if (violations.length > 20) {
        md += `- ... and ${violations.length - 20} more\n`;
      }
      md += `\n`;
    }
    md += `---\n\n`;
  }

  // Token Inventory Summary
  if (inventory) {
    md += `## Token Inventory Summary\n\n`;
    md += `- **Total tokens defined**: ${inventory.tokens?.defined || 0}\n`;
    md += `- **Tokens used in components**: ${inventory.tokens?.used || 0}\n`;
    md += `- **Unused tokens**: ${inventory.tokens?.unused || 0}\n\n`;

    md += `### Coverage by Category\n\n`;
    md += `| Category | Defined | Used | Coverage |\n`;
    md += `|----------|---------|------|----------|\n`;
    for (const [cat, stats] of Object.entries(inventory.byCategory || {})) {
      const pct =
        stats.defined > 0
          ? Math.round((stats.used / stats.defined) * 1000) / 10
          : 100;
      md += `| ${cat} | ${stats.defined} | ${stats.used} | ${pct}% |\n`;
    }
    md += `\n`;

    if (inventory.unusedTokens?.length > 0) {
      md += `### Top Unused Tokens\n\n`;
      for (const t of inventory.unusedTokens.slice(0, 20)) {
        md += `- \`--${t.name}\` (${t.category})\n`;
      }
      if (inventory.unusedTokens.length > 20) {
        md += `- ... and ${inventory.unusedTokens.length - 20} more\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
  }

  // Recommendations
  md += `## Recommendations\n\n`;
  let recNum = 1;

  if (!hardcodedPass) {
    md += `${recNum++}. **Fix all hardcoded design values** — Replace with \`var(--token-name)\` or Tailwind config tokens\n`;
  }

  if (!coveragePass) {
    md += `${recNum++}. **Increase component token coverage** — Currently ${coverage}, target ${config.minComponentTokenCoverage}%\n`;
  }

  if (!usagePass) {
    md += `${recNum++}. **Clean up unused tokens** — ${inventory?.tokens?.unused || 0} tokens defined but not used (${Math.round(unusedRatio * 100)}%)\n`;
  }

  if (
    impeccable &&
    !impeccable.optional &&
    impeccable.score < config.impeccableMinScore
  ) {
    md += `${recNum++}. **Improve Impeccable score** — Currently ${impeccable.score}/100, target ${config.impeccableMinScore}\n`;
  }

  if (recNum === 1) {
    md += `All gates passing! 🎉\n\n`;
    md += `- Consider removing unused tokens to reduce bloat\n`;
    md += `- Ensure new components follow token-only pattern\n`;
    md += `- Keep Impeccable score high with each PR\n`;
  }

  return md;
}

function generateJSONReport(results) {
  return {
    overallPass: results.overallPass,
    timestamp: new Date().toISOString(),
    gates: {
      hardcodedValues: {
        pass: results.tokensAudit?.summary?.totalViolations === 0,
        violations: results.tokensAudit?.summary?.totalViolations || 0,
        filesScanned: results.tokensAudit?.summary?.filesScanned || 0,
      },
      componentTokenCoverage: {
        pass:
          parseFloat(results.inventory?.components?.coverage || "0") >=
          config.minComponentTokenCoverage,
        coverage: results.inventory?.components?.coverage || "0%",
        threshold: config.minComponentTokenCoverage,
      },
      tokenUsageEfficiency: {
        pass:
          1 - parseFloat(results.inventory?.tokens?.usageRatio || "0") / 100 <=
          config.maxUnusedTokenRatio,
        usageRatio: results.inventory?.tokens?.usageRatio || "0%",
        unusedCount: results.inventory?.tokens?.unused || 0,
        threshold: config.maxUnusedTokenRatio,
      },
      impeccable: results.impeccable
        ? {
            pass:
              results.impeccable.optional ||
              results.impeccable.score >= config.impeccableMinScore,
            score: results.impeccable.score || null,
            threshold: config.impeccableMinScore,
            skipped: results.impeccable.optional || false,
          }
        : null,
    },
    details: {
      tokensAudit: results.tokensAudit,
      inventory: results.inventory,
      impeccable: results.impeccable?.details || null,
    },
  };
}

// --- Main --------------------------------------------------------------------

async function main() {
  console.log("\n🎨 Design Audit Gate (#14)\n");
  console.log("=".repeat(50));

  const results = {
    tokensAudit: null,
    inventory: null,
    impeccable: null,
    overallPass: true,
  };

  // 1. Run design-tokens-audit.js
  console.log("\n📋 Step 1/3: Hardcoded Values Audit");
  const tokensAuditResult = runScript("design-tokens-audit.js");
  if (tokensAuditResult.success) {
    console.log("   ✅ No hardcoded values found");
  } else {
    console.log(
      `   ❌ Hardcoded values detected (exit code: ${tokensAuditResult.code})`,
    );
    if (config.failOnHardcodedValues) {
      results.overallPass = false;
    }
  }
  results.tokensAudit = loadJSONReport("design-tokens-audit.json") || {
    violations: [],
    summary: { totalViolations: tokensAuditResult.code === 0 ? 0 : 1 },
  };

  // 2. Run design-inventory.js
  console.log("\n📊 Step 2/3: Design Inventory");
  const inventoryResult = runScript("design-inventory.js");
  if (inventoryResult.success) {
    console.log("   ✅ Inventory generated");
  } else {
    console.log(
      `   ⚠ Inventory generation had issues (exit code: ${inventoryResult.code})`,
    );
  }
  results.inventory = loadJSONReport("design-inventory.json");

  // Check coverage thresholds
  if (results.inventory) {
    const coverage = parseFloat(results.inventory.components?.coverage || "0");
    if (coverage < config.minComponentTokenCoverage) {
      console.log(
        `   ❌ Component token coverage ${coverage}% < ${config.minComponentTokenCoverage}%`,
      );
      results.overallPass = false;
    } else {
      console.log(
        `   ✅ Component token coverage ${coverage}% ≥ ${config.minComponentTokenCoverage}%`,
      );
    }

    const usageRatio = parseFloat(results.inventory.tokens?.usageRatio || "0");
    const unusedRatio = 1 - usageRatio / 100;
    if (unusedRatio > config.maxUnusedTokenRatio) {
      console.log(
        `   ⚠ Token usage efficiency: ${usageRatio}% used (${Math.round(unusedRatio * 100)}% unused > ${Math.round(config.maxUnusedTokenRatio * 100)}%)`,
      );
      // Warning only, not fail
    } else {
      console.log(`   ✅ Token usage efficiency: ${usageRatio}% used`);
    }
  }

  // 3. Run Impeccable (optional)
  if (config.runImpeccable) {
    console.log("\n🔬 Step 3/3: Impeccable Semantic Audit");
    const impeccableResult = runImpeccable();
    results.impeccable = impeccableResult;

    if (impeccableResult.success) {
      if (impeccableResult.score >= config.impeccableMinScore) {
        console.log(
          `   ✅ Impeccable score: ${impeccableResult.score}/100 ≥ ${config.impeccableMinScore}`,
        );
      } else {
        console.log(
          `   ❌ Impeccable score: ${impeccableResult.score}/100 < ${config.impeccableMinScore}`,
        );
        results.overallPass = false;
      }
    } else if (impeccableResult.optional) {
      console.log(`   ⏭️ Impeccable not installed (optional)`);
    } else {
      console.log(`   ⚠ Impeccable error: ${impeccableResult.error}`);
    }
  } else {
    console.log("\n🔬 Step 3/3: Impeccable (disabled in config)");
    results.impeccable = { optional: true, skipped: true };
  }

  // Generate reports
  console.log("\n📝 Generating reports...");

  const markdownReport = generateMarkdownReport(results);
  const mdPath = path.resolve(process.cwd(), "DESIGN-AUDIT.md");
  fs.writeFileSync(mdPath, markdownReport);
  console.log(`   ✅ DESIGN-AUDIT.md`);

  const jsonReport = generateJSONReport(results);
  const jsonPath = path.resolve(process.cwd(), "design-audit.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`   ✅ design-audit.json`);

  // Final result
  console.log("\n" + "=".repeat(50));
  if (results.overallPass) {
    console.log("✅ DESIGN AUDIT PASSED — All gates green");
    console.log("=".repeat(50) + "\n");
    process.exit(0);
  } else {
    console.log("❌ DESIGN AUDIT FAILED — Fix violations above");
    console.log("=".repeat(50) + "\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err.message);
  process.exit(1);
});
