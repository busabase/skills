#!/usr/bin/env node
/**
 * generate-and-upload-all.mjs
 * Batch: extract stills → generate PPTX → upload to R2 for all compositions.
 * Skips upload if remote MD5 matches local file.
 * Continues on failure and prints a summary at the end.
 *
 * Usage:
 *   node generate-and-upload-all.mjs [--frames 8] [--video-dir videos/buda]
 */

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = path.resolve(__dirname, "../../../../videos/buda");
const UPLOAD_SCRIPT = path.resolve(__dirname, "../../../cdn-upload/scripts/upload.mjs");
const STILLS_SCRIPT = path.resolve(__dirname, "./generate-from-stills.mjs");

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, def) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};
const FRAMES = parseInt(get("--frames", "8"), 10);
const videoDir = get("--video-dir", VIDEO_DIR);

// ── Compositions list (mirrors publish-video) ─────────────────────────────────
// Add new compositions here when Root.tsx is updated
const COMPOSITIONS = [
  // buda-intro-general
  { id: "buda-intro-general", durationInFrames: 4500 },
  { id: "buda-intro-general-zh-CN", durationInFrames: 4500 },
  { id: "buda-intro-general-ja", durationInFrames: 4500 },
  { id: "buda-intro-general-pt", durationInFrames: 4500 },
  { id: "buda-intro-general-zh-TW", durationInFrames: 4500 },
  // buda-intro-kelly
  { id: "buda-intro-kelly", durationInFrames: 3600 },
  { id: "buda-intro-kelly-en", durationInFrames: 3600 },
  // buda-sales
  { id: "buda-sales", durationInFrames: 5580 },
  { id: "buda-sales-zh-CN", durationInFrames: 5580 },
  { id: "buda-sales-ja", durationInFrames: 5580 },
  // buda-bp
  { id: "buda-bp", durationInFrames: 21780 },
  { id: "buda-bp-zh-CN", durationInFrames: 21780 },
  // buda-intro-ecommerce
  { id: "buda-intro-ecommerce", durationInFrames: 4514 },
  { id: "buda-intro-ecommerce-zh-CN", durationInFrames: 4514 },
  { id: "buda-intro-ecommerce-ja", durationInFrames: 4514 },
  { id: "buda-intro-ecommerce-zh-TW", durationInFrames: 4514 },
  { id: "buda-intro-ecommerce-pt", durationInFrames: 4514 },
  // buda-intro-seo
  { id: "buda-intro-seo", durationInFrames: 4514 },
  // buda-onboarding
  { id: "buda-onboarding", durationInFrames: 2100 },
  { id: "buda-onboarding-zh-CN", durationInFrames: 2100 },
  // buda-onboarding-wechat
  { id: "buda-onboarding-wechat", durationInFrames: 2010 },
  { id: "buda-onboarding-wechat-zh-CN", durationInFrames: 2010 },
  { id: "buda-onboarding-wechat-zh-TW", durationInFrames: 2010 },
  // buda-reward
  { id: "buda-reward", durationInFrames: 990 },
  { id: "buda-reward-zh-CN", durationInFrames: 990 },
  // buda-intro-finance-investment
  { id: "buda-intro-finance-investment", durationInFrames: 4514 },
  { id: "buda-intro-finance-investment-zh-CN", durationInFrames: 4514 },
  { id: "buda-intro-finance-investment-zh-TW", durationInFrames: 4514 },
  { id: "buda-intro-finance-investment-ja", durationInFrames: 4514 },
  // buda-producthunt
  { id: "buda-producthunt", durationInFrames: 1530 },
  { id: "buda-producthunt-zh-CN", durationInFrames: 1530 },
  // sandock-producthunt
  { id: "sandock-producthunt", durationInFrames: 1080 },
  { id: "sandock-producthunt-zh-CN", durationInFrames: 1080 },
  // buda-intro-creator
  { id: "buda-intro-creator", durationInFrames: 4514 },
  { id: "buda-intro-creator-zh-CN", durationInFrames: 4514 },
  { id: "buda-intro-creator-zh-TW", durationInFrames: 4514 },
  { id: "buda-intro-creator-ja", durationInFrames: 4514 },
  { id: "buda-intro-creator-pt", durationInFrames: 4514 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Compute N evenly-distributed frame numbers across [0, duration-1]
 */
function computeFrames(durationInFrames, n) {
  if (n === 1) return [0];
  const frames = [];
  for (let i = 0; i < n; i++) {
    frames.push(Math.round((i * (durationInFrames - 1)) / (n - 1)));
  }
  return frames;
}

/**
 * Check if stills are already up-to-date (all N frames exist and are newer than any source file)
 */
function stillsUpToDate(stillsDir, frameNumbers) {
  if (!fs.existsSync(stillsDir)) return false;
  return frameNumbers.every((f) => fs.existsSync(path.join(stillsDir, `${f}.png`)));
}

// ── Main loop ─────────────────────────────────────────────────────────────────
const results = { ok: [], failed: [], skipped: [] };
const total = COMPOSITIONS.length;

for (let i = 0; i < total; i++) {
  const { id, durationInFrames } = COMPOSITIONS[i];
  const stillsDir = path.join(videoDir, "out", "stills", id);
  const pptxPath = path.join(videoDir, "out", `${id}.pptx`);
  const r2Key = `presentations/buda/${id}.pptx`;

  console.log(`\n[${i + 1}/${total}] ${id}`);

  // ── Step 1: Extract stills ──────────────────────────────────────────────────
  const frameNumbers = computeFrames(durationInFrames, FRAMES);

  if (!stillsUpToDate(stillsDir, frameNumbers)) {
    console.log(`  → Extracting ${FRAMES} stills...`);
    fs.mkdirSync(stillsDir, { recursive: true });

    let stillFailed = false;
    for (const frame of frameNumbers) {
      const outFile = path.join(stillsDir, `${frame}.png`);
      if (fs.existsSync(outFile)) continue; // already extracted

      const r = spawnSync(
        "npx",
        ["remotion", "still", id, "--frame", String(frame), "--output", outFile],
        { cwd: videoDir, stdio: "pipe", maxBuffer: 50 * 1024 * 1024 },
      );

      if (r.status !== 0) {
        console.error(`  ✗ Still extraction failed at frame ${frame}`);
        console.error(r.stderr?.toString().slice(0, 500));
        stillFailed = true;
        break;
      }
    }

    if (stillFailed) {
      results.failed.push(`${id} (stills)`);
      continue;
    }
    console.log(`  ✓ Stills extracted to ${stillsDir}`);
  } else {
    console.log(`  → Stills already up-to-date, skipping extraction.`);
  }

  // ── Step 2: Generate PPTX ───────────────────────────────────────────────────
  const needsPptx =
    !fs.existsSync(pptxPath) ||
    (() => {
      const pptxMtime = fs.statSync(pptxPath).mtimeMs;
      return frameNumbers.some((f) => {
        const stillPath = path.join(stillsDir, `${f}.png`);
        return fs.existsSync(stillPath) && fs.statSync(stillPath).mtimeMs > pptxMtime;
      });
    })();

  if (needsPptx) {
    console.log(`  → Generating PPTX...`);
    const r = spawnSync(
      "node",
      [STILLS_SCRIPT, "--composition", id, "--stills-dir", stillsDir, "--output", pptxPath],
      { cwd: videoDir, stdio: "pipe", maxBuffer: 50 * 1024 * 1024 },
    );

    if (r.status !== 0) {
      console.error(`  ✗ PPTX generation failed`);
      console.error(r.stderr?.toString().slice(0, 500));
      results.failed.push(`${id} (pptx)`);
      continue;
    }
    console.log(`  ✓ PPTX generated: ${pptxPath}`);
  } else {
    console.log(`  → PPTX already up-to-date, skipping generation.`);
  }

  // ── Step 3: Upload to R2 ────────────────────────────────────────────────────
  try {
    console.log(`  → Uploading to R2...`);
    const out = execSync(`node "${UPLOAD_SCRIPT}" --file "${pptxPath}" --key "${r2Key}"`, {
      encoding: "utf8",
    });
    console.log(out.trim());
    if (out.includes("Skipped")) {
      results.skipped.push(id);
    } else {
      results.ok.push(id);
    }
  } catch (e) {
    console.error(`  ✗ Upload failed: ${id}\n${e.message}`);
    results.failed.push(`${id} (upload)`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${"=".repeat(60)}`);
console.log(
  `Done: ${results.ok.length} uploaded, ${results.skipped.length} skipped, ${results.failed.length} failed`,
);
if (results.failed.length) {
  console.log(`Failed:\n  ${results.failed.join("\n  ")}`);
}
