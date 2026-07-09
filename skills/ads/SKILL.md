---
name: ads
description: Google Ads automation for Buda. SEM search campaigns driven by GTM ICP data (apps/buda/src/domains/gtm/data/icps/*.ts) and YouTube video campaigns driven by video MDX frontmatter. Use when creating, pausing, or managing Google Ads for Buda.
allowed-tools: Bash(node:*), Bash(pnpm:*), Bash(npx:*)
user-invocable: true
---

# Ads

Google Ads automation split into two lines, both backed by a single OAuth + customer.

| Line   | Config source                                                    | Create                           | Pause                          |
|--------|------------------------------------------------------------------|----------------------------------|--------------------------------|
| SEM    | `apps/buda/src/domains/gtm/data/icps/<icp-id>.ts` — `sem` block | `scripts/create-sem-campaign.mjs`   | `scripts/pause-sem-campaign.mjs`   |
| Video  | `apps/buda/content/videos/<lang>/*.mdx` — `ads:` frontmatter    | `scripts/create-video-campaign.mjs` | `scripts/pause-video-campaign.mjs` |

Full auth / API setup: [GOOGLE-ADS.md](./GOOGLE-ADS.md).

---

## SEM (Google Search) — driven by ICP data

Each GTM ICP already exports a full `sem` block: keywords + match types + max CPC, negative keywords, and RSA headlines / descriptions / CTAs. Reference: `apps/buda/src/domains/gtm/data/icps/seo-marketer.ts`.

```bash
# List available ICPs
node .agents/skills/ads/scripts/create-sem-campaign.mjs

# Dry run (prints plan, no API calls)
node .agents/skills/ads/scripts/create-sem-campaign.mjs --icp seo-marketer --dry-run

# Create (default PAUSED status — review & enable in UI)
node .agents/skills/ads/scripts/create-sem-campaign.mjs --icp seo-marketer

# Override defaults
node .agents/skills/ads/scripts/create-sem-campaign.mjs \
  --icp seo-marketer \
  --daily-budget 20 \
  --regions US,TW,HK \
  --language en \
  --landing-page https://buda.app/seo

# Re-create
node .agents/skills/ads/scripts/create-sem-campaign.mjs --icp seo-marketer --force

# Pause
node .agents/skills/ads/scripts/pause-sem-campaign.mjs --icp seo-marketer
node .agents/skills/ads/scripts/pause-sem-campaign.mjs --campaign-id 12345678
```

**Defaults**: `--daily-budget 10`, `--regions US,TW,HK,SG`, `--language en`.

**Landing page resolution** (first match wins):
1. `icp.landingCopy.hero.primaryCta.href` (absolute URL)
2. First absolute `icp.funnels[].url`
3. `--landing-page` CLI override

**State**: `.agents/skills/ads/state/sem-state.json` tracks `{ campaignId, adGroupId, adId, budget, createdAt }` per ICP. Re-runs skip unless `--force`.

**Why PAUSED by default**: Search ads spend fast. Always review keywords + final RSA preview in Google Ads UI before enabling.

---

## Video (YouTube TrueView) — driven by video MDX

See `apps/buda/content/videos/<lang>/<slug>.mdx` frontmatter:

```yaml
ads:
  enabled: true
  dailyBudget: 5          # USD, min $1
  targetCPV: 0.02         # USD per view, min $0.01
  regions: [TW, HK, SG]
  language: zh-CN
  landingPage: https://buda.ai
  campaignId: ""          # auto-filled after creation
  adGroupId: ""           # auto-filled
  adId: ""                # auto-filled
```

```bash
# Single video (reads ads config from MDX frontmatter)
node .agents/skills/ads/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx

# Dry run
node .agents/skills/ads/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --dry-run

# Force re-create
node .agents/skills/ads/scripts/create-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx \
  --force

# Pause by MDX (reads campaignId from frontmatter)
node .agents/skills/ads/scripts/pause-video-campaign.mjs \
  --mdx apps/buda/content/videos/zh-CN/buda-intro-general.mdx

# Pause by ID
node .agents/skills/ads/scripts/pause-video-campaign.mjs --campaign-id 12345678
```

**Integration with publish-video**: `publish-video`'s `publish-changed.mjs --yes --youtube --ads` calls `create-video-campaign.mjs` for each changed MDX with `ads.enabled: true`.

### Ad format cheatsheet (creative / strategy)

`create-video-campaign.mjs` provisions TrueView. Use this to pick the right format for the goal before producing the creative:

| Format | Length | Skippable | Best for |
|--------|--------|-----------|----------|
| **TrueView Skippable** | 12 sec+ | After 5 sec | Reach; large audiences |
| **TrueView Non-skippable** | 15–20 sec | No | Full message; guaranteed view |
| **TrueView for Action** | — | — | Conversions; CTA-focused |
| **Bumper** | ≤6 sec | No | Brand awareness; memorable; lower cost |
| **Discovery (In-Feed)** | Thumbnail + text | — | Search / related / homepage; interest targeting |

| Goal | Format |
|------|--------|
| Brand awareness | Bumper |
| Website traffic | TrueView |
| Conversions | TrueView for Action |
| Interested audiences | Discovery |

**Creative**: Bumper — full brand message in 6 sec. TrueView — hook in the first 5 sec, deliver value before the skip. Discovery — thumbnail + headline that reads like organic video.

---

## Requirements

```bash
# Env vars (add to ~/.zshrc)
export GOOGLE_ADS_DEVELOPER_TOKEN="your_developer_token"
export GOOGLE_ADS_CUSTOMER_ID="xxx-xxx-xxxx"

# Credentials file
~/.config/google-ads/client_secret.json   # company OAuth credentials

# Dependencies (already likely installed for publish-video)
pnpm add -w googleapis google-ads-api
```

First-time OAuth happens interactively on first non-`--dry-run` invocation. Token is cached at `~/.config/google-ads/token.json`.

See [GOOGLE-ADS.md](./GOOGLE-ADS.md) for the full auth walkthrough and campaign field reference.

---

## File structure

```
.agents/skills/ads/
├── SKILL.md                           # this file
├── GOOGLE-ADS.md                      # deep dive: auth, config, FAQ
├── scripts/
│   ├── lib/
│   │   ├── google-ads-client.mjs     # OAuth + Customer + GEO / LANG constants
│   │   └── icp-loader.mjs            # load ICPs from apps/buda via tsx
│   ├── create-sem-campaign.mjs
│   ├── pause-sem-campaign.mjs
│   ├── create-video-campaign.mjs
│   └── pause-video-campaign.mjs
└── state/
    └── sem-state.json                 # per-ICP SEM campaign state (auto-created)
```

---

## Known limitations / TODO

- `create-video-campaign.mjs` uses a placeholder YouTube video asset resource name. Before real use, add an `assets.create` step that creates a `YouTubeVideoAsset` and returns the real `customers/{id}/assets/{id}` resource (see TODO in the script).
- SEM: one Ad Group per ICP only. Future: split by `matchType` or keyword theme tag in `notes`.
- SEM: Manual CPC only. Future: Target CPA / Maximize Conversions after conversion data is flowing.
- No update script — `--force` delete-and-recreates. Future: `update-sem-campaign.mjs` / `update-video-campaign.mjs` for in-place bid/budget changes.
- Weekly report integration (`publish-video/scripts/weekly-report.mjs`) not yet updated to pull SEM metrics.
