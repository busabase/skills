#!/usr/bin/env node
/**
 * render-and-upload-all.mjs
 * Render all (or filtered) compositions in videos/buda and upload to R2.
 * Skips upload if remote MD5 matches local file.
 * Continues on failure.
 *
 * Options:
 *   --lang <lang>         Only process compositions matching this language suffix
 *                         e.g. --lang zh-CN  →  only *-zh-CN compositions
 *                              --lang en     →  only compositions with no lang suffix
 *   --concurrency <n>     Number of parallel renders (default: 1)
 *   --dry-run             Print what would happen without rendering or uploading
 *   --composition <id>    Only process a single composition by ID
 */

import { execSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveLangAndSlug } from "./buda-video-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_DIR = path.resolve(__dirname, "../../../../videos/buda");
const UPLOAD_SCRIPT = path.resolve(__dirname, "../../../skills/cdn-upload/scripts/upload.mjs");

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const filterLang = get("--lang");
const concurrency = Math.max(1, parseInt(get("--concurrency") ?? "1", 10));
const dryRun = hasFlag("--dry-run");
const singleComposition = get("--composition");

// ── Composition list ──────────────────────────────────────────────────────────
const ALL_COMPOSITIONS = [
  "buda-intro-general",
  "buda-intro-general-zh-CN",
  "buda-intro-general-ja",
  "buda-intro-general-pt",
  "buda-intro-general-zh-TW",
  "buda-intro-kelly",
  "buda-intro-kelly-en",
  "buda-sales-old",
  "buda-sales",
  "buda-sales-zh-CN",
  "buda-sales-ja",
  "buda-bp",
  "buda-bp-zh-CN",
  "buda-intro-ecommerce",
  "buda-intro-ecommerce-zh-CN",
  "buda-intro-ecommerce-ja",
  "buda-intro-ecommerce-zh-TW",
  "buda-intro-ecommerce-pt",
  "buda-intro-seo",
  "buda-onboarding-zh-CN",
  "buda-onboarding",
  "buda-onboarding-wechat-zh-CN",
  "buda-onboarding-wechat",
  "buda-onboarding-wechat-zh-TW",
  "buda-reward-zh-CN",
  "buda-reward",
  "buda-intro-finance-investment",
  "buda-intro-finance-investment-zh-CN",
  "buda-intro-finance-investment-zh-TW",
  "buda-intro-finance-investment-ja",
  "buda-producthunt",
  "buda-producthunt-zh-CN",
  "sandock-producthunt",
  "sandock-producthunt-zh-CN",
  // buda-intro-creator (added 2026-04-20)
  "buda-intro-creator",
  "buda-intro-creator-zh-CN",
  "buda-intro-creator-zh-TW",
  "buda-intro-creator-ja",
  "buda-intro-creator-pt",
  // buda-influencer (added 2026-05-06, no BGM, for third-party influencer use)
  "influencer-thread-01-zh-CN",
  "influencer-thread-01-en",
  "influencer-thread-02-zh-CN",
  "influencer-thread-02-en",
  "influencer-thread-03-zh-CN",
  "influencer-thread-03-en",
  "influencer-thread-04-zh-CN",
  "influencer-thread-04-en",
  "influencer-thread-05-zh-CN",
  "influencer-thread-05-en",
  "influencer-thread-06-zh-CN",
  "influencer-thread-06-en",
  "influencer-thread-07-zh-CN",
  "influencer-thread-07-en",
  "influencer-thread-07-hr-recruiting-zh-CN",
  "influencer-thread-07-hr-recruiting-en",
  "influencer-thread-07-hr-invoice-zh-CN",
  "influencer-thread-07-hr-invoice-en",
  "influencer-thread-07-sales-leads-zh-CN",
  "influencer-thread-07-sales-leads-en",
  "influencer-thread-08-zh-CN",
  "influencer-thread-08-en",
];

function getLangSuffix(id) {
  return resolveLangAndSlug(id).lang;
}

// ── Filter compositions ───────────────────────────────────────────────────────
let COMPOSITIONS = ALL_COMPOSITIONS;

