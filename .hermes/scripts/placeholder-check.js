#!/usr/bin/env node
/**
 * Placeholder Check - Quality Gate Script
 * Detects placeholder content in the codebase that should be replaced before production
 * 
 * Exit codes:
 *   0 = pass (no placeholders found)
 *   1 = fail (placeholders detected)
 *   2 = not installed (dependencies missing)
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, extname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Patterns to detect placeholder content
const PLACEHOLDER_PATTERNS = [
  // Common placeholder text
  /lorem\s+ipsum/gi,
  /\[ville\]/gi,
  /votre-texte-ici/gi,
  /insert-text/gi,
  /sample-data/gi,
  /fake-data/gi,
  /test-data/gi,
  /dummy/gi,
  /placeholder/gi,
  
  // Template variables
  /\{\{[^}]+\}\}/g,
  
  // Explicit replacement markers
  /CHANGE_ME/gi,
  /REPLACE_ME/gi,
  /TODO:/gi,
  /FIXME:/gi,
  
  // Common placeholder domains
  /placeholder\.com/gi,
  /example\.com/gi,
  /example\.org/gi,
  /temp-/gi,
  /placeholder-/gi,
];

// File extensions to check
const CHECK_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx',
  '.html', '.css', '.scss', '.sass', '.less',
  '.sql', '.yml', '.yaml', '.toml', '.ini', '.env',
  '.txt', '.xml', '.svg'
]);

// Directories/files to ignore
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '.vercel',
  'coverage',
  '.turbo',
  '*.min.js',
  '*.min.css',
  '.DS_Store',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lockb',
  'AppData',
  'Application Data',
  'Local Settings',
  'ntuser',
  'NTUSER',
  'Desktop',
  'Documents',
  'Downloads',
  'Music',
  'Pictures',
  'Videos',
  'Contacts',
  'Favorites',
  'Links',
  'Searches',
  'Saved Games',
  'OneDrive',
  'IntelGraphicsProfiles',
  '.cache',
  '.config',
  '.local',
  '.npm',
  '.yarn',
  '.pnpm',
  '.bun',
  'Projects',
  // Quality gate scripts themselves
  'placeholder-check.js',
  'stripe-webhook-check.js',
  'impeccable-audit.js',
  'perf-audit.js',
];

function shouldIgnore(path) {
  const relPath = relative(process.cwd(), path);
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return regex.test(relPath) || regex.test(path.split('/').pop() || '');
    }
    return relPath.startsWith(pattern + '/') || relPath === pattern || path.includes('/' + pattern + '/');
  });
}

function checkFile(filePath) {
  const issues = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, lineIndex) => {
      PLACEHOLDER_PATTERNS.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach(match => {
            issues.push({
              file: filePath,
              line: lineIndex + 1,
              column: line.indexOf(match) + 1,
              pattern: pattern.source,
              match: match.substring(0, 100),
              context: line.trim().substring(0, 200)
            });
          });
        }
      });
    });
  } catch (error) {
    // Skip binary/unreadable files
  }
  return issues;
}

function walkDir(dir, files = []) {
  if (shouldIgnore(dir)) return files;
  
  let items;
  try {
    items = readdirSync(dir);
  } catch (error) {
    // Skip directories we can't read (permission errors, etc.)
    return files;
  }
  
  for (const item of items) {
    const fullPath = join(dir, item);
    if (shouldIgnore(fullPath)) continue;
    
    let stat;
    try {
      stat = statSync(fullPath);
    } catch {
      continue;
    }
    
    if (stat.isDirectory()) {
      walkDir(fullPath, files);
    } else if (CHECK_EXTENSIONS.has(extname(item))) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const cwd = process.cwd();
  console.log(`🔍 Scanning for placeholder content in: ${cwd}\n`);
  
  const files = walkDir(cwd);
  console.log(`📁 Checking ${files.length} files...\n`);
  
  let allIssues = [];
  let filesWithIssues = 0;
  
  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      filesWithIssues++;
      allIssues.push(...issues);
    }
  }
  
  if (allIssues.length === 0) {
    console.log('✅ No placeholder content detected. Quality gate passed!');
    process.exit(0);
  }
  
  console.log(`❌ Found ${allIssues.length} placeholder issue(s) in ${filesWithIssues} file(s):\n`);
  
  // Group by file for cleaner output
  const byFile = {};
  for (const issue of allIssues) {
    if (!byFile[issue.file]) byFile[issue.file] = [];
    byFile[issue.file].push(issue);
  }
  
  for (const [file, issues] of Object.entries(byFile)) {
    const relFile = relative(cwd, file);
    console.log(`📄 ${relFile}`);
    for (const issue of issues) {
      console.log(`   Line ${issue.line}:${issue.column} - Matched: "${issue.match}" (pattern: ${issue.pattern})`);
      console.log(`   Context: ${issue.context}`);
    }
    console.log('');
  }
  
  console.log('💡 Replace all placeholder content before deploying to production.');
  process.exit(1);
}

main().catch(err => {
  console.error('❌ Error running placeholder check:', err.message);
  process.exit(2);
});