---
name: cmo
description: Chief Marketing Officer workspace for reviewing growth health, paid media state, campaign/account readiness, and next marketing actions. Use when aggregating, planning, creating, pausing, reviewing, or optimizing paid ads across Google Ads and Reddit Ads, launching a local Vite + React CMO console, or coordinating GTM/paid-media execution from platform-derived data.
---

# CMO

Use this skill as the chief marketing officer workspace for paid media and growth operations. It is derived from the Ads skill and keeps the same platform-first safety model: platform accounts are the source of truth, local files are cache/audit state, and writes require explicit confirmation.

## App UI

The skill includes a local CMO console. Follow the App-in-Skill Creator contract as
the baseline: the app is an operator surface, the skill owns external side effects,
and local handoff/config files stay private. This app is currently a documented
**complex SPA exception** to the default zero-build frontend rule because it has
many interdependent dashboard views, charts, filters, deep links, and review panes.
The **frontend** therefore stays Vite + React for now (modeled after
`.agents/skills/gtm/app`); do not copy this stack into new App-in-Skills by default.
The **backend** is a platform-neutral **Hono** app (`app/server/hono.mjs`) that
reaches state only through `lib/data-provider/`, so the same `app.fetch` runs
locally, standalone under `@hono/node-server`, and — once the data layer is
cloud-backed — on Cloudflare Workers unchanged.

```bash
.agents/skills/cmo/app/start.sh            # dev: React HMR + in-process Hono API
# Picks the first port in 3000-4000 free on BOTH IPv4 and IPv6 (so `localhost`
# resolves to us), or reuses one already serving this app. Override: CMO_UI_PORT=3210
```

Run modes:

- **dev** (`start.sh`): Vite serves the React frontend and forwards `/api/*` into the
  Hono app (`app/vite.config.ts`). One API source of truth — no duplicated handlers.
- **standalone** (`cd app && npm run build && npm run serve`): `app/server/index.mjs`
  runs the Hono app under `@hono/node-server`, serving `app/dist` + the API. This is
  the Cloudflare-ready path.

Data access is polymorphic via `CMO_DATA_PROVIDER` (default `local`); reserve
`postgres` / `aitable` / `notion` / `busabase` for future cloud providers.

The UI chrome is multilingual (`src/i18n/`, English + Simplified Chinese): default mode is
**Auto** (follows the browser), with an explicit **Language** selector in Help & Settings that
persists to `localStorage`. Only chrome is translated — account/campaign/domain data is not.

### Busabase data provider

`CMO_DATA_PROVIDER=busabase` backs the **review model** (proposals / decisions / agent-tasks)
with a Busabase instance via `busabase-sdk`, while marketing, the platform snapshot, config,
lock, and onboarding still come from local files (hybrid). CMO proposals map onto Busabase
**Change Requests**, so the same review vocabulary holds end to end:

| CMO verdict | Busabase call | resulting CR status |
| --- | --- | --- |
| `approve` | `changeRequests.review({ verdict: "approved" })` (+ optional `merge`) | `approved` → `merged` |
| `request_changes` | `changeRequests.review({ verdict: "rejected", reason })` | `changes_requested` (non-terminal; re-queues the agent) |
| `block` | `changeRequests.close({ reason })` | `rejected` (terminal) |
| `revise` | `operations.revise({ operationId, fields })` | new commit |

Works against a **local `busabase server`** (`:15419`, open, no key) or **Busabase Cloud**
(API key). Configure via env (never commit secrets):

```bash
export CMO_DATA_PROVIDER=busabase
export BUSABASE_BASE_URL="http://localhost:15419"   # or https://busabase.com
export BUSABASE_API_KEY="sk-..."                    # cloud only
export BUSABASE_SPACE_ID="..."                       # when the key has >1 space
export BUSABASE_CMO_BASE_ID="..."                    # the base new proposals are drafted into
```

Verify connectivity + the CR lifecycle against a running server:

```bash
node .agents/skills/cmo/scripts/verify-busabase.mjs           # read-only: health, auth, proposals, agent tasks
node .agents/skills/cmo/scripts/verify-busabase.mjs --write    # + create → request_changes → block round-trip (needs BUSABASE_CMO_BASE_ID)
```

