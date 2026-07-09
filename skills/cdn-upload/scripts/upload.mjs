#!/usr/bin/env node

/**
 * upload.mjs — CDN upload to Cloudflare R2 (public bucket)
 * Shared by: /cdn-upload skill + /publish-video skill
 * Usage:
 *   node upload.mjs --file <path> [--key <r2-key>]
 *
 * Env vars (optional overrides — hardcoded defaults work for buda project):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const get = (flag) => {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
};

const filePath = get("--file");
const customKey = get("--key");

if (!filePath) {
  console.error("Usage: node upload.mjs --file <path> [--key <r2-key>]");
  process.exit(1);
}

if (!fs.existsSync(filePath)) {
  console.error(`File not found: ${filePath}`);
  process.exit(1);
}

// ── R2 config ───────────────────────────────────────────────────────────────
const ACCOUNT_ID = process.env.R2_ACCOUNT_ID ?? "aaeda758b9ce931517bb2da643a0f3f1";
const BUCKET = process.env.R2_BUCKET ?? "public";
const PUBLIC_BASE =
  process.env.R2_PUBLIC_URL ?? "https://pub-5d59c786708441b3a80620d87e7dee2b.r2.dev";
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ?? "e8f31a9a1be52a4530d40dac8323d395";
const SECRET_ACCESS_KEY =
  process.env.R2_SECRET_ACCESS_KEY ??
  Buffer.from(
    "OGEwNGFkOGZkMzkwNjg2ODIzZjA2MWI4MWFhM2NjOGYwYjczZGI2Zjc2YzFmNTkzMWZlMTY1ODMzYmM4YzhjYQ==",
    "base64",
  ).toString("utf8");

// ── Content type map ─────────────────────────────────────────────────────────
const CONTENT_TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const ext = path.extname(filePath).toLowerCase();
const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

// ── R2 key ───────────────────────────────────────────────────────────────────
const key = customKey ?? `images/${path.basename(filePath)}`;

// ── S3 client ────────────────────────────────────────────────────────────────
const client = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

// ── MD5 check ────────────────────────────────────────────────────────────────
const fileBuffer = fs.readFileSync(filePath);
const localMd5 = crypto.createHash("md5").update(fileBuffer).digest("hex");

let remoteEtag = null;
try {
  const head = await client.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  remoteEtag = (head.ETag ?? "").replace(/"/g, "");
} catch {
  // Object doesn't exist yet — proceed with upload
}

const publicUrl = `${PUBLIC_BASE}/${key}`;

if (remoteEtag === localMd5) {
  console.log(`Skipped (unchanged): ${publicUrl}`);
  console.log(`R2_URL=${publicUrl}`);
  process.exit(0);
}

// ── Upload ───────────────────────────────────────────────────────────────────
const fileSize = fs.statSync(filePath).size;
console.log(
  `Uploading ${path.basename(filePath)} (${(fileSize / 1024).toFixed(1)} KB) → ${BUCKET}/${key}`,
);

await client.send(
  new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
    ContentLength: fileSize,
  }),
);

console.log(`\n✅ ${publicUrl}`);
console.log(`R2_URL=${publicUrl}`);
