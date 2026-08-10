#!/usr/bin/env node
/**
 * media-fetcher.js
 * ----------------
 * Fetches real images from Pexels / Unsplash / Picsum for SaaS projects.
 * Zero placeholders. Multi-source fallback. Generates manifest + attribution.
 *
 * Usage:
 *   node .claude/scripts/media-fetcher.js --keywords="dashboard,analytics,team" --output=public/assets/images --count=12
 *   node .claude/scripts/media-fetcher.js --keywords="hero,saas landing" --output=public/assets/images --count=3 --orientation=landscape
 */

const fs = require("node:fs");
const path = require("node:path");
const https = require("node:https");
const { URL } = require("node:url");

// --- Configuration ---------------------------------------------------------
const SOURCES = {
  pexels: {
    base: "https://api.pexels.com/v1/search",
    keyEnv: "PEXELS_API_KEY",
    headers: (key) => ({ Authorization: key }),
    transform: (data) =>
      data.photos?.map((p) => ({
        url: p.src.large2x || p.src.large || p.src.original,
        thumb: p.src.medium,
        width: p.width,
        height: p.height,
        photographer: p.photographer,
        photographerUrl: p.photographer_url,
        source: "pexels",
        sourceUrl: p.url,
      })) || [],
  },
  unsplash: {
    base: "https://api.unsplash.com/search/photos",
    keyEnv: "UNSPLASH_ACCESS_KEY",
    headers: () => ({ "Accept-Version": "v1" }),
    transform: (data) =>
      data.results?.map((p) => ({
        url: p.urls.raw + "&w=1920",
        thumb: p.urls.regular,
        width: p.width,
        height: p.height,
        photographer: p.user?.name,
        photographerUrl: p.user?.links?.html,
        source: "unsplash",
        sourceUrl: p.links?.html,
      })) || [],
  },
  picsum: {
    base: "https://picsum.photos/v2/list",
    keyEnv: null,
    headers: () => ({}),
    transform: (data) =>
      data?.slice(0, 50).map((p) => ({
        url: `https://picsum.photos/id/${p.id}/1920/1080`,
        thumb: `https://picsum.photos/id/${p.id}/400/300`,
        width: 1920,
        height: 1080,
        photographer: p.author,
        photographerUrl: `https://unsplash.com/@${p.author}`,
        source: "picsum",
        sourceUrl: `https://picsum.photos/id/${p.id}`,
      })) || [],
  },
};

const SAAS_KEYWORDS = {
  dashboard: [
    "dashboard",
    "analytics",
    "data visualization",
    "charts",
    "metrics",
    "kpi",
    "admin panel",
  ],
  hero: [
    "saas landing page",
    "modern startup",
    "tech hero section",
    "software hero",
    "app landing",
  ],
  team: [
    "team collaboration",
    "remote team",
    "office meeting",
    "video call",
    "startup team",
  ],
  finance: [
    "finance dashboard",
    "payment",
    "billing",
    "subscription",
    "pricing table",
    "invoice",
  ],
  onboarding: [
    "user onboarding",
    "welcome screen",
    "setup wizard",
    "getting started",
  ],
  settings: [
    "settings panel",
    "user preferences",
    "account settings",
    "security settings",
  ],
  generic: [
    "modern office",
    "technology",
    "startup",
    "software development",
    "cloud computing",
  ],
};

// --- CLI Parsing -----------------------------------------------------------
const args = process.argv.slice(2);
const config = {
  keywords: [],
  output: "public/assets/images",
  count: 12,
  orientation: "any", // landscape, portrait, any
  theme: "dashboard",
  dryRun: false,
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--keywords" || arg === "-k")
    config.keywords = args[++i].split(",").map((s) => s.trim());
  else if (arg === "--output" || arg === "-o") config.output = args[++i];
  else if (arg === "--count" || arg === "-c")
    config.count = parseInt(args[++i], 10);
  else if (arg === "--orientation") config.orientation = args[++i];
  else if (arg === "--theme") config.theme = args[++i];
  else if (arg === "--dry-run") config.dryRun = true;
  else if (arg === "--help" || arg === "-h") {
    printHelp();
    process.exit(0);
  }
}

if (config.keywords.length === 0) {
  config.keywords = SAAS_KEYWORDS[config.theme] || SAAS_KEYWORDS.generic;
}

function printHelp() {
  console.log(`
media-fetcher.js — Fetch real images for SaaS projects

Usage:
  node media-fetcher.js [options]

Options:
  --keywords, -k   Comma-separated search terms (default: theme-based)
  --output, -o     Output directory (default: public/assets/images)
  --count, -c      Number of images to fetch (default: 12)
  --orientation    landscape | portrait | any (default: any)
  --theme          dashboard | hero | team | finance | onboarding | settings | generic
  --dry-run        Show what would be fetched without downloading
  --help, -h       Show this help

Environment:
  PEXELS_API_KEY     Get from https://www.pexels.com/api/
  UNSPLASH_ACCESS_KEY Get from https://unsplash.com/developers
`);
}

