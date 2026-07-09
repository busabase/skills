---
name: publish-video
description: Render a Remotion composition from videos/*, confirm with user, then upload to Cloudflare R2 (default) or YouTube.
disable-model-invocation: false
allowed-tools: Bash(node:*), Bash(npx:*)
user-invocable: true
---

# Publish Video

Renders a `videos/*` Remotion composition and uploads to **Cloudflare R2** (default) or YouTube.

## 🚫 YouTube Upload Rules

**NEVER upload to YouTube if the video is used in influencer-related docs.**

A video is considered "influencer-related" if:
- Its slug is referenced by a `<BudaVideo>` component inside any file under `apps/buda/content/influencer/`
- Its MDX file is under `apps/buda/content/videos/` and the slug contains keywords like `influencer`, `thread`, `general-ai-enthusiast`, `seo-marketer`, etc.

**Rule:** Influencer assets are for creator distribution only — they should NOT appear on the official Buda YouTube channel. Only upload to R2.

## Buda changed-video workflow

Use this when a batch of Buda video source files, assets, or MDX docs changed and you do not want to name each composition manually.

```bash
# 1. Detect publishable videos affected by current git changes
node .agents/skills/publish-video/scripts/detect-changed.mjs

# Compare against a branch/ref instead of the working tree
node .agents/skills/publish-video/scripts/detect-changed.mjs --base origin/develop

# 2. Run publish preflight checks for the detected videos
node .agents/skills/publish-video/scripts/validate.mjs --changed

# 3. Print the publish plan only
node .agents/skills/publish-video/scripts/publish-changed.mjs

# 4. Render changed videos and upload MP4s to R2
node .agents/skills/publish-video/scripts/publish-changed.mjs --yes

# 5. Also upload changed MP4s to YouTube and retire old YouTube videos
node .agents/skills/publish-video/scripts/publish-changed.mjs --yes --youtube

# 6. Also upload to YouTube AND create Google Ads campaigns (ads.enabled=true in MDX)
node .agents/skills/publish-video/scripts/publish-changed.mjs --yes --youtube --ads
```

Detection rules:
- Changes under `videos/buda/src/<slug>/` affect matching publishable compositions from `video-channels.json`.
- Changes to shared video source such as `videos/buda/src/shared/`, `Root.tsx`, or shared assets affect all publishable compositions.
- Changes to `apps/buda/content/videos/<lang>/<slug>.mdx` are treated as metadata changes.
- Playlist assignment is resolved from MDX `playlistId` first, then `.agents/skills/publish-video/video-channels.json`.

YouTube behavior:
- YouTube cannot replace an existing video file.
- If the local MP4 MD5 is unchanged, YouTube upload is skipped and the old `youtubeId` is reused.
- If the local MP4 MD5 changed, a new YouTube video is uploaded, MDX gets the new `youtubeId`, and the previous YouTube video is set to `private` unless `--no-retire` is passed to the lower-level upload script.
- Metadata-only changes are detected for review, but they do not create a new YouTube upload unless the MP4 changed.

## Arguments

- `composition` (required): Remotion composition ID, e.g. `BudaOnboarding-zh-CN`
- `video-dir` (optional): Path to the Remotion project, default `videos/buda`
- `target` (optional): `r2` (default) or `youtube`
- `docs-file` (optional): MDX file to patch with video embed

## External MP4/SRT/Cover bundle workflow

Use this when the video is already exported outside Remotion and arrives as a bundle:

```text
project-en.mp4
project-en.srt
project-en-cover.jpg
```

The filename convention is:
- `<slug>-<lang>.mp4`
- optional captions: `<slug>-<lang>.srt`
- optional cover / YouTube thumbnail: `<slug>-<lang>-cover.jpg|png`

Supported language suffixes: `en`, `zh-CN`, `zh-TW`, `ja`, `pt`.

```bash
# 1. Print the plan only
node .agents/skills/publish-video/scripts/publish-bundle.mjs \
  --file /path/to/project-en.mp4 \
  --title "How to Keep AI Work Forecasted" \
  --description "A short Buda workflow demo for keeping AI work visible and reviewable." \
  --tags "buda,ai agents,workflow" \
  --playlist use-cases \
  --youtube

# 2. Execute: upload MP4/SRT/cover to R2, create/update MDX, upload to YouTube,
#    add playlist, upload captions, and set thumbnail.
node .agents/skills/publish-video/scripts/publish-bundle.mjs \
  --file /path/to/project-en.mp4 \
  --title "How to Keep AI Work Forecasted" \
  --description "A short Buda workflow demo for keeping AI work visible and reviewable." \
  --tags "buda,ai agents,workflow" \
  --playlist use-cases \
  --youtube \
  --yes
```

Optional overrides:

```bash
node .agents/skills/publish-video/scripts/publish-bundle.mjs \
  --file /path/to/project-en.mp4 \
  --slug project \
  --lang en \
  --caption /path/to/project-en.srt \
  --cover /path/to/project-en-cover.jpg \
  --playlist-id PLxxxxxxxxxxxxxxxx \
  --privacy unlisted \
  --youtube \
  --yes
```

What the bundle script does:
1. Infers slug/language from the MP4 filename.
2. Auto-detects sibling `.srt` and `-cover.jpg|png` files.
3. Uploads MP4 to `videos/buda/<filename>.mp4` in R2.
4. Uploads captions to `videos/buda/captions/`.
5. Uploads covers to `videos/buda/covers/`.
6. Creates or updates `apps/buda/content/videos/<lang>/<slug>.mdx` with `videoUrl`, `captionsUrl`, `coverUrl`, `playlistId`, and metadata.
7. Adds the slug to `content/videos/<lang>/meta.json`.
8. If `--youtube` is passed, uploads the MP4 through the existing idempotent YouTube flow.
9. Uploads captions to YouTube and sets the custom thumbnail after the YouTube video ID is known.

For follow-up-only operations:

```bash
node .agents/skills/publish-video/scripts/upload-youtube-caption.mjs \
  --video-id VIDEO_ID \
  --file project-en.srt \
  --lang en

node .agents/skills/publish-video/scripts/set-youtube-thumbnail.mjs \
  --video-id VIDEO_ID \
  --file project-en-cover.jpg
```

Idempotency:
- MP4 upload still uses `upload-youtube.mjs` MD5 state. Unchanged videos are skipped.
- Caption and thumbnail scripts keep separate MD5 state in `upload-state.json`; unchanged SRT/cover files are skipped.
- If only SRT or cover changes, use the follow-up scripts to update YouTube without re-uploading the MP4.

## Batch render & upload all compositions

```bash
# Render & upload all (sequential)
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs

# Render & upload with concurrency (2 parallel renders)
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --concurrency 2

# Only process a specific language variant
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --lang zh-CN
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --lang en

# Only process a single composition
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --composition buda-intro-general-zh-CN

# Dry run — preview what would happen without rendering or uploading
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --dry-run
node .agents/skills/publish-video/scripts/render-and-upload-all.mjs --dry-run --lang zh-CN
```

Renders compositions in `videos/buda` and uploads each to R2. Skips upload if remote MD5 matches local file. Continues on failure and prints a summary at the end.

---

### Step 1 — Render

```bash
cd <video-dir>
npx remotion render <composition> --output out/<composition>.mp4
```

Show output path and file size. **Ask user: "Render complete. Proceed to upload?"**

→ If no: stop.

---

### Step 2 — Upload

**If target is `r2` (default):**

Key path mirrors the local path: `videos/buda/<composition>.mp4`

```bash
node .github/skills/cdn-upload/scripts/upload.mjs \
  --file <video-dir>/out/<composition>.mp4 \
  --key videos/buda/<composition>.mp4
```

The script compares local MD5 against the remote ETag — if identical, upload is skipped automatically.
Prints the public URL. Show it to user.

**If target is `youtube`:**

**Preferred: upload from MDX (reads title/description/tags/playlistId automatically)**

```bash
node .agents/skills/publish-video/scripts/upload-youtube-from-mdx.mjs \
  --file <video-dir>/out/<composition>.mp4 \
  --mdx apps/buda/content/videos/<lang>/<slug>.mdx \
  --composition <composition-id> \
  --privacy unlisted
```

This reads metadata from the MDX frontmatter and after upload:
1. Looks up the playlist from `video-channels.json` using `--composition` (no manual config needed)
2. Automatically adds the video to the resolved playlist
3. Patches `youtubeId` and `playlistId` back into the MDX file
4. Retires the old video (sets to private) if content changed

Playlist resolution order: `--playlist-id` CLI > MDX `playlistId` field > `video-channels.json` auto-lookup.

To override playlist from CLI:
```bash
node .agents/skills/publish-video/scripts/upload-youtube-from-mdx.mjs \
  --file <video-dir>/out/<composition>.mp4 \
  --mdx apps/buda/content/videos/<lang>/<slug>.mdx \
  --playlist-id PLxxxxxxxxxxxxxxxx
```

**Manual: specify metadata directly**

```bash
node .agents/skills/publish-video/scripts/upload-youtube.mjs \
  --file <video-dir>/out/<composition>.mp4 \
  --title "<title>" \
  --description "<description>" \
  --tags "<tags>" \
  --privacy unlisted
```

Both scripts are **idempotent**: they compare the local file MD5 against the previously uploaded hash stored in `.agents/skills/publish-video/upload-state.json`. If the file hasn't changed, the upload is skipped and the existing YouTube video ID is returned. Use `--force` to override.

**When content changes (re-upload):** the old video is automatically set to `private` on YouTube (retired), preserving its data without keeping it public. Use `--no-retire` to skip this.

Upload state tracks full version history per file:
```json
{
  "/abs/path/to/out/buda-intro-general-zh-CN.mp4": {
    "youtubeId": "newId123",
    "md5": "abc123...",
    "uploadedAt": "2026-04-28T10:00:00.000Z",
    "title": "...",
    "history": [
      {
        "youtubeId": "oldId456",
        "md5": "def456...",
        "uploadedAt": "2026-01-01T00:00:00.000Z",
        "retiredAt": "2026-04-28T10:00:00.000Z",
        "retiredReason": "replaced by newId123"
      }
    ]
  }
}
```

---

### Step 3 — Create / Update MDX docs file

Every video **must** have a corresponding MDX file in `apps/buda/content/videos/<lang>/`.

**Preferred: use the scaffold script**

```bash
node .agents/skills/publish-video/scripts/create-mdx.mjs \
  --composition buda-intro-general-zh-CN \
  --title "用 Buda AI 提升工作效率" \
  --description "一分钟了解 Buda AI 如何帮你自动化日常任务" \
  --tags "buda,ai,效率,自动化" \
  --duration "1:23" \
  --video-url "https://cdn.buda.ai/videos/buda/buda-intro-general-zh-CN.mp4"
```

- If the MDX file **doesn't exist**: creates a full skeleton with all required sections and TODO markers.
- If the MDX file **already exists**: updates frontmatter only, preserves existing body content.
- Warns if the slug is missing from `meta.json`.

After running, fill in the `<!-- TODO -->` sections in the generated file.

#### MDX Frontmatter (required fields)

```yaml
---
title: "<YouTube-optimized title — 60 chars max, include primary keyword>"
description: "<YouTube description first line — 125 chars max, hook + keyword>"
videoUrl: "<R2_PUBLIC_URL>"
youtubeId: "<YouTube video ID if uploaded>"
playlistId: "<YouTube playlist ID e.g. PLxxxxxxxxxxxxxxxx>"
duration: "<M:SS>"
lang: <en | zh-CN | ja | pt>
publishedAt: "<YYYY-MM-DD>"
tags:
  - <primary keyword>
  - <secondary keyword>
  - ...up to 15 tags
---
```

#### MDX Body structure (required sections)

```mdx
<video width="100%" controls style={{ aspectRatio: "16/9" }}>
  <source src="<R2_PUBLIC_URL>" type="video/mp4" />
</video>
<a href="<R2_PUBLIC_URL>" download style={{ display: "inline-block", marginTop: "8px", fontSize: "14px" }}>⬇ Download</a>

## <Hook sentence — what the viewer will learn/achieve>

<Short 2-3 sentence intro that expands on the description. Include the primary keyword naturally.>

## What You'll Learn

- <Specific outcome 1>
- <Specific outcome 2>
- <Specific outcome 3>
- ...

## Timestamps

- 0:00 — Introduction
- <M:SS> — <Chapter title>
- ...

## Links

- <Primary CTA, e.g. "Get started free: https://buda.ai">
- <Secondary CTA, e.g. "Documentation: https://buda.ai/docs">
- <Community, e.g. "Discord: https://discord.gg/ZwGYvmqAb4">

## YouTube SEO Copy

> This section is for YouTube upload metadata. Copy-paste when uploading.

**Title:**
<Exact YouTube title — 60 chars max. Format: "[Action] [Product] — [Benefit/Keyword]">

**Description:**
<First 125 chars = hook (shown before "Show more"):>
<Full description — 3-5 paragraphs. Include: what the video covers, step-by-step summary, CTAs, links, hashtags at the end.>

**Tags (comma-separated):**
<tag1, tag2, tag3, ...up to 500 chars total>

**Hashtags (add to end of description):**
#<hashtag1> #<hashtag2> #<hashtag3>

**Thumbnail text suggestion:**
<Short punchy text for thumbnail overlay, e.g. "Get Started in 3 Min">

**Category:** Science & Technology
**Language:** <English | Chinese | Japanese | Portuguese>
**Audience:** Not made for kids
```

---

#### High-quality SEO guidelines for MDX content

**Title rules:**
- 40–60 characters
- Primary keyword near the front
- Format: `[Action verb] [Product] — [Benefit]` or `[Product]: [How to X in Y]`
- Avoid clickbait; be specific and accurate
- Examples: ✅ `How to Redeem Your Buda Reward Code` ❌ `Amazing Buda Feature You Must See`

**Description rules (YouTube "above the fold" = first 125 chars):**
- First sentence = hook + primary keyword + clear benefit
- Paragraphs: what the video covers → step-by-step → who it's for → CTAs
- Include 3–5 relevant links
- End with 3–5 hashtags: `#Buda #AIAgent #ProductivityTools`
- Total: 200–500 words for best YouTube SEO

**Tags rules:**
- 10–15 tags, mix of:
  - Exact match: `buda ai agent`
  - Broad: `ai productivity`
  - Long-tail: `how to use ai agent workspace`
  - Brand: `buda`, `openclaw`
- Total under 500 characters

**Timestamps rules:**
- Add if video > 2 minutes
- Every major section gets a timestamp
- Format: `0:00 — Intro`, `1:23 — Setting up your workspace`
- YouTube auto-creates chapters from timestamps in description

**Thumbnail text:**
- 3–6 words max
- High contrast, readable at small size
- Action-oriented: "Get Started in 3 Min", "Redeem Your Code"

---

### Step 4 — Patch docs file (if `docs-file` provided)

**For R2:** Replace `<!-- VIDEO_PLACEHOLDER -->` with:

```mdx
<video width="100%" controls style={{ aspectRatio: "16/9" }}>
  <source src="<R2_PUBLIC_URL>" type="video/mp4" />
</video>
<a href="<R2_PUBLIC_URL>" download style={{ display: "inline-block", marginTop: "8px", fontSize: "14px" }}>⬇ Download</a>
```

**For YouTube:** Replace `<!-- YOUTUBE_PLACEHOLDER -->` with:

```mdx
<iframe
  width="100%"
  style={{ aspectRatio: "16/9" }}
  src="https://www.youtube.com/embed/<VIDEO_ID>"
  title="<title>"
  allowFullScreen
/>
```

Show the change and ask user to confirm before writing.

---

## Naming convention (CRITICAL — all three must match)

**Rule: Composition ID = R2 filename = MDX slug. All kebab-case.**

```
Composition ID:  buda-intro-general-zh-CN
R2 file:         videos/buda/buda-intro-general-zh-CN.mp4
MDX file:        content/videos/zh-CN/buda-intro-general.mdx
```

### Language suffix → MDX directory

| Composition suffix | MDX directory |
|---|---|
| (none) | `en/` |
| `-zh-CN` | `zh-CN/` |
| `-zh-TW` | `zh-TW/` |
| `-ja` | `ja/` |
| `-pt` | `pt/` |

### Adding a new video — checklist

1. Add `<Composition id="kebab-name-lang" ... />` in `Root.tsx`
2. Add `"kebab-name-lang"` to `COMPOSITIONS` in `render-and-upload-all.mjs`
3. Create `content/videos/<lang>/kebab-name.mdx` with matching `videoUrl`
4. Add slug to `content/videos/<lang>/meta.json`

### Special cases (legacy)

- `buda-intro-kelly` (no suffix) → `zh-CN/` (Kelly speaks Chinese)
- `buda-intro-kelly-en` → `en/`
- `buda-producthunt` (no `-en` suffix) → `en/`
- `sandock-producthunt` (no `-en` suffix) → `en/`



Remotion compositions follow this naming pattern:

| Composition ID | Language | File |
|---|---|---|
| `BudaIntroGeneral` | English (default) | `BudaIntroGeneral.mp4` |
| `BudaIntroGeneral-zh-CN` | Simplified Chinese | `BudaIntroGeneral-zh-CN.mp4` |
| `BudaIntroGeneral-zh-TW` | Traditional Chinese | `BudaIntroGeneral-zh-TW.mp4` |
| `BudaIntroGeneral-ja` | Japanese | `BudaIntroGeneral-ja.mp4` |
| `BudaIntroGeneral-pt` | Portuguese | `BudaIntroGeneral-pt.mp4` |

**MDX file mapping:**
- `en/` → use the base composition (no suffix, e.g. `BudaIntroGeneral.mp4`)
- `zh-CN/` → use `-zh-CN` suffix
- `zh-TW/` → use `-zh-TW` suffix (create `zh-TW/` MDX if needed)
- `ja/` → use `-ja` suffix
- `pt/` → use `-pt` suffix

**When uploading multi-language videos:**
1. Upload all language variants to R2 with their full names
2. Update the corresponding MDX `videoUrl` for each language
3. Replace `{/* VIDEO_PLACEHOLDER */}` with the actual `<video>` embed
4. YouTube upload: each language = separate YouTube video (different title/description/tags in that language)
5. YouTube does NOT replace existing videos — each upload creates a new video. Only upload if the local file MD5 has changed from the previously recorded hash.

**Tracking uploaded YouTube videos:**
Record YouTube video IDs in the MDX frontmatter `youtubeId` field after upload.



Set these env vars (add to `~/.bashrc` or `~/.zshrc`):

```bash
export R2_ACCOUNT_ID="your_account_id"
export R2_ACCESS_KEY_ID="your_access_key_id"
export R2_SECRET_ACCESS_KEY="your_secret_access_key"
export R2_BUCKET="your_bucket_name"
export R2_PUBLIC_URL="https://your-custom-domain-or-r2-public-url"
```

**Where to get these:**
1. [Cloudflare Dashboard](https://dash.cloudflare.com) → R2 Object Storage → Manage R2 API Tokens
2. Create API Token with Object Read & Write on your bucket
3. Account ID is shown in the right sidebar of the dashboard

## Requirements

- Node.js 24.18.0 LTS
- `@aws-sdk/client-s3` in workspace root: `pnpm add -w @aws-sdk/client-s3`
- For YouTube: `googleapis` in workspace root: `pnpm add -w googleapis`

## Brand links (use real URLs, never placeholders)

Always use the real community/product links in MDX content. Never use placeholder URLs like `https://discord.gg/buda`.

