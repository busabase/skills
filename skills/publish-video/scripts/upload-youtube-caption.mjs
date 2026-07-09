#!/usr/bin/env node
/**
 * upload-youtube-caption.mjs
 * Upload or replace a caption track for an existing YouTube video.
 *
 * Usage:
 *   node upload-youtube-caption.mjs \
 *     --video-id VIDEO_ID \
 *     --file project-en.srt \
 *     --lang en \
 *     [--name English] \
 *     [--force]
 */

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};
const hasFlag = (flag) => args.includes(flag);

const videoId = get("--video-id");
const filePath = get("--file");
const lang = get("--lang") ?? "en";
const name = get("--name") ?? lang;
const force = hasFlag("--force");

if (!videoId || !filePath || !fs.existsSync(filePath)) {
  console.error(
    "Usage: node upload-youtube-caption.mjs --video-id VIDEO_ID --file captions.srt [--lang en] [--name English] [--force]",
  );
  process.exit(1);
}

const STATE_FILE = path.resolve(__dirname, "../upload-state.json");
const CONFIG_DIR = path.join(os.homedir(), ".config", "youtube-upload");
const SECRET_FILE = path.join(CONFIG_DIR, "client_secret.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

function loadState() {
  if (!fs.existsSync(STATE_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveState(state) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function fileMd5(fp) {
  return crypto.createHash("md5").update(fs.readFileSync(fp)).digest("hex");
}

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
      "https://www.googleapis.com/auth/youtube",
      "https://www.googleapis.com/auth/youtube.force-ssl",
    ],
  });

  console.log("\nOpen this URL in your browser to authorize:\n");
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
  console.log("Token saved.");
}

await getToken();

const youtube = google.youtube({ version: "v3", auth: oauth2 });
const absFile = path.resolve(filePath);
const localMd5 = fileMd5(absFile);
const state = loadState();
const stateKey = `caption:${videoId}:${lang}:${absFile}`;
const prev = state[stateKey];

if (!force && prev?.md5 === localMd5) {
  console.log(`Skipped caption (MD5 unchanged): ${prev.captionId ?? `${videoId}:${lang}`}`);
  console.log(`CAPTION_ID=${prev.captionId ?? ""}`);
  console.log("SKIPPED=true");
  process.exit(0);
}

const existing = await youtube.captions.list({
  part: ["snippet"],
  videoId,
});

const matchingTracks = (existing.data.items ?? []).filter((item) => {
  const snippet = item.snippet ?? {};
  return snippet.language === lang && (!snippet.name || snippet.name === name);
});

for (const track of matchingTracks) {
  if (track.id) {
    console.log(`Deleting old caption track: ${track.id}`);
    await youtube.captions.delete({ id: track.id });
  }
}

console.log(`Uploading captions: ${path.basename(filePath)} → ${videoId} (${lang})`);

const res = await youtube.captions.insert({
  part: ["snippet"],
  requestBody: {
    snippet: {
      videoId,
      language: lang,
      name,
      isDraft: false,
    },
  },
  media: {
    mimeType: "application/octet-stream",
    body: fs.createReadStream(absFile),
  },
});

const captionId = res.data.id ?? "";
state[stateKey] = {
  captionId,
  videoId,
  lang,
  name,
  file: absFile,
  md5: localMd5,
  uploadedAt: new Date().toISOString(),
};
saveState(state);

console.log(`Uploaded caption: ${captionId}`);
console.log(`CAPTION_ID=${captionId}`);
