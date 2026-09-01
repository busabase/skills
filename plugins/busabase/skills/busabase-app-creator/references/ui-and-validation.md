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

`assets/airapp-template/app/styles.css` is the baseline, not a suggestion. It ships the token set,
the shell, and a component vocabulary (`.card`, `.button`, `.badge`, `.avatar`, `.toolbar`,
`.segmented`, `.table`, `.metric-delta`). Reuse those classes. A generated app that invents its own
pill, avatar, or table styling is how a set of sibling apps stops looking like one product.

### Tokens

Retheme by editing the `:root` block. Never write a raw color, font size, or radius into a rule.

- Color: `--canvas` (page) / `--surface` (cards) / `--surface-soft` / `--ink` / `--ink-soft` /
  `--muted` / `--line` / `--line-strong`, plus `--positive` / `--warning` / `--danger`.
- Accent: one hue via `--accent`, `--accent-strong`, `--accent-soft`, `--accent-line`. The accent
  belongs to selection, active nav, focus rings, links, and the primary button — nothing else.
- Type: `--text-xs` 11 · `--text-sm` 12 · `--text-base` 13 · `--text-md` 14 · `--text-lg` 16 ·
  `--text-xl` 20 · `--text-2xl` 30 · `--text-3xl` 38. Do not introduce a size between two steps.
  Measured across the 53 existing kelly-skills apps, 67% of every `font-size` declaration is
  8–12.5px and only 13 declarations in the whole set are 28px or larger. That is the concrete
  reason those apps read as cramped rather than composed: there is no large step anywhere, so
  nothing anchors a page. Spend `--text-2xl` on metric values and `--text-3xl` on exactly one
  greeting or page title.
- Radius: `--radius-sm` 8 (controls) · `--radius-md` 10 · `--radius-lg` 14 (cards).
- Shadow: `--shadow-card` for cards, `--shadow-modal` for dialogs. There is no third shadow.
- Translucent surfaces: `--surface-blur` (sticky headers) and `--scrim` (modal/drawer dimming).
- Motion: `--ease`, one duration for every hover/selection change.

Keep the CJK faces in the font stack. These apps ship localized copy, and a stack without
`PingFang SC` / `Noto Sans SC` renders Chinese in a serif fallback.

### Dark Mode

Dark is a `@media (prefers-color-scheme: dark)` block that overrides **tokens only** — not one rule
below it is duplicated. `<meta name="color-scheme" content="light dark">` must stay in the HTML so
native controls and scrollbars follow.

That only works if no rule contains a raw color. It is worth being strict about, because the
failure is silent: a hardcoded `rgba(255, 255, 255, 0.94)` on the sticky list header sat *after* the
dark block in source order, won the cascade at equal specificity, and left a white bar with
invisible text in dark mode. Nothing errors — you only see it in a screenshot. Every translucent
surface goes through `--surface-blur` / `--scrim` for exactly this reason.

Dark also flips two knobs rather than restating rules: `--badge-wash` rises (a 9% wash is invisible
on a dark surface) and `--badge-ink` falls (76% toward a dark `--ink` would be unreadable). The
accent lifts too — the light accent is too dark to sit on a dark surface.

### Polish

Cheap in code, and their absence is what makes a tool look unfinished:

- **Motion.** Hover/selection changes transition on `--ease`. Interactions that snap read as
  unfinished; anything slower reads as laggy in a dense tool. All motion collapses under
  `prefers-reduced-motion`.
- **Scrollbars.** Thin, transparent-tracked, `--line-strong` thumb. The default chrome scrollbar is
  wide, opaque and light-only; in a two-pane layout it reads as a seam.
- **Focus.** A 2px accent outline plus a soft `box-shadow` halo, not one flat outline. `box-shadow`
  so nothing shifts on focus.
- **`::selection` and `caret-color`** read from the accent.
- **Icons** are monochrome 16px strokes inheriting `currentColor` via the `.nav-item svg` /
  `.button svg` / `.metric-icon` rules. A multi-colored icon set is the fastest way to make a calm
  tool look like a toy.
- **`.empty-state`** — icon, what is missing, and the one action that fixes it. An empty screen with
  no next step is where these tools most often strand a user.
- **`.skeleton`** — for a known-shape load so the layout does not jump. Not for an unknown-length
  wait; that is what the loading message is for.

### Composition

- Page sits on `--canvas`; content sits in white cards with a hairline border and `--shadow-card`.
- Metrics are cards in an `auto-fit` row: label at `--text-base` muted, value at `--text-2xl` with
  `tabular-nums`, optional `.metric-delta` beneath.
- The list/detail workspace is one card, not two floating panels.
- Numbers that sit in a column — counts, currency, percentages — get `tabular-nums` so rows align.
- One accent per app. A `.badge` takes its dot, its 9% background wash, and its text color from a
  single `--dot` token, so a status can never end up half-colored. Keep the wash that light.
- A greeting/overview page uses `.page-hero`: muted context line, one `--text-3xl` title,
  a supporting sentence, and `.page-actions` on the right.

### Do Not

Each of these is a specific, recurring way a generated app reads as busy rather than calm:

- Multi-colored pastel icon tiles on metric cards. Four tints across four cards is decoration that
  competes with the numbers, which are the only thing on that card worth reading.
- Per-row generated avatar colors. `.avatar` is monochrome on purpose: a random hue per row fights
  every real status color sitting in the same row.
- Saturated pill backgrounds for status. `.badge` already tints at 9%; pushing it further turns
  twenty rows into a bag of highlighters. Do not hand-write a status pill with a solid fill.
- A horizontal scrollbar inside a toolbar or filter strip. `.toolbar` wraps instead — a nested
  scrollbar is the most common way these layouts start looking broken at narrow widths.
- Decorative gradients, hero sections, nested cards, oversized headings, marketing copy, mock
  skeleton graphics presented as content, and hover states that promote every control to primary.

### Other

- Build the actual tool, never a landing page.
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

Verify both color schemes at desktop width (Playwright `colorScheme: 'dark'`, or the OS setting):

- no element keeps a light background in dark — check the sticky list header and modal header
  specifically, since those are the translucent ones;
- badge text stays readable against its wash in both schemes;
- the accent is legible on both the light and the dark surface.

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
