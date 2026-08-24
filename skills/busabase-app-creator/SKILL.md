---
name: busabase-app-creator
description: Create a complete isolated Busabase workspace app or continuously evolve an existing AirApp through a review-first workflow. Use for new Cloud/Desktop workspace apps and for auditing, upgrading, extending, or migrating an identified AirApp, including approved changes to its UI, files, Folder, Bases, Views, data, and related native resources while preserving everything outside the requested scope.
---

# Busabase App Creator

Create one isolated Busabase workspace and AirApp, or maintain one explicitly identified existing AirApp. This skill is the single technical source of truth for AirApp modeling, security, runtime engineering, deployment, and maintenance; higher-level workflow skills delegate those concerns here.

## Non-Negotiable Contract

- Use `$busabase` for connection, API, ChangeRequest, and approval behavior. Read its `SKILL.md` before any remote operation.
- Select exactly one mode at the start: `create` or `maintain`. In `create`, create a new Folder, at least one new workflow Base, required native resources, and a new AirApp; never attach to or modify an existing business Base. In `maintain`, follow `references/maintenance.md`; the app may continuously create or change related workspace resources when those changes are included in the approved maintenance scope.
- Ask exactly one decision question per message. Present two or three concrete options labeled `A`, `B`, and optionally `C`; mark one as recommended when appropriate, then invite the user to reply with a letter or type a custom answer. Never ask a bare open-ended interview question.
- Ask the user to choose Busabase Cloud or Desktop before connecting.
- Establish source ownership before scaffolding. For a standalone AirApp, ask whether source should
  use a temporary directory or a user-specified persistent directory. When a higher-level App-in-Skill
  creator delegates here, do not ask again: use that skill's `<skill-root>/app/` as the complete,
  persistent AirApp project root. It contains `package.json`, `server.js`, the browser `app/` subtree,
  checks, blueprint, and lockfile; it remains runnable with `pnpm dev`, but delegated creation does
  not start local development unless the user explicitly requests local preview or debugging.
- Treat the persistent local project as canonical. Submit the same reviewed project file tree to
  AirApp, excluding local-only files such as `.env`, `node_modules`, and logs. Do not maintain a
  second AirApp implementation, and never leave a remote-only edit: read it back, back-port it to the
  canonical local project, and re-run checks before continuing.
- Use Hono plus vanilla HTML/CSS/JavaScript. Do not introduce React, Vite, JSX, or an application-framework build pipeline. Bundle the installed SDK locally during scaffolding; deployed `start` must only run the server.
- Resolve the latest published `busabase-sdk`, verify that it exports `createBusabaseClient`, the
  local AirApp OAuth helpers, and the Node credential-store entry, then pin the exact version in the
  generated app.
- Use `createBusabaseClient` against `window.location.origin` in browser code. Never hard-code an
  absolute Busabase URL, never use the obsolete `/__busabase_api__/` bridge prefix, and never put an
  API key, Bearer token, OAuth token, session cookie, or secret in browser code
  or AirApp files. Only loopback local development uses the Hono OAuth boundary defined in
  `references/runtime-and-sdk.md`. A deployed AirApp must skip the OAuth gate and use the viewer's
  same-origin ambient session; environment credentials remain an explicit automation/testing
  override, not the user onboarding path.
- In `create`, keep the first version read-only unless the user explicitly requests a small action. In either mode, any requested write must create a ChangeRequest; never mutate or merge canonical records from the AirApp.
- In `create`, access only resources created during this run. In `maintain`, use exact existing resource ids and explicitly materialize ids for newly approved resources; never discover or repurpose unrelated resources by a matching name or slug. Model new concerns with native Busabase resources.
- Declare third-party integrations and Vault requirements in the blueprint without values. Browser AirApps cannot read Vault. Secret-consuming work must run through a trusted Busabase Workflow or explicitly configured Agent path.
- Load persistent application configuration and workflow/domain state from Busabase through
  `busabase-sdk`, choosing native nodes by capability: Folder/Node for hierarchy and identity, Base
  and View for structured operational state, Doc for durable narrative configuration, Drive/File for
  assets, and Vault references for secrets. Generated local config may contain exact materialized ids,
  procedure allowlists, limits, schema versions, and non-secret readiness metadata only. Do not use
  local JSON, SQLite, browser storage, or a demo provider as a second persistent source of truth.
