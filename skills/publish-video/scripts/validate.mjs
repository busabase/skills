#!/usr/bin/env node
/**
 * Validate Buda videos before publishing.
 *
 * Usage:
 *   node .agents/skills/publish-video/scripts/validate.mjs --composition buda-intro-general-zh-CN
 *   node .agents/skills/publish-video/scripts/validate.mjs --changed
 *   node .agents/skills/publish-video/scripts/validate.mjs --changed --strict
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  CHANNELS_FILE,
  detectChangedVideos,
  formatBytes,
  getMdxPath,
  getOutputPath,
  getPublishableCompositions,
  getR2Key,
  getRootCompositionIds,
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

const composition = get("--composition");
const validateChanged = hasFlag("--changed");
const strict = hasFlag("--strict");
const jsonMode = hasFlag("--json");

if (!composition && !validateChanged) {
  console.error("Usage: validate.mjs --composition <id> OR --changed");
  process.exit(1);
}

const publishable = getPublishableCompositions();
const rootIds = new Set(getRootCompositionIds());
const changedPlan = validateChanged ? detectChangedVideos() : null;
const targets = composition ? [composition] : changedPlan.videos.map((video) => video.id);

const youtubeConfigDir = path.join(os.homedir(), ".config", "youtube-upload");
const youtubeSecret = path.join(youtubeConfigDir, "client_secret.json");
const youtubeToken = path.join(youtubeConfigDir, "token.json");

function addIssue(list, level, message) {
  list.push({ level, message });
}

function validateOne(id) {
  const issues = [];
  const mdxPath = getMdxPath(id);
  const outputPath = getOutputPath(id);
  const fm = readMdxFrontmatter(mdxPath);
  const playlist = resolvePlaylist(id, fm ?? {});

  if (!publishable.includes(id)) {
    addIssue(issues, "error", "Composition is not mapped in video-channels.json.");
  }

  if (!rootIds.has(id)) {
    addIssue(issues, "error", "Composition ID was not found in videos/buda/src/Root.tsx.");
  }

  if (!fs.existsSync(mdxPath)) {
    addIssue(issues, "error", `MDX file is missing: ${path.relative(PROJECT_ROOT, mdxPath)}`);
  } else {
    const body = fs.readFileSync(mdxPath, "utf8");
    if (!fm?.title) addIssue(issues, "error", "MDX frontmatter is missing title.");
    if (!fm?.description) addIssue(issues, "error", "MDX frontmatter is missing description.");
    if (!fm?.videoUrl) addIssue(issues, "warning", "MDX frontmatter is missing videoUrl.");
    if (!fm?.duration) addIssue(issues, "warning", "MDX frontmatter is missing duration.");
    if (!Array.isArray(fm?.tags) || fm.tags.length === 0) {
      addIssue(issues, "warning", "MDX frontmatter has no tags.");
    }
    if (fm?.title && fm.title.length > 60) {
      addIssue(
        issues,
        "warning",
        `YouTube title is ${fm.title.length} chars; recommended max is 60.`,
      );
    }
    if (fm?.description && fm.description.length > 125) {
      addIssue(
        issues,
        "warning",
        `Description first line is ${fm.description.length} chars; recommended max is 125.`,
      );
    }
    if (body.includes("TODO") || body.includes("VIDEO_PLACEHOLDER")) {
      addIssue(
        issues,
        strict ? "error" : "warning",
        "MDX still contains TODO or VIDEO_PLACEHOLDER.",
      );
    }
  }

  if (!playlist?.id) {
    addIssue(issues, "error", "No YouTube playlist was resolved from MDX or video-channels.json.");
  }

  if (!fs.existsSync(outputPath)) {
    addIssue(
      issues,
      "warning",
      `Rendered MP4 is missing: ${path.relative(PROJECT_ROOT, outputPath)}`,
    );
  }

  return {
    id,
    mdxPath,
    outputPath,
    r2Key: getR2Key(id),
    playlist,
    outputSize: fs.existsSync(outputPath) ? fs.statSync(outputPath).size : null,
    issues,
  };
}

const results = targets.map(validateOne);

const globalIssues = [];
if (!fs.existsSync(CHANNELS_FILE)) {
  addIssue(globalIssues, "error", "video-channels.json is missing.");
}
if (!fs.existsSync(path.join(PROJECT_ROOT, ".agents/skills/cdn-upload/scripts/upload.mjs"))) {
  addIssue(globalIssues, "error", "R2 upload script is missing.");
}
if (!fs.existsSync(youtubeSecret)) {
  addIssue(globalIssues, "warning", `YouTube client_secret.json is missing: ${youtubeSecret}`);
}
if (!fs.existsSync(youtubeToken)) {
  addIssue(globalIssues, "warning", `YouTube token.json is missing: ${youtubeToken}`);
}

const hasErrors =
  globalIssues.some((issue) => issue.level === "error") ||
  results.some((result) => result.issues.some((issue) => issue.level === "error"));

if (jsonMode) {
  console.log(JSON.stringify({ globalIssues, results, hasErrors }, null, 2));
  process.exit(hasErrors ? 1 : 0);
}

console.log("Buda video publish validation");
console.log(`Targets: ${results.length}`);
console.log();

if (globalIssues.length) {
  console.log("Global checks:");
  for (const issue of globalIssues) {
    console.log(`- [${issue.level}] ${issue.message}`);
  }
  console.log();
}

if (results.length === 0) {
  console.log("No videos to validate.");
  process.exit(0);
}

for (const result of results) {
  const errors = result.issues.filter((issue) => issue.level === "error").length;
  const warnings = result.issues.filter((issue) => issue.level === "warning").length;
  const status = errors ? "BLOCKED" : warnings ? "WARN" : "OK";

  console.log(`${status} ${result.id}`);
  console.log(`  MDX: ${path.relative(PROJECT_ROOT, result.mdxPath)}`);
  console.log(`  MP4: ${result.outputSize === null ? "missing" : formatBytes(result.outputSize)}`);
  console.log(`  R2 key: ${result.r2Key}`);
  console.log(`  Playlist: ${result.playlist?.title ?? "missing"}`);
  for (const issue of result.issues) {
    console.log(`  - [${issue.level}] ${issue.message}`);
  }
  console.log();
}

if (hasErrors) {
  console.log("Validation failed. Fix the errors above before publishing.");
  process.exit(1);
}

console.log("Validation passed. Warnings can be reviewed before publishing.");
