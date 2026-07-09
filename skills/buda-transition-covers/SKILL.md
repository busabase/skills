---
name: buda-transition-covers
description: Create bilingual English and Simplified Chinese Buda video covers from a voiceover script, demo video, existing apps/buda video metadata, and real apps/buda product implementation. Use when the user asks to add, generate, design, or update a Buda transition cover, video cover, export cover, intro cover, use-case cover, HyperFrames cover, or cover image from a script/口播稿/video/keyword such as automation, projects, marketplace, workbench, channels, agents, or developer portal.
---

# Buda Transition Covers

Create new Buda video covers inside the existing Remotion cover system or a Buda HyperFrames video project. Each cover should be grounded in the user's voiceover script, demo video, matching video metadata, and real `apps/buda` implementation details.

## Output

For each new cover, first classify the cover type, then produce the aspect ratios the user requested. Default to horizontal 16:9 only unless the user asks for vertical or multi-format covers.

Cover type determines the Remotion folder and composition ID prefix:

- Transition card inside a video: use folder `Transition-Covers` and IDs `tc-<slug>`
- Video export cover for an intro/explainer: use the shared folder `Video-Covers` and IDs `intro-<slug>`
- Video export cover for a product use case: use the shared folder `Video-Covers` and IDs `use-case-<slug>`

When the user references a cover/export folder name such as `intro-projects-sessions`, `intro-workbench-ui`, `use-case-automation`, or `use-case-generate-editable-ppt`, use that exact slug and do not create a `tc-*` ID. Keep `tc-*` available for future Transition-Covers work; do not migrate unrelated historical `tc-*` items unless the user asks.

For the default horizontal cover, produce:

- English composition: `<prefix>-<slug>`
- Simplified Chinese composition: `<prefix>-<slug>-zh-CN`

If the user asks for vertical/social versions, also produce:

- 9:16 English composition: `<prefix>-<slug>-9x16`
- 9:16 Simplified Chinese composition: `<prefix>-<slug>-9x16-zh-CN`

All requested formats must share the same core copy and visual asset, but each aspect ratio needs its own composition-safe layout/crop decisions. Also produce:

- Cover config entries in `videos/buda/src/buda-transition-cover/BudaTransitionCover.tsx`
- Composition registrations in `videos/buda/src/Root.tsx`, under `<Folder name="Transition-Covers">` for `tc-*` or the shared `<Folder name="Video-Covers">` for `intro-*` and `use-case-*`
- Screenshot or visual assets in `videos/buda/public/buda-transition-cover/` only when needed
- A changelog in `videos/buda/changelog/YYYYMMDD-<slug>-transition-cover.md`

### Mandatory 3-second video intro

Unless the user explicitly says "only export a cover image" or "只要封面图", every cover task MUST also attach the chosen cover to the target video as the first 3 seconds:

- The cover is visible from `0s` to `3s`.
- The original video/content starts at `3s`.
- The final project duration increases by 3 seconds.
- The cover must disappear completely after `3s`; it must not remain as an overlay.
- If there are multiple language/aspect-ratio covers, attach the matching cover to the matching video/composition. If there is no target video yet, state that the cover is ready and the 3-second intro cannot be attached until a target video/composition is provided.

For HyperFrames projects, add the cover as a timed `class="clip"` composition/image/div at `data-start="0"` and `data-duration="3"`, shift the original video/media and later clips by `+3`, and update the root `data-duration` by `+3`. For Remotion projects, add a `Sequence` from frame `0` for `3 * fps` frames, shift the main video/content to start at `3 * fps`, and increase the composition duration by `3 * fps`.

The cover itself should be static by default. Do not add title fade-ins, screenshot fly-ins, sequential build animations, or timeline choreography unless the user explicitly asks for animated cover motion. HyperFrames still requires a `window.__timelines` registration for each composition; use an empty paused timeline for static covers.

## Workflow

### 1. Build Context

Read the user-provided voiceover script first. Extract:

