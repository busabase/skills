import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
export const VIDEO_DIR = path.join(PROJECT_ROOT, "videos", "buda");
export const APP_DIR = path.join(PROJECT_ROOT, "apps", "buda");
export const CHANNELS_FILE = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/video-channels.json",
);
export const ROOT_FILE = path.join(VIDEO_DIR, "src", "Root.tsx");
export const UPLOAD_STATE_FILE = path.join(
  PROJECT_ROOT,
  ".agents/skills/publish-video/upload-state.json",
);

const LANG_SUFFIXES = ["zh-CN", "zh-TW", "ja", "pt"];

export function loadJson(file, fallback = null) {
  if (!fs.existsSync(file)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

export function loadChannels() {
  return loadJson(CHANNELS_FILE, { playlists: {}, compositions: {} });
}

export function getPublishableCompositions() {
  const channels = loadChannels();
  return Object.keys(channels.compositions ?? {}).sort();
}

export function getRootCompositionIds() {
  if (!fs.existsSync(ROOT_FILE)) return [];
  const root = fs.readFileSync(ROOT_FILE, "utf8");
  return Array.from(root.matchAll(/\bid=["']([^"']+)["']/g), (m) => m[1]);
}

export function resolveLangAndSlug(compositionId) {
  if (compositionId === "buda-intro-kelly") {
    return { lang: "zh-CN", slug: "buda-intro-kelly" };
  }

  for (const lang of LANG_SUFFIXES) {
    if (compositionId.endsWith(`-${lang}`)) {
      return { lang, slug: compositionId.slice(0, -(lang.length + 1)) };
    }
  }

  if (compositionId.endsWith("-en")) {
    return { lang: "en", slug: compositionId.slice(0, -3) };
  }

  return { lang: "en", slug: compositionId };
}

export function compositionFromLangAndSlug(lang, slug) {
  const publishable = new Set(getPublishableCompositions());

  if (lang === "zh-CN" && publishable.has(`${slug}-zh-CN`)) return `${slug}-zh-CN`;
  if (lang === "zh-TW" && publishable.has(`${slug}-zh-TW`)) return `${slug}-zh-TW`;
  if (lang === "ja" && publishable.has(`${slug}-ja`)) return `${slug}-ja`;
  if (lang === "pt" && publishable.has(`${slug}-pt`)) return `${slug}-pt`;
  if (lang === "en" && publishable.has(`${slug}-en`)) return `${slug}-en`;
  if (publishable.has(slug)) return slug;

  return lang === "en" ? slug : `${slug}-${lang}`;
}

export function getMdxPath(compositionId) {
  const { lang, slug } = resolveLangAndSlug(compositionId);
  return path.join(APP_DIR, "content", "videos", lang, `${slug}.mdx`);
}

export function getOutputPath(compositionId) {
  return path.join(VIDEO_DIR, "out", `${compositionId}.mp4`);
}

export function getR2Key(compositionId) {
  return `videos/buda/${compositionId}.mp4`;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const fm = {};
  let currentArrayKey = null;

  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trimEnd();
    if (currentArrayKey && line.startsWith("  - ")) {
      fm[currentArrayKey].push(
        line
          .slice(4)
          .trim()
          .replace(/^["']|["']$/g, ""),
      );
      continue;
    }

    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (!kv) continue;

    const [, key, rawValue] = kv;
    const value = rawValue.trim();
    if (value === "") {
      fm[key] = [];
      currentArrayKey = key;
      continue;
    }

    currentArrayKey = null;
    fm[key] = value.replace(/^["']|["']$/g, "");
  }

  return fm;
}

export function readMdxFrontmatter(mdxFile) {
  if (!fs.existsSync(mdxFile)) return null;
  return parseFrontmatter(fs.readFileSync(mdxFile, "utf8"));
}

export function resolvePlaylist(compositionId, fm = {}) {
  if (fm.playlistId) {
    return { id: fm.playlistId, source: "mdx", key: null, title: "MDX playlist" };
  }

  const channels = loadChannels();
  const key = channels.compositions?.[compositionId];
  const playlist = key ? channels.playlists?.[key] : null;
  if (!playlist?.id) return null;

  return {
    id: playlist.id,
    source: "video-channels.json",
    key,
    title: playlist.title ?? key,
  };
}

export function getGitChangedFiles({ baseRef = null } = {}) {
  if (baseRef) {
    return execFileSync("git", ["diff", "--name-only", baseRef, "--"], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  return execFileSync("git", ["status", "--porcelain"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .map((line) => line.slice(3).trim())
    .filter(Boolean)
    .map((line) => line.replace(/^"|"$/g, ""));
}

function isSharedVideoSource(file) {
  return (
    [
      "videos/buda/src/Root.tsx",
      "videos/buda/src/index.css",
      "videos/buda/package.json",
      "videos/buda/remotion.config.ts",
      "videos/buda/remotion.config.js",
    ].includes(file) || file.startsWith("videos/buda/src/shared/")
  );
}

function sourceDirForComposition(compositionId) {
  const { slug } = resolveLangAndSlug(compositionId);
  return `videos/buda/src/${slug}/`;
}

function compositionFromMdxPath(file) {
  const match = file.match(/^apps\/buda\/content\/videos\/([^/]+)\/(.+)\.mdx$/);
  if (!match) return null;
  const [, lang, rawSlug] = match;
  if (rawSlug === "index" || rawSlug.startsWith("_")) return null;

  const abs = path.join(PROJECT_ROOT, file);
  const fm = readMdxFrontmatter(abs);
  const videoName = fm?.videoUrl ? path.basename(fm.videoUrl, ".mp4") : null;
  if (videoName) return videoName;

  return compositionFromLangAndSlug(lang, rawSlug);
}

export function detectChangedVideos({ baseRef = null } = {}) {
  const changedFiles = getGitChangedFiles({ baseRef });
  const publishable = getPublishableCompositions();
  const byId = new Map();

  const add = (id, action, reason, file) => {
    if (!publishable.includes(id)) return;
    const prev = byId.get(id) ?? {
      id,
      action,
      reasons: [],
      files: [],
      mdxPath: getMdxPath(id),
      outputPath: getOutputPath(id),
      r2Key: getR2Key(id),
    };

    if (prev.action !== "render-upload" && action === "render-upload") {
      prev.action = "render-upload";
    }
    if (!prev.reasons.includes(reason)) prev.reasons.push(reason);
    if (file && !prev.files.includes(file)) prev.files.push(file);
    byId.set(id, prev);
  };

  for (const file of changedFiles) {
    if (isSharedVideoSource(file)) {
      for (const id of publishable) add(id, "render-upload", "shared video source changed", file);
      continue;
    }

    if (file.startsWith("videos/buda/src/")) {
      for (const id of publishable) {
        if (file.startsWith(sourceDirForComposition(id))) {
          add(id, "render-upload", "composition source changed", file);
        }
      }
      continue;
    }

    if (file.startsWith("videos/buda/public/") || file.startsWith("videos/buda/assets/")) {
      for (const id of publishable) add(id, "render-upload", "shared asset changed", file);
      continue;
    }

    if (file.startsWith("apps/buda/content/videos/") && file.endsWith(".mdx")) {
      const id = compositionFromMdxPath(file);
      if (id) add(id, "metadata", "video MDX changed", file);
      continue;
    }

    if (file === ".agents/skills/publish-video/video-channels.json") {
      for (const id of publishable) add(id, "metadata", "playlist mapping changed", file);
    }
  }

  return {
    changedFiles,
    videos: Array.from(byId.values()).sort((a, b) => a.id.localeCompare(b.id)),
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "unknown";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
}
