# App Engineering

Use these standards after the product blueprint is approved. They are the technical source of truth for Busabase AirApps, including apps requested through higher-level workflow skills.

## Runtime And Module Boundaries

- Use Hono as the small server and vanilla HTML/CSS/JavaScript in the browser.
- Bundle the exact installed `busabase-sdk` into the reviewed source during scaffolding. Production `start` only starts the server.
- Keep the HTML shell small. Split browser code once a file becomes difficult to review, usually around 300 to 500 lines.
- Recommended modules are `state`, `provider`, `router`, `render`, `screens`, `components`, and `messages`/`i18n`. A small app may combine adjacent responsibilities.
- Keep Demo and Busabase providers behind the same read/action contract. Demo is deterministic; Live never silently falls back to Demo.
- Centralize deployment ids, procedure allowlists, limits, and non-secret requirements in generated config.

## Data Access

- Each screen declares its data sources, server filters/sorts, initial limit, and continuation behavior.
- Declare each Base's `read_limit` in the blueprint (default 50, allowed 1–50) and consume the emitted `readLimit` for every page. Keep pending ChangeRequests at 20 or fewer. Use smaller Base limits for compact widgets.
- Run independent bounded reads in parallel. Preserve cursors and fetch one next page per explicit user action.
- Search uses a server query when available; otherwise label it as filtering loaded rows.
- Detail opening fetches one known record or bounded related collection. It never triggers a workspace scan.
- Docs use line/range reads when the whole document is not required. Drives list a bounded directory and read a named file only on demand.
- Assets load only at display-appropriate sizes and never block the whole application shell.

## Information Architecture

- The first screen answers: what changed, what needs attention, and what can the user do now?
- Prefer native Busabase Views for routine record work. The AirApp should synthesize multiple resources or simplify a focused decision.
- Keep global navigation stable across desktop and mobile. Show no more top-level screens than the recurring workflow needs.
- Use a quiet operational shell, dense enough to scan, with restrained borders and no nested cards.
- Put durable guidance behind a clearly named Help or Guide action; page guidance should explain the current operation in plain language, not describe the UI design.

## Interaction Controls

- Use icons for familiar tool commands, tabs for views, menus for option sets, toggles for binary settings, and native inputs for dates/numbers.
- Every destructive, publishing, or external-side-effect action states what happens and has an approval or opt-out path appropriate to the workflow.
- ChangeRequest actions show pending state, result, and recovery. Prevent duplicate submission while a request is in flight.
- Use stable dimensions for toolbars, counters, tiles, tables, and boards so loading and dynamic content do not shift the layout.
- Modals trap focus, close predictably, fit at 390px, and never hide the only recovery action.

## Required User-Visible States

Every resource-dependent screen implements:

- loading with the specific operation, not a generic endless spinner;
- empty with the next useful action;
- partial when one source failed or the page is truncated;
- stale when data is older than the product's freshness expectation;
- error with a retry or setup route;
- setup when a declared integration/Vault requirement is missing;
- permission denied without leaking resource existence or secret metadata;
- success confirmation for proposed work and external results.

Loading copy must not imply a full workspace scan. If a bounded page is being read, say which resource or operation is loading.

## Responsive And Accessible UI

- Verify desktop and a 390px mobile viewport. No horizontal page overflow, clipped controls, overlapping text, or off-screen dialogs.
- Desktop tables may become compact lists on mobile; preserve status, owner, date, and primary action.
- Maintain visible focus, semantic headings, form labels, keyboard navigation, and sufficient contrast.
- Text wraps within controls and panels. Do not scale font size from viewport width or use negative letter spacing.
- Respect reduced motion and avoid decorative animation in operational tools.

## Validation Matrix

Before completion, verify:

1. `validate-blueprint` passes and all resource ids are materialized.
2. Generated checks pass and no credential/token/Vault value exists in source or bundle.
3. Demo renders realistic data, empty, partial, stale, error, setup, and permission states.
4. Every screen stays within its declared data budget and exposes continuation where applicable.
5. Independent reads are parallel and late responses cannot overwrite newer navigation/search state.
6. Desktop and 390px mobile layouts work with long names and localized copy.
7. Keyboard focus, dialogs, forms, retries, and duplicate-submit protection work.
8. Live authenticated session uses only declared procedures and exact resource ids.
9. Public embed, when enabled, remains read-only and cannot access Vault or ChangeRequest actions.
10. Trusted integrations are exercised only after their own approval and readiness checks.

In target-first mode, items 1–2 and every source-inspectable budget/security invariant pass before
the AirApp CR; browser-only items 3–10 are completed against merged HEAD in Busabase. In an
explicit local-preview mode, local Demo can prove the standalone interface before submission and
real data is reachable through the local proxy, but local authentication still cannot prove the
deployed ambient session or embed path. Both modes require target Run before completion.
