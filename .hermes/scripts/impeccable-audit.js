#!/usr/bin/env node
/**
 * Impeccable Audit - Quality Gate Script
 * Wrapper for Impeccable audit with thresholds (score ≥14, 0 P0/P1)
 * 
 * Exit codes:
 *   0 = pass (score ≥14, no P0/P1 issues)
 *   1 = fail (score <14 or has P0/P1 issues)
 *   2 = not installed (impeccable not available)
 */

import { spawnSync, execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const MIN_SCORE = 14;
const MAX_P0_P1 = 0;

function checkImpeccableInstalled() {
  // Check if impeccable is available via npx
  try {
    const result = spawnSync('npx', ['--yes', 'impeccable@latest', '--version'], { 
      encoding: 'utf-8',
      timeout: 30000,
      stdio: 'pipe'
    });
    return result.status === 0;
  } catch {
    return false;
  }
}

function runImpeccableAudit() {
  const args = ['--yes', 'impeccable@latest', 'audit', '--format', 'json'];
  
  // Add config file if exists
  const configPaths = [
    'impeccable.config.js',
    'impeccable.config.ts',
    '.impeccable.config.js',
    '.impeccable.config.ts',
    'impeccable.config.json',
  ];
  
  for (const configPath of configPaths) {
    if (existsSync(join(process.cwd(), configPath))) {
      args.push('--config', configPath);
      break;
    }
  }
  
  try {
    const result = spawnSync('npx', args, {
      encoding: 'utf-8',
      timeout: 120000,
      stdio: 'pipe',
      cwd: process.cwd()
    });
    
    return {
      success: result.status === 0,
      stdout: result.stdout,
      stderr: result.stderr,
      code: result.status
    };
  } catch (error) {
    return {
      success: false,
      stdout: '',
      stderr: error.message,
      code: -1
    };
  }
}

function parseImpeccableOutput(output) {
  try {
    // Try to parse JSON output
    const jsonStart = output.indexOf('{');
    const jsonEnd = output.lastIndexOf('}') + 1;
    if (jsonStart >= 0 && jsonEnd > jsonStart) {
      const jsonStr = output.substring(jsonStart, jsonEnd);
      return JSON.parse(jsonStr);
    }
  } catch {}
  
  // Fallback: try to extract key metrics from text output
  const result = {
    score: null,
    issues: { P0: 0, P1: 0, P2: 0, P3: 0 },
    summary: ''
  };
  
  // Extract score
  const scoreMatch = output.match(/score[:\s]+(\d+(?:\.\d+)?)/i);
  if (scoreMatch) result.score = parseFloat(scoreMatch[1]);
  
  // Extract issue counts
  const p0Match = output.match(/P0[:\s]+(\d+)/i);
  const p1Match = output.match(/P1[:\s]+(\d+)/i);
  const p2Match = output.match(/P2[:\s]+(\d+)/i);
  const p3Match = output.match(/P3[:\s]+(\d+)/i);
  
  if (p0Match) result.issues.P0 = parseInt(p0Match[1]);
  if (p1Match) result.issues.P1 = parseInt(p1Match[1]);
  if (p2Match) result.issues.P2 = parseInt(p2Match[1]);
  if (p3Match) result.issues.P3 = parseInt(p3Match[1]);
  
  result.summary = output.substring(0, 500);
  return result;
}

function formatIssues(issues) {
  const parts = [];
  if (issues.P0 > 0) parts.push(`P0: ${issues.P0}`);
  if (issues.P1 > 0) parts.push(`P1: ${issues.P1}`);
  if (issues.P2 > 0) parts.push(`P2: ${issues.P2}`);
  if (issues.P3 > 0) parts.push(`P3: ${issues.P3}`);
  return parts.join(', ') || 'none';
}

async function main() {
  console.log('🔍 Impeccable Audit Quality Check\n');
  console.log(`📋 Thresholds: Score ≥ ${MIN_SCORE}, P0/P1 issues = ${MAX_P0_P1}\n`);
  
  // Check if impeccable is installed
  console.log('📦 Checking Impeccable installation...');
  const installed = checkImpeccableInstalled();
  
  if (!installed) {
    console.log('❌ Impeccable not installed or not accessible via npx');
    console.log('   Install with: npm install -D impeccable');
    console.log('   Or: npx impeccable@latest audit');
    process.exit(2);
  }
  
  console.log('✅ Impeccable available\n');
  
  // Run audit
  console.log('🚀 Running Impeccable audit...');
  const auditResult = runImpeccableAudit();
  
  if (!auditResult.success && auditResult.code !== 1) {
    // Code 1 might mean issues found but audit completed
    console.log('❌ Audit execution failed:');
    console.log(auditResult.stderr || auditResult.stdout);
    process.exit(2);
  }
  
  // Parse results
  const parsed = parseImpeccableOutput(auditResult.stdout || auditResult.stderr);
  
  console.log('\n📊 Audit Results:');
  console.log(`   Score: ${parsed.score !== null ? parsed.score : 'N/A'}`);
  console.log(`   Issues: ${formatIssues(parsed.issues)}`);
  
  if (parsed.score !== null) {
    console.log(`   Threshold: ≥ ${MIN_SCORE}`);
    console.log(`   Status: ${parsed.score >= MIN_SCORE ? '✅ PASS' : '❌ FAIL'}`);
  }
  
  const p0p1Count = parsed.issues.P0 + parsed.issues.P1;
  console.log(`   P0+P1: ${p0p1Count} (max: ${MAX_P0_P1})`);
  console.log(`   Status: ${p0p1Count <= MAX_P0_P1 ? '✅ PASS' : '❌ FAIL'}`);
  
  // Determine overall result
  const scorePass = parsed.score !== null && parsed.score >= MIN_SCORE;
  const issuesPass = p0p1Count <= MAX_P0_P1;
  
  console.log('\n' + '='.repeat(50));
  
  if (scorePass && issuesPass) {
    console.log('✅ QUALITY GATE PASSED');
    console.log('   All thresholds met. Ready for deployment.');
    process.exit(0);
  } else {
    console.log('❌ QUALITY GATE FAILED');
    if (!scorePass && parsed.score !== null) {
      console.log(`   - Score ${parsed.score} is below minimum ${MIN_SCORE}`);
    }
    if (!issuesPass) {
      console.log(`   - ${p0p1Count} P0/P1 issues exceed maximum of ${MAX_P0_P1}`);
    }
    console.log('\n💡 Run `npx impeccable audit` for detailed report');
    console.log('   Fix critical issues before deploying.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error running Impeccable audit:', err.message);
  process.exit(2);
});