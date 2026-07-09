#!/usr/bin/env tsx

// Optimize image file size with sharp — single file, a directory, or a full apps/* scan.
//
// Usage:
//   tsx optimize-images.ts <image-path>     Optimize one file (keep dimensions & format by default)
//   tsx optimize-images.ts <dir-path>       Recursively optimize images in a directory (resize+webp)
//   tsx optimize-images.ts                  Scan apps/*/public/assets/{screenshots,gallery,features} (batch)
//
// Options:
//   --width <n> / -w <n>        Max width in px (resize). Batch default 1600; single: no resize unless set.
//   --quality <n> / -q <n>      Quality 1-100 (default 90)
//   --format <webp|jpeg|avif|png> / -f   Output format. Batch default webp; single: keep original unless set.
//   --min-size <n>              Skip files smaller than n KB. Batch default 500; single default 0.
//   --dry-run / -d              Preview without writing
//   --no-backup                 Skip the .original backup copy

import { existsSync } from "node:fs";
import { copyFile, readdir, rename, stat, unlink } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import sharp from "sharp";

type ImgFormat = "webp" | "jpeg" | "avif" | "png";

interface OptimizeOptions {
  quality: number;
  format?: ImgFormat; // undefined = keep original
  width?: number; // undefined = no resize
  minSizeBytes: number; // skip files below this size
  dryRun: boolean;
  keepBackup: boolean;
}

interface OptimizeResult {
  filePath: string;
  originalSize: number;
  optimizedSize: number;
  skipped?: boolean;
  reason?: string;
}

const SUPPORTED_FORMATS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
}

const isImage = (file: string): boolean => SUPPORTED_FORMATS.includes(extname(file).toLowerCase());
// Backup/temp artefacts this tool produces — never optimize these.
const isArtefact = (file: string): boolean =>
  file.includes(".original.") || file.includes(".__opt__.");

