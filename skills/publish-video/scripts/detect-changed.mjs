#!/usr/bin/env node
/**
 * Detect Buda videos affected by the current git changes.
 *
 * Usage:
 *   node .agents/skills/publish-video/scripts/detect-changed.mjs
 *   node .agents/skills/publish-video/scripts/detect-changed.mjs --base origin/develop
 *   node .agents/skills/publish-video/scripts/detect-changed.mjs --json
 */

import fs from "node:fs";
import path from "node:path";
import {
  detectChangedVideos,
  formatBytes,
  getMdxPath,
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
const jsonMode = hasFlag("--json");

const plan = detectChangedVideos({ baseRef });

const enriched = plan.videos.map((video) => {
  const mdxPath = getMdxPath(video.id);
  const fm = readMdxFrontmatter(mdxPath) ?? {};
  const playlist = resolvePlaylist(video.id, fm);
  const outputExists = fs.existsSync(video.outputPath);
  const outputSize = outputExists ? fs.statSync(video.outputPath).size : null;

  return {
    ...video,
    title: fm.title ?? null,
    lang: fm.lang ?? null,
    videoUrl: fm.videoUrl ?? null,
    youtubeId: fm.youtubeId ?? null,
    playlist: playlist
      ? { id: playlist.id, title: playlist.title, source: playlist.source, key: playlist.key }
      : null,
    mdxExists: fs.existsSync(mdxPath),
    outputExists,
    outputSize,
  };
});

if (jsonMode) {
  console.log(JSON.stringify({ changedFiles: plan.changedFiles, videos: enriched }, null, 2));
  process.exit(0);
}

console.log(`Buda video change detection`);
console.log(`Changed files: ${plan.changedFiles.length}`);
if (baseRef) console.log(`Compared against: ${baseRef}`);
console.log();

if (enriched.length === 0) {
  console.log("No publishable Buda videos were detected from the current changes.");
  console.log("Tip: pass --base <ref> to inspect changes against a branch.");
  process.exit(0);
}

const renderUpload = enriched.filter((video) => video.action === "render-upload");
const metadata = enriched.filter((video) => video.action === "metadata");

if (renderUpload.length) {
  console.log(`Needs render + R2 upload + YouTube re-upload: ${renderUpload.length}`);
  for (const video of renderUpload) {
    console.log(`- ${video.id}`);
    console.log(`  MDX: ${path.relative(process.cwd(), video.mdxPath)}`);
    console.log(`  R2 key: ${video.r2Key}`);
    console.log(`  Playlist: ${video.playlist?.title ?? "missing"}`);
    console.log(`  MP4: ${video.outputExists ? formatBytes(video.outputSize) : "missing"}`);
    console.log(`  Reason: ${video.reasons.join(", ")}`);
  }
  console.log();
}

if (metadata.length) {
  console.log(`Metadata or playlist changed: ${metadata.length}`);
  for (const video of metadata) {
    console.log(`- ${video.id}`);
    console.log(`  MDX: ${path.relative(process.cwd(), video.mdxPath)}`);
    console.log(`  Playlist: ${video.playlist?.title ?? "missing"}`);
    console.log(`  Note: YouTube media upload will be skipped if MP4 MD5 did not change.`);
  }
  console.log();
}

console.log("Next step:");
console.log("  node .agents/skills/publish-video/scripts/validate.mjs --changed");