- The main product capability
- The problem or workflow being shown
- The expected viewer takeaway
- Important nouns that should guide keyword search

Then search for matching Buda video metadata:

```bash
rg -n "<keyword>|<related keyword>" apps/buda/content/videos videos/buda/src
```

Read the closest English and Chinese MDX files under:

```text
apps/buda/content/videos/en/
apps/buda/content/videos/zh-CN/
```

If the user gives a product keyword such as `automation`, `projects`, `marketplace`, or `workbench`, also inspect the real app implementation instead of relying only on copy:

```bash
rg -n "<keyword>|<domain term>" apps/buda/src apps/buda/content/spec apps/buda/content/blog apps/buda/content/changelog
```

Prefer domain code, components, tests, and changelogs that prove the actual product behavior. Example for automation:

```bash
rg -n "automation|automations" apps/buda/src apps/buda/tests apps/buda/content/changelog apps/buda/content/blog
```

### 2. Choose Copy

Create one English title/subtitle and one Simplified Chinese title/subtitle.

Rules:

- Keep titles short enough for the left column. Use `\n` for intentional line breaks only when the break creates natural semantic chunks.
- If the user asks for a how-to structure, or the script is a step-by-step demo, make the title explicitly how-to: English `How to ...`, Simplified Chinese `如何...`.
- English title: usually 2-6 words, product-specific, not hype.
- Chinese title: concise Simplified Chinese, natural for Chinese readers, not literal translation. Never leave a single Chinese character alone on a line; prefer balanced 2-line breaks such as `如何自动生成\n每日 AI 新闻报告`.
- Subtitle: one clear sentence fragment that explains the workflow or outcome.
- Do not over-break short subtitles. If a subtitle fits comfortably on one line, keep it one line. If it needs two lines, each line should be a natural phrase; avoid splitting a phrase such as `用会话和项目 / 同时推进多个任务` unless the break improves rhythm.
- Keep copy semantically identical across aspect ratios for the same language. The 16:9 and 9:16 versions must use the same title and subtitle wording; the vertical version may only add natural line breaks for layout. Do not rewrite, shorten, swap nouns, or remove product concepts in the vertical cover just to fit the frame.
- Do not end cover titles or subtitles with sentence-ending punctuation. Remove trailing `.`, `。`, `,`, `，`, `!`, `！`, `?`, `？`, `;`, `；`, `:`, or `：`; keep punctuation inside the sentence only when it improves readability.
- For vertical covers, manually inspect both title and subtitle line breaks. Do not allow orphan lines: no single Chinese character or punctuation-only line, and no single English word left alone on the last line. Use explicit `\n` in titles or subtitles when needed, but keep the line breaks semantically natural. Horizontal and vertical versions may use different line breaks: horizontal should use the available width, while vertical should stay crop-safe and balanced.
- Ground the copy in real Buda behavior. Do not promise capabilities not visible in `apps/buda`.
- Avoid breathless marketing words such as game-changing, shocking, revolutionary, 颠覆, 震惊, 赋能.

### 3. Choose Visual And Aspect Ratios

First determine requested output formats:

- If the user only says cover/封面, create 16:9 horizontal compositions.
- If the user says vertical/竖屏/social/shorts/reels/TikTok, create 9:16 variants in addition to 16:9 unless they specify another exact ratio. Treat 3:4 as a crop target of the 9:16 design unless the user explicitly asks for standalone 3:4 composition IDs.
- If the user explicitly names `9:16`, `16:9`, horizontal, or vertical, produce exactly those requested ratios plus both languages. Treat `9:16` as 1080×1920 and 16:9 as 1920×1080. If the user mentions `3:4` or `4:3` as a channel/crop requirement, keep the 9:16 composition crop-safe for centered 3:4 export instead of registering extra IDs, unless they explicitly request separate 3:4 compositions.

Reuse the existing cover visual system in:

```text
videos/buda/src/buda-transition-cover/BudaTransitionCover.tsx
videos/buda/public/buda-transition-cover/
```

Visual options:

