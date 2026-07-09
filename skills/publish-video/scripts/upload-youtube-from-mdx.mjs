#!/usr/bin/env node
/**
 * upload-youtube-from-mdx.mjs
 * Upload a video to YouTube using metadata from an MDX frontmatter.
 *
 * Playlist resolution order:
 *   1. --playlist-id CLI arg
 *   2. MDX frontmatter `playlistId` field
 *   3. video-channels.json composition → playlist mapping (auto-lookup by composition ID)
 *
 * After upload:
 *   - Patches `youtubeId` in MDX frontmatter
 *   - Persists `playlistId` in MDX frontmatter if resolved from channels config
 *   - Old video is automatically retired (set to private) by upload-youtube.mjs
 *
 * Usage:
 *   node upload-youtube-from-mdx.mjs \
 *     --file out/buda-intro-general-zh-CN.mp4 \
 *     --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
 *     --composition buda-intro-general-zh-CN \
 *     [--privacy unlisted] \
 *     [--playlist-id PLxxxxxxx] \
 *     [--no-retire] \
 *     [--force]
 */

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const filePath = get("--file");
const mdxPath = get("--mdx");
const compositionId = get("--composition");
const privacy = get("--privacy") ?? "unlisted";
const forceUpload = hasFlag("--force");
const noRetire = hasFlag("--no-retire");
const playlistIdOverride = get("--playlist-id");

if (!filePath || !mdxPath) {
  console.error(
    [
      "Usage: node upload-youtube-from-mdx.mjs",
      "  --file <mp4>",
      "  --mdx <mdx>",
      "  [--composition <id>]     used for auto playlist lookup from video-channels.json",
      "  [--privacy unlisted]",
      "  [--playlist-id PLxxx]    overrides MDX frontmatter and channels config",
      "  [--no-retire]            keep old video public after re-upload",
      "  [--force]                re-upload even if MD5 unchanged",
    ].join("\n"),
  );
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`Video file not found: ${filePath}`);
  process.exit(1);
}
if (!fs.existsSync(mdxPath)) {
  console.error(`MDX file not found: ${mdxPath}`);
  process.exit(1);
}

// ── Load channels config ──────────────────────────────────────────────────────
const CHANNELS_FILE = path.resolve(__dirname, "../video-channels.json");

function loadChannels() {
  if (!fs.existsSync(CHANNELS_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(CHANNELS_FILE, "utf8"));
  } catch {
    return null;
  }
}

function resolvePlaylistFromChannels(channels, composition) {
  if (!channels || !composition) return null;
  const playlistKey = channels.compositions?.[composition];
  if (!playlistKey) return null;
  const playlist = channels.playlists?.[playlistKey];
  if (!playlist?.id) {
    console.log(`  ⚠️  Playlist "${playlistKey}" has no id set in video-channels.json`);
    return null;
  }
  return { id: playlist.id, key: playlistKey, title: playlist.title };
}