| Link | URL |
|---|---|
| Discord community | `https://discord.gg/ZwGYvmqAb4` |
| Buda app | `https://buda.ai` |
| Buda docs | `https://buda.ai/docs` |

If a new video's MDX uses a wrong/placeholder Discord link, batch-fix all MDX files:
```bash
find apps/buda/content/videos/ -name "*.mdx" -exec \
  sed -i 's|https://discord.gg/buda|https://discord.gg/ZwGYvmqAb4|g' {} \;
```

## Video placeholder syntax

Use JSX comment syntax (not HTML comment) in MDX files:

```mdx
{/* VIDEO_PLACEHOLDER */}
```

NOT `<!-- VIDEO_PLACEHOLDER -->` — that's HTML and won't work in MDX.

When patching, replace `{/* VIDEO_PLACEHOLDER */}` with the `<video>` embed block.

## Google Ads Campaign Management

Google Ads automation (both Video and SEM) has moved to the `ads` skill. See `.agents/skills/ads/SKILL.md`.

Quick reference for the common video path:

```bash
# Create a Google Ads Video Campaign from MDX frontmatter
node .agents/skills/ads/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx

# Pause via MDX or campaign ID
node .agents/skills/ads/scripts/pause-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx
```

`publish-changed.mjs --ads` already wires through to the new location. MDX `ads:` frontmatter contract is unchanged. See `.agents/skills/ads/GOOGLE-ADS.md` for auth setup and field reference.