if (singleComposition) {
  COMPOSITIONS = ALL_COMPOSITIONS.filter((id) => id === singleComposition);
  if (COMPOSITIONS.length === 0) {
    console.error(`Composition not found: ${singleComposition}`);
    console.error(`Available: ${ALL_COMPOSITIONS.join(", ")}`);
    process.exit(1);
  }
} else if (filterLang) {
  COMPOSITIONS = ALL_COMPOSITIONS.filter((id) => getLangSuffix(id) === filterLang);
  if (COMPOSITIONS.length === 0) {
    console.error(`No compositions found for lang: ${filterLang}`);
    console.error(`Valid langs: en, zh-CN, zh-TW, ja, pt`);
    process.exit(1);
  }
  console.log(`Filtering to lang="${filterLang}": ${COMPOSITIONS.length} compositions`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function needsRender(id, outFile) {
  if (!fs.existsSync(outFile)) return true;
  const outMtime = fs.statSync(outFile).mtimeMs;
  const { slug } = resolveLangAndSlug(id);
  const srcDir = path.join(VIDEO_DIR, "src", slug);
  if (!fs.existsSync(srcDir)) return false;
  return fs.readdirSync(srcDir, { recursive: true }).some((f) => {
    const full = path.join(srcDir, f);
    return fs.statSync(full).isFile() && fs.statSync(full).mtimeMs > outMtime;
  });
}

function renderComposition(id, _outFile) {
  const r = spawnSync(
    "npx",
    [
      "remotion",
      "render",
      id,
      "--output",
      `out/${id}.mp4`,
      "--concurrency",
      "100%",
      // Force yuv420p (limited range) to avoid yuvj420p (JPEG full-range).
      // yuvj420p causes white/washed-out video on Windows Media Player, Edge,
      // and some macOS decoders that don't handle full-range color correctly.
      "--pixel-format",
      "yuv420p",
    ],
    { cwd: VIDEO_DIR, stdio: "inherit" },
  );
  return r.status === 0;
}

function uploadToR2(id, outFile) {
  const r2Key = `videos/buda/${id}.mp4`;
  const out = execSync(`node ${UPLOAD_SCRIPT} --file ${outFile} --key ${r2Key}`, {
    encoding: "utf8",
  });
  console.log(out.trim());
  return out.includes("Skipped") ? "skipped" : "uploaded";
}

// ── Process a single composition ──────────────────────────────────────────────
async function processOne(id, index, total) {
  const outFile = path.join(VIDEO_DIR, "out", `${id}.mp4`);
  const prefix = `[${index + 1}/${total}] ${id}`;

  if (dryRun) {
    const shouldRender = needsRender(id, outFile);
    console.log(
      `${prefix} → ${shouldRender ? "WOULD RENDER + UPLOAD" : "WOULD SKIP (source unchanged)"}`,
    );
    return { id, result: "dry-run" };
  }

  console.log(`\n${prefix}`);

  // Render
  if (needsRender(id, outFile)) {
    console.log(`  → Rendering...`);
    const ok = renderComposition(id, outFile);
    if (!ok) {
      console.error(`  ✗ Render failed`);
      return { id, result: "failed", stage: "render" };
    }
  } else {
    console.log(`  → Already rendered, source unchanged, skipping render.`);
  }

  // Upload
  try {
    console.log(`  → Uploading to R2...`);
    const uploadResult = uploadToR2(id, outFile);
    console.log(`  ✓ ${uploadResult}`);
    return { id, result: uploadResult };
  } catch (e) {
    console.error(`  ✗ Upload failed: ${e.message}`);
    return { id, result: "failed", stage: "upload" };
  }
}

// ── Concurrent runner ─────────────────────────────────────────────────────────
async function runWithConcurrency(items, fn, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i, items.length);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────
if (dryRun) {
  console.log(`[DRY RUN] Would process ${COMPOSITIONS.length} compositions\n`);
}

if (concurrency > 1) {
  console.log(`Running with concurrency=${concurrency}`);
}

const allResults = await runWithConcurrency(COMPOSITIONS, processOne, concurrency);

// ── Summary ───────────────────────────────────────────────────────────────────
if (!dryRun) {
  const uploaded = allResults.filter((r) => r.result === "uploaded");
  const skipped = allResults.filter((r) => r.result === "skipped");
  const failed = allResults.filter((r) => r.result === "failed");

  console.log(`\n${"=".repeat(60)}`);
  console.log(
    `Done: ${uploaded.length} uploaded, ${skipped.length} skipped, ${failed.length} failed`,
  );
  if (failed.length) {
    console.log(`Failed:\n  ${failed.map((r) => `${r.id} (${r.stage})`).join("\n  ")}`);
  }
} else {
  const wouldRender = allResults.filter((r) => r.result === "dry-run");
  console.log(`\n[DRY RUN] ${wouldRender.length} compositions checked.`);
}