The provider loads `busabase-sdk` lazily (only in busabase mode) from its built `dist/` (or TS
source) by absolute path, so `local` mode never pulls the SDK. Reserve `postgres` / `aitable` /
`notion` for future providers.

**Provider interface.** All providers implement one polymorphic contract,
`CmoDataProvider` in `lib/data-provider/provider-interface.ts` — a real TypeScript `interface`,
so `class LocalFileProvider implements CmoDataProvider` (and `BusabaseProvider`) is checked at
author time; `assertProvider()` in `index.ts` is the runtime backstop that rejects a
non-conforming provider at selection. The `lib/data-provider/*.ts` files use **erasable
TypeScript only** and run under **Node ≥23.6 native type-stripping — no build step** (`lib/`
carries `{"type":"module"}` so Node treats the `.ts` as ESM). Adding a provider = a class
implementing the interface + one line in the `providers` map.

Start with read-only platform sync when the user wants current account/campaign state:

```bash
node .agents/skills/cmo/scripts/sync_platforms.mjs
node .agents/skills/cmo/scripts/sync_platforms.mjs --account-key reddit-main
```

Compatibility alias:

```bash
node .agents/skills/cmo/scripts/sync_accounts_draft.mjs
```

The console reads handoff files under `app/.data/`: `platform_snapshot.json`,
`current_batch.json`, `decisions.json`, `execution_report.json`, plus the App-in-Skill
markers `onboarding.json` (onboarding completion) and `agent_tasks.json` (proposals in
`changes_requested` or carrying an `@ai` comment — queued agent work). Treat these as
short-lived local state, not account truth.

This skill intentionally keeps sanitized `config.local.json` and `app/.data/*.json`
seed/demo handoff files in git so a fresh checkout opens with a populated CMO
console. Do not remove these files or add ignore rules that hide them. Keep actual
secrets out of committed files: OAuth tokens, client secrets, access tokens, and
private credentials must live in env vars or `~/.config`, never in JSON committed
to the repo.

Read `references/ui-schema.md` before changing the local file contract or scripts that consume UI decisions.

## Safety Rules

- Treat ad account IDs, OAuth tokens, refresh tokens, client secrets, pixels, billing data, and exported user data as sensitive. Never commit secrets.
- Default to read-only sync and dry-run planning for new paid media work.
- Do not treat local `app/.data` JSON as the ads source of truth. Refresh from platform before drafting or executing material changes.
- Do not require every platform/account to be configured. The planner should operate on connected accounts; missing accounts are coverage gaps.
- Do not execute Google Ads or Reddit Ads write calls unless the user explicitly asks for execution and confirms the platform, account, budget, dates, objective, destination URL, and intended launch status.
- Prefer paused/draft campaign status for new campaigns when the platform supports it.
- Use platform UIs for final human review before enabling spend.
- Do not bypass access controls, approval gates, platform review, billing requirements, CAPTCHAs, or policy restrictions.

## CMO Workflow

1. Review platform/account readiness and current campaign performance.
2. Identify gaps in spend, creative, landing pages, targeting, or measurement.
3. Generate campaign/account proposals as diffs against platform state.
4. Use the local console to inspect drafts, request changes, or block unsafe proposals.
5. Execute only after explicit confirmation; write new campaigns as paused unless the user asks otherwise.
6. Read back platform state after execution and update local reports.

## Google Ads Execution

Read `references/google-ads.md` before operating Google Ads. The Google line is Buda/kapps-oriented:

- SEM/Search campaigns come from `apps/buda/src/domains/gtm/data/icps/<icp-id>.ts` `sem` blocks.
- YouTube campaigns come from `apps/buda/content/videos/<lang>/*.mdx` `ads:` frontmatter.
- Scripts look for the kapps repo from the current workspace, or use `ADS_GOOGLE_REPO_ROOT=/absolute/path/to/kapps`.

Commands:

```bash
node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer --dry-run
node .agents/skills/cmo/scripts/create-google-sem-campaign.mjs --icp seo-marketer
node .agents/skills/cmo/scripts/pause-google-sem-campaign.mjs --icp seo-marketer
node .agents/skills/cmo/scripts/create-google-video-campaign.mjs \
  --mdx /Users/kelly/Documents/kapps/apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --dry-run
node .agents/skills/cmo/scripts/pause-google-video-campaign.mjs --campaign-id 12345678
```

