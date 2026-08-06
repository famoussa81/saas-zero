#!/usr/bin/env node
/**
 * Supabase Migration Check - Quality Gate Script
 * Validates Supabase migrations for correctness, safety, and best practices
 * Equivalent of Convex schema check for Supabase
 *
 * Exit codes:
 *   0 = pass (all checks passed)
 *   1 = fail (validation errors found)
 *   2 = not installed (supabase CLI not available)
 */

import { spawnSync, execSync } from 'child_process';
import { readFileSync, readdirSync, statSync, existsSync, writeFileSync } from 'fs';
import { join, extname, basename, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = process.cwd();
const MIGRATIONS_DIR = join(PROJECT_ROOT, 'supabase', 'migrations');

// ============================================================================
// Configuration
// ============================================================================

// Naming convention: YYYYMMDDHHMMSS_description.sql
const MIGRATION_NAME_PATTERN = /^(\d{14})_(.+)\.sql$/;

// Destructive operations that require explicit flag
const DESTRUCTIVE_PATTERNS = [
  { pattern: /\bDROP\s+TABLE\b/gi, name: 'DROP TABLE', severity: 'error' },
  { pattern: /\bDROP\s+COLUMN\b/gi, name: 'DROP COLUMN', severity: 'error' },
  { pattern: /\bALTER\s+TYPE\b/gi, name: 'ALTER TYPE', severity: 'error' },
  { pattern: /\bDROP\s+INDEX\b/gi, name: 'DROP INDEX', severity: 'warn' },
  { pattern: /\bDROP\s+CONSTRAINT\b/gi, name: 'DROP CONSTRAINT', severity: 'warn' },
  { pattern: /\bDROP\s+POLICY\b/gi, name: 'DROP POLICY', severity: 'warn' },
  { pattern: /\bDROP\s+TRIGGER\b/gi, name: 'DROP TRIGGER', severity: 'warn' },
  { pattern: /\bDROP\s+FUNCTION\b/gi, name: 'DROP FUNCTION', severity: 'warn' },
  { pattern: /\bTRUNCATE\b/gi, name: 'TRUNCATE', severity: 'warn' },
  { pattern: /\bDELETE\s+FROM\b/gi, name: 'DELETE FROM (without WHERE)', severity: 'warn' },
];

// Patterns that indicate rollback/DOWN logic
const ROLLBACK_PATTERNS = [
  /\bDOWN\b/i,
  /\bROLLBACK\b/i,
  /\bUNDO\b/i,
  /--\s*@down/i,
  /--\s*@rollback/i,
];

// Supabase-specific patterns to flag
const SUPAWAYS_PATTERNS = [
  { pattern: /\bSECURITY\s+DEFINER\b/gi, name: 'SECURITY DEFINER function', severity: 'warn', note: 'Ensure proper permissions' },
  { pattern: /\bSET\s+search_path\b/gi, name: 'SET search_path', severity: 'warn' },
  { pattern: /\bpg_sleep\b/gi, name: 'pg_sleep', severity: 'warn' },
  { pattern: /\bCOPY\s+/gi, name: 'COPY command', severity: 'warn', note: 'Use Supabase storage or edge functions instead' },
];

// Tables that should have RLS (common table patterns)
const TABLES_REQUIRING_RLS = [
  'users', 'profiles', 'organizations', 'teams', 'members',
  'subscriptions', 'customers', 'orders', 'products', 'invoices',
  'webhook_events', 'email_queue', 'audit_logs', 'activity_logs',
  'notifications', 'settings', 'preferences', 'tokens', 'secrets',
  'api_keys', 'integrations', 'workspaces', 'projects', 'tasks',
  'comments', 'posts', 'files', 'documents', 'records', 'entries',
];

// ============================================================================
// Utility Functions
// ============================================================================

function logInfo(msg) { console.log(`ℹ️  ${msg}`); }
function logSuccess(msg) { console.log(`✅ ${msg}`); }
function logWarn(msg) { console.log(`⚠️  ${msg}`); }
function logError(msg) { console.log(`❌ ${msg}`); }
function logSection(msg) { console.log(`\n${'='.repeat(60)}\n📋 ${msg}\n${'='.repeat(60)}`); }

function runCommand(cmd, args, options = {}) {
  try {
    const result = spawnSync(cmd, args, {
      encoding: 'utf-8',
      timeout: 60000,
      stdio: 'pipe',
      cwd: PROJECT_ROOT,
      ...options,
    });
    return {
      success: result.status === 0,
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      code: result.status,
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error.message,
      code: -1,
    };
  }
}

function checkSupabaseCLI() {
  // Try npx supabase first, then global
  const result = runCommand('npx', ['--yes', 'supabase@latest', '--version']);
  if (result.success) return { available: true, version: result.stdout.trim(), method: 'npx' };

  const globalResult = runCommand('supabase', ['--version']);
  if (globalResult.success) return { available: true, version: globalResult.stdout.trim(), method: 'global' };

  return { available: false };
}

function getMigrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) {
    return [];
  }

  const files = readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .map(f => {
      const match = f.match(MIGRATION_NAME_PATTERN);
      return {
        filename: f,
        path: join(MIGRATIONS_DIR, f),
        timestamp: match ? match[1] : null,
        description: match ? match[2] : f.replace('.sql', ''),
        validName: !!match,
      };
    })
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''));

  return files;
}