- If a real screenshot exists, add it to `videos/buda/public/buda-transition-cover/` and set `screenshotSrc`.
- Keep the core layout grid fixed. In horizontal covers, the left text container and the right mock container keep their shared x/y/width/height. In vertical covers, the title/subtitle grid and mock container keep the shared stack rhythm. Do not fix perceived spacing by moving the whole text container or the whole mock container per cover.
- If a screenshot needs cropping, use config fields already supported by `TransitionCoverConfig` such as `imageObjectFit`, `imageObjectPosition`, `imageScale`, `imageTranslateX`, `imageTranslateY`, and `titleFontSize`. Do not move the screenshot container when the user asks to reposition the image content; keep the container fixed and adjust the image inside it.
- If no screenshot exists or a conceptual product model is clearer, add a small custom visual branch in `BudaTransitionCover.tsx`, following existing custom visuals such as `multi-channel`, `channel-overview`, or `projects`.
- For 3:4 and 9:16 layouts, treat the title, subtitle, and visual/mock as one compact vertical stack. The title-to-subtitle gap and subtitle-to-visual gap must be consistent across English and Chinese variants of the same cover. Prefer fixed layout rhythm over natural-flow placement: compute or set the mock top from the title block, subtitle line count, and a fixed copy-to-visual gap. The subtitle-to-visual gap should usually be 4-8% of canvas height: about 75-150px on 1080x1920 and 55-115px on 1080x1440. Avoid a large empty middle band; if the gap feels too open, adjust copy line breaks or typography first, not the mock x/y. Keep the mock fully inside the canvas safe margins; do not horizontally overflow or crop the browser frame just to fill vertical space.

Do not create a separate cover framework. Extend the existing component.

When implementing covers in HyperFrames instead of Remotion, match the same Buda cover style and behavior:

- Do not place visible labels such as `Buda use case` / `Buda 用例` inside the cover unless the user explicitly requests a label.
- Embed font assets with `@font-face` instead of relying on locally installed system fonts. Remotion Studio may preview local fonts, but HyperFrames renders must be self-contained.
- Keep the browser mock frame and the screenshot crop separate. The mock frame should stay on the shared layout grid, while the image inside the frame is adjustable per composition.
- Support per-composition CSS variables for manual tuning: `--image-x` and `--image-y` for the screenshot inside the mock; `--mock-x`, `--mock-y`, `--mock-w`, and `--mock-h` only when the mock frame itself truly needs an override.

### 4. Implement

First attach the cover to the video per the mandatory 3-second intro rule above, unless the user explicitly asked only for static cover exports.

For 16:9 covers, add both composition IDs to `COVER_BY_COMPOSITION_ID`:

```ts
"<prefix>-<slug>": {
  title: "English\nTitle",
  subtitle: "English subtitle",
  screenshotSrc: "buda-transition-cover/<asset>.png",
},
"<prefix>-<slug>-zh-CN": {
  title: "中文\n标题",
  subtitle: "中文副标题",
  screenshotSrc: "buda-transition-cover/<asset>.png",
  titleFontSize: 88,
},
```

Then register both IDs in `videos/buda/src/Root.tsx` under the correct folder:

```tsx
<Composition
  id="<prefix>-<slug>"
  component={BudaTransitionCover}
  durationInFrames={1}
  fps={30}
  width={1920}
  height={1080}
/>
<Composition
  id="<prefix>-<slug>-zh-CN"
  component={BudaTransitionCover}
  durationInFrames={1}
  fps={30}
  width={1920}
  height={1080}
/>
```

### 5. Verify

Run focused checks from the repo root:

```bash
pnpm --filter videos-buda lint
```

Render still frames for every requested composition. For example:

```bash
pnpm --dir videos/buda exec remotion still src/index.ts <prefix>-<slug> /tmp/<prefix>-<slug>.png
pnpm --dir videos/buda exec remotion still src/index.ts <prefix>-<slug>-zh-CN /tmp/<prefix>-<slug>-zh-CN.png
pnpm --dir videos/buda exec remotion still src/index.ts <prefix>-<slug>-9x16 /tmp/<prefix>-<slug>-9x16.png
pnpm --dir videos/buda exec remotion still src/index.ts <prefix>-<slug>-9x16-zh-CN /tmp/<prefix>-<slug>-9x16-zh-CN.png
```

