---
name: optimize-images
description: Optimize and compress images with sharp — a single file, a directory, or a full apps/* batch scan. Reduces file size (60-80%), optionally resizes and converts to WebP/JPEG/AVIF/PNG. Use when an image is too large, before committing assets, or to web-optimize screenshots/gallery/features across all apps.
disable-model-invocation: false
allowed-tools: Bash(tsx:*), Bash(pnpm:*)
argument-hint: "[image-or-dir-path] [--width W] [--quality Q] [--format webp|jpeg|avif|png] [--min-size KB] [--dry-run] [--no-backup]"
---

# Optimize Images

One skill for all image compression. The argument decides the mode:

| Argument | Mode | Defaults |
|----------|------|----------|
| `<file>` | **Single file** | keep dimensions, keep format, no size floor |
| `<dir>`  | **Directory** (recursive) | resize ≤1600px, → WebP, skip < 500KB |
| _(none)_ | **Batch** — scans `apps/*/public/assets/{screenshots,gallery,features}` | resize ≤1600px, → WebP, skip < 500KB |

All modes: backup original as `*.original.<ext>` (git-ignored), show before/after sizes, support `--dry-run`.

## Usage

```bash
# Single image — compress in place, keep its format & dimensions
pnpm optimize-images path/to/image.png
tsx .claude/skills/optimize-images/scripts/optimize-images.ts path/to/image.png --quality 85 --no-backup

# Single image — convert to WebP
tsx .claude/skills/optimize-images/scripts/optimize-images.ts path/to/image.png --format webp

# A whole directory (recursive): resize + WebP
tsx .claude/skills/optimize-images/scripts/optimize-images.ts apps/buda/public/assets

# Batch across all apps (screenshots/gallery/features)
pnpm optimize-images

# Preview anything first
pnpm optimize-images --dry-run
tsx .claude/skills/optimize-images/scripts/optimize-images.ts path/to/image.png --dry-run
```

## Options

- `[path]` — file → single mode; directory → recursive mode; omit → apps/* batch scan
- `--width <n>` / `-w` — max width in px (resize, never enlarges). Single mode: no resize unless set.
- `--quality <n>` / `-q` — quality 1-100 (default 90)
- `--format <webp|jpeg|avif|png>` / `-f` — output format. Single mode: keep original unless set; dir/batch default WebP.
- `--min-size <KB>` — skip files smaller than this. Single mode default 0; dir/batch default 500.
- `--dry-run` / `-d` — preview without writing
- `--no-backup` — skip the `.original` backup copy

## When to use

- Reduce one specific large image before committing → single mode
- Optimize a folder of assets → directory mode
- Web-optimize screenshots/gallery/features across all apps for production → batch mode

## Expected results

- 60-80% size reduction on large PNG/JPEG; modern WebP/AVIF output
- Maintained visual quality; original dimensions preserved unless `--width` given
- Originals backed up with `.original` suffix (unless `--no-backup`)
