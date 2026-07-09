#!/usr/bin/env node
/**
 * add-to-playlist.mjs
 * Add an uploaded video to a YouTube playlist.
 *
 * Usage:
 *   node add-to-playlist.mjs --video-id VIDEO_ID --playlist-id PLAYLIST_ID
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
const playlistId = get("--playlist-id");

if (!videoId || !playlistId) {
  console.error("Usage: node add-to-playlist.mjs --video-id ID --playlist-id ID");
  process.exit(1);
}

const TOKEN_FILE = path.join(os.homedir(), ".config", "youtube-upload", "token.json");
const SECRET_FILE = path.join(os.homedir(), ".config", "youtube-upload", "client_secret.json");

if (!fs.existsSync(TOKEN_FILE)) {
  console.error("No token found. Run upload-youtube.mjs first to authorize.");
  process.exit(1);
}

const { client_id, client_secret, redirect_uris } = JSON.parse(
  fs.readFileSync(SECRET_FILE, "utf8"),
).installed;
const oauth2 = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oauth2.setCredentials(JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8")));

const youtube = google.youtube({ version: "v3", auth: oauth2 });

const res = await youtube.playlistItems.insert({
  part: ["snippet"],
  requestBody: {
    snippet: {
      playlistId,
      resourceId: { kind: "youtube#video", videoId },
    },
  },
});

console.log(`Added to playlist: https://www.youtube.com/playlist?list=${playlistId}`);
console.log(`Item ID: ${res.data.id}`);
