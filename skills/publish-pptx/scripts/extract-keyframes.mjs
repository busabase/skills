#!/usr/bin/env node
/**
 * extract-keyframes.mjs
 * Parse a Remotion composition's main TSX file to extract the timeline `S` constant
 * and compute keyframe numbers for still extraction.
 *
 * Strategy:
 *   - Include all timeline entries except terminal markers ("videoEnd" / "end")
 *   - Duration is inferred from the NEXT timeline key (or durationInFrames fallback)
 *   - Long sequences (>= FRAMES_PER_SLIDE) get multiple frames, evenly distributed
 *   - Frames are sampled from the 70–90% window of each sequence to avoid
 *     early fade-in transitions and ensure content is fully visible
 *
 * Usage:
 *   node extract-keyframes.mjs --composition buda-intro-general [--video-dir videos/buda]
 *
 * Output (JSON to stdout):
 *   [{ "name": "01-coding-demo", "frame": 1040 }, ...]
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag, def = null) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : def;
};

const composition = get("--composition");
const videoDir = get("--video-dir", path.resolve(__dirname, "../../../../videos/buda"));

if (!composition) {
  console.error("Usage: node extract-keyframes.mjs --composition <id> [--video-dir <path>]");
  process.exit(1);
}

// ── Find main TSX file ────────────────────────────────────────────────────────
// Composition ID is kebab-case, directory name matches
const srcDir = path.join(videoDir, "src", composition);

if (!fs.existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`);
  process.exit(1);
}

// Find the main component file (PascalCase .tsx, not starting with _ or shared)
const tsxFiles = fs
  .readdirSync(srcDir)
  .filter((f) => f.endsWith(".tsx") && !f.startsWith("_") && f !== "index.tsx");

if (tsxFiles.length === 0) {
  console.error(`No TSX files found in: ${srcDir}`);
  process.exit(1);
}

// Prefer the file whose name matches the composition (PascalCase conversion)
const compositionPascal = composition
  .split("-")
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
  .join("");

const mainFile = tsxFiles.find((f) => f.replace(".tsx", "") === compositionPascal) ?? tsxFiles[0];

const tsxPath = path.join(srcDir, mainFile);
const source = fs.readFileSync(tsxPath, "utf-8");

// ── Extract `S` constant ──────────────────────────────────────────────────────
// Match: const S = { key: number, ... }
// Handles multi-line, comments, trailing commas
const sBlockMatch = source.match(/const\s+S\s*=\s*\{([^}]+)\}/s);

if (!sBlockMatch) {
  console.error(`Could not find timeline constant 'S' in: ${tsxPath}`);
  process.exit(1);
}

const sBlock = sBlockMatch[1];

// Parse key: value pairs (skip comments)
const entries = [];
for (const line of sBlock.split("\n")) {
  const clean = line.replace(/\/\/.*$/, "").trim(); // strip inline comments
  const match = clean.match(/^(\w+)\s*:\s*(\d+)/);
  if (match) {
    entries.push({ key: match[1], frame: parseInt(match[2], 10) });
  }
}

if (entries.length === 0) {
  console.error("No timeline entries found in S constant");
  process.exit(1);
}

// ── Compute keyframes ─────────────────────────────────────────────────────────
// Every sequence gets at least one frame.
// Long sequences (>= FRAMES_PER_SLIDE) get multiple frames, evenly distributed.
// All frames are taken from the latter portion of each sequence (70%+) so
// fade-in animations have fully completed and content is fully visible.

const FRAMES_PER_SLIDE = 150; // ~5s — one slide per this many frames
const CONTENT_START_PCT = 0.7; // start sampling at 70% into the sequence

const keyframes = [];
let idx = 0;

for (let i = 0; i < entries.length; i++) {
  const { key, frame: start } = entries[i];

  // Skip bare end markers (no visual content)
  if (key === "videoEnd" || key === "end") continue;

  // Infer duration from next entry
  const nextFrame = entries[i + 1]?.frame ?? start + 300;
  const duration = nextFrame - start;
  if (duration <= 0) continue;

  // How many slides for this sequence?
  const slideCount = Math.max(1, Math.round(duration / FRAMES_PER_SLIDE));

  // Sampling window: [70%, 90%] of the sequence
  const windowStart = Math.round(duration * CONTENT_START_PCT);
  const windowEnd = Math.round(duration * 0.9);
  const windowSize = Math.max(1, windowEnd - windowStart);

  for (let s = 0; s < slideCount; s++) {
    const offset =
      slideCount === 1
        ? windowStart + Math.round(windowSize * 0.5)
        : windowStart + Math.round((s / (slideCount - 1)) * windowSize);

    const keyframe = start + Math.min(offset, duration - 1);

    const suffix = slideCount > 1 ? `-${s + 1}` : "";
    const name = `${String(++idx).padStart(2, "0")}-${
      key
        .replace(/^demoLong/, "")
        .replace(/^demoShort/, "short-")
        .replace(/^demo/, "")
        .replace(/^scene/, "")
        .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
        .replace(/^-/, "")
        .replace(/-+/g, "-")
        .toLowerCase() || key
    }${suffix}`;

    keyframes.push({ name, key, frame: keyframe, start, duration, slideCount, slideIndex: s + 1 });
  }
}

// ── Output ────────────────────────────────────────────────────────────────────
console.log(JSON.stringify(keyframes, null, 2));
