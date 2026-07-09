#!/usr/bin/env node
/**
 * set-youtube-thumbnail.mjs
 * Set a custom thumbnail for an existing YouTube video.
 *
 * Usage:
 *   node set-youtube-thumbnail.mjs \
 *     --video-id VIDEO_ID \
 *     --file project-en-cover.jpg \
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
const force = hasFlag("--force");

if (!videoId || !filePath || !fs.existsSync(filePath)) {
  console.error(
    "Usage: node set-youtube-thumbnail.mjs --video-id VIDEO_ID --file cover.jpg [--force]",
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
      "https://www.googleapis.com/auth/youtube.upload",
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

const absFile = path.resolve(filePath);
const localMd5 = fileMd5(absFile);
const state = loadState();
const stateKey = `thumbnail:${videoId}:${absFile}`;
const prev = state[stateKey];

if (!force && prev?.md5 === localMd5) {
  console.log(`Skipped thumbnail (MD5 unchanged): ${videoId}`);
  console.log("SKIPPED=true");
  process.exit(0);
}

const youtube = google.youtube({ version: "v3", auth: oauth2 });

console.log(`Setting thumbnail: ${path.basename(filePath)} → ${videoId}`);
await youtube.thumbnails.set({
  videoId,
  media: {
    body: fs.createReadStream(absFile),
  },
});

state[stateKey] = {
  videoId,
  file: absFile,
  md5: localMd5,
  uploadedAt: new Date().toISOString(),
};
saveState(state);

console.log(`Updated thumbnail: https://www.youtube.com/watch?v=${videoId}`);
