#!/usr/bin/env node
/**
 * publish-bundle.mjs
 * Publish an externally-produced video bundle:
 *
 *   project-en.mp4
 *   project-en.srt
 *   project-en-cover.jpg
 *
 * The script uploads assets to R2, creates/updates video MDX, and optionally
 * uploads the MP4, captions, and thumbnail to YouTube.
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const APP_DIR = path.join(PROJECT_ROOT, "apps", "buda");
const CHANNELS_FILE = path.join(PROJECT_ROOT, ".agents/skills/publish-video/video-channels.json");
const R2_UPLOAD_SCRIPT = path.join(PROJECT_ROOT, ".agents/skills/cdn-upload/scripts/upload.mjs");
const YOUTUBE_FROM_MDX_SCRIPT = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/upload-youtube-from-mdx.mjs",
);
const CAPTION_SCRIPT = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/upload-youtube-caption.mjs",
);
const THUMBNAIL_SCRIPT = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/scripts/set-youtube-thumbnail.mjs",
);

const LANG_SUFFIXES = ["zh-CN", "zh-TW", "ja", "pt", "en"];

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const filePath = get("--file");
const title = get("--title");
const description = get("--description") ?? "";
const tagsRaw = get("--tags") ?? "";
const duration = get("--duration") ?? "0:00";
const explicitSlug = get("--slug");
const explicitLang = get("--lang");
const explicitCaption = get("--caption");
const explicitCover = get("--cover");
const playlistArg = get("--playlist");
const playlistIdArg = get("--playlist-id");
const privacy = get("--privacy") ?? "unlisted";
const shouldUploadYoutube = hasFlag("--youtube");
const yes = hasFlag("--yes");
const force = hasFlag("--force");
const noRetire = hasFlag("--no-retire");
const skipR2 = hasFlag("--skip-r2");

if (!filePath || !fs.existsSync(filePath)) {
  console.error(
    [
      "Usage: node publish-bundle.mjs --file project-en.mp4 [options]",
      "  --title <title>             YouTube/MDX title",
      "  --description <text>        YouTube/MDX description",
      "  --tags <a,b,c>              Comma-separated tags",
      "  --playlist use-cases        Playlist key from video-channels.json",
      "  --playlist-id PLxxx         Explicit playlist ID",
      "  --youtube                   Upload to YouTube after R2 + MDX",
      "  --yes                       Execute. Without this, only prints a plan.",
      "  --caption project-en.srt    Optional override",
      "  --cover project-en-cover.jpg Optional override",
    ].join("\n"),
  );
  process.exit(1);
}

function loadJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function inferSlugLang(baseName) {
  for (const lang of LANG_SUFFIXES) {
    if (baseName.endsWith(`-${lang}`)) {
      return { slug: baseName.slice(0, -(lang.length + 1)), lang };
    }
  }
  return { slug: baseName, lang: "en" };
}

function quoteYaml(value) {
  return `"${String(value ?? "").replace(/"/g, '\\"')}"`;
}

function toArray(raw) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function findSibling(absVideo, suffixes) {
  for (const candidate of suffixes) {
    const full = path.join(path.dirname(absVideo), candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function uploadR2(file, key) {
  const out = execFileSync("node", [R2_UPLOAD_SCRIPT, "--file", file, "--key", key], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  process.stdout.write(out);
  const match = out.match(/R2_URL=(.+)/);
  return match?.[1]?.trim() ?? null;
}

function resolvePlaylist() {
  const channels = loadJson(CHANNELS_FILE, { playlists: {}, compositions: {} });
  if (playlistIdArg) return { id: playlistIdArg, source: "cli-id" };
  if (!playlistArg) return null;
  const playlist = channels.playlists?.[playlistArg];
  if (playlist?.id) return { id: playlist.id, source: playlistArg, title: playlist.title };
  if (playlistArg.startsWith("PL")) return { id: playlistArg, source: "cli-playlist-value" };
  throw new Error(`Unknown playlist key: ${playlistArg}`);
}

function buildFrontmatter({ videoUrl, captionUrl, coverUrl, youtubeId, playlistId }) {
  const lines = [
    "---",
    `title: ${quoteYaml(title ?? assetId)}`,
    `description: ${quoteYaml(description)}`,
    `videoUrl: ${quoteYaml(videoUrl ?? "")}`,
  ];
  if (captionUrl) lines.push(`captionsUrl: ${quoteYaml(captionUrl)}`);
  if (coverUrl) lines.push(`coverUrl: ${quoteYaml(coverUrl)}`);
  if (youtubeId) lines.push(`youtubeId: ${quoteYaml(youtubeId)}`);
  if (playlistId) lines.push(`playlistId: ${quoteYaml(playlistId)}`);
  lines.push(`duration: ${quoteYaml(duration)}`);
  lines.push(`lang: ${lang}`);
  lines.push(`publishedAt: ${quoteYaml(new Date().toISOString().slice(0, 10))}`);
  const tags = toArray(tagsRaw);
  if (tags.length) {
    lines.push("tags:");
    for (const tag of tags) lines.push(`  - ${tag}`);
  }
  lines.push("---");
  return lines.join("\n");
}

function buildBody({ videoUrl, captionUrl, coverUrl }) {
  const source = videoUrl
    ? `<video width="100%" controls${coverUrl ? ` poster="${coverUrl}"` : ""} style={{ aspectRatio: "16/9" }}>
  <source src="${videoUrl}" type="video/mp4" />${
    captionUrl
      ? `\n  <track kind="captions" src="${captionUrl}" srcLang="${lang}" label="${lang}" />`
      : ""
  }
</video>
<a href="${videoUrl}" download style={{ display: "inline-block", marginTop: "8px", fontSize: "14px" }}>Download</a>`
    : "{/* VIDEO_PLACEHOLDER */}";

  return `
${source}

## ${title ?? assetId}

${description}

## Links

- Get started free: https://buda.ai
- Documentation: https://buda.ai/docs
- Discord community: https://discord.gg/ZwGYvmqAb4

## YouTube SEO Copy

**Title:**
${title ?? assetId}

**Description:**
${description}

**Tags (comma-separated):**
${toArray(tagsRaw).join(", ")}
`;
}

