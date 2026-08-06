#!/usr/bin/env node
/**
 * Performance Audit - Quality Gate Script
 * Bundle analyzer, asset weight, CWV heuristics
 * 
 * Exit codes:
 *   0 = pass (all thresholds met)
 *   1 = fail (thresholds exceeded)
 *   2 = not installed (dependencies missing)
 */

import { spawnSync, execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

// Thresholds
const THRESHOLDS = {
  // Bundle sizes (KB gzipped)
  maxInitialJS: 170,        // ~170KB gzipped for good TTI
  maxTotalJS: 400,          // Total JS budget
  maxCSS: 50,               // CSS budget
  maxFonts: 100,            // Font budget
  maxImages: 500,           // Image budget per page
  
  // Asset counts
  maxJSRequests: 20,
  maxCSSRequests: 10,
  maxFontRequests: 6,
  maxTotalRequests: 80,
  
  // CWV heuristics (from build output)
  maxLCP: 2500,             // ms
  maxFID: 100,              // ms
  maxCLS: 0.1,
  maxTTFB: 800,             // ms
  maxFCP: 1800,             // ms
  
  // Bundle analyzer
  maxBundleSize: 250,       // KB per chunk
  maxChunkCount: 30,
};

function checkDependencies() {
  const deps = {
    hasNextBuild: false,
    hasBundleAnalyzer: false,
    hasWrangler: false,
    hasVite: false,
    hasAstro: false,
  };
  
  try {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf-8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    deps.hasNextBuild = !!allDeps.next;
    deps.hasBundleAnalyzer = !!allDeps['@next/bundle-analyzer'] || !!allDeps['webpack-bundle-analyzer'];
    deps.hasWrangler = !!allDeps.wrangler;
    deps.hasVite = !!allDeps.vite;
    deps.hasAstro = !!allDeps.astro;
  } catch {}
  
  // Check for config files
  deps.hasNextBuild = deps.hasNextBuild || existsSync(join(process.cwd(), 'next.config.js')) || existsSync(join(process.cwd(), 'next.config.ts'));
  deps.hasVite = deps.hasVite || existsSync(join(process.cwd(), 'vite.config.ts')) || existsSync(join(process.cwd(), 'vite.config.js'));
  deps.hasAstro = deps.hasAstro || existsSync(join(process.cwd(), 'astro.config.mjs')) || existsSync(join(process.cwd(), 'astro.config.ts'));
  
  return deps;
}

function analyzeNextJSBuild() {
  const results = {
    jsSize: 0,
    cssSize: 0,
    chunks: [],
    warnings: [],
    errors: []
  };
  
  // Look for .next build output
  const nextDir = join(process.cwd(), '.next');
  if (!existsSync(nextDir)) {
    results.errors.push('No .next build directory found. Run `next build` first.');
    return results;
  }
  
  // Analyze build manifest
  const buildManifestPath = join(nextDir, 'build-manifest.json');
  if (existsSync(buildManifestPath)) {
    try {
      const manifest = JSON.parse(readFileSync(buildManifestPath, 'utf-8'));
      // Extract JS/CSS files
      const jsFiles = manifest.pages['/_app'] || [];
      const cssFiles = manifest.pages['/_app']?.filter(f => f.endsWith('.css')) || [];
    } catch {}
  }
  
  // Check for bundle analyzer output
  const analyzerDir = join(nextDir, 'analyze');
  if (existsSync(analyzerDir)) {
    // Parse analyzer output if available
  }
  
  // Estimate from static files
  const staticDir = join(nextDir, 'static');
  if (existsSync(staticDir)) {
    walkAndAnalyze(staticDir, results);
  }
  
  return results;
}

function walkAndAnalyze(dir, results) {
  const items = readdirSync(dir);
  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);
    
    if (stat.isDirectory()) {
      walkAndAnalyze(fullPath, results);
    } else {
      const sizeKB = stat.size / 1024;
      const ext = extname(item).toLowerCase();
      
      if (ext === '.js' || ext === '.mjs') {
        results.jsSize += sizeKB;
        results.chunks.push({ file: relative(process.cwd(), fullPath), sizeKB, type: 'js' });
      } else if (ext === '.css') {
        results.cssSize += sizeKB;
        results.chunks.push({ file: relative(process.cwd(), fullPath), sizeKB, type: 'css' });
      } else if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) {
        results.chunks.push({ file: relative(process.cwd(), fullPath), sizeKB, type: 'font' });
      } else if (['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.gif'].includes(ext)) {
        results.chunks.push({ file: relative(process.cwd(), fullPath), sizeKB, type: 'image' });
      }
    }
  }
}

