#!/usr/bin/env node

/**
 * upload-youtube.mjs
 * Upload a video file to YouTube via YouTube Data API v3.
 *
 * Features:
 * - Idempotent: skips upload if local MD5 matches previously uploaded file
 * - Version history: when content changes, old video is retired (set to private)
 *   and its ID is preserved in upload-state.json history
 * - State tracked in .agents/skills/publish-video/upload-state.json
 * - OAuth token cached at ~/.config/youtube-upload/token.json
 *
 * Usage:
 *   node upload-youtube.mjs \
 *     --file out/buda-reward-zh-CN.mp4 \
 *     --title "How to Redeem Your Reward Code | Buda" \
 *     --description "Step-by-step guide..." \
 *     --tags "buda,rewards,tutorial" \
 *     --privacy unlisted \
 *     [--force]           re-upload even if MD5 unchanged
 *     [--no-retire]       skip retiring the old video (keep it public)
 *
 * Output lines (machine-readable):
 *   VIDEO_ID=<id>
 *   SKIPPED=true          (if upload was skipped due to unchanged MD5)
 *   RETIRED_ID=<id>       (if an old video was retired)
 */

import crypto from "node:crypto";
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

const filePath = get("--file");
const title = get("--title") ?? "Untitled";
const description = get("--description") ?? "";
const tags = (get("--tags") ?? "")
  .split(",")
  .map((t) => t.trim())
  .filter(Boolean);
const privacy = get("--privacy") ?? "unlisted";
const forceUpload = hasFlag("--force");
const noRetire = hasFlag("--no-retire");

if (!filePath || !fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// ── State tracking ────────────────────────────────────────────────────────────
const STATE_FILE = path.resolve(__dirname, "../upload-state.json");

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
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("md5");
    const stream = fs.createReadStream(fp);

    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("end", () => resolve(hash.digest("hex")));
    stream.on("error", reject);
  });
}

// ── OAuth ─────────────────────────────────────────────────────────────────────
const CONFIG_DIR = path.join(os.homedir(), ".config", "youtube-upload");
const SECRET_FILE = path.join(CONFIG_DIR, "client_secret.json");
const TOKEN_FILE = path.join(CONFIG_DIR, "token.json");

if (!fs.existsSync(SECRET_FILE)) {
  console.error(`Missing OAuth credentials: ${SECRET_FILE}`);
  console.error("Download client_secret.json from Google Cloud Console and save it there.");
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
      "https://www.googleapis.com/auth/youtube.upload",
      "https://www.googleapis.com/auth/youtube",
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

// ── Retire old video ──────────────────────────────────────────────────────────
async function retireVideo(youtube, oldVideoId, _reason) {
  try {
    await youtube.videos.update({
      part: ["status"],
      requestBody: {
        id: oldVideoId,
        status: { privacyStatus: "private" },
      },
    });
    console.log(
      `Retired old video (set to private): https://www.youtube.com/watch?v=${oldVideoId}`,
    );
    console.log(`RETIRED_ID=${oldVideoId}`);
  } catch (err) {
    if (err.code === 404 || err?.errors?.[0]?.reason === "videoNotFound") {
      console.log(`Old video not found (already deleted): ${oldVideoId} — skipping retire.`);
    } else {
      console.warn(`⚠️  Could not retire old video ${oldVideoId}: ${err.message}`);
      console.warn("Continuing — retire it manually if needed.");
    }
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────
async function upload() {
  const state = loadState();
  const stateKey = path.resolve(filePath);
  const localMd5 = await fileMd5(filePath);
  const prev = state[stateKey];

  // Skip if unchanged
  if (!forceUpload && prev?.md5 === localMd5) {
    console.log(`Skipped (MD5 unchanged): ${prev.youtubeId}`);
    console.log(`VIDEO_ID=${prev.youtubeId}`);
    console.log(`SKIPPED=true`);
    return prev.youtubeId;
  }

  if (prev && prev.md5 !== localMd5) {
    console.log(`Content changed — will re-upload.`);
    console.log(`  Previous: ${prev.youtubeId} (uploaded ${prev.uploadedAt?.slice(0, 10)})`);
  }

  await getToken();

  const youtube = google.youtube({ version: "v3", auth: oauth2 });
  const fileSize = fs.statSync(filePath).size;

  console.log(
    `\nUploading: ${path.basename(filePath)} (${(fileSize / 1024 / 1024).toFixed(1)} MB)`,
  );

  const res = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: { title, description, tags, categoryId: "28" }, // 28 = Science & Technology
        status: { privacyStatus: privacy },
      },
      media: { body: fs.createReadStream(filePath) },
    },
    {
      onUploadProgress: (evt) => {
        const pct = Math.round((evt.bytesRead / fileSize) * 100);
        process.stdout.write(`\rProgress: ${pct}%`);
      },
    },
  );

  const videoId = res.data.id;
  console.log(`\n\nUploaded! https://www.youtube.com/watch?v=${videoId}`);
  console.log(`VIDEO_ID=${videoId}`);

  // Retire old video if content changed
  if (prev?.youtubeId && prev.youtubeId !== videoId && !noRetire) {
    console.log(`\nRetiring old video...`);
    await retireVideo(
      youtube,
      prev.youtubeId,
      `replaced by ${videoId} on ${new Date().toISOString().slice(0, 10)}`,
    );
  }

  // Save state with version history
  const history = prev
    ? [
        ...(prev.history ?? []),
        {
          youtubeId: prev.youtubeId,
          md5: prev.md5,
          uploadedAt: prev.uploadedAt,
          retiredAt: new Date().toISOString(),
          retiredReason: `replaced by ${videoId}`,
        },
      ]
    : [];

  state[stateKey] = {
    youtubeId: videoId,
    md5: localMd5,
    uploadedAt: new Date().toISOString(),
    title,
    history,
  };
  saveState(state);

  return videoId;
}

upload().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
