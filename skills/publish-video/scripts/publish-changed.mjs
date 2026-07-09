#!/usr/bin/env node
/**
 * Publish Buda videos affected by current git changes.
 *
 * By default this prints a plan only. Pass --yes to render/upload to R2.
 * Pass --youtube to also run the YouTube upload flow after R2 upload.
 *
 * Usage:
 *   node .agents/skills/publish-video/scripts/publish-changed.mjs
 *   node .agents/skills/publish-video/scripts/publish-changed.mjs --yes
 *   node .agents/skills/publish-video/scripts/publish-changed.mjs --yes --youtube
 *   node .agents/skills/publish-video/scripts/publish-changed.mjs --yes --youtube --ads
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";
import {
  detectChangedVideos,
  getMdxPath,
  getOutputPath,
  PROJECT_ROOT,
  readMdxFrontmatter,
  resolvePlaylist,
} from "./buda-video-utils.mjs";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const baseRef = get("--base");
const yes = hasFlag("--yes");
const uploadYoutube = hasFlag("--youtube");
const createAds = hasFlag("--ads");
const skipValidate = hasFlag("--skip-validate");

const plan = detectChangedVideos({ baseRef });
const renderTargets = plan.videos.filter((video) => video.action === "render-upload");
const metadataTargets = plan.videos.filter((video) => video.action === "metadata");

function runNode(script, scriptArgs) {
  const result = spawnSync("node", [script, ...scriptArgs], {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
  return result.status === 0;
}

async function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`${question} `, resolve));
  rl.close();
  return ["y", "yes"].includes(String(answer).trim().toLowerCase());
}

console.log("Buda changed-video publish plan");
console.log(`Changed files: ${plan.changedFiles.length}`);
console.log(`Render/upload targets: ${renderTargets.length}`);
console.log(`Metadata-only targets: ${metadataTargets.length}`);
console.log();

for (const video of plan.videos) {
  const fm = readMdxFrontmatter(getMdxPath(video.id)) ?? {};
  const playlist = resolvePlaylist(video.id, fm);
  console.log(`- ${video.id} (${video.action})`);
  console.log(`  Playlist: ${playlist?.title ?? "missing"}`);
  console.log(`  Reason: ${video.reasons.join(", ")}`);
}

if (metadataTargets.length) {
  console.log();
  console.log("Note: metadata-only targets are listed for review.");
  console.log(
    "YouTube video files cannot be replaced, and this script only uploads media when MP4 changed.",
  );
}

if (!yes) {
  console.log();
  console.log("Plan only. Re-run with --yes to render and upload changed MP4s to R2.");
  console.log(
    "Add --youtube to upload new YouTube videos and retire old ones when content changed.",
  );
  process.exit(0);
}

if (renderTargets.length === 0) {
  console.log("No render/upload targets found.");
  process.exit(0);
}

if (!skipValidate) {
  const validateScript = path.join(
    PROJECT_ROOT,
    ".agents/skills/publish-video/scripts/validate.mjs",
  );
  const ok = runNode(validateScript, ["--changed"]);
  if (!ok) process.exit(1);
}

const shouldProceed = await confirm(
  `Proceed with ${renderTargets.length} R2 upload${uploadYoutube ? " plus YouTube upload" : ""}${createAds ? " plus Google Ads" : ""}? yes/no`,
);
if (!shouldProceed) {
  console.log("Stopped before publishing.");
  process.exit(0);
}

const renderScript = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/render-and-upload-all.mjs",
);
const youtubeScript = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/upload-youtube-from-mdx.mjs",
);
const adsScript = path.join(PROJECT_ROOT, ".agents/skills/ads/scripts/create-video-campaign.mjs");

const results = [];

for (const video of renderTargets) {
  console.log();
  console.log(`Publishing ${video.id}`);

  const r2Ok = runNode(renderScript, ["--composition", video.id]);
  if (!r2Ok) {
    results.push({ id: video.id, result: "failed", stage: "r2" });
    continue;
  }

  if (uploadYoutube) {
    const outFile = getOutputPath(video.id);
    const mdxFile = getMdxPath(video.id);
    if (!fs.existsSync(outFile) || !fs.existsSync(mdxFile)) {
      results.push({
        id: video.id,
        result: "failed",
        stage: "youtube",
        reason: "missing MP4 or MDX",
      });
      continue;
    }

    const youtubeOk = runNode(youtubeScript, [
      "--file",
      outFile,
      "--mdx",
      mdxFile,
      "--composition",
      video.id,
      "--privacy",
      "unlisted",
    ]);
    if (!youtubeOk) {
      results.push({ id: video.id, result: "failed", stage: "youtube" });
      continue;
    }

    // Create Google Ads campaign if --ads flag is set
    if (createAds) {
      console.log(`  Creating Google Ads campaign for ${video.id}...`);
      const adsOk = runNode(adsScript, ["--mdx", mdxFile]);
      if (!adsOk) {
        // Ads failure is non-fatal — video is already uploaded
        console.warn(`  ⚠️  Google Ads campaign creation failed for ${video.id}. Continuing.`);
      }
    }
  }

  results.push({ id: video.id, result: "published" });
}

console.log();
console.log("Publish summary");
console.log(`Success: ${results.filter((item) => item.result === "published").length}`);
console.log(`Failed: ${results.filter((item) => item.result === "failed").length}`);
for (const item of results.filter((result) => result.result === "failed")) {
  console.log(`- ${item.id}: ${item.stage}${item.reason ? ` (${item.reason})` : ""}`);
}