Legacy Ads-compatible commands are also supported and should keep working for callers migrated from `$ads`:

```bash
node .agents/skills/cmo/scripts/create-sem-campaign.mjs --icp seo-marketer --dry-run
node .agents/skills/cmo/scripts/pause-sem-campaign.mjs --icp seo-marketer
node .agents/skills/cmo/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --dry-run
node .agents/skills/cmo/scripts/pause-video-campaign.mjs --campaign-id 12345678

# Create only missing YouTube video assets in Google Ads asset library.
# This does not create campaigns, ads, ad groups, or budgets.
node .agents/skills/cmo/scripts/sync-google-video-assets.mjs --execute --confirm-asset-write
```

SEM state uses the old Ads contract at `.agents/skills/cmo/state/sem-state.json`. The CMO scripts also read existing fallback state from `.agents/skills/cmo/app/.data/google-sem-state.json` and `.agents/skills/ads/state/sem-state.json`, then write new state back to the CMO state file.

Full legacy Google Ads setup and field reference: [GOOGLE-ADS.md](./GOOGLE-ADS.md).

Config compatibility: if `.agents/skills/cmo/config.local.json` is absent, CMO reads `.agents/skills/ads/config.local.json` and then `~/Documents/sourcing/.agents/skills/ads/config.local.json` as legacy fallbacks. Do not copy real account IDs, access tokens, or secrets into committed docs or examples.

Requirements:

```bash
export GOOGLE_ADS_DEVELOPER_TOKEN="your_developer_token"
export GOOGLE_ADS_CUSTOMER_ID="xxx-xxx-xxxx"
```

Credentials:

```text
~/.config/google-ads/client_secret.json
~/.config/google-ads/token.json
```

## Reddit Ads Workflow

Before using Reddit API details, verify current official docs. Read `references/official-api-v3.md`, then browse official Reddit docs or the official Postman workspace for endpoint, enum, field, spec, policy, or rate-limit details that affect the task.

1. Clarify product, audience, geography, offer, objective, budget, timeline, conversion event, and risk category.
2. Inspect Reddit manually before bulk research: subreddit names, rules, tone, ad placements if visible, active discussions, and buyer intent.
3. Build a subreddit and interest map: core buyer communities, adjacent problem communities, competitor/tool communities, and exclusions.
4. Create a small first test: 2-4 audiences, 2-4 creative angles, 1-2 destinations, and a clear success threshold.
5. Run read-only platform sync and inspect existing campaigns, ads, pixel/events, and recent reporting.
6. Generate proposals as diffs against platform state.
7. Use the local console to review the draft, request changes, or block it.
8. Execute Reddit write calls only after separate explicit confirmation; write new campaigns as paused unless the user explicitly asks otherwise.

## Naming Conventions

Use stable, pipe-separated names so the platform UI, local app, and future agents can scan campaigns without opening every detail page.

```text
{Product} | ICP:{icp-slug} | {Platform}:{objective} | {Market-Lang} | {OfferOrLP} | {YYYY-MM-T##}
AG:{audience-slug} | {targeting-cluster} | {Market-Lang}
AD:{audience-slug} | Angle:{angle-slug} | {asset-or-post-slug}
```

Keep campaign names <= 120 chars, ad group names <= 100 chars, and ad names <= 160 chars. Never include secrets, billing data, tokens, or personal information in platform names.

## Platform Coverage

Supported now:

- Vite + React local CMO console for platform snapshots, proposal review, account readiness, and run reports.
- Google Search SEM: create, dry-run, pause.
- Google YouTube video assets: dry-run/sync missing `YOUTUBE_VIDEO` assets into Google Ads asset library after explicit confirmation.
- Google YouTube video campaigns: create, dry-run, pause.
- Reddit Ads: account/campaign read-sync scaffold, proposal diffs, official API v3 workflow guidance.

Not implemented yet:

- Meta/Facebook Ads.
- TikTok Ads.
- LinkedIn Ads.
- X/Twitter Ads.
- Reddit live API write execution client.
