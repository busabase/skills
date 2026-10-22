# UI And Validation

Use this reference while customizing the scaffold and before completion. Target-first validation
defers browser acceptance until merged HEAD runs in Busabase; local-preview validation performs an
additional standalone pass before deployment.

Read `app-engineering.md` for module boundaries, responsive behavior, required UI states, resource-aware data access, and the full validation matrix.

## Shared Shell

Every generated app starts from the same operational shell:

- compact brand and app identity;
- human-attention summary;
- workflow navigation, with **Overview** as its first item;
- an Overview page that owns the hero and the metrics band;
- record views that are one toolbar row over a full-bleed table;
- a detail mode per Base that follows the recurring task;
- loading, empty, error, and provider-not-ready states;
- Help & Settings with sanitized provider information;
- mobile top bar, off-canvas navigation, and back-to-list behavior.

### Two Kinds Of Page

The pattern is the one Linear, Attio, Airtable and GitHub Issues share: summary on its own page,
records edge to edge everywhere else.

- **Overview** (`#/overview`, the default route). The only page with a `.page-hero` and the
  `.metrics` band. It answers "how are we doing" and links into each view. It scrolls on its own.
- **Record view** (`#/base/<key>`). One `.view-toolbar` row — the view's name, then search and
  actions — and the table directly under it. No eyebrow (the app name is in the sidebar), no
  description (it belongs on Overview or in Help), no metrics, and no panel heading that repeats the
  page title. The table is full-bleed: a hairline on top, no inset card, no shadow.

The reason is measured, not taste: a shipped app that stacked an eyebrow, a title, a description,
a metrics band and a card heading over its table started the first row at 42% of the viewport and
showed 5 rows. One toolbar row starts it under 100px and shows 18.

### Choose The Detail Mode

The mode follows the business, so declare one for **every** Base in `ui.detail_modes` —
`validate-blueprint` warns for each Base left out. The scaffold falls back to `drawer` only so an
undeclared Base still works; that fallback is not a recommendation.

| Mode | Use when | Examples |
| --- | --- | --- |
| `page` | the record is a workplace of its own: it owns related lists, long content, or people link to it and stay for minutes | campaign, customer, project |
| `drawer` | the record is a fact people scan many of, read or change one or two fields, and return to the list | account, contact, log entry |
| `split` | the view is a queue worked top to bottom, one record after the next | follow-ups due, review inbox |

- All three render the same detail markup. Drawer and split carry **Open full page**, so a record
  that turns out to need room is one click from it — never a second detail implementation.
- Every mode is addressable. A page is `#/base/<key>/<record>`; a drawer or split selection is
  `#/base/<key>?peek=<record>`. Refresh and shared links restore the same state, and Back returns to
  the same list context, including search, filters, sort, and page when used.
- The drawer leaves the list usable behind it: clicking another row switches the record, Escape
  and Close dismiss it.
- On a phone every mode is a page: the record replaces the list, with Back to list.

Record the choice in the blueprint. Do not copy the scaffold's default into every Base without
checking the user's task.

### Density

Rows are one line: 40px by default, 32px with `ui.density: "compact"`. A second line per row is
the exception — when width allows, give that information its own column instead. The first column
names the record and is wider than the rest; the header row is sticky.

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
- Metrics live on **Overview only**, never above a record table. `scripts/check.mjs` fails a
  band placed outside `#overviewPage`.
- Metrics are a **band, not a row of cards**: one line that never wraps, hairline dividers between
  cells, no per-cell border/radius/shadow, label muted at `--text-sm` and value at `--text-xl` with
  `tabular-nums`. Use `grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr)` — never
  `repeat(auto-fit, …)`. A band that cannot wrap squeezes itself when space runs out; an `auto-fit`
  row squeezes the work surface instead, by growing downward until the list falls past the fold.
- **At most three numbers**, and every one of them must be unavailable elsewhere on the screen.
  Per-base totals are already next to each nav item; the one number that demands action is already
  in the sidebar's attention block. A band that restates them is a second navigation that cannot be
  clicked. Put subsets that take a computation to know — "repos owned by no product", "merged but
  not accepted" — and move the fourth idea into a nav item or a filter.
- The record workspace is full-bleed under the toolbar; do not inset it in a card, nest cards, or
  frame list and detail as competing floating panels.
- **Nothing on screen says the same thing twice.** The view name is in the nav, so the toolbar
  names it once and the detail does not add an eyebrow repeating it; the per-view total is next to
  the nav item, so the toolbar shows a count only while a search narrows it (and on phones, where
  the nav is off-canvas).
- **Resource ids never reach the screen.** A relation field comes back as the bare id string of the
  target record, so anything that prints the raw value renders `recmtu6jct9xgoq405` where a name
  belongs. Resolve a relation to the target record's primary field; when that record is not in the
  loaded page say so ("not loaded") rather than falling back to the id. An identifier the reader can
  neither recognise nor click is worse than an admission that the value has not arrived — it looks
  like content. The same rule kills `value.id` and `JSON.stringify(value)` as the last resort of a
  display helper; the last resort is `-`.