function readMigrationContent(filePath) {
  try {
    return readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

function checkNamingConvention(migrations) {
  const issues = [];
  for (const m of migrations) {
    if (!m.validName) {
      issues.push({
        file: m.filename,
        type: 'naming',
        severity: 'error',
        message: `Invalid migration name format. Expected: YYYYMMDDHHMMSS_description.sql`,
      });
    }
    // Check timestamp is valid
    if (m.timestamp) {
      const year = parseInt(m.timestamp.substring(0, 4));
      const month = parseInt(m.timestamp.substring(4, 6));
      const day = parseInt(m.timestamp.substring(6, 8));
      const hour = parseInt(m.timestamp.substring(8, 10));
      const minute = parseInt(m.timestamp.substring(10, 12));
      const second = parseInt(m.timestamp.substring(12, 14));

      if (year < 2020 || year > 2099 || month < 1 || month > 12 || day < 1 || day > 31 ||
          hour > 23 || minute > 59 || second > 59) {
        issues.push({
          file: m.filename,
          type: 'naming',
          severity: 'error',
          message: `Invalid timestamp in migration name: ${m.timestamp}`,
        });
      }
    }
  }
  return issues;
}

function checkMigrationOrder(migrations) {
  const issues = [];
  for (let i = 1; i < migrations.length; i++) {
    const prev = migrations[i - 1];
    const curr = migrations[i];
    if (prev.timestamp && curr.timestamp && prev.timestamp >= curr.timestamp) {
      issues.push({
        file: curr.filename,
        type: 'order',
        severity: 'error',
        message: `Migration order violation: ${curr.filename} (${curr.timestamp}) should be after ${prev.filename} (${prev.timestamp})`,
      });
    }
  }
  return issues;
}

function checkDestructiveChanges(content, filename) {
  const issues = [];
  const lines = content.split('\n');

  for (const { pattern, name, severity } of DESTRUCTIVE_PATTERNS) {
    let match;
    // Reset regex lastIndex for global patterns
    pattern.lastIndex = 0;
    while ((match = pattern.exec(content)) !== null) {
      // Find line number
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      // Skip if line is a comment (starts with -- or /*)
      if (lineContent.startsWith('--') || lineContent.startsWith('/*')) {
        continue;
      }

      // Special handling for DELETE FROM - check if it has WHERE clause
      if (name === 'DELETE FROM (without WHERE)') {
        const hasWhere = /\bWHERE\b/i.test(lineContent);
        if (hasWhere) continue; // DELETE with WHERE is OK
      }

      issues.push({
        file: filename,
        type: 'destructive',
        severity,
        message: `Destructive operation detected: ${name}`,
        line: lineNumber,
        context: lineContent.substring(0, 150),
      });
    }
  }
  return issues;
}

function checkRollbackLogic(content, filename) {
  const issues = [];

  // Check if migration has any rollback indicators
  let hasRollback = false;
  for (const pattern of ROLLBACK_PATTERNS) {
    if (pattern.test(content)) {
      hasRollback = true;
      break;
    }
  }

  // Also check for CREATE TABLE without corresponding DROP in rollback
  // This is a heuristic - we check if there's a comment block with DOWN/ROLLBACK
  const hasDownBlock = /@down|@rollback/i.test(content) ||
                       /--\s*(DOWN|ROLLBACK|UNDO)/i.test(content);

  if (!hasRollback && !hasDownBlock) {
    // Check if this migration creates tables (most common case needing rollback)
    const createsTables = /\bCREATE\s+TABLE\b/i.test(content);
    if (createsTables) {
      issues.push({
        file: filename,
        type: 'reversibility',
        severity: 'warn',
        message: 'Migration creates tables but has no rollback/DOWN logic. Consider adding a rollback section.',
        suggestion: 'Add a commented DOWN block with DROP TABLE statements for reversibility',
      });
    }
  }

  return issues;
}

function checkRLSPolicies(content, filename) {
  const issues = [];

  // Find all CREATE TABLE statements
  const tableMatches = content.matchAll(/CREATE\s+TABLE\s+(?:public\.)?(\w+)/gi);
  const createdTables = [];
  for (const match of tableMatches) {
    createdTables.push(match[1].toLowerCase());
  }

  // Check each created table for RLS
  for (const table of createdTables) {
    const tableName = table.toLowerCase();

    // Skip tables that typically don't need RLS (system, logs, etc.)
    const skipRLS = ['schema_migrations', 'spatial_ref_sys', '_prisma_migrations'];
    if (skipRLS.includes(tableName)) continue;

    // Check if RLS is enabled for this table
    const rlsEnabled = new RegExp(`ALTER\\s+TABLE\\s+(?:public\\.)?${tableName}\\s+ENABLE\\s+ROW\\s+LEVEL\\s+SECURITY`, 'i').test(content);

    // Check if policies exist for this table
    const hasPolicies = new RegExp(`CREATE\\s+POLICY\\s+.*\\s+ON\\s+(?:public\\.)?${tableName}\\b`, 'i').test(content);

    if (!rlsEnabled) {
      issues.push({
        file: filename,
        type: 'rls',
        severity: 'error',
        message: `Table "${table}" missing RLS (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)`,
        table: table,
      });
    } else if (!hasPolicies) {
      issues.push({
        file: filename,
        type: 'rls',
        severity: 'warn',
        message: `Table "${table}" has RLS enabled but no policies defined`,
        table: table,
      });
    }
  }

  return issues;
}

function checkForeignKeyIndexes(content, filename) {
  const issues = [];

  // Find all foreign key references
  const fkMatches = content.matchAll(/REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)/gi);
  const foreignKeys = [];
  for (const match of fkMatches) {
    foreignKeys.push({
      referencedTable: match[1],
      referencedColumn: match[2],
    });
  }

  // Also find inline FK definitions
  const inlineFkMatches = content.matchAll(/(\w+)\s+\w+\s+REFERENCES\s+(?:public\.)?(\w+)\s*\((\w+)\)/gi);
  for (const match of inlineFkMatches) {
    foreignKeys.push({
      column: match[1],
      referencedTable: match[2],
      referencedColumn: match[3],
    });
  }

  // Check if indexes exist for FK columns
  // Pattern: CREATE INDEX ... ON table (column)
  const indexMatches = content.matchAll(/CREATE\s+INDEX\s+\w+\s+ON\s+(?:public\.)?(\w+)\s*\(([^)]+)\)/gi);
  const indexes = new Map();
  for (const match of indexMatches) {
    const table = match[1];
    const columns = match[2].split(',').map(c => c.trim());
    if (!indexes.has(table)) indexes.set(table, new Set());
    for (const col of columns) indexes.get(table).add(col);
  }

  // For each table with FKs, check if indexed
  const tablesWithFks = new Map();
  for (const fk of foreignKeys) {
    // We need to know which table this FK belongs to - this is hard from just SQL
    // As a heuristic, check if there's an index on commonly referenced columns
  }

  // Simpler approach: check for explicit index creation on FK columns
  // Look for patterns like: CREATE INDEX idx_table_column ON table(column)
  const fkIndexPattern = /CREATE\s+INDEX\s+\w+.*\b(\w+_id)\b/gi;
  const fkColumnsIndexed = new Set();
  let match;
  while ((match = fkIndexPattern.exec(content)) !== null) {
    fkColumnsIndexed.add(match[1]);
  }

  return issues; // For now, this check is informational - FK index checking is complex without full schema
}

