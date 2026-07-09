#!/usr/bin/env node
/**
 * retire-youtube-video.mjs
 * Set a YouTube video's privacy to "private" (retire without deleting).
 * Used automatically when a composition is re-uploaded with changed content.
 *
 * Usage:
 *   node retire-youtube-video.mjs --video-id VIDEO_ID [--reason "re-upload 2026-04-28"]
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { google } from "googleapis";

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const videoId = get("--video-id");
const reason = get("--reason") ?? "retired";

if (!videoId) {
  console.error("Usage: node retire-youtube-video.mjs --video-id VIDEO_ID [--reason '...']");
  process.exit(1);
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const CONFIG_DIR = path.join(os.homedir(), ".config", "youtube-upload");
const SECRET_FILE = path.join(CONFIG_DIR, "client_secret.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

if (!fs.existsSync(TOKEN_FILE) || !fs.existsSync(SECRET_FILE)) {
  console.error("No OAuth credentials found. Run upload-youtube.mjs first to authorize.");
  process.exit(1);
}

const { client_id, client_secret, redirect_uris } = JSON.parse(
  fs.readFileSync(SECRET_FILE, "utf8"),
).installed;
const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")));

const youtube = google.youtube({ version: "v3", auth: oauth2 });

// ── Set to private ────────────────────────────────────────────────────────────
try {
  await youtube.videos.update({
    part: ["status"],
    requestBody: {
      id: videoId,
      status: { privacyStatus: "private" },
    },
  });
  console.log(`Retired (set to private): https://www.youtube.com/watch?v=${videoId}`);
  console.log(`Reason: ${reason}`);
} catch (err) {
  // 404 = video already deleted, not an error worth failing over
  if (err.code === 404 || err?.errors?.[0]?.reason === "videoNotFound") {
    console.log(`Video not found (already deleted?): ${videoId} — skipping.`);
  } else {
    console.error(`Failed to retire ${videoId}: ${err.message}`);
    process.exit(1);
  }
}
