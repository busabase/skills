---
name: writer
description: Generate social media drafts (WeChat, LinkedIn, Twitter, Xiaohongshu) derived from blog posts, release notes, or a topic brief. Outputs MDX files into apps/buda/content/writer/ with date-prefixed filenames. Use when you need platform-ready copy to paste into social channels.
disable-model-invocation: false
allowed-tools: Bash(*), Read, Edit, Write
user-invocable: true
---

# /writer — Social Media Draft Generator

Generates adapted social media copy from existing blog posts, release notes, or a topic brief.
Outputs go to `apps/buda/content/writer/` — the `/kit/writer` fumadocs section on the website.

**What this is for:**
Blog and release notes live on the website. This skill creates *derived* copy for other channels:
WeChat articles, LinkedIn long-form, Twitter threads, Xiaohongshu posts, etc.
Everything lands in one place so it's easy to find and copy-paste.

## Arguments

- `topic` (required): What to write about. Can be:
  - A blog slug: `buda-vs-manus` → reads from `content/blog/`
  - A release version: `v0.9.0` → reads from `content/release-notes/`
  - A free-form topic: `"Why Buda agents beat chatbots"`
  - An AI news/trend brief: `"AI热点新闻: OpenAI released ..."` → verify latest sources before drafting
- `platform` (required): Target platform — `twitter` | `linkedin` | `wechat` | `xiaohongshu` | `general`
- `account` (optional): The specific persona or account. Defaults to `buda` if not provided. (e.g., `kelly`, `official`)
- `lang` (optional): Language code. Default: `en` + `zh-CN`. Comma-separated for multiple.
- `slug` (optional): Override output filename. Default: `YYYY-MM-DD-<kebab-topic>`.
- `date` (optional): Override date. Default: today (`YYYY-MM-DD`).

## Workflow

### Step 0 — Strict Git Workflow
Before writing any content, you MUST follow this exact Git workflow:
1. Checkout the `main` branch and pull the latest changes: `git checkout main && git pull origin main`
2. Create and checkout a new feature branch: `git checkout -b feature/writer-<slug>`
3. *(Proceed with writing the content in Steps 1-6)*
4. After all files are generated, run quality checks from the repo root: `pnpm install` (if node_modules is missing), then `pnpm typecheck` and `pnpm lint:err`. Fix any errors.
5. Commit and push the branch: `git add . && git commit -m "feat(writer): add <slug> social draft" && git push -u origin feature/writer-<slug>`
6. Create a Pull Request against `main` (using `gh pr create --base main` or instruct the user to do so).
7. **Pause and wait** for the user/team to review and merge the PR into `main`.
8. Once merged into `main`, you MUST sync those changes back to `develop` via a backport PR:
   - `git checkout develop && git pull origin develop`
   - `git checkout -b chore/sync-writer-<slug>-to-develop`
   - `git pull origin main` (or `git cherry-pick <merge-commit-hash>`)
   - Resolve conflicts if any.
   - `git push -u origin chore/sync-writer-<slug>-to-develop`
   - `gh pr create --base develop --title "chore: sync writer draft to develop" --body "Backporting writer draft from main into develop."`

### Step 1 — Gather source material

If `topic` matches a blog slug:
```bash
cat apps/buda/content/blog/en/<topic>.mdx
cat apps/buda/content/blog/zh-CN/<topic>.mdx 2>/dev/null
```

If `topic` matches a release version (e.g. `v0.9.0`):
```bash
cat apps/buda/content/release-notes/en/v*.mdx | head -200
```

If free-form topic: use the topic string directly as the brief.

If this is an **AI热点新闻 / AI news / trend commentary** topic:
- Verify the latest facts before drafting whenever possible.
- Compare multiple sources when possible: official announcements/product pages, docs/changelogs, credible media, X/HN/Reddit/developer discussion, pricing/model/API pages.
- Pull useful source visuals when relevant: product page screenshots, official announcement screenshots, UI/demo screenshots, pricing/model cards, public discussion screenshots.
- Do not directly hotlink source images; save/screenshot locally, upload via `/cdn-upload`, then embed the returned CDN URLs in MDX.
- For WeChat, adapt visuals to mobile reading: crop, annotate, highlight, blur private information, and prefer PNG/JPG/WebP over SVG.

Also read the brand voice guidelines:
```bash
cat apps/buda/content/spec/vi.md
```

### Step 2 — Determine slug and date

