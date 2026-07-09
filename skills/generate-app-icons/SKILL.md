---
name: generate-app-icons
description: Generate multi-format icons (16px-512px PNG, favicon.ico, apple-touch-icon, PWA) from icon.svg — for all apps, one app, or a theme-aware favicon with a colored circular/rounded background. Use when creating icons, updating app logos, regenerating assets, or making a favicon that reads well in dark and light browser themes.
disable-model-invocation: false
allowed-tools: Bash(tsx:*), Bash(pnpm:*)
argument-hint: "[--app NAME] [--favicon-only] [--shape circle|rounded] [--bg #ffffff] [--radius 20]"
---

# Generate App Icons

Generates icon files from `public/assets/icons/icon.svg`. One skill covers three jobs:

| Invocation | What it does |
|------------|--------------|
| _(no args)_ | Batch: every app — full PNG set + plain `favicon.ico` |
| `--app NAME` | Same, but only that app |
| `--app NAME --bg <color> [--shape …]` | **Theme-aware favicon**: icon centered on a shaped, colored background (good for dark/light tab bars) |

## What it generates

For each app with `public/assets/icons/icon.svg`:
- PNG icons: 16, 32, 48, 128, 180 (apple-touch), 192 & 512 (PWA)
- `favicon.ico` in `src/app/` (Next.js convention) or `public/`

## Usage

```bash
# All apps — full icon set + plain favicons
pnpm generate-app-icons
tsx .claude/skills/generate-app-icons/scripts/generate-app-icons.ts

# One app only
tsx .claude/skills/generate-app-icons/scripts/generate-app-icons.ts --app geodrone

# Theme-aware favicon (white rounded background), full set too
tsx .claude/skills/generate-app-icons/scripts/generate-app-icons.ts --app geodrone --bg "#ffffff" --shape rounded

# Just (re)write the themed favicon, skip the PNG set
tsx .claude/skills/generate-app-icons/scripts/generate-app-icons.ts --app geodrone --bg "#1a1a1a" --shape circle --favicon-only
```

## Mobile (Expo) app icons — `generate-mobile-icons.ts`

The favicon/PWA set above caps at **512px** (the PWA maximum). The **App Store** marketing icon must
be **1024×1024 with NO alpha channel** (Apple's uploader rejects any transparency). That's a different
asset (`apps/<app>-mobile/assets/icon.png`), so it has its own script:

```bash
# All mobile apps (buda-mobile, busabase-mobile, inpomo-mobile)
tsx .claude/skills/generate-app-icons/scripts/generate-mobile-icons.ts

# One app
tsx .claude/skills/generate-app-icons/scripts/generate-mobile-icons.ts --app buda-mobile
```

Per app it writes:
- `assets/.../icon.png` — **1024×1024, flattened over the brand bg → no alpha** (the iOS icon)
- `assets/.../adaptive-icon.png` — **1024×1024, transparency kept** (the Android adaptive foreground)

Sources live in the `TARGETS` array in the script: busabase renders from its square vector
`apps/busabase/public/icon.svg`; buda/inpomo use their own 1024 PNG masters (their SVGs are
non-square / a PNG wrapper). To onboard a new mobile app, add a `TARGETS` entry. Rebuild the native
app afterward to embed the new icons.

## Options

- `--app NAME` / `-a` — limit to one app (omit → all apps)
- `--favicon-only` — skip the PNG set, only (re)write `favicon.ico`
- `--bg <color>` / `-b` — background color (`#ffffff`, `#1a1a1a`, `transparent`). **Presence switches on themed mode.**
- `--shape <circle|rounded>` / `-s` — themed favicon shape (default `rounded`)
- `--radius <n>` / `-r` — rounded-corner radius as % of size (default 20)

**Theme-aware favicon** puts the icon (at 75%, padded) on a colored circle/rounded-square so it stays legible against both light and dark browser tab bars. Suggested backgrounds: `#ffffff` for dark logos, `#1a1a1a` for light logos.

## Output

- Batch runs also write `scripts/icon-status.md` (per-app ✓/✗ table). Single-app runs print the table to the console only.

## When to use

- After creating or updating an app's `icon.svg`
- Setting up a new app, or regenerating icons across many apps
- Crafting a favicon that works in both dark and light themes (themed mode)

## Requirements

- Each app must have `public/assets/icons/icon.svg`
- Dependencies: `sharp`, `png-to-ico` (already in workspace)
