#!/usr/bin/env node
/**
 * create-mdx.mjs
 * Generate a MDX skeleton for a video composition.
 * Creates the file if it doesn't exist; updates frontmatter if it does.
 *
 * Usage:
 *   node create-mdx.mjs \
 *     --composition buda-intro-general-zh-CN \
 *     --title "用 Buda AI 提升工作效率" \
 *     --description "一分钟了解 Buda AI 如何帮你自动化日常任务" \
 *     --tags "buda,ai,效率,自动化" \
 *     --duration "1:23" \
 *     --video-url "https://cdn.buda.ai/videos/buda/buda-intro-general-zh-CN.mp4" \
 *     [--youtube-id dQw4w9WgXcQ] \
 *     [--app-dir apps/buda]
 */

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

const composition = get("--composition");
const title = get("--title");
const description = get("--description") ?? "";
const tagsRaw = get("--tags") ?? "";
const duration = get("--duration") ?? "0:00";
const videoUrl = get("--video-url") ?? "";
const youtubeId = get("--youtube-id") ?? "";
const playlistId = get("--playlist-id") ?? "";
const appDir = get("--app-dir") ?? "apps/buda";

if (!composition) {
  console.error("Usage: node create-mdx.mjs --composition <id> [options]");
  console.error("  --composition  Remotion composition ID (required)");
  console.error("  --title        Video title");
  console.error("  --description  Short description (125 chars max for YouTube)");
  console.error("  --tags         Comma-separated tags");
  console.error("  --duration     Video duration e.g. 1:23");
  console.error("  --video-url    R2 public URL of the mp4");
  console.error("  --youtube-id   YouTube video ID (if uploaded)");
  console.error("  --playlist-id  YouTube playlist ID (e.g. PLxxxxxxx)");
  console.error("  --app-dir      App directory (default: apps/buda)");
  process.exit(1);
}

// ── Resolve language and slug ─────────────────────────────────────────────────
const LANG_SUFFIXES = ["zh-CN", "zh-TW", "ja", "pt"];

function resolveLangAndSlug(id) {
  for (const lang of LANG_SUFFIXES) {
    if (id.endsWith(`-${lang}`)) {
      return { lang, slug: id.slice(0, -(lang.length + 1)) };
    }
  }
  if (id.endsWith("-en")) {
    return { lang: "en", slug: id.slice(0, -3) };
  }
  return { lang: "en", slug: id };
}

const { lang, slug } = resolveLangAndSlug(composition);
const today = new Date().toISOString().slice(0, 10);
const tags = tagsRaw
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);

// ── Resolve output path ───────────────────────────────────────────────────────
const projectRoot = path.resolve(__dirname, "../../../../");
const mdxDir = path.join(projectRoot, appDir, "content", "videos", lang);
const mdxFile = path.join(mdxDir, `${slug}.mdx`);

// ── Build frontmatter ─────────────────────────────────────────────────────────
function buildFrontmatter() {
  const lines = [
    "---",
    `title: "${(title ?? composition).replace(/"/g, '\\"')}"`,
    `description: "${description.replace(/"/g, '\\"')}"`,
    `videoUrl: "${videoUrl}"`,
  ];
  if (youtubeId) lines.push(`youtubeId: "${youtubeId}"`);
  if (playlistId) lines.push(`playlistId: "${playlistId}"`);
  lines.push(`duration: "${duration}"`);
  lines.push(`lang: ${lang}`);
  lines.push(`publishedAt: "${today}"`);
  if (tags.length > 0) {
    lines.push("tags:");
    for (const tag of tags) lines.push(`  - ${tag}`);
  }
  lines.push("");
  lines.push("# Google Ads 配置（投放前填写，不投放则保持 enabled: false）");
  lines.push("ads:");
  lines.push("  enabled: false");
  lines.push("  dailyBudget: 5");
  lines.push("  targetCPV: 0.02");
  lines.push("  regions:");
  lines.push("    - TW");
  lines.push("    - HK");
  lines.push("    - SG");
  lines.push(`  language: ${lang}`);
  lines.push("  landingPage: https://buda.ai");
  lines.push('  campaignId: ""');
  lines.push('  adGroupId: ""');
  lines.push('  adId: ""');
  lines.push("---");
  return lines.join("\n");
}