Inspect every still visually. Confirm:

- English and Chinese versions render.
- Text stays inside the left column.
- Chinese title line breaks are balanced, with no orphan single-character line.
- English title and subtitle line breaks are balanced, with no orphan single-word last line.
- Chinese subtitle line breaks are balanced, with no orphan single-character or punctuation-only line.
- The screenshot/custom visual is not blank.
- No text overlaps the visual.
- In 9:16, title/subtitle remain readable on mobile and do not become tiny scaled-down horizontal text.
- In 9:16, English and Chinese variants use the same fixed text grid and visual coordinates. Reserve a fixed subtitle box, usually two subtitle lines high, before positioning the mock. Natural text wrapping or different explicit `\n` counts must not change the mock top or the subtitle-to-mock gap.
- In 9:16, the title-to-subtitle and subtitle-to-visual gaps are intentionally compact and consistent; there should be no large blank band between the copy and the product mock.
- In all aspect ratios, text and mock container x/y positions stay on the shared grid. Per-cover overrides may change copy, font size, colors, screenshot crop, or image content offset inside the mock, but should not move the whole text block or whole mock frame.
- In 9:16, the browser mock stays fully within the canvas with visible left and right edges; no horizontal overflow/cropping.
- In 9:16, the key screenshot/product evidence remains visible. Also check a centered 3:4 crop mentally or with a crop preview: it must not cut off the title, subtitle, or essential browser mock content.
- The cover matches the existing Buda Transition-Covers style.
- The target video/composition starts with the cover for exactly the first 3 seconds.
- At `t=0s` and `t=2.9s`, the cover is visible.
- At `t=3.1s`, the original video/content is visible and the cover is gone.

Start Remotion Studio automatically so the user can preview the new covers interactively:

```bash
pnpm --dir videos/buda dev
```

Keep the dev server running if the user wants to inspect it. Report the local Studio URL, usually `http://localhost:3000`, and mention the two new composition IDs to open in the `Transition-Covers` folder. If port `3000` is already occupied, use the URL printed by Remotion.

### 6. Changelog

Create `videos/buda/changelog/YYYYMMDD-<slug>-transition-cover.md` with:

- Original user request
- Refined instructions
- English and Chinese copy chosen
- Files affected
- Verification commands, still-render results, and Remotion Studio preview URL
- Whether the cover was attached to the first 3 seconds of the target video, including the target composition/path and timing verification

## Naming

Use stable slugs:

- Composition IDs: choose the prefix by cover type. Use `tc-<kebab-slug>` only for transition cards inside videos. Use `intro-<kebab-slug>` or `use-case-<kebab-slug>` for exported video cover images; both live in the same `Video-Covers` folder. Add `-zh-CN` for Simplified Chinese and `-9x16` before the locale for vertical variants. Do not add 3:4 IDs by default; design 9:16 to be crop-safe for 3:4 channels.
- Assets: `<kebab-slug>.png` or `<kebab-slug>.jpg`
- Changelog: `YYYYMMDD-<kebab-slug>-transition-cover.md`

Prefer product concepts over generic episode names. Examples:

- `tc-developer-portal`
- `tc-configure-channels`
- `intro-projects-sessions`
- `intro-workbench-ui`
- `use-case-automation`
- `use-case-generate-editable-ppt`

## Buda Style Notes

- Treat Buda as a calm product for managing AI agents and execution workflows.
- Show humans as reviewers/managers and agents as execution workers without over-explaining the metaphor.
- Use product-specific language: workspace, agents, sessions, projects, channels, tools, marketplace, automation, cloud computer, terminal, files, browser.
- Keep visual polish practical and product-led. Avoid generic AI network art, dark sci-fi backgrounds, and vague floating shapes.
