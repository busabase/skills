---
name: opensource
description: Sync a monorepo app to its public open-source GitHub repository. Copies files, strips private content, commits, and pushes. Supports buda-cli, productready, and busabase (the busabase sync also publishes busabase-desktop + busabase-mobile into the repo's apps/).
disable-model-invocation: false
allowed-tools: Bash(git:*), Bash(gh:*), Bash(rsync:*), Bash(cp:*), Bash(rm:*), Bash(mkdir:*), Bash(ls:*), Bash(cat:*), Bash(find:*), Bash(grep:*)
user-invocable: true
---

# Open Source Publisher

Syncs a monorepo app to its public GitHub repository.

## Arguments

- `app` (required): App to publish. One of: `buda-cli`, `productready`, `busabase`, `busabase-skills`. (The `busabase` sync publishes the whole `busabase/busabase` monorepo: `busabase`, `busabase-cli`, `busabase-sdk`, `busabase-desktop`, and `busabase-mobile`; `busabase-skills` publishes `.agents/skills` to `busabase/skills`.)
- `message` (optional): Custom commit message. Defaults to auto-generated from recent git log.
- `tag` (optional): Create a git tag after pushing, e.g. `v0.2.0`.
- `dry-run` (optional): If `true`, show what would be copied without pushing.

## App → Repo Mapping

| app | public repo | local target | method |
|-----|-------------|--------------|--------|
| `buda-cli` | `github.com/buda-ai/buda-cli` | `/tmp/opensource-buda-cli` (fresh clone each time) | rsync |
| `productready` | `github.com/mr-kelly/productready` | `/tmp/opensource-productready` (fresh clone each time) | dedicated script |
| `busabase` | `github.com/busabase/busabase` | `~/Documents/busabase` (persistent clone) | dedicated script |
| `busabase-skills` | `github.com/busabase/skills` | `~/Documents/busabase-skills` (persistent clone) | dedicated script |

---

## Workflow: `buda-cli`

### Step 1 — Prepare clone

```bash
rm -rf /tmp/opensource-buda-cli
gh repo clone buda-ai/buda-cli /tmp/opensource-buda-cli
```

### Step 2 — Sync files

```bash
rsync -av --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='target/debug' \
  --exclude='target/release' \
  --exclude='*.env' \
  --exclude='.env*' \
  apps/buda-cli/ /tmp/opensource-buda-cli/
```

### Step 3 — Security check

```bash
find /tmp/opensource-buda-cli -name "*.env" -o -name ".env*" | grep -v ".git"
grep -r "sk-\|PRIVATE_KEY\|SECRET_KEY" /tmp/opensource-buda-cli/src -l 2>/dev/null || echo "clean"
```

If any secrets found, **STOP**.

### Step 4 — Commit and push

```bash
cd /tmp/opensource-buda-cli
git add -A
git diff --cached --quiet && echo "NO_CHANGES" || git commit -m "<message>"
git push origin main
```

### Step 5 — Tag (optional)

```bash
git tag <tag> && git push origin <tag>
gh release create <tag> --repo buda-ai/buda-cli --title "<tag>" --generate-notes
```

---

## Workflow: `productready`

Uses the dedicated script `scripts/publish-productready-repo.ts` which handles:
- Copying `apps/productready` + all shared packages (`kui`, `billing`, `emaillib`, `sharelib`, `share-domains`, `transactional`)
- Generating a standalone `package.json`, `pnpm-workspace.yaml`, `README.md`, `.gitignore`
- Stripping `marketing/` drafts (unless `--include-marketing`)
- Committing and pushing to the local target repo

### Step 1 — Prepare clone

```bash
rm -rf /tmp/opensource-productready
gh repo clone mr-kelly/productready /tmp/opensource-productready
```

### Step 2 — Run the publish script

```bash
pnpm tsx scripts/publish-productready-repo.ts --target /tmp/opensource-productready --push
```

Target defaults to `/home/kelly/Documents/projects/productready` (points to `github.com/mr-kelly/productready`).

### Step 2 — Tag (optional)

```bash
cd /home/kelly/Documents/projects/productready
git tag <tag> && git push origin <tag>
gh release create <tag> --repo mr-kelly/productready --title "<tag>" --generate-notes
```

---

## Workflow: `busabase`

Uses the dedicated script `scripts/publish-busabase-repo.ts`. It copies
`apps/busabase` + `apps/busabase-cli` (the npm CLI) + `apps/busabase-sdk` (the typed client library) + their workspace packages
(`busabase-contract`, `busabase-core`, `open-domains`, `openlib`, `kui`) into the public repo, keeping
the `apps/*` + `packages/` layout, and generates a standalone `package.json`,`pnpm-workspace.yaml`, `.gitignore`, and a root MIT `LICENSE`. Real `.env*` files are stripped
(`.env.example` kept). The shared design-system CSS lives in `openlib/shared.css`
(sharelib re-imports it), so the open-source surface pulls only open packages.

**NEVER open-source `apps/busabase/content`.** It holds private changelogs/specs
(the monorepo changelog convention puts app changelogs in `apps/<app>/content/changelog/`).
The script excludes it (`shouldCopy` → `excludedRelPaths`); that content is **merged
into `apps/busabase-cloud/content`** (the private cloud app) instead. If you write a
busabase changelog, put it in `apps/busabase-cloud/content/changelog/`, not
`apps/busabase/content/` — and if the dir reappears, the sync still skips it.

**Lockfile is regenerated for the OSS workspace.** The copied monorepo
`pnpm-lock.yaml` doesn't match the reduced workspace, so the script runs
`pnpm install --lockfile-only` in the target to produce a standalone lock — without
it, the OSS repo's CI + the Dockerfile's `pnpm fetch --offline --frozen-lockfile`
would fail. Any shared package the OSS surface includes must declare its OWN type
deps (e.g. `openlib` needs `@types/negotiator`), not rely on monorepo hoisting.

**Root README:** the repo's root `README.md` is **copied verbatim from
`apps/busabase/README.md`** (the full product README), so
`github.com/busabase/busabase` leads with it. The script only rewrites that
README's relative link prefixes `./docs/` → `./apps/busabase/docs/` and
`./public/` → `./apps/busabase/public/` so screenshots and translated READMEs
resolve from the repo root (assets are copied once, not duplicated). To change
the public landing doc, edit `apps/busabase/README.md`.

### Step 1 — Prepare clone

The persistent local target is `~/Documents/busabase` (clone of
`github.com/busabase/busabase`). Clone it once if missing:

```bash
gh repo clone busabase/busabase ~/Documents/busabase
```

### Step 2 — Run the publish script

```bash
# preview only
npx tsx scripts/publish-busabase-repo.ts --dry-run
# populate the target WITHOUT pushing (review the diff first)
npx tsx scripts/publish-busabase-repo.ts --target ~/Documents/busabase
# ...or populate + verify build + commit + push
npx tsx scripts/publish-busabase-repo.ts --target ~/Documents/busabase --verify --push
```

Always run the security scan on the populated target before pushing
(`find` for `.env*`, grep for real keys).

**CI lives in the OSS repo (NOT generated by this script).** `busabase/busabase`
owns `.github/workflows/publish-npm.yml` + `docker.yml` as its own committed files,
both on GitHub's official `ubuntu-latest`: it is the **sole npm publisher** (with
provenance) and builds/pushes the Docker image (GHCR + Docker Hub) on push to `main`.
The sync **preserves `.github`** (`cleanTargetRoot` keeps `.git` + `.github`), so it
never clobbers the repo's CI — edit those workflows directly in the OSS repo.
kapps keeps **no** `apps/busabase` actions (both `publish-busabase.yml` and
`busabase-docker.yml` were removed; the internal ops-manager deploy is gone with it).
Required `busabase`-org repo secrets: `NPM_TOKEN` (Automation token that can publish
the unscoped names) + `DOCKERHUB_TOKEN` (Docker Hub access token); GHCR uses the
built-in `GITHUB_TOKEN`.

