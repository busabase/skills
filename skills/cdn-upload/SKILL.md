---
name: cdn-upload
description: Upload any file (images, videos, PDFs, etc.) to Cloudflare R2 public CDN bucket and return a ready-to-use public URL. Use for blog covers, event photos, videos, assets — anything you want hosted on CDN without committing to git.
disable-model-invocation: false
allowed-tools: Bash(node:*)
user-invocable: true
---

# cdn-upload (CDN 图床 / 视频床)

Uploads one or more files to the Cloudflare R2 **public** bucket and returns public CDN URLs.

Files are **not committed to git** — they live in R2 and are served via CDN.

## Supported formats

Images: PNG · JPG/JPEG · WebP · GIF · SVG · AVIF · ICO  
Video: MP4 · WebM  
Other: PDF · any binary

## Arguments

- `files` (required): One or more local file paths to upload
- `prefix` (optional): R2 key prefix/folder, e.g. `blog/covers` or `assets/events/2026-04-16`. Defaults to `uploads/`
- `key` (optional): Full custom R2 key (single file only). Overrides `prefix`.

## Workflow

### Step 1 — Confirm files

List the files to upload and their sizes. Show the target R2 key path for each.

**Ask user: "Upload these N file(s) to CDN?"**
→ If no: stop.

### Step 1.5 — Compress large images before upload

For image files (PNG, JPG, JPEG, WebP, AVIF) **larger than 500 KB**, auto-compress before uploading:

```bash
tsx .agents/skills/optimize-images/scripts/optimize-images.ts <path/to/image.png> --quality 85 --no-backup
```

- Skip this step for SVG, GIF, ICO, video, PDF, and other non-raster formats.
- Skip if the file is already ≤ 500 KB.
- Show before/after size so the user sees the savings.

### Step 2 — Upload

For each file:

```bash
node .github/skills/cdn-upload/scripts/upload.mjs \
  --file <path/to/image.png> \
  --key <prefix/filename.png>
```

Key naming rule:
- Default: `images/<filename>`
- With prefix: `<prefix>/<filename>`
- With explicit key: use as-is

The script skips upload if the remote file MD5 matches the local file (no re-upload of unchanged files).

### Step 3 — Return URLs

Print a clean summary:

```
✅ Uploaded N file(s):

  blog/covers/my-cover.png
  → https://pub-5d59c786708441b3a80620d87e7dee2b.r2.dev/blog/covers/my-cover.png

  assets/events/photo.jpg
  → https://pub-5d59c786708441b3a80620d87e7dee2b.r2.dev/assets/events/photo.jpg
```

If a docs or MDX file is mentioned, offer to patch the `image:` frontmatter field with the new CDN URL.

## Examples

### Upload a blog cover
```
/cdn-upload my-cover.png --prefix blog/covers
```

### Upload multiple event photos
```
/cdn-upload photo1.jpg photo2.jpg photo3.jpg --prefix assets/events/2026-04-16
```

### Upload a video (quick, without full publish-video pipeline)
```
/cdn-upload demo.mp4 --prefix videos/demos
```

### Exact custom key
```
/cdn-upload avatar.png --key profiles/kelly/avatar.png
```

## CDN Base URL

All public files are served from:
```
https://pub-5d59c786708441b3a80620d87e7dee2b.r2.dev/<key>
```

## Notes

- Files are **publicly accessible** immediately after upload — no signing needed
- Skips re-upload if file content is unchanged (MD5 ETag check)
- For the full video pipeline (render → upload → MDX docs), use `publish-video` instead
  — `publish-video` internally reuses `.github/skills/cdn-upload/scripts/upload.mjs`
- Max recommended file size: 100 MB (R2 single-part upload limit)
