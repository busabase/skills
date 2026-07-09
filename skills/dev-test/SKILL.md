---
name: dev-test
description: AI-driven browser testing that analyzes git/PR changes and uses Stagehand to verify affected functionality in a real browser.
disable-model-invocation: false
allowed-tools: Bash(make:*), Bash(pnpm:*), Bash(npx:*), Bash(git:*), Bash(curl:*), Bash(lsof:*), Read, Write, Edit, Grep, Glob
user-invocable: true
---

# Dev Test — Change-Aware AI Browser Testing

Analyzes git diff / PR changes, then uses Stagehand AI browser agent to test the affected functionality.

## Workflow

### 1. Detect Changed App
```bash
git diff --name-only origin/develop...HEAD
```
- Find which `apps/*` directories have changes
- If multiple apps changed, pick the one with the most file changes
- If no app changes, default to `productready`

### 2. Ensure Environment is Ready
```bash
docker compose ps | grep postgres  # Check DB
make db                             # Start if needed

# Read apps/<app>/package.json "name" for correct pnpm filter
pnpm --filter <package-name> db:generate  # If script exists
```

### 3. Start Dev Server
```bash
pnpm --filter <package-name> dev --port 3020
# Wait until curl -sf http://localhost:3020 succeeds
```

### 4. Run Change-Aware Browser Test
```bash
TARGET_APP=<app-name> TARGET_PORT=3020 npx tsx .claude/skills/dev-test/scripts/run-test.ts
```

The script automatically:
1. Reads `git diff` to understand what changed
2. Categorizes changes (pages, components, API, styles, auth, i18n, pricing)
3. Builds a targeted test plan based on change categories
4. Opens a real Chrome browser and executes each test step via AI
5. Reports pass/fail for each step

### 5. Cleanup
- Kill the dev server after tests
- Report results

## How Test Plans Are Built

| Change Category | Test Action |
|---|---|
| Page/layout files | Navigate to all visible nav links, check each page loads |
| Components/CSS | Scroll full page, check visual layout, header/footer |
| Auth/Clerk | Click Login/Sign In, verify auth page |
| API/tRPC/routers | Interact with forms and buttons, check responses |
| Pricing/billing | Navigate to Pricing page, verify cards |
| i18n/locale | Try language switcher |
| Fallback | Click first 3 nav links |

## Key Rules
- **Read `apps/<app>/package.json` "name" field** for pnpm filter
- **Check if `db:generate` script exists** before running
- Uses `OPENAI_API_KEY` + `OPENAI_BASE_URL` for AI model
- Chrome opens visibly on desktop (headful mode)

## Requirements
- Docker running (for DB services)
- `OPENAI_API_KEY` in environment
- Google Chrome installed at `/usr/bin/google-chrome`
