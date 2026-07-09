#!/usr/bin/env node
/**
 * weekly-report.mjs
 * Generate a weekly YouTube analytics report for all tracked videos.
 *
 * Data sources:
 *   - upload-state.json  → maps composition IDs to YouTube video IDs
 *   - video-channels.json → maps compositions to playlist categories
 *   - YouTube Analytics API → actual metrics
 *
 * Usage:
 *   node weekly-report.mjs                    # last week (Mon–Sun)
 *   node weekly-report.mjs --week 2026-04-21  # week starting on this date
 *   node weekly-report.mjs --output report.md # save to file instead of stdout
 *   node weekly-report.mjs --json             # output raw JSON
 *
 * Metrics per video:
 *   views, estimatedMinutesWatched, averageViewDuration,
 *   averageViewPercentage, subscribersGained, likes, comments
 *
 * Requires: googleapis (pnpm add -w googleapis)
 * OAuth token: ~/.config/youtube-upload/token.json (same as upload scripts)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Parse args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const weekArg = get("--week");
const outputFile = get("--output");
const jsonMode = hasFlag("--json");

// ── Date range: last Mon–Sun ──────────────────────────────────────────────────
function getLastWeekRange(anchorDate) {
  const anchor = anchorDate ? new Date(anchorDate) : new Date();
  // Find last Monday
  const day = anchor.getDay(); // 0=Sun, 1=Mon...
  const daysToLastMon = day === 0 ? 6 : day - 1;
  const lastMon = new Date(anchor);
  lastMon.setDate(anchor.getDate() - daysToLastMon - 7);
  const lastSun = new Date(lastMon);
  lastSun.setDate(lastMon.getDate() + 6);

  const fmt = (d) => d.toISOString().slice(0, 10);
  return { startDate: fmt(lastMon), endDate: fmt(lastSun) };
}

const { startDate, endDate } = getLastWeekRange(weekArg);

// ── Load state files ──────────────────────────────────────────────────────────
const STATE_FILE = path.resolve(__dirname, "../upload-state.json");
const CHANNELS_FILE = path.resolve(__dirname, "../video-channels.json");

function loadJson(file) {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

const uploadState = loadJson(STATE_FILE) ?? {};
const channels = loadJson(CHANNELS_FILE) ?? {};

// Build: compositionId → { youtubeId, playlistKey }
const compositionMap = channels.compositions ?? {};
const playlistMeta = channels.playlists ?? {};

// Build reverse map: youtubeId → { compositionId, playlistKey, playlistTitle }
const videoIndex = {};
for (const [absPath, entry] of Object.entries(uploadState)) {
  if (!entry.youtubeId) continue;
  // Derive composition ID from file path: .../out/buda-intro-general-zh-CN.mp4 → buda-intro-general-zh-CN
  const compositionId = path.basename(absPath, ".mp4");
  const playlistKey = compositionMap[compositionId] ?? null;
  videoIndex[entry.youtubeId] = {
    compositionId,
    playlistKey,
    playlistTitle: playlistKey
      ? (playlistMeta[playlistKey]?.title ?? playlistKey)
      : "Uncategorized",
    title: entry.title ?? compositionId,
    uploadedAt: entry.uploadedAt,
  };
}

const videoIds = Object.keys(videoIndex);

if (videoIds.length === 0) {
  console.error("No uploaded videos found in upload-state.json.");
  console.error("Upload some videos first with upload-youtube.mjs.");
  process.exit(1);
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const CONFIG_DIR = path.join(os.homedir(), ".config", "youtube-upload");
const SECRET_FILE = path.join(CONFIG_DIR, "client_secret.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

if (!fs.existsSync(SECRET_FILE)) {
  console.error(`Missing OAuth credentials: ${SECRET_FILE}`);
  process.exit(1);
}

const { client_id, client_secret, redirect_uris } = JSON.parse(
  fs.readFileSync(SECRET_FILE, "utf8"),
).installed;
const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

async function getToken() {
  if (fs.existsSync(TOKEN_FILE)) {
    oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")));
    return;
  }
  const authUrl = oauth2.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/youtube.readonly",
      "https://www.googleapis.com/auth/yt-analytics.readonly",
    ],
  });
  console.log("\nOpen this URL to authorize:\n");
  console.log(authUrl);
  console.log();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise((resolve) =>
    rl.question("Paste the authorization code: ", resolve),
  );
  rl.close();
  const { tokens } = await oauth2.getToken(code.trim());
  oauth2.setCredentials(tokens);
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokens, null, 2));
  console.log("Token saved.\n");
}

// ── Fetch analytics ───────────────────────────────────────────────────────────
async function fetchVideoMetrics(youtubeAnalytics, videoId) {
  try {
    const res = await youtubeAnalytics.reports.query({
      ids: "channel==MINE",
      startDate,
      endDate,
      metrics:
        "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained,likes,comments",
      dimensions: "video",
      filters: `video==${videoId}`,
    });
    const row = res.data.rows?.[0];
    if (!row) return null;
    return {
      views: row[1] ?? 0,
      watchMinutes: row[2] ?? 0,
      avgViewDuration: row[3] ?? 0,
      avgViewPct: row[4] ?? 0,
      subscribersGained: row[5] ?? 0,
      likes: row[6] ?? 0,
      comments: row[7] ?? 0,
    };
  } catch {
    return null;
  }
}

// ── Format helpers ────────────────────────────────────────────────────────────
function fmtDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function fmtMinutes(minutes) {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function fmtNum(n) {
  return Number(n).toLocaleString("en-US");
}

// ── Main ──────────────────────────────────────────────────────────────────────
await getToken();
const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth: oauth2 });

console.error(`Fetching analytics for ${videoIds.length} videos (${startDate} → ${endDate})...`);

// Fetch all in parallel (batched to avoid rate limits)
const BATCH = 10;
const allMetrics = {};
for (let i = 0; i < videoIds.length; i += BATCH) {
  const batch = videoIds.slice(i, i + BATCH);
  const results = await Promise.all(batch.map((id) => fetchVideoMetrics(youtubeAnalytics, id)));
  batch.forEach((id, j) => {
    allMetrics[id] = results[j];
  });
  if (i + BATCH < videoIds.length) {
    await new Promise((r) => setTimeout(r, 500)); // brief pause between batches
  }
}

// ── Build report data ─────────────────────────────────────────────────────────
const byPlaylist = {};

for (const [videoId, meta] of Object.entries(videoIndex)) {
  const metrics = allMetrics[videoId];
  const key = meta.playlistKey ?? "uncategorized";
  if (!byPlaylist[key]) {
    byPlaylist[key] = {
      title: meta.playlistTitle,
      videos: [],
      totals: { views: 0, watchMinutes: 0, subscribersGained: 0, likes: 0, comments: 0 },
    };
  }
  const entry = { videoId, ...meta, metrics };
  byPlaylist[key].videos.push(entry);
  if (metrics) {
    byPlaylist[key].totals.views += metrics.views;
    byPlaylist[key].totals.watchMinutes += metrics.watchMinutes;
    byPlaylist[key].totals.subscribersGained += metrics.subscribersGained;
    byPlaylist[key].totals.likes += metrics.likes;
    byPlaylist[key].totals.comments += metrics.comments;
  }
}

// Sort videos within each playlist by views desc
for (const pl of Object.values(byPlaylist)) {
  pl.videos.sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0));
}

// Grand totals
const grand = { views: 0, watchMinutes: 0, subscribersGained: 0, likes: 0, comments: 0 };
for (const pl of Object.values(byPlaylist)) {
  grand.views += pl.totals.views;
  grand.watchMinutes += pl.totals.watchMinutes;
  grand.subscribersGained += pl.totals.subscribersGained;
  grand.likes += pl.totals.likes;
  grand.comments += pl.totals.comments;
}

// ── JSON output ───────────────────────────────────────────────────────────────
if (jsonMode) {
  const out = JSON.stringify({ period: { startDate, endDate }, grand, byPlaylist }, null, 2);
  if (outputFile) fs.writeFileSync(outputFile, out);
  else console.log(out);
  process.exit(0);
}

// ── Markdown report ───────────────────────────────────────────────────────────
const lines = [];

lines.push(`# YouTube 周报`);
lines.push(`**周期：** ${startDate} ～ ${endDate}`);
lines.push(`**生成时间：** ${new Date().toISOString().slice(0, 16).replace("T", " ")}`);
lines.push(``);

// Overall summary
lines.push(`## 总览`);
lines.push(``);
lines.push(`| 指标 | 数值 |`);
lines.push(`|------|------|`);
lines.push(`| 总播放量 | ${fmtNum(grand.views)} |`);
lines.push(`| 总观看时长 | ${fmtMinutes(grand.watchMinutes)} |`);
lines.push(`| 新增订阅 | ${fmtNum(grand.subscribersGained)} |`);
lines.push(`| 点赞数 | ${fmtNum(grand.likes)} |`);
lines.push(`| 评论数 | ${fmtNum(grand.comments)} |`);
lines.push(``);

// Playlist summary
lines.push(`## 播放列表汇总`);
lines.push(``);
lines.push(`| 分类 | 播放量 | 观看时长 | 新增订阅 |`);
lines.push(`|------|--------|----------|----------|`);
for (const [_key, pl] of Object.entries(byPlaylist)) {
  lines.push(
    `| ${pl.title} | ${fmtNum(pl.totals.views)} | ${fmtMinutes(pl.totals.watchMinutes)} | ${fmtNum(pl.totals.subscribersGained)} |`,
  );
}
lines.push(``);

// Per-playlist video breakdown
for (const [_key, pl] of Object.entries(byPlaylist)) {
  lines.push(`## ${pl.title}`);
  lines.push(``);
  lines.push(`| 视频 | 播放量 | 观看时长 | 平均完播率 | 平均时长 | 新增订阅 | 点赞 |`);
  lines.push(`|------|--------|----------|------------|----------|----------|------|`);

  for (const v of pl.videos) {
    const m = v.metrics;
    if (!m) {
      lines.push(
        `| [${v.compositionId}](https://youtube.com/watch?v=${v.videoId}) | — | — | — | — | — | — |`,
      );
      continue;
    }
    lines.push(
      `| [${v.compositionId}](https://youtube.com/watch?v=${v.videoId})` +
        ` | ${fmtNum(m.views)}` +
        ` | ${fmtMinutes(m.watchMinutes)}` +
        ` | ${m.avgViewPct.toFixed(1)}%` +
        ` | ${fmtDuration(m.avgViewDuration)}` +
        ` | ${fmtNum(m.subscribersGained)}` +
        ` | ${fmtNum(m.likes)} |`,
    );
  }
  lines.push(``);
}

// Top 5 videos overall
const allVideos = Object.values(byPlaylist).flatMap((pl) => pl.videos);
const top5 = allVideos
  .filter((v) => v.metrics?.views > 0)
  .sort((a, b) => (b.metrics?.views ?? 0) - (a.metrics?.views ?? 0))
  .slice(0, 5);

if (top5.length > 0) {
  lines.push(`## 本周 Top 5`);
  lines.push(``);
  lines.push(`| # | 视频 | 分类 | 播放量 | 完播率 |`);
  lines.push(`|---|------|------|--------|--------|`);
  top5.forEach((v, i) => {
    lines.push(
      `| ${i + 1} | [${v.compositionId}](https://youtube.com/watch?v=${v.videoId})` +
        ` | ${v.playlistTitle}` +
        ` | ${fmtNum(v.metrics.views)}` +
        ` | ${v.metrics.avgViewPct.toFixed(1)}% |`,
    );
  });
  lines.push(``);
}

const report = lines.join("\n");

if (outputFile) {
  fs.writeFileSync(outputFile, report);
  console.error(`Report saved to: ${outputFile}`);
} else {
  console.log(report);
}
