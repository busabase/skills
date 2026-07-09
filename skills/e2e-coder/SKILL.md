---
name: e2e-coder
description: Interactive UI inspection tool for apps/buda e2e tests. Runs Playwright specs headed with slowMo so you can watch and debug. Iteratively fixes failing tests. Use when you want to visually verify UI functionality or write/fix e2e specs.
disable-model-invocation: false
allowed-tools: Bash(pnpm:*), Bash(npx:*), Bash(ls:*), Bash(cat:*), Read, Write, Edit, Grep, Glob
user-invocable: true
---

# e2e-coder — Interactive UI Inspection & Auto-Fix Loop

Runs Playwright e2e tests **headed + slowMo** so you can watch the browser in real time.  
When a test fails, automatically reads the screenshot + error, fixes the spec, and re-runs.  
Repeat until all tests pass or user says stop.

## Core Principles

- **Headed always**: `--headed --workers=1` — you watch every click
- **slowMo=400**: Every action has a 400ms pause — readable, not rushed
- **Auto fix-loop**: fail → read screenshot → fix spec → re-run (up to 5 attempts)
- **No networkidle**: Never use `waitForLoadState("networkidle")` — AI streaming breaks it
- **Auth via fixture**: All tests use `authTest` + `switchToBudaSpace` from `fixtures/auth`
- **switchToBudaSpace after every page.goto()**: Space resets to FREE on navigation

## Workflow

### 1. Run a spec (headed, you watch)
```bash
cd apps/buda
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test <spec-name> \
  --headed --workers=1 --reporter=list --timeout=600000
```

### 2. On failure — auto fix loop
1. Read error output (line number + message)
2. Read failure screenshot: `test-results/<test-name>/test-failed-1.png`
3. Analyze: what's visible on screen vs what the test expected?
4. Fix the spec (minimal change)
5. Re-run the same spec
6. Repeat up to 5 times

### 3. Run all UI specs (~2 min, excludes API tests)
```bash
cd apps/buda
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test \
  onboarding agent-ui chat-channels settings-tabs settings-ui \
  team-share-ui billing-ui dashboard-ui drive-ui \
  --headed --workers=1 --reporter=list --timeout=600000
```

## Available Specs

| Spec | What it tests |
|------|--------------|
| `onboarding` | Full smoke: space switch → agent → drive → skills → settings → chat |
| `agent-ui` | Create agent, chat, switch model, chat again |
| `settings-tabs` | Space + user settings all tabs |
| `settings-ui` | Settings modal via URL params |
| `drive-ui` | Drive page loads |
| `chat-channels` | Chat input, channels settings |
| `team-share-ui` | Space selector, share |
| `billing-ui` | Billing page |
| `dashboard-ui` | Dashboard loads |
| `context-engineering` | API-level context |

## Writing New Specs

```typescript
import { expect } from "@playwright/test";
import { test as authTest, switchToBudaSpace } from "./fixtures/auth";

authTest.use({ launchOptions: { slowMo: 400 } });

authTest("what you're testing", async ({ adminPage: page }) => {
  await page.goto("/dashboard");
  await page.waitForSelector("text=AGENTS", { timeout: 15000 });
  await switchToBudaSpace(page); // always after page.goto!

  // steps...
});
```

## Key Selectors

```typescript
page.getByPlaceholder(/e\.g\., Create a pricing page/i)     // new session input
page.getByPlaceholder(/How can I help you today/i)           // existing session input
page.locator(".is-assistant").first()                         // AI reply bubble
page.locator('button:has-text("Auto")').first()              // model selector
page.getByRole("button", { name: "New agent", exact: true }) // create agent
page.locator("button").filter({ hasText: /^Drive$/ }).first() // Drive tab

// Settings — use URL params, NOT clicking avatar (dropdown timing issues with slowMo)
await page.evaluate(({ section, tab }) => {
  const url = new URL(window.location.href);
  url.searchParams.set("settings", section);
  url.searchParams.set("tab", tab);
  window.history.pushState({}, "", url.toString());
  window.dispatchEvent(new PopStateEvent("popstate"));
}, { section: "account", tab: "profile" });
await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
```

## Common Pitfalls & Fixes

| Problem | Fix |
|---------|-----|
| `networkidle` timeout | Use `waitForSelector("text=AGENTS")` instead |
| Space reverts to FREE after `page.goto()` | Call `switchToBudaSpace()` after every navigation |
| Account Settings dropdown not clicked | Use URL params + popstate instead |
| Space Settings dropdown not clicked | Use URL params + popstate instead |
| Multiple elements match | Add `.first()`, `.nth(n)`, or `{ exact: true }` |
| AI streaming blocks test | Never wait for networkidle after sending message |
| slowMo closes dropdown before click | Use `waitForSelector` on menu content before clicking |
| `waitFor` timeout on visible element | Element exists but slowMo delayed render — increase timeout |

## File Locations

```
apps/buda/
├── tests/e2e/
│   ├── fixtures/auth.ts     # authTest + switchToBudaSpace
│   ├── onboarding.spec.ts   # Full smoke test (run this first)
│   └── *.spec.ts
├── playwright.config.ts
└── test-results/            # Screenshots on failure
```