## Weekly Analytics Report

Generate a Markdown report of last week's YouTube performance for all tracked videos:
```bash
# Print to terminal
node .agents/skills/publish-video/scripts/weekly-report.mjs

# Save to file
node .agents/skills/publish-video/scripts/weekly-report.mjs --output weekly-2026-04-28.md

# Specific week (any date within that week)
node .agents/skills/publish-video/scripts/weekly-report.mjs --week 2026-04-21

# Raw JSON (for further processing)
node .agents/skills/publish-video/scripts/weekly-report.mjs --json
```

Report includes:
- 总览：总播放量、总观看时长、新增订阅、点赞、评论
- 播放列表汇总：4 个分类各自的数据
- 每个分类下的视频明细：播放量、观看时长、平均完播率、平均时长
- 本周 Top 5 视频

Data comes from YouTube Analytics API using the same OAuth token as the upload scripts.
Videos are read from `upload-state.json` — only uploaded videos are included.

## Channel Classification (`video-channels.json`)

All YouTube playlist assignments are managed in one place:
`.agents/skills/publish-video/video-channels.json`

### Playlists

| Key | Title | Playlist ID | Description |
|-----|-------|-------------|-------------|
| `onboarding` | Getting Started with Buda | `PLuHcfaOt6gxsrosq_4mDZv1kWmfm3eREZ` | Onboarding guides, reward codes, WeChat setup |
| `product-intro` | What is Buda? | `PLuHcfaOt6gxt3jBbVHC9CZ-Q-PUmwKyZo` | General intros, sales demos, feature walkthroughs |
| `use-cases` | Buda in Action | `PLuHcfaOt6gxtxVn8H59QkUJJzYiy3m_0w` | E-commerce, finance, creator, SEO workflows |
| `launch` | Launch & Announcements | `PLuHcfaOt6gxs4QEeATZeJs9izjrUhwn6T` | Product launches and major announcements |