- In `create`, after structure creation, write every materialized Folder, Node, Base, View, and resource id back into the blueprint. Generated runtime code in either mode must use exact ids instead of listing the workspace and rediscovering resources by slug.
- Give every data-reading workflow an explicit budget. Default interactive pages to at most 50 records per Base and 20 relevant pending ChangeRequests, use server-side filters/sorts, run independent reads in parallel, preserve `nextCursor`, and fetch only one page per user action. Never hide a full scan behind loading, search, filtering, refresh, navigation, or detail opening; full exports and offline analysis require a separate, explicit batched workflow.
- Generate the UI in the user's conversation language. Keep messages centralized so a later iteration can add locales.
- In `create`, generate three to five realistic seed records by default and submit them as ChangeRequests; do not auto-merge records.
- In delegated App-in-Skill `create` mode, use `target-first` validation by default: run deterministic
  static/project checks, submit the reviewed canonical tree as an AirApp CR, and obtain UI acceptance
  from merged HEAD inside the target Busabase. Use `local-preview` only when the delegating skill or
  user explicitly requests `pnpm dev`, a local URL, preview, or debugging. Standalone AirApp creation
  retains local-preview acceptance unless the user explicitly selects target-first. In `maintain`,
  apply the validation and acceptance gates in `references/maintenance.md`.
- In `create`, allow `autoMerge` only for the exact Folder/Base/field/relation structure the user approved in the current conversation. In `maintain`, submit every approved file, structure, content, or data change with `autoMerge: false` so each iteration remains reviewable.
- Submit AirApp code and create-mode seed data as reviewable ChangeRequests. Review or merge a CR only after the user explicitly authorizes that specific CR in chat.

## Read References Deliberately

Read each selected reference completely before acting:

| Need | Reference |
| --- | --- |
| Interview order, stopping rule, blueprint shape | `references/interview-and-blueprint.md` |
| Resource placement, native Views, Vault and execution security | `references/resource-model-and-security.md` |
| SDK, same-origin `/api/v1` access, browser loading, local development against real data | `references/runtime-and-sdk.md` |
| Frontend architecture, responsive UX, states and test matrix | `references/app-engineering.md` |
| Structure creation, AirApp deployment, seed CRs, approval rules | `references/deployment-and-review.md` |
| Shared shell, domain customization, local and target verification | `references/ui-and-validation.md` |
| Existing AirApp identity, continuous resource/UI evolution, and canonical readback | `references/maintenance.md` |

Always read the sibling Busabase skill at `../busabase/SKILL.md` before connecting or writing. Treat live OpenAPI as authoritative when an endpoint shape is uncertain.

## Workflow

### 1. Establish The Run

Ask these questions one at a time as lettered choices, skipping only facts already stated:

1. Create a new workspace app or maintain an existing AirApp?
2. Deploy to Busabase Cloud or Desktop?
3. For a standalone AirApp, keep generated source in a temporary directory or a persistent directory?
   For a delegated App-in-Skill, record the provided `<skill-root>/app/` project root and skip this
   question.
4. Record validation mode. Delegated App-in-Skill creation defaults to `target-first`; select
   `local-preview` only from an explicit user request. For standalone creation, keep the existing
   local-preview default unless the user explicitly asks for target-first.
5. In `create`, what should the AirApp help people see or manage? In `maintain`, which exact Space,
   AirApp node id, and behavior/runtime change are in scope?

For Cloud, use the connection selected by `busabase-cli login` and confirm the target Space. For Desktop, confirm the local Busabase URL. Never print `.env` contents or token values; show only sanitized readiness.

### 2. Route By Mode

For `maintain`, read and follow `references/maintenance.md` completely. Start from the canonical app
and preserve everything outside the approved change set. The approved iteration may create, update,
move, or remove related resources, schema, data, files, and UI. Do not continue through the
create-only isolated-workspace workflow.

For `create`, continue with steps 3–9. All isolation and blueprint approval rules remain mandatory.

### 3. Discover The Product

Follow the choice-first interaction contract in `references/interview-and-blueprint.md`. Continue one lettered question at a time until the following are known:

- app name and one-sentence outcome;
- audience and their recurring job;
- business objects and their relationships;
- native artifacts: Views, Docs, files, Whiteboards, Forms, Workflows, or HTML;
- lifecycle/status values and important dates;
- first screen, list/detail views, metrics, filters, and search;
- human-attention states;
- whether any small ChangeRequest-producing action is required;
- whether an external integration needs a trusted Workflow/Agent and named Vault requirements;
- brand constraints or permission to infer a quiet operational style.

Do not ask the user to design tables. Translate their story into a minimal coherent model, warn when the model is large, and preserve the user's choice if they confirm the larger scope.

### 4. Present One Approval Blueprint

Create a machine-readable `blueprint.json` and show the user a concise human view containing:

