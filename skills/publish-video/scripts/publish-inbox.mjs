#!/usr/bin/env node
/**
 * publish-inbox.mjs
 * Scan a folder for external video bundles and publish them through publish-bundle.mjs.
 *
 * Supported naming:
 *   intro-projects-en.mp4
 *   intro-projects-en.srt
 *   intro-projects-cover-en.jpg
 *
 * Usage:
 *   node publish-inbox.mjs --dir /path/to/Youtube --playlist use-cases --youtube
 *   node publish-inbox.mjs --dir /path/to/Youtube --playlist use-cases --youtube --yes
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const PUBLISH_BUNDLE_SCRIPT = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/publish-bundle.mjs",
);

const LANG_ALIASES = {
  en: "en",
  "zh-cn": "zh-CN",
  "zh-CN": "zh-CN",
  "zh-tw": "zh-TW",
  "zh-TW": "zh-TW",
  ja: "ja",
  pt: "pt",
};

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const inboxDir = get("--dir");
const playlist = get("--playlist") ?? "use-cases";
const playlistId = get("--playlist-id");
const privacy = get("--privacy") ?? "unlisted";
const shouldUploadYoutube = hasFlag("--youtube");
const yes = hasFlag("--yes");
const force = hasFlag("--force");
const noRetire = hasFlag("--no-retire");
const printMeta = hasFlag("--print-meta");

if (!inboxDir || !fs.existsSync(inboxDir) || !fs.statSync(inboxDir).isDirectory()) {
  console.error(
    "Usage: node publish-inbox.mjs --dir /path/to/Youtube [--playlist use-cases] [--youtube] [--yes]",
  );
  process.exit(1);
}

function normalizeLang(raw) {
  return LANG_ALIASES[raw] ?? null;
}

const LANG_PATTERN = Object.keys(LANG_ALIASES)
  .sort((a, b) => b.length - a.length) // longer variants first (e.g. zh-CN before zh)
  .join("|");
const VIDEO_FILE_RE = new RegExp(`^(.+)-(${LANG_PATTERN})\\.mp4$`);

function parseVideoFile(name) {
  const match = name.match(VIDEO_FILE_RE);
  if (!match) return null;
  return { slug: match[1], lang: normalizeLang(match[2]), file: name };
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.slice(0, 1).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeVideoMeta(videoMeta = {}, meta = {}, slug) {
  const publish = videoMeta.publish ?? {};
  const seo = videoMeta.seo ?? {};
  const fallbackTitle = videoMeta.title ?? meta.title ?? titleFromSlug(slug);
  const fallbackDescription = videoMeta.description ?? meta.description ?? "";
  const fallbackTags = videoMeta.tags ?? meta.tags ?? ["buda", "ai agents"];

  return {
    publish: {
      title: publish.title ?? fallbackTitle,
      description: publish.description ?? fallbackDescription,
      tags: publish.tags ?? fallbackTags,
      pinnedComment: publish.pinnedComment ?? videoMeta.pinnedComment ?? "",
      thumbnailText: publish.thumbnailText ?? videoMeta.thumbnailText ?? "",
      category: publish.category ?? videoMeta.category ?? meta.category ?? "Science & Technology",
    },
    seo: {
      title: seo.title ?? fallbackTitle,
      description: seo.description ?? fallbackDescription,
      summary: seo.summary ?? "",
      whatYouWillLearn: seo.whatYouWillLearn ?? [],
      timestamps: seo.timestamps ?? [],
      links: seo.links ?? [],
      hashtags: seo.hashtags ?? [],
    },
  };
}

function loadMeta(dir, slug) {
  const candidates = [`${slug}.meta.json`, "meta.json"];
  for (const candidate of candidates) {
    const file = path.join(dir, candidate);
    if (!fs.existsSync(file)) continue;
    try {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      console.warn(`Could not parse ${candidate}: ${err.message}`);
    }
  }
  return {};
}

function findFile(files, candidates) {
  for (const candidate of candidates) {
    if (files.includes(candidate)) return candidate;
  }
  return null;
}

const absDir = path.resolve(inboxDir);
const files = fs
  .readdirSync(absDir)
  .filter((file) => fs.statSync(path.join(absDir, file)).isFile());
const mp4s = files.flatMap((file) => {
  const parsed = parseVideoFile(file);
  return parsed?.lang ? [parsed] : [];
});

const bundles = mp4s.map(({ slug, lang, file }) => {
  const lowerLang = lang.toLowerCase();
  const caption = findFile(files, [`${slug}-${lang}.srt`, `${slug}-${lowerLang}.srt`]);
  const cover = findFile(files, [
    `${slug}-cover-${lang}.jpg`,
    `${slug}-cover-${lang}.jpeg`,
    `${slug}-cover-${lang}.png`,
    `${slug}-cover-${lowerLang}.jpg`,
    `${slug}-cover-${lowerLang}.jpeg`,
    `${slug}-cover-${lowerLang}.png`,
    `${slug}-${lang}-cover.jpg`,
    `${slug}-${lang}-cover.png`,
    `${slug}-${lowerLang}-cover.jpg`,
    `${slug}-${lowerLang}-cover.png`,
  ]);
  const meta = loadMeta(absDir, slug);
  const videoMeta = meta.videos?.[lang] ?? meta.videos?.[lowerLang] ?? {};
  const normalized = normalizeVideoMeta(videoMeta, meta, slug);
  return {
    slug,
    lang,
    mp4: path.join(absDir, file),
    caption: caption ? path.join(absDir, caption) : null,
    cover: cover ? path.join(absDir, cover) : null,
    title: normalized.publish.title,
    description: normalized.publish.description,
    tags: normalized.publish.tags,
    pinnedComment: normalized.publish.pinnedComment,
    thumbnailText: normalized.publish.thumbnailText,
    category: normalized.publish.category,
    seo: normalized.seo,
    playlist: videoMeta.playlist ?? meta.playlist ?? playlist,
    privacy: videoMeta.privacy ?? meta.privacy ?? privacy,
  };
});

if (!bundles.length) {
  console.log(`No video bundles found in ${absDir}`);
  console.log("Expected files like: intro-projects-en.mp4");
  process.exit(0);
}

console.log(`Found ${bundles.length} bundle${bundles.length === 1 ? "" : "s"} in ${absDir}:`);
for (const bundle of bundles) {
  console.log(`\n- ${bundle.slug}-${bundle.lang}`);
  console.log(`  mp4:   ${path.basename(bundle.mp4)}`);
  console.log(`  srt:   ${bundle.caption ? path.basename(bundle.caption) : "(missing)"}`);
  console.log(`  cover: ${bundle.cover ? path.basename(bundle.cover) : "(missing)"}`);
  console.log(`  title: ${bundle.title}`);
  if (bundle.pinnedComment) console.log(`  pinned: ${bundle.pinnedComment}`);
  if (bundle.thumbnailText) console.log(`  thumbnail: ${bundle.thumbnailText}`);
  console.log(`  playlist: ${bundle.playlist}`);
  console.log(`  privacy: ${bundle.privacy}`);
  if (printMeta) {
    console.log("  publish:");
    console.log(`    description: ${bundle.description}`);
    console.log(
      `    tags: ${Array.isArray(bundle.tags) ? bundle.tags.join(", ") : String(bundle.tags)}`,
    );
    console.log("  seo:");
    console.log(`    title: ${bundle.seo.title}`);
    console.log(`    description: ${bundle.seo.description}`);
  }
}

if (!yes) {
  console.log("\nPlan only. Re-run with --yes to publish these bundles.");
  process.exit(0);
}

for (const bundle of bundles) {
  console.log(`\nPublishing ${bundle.slug}-${bundle.lang}...`);
  const publishArgs = [
    PUBLISH_BUNDLE_SCRIPT,
    "--file",
    bundle.mp4,
    "--slug",
    bundle.slug,
    "--lang",
    bundle.lang,
    "--title",
    bundle.title,
    "--description",
    bundle.description,
    "--tags",
    Array.isArray(bundle.tags) ? bundle.tags.join(",") : String(bundle.tags),
    "--pinned-comment",
    bundle.pinnedComment,
    "--thumbnail-text",
    bundle.thumbnailText,
    "--category",
    bundle.category,
    "--seo-title",
    bundle.seo.title,
    "--seo-description",
    bundle.seo.description,
    "--seo-summary",
    bundle.seo.summary,
    "--seo-learn",
    Array.isArray(bundle.seo.whatYouWillLearn)
      ? bundle.seo.whatYouWillLearn.join("|")
      : String(bundle.seo.whatYouWillLearn ?? ""),
    "--seo-timestamps",
    Array.isArray(bundle.seo.timestamps)
      ? bundle.seo.timestamps
          .map((item) => (typeof item === "string" ? item : `${item.time} ${item.label}`))
          .join("|")
      : String(bundle.seo.timestamps ?? ""),
    "--seo-links",
    Array.isArray(bundle.seo.links) ? bundle.seo.links.join("|") : String(bundle.seo.links ?? ""),
    "--seo-hashtags",
    Array.isArray(bundle.seo.hashtags)
      ? bundle.seo.hashtags.join(" ")
      : String(bundle.seo.hashtags ?? ""),
    "--privacy",
    bundle.privacy,
    "--yes",
  ];
  if (bundle.caption) publishArgs.push("--caption", bundle.caption);
  if (bundle.cover) publishArgs.push("--cover", bundle.cover);
  if (playlistId) publishArgs.push("--playlist-id", playlistId);
  else if (bundle.playlist) publishArgs.push("--playlist", bundle.playlist);
  if (shouldUploadYoutube) publishArgs.push("--youtube");
  if (force) publishArgs.push("--force");
  if (noRetire) publishArgs.push("--no-retire");

  execFileSync("node", publishArgs, {
    cwd: PROJECT_ROOT,
    stdio: "inherit",
  });
}

console.log("\nInbox publish complete.");
