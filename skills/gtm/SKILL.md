---
name: gtm
description: GTM War Room orchestrator — surface health status per 4 pillars (Foundation/Content/Paid/Retention), launch the local GTM dashboard UI, propose next actions, and delegate execution to child skills (/writer, /videos, /blog). Use for daily/weekly GTM reviews, updating ICP data, proposing content calendar, or triggering downstream content creation.
disable-model-invocation: false
allowed-tools: Bash(*), Read, Edit, Write, Glob, Grep
user-invocable: true
---

# /gtm — GTM War Room Orchestrator

The single entry point for reviewing and executing the Go-to-Market strategy. GTM data lives in **`packages/gtm-data/src/`** (the gtm-data package owns it; both buda and this skill import it).

## App-in-Skill UI

The GTM War Room has a standalone local web UI that runs independently of `apps/buda`.
Follow the App-in-Skill Creator contract as the baseline. New App-in-Skills should
default to the zero-build vanilla app shell; this GTM UI is a documented **complex
SPA exception** because it mirrors a large route tree, imports shared kapps GTM data
and UI primitives, and includes dense tables, markdown views, diagrams, galleries,
and deep-linked detail pages. Keep the Vite + React stack scoped to this skill unless
a future skill has comparable complexity and documents the exception.

### Launch the UI

```bash
.claude/skills/gtm/app/start.sh
# Opens the first available localhost port in 3000-4000
```

Or manually:
```bash
cd .claude/skills/gtm/app
pnpm dev
```

### Structure

```
.claude/skills/gtm/
├── SKILL.md           — this file (orchestrator logic)
├── app/               — standalone Vite + React app (the UI)
│   ├── package.json   — workspace:* deps (kui, share-domains, wouter)
│   ├── vite.config.ts — Vite config with path aliases
│   ├── src/
│   │   ├── App.tsx    — root: GtmDataProvider + GtmLocaleProvider + Router
│   │   ├── routes.tsx — all 38 routes (React.lazy, mirrors share-domains/gtm/routes.tsx)
│   │   └── layout.tsx — KUI Sidebar layout with nav + locale switcher
│   └── start.sh       — launch script
└── agents/
    └── openai.yaml
```

### Data ownership

GTM data lives at `packages/gtm-data/src/` — the gtm-data package is the source of truth. Buda reads it via a tsconfig path alias (`~/domains/gtm/data` → `packages/gtm-data/src/`) for landing pages and commerce logic. All `/gtm update-*` mutations target files in `packages/gtm-data/src/`.

### When to launch the UI

By default `/gtm` operates in chat mode (reports, plans, delegations). Launch the UI when the user says:
- "open GTM dashboard", "打开 GTM", "launch UI", "show me the war room"
- Or when reviewing/editing ICP detail requires the visual tab layout

Invocation in SKILL.md workflow: call `start.sh` and tell the user to check the localhost URL printed by the script.

## Purpose

`/gtm` is the **meta-skill** that:
1. Reads the current GTM state (ICPs, SKUs, campaigns, calendar, etc.)
2. Reports 4-pillar health per ICP (Foundation / Content / Paid / Retention)
3. Decides the next action (update data, or trigger a child skill)
4. Delegates execution to child skills: `/seo`, `/ads`, `/writer`, `/videos`, `/blog`, `/cdn-upload`, etc.

Think of `/gtm` as the CEO agent. It owns prioritization and the database. Execution skills read this database and perform channel-specific work.

## Execution Skill Contract

`/gtm` is the source-of-truth layer. Execution skills must not maintain their own app-specific ICP, keyword, campaign, or content strategy.

- `/seo` reads `/kit/gtm` data for ICP positioning, SEO fields, competitors, landing copy, content calendar, and stream priorities, then produces audits, keyword clusters, page briefs, internal-link plans, and search reports.
- `/ads` reads `/kit/gtm` data for ICP, campaign, SKU, SEM keywords, negatives, ad copy, landing pages, budgets, and experiments.
- `/writer`, `/blog`, and `/videos` read `/kit/gtm` ICP messaging and content calendar before producing channel assets.

When strategy changes, update `packages/gtm-data/src/**` or `apps/buda/content/gtm/**`. Do not bury strategic facts inside child skills.

---

## Key Locations (2026-05-09 update)

### Data & Domain
- **Data source**: `packages/gtm-data/src/index.ts` (single source of truth for all GTM config)
- **Pillar scoring**: `packages/share-domains/gtm/pillar-scoring.ts`
- **UI components**: `packages/share-domains/gtm/components/gtm-*.tsx`
- **SPA config**: `packages/share-domains/gtm/nav.ts` + `packages/share-domains/gtm/routes.tsx`

### UI Routes
- **Entry**: `/kit/gtm` (requires systemAdmin auth)
- **ICPs dashboard**: `/kit/gtm/icps` — 4-pillar health table
- **ICP detail**: `/kit/gtm/icps/:id` — 6-tab view (Overview / Messaging / SEO / Landing / Paid / Sales & Ops)
- Other views: `/skus`, `/channels`, `/accounts`, `/campaigns`, `/distribute`, `/calendar`, `/experiments`, `/pipeline`, `/budget`, `/goals`, `/streams`

### Supporting Docs
- **Spec**: `apps/buda/content/spec/gtm-workflow.md` — full GTM workflow (3 Buda Agents: Strategist/Content/Distribution)
- **Playbooks**: `apps/buda/content/gtm/*.md` — Google Ads, Influencer, PH Launch, Content-CN playbooks