1. User Story.
2. Page and navigation map.
3. Folder/resource graph, including Bases, native Views, Docs, Drives, and optional nodes.
4. Fields, types, required values, select choices, and View configuration.
5. Seed-record and initial-artifact outline.
6. Procedure capability matrix, per-screen data budgets, and action allowlist.
7. Vault requirement names and trusted execution owner, never secret values.
8. Product onboarding version, required fields, Busabase completion resource, validation, and unlocked capabilities; or an explicit empty contract with rationale.
9. Explicit exclusions and risks.

Run:

```bash
node <skill-dir>/scripts/airapp-kit.mjs validate-blueprint --blueprint <path>/blueprint.json
```

Ask for one explicit blueprint decision: approve, revise, or stop. Do not create remote structure before approval.

### 5. Create The Approved Structure

After approval:

1. Re-read the target Space/workspace and check for slug collisions.
2. Generate unique slugs; never reuse matching existing nodes.
3. Create the Folder, Bases, fields, relations, native Views, Docs, Drives, and approved optional resources represented by the blueprint.
4. Use `autoMerge` only because the user approved this exact structure.
5. Read the materialized resources back and write every Folder/Node/Base/View/resource id into `blueprint.json` before scaffolding.

If the returned status is not materialized/merged, stop and report the CR instead of pretending the structure exists.

### 6. Scaffold And Customize The AirApp

Resolve the latest SDK version and scaffold:

```bash
node <skill-dir>/scripts/airapp-kit.mjs scaffold \
  --blueprint <path>/blueprint.json \
  --output <chosen-source-dir>
```

For a delegated App-in-Skill, `<chosen-source-dir>` is exactly `<skill-root>/app/`. The generated
project therefore lives at `<skill-root>/app/package.json`, while its browser files live at
`<skill-root>/app/app/`. This nested name is intentional: the outer directory is the skill's bundled
project, and the inner directory is the AirApp static file tree. The scaffold still refuses to
overwrite a non-empty directory; update an existing canonical project through maintain mode instead
of replacing it blindly.

The scaffold refuses an unmaterialized blueprint. It copies the tested Hono/vanilla shell, pins the resolved SDK, writes exact Folder/Node/Base/View/resource ids plus non-secret Vault requirements into deployment config, installs dependencies, verifies the SDK client export, creates the browser SDK bundle, and creates a lockfile. The bundle is part of the reviewed AirApp source so Nodepod does not run a build tool. Customize the generated domain UI and projections to match the approved blueprint; do not leave generic placeholder labels or demo entities in production mode.

Keep the providers separate:

- Demo provider: deterministic local UI data only.
- Busabase provider: only approved canonical resources and pending CR summaries through the SDK against `/api/v1` on the app's own origin. It never exposes Vault or silently falls back to Demo data.

The local Hono scaffold must also include the OAuth routes and proxy contract in
`references/runtime-and-sdk.md`. A generated setup screen may customize labels and layout, but it
must use `createBusabaseAirAppLocalGateway()` and call that contract only on a loopback document
origin rather than implement a second token
store or send credentials to browser JavaScript. In AirApp, never show the local connection screen
or call `/auth/status` or `/auth/start`.

Keep the data-access budget explicit in the UI. Each Base uses its blueprint `read_limit` (default
50, allowed 1–50) and the generated config's `readLimit`; pending ChangeRequests remain capped at 20
when rendered. Every continuation fetches one bounded page. Show `+` or equivalent when
`nextCursor` exists and provide Load More rather than a hidden all-pages loop. Search and filters
must either state that they apply to loaded rows or issue a debounced, server-filtered paged query;
they must not silently scan the whole Base.

### 7. Validate And Obtain UI Acceptance

Always run:

```bash
pnpm check
node --check server.js
```

Then follow the selected validation mode in `references/ui-and-validation.md`.

For `target-first`, do not start `pnpm dev` and do not report a localhost URL. Static checks plus the
approved blueprint authorize submitting a pending AirApp CR for in-target review, not merging it.
Desktop, phone, interaction, ambient-session, and real-data acceptance happen from merged HEAD in
step 9. State this deferred acceptance clearly in the CR summary.

For an explicitly selected `local-preview`, run `pnpm dev`, open the actual local URL with
`?demo=1`, and verify desktop and 390px mobile layouts before submission.

In local-preview mode, verify against **real** data before submitting anything. Open the local URL without
`?demo=1`, choose Busabase Cloud or enter a custom Busabase origin, and complete the browser OAuth
flow. Do not require a CLI login, device code, or pasted API key for this interactive path.

Environment bootstrap remains available for non-interactive CI and explicit operator testing:

```bash
BUSABASE_BASE_URL=http://localhost:15419 pnpm dev              # Desktop / OSS
BUSABASE_BASE_URL=https://busabase.com \
  BUSABASE_API_KEY=… BUSABASE_SPACE_ID=… pnpm dev              # Cloud
```

Confirm the configured Bases return real records. The interactive local path authenticates the user
through a delegated API permission grant; the deployed AirApp instead uses the viewer's ambient
session, so the target Run in step 9 still proves that distinct permission and embed path.

In local-preview mode, iterate until the user explicitly accepts the UI before submission. In
target-first mode, iterate after each explicitly authorized merge and target Run; later revisions
remain separate reviewable AirApp CRs.

### 8. Deploy The AirApp As A ChangeRequest

Create a new AirApp under the new Folder with the complete validated file tree, `mergeMode: "replace"`, and review-first behavior. Pass `autoMerge: false` explicitly for executable AirApp code; omission can merge immediately when the selected credential has write permission. Record whether validation was `target-first` or `local-preview`.

Report the CR id and the main security facts:

- the deployed app authenticates as the viewing user's browser session;
- no API key is embedded;
- listed read procedures;
- listed ChangeRequest-producing procedures, if any;
- no direct canonical mutation.

Wait for manual UI merge or explicit chat authorization naming that CR. Authorization for one CR does not apply to later CRs.

### 9. Seed And Verify Real Data

Submit three to five realistic records as ChangeRequests. Respect relation dependencies: merge/read back parent records before using their canonical ids in child relations unless the live API explicitly supports temporary record refs.

After the user merges or explicitly authorizes each relevant CR:

1. Read canonical records back.
2. Ask the user to Run the merged AirApp in the target Busabase.
3. Verify the selected deployment path, Base discovery, non-empty data, empty states, browser
   console, desktop layout, and 390px phone layout. In target-first mode this is the required first
   UI acceptance gate, not a follow-up to localhost acceptance.
4. Diagnose bridge/session/space/schema failures separately.

Running a pending AirApp CR is not supported. Never claim target verification before merged HEAD is actually run.

## Completion Criteria

For `create`, finish only when all are true:

- approved Folder, Bases, Views, artifacts, and optional resources exist in the selected Cloud Space or Desktop workspace;
- AirApp source passes its checks and either target-first acceptance in merged Busabase HEAD or an
  explicitly selected local-preview acceptance followed by target Run;
- AirApp code CR is merged with explicit human authority;
- canonical seed records are read back;
- merged AirApp runs against real data in the target environment;
- runtime config contains the exact materialized Folder/Node/Base/View/resource ids and non-secret Vault requirements, and every interactive read path is bounded, appropriately filtered, and visibly paginated;
- no secret appears in files, logs, screenshots, or chat;
- local interactive authentication uses PKCE and an owner-only per-AirApp registration under
  `~/.busabase/airapps`; no CLI login or browser-visible credential is required;
- actual node URLs, CR ids, source directory, SDK version, and remaining limitations are reported.
- when delegated by an App-in-Skill creator, `<skill-root>/app/` remains the canonical local project,
  `pnpm dev` remains supported without being started by default, and the merged AirApp is traceable
  to that same reviewed source tree.

For `maintain`, use the separate completion criteria in `references/maintenance.md`.

## Publishing the finished app as an installable template

Only when the user asks for it. A working app in one workspace is the deliverable; a template is a
further step that says "anyone should be able to install this".

Do not hand-write the package layout — export the app you just built and verified, so the published
template is the thing that actually ran rather than a second description of it:

```bash
npx busabase-cli export <folder-slug> -o ./<name> --template
```

That writes the layout the Template Center reads: the folder's Skill node lifted to the package root
as `SKILL.md`, `busabase.json` with the catalog metadata, and the resources under `content/`. The
Base slugs come back as the app declared them, not as the prefixed ones the workspace installed
them under. If the folder has no Skill node yet, a `SKILL.md` draft is generated from its structure
— full of TODOs on purpose, because an agent acts on what that file says and a plausible guess about
what a table means is worse than an obvious blank. Fill them in with the user.

Templates are submitted by pull request to <https://github.com/busabase/templates>, whose
`AGENTS.md` carries that repository's own conventions (where a template goes, what is generated,
what disqualifies one). Read it before opening the PR; do not restate or override it here.

## Stop Conditions

Stop and ask for direction when:

- target environment or Space is ambiguous;
- authentication is unavailable;
- in `create`, the user has not approved the blueprint;
- a requested action would bypass ChangeRequests;
- live API behavior conflicts with this Skill;
- the SDK lacks `createBusabaseClient` or fails Nodepod validation;
- Cloud/Desktop Run cannot be verified after merge.
