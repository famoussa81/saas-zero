import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

/**
 * Pixelmatch helper for visual regression testing
 * Compares two PNG images and outputs diff + similarity score
 */
export interface PixelmatchResult {
  mismatchPixels: number;
  totalPixels: number;
  similarity: number;
  diffPath?: string;
}

export interface PixelmatchOptions {
  threshold?: number;
  includeAA?: boolean;
  alpha?: number;
  antialiasing?: number;
  diffColor?: [number, number, number];
  diffColorAlt?: [number, number, number];
}

const DEFAULT_OPTIONS: Required<PixelmatchOptions> = {
  threshold: 0.1,
  includeAA: true,
  alpha: 0.1,
  antialiasing: true,
  diffColor: [255, 0, 0],
  diffColorAlt: [255, 165, 0],
};

/**
 * Compare two PNG buffers/images using pixelmatch
 */
export async function compareImages(
  baselinePath: string,
  actualPath: string,
  diffOutputPath: string,
  options: PixelmatchOptions = {},
): Promise<PixelmatchResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Read and parse images
  const baselineBuffer = readFileSync(baselinePath);
  const actualBuffer = readFileSync(actualPath);

  const baselineImg = PNG.sync.read(baselineBuffer);
  const actualImg = PNG.sync.read(actualBuffer);

  // Validate dimensions
  if (
    baselineImg.width !== actualImg.width ||
    baselineImg.height !== actualImg.height
  ) {
    throw new Error(
      `Dimension mismatch: baseline ${baselineImg.width}x${baselineImg.height} vs actual ${actualImg.width}x${actualImg.height}`,
    );
  }

  // Create diff image
  const diffImg = new PNG({
    width: baselineImg.width,
    height: baselineImg.height,
  });
  const mismatchPixels = pixelmatch(
    baselineImg.data,
    actualImg.data,
    diffImg.data,
    baselineImg.width,
    baselineImg.height,
    opts,
  );

  const totalPixels = baselineImg.width * baselineImg.height;
  const similarity = 1 - mismatchPixels / totalPixels;

  // Write diff image
  const diffDir = dirname(diffOutputPath);
  if (!existsSync(diffDir)) {
    mkdirSync(diffDir, { recursive: true });
  }
  writeFileSync(diffOutputPath, PNG.sync.write(diffImg));

  return {
    mismatchPixels,
    totalPixels,
    similarity,
    diffPath: diffOutputPath,
  };
}

/**
 * Compare image from baseline directory with actual screenshot
 */
export async function compareWithBaseline(
  testName: string,
  actualPath: string,
  baselineDir: string = "tests/visual/baselines",
  diffDir: string = "tests/visual/diffs",
  options: PixelmatchOptions = {},
): Promise<PixelmatchResult> {
  const baselinePath = join(baselineDir, `${testName}.png`);
  const diffPath = join(diffDir, `${testName}-diff.png`);

  if (!existsSync(baselinePath)) {
    throw new Error(
      `Baseline not found: ${baselinePath}. Run with --update-snapshots to create.`,
    );
  }

  return compareImages(baselinePath, actualPath, diffPath, options);
}

/**
 * Save actual screenshot as new baseline
 */
export async function updateBaseline(
  testName: string,
  actualPath: string,
  baselineDir: string = "tests/visual/baselines",
): Promise<void> {
  if (!existsSync(baselineDir)) {
    mkdirSync(baselineDir, { recursive: true });
  }
  const baselinePath = join(baselineDir, `${testName}.png`);
  const actualBuffer = readFileSync(actualPath);
  writeFileSync(baselinePath, actualBuffer);
}

/**
 * Assert image matches baseline within threshold
 * Throws if similarity is below threshold
 */
export async function assertVisualMatch(
  testName: string,
  actualPath: string,
  baselineDir: string = "tests/visual/baselines",
  diffDir: string = "tests/visual/diffs",
  threshold: number = 0.99,
): Promise<PixelmatchResult> {
  const result = await compareWithBaseline(
    testName,
    actualPath,
    baselineDir,
    diffDir,
  );

  if (result.similarity < threshold) {
    const error = new Error(
      `Visual regression detected for "${testName}": ${(result.similarity * 100).toFixed(2)}% similarity (threshold: ${(threshold * 100).toFixed(2)}%)`,
    ) as Error & { pixelmatchResult: PixelmatchResult };
    error.pixelmatchResult = result;
    throw error;
  }

  return result;
}

export { PNG, pixelmatch };