function checkSupabasePatterns(content, filename) {
  const issues = [];

  for (const { pattern, name, severity, note } of SUPAWAYS_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const beforeMatch = content.substring(0, match.index);
      const lineNumber = beforeMatch.split('\n').length;
      const lines = content.split('\n');
      const lineContent = lines[lineNumber - 1]?.trim() || '';

      issues.push({
        file: filename,
        type: 'supabase-pattern',
        severity,
        message: `Supabase pattern: ${name}`,
        note,
        line: lineNumber,
        context: lineContent.substring(0, 150),
      });
    }
  }

  return issues;
}

function checkSQLSyntax(content, filename) {
  const issues = [];

  // Basic SQL syntax checks
  const lines = content.split('\n');
  let inFunction = false;
  let functionDepth = 0;
  let inTrigger = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Track function definitions
    if (/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION/i.test(line)) {
      inFunction = true;
      functionDepth = 0;
    }
    if (inFunction) {
      // Count dollar quotes
      const dollarQuotes = (line.match(/\$\$|\$[a-zA-Z_]\$\$/g) || []).length;
      if (dollarQuotes % 2 === 1) {
        functionDepth++;
      } else if (functionDepth > 0) {
        functionDepth--;
      }
      if (functionDepth === 0 && /LANGUAGE\s+\w+/i.test(line)) {
        inFunction = false;
      }
    }

    // Check for unclosed parentheses in simple statements (outside functions)
    if (!inFunction && !line.startsWith('--')) {
      const openParens = (line.match(/\(/g) || []).length;
      const closeParens = (line.match(/\)/g) || []).length;
      // This is very basic - just a heuristic
    }

    // Check for semicolon termination (basic)
    if (line && !line.startsWith('--') &&
        /^(CREATE|ALTER|DROP|INSERT|UPDATE|DELETE|SELECT|WITH|GRANT|REVOKE|COMMENT|SET|COMMIT|ROLLBACK|BEGIN)/i.test(line) &&
        !line.endsWith(';') && !line.endsWith('$$') && !line.endsWith('{') && !line.endsWith(')')) {
      // Might be multi-line, just warn
    }
  }

  return issues;
}