function writeMdx({ videoUrl, captionUrl, coverUrl, youtubeId, playlistId }) {
  fs.mkdirSync(mdxDir, { recursive: true });
  const frontmatter = buildFrontmatter({ videoUrl, captionUrl, coverUrl, youtubeId, playlistId });

  if (fs.existsSync(mdxFile)) {
    const existing = fs.readFileSync(mdxFile, "utf8");
    const match = existing.match(/^---\n[\s\S]*?\n---/);
    const body = match
      ? existing.slice(match[0].length)
      : `\n${buildBody({ videoUrl, captionUrl, coverUrl })}`;
    fs.writeFileSync(mdxFile, `${frontmatter}${body}`);
    return "updated";
  }

  fs.writeFileSync(mdxFile, `${frontmatter}\n${buildBody({ videoUrl, captionUrl, coverUrl })}`);
  return "created";
}

function updateMeta() {
  const metaFile = path.join(mdxDir, "meta.json");
  const meta = loadJson(metaFile, { title: "Videos", pages: [] });
  if (meta.pages?.includes(slug)) return false;
  meta.pages = [...(meta.pages ?? []), slug];
  fs.writeFileSync(metaFile, `${JSON.stringify(meta, null, 2)}\n`);
  return true;
}

function runYoutubeUpload(playlist) {
  const uploadArgs = [
    YOUTUBE_FROM_MDX_SCRIPT,
    "--file",
    absVideo,
    "--mdx",
    mdxFile,
    "--composition",
    assetId,
    "--privacy",
    privacy,
  ];
  if (playlist?.id) uploadArgs.push("--playlist-id", playlist.id);
  if (force) uploadArgs.push("--force");
  if (noRetire) uploadArgs.push("--no-retire");

  const out = execFileSync("node", uploadArgs, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    stdio: ["inherit", "pipe", "inherit"],
  });
  process.stdout.write(out);
  const videoId = out.match(/VIDEO_ID=([A-Za-z0-9_-]+)/)?.[1] ?? null;
  if (!videoId) throw new Error("Could not extract YouTube VIDEO_ID from upload output.");
  return videoId;
}