---

## `busabase-desktop` + `busabase-mobile` (in the busabase repo)

Both ship **inside `busabase/busabase/apps/*`** — `publish-busabase-repo.ts` copies all four
apps (`openSourceApps`) into the one repo; there are no separate desktop/mobile repos.

- **busabase-desktop** (Tauri 2.0 + Next): its **sidecar IS the busabase server** (the build
  runs `pnpm --filter busabase build`), so co-locating with `apps/busabase` is exactly what it
  needs. `stripPrivateConfig` blanks the `tauri.conf.json` updater `pubkey`.
- **busabase-mobile** (Expo 56 + RN): sharelib-free (its only `sharelib/metro` helper is inlined).
  `stripPrivateConfig` deletes `app.json` `owner` + `extra.eas.projectId` and `eas.json`
  `submit.*.ios.ascAppId`.
- Both apps' `content/` dirs are excluded (`excludedRelPaths`).
- **Server CI stays lean:** `publish-npm.yml` installs with `--filter "busabase..."
  --filter "busabase-cli..."` so React Native / Expo are never pulled (and their native
  postinstalls never run) on an npm publish. The Dockerfile already tolerates extra
  workspace importers (it selectively COPYs only busabase + its packages).
- **Native release CI is NOT shipped** (Tauri signing / notarization / R2, EAS / TestFlight /
  Play all need secrets that can't live in a public repo). Forkers add their own.

---

## Workflow: `busabase-skills`

Uses the dedicated script `scripts/publish-busabase-skills-repo.ts`. It mirrors
this repo's canonical `.agents/skills/` directory into the public
`busabase/skills` repo at `~/Documents/busabase-skills`, cloning
`github.com/busabase/skills` there when the directory is missing.

The public repo also owns its own install surfaces (`README.md`, `.mcp.json`,
`server.json`, Claude/Codex marketplace metadata, and plugin manifests). The
script preserves those files and syncs only:

- `.agents/skills/*` -> `skills/*`
- `.agents/skills/busabase` -> `plugins/busabase/skills/busabase`

The second copy is intentional: Codex plugins bundle only files inside the
plugin directory, so the Busabase plugin needs its own embedded `busabase` skill.
Do **not** copy every internal kapps skill into `plugins/busabase/skills/`; users
installing the Busabase plugin should get only the Busabase workflow.

### Step 1 — Import/update the Busabase skill in kapps

If `~/Documents/busabase-skills` is missing, clone it first:

```bash
gh repo clone busabase/skills ~/Documents/busabase-skills
```

Then copy the public Busabase skill into this repo's source-of-truth skills dir:

```bash
mkdir -p .agents/skills/busabase
rsync -a --delete --exclude='.DS_Store' \
  ~/Documents/busabase-skills/skills/busabase/ \
  .agents/skills/busabase/
```

Per `agent-rules`, `.agents/skills/` is the source. Do not edit `.claude/skills`,
`.codex/skills`, `.github/skills`, or `.kiro/skills` directly; they are symlinks.

### Step 2 — Publish all kapps skills to `busabase/skills`

```bash
# preview only
pnpm tsx scripts/publish-busabase-skills-repo.ts --dry-run

# populate the target WITHOUT committing (review the diff first)
pnpm tsx scripts/publish-busabase-skills-repo.ts

# ...or populate + commit + push
pnpm tsx scripts/publish-busabase-skills-repo.ts --push \
  --message "chore(skills): sync kapps agent skills"
```

The script excludes local secrets/state/build output (`.env*`, `config.local.json`,
`state/`, `.data/`, `node_modules`, generated build folders, and key material).
Always inspect the target diff and run the security scan before pushing:

```bash
cd ~/Documents/busabase-skills
git status --short
git diff --stat
find skills plugins/busabase/skills -name "*.env" -o -name ".env*" | grep -v ".git" || true
grep -R "sk-\\|PRIVATE_KEY\\|SECRET_KEY\\|BEGIN .*PRIVATE KEY" skills plugins/busabase/skills -n 2>/dev/null || echo "clean"
```

---

## README handling (ALL apps — always process)

The public repo's **root `README.md` is the landing page**, so it must render
perfectly on GitHub. Whenever the app's real README lives in a subdir (e.g.
`apps/<app>/README.md`) and becomes the repo-root README:

1. **Copy the real README to the repo root** — do not hand-write a stub.
2. **Rewrite relative link prefixes** so they resolve from the new root location.
   The README's links are relative to its original dir; if assets are copied under
   `apps/<app>/`, rewrite `./docs/` → `./apps/<app>/docs/` and `./public/` →
   `./apps/<app>/public/` (and any other relative asset prefix). Do **not** duplicate
   assets — rewrite links to the single copied location.
3. **Translated READMEs count too** — `docs/README_*.md` (zh-CN / ja / ko / …) keep
   their own relative links (`../public/...`, `../README.md`, sibling `./README_xx.md`).
   They stay in place, so their links resolve as long as the dir structure is preserved.
4. **Verify every relative ref resolves** (images + cross-language links) before
   committing — a broken image on the landing page is a bad first impression:

   ```bash
   cd <target-repo>
   python3 - <<'PY'
   import os, re
   rx = re.compile(r'\]\(([^)]+)\)')
   broken = 0
   for md in ["README.md"] + [f"apps/busabase/docs/{f}" for f in os.listdir("apps/busabase/docs")] if os.path.isdir("apps/busabase/docs") else ["README.md"]:
       d = os.path.dirname(md)
       for ref in rx.findall(open(md, encoding="utf-8").read()):
           if ref.startswith(("http://","https://","#","mailto:")): continue
           ref = ref.split("#")[0].strip()
           if ref and not os.path.exists(os.path.normpath(os.path.join(d, ref))):
               print("BROKEN", md, "->", ref); broken += 1
   print("OK" if broken == 0 else f"{broken} BROKEN")
   PY
   ```