// ── Parse MDX frontmatter ─────────────────────────────────────────────────────
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  const lines = match[1].split("\n");
  let currentKey = null;
  let inArray = false;
  let arrayValues = [];

  for (const line of lines) {
    if (inArray && line.startsWith("  - ")) {
      arrayValues.push(line.slice(4).trim());
      continue;
    }
    if (inArray && !line.startsWith("  ")) {
      fm[currentKey] = arrayValues;
      inArray = false;
      arrayValues = [];
    }
    const kvMatch = line.match(/^(\w[\w-]*):\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const val = kvMatch[2].trim();
      if (val === "") {
        inArray = true;
        arrayValues = [];
      } else {
        fm[currentKey] = val.replace(/^["']|["']$/g, "");
        inArray = false;
      }
    }
  }
  if (inArray && currentKey) fm[currentKey] = arrayValues;
  return fm;
}

// ── Upsert frontmatter field ──────────────────────────────────────────────────
function upsertFrontmatterField(content, key, value) {
  const fmMatch = content.match(/^(---\n)([\s\S]*?)(\n---)/);
  if (!fmMatch) return content;

  const [full, open, body, close] = fmMatch;
  const rest = content.slice(full.length);
  const keyRegex = new RegExp(`^${key}:.*$`, "m");

  let newBody;
  if (keyRegex.test(body)) {
    newBody = body.replace(keyRegex, `${key}: "${value}"`);
  } else if (/^videoUrl:/m.test(body)) {
    newBody = body.replace(/^(videoUrl:.*$)/m, `$1\n${key}: "${value}"`);
  } else {
    newBody = `${body}\n${key}: "${value}"`;
  }

  return open + newBody + close + rest;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const mdxContent = fs.readFileSync(mdxPath, "utf8");
const fm = parseFrontmatter(mdxContent);
const channels = loadChannels();

const title = fm.title;
const description = fm.description ?? "";
const tags = Array.isArray(fm.tags) ? fm.tags.join(",") : (fm.tags ?? "");

if (!title) {
  console.error(`No title found in frontmatter of ${mdxPath}`);
  process.exit(1);
}

// Resolve playlist: CLI > MDX frontmatter > channels config
let resolvedPlaylistId = playlistIdOverride ?? fm.playlistId ?? null;
let resolvedPlaylistSource = playlistIdOverride ? "CLI" : fm.playlistId ? "MDX frontmatter" : null;

if (!resolvedPlaylistId && compositionId && channels) {
  const fromChannels = resolvePlaylistFromChannels(channels, compositionId);
  if (fromChannels) {
    resolvedPlaylistId = fromChannels.id;
    resolvedPlaylistSource = `video-channels.json → "${fromChannels.key}" (${fromChannels.title})`;
  }
}

console.log(`Reading metadata from: ${mdxPath}`);
console.log(`  Title:       ${title}`);
console.log(`  Description: ${description.slice(0, 80)}${description.length > 80 ? "…" : ""}`);
console.log(`  Tags:        ${tags || "(none)"}`);
console.log(
  `  Playlist:    ${resolvedPlaylistId ? `${resolvedPlaylistId} [${resolvedPlaylistSource}]` : "(none)"}`,
);
if (fm.youtubeId) {
  console.log(`  Current ID:  ${fm.youtubeId} (will be retired if content changed)`);
}
console.log();

// ── Upload ────────────────────────────────────────────────────────────────────
const uploadScript = path.resolve(__dirname, "upload-youtube.mjs");

const uploadArgs = [
  `node "${uploadScript}"`,
  `--file "${filePath}"`,
  `--title "${title.replace(/"/g, '\\"')}"`,
  `--description "${description.replace(/"/g, '\\"')}"`,
  `--tags "${tags}"`,
  `--privacy ${privacy}`,
  forceUpload ? "--force" : "",
  noRetire ? "--no-retire" : "",
]
  .filter(Boolean)
  .join(" ");

let output;
try {
  output = execSync(uploadArgs, { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] });
  console.log(output);
} catch (e) {
  console.error("Upload failed:", e.message);
  process.exit(1);
}

// ── Extract results ───────────────────────────────────────────────────────────
const videoIdMatch = output.match(/VIDEO_ID=([A-Za-z0-9_-]+)/);
const wasSkipped = output.includes("SKIPPED=true");
const retiredIdMatch = output.match(/RETIRED_ID=([A-Za-z0-9_-]+)/);

if (!videoIdMatch) {
  console.log("Could not extract VIDEO_ID — skipping MDX patch and playlist.");
  process.exit(0);
}

const videoId = videoIdMatch[1];

if (retiredIdMatch) {
  console.log(`\nOld video retired: ${retiredIdMatch[1]}`);
}

// ── Add to playlist ───────────────────────────────────────────────────────────
if (resolvedPlaylistId && !wasSkipped) {
  console.log(`\nAdding to playlist: ${resolvedPlaylistId}`);
  const playlistScript = path.resolve(__dirname, "add-to-playlist.mjs");
  try {
    const out = execSync(
      `node "${playlistScript}" --video-id ${videoId} --playlist-id ${resolvedPlaylistId}`,
      { encoding: "utf8" },
    );
    console.log(out.trim());
  } catch (e) {
    console.error(`⚠️  Failed to add to playlist: ${e.message}`);
    console.error(
      `Retry manually: node ${playlistScript} --video-id ${videoId} --playlist-id ${resolvedPlaylistId}`,
    );
  }
} else if (!resolvedPlaylistId) {
  console.log("\nNo playlist configured.");
  if (compositionId) {
    console.log(`  Add "${compositionId}" to video-channels.json compositions to auto-assign.`);
  } else {
    console.log("  Pass --composition <id> to enable auto playlist lookup.");
  }
}

// ── Patch MDX frontmatter ─────────────────────────────────────────────────────
let currentContent = fs.readFileSync(mdxPath, "utf8");

// Always update youtubeId
currentContent = upsertFrontmatterField(currentContent, "youtubeId", videoId);

// Persist playlistId if it was resolved from channels config (not already in MDX)
if (resolvedPlaylistId && !fm.playlistId && resolvedPlaylistSource !== "MDX frontmatter") {
  currentContent = upsertFrontmatterField(currentContent, "playlistId", resolvedPlaylistId);
  console.log(`\nPersisted playlistId="${resolvedPlaylistId}" into MDX frontmatter`);
}

fs.writeFileSync(mdxPath, currentContent);
console.log(`Updated youtubeId="${videoId}" in ${mdxPath}`);

if (wasSkipped) {
  console.log("(Upload was skipped — video content unchanged)");
}
