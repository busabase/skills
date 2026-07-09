---
name: release
description: Write multi-language release notes, bump version, and ship via Git Flow. Supports normal releases and hotfixes. Two invocations — one to write release notes and open the PR, one to finalize after the PR is merged.
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(cat:*), Bash(ls:*), Bash(grep:*), Bash(find:*), Bash(gh:*), Bash(node:*), Bash(curl:*)
user-invocable: true
---

# Release

Supports two modes:

- **Normal release**: branches from `develop`, brings all features to `main`.
- **Hotfix**: branches from `main`, cherry-picks specific commits, bumps patch version.

Both are two-step: create PR → merge → finalize.

> The skill cannot detect the PR merge automatically — this is a deliberate two-step process.

## Arguments

- `app` (required): App name, e.g. `buda`. Resolves to `apps/<app>/`.
- `version` (required): New semver string, e.g. `0.8.0` or `0.8.1`.
- `hotfix` (optional): If `true`, run [Hotfix flow](#hotfix-flow) instead of normal flow.
- `commits` (optional, hotfix only): Space-separated commit SHAs to cherry-pick, e.g. `abc1234 def5678`.
- `since` (optional): Git ref to diff from. Auto-detected from last release commit if omitted.
- `finalize` (optional): If `true`, skip to finalize step. Run **after** the PR is merged.
- `dry-run` (optional, hotfix only): If `true`, use a temporary worktree to test cherry-pick conflicts and report risk. Do not modify the real worktree.
- `publish-social` (optional, finalize only): Comma-separated channels, e.g. `discord,x`. Defaults to `discord` after finalize deployment verification. Publishes reviewed social copy from `content/release-notes/_v<version>.md` only if channel keys are configured.
- `production-health-url` (optional, finalize only): Full production health endpoint. Defaults to `https://buda.im/api/health` for `app=buda`. Required for other apps before Discord publishing.
- `youtubeVideoId` (optional, buda only): YouTube video ID for the companion release video, e.g. `31vomffXZpI`. Used by the release-note email's hero block. Omit when the release ships without a video — the hero falls back to text-only.

## Two-step process

```
Normal release:
  Step 1:  /release app=<app> version=<version>
  Step 2:  /release app=<app> version=<version> finalize=true

Hotfix:
  Step 1:  /release app=<app> version=<version> hotfix=true commits="<sha1> <sha2>"
  Step 2:  /release app=<app> version=<version> hotfix=true finalize=true

Optional social publishing override after finalize:
  /release app=<app> version=<version> finalize=true publish-social="discord,x"
```

---

## Normal flow

> If `hotfix=true`, skip to [Hotfix flow](#hotfix-flow).
> If `finalize=true`, skip to [Finalize flow](#finalize-flow).

### Step 0 — Pre-flight divergence check

**Run before anything else.** If main has commits that develop doesn't, the release branch will conflict with main. Catch this early.

```bash
git fetch origin
BEHIND=$(git log develop..origin/main --oneline | wc -l)
if [ "$BEHIND" -gt 0 ]; then
  echo "ERROR: develop is behind main by $BEHIND commits."
  echo "Fix: git checkout develop && git merge origin/main"
  echo "Resolve any conflicts (prefer develop's version), then retry."
  exit 1
fi
echo "OK: develop is up to date with main"
```

If divergence is found, stop and tell the user to merge main → develop first, then retry.

### Step 1 — Gather context (run all in parallel)

```bash
# Current version
grep '"version"' apps/<app>/package.json | head -1

# Detect locales
ls apps/<app>/content/release-notes/ | grep -vE "^(index|meta\.json)" | sort

# Last release tag and its date — used to filter changelogs
LAST_TAG=$(git tag --sort=-creatordate | grep "^v" | head -1)
LAST_TAG_DATE=$(git log -1 --format=%ci $LAST_TAG)
echo "Last release: $LAST_TAG at $LAST_TAG_DATE"

# Git commits since last release (for this app)
git log --oneline $LAST_TAG..HEAD -- apps/<app>/

# Changelog files in the release window (filename date from last tag date through release date)
find apps/<app>/content/changelog -maxdepth 1 -type f -printf '%f\n' | sort

# Latest release note for format reference
cat apps/<app>/content/release-notes/en/meta.json
```

Read changelog entries **since the last release** for content. Use the last tag date and the new release date to filter by filename date, then read the **full content** of every matching changelog file.

Do **not** extract changelog content with fixed section regexes such as `grep -A 8 "## What Changed"` or `head -40`. Changelog files are written by different agents and may use Chinese headings, non-standard section names, short one-paragraph formats, or additional follow-up sections. Fixed heading extraction misses important release context.

Use this style instead:

```bash
LAST_TAG_YYYYMMDD=$(git log -1 --format=%cd --date=format:%Y%m%d $LAST_TAG)
RELEASE_YYYYMMDD=<YYYYMMDD>
for f in $(find apps/<app>/content/changelog -maxdepth 1 -type f -printf '%f\n' | sort); do
  FILE_DATE=$(echo $f | grep -oE '^[0-9]{8}')
  [ -n "$FILE_DATE" ] || continue
  [ "$FILE_DATE" -ge "$LAST_TAG_YYYYMMDD" ] || continue
  [ "$FILE_DATE" -le "$RELEASE_YYYYMMDD" ] || continue
  echo "===== $f ====="
  cat "apps/<app>/content/changelog/$f"
done
```

If the release window has many changelog files, read them in date batches (for example one day per command) until all matching files have been reviewed. Do not stop after the first page of output. Summarize internally by user-facing themes after reading the full set.

**Both sources matter**: git commit messages give breadth; full changelog files give detail. Cross-reference them — a commit without a changelog entry is usually a small fix; a changelog entry without a prominent commit may be content, marketing, or polish work. Synthesize both into user-facing release notes.

### Step 1.5 — Lock the release baseline

After the divergence check and context gathering pass, create the release branch immediately from the current `develop` tip. This freezes the release contents so later `develop` commits do not accidentally enter the release while notes, announcements, CRM journey, and social copy are being written.

```bash
git status --porcelain | grep -q . && echo "ERROR: dirty working tree" && exit 1
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "develop" ] || { echo "ERROR: must be on develop before locking release baseline"; exit 1; }

git pull origin develop
git checkout -b release/v<version>
git push -u origin release/v<version>
```

If `release/v<version>` already exists because the baseline was locked earlier, switch to it only after confirming it points at the intended `develop` commit. Do not rebase it onto newer `develop` unless the user explicitly asks to include newer commits.

### Step 2 — Write release notes

For **each detected locale**, create `apps/<app>/content/release-notes/<lang>/v<version>.mdx`.

> Locale detection is dynamic — use the `ls` output from Step 1. Never hardcode locales.

**Sections** (include only non-empty):

| ✨ New Features | ⚡ Performance | 🔧 Experience | 🛡️ Security | 🐛 Bug Fixes | 🗄️ Data | 💬 Messaging | 💳 Billing | 🌐 i18n |

**Content exclusion rule:** Never include systemadmin / internal admin features in release notes. These are backend operator tools not visible to end users. Examples: admin dashboard pages, admin inline editing, audit log enhancements, admin search improvements, AI models dashboard for admins. Also never include changes that feel restrictive to users or reduce perceived user benefits — e.g. plan gating, access control tightening, timeout enforcement, marketplace quality filtering. Only highlight positive user-facing changes: new features, UX improvements, bug fixes, and upgrades (like credit increases).

**Frontmatter:**

```mdx
---
title: <locale-specific title — see table below>
description: <one-line summary of 3 headline changes>
version: "<version>"
date: "<YYYY-MM-DD>"
---

> Released: <Month DD, YYYY>
```

**Title format (locked — must match exactly):**

| Locale  | Title format                          | Example                       |
| ------- | ------------------------------------- | ----------------------------- |
| `en`    | `<App> v<version> Release Notes`      | `Buda v1.2.0 Release Notes`   |
| `zh-CN` | `<App> v<version> 发布说明`           | `Buda v1.2.0 发布说明`        |
| `zh-TW` | `<App> v<version> 發佈說明`           | `Buda v1.2.0 發佈說明`        |
| `ja`    | `<App> v<version> リリースノート`     | `Buda v1.2.0 リリースノート`  |
| `ko`    | `<App> v<version> 릴리스 노트`        | `Buda v1.2.0 릴리스 노트`     |

`<App>` is title-cased (e.g. `Buda`, not `buda`). Do not invent variants like “更新说明”, “版本说明”, “Release Note” (singular), etc. — these are the canonical titles.

**Tone:** `en` = Linear/Notion quality · `zh-CN` = 公众号 punchy · `zh-TW` = 繁體 same · `ja/ko` = natural product style

**Rules:** lead with *why it matters* → then *what changed*. `**bold**` feature names. 3–6 bullets/section max. No filler.

### Step 2.5 — Pause for release-note review

After writing the localized release notes and frontmatter descriptions, stop and ask the user to review them before continuing to version bump, meta updates, announcements, CRM journey, social copy, commit, or PR creation.

Report the files to review and the main themes you included. Continue only after the user approves or requests edits. If the user explicitly asked to skip review, continue without pausing.

### Step 3 — Bump version

```bash
sed -i '0,/"version": "[^"]*"/s//"version": "<version>"/' apps/<app>/package.json
grep -n '"version"' apps/<app>/package.json | head -3
```

### Step 4 — Update meta.json (each locale)

Prepend new version to `pages` in `apps/<app>/content/release-notes/<lang>/meta.json`:

```json
{ "pages": ["index", "v<version>", "v<prev>", ...] }
```

### Step 5 — Changelog entry

Create `apps/<app>/content/changelog/<YYYYMMDD>-release-v<version>.md`:

```markdown
---
title: <YYYY-MM-DD> Release v<version>
---

# Release v<version>

Date: <YYYY-MM-DD>
Author: AI Assistant
AI Agent: GitHub Copilot

## What Changed
- `apps/<app>/package.json` — version bumped to <version>
- Release notes created for: <locales>
- meta.json updated in all locales

## Breaking Changes
None
```

### Step 5.5 — Update What's New badge announcement (buda only)

If `app = buda`, update the dashboard sidebar announcement to surface the new release.

Locate `apps/buda/src/domains/announcements/config/announcements.ts` and **replace** any existing `release-v*` badge entry with the new one. Only one release badge should exist at a time — new versions supersede old ones. Non-release announcements (e.g. `force-modal` entries for feature introductions) must be preserved.

Use today's date as `startDate` and `durationDays: 2`.

The entry should look like:

```ts
{
  id: "release-v<version>",
  announcementType: "badge",
  startDate: "<YYYY-MM-DD>",   // today
  durationDays: 2,
  title: {
    en: "Buda v<version> released",
    "zh-CN": "Buda v<version> 已发布",
  },
  subtitle: {
    en: "<one-line highlight from release notes>",
    "zh-CN": "<中文一句话亮点>",
  },
  description: {
    en: "<2-3 sentence summary from the release notes>",
    "zh-CN": "<中文两三句话概述>",
  },
  ctaLabel: { en: "See what's new", "zh-CN": "查看更新" },
  ctaHref: "/release-notes",
},
```

Use the headline features from the release notes you just wrote to fill in `subtitle` and `description`. Keep them short — this is a sidebar teaser, not a changelog.

### Step 5.6 — Register CRM release-note journey (buda only)

If `app = buda`, register the release-note email as a code-defined CRM journey.

**Read `.agents/skills/release/reference/release-journey-sop.md` now.** That file is the full authoring spec — file shape, content schema (hero / intro / highlights / primaryCta), copy rules, locale set, human-in-the-loop hero selection, and YouTube thumbnail handling. The SKILL.md kept only this pointer because the SOP is large and only needed at this single step.

Before writing the journey content, pause and ask the user which release-note feature should become the email hero. Offer 2-4 clear candidates from `apps/buda/content/release-notes/en/v<version>.mdx`. After the user chooses, continue with the SOP. Pass through the optional `youtubeVideoId` argument from `/release` (the SOP describes how it maps to `hero.youtubeVideoId`).

Do not publish or send these emails from the release skill. The release PR only registers the rule so operators can review and enable it later.

### Step 6 — Write reviewed social copy, commit, open PR

Before opening the PR, write release social copy so it can be reviewed alongside the code:

Create or update:

- `apps/<app>/content/release-notes/_v<version>.md`

The release agent must read the release notes and changelog, choose one user-facing hero feature, and write `## X Primary Post` and `## Discord Primary Message` by hand. The script's `generate` mode is still useful, but only for generated follow-ups: it reads the English release note, writes `## X Reply` with the old X release-announcement format (title, description, release notes URL, and default `#ai #agent` tags), and writes `## Discord Follow-up` with the old Discord release-announcement format (title, first 3 release-note bullets, and release notes URL). It must not generate the primary X post or primary Discord announcement.

Run this before committing the release artifacts:

```bash
node .agents/skills/release/scripts/release-social.mjs \
  --app <app> \
  --version <version> \
  --mode generate
```

X rules:

- Pick one hero feature from the release notes, not a full feature list.
- `## X Primary Post` must not include external links.
- Put the release notes URL only in `## X Reply`; this section is maintained by `release-social.mjs --mode generate` using the English release note title/description.
- Avoid generic version-announcement copy such as `Buda v<version> is live`.
- Avoid `Release notes are here`, `we're excited to announce`, hashtag stuffing, and marketing-brochure phrasing.
- Write native feed copy: concrete user pain, what changed, and the practical payoff.
- Buda's X account is verified, so the hard platform limit is no longer 280 characters. Still keep the primary post concise; prefer roughly 280-600 characters unless the feature genuinely needs more context.
- The send script enforces a generous 1000-character hard cap to prevent accidental long-form posts.

Discord rules:

- Use `## Discord Primary Message` for the same hero-feature angle when it fits, but Discord can be slightly more explicit.
- If the release has a companion feature video on the official YouTube channel, include the YouTube URL near the end of `## Discord Primary Message`.
- YouTube URLs are optional. Do not invent a video URL or block the release when no companion video exists.
- Prefer a YouTube URL over uploading the same MP4 directly to Discord, so video views and analytics stay on the official channel.
- Put the release notes URL in `## Discord Follow-up`; this section is maintained by `release-social.mjs --mode generate` using the English release note title/description.
- Keep the announcement concise; the full release detail belongs in release notes and email.

Recommended X shape:

```text
New: <specific user-facing capability>.

<real user pain or friction>

Now, <what the user can do>.

<concrete workflow payoff>
```

```bash
# Pre-flight: must be on release/v<version> with release artifacts ready
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$CURRENT_BRANCH" = "release/v<version>" ] || { echo "ERROR: must be on release/v<version>"; exit 1; }
git fetch origin release/v<version>
git diff --name-only --diff-filter=U | grep -q . && echo "ERROR: unresolved merge conflicts" && exit 1

# Commit all release artifacts
git add apps/<app>/package.json
git add apps/<app>/content/release-notes/
git add apps/<app>/content/changelog/<YYYYMMDD>-release-v<version>.md
git add apps/<app>/content/release-notes/_v<version>.md
git add apps/<app>/src/domains/crm/automations/journeys/
git add apps/<app>/src/domains/announcements/config/announcements.ts 2>/dev/null || true
git commit -m "release(<app>): v<version>"

# Capture SHA now — branch may be auto-deleted after PR merge
RELEASE_SHA=$(git rev-parse HEAD)

git push origin release/v<version>
```

Open PR and enable auto-merge (merges automatically when all CI checks pass):

```bash
PR_URL=$(gh pr create \
  --base main \
  --head release/v<version> \
  --title "release(<app>): v<version>" \
  --body "<see PR body template below>")

echo "PR: $PR_URL"

# Enable auto-merge with regular merge commit (not squash — preserves full history for Git Flow)
gh pr merge "$PR_URL" --merge --auto
```

> **Note:** `--auto` waits for all required CI checks to pass, then merges automatically.
> If the repo requires manual approval, a reviewer must approve first — auto-merge will proceed after that.
> To skip auto-merge and let the user merge manually, omit the `gh pr merge` line and mention it in the report.

**PR body template:**

```markdown
## 🚀 <App> v<version>

> Released: <YYYY-MM-DD>

<one-paragraph summary of what's new and why it matters>

## ✨ Highlights
- **Feature** — description
- ...

## 🔧 Fixes & Improvements
- ...

## 📄 Release Notes
- [English](apps/<app>/content/release-notes/en/v<version>.mdx)
- [中文简体](apps/<app>/content/release-notes/zh-CN/v<version>.mdx)
- *(list all detected locales)*
```

### Step 7 — Report

After the PR is created, output this to the user:

```
✅ Version bumped: <old> → <version>
✅ Release notes: <locale1> / <locale2> / ...
✅ meta.json updated in all locales
✅ Changelog entry written

🚀 PR ready: <PR_URL>
🤖 Auto-merge 已開啟 — CI 通過後將自動合併（regular merge commit）

👉 合併後告訴我，我來完成最後步驟（打 tag、同步 develop、清理分支）。
```

---

## Finalize flow

> Triggered when the user says the PR is merged (e.g. "合并了", "merged", "done", "搞定了").
> Also triggered by `finalize=true`.

**First: verify the PR is actually merged before doing anything.**

```bash
git fetch origin

# Check PR state — branch name works even if PR number is unknown
PR_STATE=$(gh pr view release/v<version> --repo <owner>/<repo> --json state -q '.state' 2>/dev/null \
  || gh pr view hotfix/v<version> --repo <owner>/<repo> --json state -q '.state' 2>/dev/null)

if [ "$PR_STATE" != "MERGED" ]; then
  # Show CI status so user knows what's blocking
  gh pr view release/v<version> --json statusCheckRollup \
    -q '.statusCheckRollup[] | "\(.name): \(.status) \(.conclusion)"' 2>/dev/null \
    || gh pr view hotfix/v<version> --json statusCheckRollup \
       -q '.statusCheckRollup[] | "\(.name): \(.status) \(.conclusion)"' 2>/dev/null
  echo ""
  echo "⏳ PR 尚未合併（狀態：$PR_STATE）。CI 可能還在跑，請稍候再告訴我。"
  exit 0  # Stop here, do not proceed with tagging/cleanup
fi
```

If the PR is not yet merged, **stop and tell the user to wait**. Do not proceed with tagging or branch cleanup.

Only continue below once `PR_STATE = MERGED`.

```bash
git fetch origin

# 1. Tag main at the release commit
git checkout main
git pull origin main

# Guard: delete tag if it already exists (idempotent re-run)
git tag -d v<version> 2>/dev/null || true
git push origin --delete v<version> 2>/dev/null || true

git tag -a v<version> -m "release(<app>): v<version>"
git push origin v<version>

# 2. Merge main back to develop to prevent divergence.
#    Prefer develop's latest code on conflicts; main contributes the merge/tag history
#    and release artifacts that are not already present on develop.
git checkout develop
git pull origin develop
git merge origin/main -X ours -m "chore: sync main into develop after release/v<version>"
git push origin develop

# 3. Cleanup release branch
git branch -d release/v<version> 2>/dev/null || true
git push origin --delete release/v<version> 2>/dev/null || true
```

### Finalize Step 4 — Verify production deployment

After tag, develop sync, and branch cleanup succeed, wait for production to report the target version before announcing anything publicly. For `app=buda`, use `https://buda.im/api/health`. For other apps, use `production-health-url`; if it is missing, stop and ask for the production health endpoint instead of publishing Discord.

Poll until `version` equals `<version>`. Also print `buildNumber`, `buildSha`, and `buildTime` when available so the user can see what actually deployed.

```bash
HEALTH_URL="<production-health-url>"
[ "<app>" = "buda" ] && HEALTH_URL="https://buda.im/api/health"

HEALTH_URL="$HEALTH_URL" EXPECTED_VERSION="<version>" node <<'NODE'
const healthUrl = process.env.HEALTH_URL;
const expected = process.env.EXPECTED_VERSION;
const deadline = Date.now() + 20 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { cache: "no-store" });
    const body = await response.json();
    console.log(JSON.stringify({
      version: body.version,
      buildNumber: body.buildNumber,
      buildSha: body.buildSha,
      buildTime: body.buildTime,
    }));
    if (body.version === expected) process.exit(0);
  } catch (error) {
    console.log(`health check failed: ${error.message}`);
  }
  await sleep(30000);
}

console.error(`Timed out waiting for ${healthUrl} to report version ${expected}. Do not publish Discord yet.`);
process.exit(1);
NODE
```

If the timeout expires or the endpoint reports an older version, stop and tell the user deployment has not reached production yet. Do not publish Discord.

### Finalize Step 5 — Social announcement

Only after the production health endpoint reports `version: "<version>"`, read the reviewed channel announcement copy from the codebase and publish it to Discord by default:

```bash
node .agents/skills/release/scripts/release-social.mjs \
  --app <app> \
  --version <version> \
  --mode send \
  --publish discord
```

If the user passed `publish-social`, use that value instead of the default `discord`.

If Discord is not configured, the script reads `apps/<app>/content/release-notes/_v<version>.md` and reports `DISCORD_WEBHOOK_URL_B64 is empty`. Do not invent credentials. Tell the user to provide the Discord Incoming Webhook URL so it can be base64-encoded into `.agents/skills/release/scripts/social-config.mjs`.

**Report:**

```
🏷  main tagged: v<version>
✅ develop 已同步 main（merge commit 對齊）
🧹 release/v<version> 已删除
🔎 生产环境版本已确认：<version>
📣 Discord 通告已发送（或已生成文案但 Discord 尚未配置）

发布完成 🎉  <app> v<version> 已上线。
```

---

## Hotfix flow

> Triggered when `hotfix=true`. Used to ship one or more specific commits as a patch release without pulling in all of develop.
> The `commits` argument contains the SHA(s) already on develop that need to go to production.

**Why branch from main (not develop)?**  
A hotfix is a surgical fix to production. Branching from main ensures no unreleased develop work accidentally ships. The specific commits are cherry-picked in explicitly.

**Why merge (not cherry-pick) back to develop in finalize?**  
The cherry-picked commits already exist on develop. Merging the hotfix branch back (rather than cherry-picking) lets git reconcile the histories cleanly and avoids duplicate-commit conflicts on future releases.

### Hotfix dry run

If the user asks to dry run a hotfix before confirmation, do **not** create a branch or edit files. Use a temporary worktree from `origin/main` and test the cherry-pick there:

```bash
git fetch origin
tmpdir=$(mktemp -d /tmp/kapps-hotfix-dryrun.XXXXXX)
git worktree add --detach "$tmpdir/wt" origin/main
(
  cd "$tmpdir/wt"
  git cherry-pick --no-commit <commits>
  echo "Cherry-pick exit: $?"
  git status --short
)
git worktree remove --force "$tmpdir/wt" || true
rm -rf "$tmpdir"
```

Report:
- whether each commit is already on `origin/main`
- whether cherry-pick conflicts
- conflict file paths
- cross-app/shared-package blast radius
- inferred app and next patch version

Do not proceed to real hotfix work until the user confirms the version and accepts the blast radius.

### Hotfix Step 1 — Gather context

```bash
# Current version (for release notes reference)
grep '"version"' apps/<app>/package.json | head -1

# Detect locales
ls apps/<app>/content/release-notes/ | grep -vE "^(index|meta\.json)" | sort

# Show the commits to be released
for sha in <commits>; do
  git log --oneline -1 $sha
done
```

Read the commit messages to understand what changed. For a hotfix, release notes are brief — one section (usually 🐛 Bug Fixes or 🛡️ Security).

### Hotfix Step 2 — Write release notes

Read the changelog entries and commit messages for the specified SHAs to understand what was fixed:

```bash
# Read commit details for each SHA
for sha in <commits>; do
  echo "=== $(git log --oneline -1 $sha) ==="
  git show $sha --stat --no-patch
done

# Find matching changelog entries (by date or keyword from commit message)
ls apps/<app>/content/changelog/ | sort -r | head -10
```

Then create `apps/<app>/content/release-notes/<lang>/v<version>.mdx` for each locale.

Same frontmatter format as normal release. Content rules:
- Usually just one section: 🐛 Bug Fixes or 🛡️ Security
- User-facing language only — no technical details, no component names, no SHA references
- Lead with *why it matters* (what was broken, what risk was fixed)
- 1–3 bullets max

### Hotfix Step 3 — Bump patch version

```bash
sed -i '0,/"version": "[^"]*"/s//"version": "<version>"/' apps/<app>/package.json
```

### Hotfix Step 4 — Update meta.json + changelog entry

Same as normal release steps 4 and 5.

### Hotfix Step 5 — Create hotfix branch, cherry-pick, commit, open PR

```bash
git fetch origin

# Branch from main (not develop!)
git checkout main
git pull origin main
git checkout -b hotfix/v<version>

# Cherry-pick the specified commits in chronological order
# Sort SHAs by commit date first to avoid out-of-order conflicts
for sha in $(git log --reverse --oneline <commits> | cut -d' ' -f1); do
  git cherry-pick $sha
done

# Commit release artifacts on top
git add apps/<app>/package.json
git add apps/<app>/content/release-notes/
git add apps/<app>/content/changelog/<YYYYMMDD>-release-v<version>.md
git commit -m "release(<app>): v<version>"

git push origin hotfix/v<version>
```

Open PR:

```bash
gh pr create \
  --base main \
  --head hotfix/v<version> \
  --title "hotfix(<app>): v<version>" \
  --body "..."
```

PR body should list the commits being shipped and link to the brief release notes.

### Hotfix Step 6 — Report

```
✅ Version bumped: <old> → <version>
✅ Release notes written (patch, user-facing)
✅ Hotfix branch: hotfix/v<version> → main

🚀 PR ready: <PR_URL>

👉 合并后告诉我，我来打 tag 并合回 develop。
```

---

### Hotfix Finalize flow

> Run after the user confirms the hotfix PR is merged.

```bash
git fetch origin

# 1. Tag main
git checkout main
git pull origin main

# Guard: delete tag if it already exists (idempotent re-run)
git tag -d v<version> 2>/dev/null || true
git push origin --delete v<version> 2>/dev/null || true

git tag -a v<version> -m "hotfix(<app>): v<version>"
git push origin v<version>

# 2. Merge main back to develop to prevent divergence.
#    Hotfix code usually already exists on develop. Prefer develop's latest code
#    on conflicts while still recording main's merge commit and release artifacts.
git checkout develop
git pull origin develop
git merge origin/main -X ours -m "chore: sync main into develop after hotfix/v<version>"
git push origin develop

# 3. Cleanup
git branch -d hotfix/v<version> 2>/dev/null || true
git push origin --delete hotfix/v<version> 2>/dev/null || true
```

### Hotfix Finalize Step 4 — Verify production deployment

After tag, develop sync, and branch cleanup succeed, wait for production to report the target version before announcing anything publicly. For `app=buda`, use `https://buda.im/api/health`. For other apps, use `production-health-url`; if it is missing, stop and ask for the production health endpoint instead of publishing Discord.

Poll until `version` equals `<version>`. Also print `buildNumber`, `buildSha`, and `buildTime` when available so the user can see what actually deployed.

```bash
HEALTH_URL="<production-health-url>"
[ "<app>" = "buda" ] && HEALTH_URL="https://buda.im/api/health"

HEALTH_URL="$HEALTH_URL" EXPECTED_VERSION="<version>" node <<'NODE'
const healthUrl = process.env.HEALTH_URL;
const expected = process.env.EXPECTED_VERSION;
const deadline = Date.now() + 20 * 60 * 1000;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

while (Date.now() < deadline) {
  try {
    const response = await fetch(healthUrl, { cache: "no-store" });
    const body = await response.json();
    console.log(JSON.stringify({
      version: body.version,
      buildNumber: body.buildNumber,
      buildSha: body.buildSha,
      buildTime: body.buildTime,
    }));
    if (body.version === expected) process.exit(0);
  } catch (error) {
    console.log(`health check failed: ${error.message}`);
  }
  await sleep(30000);
}

console.error(`Timed out waiting for ${healthUrl} to report version ${expected}. Do not publish Discord yet.`);
process.exit(1);
NODE
```

If the timeout expires or the endpoint reports an older version, stop and tell the user deployment has not reached production yet. Do not publish Discord.

### Hotfix Finalize Step 5 — Social announcement

Only after the production health endpoint reports `version: "<version>"`, read the reviewed channel announcement copy from the codebase and publish it to Discord by default:

```bash
node .agents/skills/release/scripts/release-social.mjs \
  --app <app> \
  --version <version> \
  --mode send \
  --publish discord
```

If the user passed `publish-social`, use that value instead of the default `discord`.

If Discord is not configured, the script reads `apps/<app>/content/release-notes/_v<version>.md` and reports `DISCORD_WEBHOOK_URL_B64 is empty`. Do not invent credentials. Tell the user to provide the Discord Incoming Webhook URL so it can be base64-encoded into `.agents/skills/release/scripts/social-config.mjs`.

**Report:**

```
🏷  main tagged: v<version>
✅ develop 已同步 main（merge commit 對齊）
🧹 hotfix/v<version> 已删除
🔎 生产环境版本已确认：<version>
📣 Discord 通告已发送（或已生成文案但 Discord 尚未配置）

发布完成 🎉  <app> v<version> hotfix 已上线。
```

---

## Social release copy and publishing

After finalize and production deployment verification, publish reviewed channel announcement copy. Discord is the default channel:

```bash
node .agents/skills/release/scripts/release-social.mjs \
  --app <app> \
  --version <version> \
  --mode send \
  --publish discord
```

Behavior:
- `--mode generate` creates or updates `apps/<app>/content/release-notes/_v<version>.md`, but only writes generated follow-up sections. It reads `apps/<app>/content/release-notes/en/v<version>.mdx`, writes `## X Reply` from the release note title/description plus the release notes URL and default `#ai #agent` tags, writes `## Discord Follow-up` from the release note title plus the first 3 release-note bullets and the release notes URL, and preserves human-written `## X Primary Post` and `## Discord Primary Message` sections.
- `--mode send` reads reviewed social copy from `apps/<app>/content/release-notes/_v<version>.md` and sends only requested channels.
- If `--dry-run true` is passed, it validates and reports what would be sent without calling platform APIs.
- X primary posts are read from `## X Primary Post`, must be link-free, and must be at or under 1000 characters.
- X release-note links are read from `## X Reply` and are only sent when `--x-reply-link true` is passed.
- Discord primary announcements are read from `## Discord Primary Message`; Discord follow-ups are read from `## Discord Follow-up`. The send script posts the primary message first, then the follow-up.
- If a requested channel is not configured, the script reports that the key is missing and skips that channel.
- Discord key lives in `.agents/skills/release/scripts/social-config.mjs` as `DISCORD_WEBHOOK_URL_B64`. The user needs to provide a Discord Incoming Webhook URL, not an app ID.
- X/Twitter key lives in the same config as `X_OAUTH1_B64` and contains OAuth 1.0a app/user credentials for posting tweets.
- Keys are base64 strings by convention. At initial setup they are intentionally empty; tell the user "还没配置好，等配置更新 skill" instead of inventing credentials.

Discord setup:

```bash
printf '%s' '<discord-webhook-url>' | base64 -w0
```

Paste the result into:

```js
export const DISCORD_WEBHOOK_URL_B64 = "<base64-webhook-url>";
```

Do not ask for or store a Discord application ID, bot token, client secret, or channel ID for this flow. Incoming Webhook URL is sufficient.

Commit the reviewed `_v<version>.md` file if the user wants the social copy archived with the release.

---

## Lessons learned

- Hotfix commits from `develop` can include cross-app/shared-package changes even when the commit title names one app. Dry run must report blast radius, not only conflicts.
- Cherry-picking onto `main` may surface UI conflicts already resolved on `develop`; resolve narrowly and keep `main` behavior plus the intended hotfix.
- Full `make typecheck && pnpm lint:err` can pass while pre-push reports warning-level lint from touched files. Treat warnings as context unless the hook blocks.
- Finalize should verify PR state before tagging. Never tag or clean branches while the PR is still open or CI is pending.
- When syncing `main` back to `develop`, use `git merge origin/main -X ours ...` so `develop` remains the source of truth for conflicting code, while main's release merge history and new release artifacts are still recorded.

---

## Quality Checklist

**Normal flow:**
- [ ] **Divergence check passed**: develop is not behind main before branching
- [ ] Version in package.json is the app's own version (not a workspace dependency)
- [ ] All detected locales have `v<version>.mdx` with correct frontmatter
- [ ] **Frontmatter `title` matches the locked per-locale format** (e.g. `Buda v<version> 发布说明` for zh-CN, `Buda v<version> 發佈說明` for zh-TW, `Buda v<version> Release Notes` for en)
- [ ] meta.json `pages` starts with `v<version>` in every locale
- [ ] Changelog entry created, no placeholder text
- [ ] Pre-flight passed: clean tree, was on `develop`
- [ ] PR open: `release/v<version>` → `main`, title `release(<app>): v<version>`

**Hotfix flow:**
- [ ] Hotfix branch created from `main` (not develop)
- [ ] Only the specified commits cherry-picked (no extra develop code)
- [ ] Version bumped to next patch (X.Y.Z+1)
- [ ] Release notes are brief and user-facing only
- [ ] PR open: `hotfix/v<version>` → `main`, title `hotfix(<app>): v<version>`

**Finalize flow (both):**
- [ ] Tag `v<version>` on `main` pushed to origin (idempotent — safe to re-run)
- [ ] `develop` merged from `origin/main` with `-X ours` to sync the PR merge commit while preferring develop code, pushed
- [ ] Release/hotfix branch deleted locally and on remote
- [ ] Optional: reviewed social copy written to `apps/<app>/content/release-notes/_v<version>.md`
- [ ] Optional: Discord/X publishing attempted only when configured