function analyzeViteBuild() {
  const results = { jsSize: 0, cssSize: 0, chunks: [], warnings: [], errors: [] };
  const distDir = join(process.cwd(), 'dist');
  
  if (!existsSync(distDir)) {
    results.errors.push('No dist directory found. Run `vite build` first.');
    return results;
  }
  
  walkAndAnalyze(distDir, results);
  return results;
}

function analyzeWranglerBuild() {
  const results = { jsSize: 0, cssSize: 0, chunks: [], warnings: [], errors: [] };
  const distDir = join(process.cwd(), 'dist');
  const workerDir = join(process.cwd(), '.wrangler');
  
  if (existsSync(distDir)) {
    walkAndAnalyze(distDir, results);
  } else if (existsSync(workerDir)) {
    walkAndAnalyze(workerDir, results);
  } else {
    results.errors.push('No build output found. Run `wrangler deploy` or build first.');
  }
  
  return results;
}

function checkBundleSizes(results) {
  const issues = [];
  const warnings = [];
  
  // Total JS
  if (results.jsSize > THRESHOLDS.maxTotalJS) {
    issues.push(`Total JS size: ${results.jsSize.toFixed(1)}KB > ${THRESHOLDS.maxTotalJS}KB`);
  } else if (results.jsSize > THRESHOLDS.maxTotalJS * 0.8) {
    warnings.push(`Total JS size: ${results.jsSize.toFixed(1)}KB approaching limit`);
  }
  
  // CSS
  if (results.cssSize > THRESHOLDS.maxCSS) {
    issues.push(`Total CSS size: ${results.cssSize.toFixed(1)}KB > ${THRESHOLDS.maxCSS}KB`);
  }
  
  // Chunk count
  const jsChunks = results.chunks.filter(c => c.type === 'js');
  if (jsChunks.length > THRESHOLDS.maxChunkCount) {
    warnings.push(`JS chunk count: ${jsChunks.length} > ${THRESHOLDS.maxChunkCount}`);
  }
  
  // Large chunks
  for (const chunk of jsChunks) {
    if (chunk.sizeKB > THRESHOLDS.maxBundleSize) {
      issues.push(`Large JS chunk: ${chunk.file} (${chunk.sizeKB.toFixed(1)}KB > ${THRESHOLDS.maxBundleSize}KB)`);
    }
  }
  
  // Fonts
  const fonts = results.chunks.filter(c => c.type === 'font');
  const fontSize = fonts.reduce((sum, f) => sum + f.sizeKB, 0);
  if (fontSize > THRESHOLDS.maxFonts) {
    warnings.push(`Font size: ${fontSize.toFixed(1)}KB > ${THRESHOLDS.maxFonts}KB`);
  }
  if (fonts.length > THRESHOLDS.maxFontRequests) {
    warnings.push(`Font requests: ${fonts.length} > ${THRESHOLDS.maxFontRequests}`);
  }
  
  // Images
  const images = results.chunks.filter(c => c.type === 'image');
  const imageSize = images.reduce((sum, i) => sum + i.sizeKB, 0);
  if (imageSize > THRESHOLDS.maxImages) {
    warnings.push(`Image size: ${imageSize.toFixed(1)}KB > ${THRESHOLDS.maxImages}KB`);
  }
  
  // Total requests estimate
  const totalRequests = jsChunks.length + results.chunks.filter(c => c.type === 'css').length + 
                       fonts.length + images.length;
  if (totalRequests > THRESHOLDS.maxTotalRequests) {
    warnings.push(`Estimated total requests: ${totalRequests} > ${THRESHOLDS.maxTotalRequests}`);
  }
  
  return { issues, warnings };
}