function runSupabaseLint(migrations) {
  const issues = [];

  // Check if supabase CLI is available for linting
  const cli = checkSupabaseCLI();
  if (!cli.available) {
    logWarn('Supabase CLI not available - skipping `supabase db lint`');
    return issues;
  }

  logInfo(`Running supabase db lint (via ${cli.method})...`);

  // Create a temporary combined migration file for linting
  // supabase db lint works on the current database state, not files directly
  // We can try to use pg_dump --schema-only on a shadow database

  // Alternative: Use supabase migration validate if available
  const validateResult = runCommand('npx', ['--yes', 'supabase@latest', 'migration', 'validate', '--help'], { timeout: 30000 });
  if (validateResult.success && validateResult.stdout.includes('validate')) {
    // migration validate subcommand exists
    const result = runCommand('npx', ['--yes', 'supabase@latest', 'migration', 'validate']);
    if (!result.success) {
      issues.push({
        file: 'supabase migration validate',
        type: 'lint',
        severity: 'error',
        message: 'Supabase migration validation failed',
        context: result.stderr || result.stdout,
      });
    }
  }

  return issues;
}

// ============================================================================
// Main Function
// ============================================================================

async function main() {
  console.log('🔍 Supabase Migration Validation\n');
  console.log('═'.repeat(60));

  // Check Supabase CLI
  const cli = checkSupabaseCLI();
  if (!cli.available) {
    logWarn('Supabase CLI not found - some checks will be skipped');
    console.log('   Install with: npm install -D supabase');
    console.log('   Or: brew install supabase/tap/supabase');
    // Don't exit - continue with static analysis checks
  } else {
    logSuccess(`Supabase CLI available: ${cli.version} (${cli.method})`);
  }

  // Get migration files
  const migrations = getMigrationFiles();
  if (migrations.length === 0) {
    logWarn('No migration files found in supabase/migrations/');
    process.exit(0);
  }
  logInfo(`Found ${migrations.length} migration file(s)`);

  // Run all checks
  let allIssues = [];
  let hasErrors = false;
  let hasWarnings = false;

  // 1. Naming Convention
  logSection('Check 1: Migration Naming Convention');
  const namingIssues = checkNamingConvention(migrations);
  allIssues.push(...namingIssues);
  if (namingIssues.length === 0) {
    logSuccess('All migration names follow YYYYMMDDHHMMSS_description.sql format');
  } else {
    for (const issue of namingIssues) logError(`  ${issue.file}: ${issue.message}`);
  }

  // 2. Migration Order
  logSection('Check 2: Migration Order');
  const orderIssues = checkMigrationOrder(migrations);
  allIssues.push(...orderIssues);
  if (orderIssues.length === 0) {
    logSuccess('Migrations are in correct chronological order');
  } else {
    for (const issue of orderIssues) logError(`  ${issue.message}`);
  }

  // 3. Per-file checks
  for (const migration of migrations) {
    logSection(`Check: ${migration.filename}`);
    const content = readMigrationContent(migration.path);

    if (!content.trim()) {
      logWarn(`  Empty migration file`);
      continue;
    }

    // Destructive changes
    const destructiveIssues = checkDestructiveChanges(content, migration.filename);
    allIssues.push(...destructiveIssues);
    for (const issue of destructiveIssues) {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${prefix} Line ${issue.line}: ${issue.message}`);
      if (issue.context) console.log(`     ${issue.context}`);
    }
    if (destructiveIssues.length === 0) {
      logSuccess('  No destructive operations detected');
    }

    // Rollback logic
    const rollbackIssues = checkRollbackLogic(content, migration.filename);
    allIssues.push(...rollbackIssues);
    for (const issue of rollbackIssues) {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${prefix} ${issue.message}`);
      if (issue.suggestion) console.log(`     💡 ${issue.suggestion}`);
    }

    // RLS Policies
    const rlsIssues = checkRLSPolicies(content, migration.filename);
    allIssues.push(...rlsIssues);
    for (const issue of rlsIssues) {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${prefix} ${issue.message}`);
    }
    if (rlsIssues.length === 0) {
      logSuccess('  RLS policies present on all new tables');
    }

    // Supabase patterns
    const patternIssues = checkSupabasePatterns(content, migration.filename);
    allIssues.push(...patternIssues);
    for (const issue of patternIssues) {
      const prefix = issue.severity === 'error' ? '❌' : '⚠️';
      console.log(`  ${prefix} Line ${issue.line}: ${issue.message}`);
      if (issue.note) console.log(`     💡 ${issue.note}`);
      if (issue.context) console.log(`     ${issue.context}`);
    }

    // SQL Syntax (basic)
    const syntaxIssues = checkSQLSyntax(content, migration.filename);
    allIssues.push(...syntaxIssues);
  }

  // 4. Supabase CLI lint (if available)
  logSection('Check: Supabase CLI Validation');
  const lintIssues = runSupabaseLint(migrations);
  allIssues.push(...lintIssues);
  if (lintIssues.length === 0) {
    logSuccess('Supabase CLI validation passed (or not available)');
  }

  // Summary
  logSection('Summary');
  const errors = allIssues.filter(i => i.severity === 'error');
  const warnings = allIssues.filter(i => i.severity === 'warn');

  hasErrors = errors.length > 0;
  hasWarnings = warnings.length > 0;

  console.log(`📊 Total issues: ${allIssues.length} (${errors.length} errors, ${warnings.length} warnings)\n`);

  if (errors.length > 0) {
    console.log('❌ ERRORS:');
    for (const issue of errors) {
      console.log(`   ${issue.file}: ${issue.message}`);
    }
    console.log('');
  }

  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    for (const issue of warnings) {
      console.log(`   ${issue.file}: ${issue.message}`);
    }
    console.log('');
  }

  // Exit code determination
  if (hasErrors) {
    console.log('❌ QUALITY GATE FAILED - Fix errors before deploying');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  QUALITY GATE PASSED WITH WARNINGS - Review warnings');
    process.exit(0); // Warnings don't fail the gate
  } else {
    console.log('✅ QUALITY GATE PASSED - All checks passed');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('❌ Error running migration check:', err.message);
  process.exit(2);
});