# UI And Validation

Use this reference while customizing the scaffold and before completion. Target-first validation
defers browser acceptance until merged HEAD runs in Busabase; local-preview validation performs an
additional standalone pass before deployment.

Read `app-engineering.md` for module boundaries, responsive behavior, required UI states, resource-aware data access, and the full validation matrix.

## Shared Shell

Every generated app starts from the same operational shell:

- compact brand and app identity;
- human-attention summary;
- workflow navigation;
- overview metrics;
- list/detail workspace;
- loading, empty, error, and provider-not-ready states;
- Help & Settings with sanitized provider information;
- mobile top bar, off-canvas navigation, and back-to-list behavior.

Customize information architecture, labels, metrics, filters, fields, badges, and details to the domain. Do not ship generic `Items`, `Status`, or placeholder copy when the blueprint supplies real concepts.

## Visual Direction

- Build the actual tool, never a landing page.
- Use neutral surfaces, soft borders, sparse shadows, 6–8px radii, and one restrained accent.
- Do not use decorative gradients, hero sections, nested cards, oversized headings, or marketing copy.
- Ask for brand constraints. If none exist, infer a quiet work-oriented palette from the domain.
- Use familiar icons for controls and tooltips for unfamiliar icons.
- Keep text inside controls at desktop and phone widths.

## Demo Provider

Demo mode must be deterministic:

```text
?demo=1
```

It should include:

- three to five realistic records;
- every important status/filter;
- one human-attention case;
- list and detail content;
- no private or random data;
- no network dependency.

Production provider failure must never fall back to Demo silently.

## Required Checks

Run generated project checks:

```bash
pnpm check
node --check server.js
```

Static checks must verify:

- exact `busabase-sdk` version, no range;
- `createBusabaseClient` present and targeting `window.location.origin`;
- same-origin `/api/v1` client path for Cloud and Desktop, with no obsolete bridge prefix;
- no API key, Bearer header, React, Vite, or mutation bypass;
- declared Bases and procedures match blueprint;
- onboarding is a positive-version contract whose fields and completion marker use declared Busabase resources, or is explicitly empty with rationale;
- exact materialized Folder/Node/Base/View/resource ids exist in generated config;
- only non-secret Vault requirements exist in config; no value or browser secret API exists;
- every Base config has an integer `readLimit` from 1–50 matching blueprint `read_limit` (default 50), providers consume it, and interactive reads contain no automatic cursor-exhaustion or per-record request loop;
- Demo records exist;
- required files exist.

## Validation Modes

For delegated App-in-Skill creation, default to `target-first`. Do not start a local server or report
a localhost URL unless the user explicitly asked for `pnpm dev`, local preview, or local debugging.
Standalone AirApp creation keeps `local-preview` as its default unless the user selects
target-first.

### Target First

Run the Required Checks, submit the canonical source as a pending AirApp CR, and state that visual
and interactive acceptance is deferred until merged HEAD can Run in Busabase. The blueprint approval
and selected target-first path authorize creating the reviewable CR, never reviewing or merging it.

After explicit merge authority, perform every Target Verification check, including desktop and
390px phone workflows. If acceptance finds a defect, update canonical local source and submit a new
reviewable AirApp CR. Do not patch only the remote copy.

### Explicit Local Preview

Start the server, report the actual `127.0.0.1` URL, and open `?demo=1`.

Verify desktop around `1440x900`:

- meaningful first viewport;
- navigation, metrics, filters, list, and detail work;
- no overlap or page-level overflow;
- loading/empty/error states render.
- partial counts are marked and Load More fetches one page without duplicating records.

Verify phone at `390x844`:

- drawer opens/closes with scrim;
- list and detail use separate panes;
- back returns to list;
- sticky controls do not cover content;
- modal fits;
- `document.documentElement.scrollWidth <= window.innerWidth`.

Tell the user explicitly: local Demo validates the generated UI and server only. It does not validate the target Busabase session bridge.

## Target Verification

After the AirApp CR is merged, Run it inside the selected Busabase deployment and verify:

- dependency install and server ready logs;
- provider reports `busabase_sdk_openapi`;
- deployment path is `cloud` or `desktop` as approved;
- configured Bases resolve;
- cold load and every subsequent search/filter/refresh/navigation action make only their expected bounded requests and never continue paging in the background;
- canonical seed data renders;
- no browser console or HTTP errors;
- provider failure is diagnostic, not reported as missing data;
- desktop and phone framing remain usable.

## Acceptance Gates

For local-preview there are three separate gates:

1. Blueprint approval authorizes exact structure autoMerge.
2. Demo UI acceptance authorizes submitting code for review, not merging it.
3. Named CR authorization allows the Agent to review/merge only that CR.

For target-first, blueprint approval plus the selected AirApp-first delivery path authorizes
submitting the pending code CR. Named CR authorization permits its merge, and the merged target Run
is the UI acceptance gate. Never treat CR submission as merge authority or claim UI acceptance from
static checks alone.
