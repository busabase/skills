---
name: generate-app-gallery-pptx
description: Generate PPTX file from slides.json and assets. Pure execution skill - no user interaction. Called by generate-app-gallery command after assets are ready.
disable-model-invocation: true
allowed-tools: Bash(tsx:*), Read, Write
argument-hint: "app-name [--language] [--tone] [--slides-count]"
---

# Generate App Gallery PPTX

Pure execution skill that generates PPTX from prepared slides.json and assets. No validation or user interaction - assumes all prerequisites are met by the calling command.

## Goal

Execute PPTX generation script with slides configuration and assets:
- Read `slides.json` specification
- Load assets from `src/` directory
- Generate final `gallery.pptx` file

## Prerequisites (Must be satisfied by caller)

1. ✅ App directory exists: `apps/<app>/marketing/gallery/`
2. ✅ Assets directory exists: `apps/<app>/marketing/gallery/src/`
3. ✅ At least one background: `src/gallery-bg-0.png` OR path reference in slides.json
4. ✅ At least one screenshot: Can reference `public/assets/screenshots/` directly (no need to copy)
5. ✅ slides.json exists (or will be generated with paths)

## Execution

Simply runs the PPTX generation script:

```bash
tsx .claude/skills/generate-app-gallery-pptx/scripts/generate-pptx.ts \
  --app <appName> \
  --language <language> \
  --tone <tone> \
  --slides-count <count>
```

## Inputs

- `appName`: string (required) - App directory name under `apps/`
- `language`: "en" | "zh" | "bilingual" (default: "en")
- `tone`: "minimal" | "bold" | "playful" | "serious" (default: "bold")
- `slidesCount`: 3-5 (default: 5)

## Expected File Structure (by caller)

```
apps/<appName>/
└── marketing/
    └── gallery/
        ├── src/
        │   ├── gallery-bg-0.png      # Required
        │   ├── gallery-bg-1.png      # Optional
        │   ├── screenshot-01.png     # Required (1+)
        │   ├── screenshot-02.png
        │   └── ...
        ├── slides.json               # Generated
        └── gallery.pptx              # Generated output
```

## What the script does

The TypeScript script (`scripts/generate-pptx.ts`) will:

1. **Generate slides.json** (if not exists)
   - Create 3-5 slides with roles: hero/problem/solution/workflow/proof
   - Generate headlines/subtext based on language and tone
   - Assign layouts from allowed set
   - Map backgrounds and screenshots to each slide

2. **Build PPTX**
   - Use PptxGenJS library (or similar)
   - Load slides.json configuration
   - Apply layouts with backgrounds and screenshots
   - Export to `gallery.pptx`

## Allowed Layouts

Script uses one of:
- `hero-left`, `hero-center`
- `split-ui-left`, `split-ui-right`
- `workflow-3step`
- `problem-solution`
- `quote-proof`

## slides.json Format (script generates/reads)

```json
{
  "meta": {
    "app": "myapp",
    "generatedAt": "2026-01-22",
    "language": "en",
    "tone": "bold"
  },
  "slides": [
    {
      "index": 1,
      "role": "hero",
      "headline": "Build X in minutes",
      "subtext": "One prompt → finished result",
      "layout": "hero-left",
      "bg": "gallery-bg-0.png",
      "images": ["screenshot-01.png"],
      "bullets": ["Point A", "Point B"]
    }
  ]
}
```

## Output

The script generates:
- ✅ `apps/<app>/marketing/gallery/slides.json` (if not exists)
- ✅ `apps/<app>/marketing/gallery/gallery.pptx`

Returns exit code:
- `0` = Success
- `1` = Error (missing files, invalid config, etc.)

## Script Location

`/home/kelly/Documents/kapps2/.claude/skills/generate-app-gallery-pptx/scripts/generate-pptx.ts`

**TODO:** Create this script with:
- PptxGenJS or similar library
- slides.json parser
- Layout templates implementation
- Asset loading from src/

## Usage (Called by command)

The parent command (`/generate-app-gallery`) will call this skill after ensuring:
- All assets are in place
- User has made all decisions
- Prerequisites are satisfied

This skill doesn't ask questions - it just executes.

## Error Handling

Script should fail fast with clear messages:
- Missing `gallery-bg-0.png` → exit 1
- No `screenshot-*` files → exit 1
- Invalid slides.json → exit 1
- PPTX generation failed → exit 1

## Example Invocation (by command)

```typescript
// From /generate-app-gallery command
await runSkill('generate-app-gallery-pptx', {
  appName: 'productready',
  language: 'en',
  tone: 'bold',
  slidesCount: 5
});
```

Or via bash:
```bash
tsxNotes

This is a **pure execution skill** with no intelligence or user interaction:
- No validation (caller ensures prerequisites)
- No user prompts (caller handles all interaction)
- No file checking (caller prepares assets)
- Just runs the script and reports result

All the smart logic lives in `/generate-app-gallery` command.

## Related

- `/generate-app-gallery` - Parent command (orchestrates workflow, handles user interaction)
- `/gallery-bg-image-generator` - Background generation skill (also called by parent)
- Script: `scripts/generate-pptx.ts` - Actual PPTX builder (TODO: needs implementation)
```

## Related Skills

- `/generate-app-gallery` - Main command (orchestrates this skill + bg generation)
- `/gallery-bg-image-generator` - Generate background images
- `/optimize-images` - Compress large images before use
