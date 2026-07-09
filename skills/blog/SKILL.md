---
name: blog
description: Create a complete blog post for an apps/* app — correct cover SVG per blog-cover-guide.md, EN + ZH-CN MDX files with proper frontmatter, inline images uploaded via /cdn-upload, and a changelog entry. Always check the app's design system and existing cover style before generating. Use for tutorial, comparison, intro, essay, launch posts, and AI trend/news follow-up posts connected to product value.
disable-model-invocation: false
allowed-tools: Bash(*), Read, Edit, Write
user-invocable: true
---

# /blog — Blog Post Creator

Creates a full blog post for any app in the monorepo, following that app's design system and cover conventions.

## Arguments

- `app` (required): Target app, e.g. `buda`
- `title` (required): Article title in English
- `type` (required): Cover type — `general` | `tutorial` | `guide` | `essay` | `introducing` | `compare` | `news`
- `lang` (optional): Override languages (comma-separated). If omitted, auto-detected from the app (see Step 1b).
- `image` (optional): Local file path(s) to inline images (will be uploaded via cdn-upload)
- `slug` (optional): URL slug override. Default: kebab-case from title

---

## Workflow

### Step 0 — Strict Git Workflow
Before writing any content, you MUST follow this exact Git workflow:
1. Checkout the `main` branch and pull the latest changes: `git checkout main && git pull origin main`
2. Create and checkout a new feature branch: `git checkout -b feature/blog-<slug>`
3. *(Proceed with writing the content in Steps 1-8)*
4. After all files are generated, run quality checks from the repo root: `pnpm install` (if node_modules is missing), then `pnpm typecheck` and `pnpm lint:err`. Fix any errors.
5. Commit and push the branch: `git add . && git commit -m "feat(blog): add <slug> post" && git push -u origin feature/blog-<slug>`
6. Create a Pull Request against `main` (using `gh pr create --base main` or instruct the user to do so).
7. **Pause and wait** for the user/team to review and merge the PR into `main`.
8. Once merged into `main`, you MUST sync those changes back to `develop` via a backport PR:
   - `git checkout develop && git pull origin develop`
   - `git checkout -b chore/sync-blog-<slug>-to-develop`
   - `git pull origin main` (or `git cherry-pick <merge-commit-hash>`)
   - Resolve conflicts if any.
   - `git push -u origin chore/sync-blog-<slug>-to-develop`
   - `gh pr create --base develop --title "chore: sync blog post to develop" --body "Backporting blog post from main into develop."`

### Step 1 — Read the app's cover guide and detect languages

**1a. Read cover and design specs:**

```bash
cat apps/{app}/content/spec/blog-cover-guide.md
cat apps/{app}/content/spec/design-system.md
```

Also scan existing covers to confirm the live visual direction:

```bash
ls apps/{app}/public/assets/blog/covers/
# read 1-2 covers that match the post type
```

**1b. Auto-detect supported languages:**

```bash
ls apps/{app}/content/blog/
```

Use the subdirectory names as the language list. Each directory is one locale.

Known locale → language mapping:

| Directory | Language |
|-----------|----------|
| `en` | English |
| `zh-CN` | Simplified Chinese |
| `zh-TW` | Traditional Chinese |
| `ja` | Japanese |
| `pt` | Portuguese |
| `ko` | Korean |

Examples from this repo:
- `apps/buda` → `en  zh-CN  zh-TW`
- `apps/npschimp` → `en  ja  zh-CN`
- `apps/previewfile` → `en  ja  zh-CN  zh-TW`
- `apps/mcpsdk` → `en  ja  zh-CN`

**Always generate a version for every detected language.** Never skip a language the app supports. If `lang` argument is provided, use that list instead.

Writing guide per locale:
- **`en`**: natural English, SEO-optimized
- **`zh-CN`**: natural Simplified Chinese — rewrite for Chinese readers, do NOT machine-translate
- **`zh-TW`**: Traditional Chinese — adapt from zh-CN with correct character set and phrasing
- **`ja`**: natural Japanese — full rewrite, not a translation
- **`pt`**: natural Portuguese (Brazilian preferred unless app targets PT-PT)
- **`ko`**: natural Korean

### Step 2 — Brand Voice & Tone (Crucial for Buda)

When generating content for **Buda** (`apps/buda`), you MUST strictly adhere to the Buda Brand Guidelines:

**1. The Zen Aesthetic & Storytelling**
- **Tone:** Grounded, human-centric, calm, and punchy. Use short, impactful sentences. Start with a hook or a real-world problem.
- **Anti-patterns:** NO hyperbolic marketing speak ("shocking", "mind-blowing", "revolutionize", "game-changer", "颠覆", "震惊"). Avoid breathless excitement, abstract fluff, or overly academic jargon.
- **Style:** Show, don't just tell. Let the facts and the narrative do the persuading.

**2. The Core Metaphor: Human as Manager, Agents as Executors**
- **The Human:** Represents judgment, taste, decision-making, strategy, and management. Humans are the "Reviewers" or "Agent Managers".
- **The Agents (Lobsters / Claws):** Represents raw execution power, automation, heavy lifting, and methodology. In English, they can be referred to as "Claws" or "Agents". **In Chinese context, ONLY use "龙虾" (Lobster) or "智能体" (Agent)** — NEVER use "龙虾爪" as it sounds unnatural.
- **Rule:** DO NOT explicitly explain the metaphor to the reader (e.g., never write "At Buda, we have a philosophy called The Bunny and The Claws"). Just embody the philosophy in the narrative implicitly.
- **Narrative Arc:** Always frame AI as removing execution friction. The goal isn't to replace humans, but to elevate them from manual workers (typists/assemblers) to directors/managers who handle the quality of the output.

**3. Localization Flavor (Chinese / zh-CN & zh-TW)**
- **Do NOT translate word-for-word.** Rewrite with modern, punchy, conversational yet professional Chinese.
- **Vibe:** Think premium tech blog (like Stripe, Vercel, or Linear) but localized. Use crisp phrases (e.g., "做完了，全做完了", "剥离执行损耗", "工程化流转").
- Maintain the "Zen" feeling: short sentences, clear logic. No corporate fluff ("赋能", "底层逻辑" unless used ironically or specifically).

**4. Evergreen & Objective:**
- Strip all event-specific, time-bound, or first-person context (e.g., "At our offline event", "Kevin said", "We felt").
- Elevate raw transcripts into evergreen, objective, third-person essays or second-person actionable guides.

### Step 3 — Determine cover type and template

| Post type | Cover template | Category label |
|-----------|---------------|----------------|
| `introducing` | General cover | `INTRODUCING` |
| `tutorial` | General cover | `TUTORIAL` |
| `guide` | General cover | `GUIDE` |
| `essay` | General cover | `ESSAY` |
| `compare` (Buda vs X) | Compare cover | `COMPARISON` |
| `news` (AI trend / industry news follow-up) | General cover | `AI NEWS` |

**General cover structure (apps/buda confirmed pattern):**
```svg
<svg width="1600" height="900" viewBox="0 0 1600 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1600" height="900" fill="#F7F3EA"/>
  <rect x="44" y="44" width="1512" height="812" rx="28" fill="#FBF8F1" stroke="#DDD6C8"/>
  <!-- Category label -->
  <text x="132" y="154" fill="#8A8378" font-family="Inter, Arial, sans-serif" font-size="28" letter-spacing="8">TUTORIAL</text>
  <path d="M132 182H1468" stroke="#E6DED1" stroke-width="2"/>
  <!-- Main title: Georgia serif, large, dark brown -->
  <text x="132" y="388" fill="#2D2A26" font-family="Georgia, 'Times New Roman', serif" font-size="156">Title</text>
  <!-- Subtitle: Inter, muted warm gray -->
  <text x="132" y="474" fill="#8A8378" font-family="Inter, Arial, sans-serif" font-size="38">One-line description here.</text>
  <!-- Optional CTA badge -->
  <rect x="132" y="612" width="236" height="46" rx="23" fill="#9C7A3A"/>
  <text x="250" y="642" fill="#FBF8F1" font-family="Inter, Arial, sans-serif" font-size="20" text-anchor="middle" font-weight="600">buda.im</text>
</svg>
```

**Color palette (Buda):**
- Background: `#F7F3EA` (warm parchment)
- Inner card: `#FBF8F1`, border `#DDD6C8`
- Category label: `#8A8378`
- Divider: `#E6DED1`
- Title: `#2D2A26`
- Subtitle: `#8A8378`
- CTA pill: `#9C7A3A`

**Title font-size guidance & Layout Rules:**
- Short title (≤8 chars): `font-size="156"`
- Medium title (9-14 chars): `font-size="120"–"130"`
- Long title (15+ chars): `font-size="88"–"100"`, consider line break with second `<text>` element at y+100
- **Anti-Overlap:** Ensure strict bounds checking. Always maintain a minimum `60px` gap between left-aligned text and right-aligned graphics to prevent clipping.

**🛑 CRITICAL: SVG Text Overflow Prevention (The Root Fix)**
Because SVG `<text>` does NOT auto-wrap, hardcoded `font-size` on unpredictable text lengths will inevitably overflow. You MUST permanently prevent this by following these rules:
1. **Never guess text widths in pure markdown:** When generating Covers or Inline SVGs, you MUST use a Python script to write the file, and that script MUST implement a bounding-box calculation.
2. **Width Estimation Logic:** In your script, calculate approximate pixel width: `1 Chinese character ≈ font_size px`, `1 English character ≈ font_size * 0.6 px`.
3. **Dynamic Scaling & Wrapping:** If `estimated_width > max_safe_width` (e.g., 800px for left-aligned text on a cover), your Python script MUST split the text into multiple `<text>` elements with an adjusted `y` offset.
4. **CRITICAL FOR CJK (Chinese/Japanese/Korean):** DO NOT use `text.split()` or Python's default `textwrap` (which split by space). You MUST iterate **character by character**. Keep adding characters to the current line until `estimated_width` exceeds `max_safe_width`, then break to a new line. Space-based splitting will treat an entire Chinese sentence as a single word and cause catastrophic overflow.

**Description rules (from blog-cover-guide.md):**
- 1 line only
- 10–18 words preferred
- Calm and descriptive, NOT promotional
- No hype copy

**What must NEVER appear on a cover:**
- Dark/black background
- Abstract AI orbit lines, network nodes, floating geometry
- Internal template labels (`blog cover system 01`)
- More than 3 text elements
- Hardcoded brand colors from other products

### Step 4 — Upload any inline images via /cdn-upload

If the user provides image files for inline use inside the article:

```bash
node .agents/skills/cdn-upload/scripts/upload.mjs \
  --file /path/to/screenshot.png \
  --prefix blog/inline
```

Save the returned CDN URL — embed it in the MDX as:

```mdx
![Alt text](https://pub-5d59c786708441b3a80620d87e7dee2b.r2.dev/blog/inline/screenshot.png)
```

**Do NOT** set inline screenshots as the `image:` cover field. The `image:` field is for the cover SVG only.

### Step 5 — Determine slug and file paths

```
slug = kebab-case of title (or user-provided slug)

Cover SVG:    apps/{app}/public/assets/blog/covers/{slug}.svg
Cover PNG:    apps/{app}/public/assets/blog/covers/{slug}.png
Per language: apps/{app}/content/blog/{locale}/{slug}.mdx
              (one file per detected locale)
```

Check slug uniqueness before creating:
```bash
ls apps/{app}/content/blog/en/
```

### Step 6 — Generate the cover SVG

Write to `apps/{app}/public/assets/blog/covers/{slug}.svg`, then immediately convert the final cover SVG to PNG at `apps/{app}/public/assets/blog/covers/{slug}.png`.

**Required cover PNG workflow:**
- Every generated localized cover SVG MUST have a matching PNG.
- Use the PNG path in blog frontmatter `image:`, not the SVG path.
- Example: `image: /assets/blog/covers/{slug}.png`.
- If multiple locales exist, convert each localized SVG and point each locale to its localized PNG, e.g. `image: /assets/blog/covers/{slug}-zh-CN.png`.
- If system ImageMagick or npm SVG export fails, use a Python venv with CairoSVG and convert via `cairosvg.svg2png`.

Follow the template from Step 3 exactly. Do not invent new visual elements.

For **compare** posts, use the compare cover structure:
- Read `apps/{app}/public/assets/blog/covers/buda-vs-n8n.svg` as the comparison template
- Use real brand logos when available (stored in `apps/{app}/public/assets/blog/logos/compare/`)
- Category label: `COMPARISON`
- Title: `Buda vs {X}`

### Step 7 — Write the MDX articles

**Frontmatter (required fields):**
```mdx
---
title: "Full article title here"
description: "SEO-friendly description, 120-160 chars"
date: YYYY-MM-DD
author: Buda Team
keywords: ["keyword1", "keyword2", "keyword3", ...]
image: /assets/blog/covers/{slug}.png
---
```

**Article structure:**

For `tutorial` / `guide` posts:
1. TL;DR / core conclusion
2. What is X? (background context)
3. Why install via Buda? (value prop)
4. Step-by-step installation (with inline images where provided)
5. What you get after install
6. FAQ or quick troubleshooting (optional)

For `introducing` posts:
1. What problem this solves
2. Key features
3. How to get started
4. What's next

For `essay` / opinion posts:
1. Hook
2. Argument/thesis
3. Evidence / examples
4. Conclusion + call to action

For `compare` posts:
1. TL;DR comparison table
2. Overview of both products
3. Feature-by-feature comparison
4. Who should use which
5. Conclusion

For `news` / AI trend follow-up posts:
1. **What happened:** Summarize the verified AI news event in 2-4 concise paragraphs. Include date/time context when relevant, but avoid breathless breaking-news tone.
2. **Why it matters:** Explain the structural shift behind the news. Focus on business impact, product direction, workflow changes, and human/agent division of labor.
3. **What teams should do next:** Provide 3-5 concrete implications or actions for builders, operators, managers, or founders.
4. **How this connects to Buda:** Add a grounded product angle. Show how Buda helps teams turn the trend into execution: agent workspaces, Drive knowledge, sandboxed execution, human review, automations, channels, skills, or MCP. Keep this to roughly 10-20% of the post.
5. **CTA:** Invite readers to try the relevant Buda workflow, read a related guide, or build an agent for the discussed scenario.

**AI News / Trend Follow-up Rules (Buda):**
- **Fact-first:** Use web search or source materials to verify the event. Do not invent announcements, dates, quotes, benchmarks, or company claims.
- **No rumor laundering:** If information is unconfirmed, clearly label it as unconfirmed or skip it.
- **No generic recap:** The post must add Buda's interpretation: what changes in real workflows, what humans should manage, and what agents should execute.
- **Timely but durable:** Mention the news, but write the analysis so it remains useful after the first news cycle.
- **Product connection without hijacking:** Connect to Buda only where natural. Avoid turning the post into an ad. The reader should get standalone value even if they never sign up.
- **Use real source visuals when useful:** Before generating all visuals from scratch, check whether the news source has official visuals: product screenshots, release-page screenshots, official demo images, changelog screenshots, GitHub release screenshots, or public product UI. Use real visuals when they improve factual grounding, especially as inline images.
- **Pair real visuals with Buda interpretation:** Recommended pattern for news posts: Buda-style SVG cover, one real official/source screenshot as evidence, and one Buda-generated SVG that explains workflow or product implications.
- **Source and rights discipline:** Record the source URL for every real screenshot. Prefer official product pages and release pages. Avoid copyrighted editorial photography, watermarked social images, user-generated screenshots without permission, or images from unverified rumors.
- **Screenshot quality:** Keep screenshots readable and blog-friendly: 16:9 or close to 16:9 when possible, crop to the relevant area, use clear filenames, and write descriptive alt text with the source/product name.
- **Recommended internal links:** Link to existing Buda posts about agent workflow optimization, managing AI agents, R&D automation, security, or Buda comparisons when relevant. Verify paths with `ls` first.
- **Cover label:** Use `AI NEWS` as the category label.

**Language rules:**
- EN: natural English, SEO-optimized keywords
- ZH-CN: natural Simplified Chinese, do NOT machine-translate EN word-for-word — rewrite for Chinese readers
- Both versions must have the SAME `image:` cover path (SVG)

**SEO & CTA Rules:**
- **SEO Title & Meta:** The `title` should be catchy but contain core keywords. `description` must be 120-160 characters, summarizing the exact value of the post.
- **Content SEO:** Place primary keywords naturally in the first 100 words. Use descriptive, semantic headings (H2, H3). Write short paragraphs (2-3 sentences max) to improve readability and mobile scannability.
- **Alt Text:** Every inline image (`![Alt text](...)`) must have descriptive alt text containing relevant keywords.
- **Call to Action (CTA):** Every post MUST conclude with a clear, valuable, and non-salesy CTA. 
  - *Examples:* "Start building agents with Buda for free at [buda.im](https://buda.im)", link to documentation, or invite them to the community.
  - *Tone:* Do not beg or sound desperate. Invite them to experience the future. "Build your first agent today."

### Step 8 — Write the changelog

Create `apps/{app}/content/changelog/YYYYMMDD-{slug}.md` following the monorepo changelog format.

### Step 9 — Summary

After all files are created, report:
- Cover SVG path
- All generated locale articles (list each `{locale}/{slug}.mdx`)
- CDN URLs for any uploaded inline images
- Changelog path

Ask if the user wants to commit via `/git-push`.

---

## Rules

1. **Always read blog-cover-guide.md first** — do not guess the cover style
2. **Cover SVG must be a clean, standalone file** — no leftover content from old templates
3. **Inline images go to CDN via /cdn-upload** — never commit large images to git
4. **`image:` frontmatter = cover SVG only** — never set a screenshot as the cover
5. **All locales must be written, not translated** — each language is a rewrite for that audience
6. **Auto-detect languages from `ls apps/{app}/content/blog/`** — never hardcode locale list
7. **No decorative geometry on covers** — typography first, shapes only for layout structure
8. **Verify slug uniqueness** — check `ls apps/{app}/content/blog/en/` before creating files
9. **Always generate at least 2 inline SVGs** — ensure articles are visually rich
10. **Always embed internal SEO links** — after verifying their existence via `ls`
11. **For AI news follow-ups, verify facts first** — use source material or web search; never fabricate news, dates, quotes, benchmarks, or official claims
12. **For AI news follow-ups, connect trend → workflow → Buda** — explain what changed, what teams should do, and how Buda can help execute without making the whole article promotional