const absVideo = path.resolve(filePath);
const ext = path.extname(absVideo).toLowerCase();
if (ext !== ".mp4") {
  console.error(`Expected an .mp4 file, got: ${absVideo}`);
  process.exit(1);
}

const base = path.basename(absVideo, ext);
const inferred = inferSlugLang(base);
const slug = explicitSlug ?? inferred.slug;
const lang = explicitLang ?? inferred.lang;
const assetId = lang === "en" ? `${slug}-en` : `${slug}-${lang}`;
const mdxDir = path.join(APP_DIR, "content", "videos", lang);
const mdxFile = path.join(mdxDir, `${slug}.mdx`);

const captionPath =
  explicitCaption && fs.existsSync(explicitCaption)
    ? path.resolve(explicitCaption)
    : findSibling(absVideo, [`${base}.srt`, `${slug}-${lang}.srt`, `${slug}.srt`]);
const coverPath =
  explicitCover && fs.existsSync(explicitCover)
    ? path.resolve(explicitCover)
    : findSibling(absVideo, [
        `${base}-cover.jpg`,
        `${base}-cover.jpeg`,
        `${base}-cover.png`,
        `${slug}-${lang}-cover.jpg`,
        `${slug}-${lang}-cover.png`,
        `${slug}-cover.jpg`,
        `${slug}-cover.png`,
      ]);
const playlist = resolvePlaylist();

console.log("Publish bundle plan:");
console.log(`  MP4:       ${absVideo}`);
console.log(`  Caption:   ${captionPath ?? "(none)"}`);
console.log(`  Cover:     ${coverPath ?? "(none)"}`);
console.log(`  Slug/lang: ${slug} / ${lang}`);
console.log(`  Asset ID:  ${assetId}`);
console.log(`  MDX:       ${path.relative(PROJECT_ROOT, mdxFile)}`);
console.log(`  R2:        ${skipR2 ? "skipped" : "video + optional caption/cover"}`);
console.log(`  YouTube:   ${shouldUploadYoutube ? privacy : "skipped"}`);
console.log(`  Playlist:  ${playlist?.title ?? playlist?.source ?? playlist?.id ?? "(none)"}`);

if (!yes) {
  console.log("\nPlan only. Re-run with --yes to upload and write files.");
  process.exit(0);
}

let videoUrl = "";
let captionUrl = "";
let coverUrl = "";

if (!skipR2) {
  videoUrl = uploadR2(absVideo, `videos/buda/${base}.mp4`);
  if (captionPath) {
    captionUrl = uploadR2(captionPath, `videos/buda/captions/${path.basename(captionPath)}`);
  }
  if (coverPath) {
    coverUrl = uploadR2(coverPath, `videos/buda/covers/${path.basename(coverPath)}`);
  }
}

const mdxAction = writeMdx({
  videoUrl,
  captionUrl,
  coverUrl,
  playlistId: playlist?.id ?? "",
});
const metaChanged = updateMeta();
console.log(
  `${mdxAction === "created" ? "Created" : "Updated"} MDX: ${path.relative(PROJECT_ROOT, mdxFile)}`,
);
if (metaChanged) console.log(`Updated meta.json with "${slug}"`);

if (shouldUploadYoutube) {
  const videoId = runYoutubeUpload(playlist);
  if (captionPath) {
    execFileSync(
      "node",
      [CAPTION_SCRIPT, "--video-id", videoId, "--file", captionPath, "--lang", lang],
      {
        cwd: PROJECT_ROOT,
        stdio: "inherit",
      },
    );
  }
  if (coverPath) {
    execFileSync("node", [THUMBNAIL_SCRIPT, "--video-id", videoId, "--file", coverPath], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });
  }
}

console.log("\nDone.");