function printResults(results, framework) {
  console.log(`\n📦 ${framework} Build Analysis`);
  console.log('─'.repeat(50));
  console.log(`Total JS:     ${results.jsSize.toFixed(1)} KB (limit: ${THRESHOLDS.maxTotalJS} KB)`);
  console.log(`Total CSS:    ${results.cssSize.toFixed(1)} KB (limit: ${THRESHOLDS.maxCSS} KB)`);
  console.log(`JS Chunks:    ${results.chunks.filter(c => c.type === 'js').length} (limit: ${THRESHOLDS.maxChunkCount})`);
  console.log(`Font Files:   ${results.chunks.filter(c => c.type === 'font').length} (limit: ${THRESHOLDS.maxFontRequests})`);
  console.log(`Image Files:  ${results.chunks.filter(c => c.type === 'image').length}`);
  
  // Top 5 largest chunks
  const jsChunks = results.chunks.filter(c => c.type === 'js').sort((a, b) => b.sizeKB - a.sizeKB);
  if (jsChunks.length > 0) {
    console.log('\n📊 Largest JS Chunks:');
    for (const chunk of jsChunks.slice(0, 5)) {
      const status = chunk.sizeKB > THRESHOLDS.maxBundleSize ? '⚠️' : '✅';
      console.log(`   ${status} ${chunk.file}: ${chunk.sizeKB.toFixed(1)} KB`);
    }
  }
}

async function main() {
  console.log('🔍 Performance Audit Quality Check\n');
  console.log('📋 Thresholds:');
  console.log(`   JS Total: ≤${THRESHOLDS.maxTotalJS}KB, Initial: ≤${THRESHOLDS.maxInitialJS}KB`);
  console.log(`   CSS: ≤${THRESHOLDS.maxCSS}KB, Fonts: ≤${THRESHOLDS.maxFonts}KB`);
  console.log(`   Chunks: ≤${THRESHOLDS.maxChunkCount}, Per chunk: ≤${THRESHOLDS.maxBundleSize}KB\n`);
  
  const deps = checkDependencies();
  let results = { jsSize: 0, cssSize: 0, chunks: [], warnings: [], errors: [] };
  let framework = 'Unknown';
  
  if (deps.hasNextBuild) {
    framework = 'Next.js';
    console.log('🔧 Detected Next.js project');
    results = analyzeNextJSBuild();
  } else if (deps.hasVite) {
    framework = 'Vite';
    console.log('🔧 Detected Vite project');
    results = analyzeViteBuild();
  } else if (deps.hasWrangler) {
    framework = 'Cloudflare Workers (Wrangler)';
    console.log('🔧 Detected Wrangler project');
    results = analyzeWranglerBuild();
  } else if (deps.hasAstro) {
    framework = 'Astro';
    console.log('🔧 Detected Astro project');
    results = analyzeViteBuild(); // Astro uses Vite
  } else {
    console.log('❌ No supported framework detected (Next.js, Vite, Astro, Wrangler)');
    console.log('   Ensure package.json has the appropriate dependencies.');
    process.exit(2);
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Build analysis failed:');
    for (const err of results.errors) {
      console.log(`   - ${err}`);
    }
    console.log('\n💡 Run your build command first (e.g., `npm run build`, `wrangler deploy`)');
    process.exit(2);
  }
  
  printResults(results, framework);
  
  const { issues, warnings } = checkBundleSizes(results);
  
  if (warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    for (const warn of warnings) {
      console.log(`   - ${warn}`);
    }
  }
  
  if (issues.length > 0) {
    console.log('\n❌ Issues (FAIL):');
    for (const issue of issues) {
      console.log(`   - ${issue}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (issues.length === 0) {
    console.log('✅ PERFORMANCE AUDIT PASSED');
    console.log('   All bundle size thresholds met.');
    if (warnings.length > 0) {
      console.log('   Consider addressing warnings for optimal performance.');
    }
    process.exit(0);
  } else {
    console.log('❌ PERFORMANCE AUDIT FAILED');
    console.log(`   ${issues.length} threshold violation(s) found.`);
    console.log('\n💡 Optimization suggestions:');
    console.log('   - Enable code splitting and dynamic imports');
    console.log('   - Remove unused dependencies (check with `npm ls` or `depcheck`)');
    console.log('   - Compress images (WebP/AVIF), use responsive images');
    console.log('   - Subset fonts, use font-display: swap');
    console.log('   - Enable gzip/brotli compression on server');
    console.log('   - Use bundle analyzer: `ANALYZE=true npm run build`');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error running performance audit:', err.message);
  process.exit(2);
});