For `busabase` this is implemented inside `scripts/publish-busabase-repo.ts`
(`writeRootReadme` copies `apps/busabase/README.md` and rewrites the prefixes).

## Commit messages (ALL apps — be careful & specific)

The public repo's history is public. **Do NOT push a generic `chore: publish vX`.**
Write a proper **Conventional Commits** message that says what actually changed in
this sync:

1. **Diff first.** Before committing, inspect `git -C <target> status` +
   `git diff --cached --stat` and summarize the real delta (new features, fixes,
   removed files, CI/dep changes).
2. **Type + scope + imperative summary**, e.g. `feat:`, `fix:`, `chore:`, `ci:`,
   `docs:`, `refactor:` — `feat(cli): add records search command`.
3. **Body = bullet list of the meaningful changes** (not a file dump). Group by area.
4. Don't rely on the script's default message — pass your own, or commit manually
   with `git -C <target> commit` after the script populates (run it WITHOUT `--push`,
   review, then commit + push yourself).

Example:
```
feat: initial open-source release — server, CLI, CI

- apps/busabase: `busabase server` boots a zero-setup local instance (pglite)
- apps/busabase-cli: typed npm OpenAPI client
- apps/busabase-sdk: typed TS/JS SDK library (built from busabase-contract)
- .github/workflows: publish-npm (provenance) + docker (multi-arch), ubuntu-latest
- root README from the full product README; standalone pnpm lockfile
- apps/busabase/content kept private (excluded)
```

## Notes

- Always run from the monorepo root (`/home/kelly/Documents/kapps4`)
- The public repo's `main` branch is the release branch — no PRs needed
- History is public & permanent — never force-push secrets/leaks away and assume
  they're gone (GitHub may serve old SHAs until GC). Keep private paths out via
  `excludedRelPaths` in the first place.
