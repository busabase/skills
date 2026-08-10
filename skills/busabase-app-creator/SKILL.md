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
- Ask whether generated source should use a temporary directory or a user-specified persistent directory.
- Use Hono plus vanilla HTML/CSS/JavaScript. Do not introduce React, Vite, JSX, or an application-framework build pipeline. Bundle the installed SDK locally during scaffolding; deployed `start` must only run the server.
- Resolve the latest published `busabase-sdk`, verify that it exports `createBusabaseClient`, then pin the exact version in the generated app.
- Use `createBusabaseClient` against `window.location.origin` in browser code. Never hard-code an absolute Busabase URL, never use the obsolete `/__busabase_api__/` bridge prefix (nothing serves it any more), and never put an API key, Bearer token, session cookie, or secret in the AirApp files. A local development key belongs in the shell environment, where `server.js`'s dev proxy attaches it server-side.
- In `create`, keep the first version read-only unless the user explicitly requests a small action. In either mode, any requested write must create a ChangeRequest; never mutate or merge canonical records from the AirApp.
- In `create`, access only resources created during this run. In `maintain`, use exact existing resource ids and explicitly materialize ids for newly approved resources; never discover or repurpose unrelated resources by a matching name or slug. Model new concerns with native Busabase resources.
- Declare third-party integrations and Vault requirements in the blueprint without values. Browser AirApps cannot read Vault. Secret-consuming work must run through a trusted Busabase Workflow or explicitly configured Agent path.
- In `create`, after structure creation, write every materialized Folder, Node, Base, View, and resource id back into the blueprint. Generated runtime code in either mode must use exact ids instead of listing the workspace and rediscovering resources by slug.
- Give every data-reading workflow an explicit budget. Default interactive pages to at most 50 records per Base and 20 relevant pending ChangeRequests, use server-side filters/sorts, run independent reads in parallel, preserve `nextCursor`, and fetch only one page per user action. Never hide a full scan behind loading, search, filtering, refresh, navigation, or detail opening; full exports and offline analysis require a separate, explicit batched workflow.
- Generate the UI in the user's conversation language. Keep messages centralized so a later iteration can add locales.
- In `create`, generate three to five realistic seed records by default and submit them as ChangeRequests; do not auto-merge records.
- In `create`, require local deterministic Demo preview and explicit UI acceptance before submitting AirApp code. In `maintain`, apply the validation and acceptance gates in `references/maintenance.md`.
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
3. Keep generated source in a temporary directory or a persistent directory?
4. In `create`, what should the AirApp help people see or manage? In `maintain`, which exact Space,
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
8. Explicit exclusions and risks.

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

The scaffold refuses an unmaterialized blueprint. It copies the tested Hono/vanilla shell, pins the resolved SDK, writes exact Folder/Node/Base/View/resource ids plus non-secret Vault requirements into deployment config, installs dependencies, verifies the SDK client export, creates the browser SDK bundle, and creates a lockfile. The bundle is part of the reviewed AirApp source so Nodepod does not run a build tool. Customize the generated domain UI and projections to match the approved blueprint; do not leave generic placeholder labels or demo entities in production mode.

Keep the providers separate:

- Demo provider: deterministic local UI data only.
- Busabase provider: only approved canonical resources and pending CR summaries through the SDK against `/api/v1` on the app's own origin. It never exposes Vault or silently falls back to Demo data.

Keep the data-access budget explicit in the UI. Each Base uses its blueprint `read_limit` (default
50, allowed 1–50) and the generated config's `readLimit`; pending ChangeRequests remain capped at 20
when rendered. Every continuation fetches one bounded page. Show `+` or equivalent when
`nextCursor` exists and provide Load More rather than a hidden all-pages loop. Search and filters
must either state that they apply to loaded rows or issue a debounced, server-filtered paged query;
they must not silently scan the whole Base.

### 7. Validate And Obtain UI Acceptance

Run:

```bash
npm run check
npm run dev
```

Open the actual local URL with `?demo=1`. Verify desktop and 390px mobile layouts per `references/ui-and-validation.md`.

Then verify against **real** data before submitting anything, by pointing the dev proxy at the target Busabase:

```bash
BUSABASE_BASE_URL=http://localhost:15419 npm run dev              # Desktop / OSS
BUSABASE_BASE_URL=https://busabase.com \
  BUSABASE_API_KEY=… BUSABASE_SPACE_ID=… npm run dev              # Cloud
```

Open the local URL *without* `?demo=1` and confirm the configured Bases return real records. Use the
credential already selected by `busabase-cli` or supplied in the local shell environment, without
printing it. If no Cloud credential is configured, ask the user to complete
`busabase-cli login --device-code`; never ask them to paste a key into chat or write one into a file.

State the limits plainly: this proves the app's queries, projections, and empty states against real data, but it authenticates with a key rather than the deployed session, so per-user permissions and the embed path are still only proven by the target Run in step 9.

Iterate until the user explicitly accepts the UI. Do not submit AirApp code before acceptance.

### 8. Deploy The AirApp As A ChangeRequest

Create a new AirApp under the new Folder with the complete accepted file tree, `mergeMode: "replace"`, and review-first behavior. Pass `autoMerge: false` explicitly for executable AirApp code; omission can merge immediately when the selected credential has write permission.

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
3. Verify the selected deployment path, Base discovery, non-empty data, empty states, and browser console.
4. Diagnose bridge/session/space/schema failures separately.

Running a pending AirApp CR is not supported. Never claim target verification before merged HEAD is actually run.

## Completion Criteria

For `create`, finish only when all are true:

- approved Folder, Bases, Views, artifacts, and optional resources exist in the selected Cloud Space or Desktop workspace;
- AirApp source passes its checks and local Demo acceptance;
- AirApp code CR is merged with explicit human authority;
- canonical seed records are read back;
- merged AirApp runs against real data in the target environment;
- runtime config contains the exact materialized Folder/Node/Base/View/resource ids and non-secret Vault requirements, and every interactive read path is bounded, appropriately filtered, and visibly paginated;
- no secret appears in files, logs, screenshots, or chat;
- actual node URLs, CR ids, source directory, SDK version, and remaining limitations are reported.

For `maintain`, use the separate completion criteria in `references/maintenance.md`.

## Stop Conditions

Stop and ask for direction when:

- target environment or Space is ambiguous;
- authentication is unavailable;
- in `create`, the user has not approved the blueprint;
- a requested action would bypass ChangeRequests;
- live API behavior conflicts with this Skill;
- the SDK lacks `createBusabaseClient` or fails Nodepod validation;
- Cloud/Desktop Run cannot be verified after merge.