---

## 4-Pillar Framework (current GTM methodology)

Every ICP is scored against 4 pillars (Foundation weighted 40%, others 20% each):

1. **🏗️ Foundation** — Essential assets (must be ~100%)
   - Main intro video, Landing page, Landing copy, Sales pitch, Value prop, Tagline, Key messages, Objections, Competitors defined, Compare pages
2. **📝 Content** — Inbound engine
   - Published content (≥3), Blog posts (≥2), Channel strategy (≥2), Active social accounts (≥1), Templates/Skills
3. **📢 Paid** — Outbound acquisition
   - Ad creative, Google Search Ads, YouTube Ads, Social Ads, ≥1 running campaign
4. **💬 Retention** — Nurture & loyalty
   - Email sequence, Community channels, Customer support active, Retro entries, Upsell path

---

## ICP Messaging Structure (expanded 2026-05-09)

Each ICP has rich messaging data following industry best practices:

- **Category** — Market category we're in (e.g. "AI-native Workspace")
- **Category Positioning** — creator / challenger / alternative
- **Positioning Statement** — Moore's 6-line format (For / Who / Our [product] is a [category] / That / Unlike / Our product)
- **Value Proposition** — Core promise
- **Tagline** — Memorable one-liner
- **Key Messages** — 3-6 supporting pillars
- **Differentiators** — Unique attributes + value themes + vs which alternative
- **Proof Points** — Claims backed by evidence (stats/cases/customer voice)
- **Before / After** — Pain narrative vs dream state
- **Objection Handling** — Common pushback + rebuttal
- **Voice & Tone** — Traits / Do / Don't guidance
- **Competitors** — Direct/indirect/status-quo + compare page status
- **SEO** — Keywords / SERP previews / titles / meta descriptions / narrative angles / competitor search terms
- **SEM** — Keyword bids / negative keywords / Ad copy (RSA headlines + descriptions + CTAs) / YouTube ad scenarios
- **Landing Copy** — Hero / Problem / Messaging blocks / Features / Use Cases / Social Proof / FAQs / Final CTA
- **Persona Card** — Representative customer profile (name, age, job, quote, daily life, goals, frustrations, tech stack, media diet, buying triggers)

---

## Arguments

- `action` (optional): What to do — defaults to `review`
  - `review` — Read state, summarize pillar health per ICP, surface what's off-track
  - `plan` — Propose next week's content calendar + actions
  - `update-icp` — Update a specific ICP's data (messaging, assets, etc.)
  - `update-goals` — Interactively update goal `current` values
  - `update-streams` — Update operational stream health/completion
  - `log-retro` — Add an entry to an ICP's retrospective
  - `execute` — Pick next calendar item and delegate to child skill
- `icp` (optional): Focus on a specific ICP ID
- `stream` (optional): Focus on specific operational stream

---

## Workflow

### Action: `review` (default)

1. Read `apps/buda/src/domains/gtm/data.ts`
2. Compute 4-pillar score per ICP (using logic in `pillar-scoring.ts`)
3. Check operational streams health
4. Surface:
   - 🔴 Pillars <40% per ICP (critical)
   - 🟡 Pillars 40-80% (behind)
   - Content calendar items due this week
   - Experiments running
   - Pipeline deals in active stages
5. Recommend next action (e.g. "General AI Enthusiast's Retention is 20% — add email sequence")

### Action: `plan`

1. Identify lowest-scoring pillar per ICP
2. Generate 5-10 content calendar items for next week targeting those gaps
3. Propose 1-3 experiments
4. Open PR with updated `data.ts`

### Action: `execute`

1. Find next `contentCalendar` item with `status: draft` and `date <= today+3`
2. Based on `platform`, delegate to child skill:
   - Blog / 公众号 → `/blog`
   - XHS / Twitter / LinkedIn → `/writer`
   - Video / YouTube / 视频号 → `/videos`
3. Pass ICP context: targetIcpId → load persona, messaging, voice&tone from data.ts
4. Child skill reads messaging context to stay on-brand
5. After success, update calendar item status

---

## Critical Rules

- `data.ts` is **the strategic source of truth** — only edit via PR, never directly
- UI is **read-only** — all mutations go through Git
- Pillar scoring is **heuristic**, not gospel — use as directional guide
- `/gtm` never produces final content; always delegates to specialist skills
- When modifying `data.ts`, respect the 4-pillar framework (new fields should map to a pillar)

---

## Example Invocations

**Morning CEO review**:
```
/gtm
```

**Weekly planning (Sunday)**:
```
/gtm plan
```

**Deep-dive one ICP**:
```
/gtm review icp=general-ai-enthusiast
```

**Trigger content creation**:
```
/gtm execute
```

---

## Change Log

- **2026-05-09**: Major refactor — moved to `/kit/gtm` standalone route, extracted to `domains/gtm` DDD module, 4-pillar framework, expanded messaging (Moore positioning, differentiators, proof points, before/after, voice & tone), persona cards, SERP previews, SEM with ad scenarios, full landing copy breakdown, compare pages per competitor, 6-tab ICP detail with anchor→tab auto-switch
- **2026-05-08**: Initial skill created + Spec written (`content/spec/gtm-workflow.md`) defining 3-Agent architecture