All languages are mixed within each playlist. Sandock compositions are excluded.

**Adding a new composition:** Add one line to `compositions` in `video-channels.json` mapping the composition ID to a playlist key. No other config needed.

**Retiring a video manually:**
```bash
node .agents/skills/publish-video/scripts/retire-youtube-video.mjs \
  --video-id VIDEO_ID \
  --reason "replaced by new version"
```

## Known Gotchas

- **`__dirname` in ESM**: In `.mjs` files, `__dirname` resolves relative to the script file, not the cwd. Use absolute paths or accept paths as CLI args — never infer project root via `../` chains.
- **remotion + spawnSync**: Remotion writes progress to stderr. Use `spawnSync` and check `r.status !== 0` rather than `execSync` in a try/catch — otherwise stderr output is misread as an error.
- **nohup + stdio**: When running in background with nohup, use `stdio: "pipe"` (not `"inherit"`) and set `maxBuffer: 100 * 1024 * 1024` to avoid buffer overflow on long renders.
- **YouTube duplicate uploads**: Never call `upload-youtube.mjs` without checking `upload-state.json` first. The script handles this automatically — but if you bypass it with raw `googleapis` calls, you'll create duplicate videos.
- **upload-state.json keys are absolute paths**: If you move the `out/` directory or run from a different machine, the state won't match. Use `--force` to re-upload in that case.
- **MDX frontmatter parser**: `create-mdx.mjs` uses a simple line-by-line YAML parser (no external deps). It handles strings and arrays but not nested objects. Don't add nested YAML to frontmatter.
