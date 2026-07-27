---
name: busabase-app-creator
description: Design and deploy a complete Busabase workspace app through a low-friction, choice-first workflow. Use when a user wants to turn a natural-language app idea into a new Busabase Cloud or Desktop workspace containing a Folder, typed Bases and native Views, Docs, Drives and Assets, optional Whiteboards, Forms, Workflows or HTML nodes, declared Vault requirements, realistic seed ChangeRequests, and a runnable Hono + vanilla JavaScript AirApp backed by busabase-sdk's session RPC client.
---

# Busabase App Creator

Create one isolated Busabase workspace and deploy one runnable AirApp from a guided conversation. Start from the user's business story, not from fields or frontend technology. This skill is the single technical source of truth for Busabase app creation; higher-level workflow skills must delegate workspace modeling, security, scaffolding, UI engineering, and deployment here.

## Non-Negotiable Contract

- Use `$busabase` for connection, API, ChangeRequest, and approval behavior. Read its `SKILL.md` before any remote operation.
- Create a new Folder, at least one new workflow Base, the required native resources, and a new AirApp on every run. Never attach to or modify an existing business Base.
- Ask exactly one decision question per message. Present two or three concrete options labeled `A`, `B`, and optionally `C`; mark one as recommended when appropriate, then invite the user to reply with a letter or type a custom answer. Never ask a bare open-ended interview question.
- Ask the user to choose Busabase Cloud or Desktop before connecting.
- Ask whether generated source should use a temporary directory or a user-specified persistent directory.
- Use Hono plus vanilla HTML/CSS/JavaScript. Do not introduce React, Vite, JSX, or an application-framework build pipeline. Bundle the installed SDK locally during scaffolding; deployed `start` must only run the server.
- Resolve the latest published `busabase-sdk`, verify that it exports `createBusabaseRpcClient`, then pin the exact version in the generated app.
- Use `createBusabaseRpcClient` in browser code. Never put an API key, Bearer token, session cookie, or secret in the AirApp files.
- Keep the first version read-only unless the user explicitly requests a small action. Any requested write must create a ChangeRequest; never mutate or merge canonical records from the AirApp.
- Access only resources created during this run. Model each concern with its native Busabase resource: Base for structured records, View for table/gallery/kanban/calendar/gantt projections, Doc for long-form content, Drive/Assets for files, and optional Whiteboard/Form/Workflow/HTML nodes when the product needs them.
- Declare third-party integrations and Vault requirements in the blueprint without values. Browser AirApps cannot read Vault. Secret-consuming work must run through a trusted Busabase Workflow or explicitly configured Agent path.
- After structure creation, write every materialized Folder, Node, Base, View, and resource id back into the blueprint. Generated runtime code must use those exact ids instead of listing the workspace and rediscovering resources by slug.
- Give every data-reading workflow an explicit budget. Default interactive pages to at most 50 records per Base and 20 relevant pending ChangeRequests, use server-side filters/sorts, run independent reads in parallel, preserve `nextCursor`, and fetch only one page per user action. Never hide a full scan behind loading, search, filtering, refresh, navigation, or detail opening; full exports and offline analysis require a separate, explicit batched workflow.
- Generate the UI in the user's conversation language. Keep messages centralized so a later iteration can add locales.
- Generate three to five realistic seed records by default. Submit them as ChangeRequests; do not auto-merge records.
- Require local deterministic Demo preview and explicit UI acceptance before submitting AirApp code.
- Allow `autoMerge` only for the exact Folder/Base/field/relation structure the user approved in the current conversation.
- Submit AirApp code and seed data as reviewable ChangeRequests. Review or merge a CR only after the user explicitly authorizes that specific CR in chat.

## Read References Deliberately

Read each selected reference completely before acting:

| Need | Reference |
| --- | --- |
| Interview order, stopping rule, blueprint shape | `references/interview-and-blueprint.md` |
| Resource placement, native Views, Vault and execution security | `references/resource-model-and-security.md` |
| SDK, bridge, browser loading, Cloud/Desktop RPC paths | `references/runtime-and-sdk.md` |
| Frontend architecture, responsive UX, states and test matrix | `references/app-engineering.md` |
| Structure creation, AirApp deployment, seed CRs, approval rules | `references/deployment-and-review.md` |
| Shared shell, domain customization, local and target verification | `references/ui-and-validation.md` |

Always read the sibling Busabase skill at `../busabase/SKILL.md` before connecting or writing. Treat live OpenAPI as authoritative when an endpoint shape is uncertain.

## Workflow

### 1. Establish The Run

Ask these questions one at a time as lettered choices, skipping only facts already stated:

1. Deploy to Busabase Cloud or Desktop?
2. Keep generated source in a temporary directory or a persistent directory?
3. What should the AirApp help people see or manage?

For Cloud, use the connection selected by `busabase-cli login` and confirm the target Space. For Desktop, confirm the local Busabase URL. Never print `.env` contents or token values; show only sanitized readiness.

### 2. Discover The Product

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

### 3. Present One Approval Blueprint

Create a machine-readable `blueprint.json` and show the user a concise human view containing:

1. User Story.
2. Page and navigation map.
3. Folder/resource graph, including Bases, native Views, Docs, Drives, and optional nodes.
4. Fields, types, required values, select choices, and View configuration.
5. Seed-record and initial-artifact outline.
6. RPC capability matrix, per-screen data budgets, and action allowlist.
7. Vault requirement names and trusted execution owner, never secret values.
8. Explicit exclusions and risks.

Run:

```bash
node <skill-dir>/scripts/airapp-kit.mjs validate-blueprint --blueprint <path>/blueprint.json
```

Ask for one explicit blueprint decision: approve, revise, or stop. Do not create remote structure before approval.

### 4. Create The Approved Structure

After approval:

1. Re-read the target Space/workspace and check for slug collisions.
2. Generate unique slugs; never reuse matching existing nodes.
3. Create the Folder, Bases, fields, relations, native Views, Docs, Drives, and approved optional resources represented by the blueprint.
4. Use `autoMerge` only because the user approved this exact structure.
5. Read the materialized resources back and write every Folder/Node/Base/View/resource id into `blueprint.json` before scaffolding.

If the returned status is not materialized/merged, stop and report the CR instead of pretending the structure exists.

### 5. Scaffold And Customize The AirApp

Resolve the latest SDK version and scaffold:

```bash
node <skill-dir>/scripts/airapp-kit.mjs scaffold \
  --blueprint <path>/blueprint.json \
  --output <chosen-source-dir>
```

The scaffold refuses an unmaterialized blueprint. It copies the tested Hono/vanilla shell, pins the resolved SDK, writes exact Folder/Node/Base/View/resource ids plus non-secret Vault requirements into deployment config, installs dependencies, verifies the RPC export, creates the browser SDK bundle, and creates a lockfile. The bundle is part of the reviewed AirApp source so Nodepod does not run a build tool. Customize the generated domain UI and projections to match the approved blueprint; do not leave generic placeholder labels or demo entities in production mode.

Keep the providers separate:

- Demo provider: deterministic local UI data only.
- Busabase provider: only approved canonical resources and pending CR summaries through SDK RPC. It never exposes Vault or silently falls back to Demo data.

Keep the data-access budget explicit in the UI. The default interactive window is one page of 50 records per configured Base and, only when rendered, one page of 20 relevant pending ChangeRequests. Every continuation fetches one bounded page. Show `+` or equivalent when `nextCursor` exists and provide Load More rather than a hidden all-pages loop. Search and filters must either state that they apply to loaded rows or issue a debounced, server-filtered paged query; they must not silently scan the whole Base.

### 6. Validate And Obtain UI Acceptance

Run:

```bash
npm run check
npm run dev
```

Open the actual local URL with `?demo=1`. Verify desktop and 390px mobile layouts per `references/ui-and-validation.md`. Tell the user this is a local development preview and does not prove the Busabase session bridge works.

Iterate until the user explicitly accepts the Demo UI. Do not submit AirApp code before acceptance.

### 7. Deploy The AirApp As A ChangeRequest

Create a new AirApp under the new Folder with the complete accepted file tree, `mergeMode: "replace"`, and review-first behavior. Do not pass `autoMerge: true` for executable AirApp code.

Report the CR id and the main security facts:

- browser session RPC is used;
- no API key is embedded;
- listed read procedures;
- listed ChangeRequest-producing procedures, if any;
- no direct canonical mutation.

Wait for manual UI merge or explicit chat authorization naming that CR. Authorization for one CR does not apply to later CRs.

### 8. Seed And Verify Real Data

Submit three to five realistic records as ChangeRequests. Respect relation dependencies: merge/read back parent records before using their canonical ids in child relations unless the live API explicitly supports temporary record refs.

After the user merges or explicitly authorizes each relevant CR:

1. Read canonical records back.
2. Ask the user to Run the merged AirApp in the target Busabase.
3. Verify the selected deployment path, Base discovery, non-empty data, empty states, and browser console.
4. Diagnose bridge/session/space/schema failures separately.

Running a pending AirApp CR is not supported. Never claim target verification before merged HEAD is actually run.

## Completion Criteria

Finish only when all are true:

- approved Folder, Bases, Views, artifacts, and optional resources exist in the selected Cloud Space or Desktop workspace;
- AirApp source passes its checks and local Demo acceptance;
- AirApp code CR is merged with explicit human authority;
- canonical seed records are read back;
- merged AirApp runs against real data in the target environment;
- runtime config contains the exact materialized Folder/Node/Base/View/resource ids and non-secret Vault requirements, and every interactive read path is bounded, appropriately filtered, and visibly paginated;
- no secret appears in files, logs, screenshots, or chat;
- actual node URLs, CR ids, source directory, SDK version, and remaining limitations are reported.

## Stop Conditions

Stop and ask for direction when:

- target environment or Space is ambiguous;
- authentication is unavailable;
- the user has not approved the blueprint;
- a requested action would bypass ChangeRequests;
- live API behavior conflicts with this Skill;
- the SDK lacks `createBusabaseRpcClient` or fails Nodepod validation;
- Cloud/Desktop Run cannot be verified after merge.