/** Recursively collect image files under a directory. */
async function collectFromDir(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await collectFromDir(full)));
    } else if (isImage(entry.name) && !isArtefact(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

/** Default batch target: large images across all apps. */
async function collectAppsScan(baseDir: string): Promise<string[]> {
  const appsDir = join(baseDir, "apps");
  if (!existsSync(appsDir)) {
    console.error("❌ apps directory not found");
    return [];
  }
  const out: string[] = [];
  const apps = await readdir(appsDir);
  for (const app of apps) {
    for (const sub of ["screenshots", "gallery", "features"]) {
      const target = join(appsDir, app, "public", "assets", sub);
      if (!existsSync(target)) continue;
      try {
        const files = await readdir(target);
        for (const file of files) {
          if (isImage(file) && !isArtefact(file)) out.push(join(target, file));
        }
      } catch (error) {
        console.warn(`⚠️  Cannot read ${target}:`, error);
      }
    }
  }
  return out;
}

async function optimizeImage(filePath: string, options: OptimizeOptions): Promise<OptimizeResult> {
  if (!existsSync(filePath)) {
    return {
      filePath,
      originalSize: 0,
      optimizedSize: 0,
      skipped: true,
      reason: "File not found",
    };
  }

  const stats = await stat(filePath);
  const originalSize = stats.size;

  if (originalSize < options.minSizeBytes) {
    return {
      filePath,
      originalSize,
      optimizedSize: originalSize,
      skipped: true,
      reason: `File already small enough (< ${Math.round(options.minSizeBytes / 1024)}KB)`,
    };
  }

  if (options.dryRun) {
    return { filePath, originalSize, optimizedSize: 0, skipped: true, reason: "Dry run mode" };
  }

  try {
    const metadata = await sharp(filePath).metadata();
    const outputFormat: ImgFormat = options.format ?? (metadata.format as ImgFormat);

    // Already optimal: within target width and already in a modern format we'd keep.
    if (
      options.width &&
      metadata.width &&
      metadata.width <= options.width &&
      (metadata.format === "webp" || metadata.format === "avif") &&
      outputFormat === metadata.format
    ) {
      return {
        filePath,
        originalSize,
        optimizedSize: originalSize,
        skipped: true,
        reason: "Already optimized format and size",
      };
    }

    const ext = extname(filePath);
    const base = basename(filePath, ext);
    const dir = dirname(filePath);

    if (options.keepBackup) {
      const backupPath = join(dir, `${base}.original${ext}`);
      if (!existsSync(backupPath)) await copyFile(filePath, backupPath);
    }

    const outputExt = outputFormat === "jpeg" ? "jpg" : outputFormat;
    const finalPath = join(dir, `${base}.${outputExt}`);
    // Always write to a temp file first so we never read+write the same path.
    const tempPath = join(dir, `${base}.__opt__.${outputExt}`);

    let instance = sharp(filePath);
    if (options.width) {
      instance = instance.resize(options.width, null, { withoutEnlargement: true, fit: "inside" });
    }
    switch (outputFormat) {
      case "webp":
        instance = instance.webp({ quality: options.quality });
        break;
      case "jpeg":
        instance = instance.jpeg({ quality: options.quality });
        break;
      case "avif":
        instance = instance.avif({ quality: options.quality });
        break;
      case "png":
        instance = instance.png({ quality: options.quality, compressionLevel: 9 });
        break;
    }
    await instance.toFile(tempPath);

    // Drop the source if its path differs from the final output, then move temp into place.
    if (filePath !== finalPath) await unlink(filePath);
    await rename(tempPath, finalPath);

    const optimizedSize = (await stat(finalPath)).size;
    return { filePath: finalPath, originalSize, optimizedSize };
  } catch (error) {
    console.error(`❌ Optimization failed ${filePath}:`, error);
    return {
      filePath,
      originalSize,
      optimizedSize: originalSize,
      skipped: true,
      reason: `Error: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

interface ParsedArgs {
  target?: string; // file or directory
  options: OptimizeOptions;
  explicit: { width: boolean; format: boolean; minSize: boolean };
}

function parseArgs(args: string[]): ParsedArgs {
  const options: OptimizeOptions = {
    quality: 90,
    dryRun: false,
    keepBackup: true,
    minSizeBytes: 0,
  };
  const explicit = { width: false, format: false, minSize: false };
  let target: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--width":
      case "-w":
        options.width = Number.parseInt(args[++i], 10);
        explicit.width = true;
        break;
      case "--quality":
      case "-q":
        options.quality = Number.parseInt(args[++i], 10);
        break;
      case "--format":
      case "-f":
        options.format = args[++i] as ImgFormat;
        explicit.format = true;
        break;
      case "--min-size":
        options.minSizeBytes = Number.parseInt(args[++i], 10) * 1024;
        explicit.minSize = true;
        break;
      case "--dry-run":
      case "-d":
        options.dryRun = true;
        break;
      case "--no-backup":
        options.keepBackup = false;
        break;
      default:
        if (!arg.startsWith("-") && target === undefined) target = resolve(arg);
        break;
    }
  }

  return { target, options, explicit };
}

async function main() {
  const { target, options, explicit } = parseArgs(process.argv.slice(2));

  // Resolve the work list and mode-specific defaults.
  let files: string[];
  let mode: string;

  if (target && existsSync(target) && (await stat(target)).isFile()) {
    // Single-file mode: keep dimensions & format unless told otherwise; no size floor.
    mode = "single file";
    files = [target];
  } else if (target && existsSync(target)) {
    // Directory mode: bulk web optimization defaults.
    mode = `directory ${target}`;
    if (!explicit.width) options.width = 1600;
    if (!explicit.format) options.format = "webp";
    if (!explicit.minSize) options.minSizeBytes = 500 * 1024;
    files = await collectFromDir(target);
  } else if (target) {
    console.error(`❌ Path not found: ${target}`);
    process.exit(1);
  } else {
    // Default batch: scan all apps.
    mode = "apps/* scan";
    if (!explicit.width) options.width = 1600;
    if (!explicit.format) options.format = "webp";
    if (!explicit.minSize) options.minSizeBytes = 500 * 1024;
    files = await collectAppsScan(process.cwd());
  }

  console.log("🖼️  Optimize Images\n");
  console.log("Configuration:");
  console.log(`  - Mode: ${mode}${options.dryRun ? " (preview)" : ""}`);
  console.log(`  - Resize width: ${options.width ? `${options.width}px` : "keep original"}`);
  console.log(`  - Output format: ${options.format?.toUpperCase() ?? "keep original"}`);
  console.log(`  - Quality: ${options.quality}%`);
  console.log(`  - Skip below: ${Math.round(options.minSizeBytes / 1024)}KB`);
  console.log(`  - Backup originals: ${options.keepBackup ? "Yes" : "No"}\n`);

  if (files.length === 0) {
    console.log("✅ No image files found to optimize");
    return;
  }
  console.log(`📦 ${files.length} image file(s)\n`);

  let processed = 0;
  let skipped = 0;
  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const result = await optimizeImage(file, options);
    totalOriginal += result.originalSize;
    if (result.skipped) {
      skipped++;
      console.log(`⏭️  Skipped: ${file} — ${result.reason}`);
    } else {
      processed++;
      totalOptimized += result.optimizedSize;
      const saved = result.originalSize - result.optimizedSize;
      const pct = ((saved / result.originalSize) * 100).toFixed(1);
      console.log(
        `✅ ${result.filePath}  ${formatBytes(result.originalSize)} → ${formatBytes(result.optimizedSize)} (saved ${pct}%)`,
      );
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("📊 Summary");
  console.log("=".repeat(60));
  console.log(`Files: ${files.length} | Optimized: ${processed} | Skipped: ${skipped}`);
  if (processed > 0) {
    const saved = totalOriginal - totalOptimized;
    const pct = ((saved / (totalOriginal || 1)) * 100).toFixed(1);
    console.log(`Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)}`);
    console.log(`Saved: ${formatBytes(saved)} (${pct}%)`);
  }
  console.log(`${"=".repeat(60)}\n`);

  if (options.dryRun) {
    console.log("💡 Preview mode — no files modified. Remove --dry-run to apply.");
  } else if (options.keepBackup) {
    console.log("✨ Done. Originals backed up with .original suffix (git-ignored).");
  } else {
    console.log("✨ Done. Originals replaced (no backup).");
  }
}

main().catch((error) => {
  console.error("❌ Execution failed:", error);
  process.exit(1);
});