```
date  = argument or today (YYYY-MM-DD)
slug  = argument or "{date}-{kebab-case-platform-topic}"

Example: 2026-04-23-twitter-buda-vs-manus
```

### Step 3 — Write the MDX files

**One file per language**, placed in:
```
apps/buda/content/writer/{locale}/{slug}.mdx
```

**Frontmatter (CRITICAL - Fumadocs Strict Validation):**
```yaml
---
title: "<date> <Platform>: <Short title>"
description: "<One-line summary>"
date: "YYYY-MM-DD"           # MUST be string format "YYYY-MM-DD"
platform: wechat             # MUST be one of: twitter | linkedin | wechat | xiaohongshu | general
publishedUrl: ""           # fill in after publishing
---
```

**⚠️ Build Crash Warning:** 
- If `title` is missing, the build will fail.
- If `platform` is not one of the exact enum values (`twitter`, `linkedin`, `wechat`, `xiaohongshu`, `general`), the build will fail (do not use `x-article`, `newsletter`, etc.).
- If the `---` delimiters are missing, the build will fail.

**Title format:** Always start with the date so entries sort chronologically in the sidebar.
Example: `"2026-04-23 Twitter: Why Buda agents beat chatbots"`

### Step 4 — Load Platform & Account Specific Guidelines

Instead of hardcoded rules, the `/writer` skill dynamically loads the writing rules, tone, and formatting instructions from the `.agents/skills/writer/guidelines/` directory.

Look for a specific guideline file matching `{platform}-{account}.md` or fallback to `{platform}.md`:

```bash
# Try to find a specific guideline first
cat .agents/skills/writer/guidelines/{platform}-{account}.md 2>/dev/null || cat .agents/skills/writer/guidelines/{platform}.md 2>/dev/null
```

**If a guideline file is found:**
- **STRICTLY FOLLOW** the tone, red lines, structures, inline CSS (for WeChat), character limits, and specific vocabulary defined in that guideline.
- If it includes requirements for promotional copy (like "朋友圈文案" or "WeChat sharing copy"), you must generate it exactly as requested and put it at the bottom of the output file.

**If no specific guideline is found, fallback to general defaults:**
- **Twitter / X Article**: Short threads or long-form X articles. Hook first, founder-led narrative, punchy paragraphs, contrarian or visionary closing. (See `guidelines/twitter.md`)
- **LinkedIn**: 1000–2000 words, professional, list-heavy. (See `guidelines/linkedin-kelly.md`)
- **WeChat**: Long-form article style, clear value prop, subheadings.
- **Xiaohongshu**: Casual, emoji-rich, bullet points.

### Step 5 — Brand voice (Buda)

Follow the Buda brand voice strictly:
- **Tone:** Grounded, calm, punchy. Short sentences. Start with a hook.
- **Anti-patterns:** NO "revolutionize", "game-changer", "颠覆", "震惊", "赋能"
- **Chinese:** Rewrite naturally, don't translate. Modern, crisp, conversational.
- **Metaphor:** Human = manager/reviewer, Agent = executor. Don't explain the metaphor, embody it.

### Step 6 — Update meta.json (CRITICAL for Sidebar Navigation)

You MUST add the new slug to the `pages` array in `content/writer/{locale}/meta.json`.
If you skip this, the file becomes a "ghost" page and will not appear in the left sidebar navigation on the documentation site.

```bash
# Example JSON update logic:
# Ensure "2026-04-24-wechat-leon-sales-automation" is appended to the "pages" array in meta.json
```

### Step 6.5 — Image Assets & CDN
If the article requires images:
1. Run `/cdn-upload <file>` to upload the local images to the Cloudflare R2 bucket.
2. Insert the returned public `https://pub-*.r2.dev/...` URLs into the MDX. Do not use local paths (`/agent/...`) in the final MDX or WeChat drafts.
3. For AI热点新闻, use real source/product visuals when useful (official screenshots, product UI, changelog/pricing/model pages, public announcement posts), but adapt them for Kelly公众号: crop, annotate in Chinese, highlight the key area, and blur private/non-public information.
4. For WeChat drafts, avoid SVG. Use PNG/JPG/WebP and ensure the push/update script converts final images to WeChat `mmbiz.qpic.cn` URLs.

### Step 7 — Report

Print a summary:
```
✅ Created:
  - content/writer/en/{slug}.mdx
  - content/writer/zh-CN/{slug}.mdx
  Platform: {platform}
  Date: {date}
  Title: {title}

📋 Next: review, then copy-paste to {platform}.
```
