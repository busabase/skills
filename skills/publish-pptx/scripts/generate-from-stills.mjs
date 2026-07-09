#!/usr/bin/env node
/**
 * generate-from-stills.mjs
 * Build a PPTX from a directory of still-frame PNG images.
 * Each PNG becomes one slide (full-bleed image, no text overlay).
 *
 * Usage:
 *   node generate-from-stills.mjs \
 *     --composition buda-intro-general-zh-CN \
 *     --stills-dir videos/buda/out/stills/buda-intro-general-zh-CN \
 *     --output videos/buda/out/buda-intro-general-zh-CN.pptx
 */

import fs from "node:fs";
import path from "node:path";
import PptxGenJS from "pptxgenjs";

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const composition = get("--composition");
const stillsDir = get("--stills-dir");
const outputPath = get("--output");

if (!composition || !stillsDir || !outputPath) {
  console.error(
    "Usage: node generate-from-stills.mjs --composition <id> --stills-dir <dir> --output <file.pptx>",
  );
  process.exit(1);
}

if (!fs.existsSync(stillsDir)) {
  console.error(`Stills directory not found: ${stillsDir}`);
  process.exit(1);
}

// ── Collect frames ────────────────────────────────────────────────────────────
const frames = fs
  .readdirSync(stillsDir)
  .filter((f) => f.endsWith(".png"))
  .sort((a, b) => {
    // Sort numerically by frame number
    const numA = parseInt(a.replace(".png", ""), 10);
    const numB = parseInt(b.replace(".png", ""), 10);
    return numA - numB;
  })
  .map((f) => path.join(stillsDir, f));

if (frames.length === 0) {
  console.error(`No PNG frames found in: ${stillsDir}`);
  process.exit(1);
}

console.log(`📸 Found ${frames.length} frames in ${stillsDir}`);

// ── Build PPTX ────────────────────────────────────────────────────────────────
const pptx = new PptxGenJS();
pptx.layout = "LAYOUT_16x9"; // 10 x 5.625 inches
pptx.title = composition;
pptx.author = "publish-pptx skill";

for (let i = 0; i < frames.length; i++) {
  const framePath = frames[i];
  const slide = pptx.addSlide();

  // Full-bleed image — covers the entire slide
  slide.addImage({
    path: framePath,
    x: 0,
    y: 0,
    w: "100%",
    h: "100%",
    sizing: { type: "cover" },
  });

  console.log(`  Slide ${i + 1}/${frames.length}: ${path.basename(framePath)}`);
}

// ── Save ──────────────────────────────────────────────────────────────────────
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

await pptx.writeFile({ fileName: outputPath });

const sizeKB = (fs.statSync(outputPath).size / 1024).toFixed(1);
console.log(`\n✅ PPTX saved: ${outputPath} (${sizeKB} KB)`);
console.log(`PPTX_PATH=${outputPath}`);