- A row's secondary line is a **chosen** set of fields. Slicing "the 3rd through 5th declared field"
  picks up whatever the schema happens to hold there — which is how two relation columns ended up as
  the subtitle of every row in a shipped app.
- Numbers that sit in a column — counts, currency, percentages — get `tabular-nums` so rows align.
- One accent per app. A `.badge` takes its dot, its 9% background wash, and its text color from a
  single `--dot` token, so a status can never end up half-colored. Keep the wash that light.
- The Overview page uses `.page-hero`: one `--text-3xl` title, a supporting sentence, and
  `.page-actions` on the right. No other page has a hero.

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
- A summary that wraps to a second row. Six `auto-fit` metric cards become 217px of numbers at
  `1280x820` and 238px at `390x844`, and the record list starts below the fold. Nothing overflows
  horizontally, so every width-based check still passes while the app has stopped showing its
  content. Cap the count instead of letting the band grow.
- Numbers already visible elsewhere. `navCount(...)` in a metric cell is the clearest case: the
  sidebar prints that exact number one column to the left.
- Raw `rec…` / `bse…` / `nod…` ids anywhere a human reads: rows, detail fields, headings, tooltips.
  They are the most common reason a generated app looks broken on real data while looking fine on
  Demo data.
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
- no network dependency;
- **the same value shapes the live API returns.** A relation arrives as a bare id string, not as
  `{ id, name }`, and real ids look like `recmtu6jct9xgoq405`, not `"p1"`. Demo data that hands the
  app a pre-resolved object is doing the app's job for it: the resolution path never runs, the id
  path never renders, and Demo acceptance certifies a screen production will never show. Shape Demo
  records like the API, then let the app resolve them.

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
- `.metrics` uses neither `auto-fit` nor `auto-fill`, the app renders at most three metrics, and
  the band sits inside `#overviewPage`;
- required files exist.

## Validation Modes

For delegated App-in-Skill creation, default to `target-first`. Do not start a local server or report
a localhost URL unless the user explicitly asked for `pnpm dev`, local preview, or local debugging.
Standalone AirApp creation keeps `local-preview` as its default unless the user selects
target-first.

### Target First

Run the Required Checks, write the canonical source as an AirApp ChangeRequest (permission-aware:
omit `autoMerge`), and state that visual and interactive acceptance is still to come until merged HEAD
Runs in Busabase. If the server held the CR because the credential cannot merge it, wait for someone
with write access; never approve it yourself unless the user asks for that specific CR.

Once it is merged, perform every Target Verification check, including desktop and 390px phone
workflows. If acceptance finds a defect, update canonical local source and write a new AirApp
ChangeRequest the same way. Do not patch only the remote copy.

### Explicit Local Preview

Start the server, report the actual `127.0.0.1` URL, and open `?demo=1`.

Verify desktop around `1440x900`, and again at `1280x820` — the smaller one is where a summary
band starts costing the list its rows:

- on every record view: the first data row's top is **≤ 120px** from the viewport top, the
  workspace is **≥ 80%** of the viewport height, at `1280x820` at least **10** single-line rows
  are visible when the data has them, and the page itself does not scroll vertically
  (`document.documentElement.scrollHeight <= window.innerHeight`);
- on Overview: the metrics band is **one row** and no taller than 56px;
- every Base opens its record in its declared mode: `page` replaces the list, `drawer` overlays it
  and switching rows keeps it open, Escape closes it, `split` shows the queue and the record side by
  side; **Open full page** and a reloaded `?peek=` / `/record` URL land on the same record;
- navigation, metrics, filters, list, and detail work;
- no overlap or page-level overflow;
- loading/empty/error states render;
- no resource id is visible anywhere. Walk every view, open the first record in each, and assert
  that the rendered text matches no `(rec|bse|bsf|nod|cmt|crq)[a-z0-9]{10,}`. This is a sweep, not a
  spot check: the ids surface in whichever view happens to declare a relation.
- partial counts are marked and Load More fetches one page without duplicating records.

Verify phone at `390x844`:

- the navigation drawer opens/closes with scrim;
- list and detail each use the full available width, whatever the Base's detail mode;
- back returns to the same list context;
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

The human gates are about scope and acceptance, not about each write:

1. Blueprint approval authorizes the exact structure, the AirApp code and the seed records. Every
   write inside it is permission-aware: it merges when the credential can, and is held as a
   ChangeRequest when it cannot.
2. For local-preview, Demo UI acceptance comes before writing the code; for target-first, the merged
   target Run is the UI acceptance gate. Never claim UI acceptance from static checks alone.
3. A ChangeRequest the server held for review is approved only by a person with that permission, or
   by the Agent when the user asks for that specific CR. Approval of the blueprint or the UI is not
   that request.