// --- HTTP Helper -----------------------------------------------------------
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${e.message}`));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    req.setTimeout(30000, () => req.destroy(new Error("Timeout")));
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          file.close();
          fs.unlink(destPath, () => {});
          reject(new Error(`Download failed: ${res.statusCode}`));
          return;
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
        file.on("error", (err) => {
          file.close();
          fs.unlink(destPath, () => {});
          reject(err);
        });
      })
      .on("error", reject);
  });
}

// --- Core Logic ------------------------------------------------------------
async function fetchFromSource(sourceName, query, count, orientation) {
  const source = SOURCES[sourceName];
  if (!source) return [];

  const key = source.keyEnv ? process.env[source.keyEnv] : null;
  if (source.keyEnv && !key) {
    console.log(`  ⚠ ${sourceName}: missing ${source.keyEnv}, skipping`);
    return [];
  }

  const params = new URLSearchParams({
    query,
    per_page: Math.min(count, 80),
    orientation,
  });
  if (sourceName === "unsplash") params.set("order_by", "relevant");

  const url = `${source.base}?${params.toString()}`;
  const headers = source.headers(key);

  try {
    const data = await httpGet(url, headers);
    const results = source.transform(data);
    console.log(`  ✓ ${sourceName}: ${results.length} results for "${query}"`);
    return results;
  } catch (err) {
    console.log(`  ✗ ${sourceName}: ${err.message}`);
    return [];
  }
}

async function fetchImages(config) {
  const allResults = [];
  const seenUrls = new Set();

  for (const keyword of config.keywords) {
    if (allResults.length >= config.count) break;

    for (const sourceName of ["pexels", "unsplash", "picsum"]) {
      if (allResults.length >= config.count) break;

      const results = await fetchFromSource(
        sourceName,
        keyword,
        config.count - allResults.length,
        config.orientation,
      );

      for (const img of results) {
        if (allResults.length >= config.count) break;
        if (seenUrls.has(img.url)) continue;
        seenUrls.add(img.url);

        // Filter by orientation
        if (config.orientation === "landscape" && img.width < img.height)
          continue;
        if (config.orientation === "portrait" && img.width > img.height)
          continue;

        allResults.push({ ...img, keyword });
      }
    }
  }

  return allResults.slice(0, config.count);
}

function generateFilename(img, index) {
  const ext = path.extname(new URL(img.url).pathname) || ".jpg";
  const base = img.keyword.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const hash = Math.random().toString(36).slice(2, 8);
  return `${base}-${hash}${ext}`;
}

async function downloadImages(images, outputDir) {
  fs.mkdirSync(outputDir, { recursive: true });

  const manifest = [];
  const attributionLines = [
    "# Image Attributions\n",
    "Auto-generated by media-fetcher.js\n",
  ];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const filename = generateFilename(img, i);
    const destPath = path.join(outputDir, filename);

    if (!config.dryRun) {
      console.log(`  ⬇ Downloading ${filename}...`);
      try {
        await downloadFile(img.url, destPath);
      } catch (err) {
        console.error(`    ✗ Failed: ${err.message}`);
        continue;
      }
    }

    manifest.push({
      filename,
      alt: `${img.keyword} - ${img.source}`,
      width: img.width,
      height: img.height,
      source: img.source,
      sourceUrl: img.sourceUrl,
      photographer: img.photographer,
      photographerUrl: img.photographerUrl,
    });

    const credit =
      img.source === "picsum"
        ? `Image from Lorem Picsum`
        : `Photo by ${img.photographer} on ${img.source.charAt(0).toUpperCase() + img.source.slice(1)}`;
    attributionLines.push(`- ${filename}: ${credit} (${img.sourceUrl})`);
  }

  // Write manifest
  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Write attribution
  fs.writeFileSync(
    path.join(outputDir, "attribution.md"),
    attributionLines.join("\n"),
  );

  return { manifest, attribution: attributionLines.join("\n") };
}

// --- Main ------------------------------------------------------------------
async function main() {
  console.log(
    `\n📸 media-fetcher — Fetching ${config.count} images for: ${config.keywords.join(", ")}`,
  );
  console.log(`   Output: ${config.output}\n`);

  if (config.dryRun) {
    console.log("DRY RUN — no files will be downloaded\n");
  }

  const images = await fetchImages(config);

  if (images.length === 0) {
    console.error("\n❌ No images fetched. Check API keys or network.");
    process.exit(1);
  }

  console.log(`\n✅ Fetched ${images.length} unique images`);

  if (!config.dryRun) {
    const { manifest } = await downloadImages(images, config.output);
    console.log(`\n📁 Saved to ${config.output}/`);
    console.log(`   - ${manifest.length} images`);
    console.log(`   - manifest.json`);
    console.log(`   - attribution.md`);
  }

  console.log("\n✨ Done!\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal:", err.message);
  process.exit(1);
});