// ── Build MDX body ────────────────────────────────────────────────────────────
function buildBody() {
  const videoEmbed = videoUrl
    ? `<video width="100%" controls style={{ aspectRatio: "16/9" }}>
  <source src="${videoUrl}" type="video/mp4" />
</video>
<a href="${videoUrl}" download style={{ display: "inline-block", marginTop: "8px", fontSize: "14px" }}>⬇ Download</a>`
    : `{/* VIDEO_PLACEHOLDER */}`;

  const youtubeEmbed = youtubeId
    ? `\n\n<iframe
  width="100%"
  style={{ aspectRatio: "16/9" }}
  src="https://www.youtube.com/embed/${youtubeId}"
  title="${(title ?? composition).replace(/"/g, '\\"')}"
  allowFullScreen
/>`
    : "";

  return `
${videoEmbed}${youtubeEmbed}

## ${title ?? composition}

${description}

## What You'll Learn

- <!-- TODO: Specific outcome 1 -->
- <!-- TODO: Specific outcome 2 -->
- <!-- TODO: Specific outcome 3 -->

## Timestamps

- 0:00 — Introduction
- <!-- TODO: Add more timestamps -->

## Links

- Get started free: https://buda.ai
- Documentation: https://buda.ai/docs
- Discord community: https://discord.gg/ZwGYvmqAb4

## YouTube SEO Copy

> Copy-paste when uploading to YouTube.

**Title:**
${title ?? composition}

**Description:**
${description}

<!-- TODO: Expand description with 3-5 paragraphs, CTAs, links, hashtags -->

**Tags (comma-separated):**
${tags.join(", ")}

**Hashtags:**
#Buda #AIAgent #ProductivityTools

**Thumbnail text suggestion:**
<!-- TODO: 3-6 words, high contrast -->

**Category:** Science & Technology
**Language:** ${lang}
**Audience:** Not made for kids
`;
}

// ── Write or update file ──────────────────────────────────────────────────────
fs.mkdirSync(mdxDir, { recursive: true });

if (fs.existsSync(mdxFile)) {
  // Update frontmatter only — preserve existing body
  const existing = fs.readFileSync(mdxFile, "utf8");
  const fmEnd = existing.indexOf("---", 3);
  if (fmEnd === -1) {
    console.error("Could not parse existing frontmatter. Aborting to avoid data loss.");
    process.exit(1);
  }
  const existingBody = existing.slice(fmEnd + 3);
  const updated = buildFrontmatter() + existingBody;
  fs.writeFileSync(mdxFile, updated);
  console.log(`Updated frontmatter: ${mdxFile}`);
} else {
  const content = `${buildFrontmatter()}\n${buildBody()}`;
  fs.writeFileSync(mdxFile, content);
  console.log(`Created: ${mdxFile}`);
}

// ── Check meta.json ───────────────────────────────────────────────────────────
const metaFile = path.join(mdxDir, "meta.json");
if (fs.existsSync(metaFile)) {
  const meta = JSON.parse(fs.readFileSync(metaFile, "utf8"));
  const pages = meta.pages ?? [];
  if (!pages.includes(slug)) {
    console.log(`\n⚠️  Remember to add "${slug}" to ${path.relative(projectRoot, metaFile)}`);
  }
} else {
  console.log(
    `\n⚠️  No meta.json found at ${path.relative(projectRoot, metaFile)} — create it if needed`,
  );
}

console.log(`\nDone. Edit ${path.relative(projectRoot, mdxFile)} to fill in TODO sections.`);
