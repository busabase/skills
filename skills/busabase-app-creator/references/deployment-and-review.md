# Deployment And Review

Use this reference after blueprint approval.

## Connect Safely

Read `../busabase/SKILL.md`. For Cloud, use the already-selected `busabase-cli` connection or local
shell environment, confirm the selected Space, and sanitize all connection reporting. If no
credential exists, sign in with the two-turn flow in `../busabase/references/connect-and-space.md`
(`busabase-cli login --no-wait`, then `--resume-code` in a later turn); never ask for a key in chat. For
Desktop, probe the configured local URL without assuming authentication.

Never print `~/.busabase/.env`, API keys, cookies, or authorization headers.

## Collision Policy

Every run creates an isolated workspace:

1. List existing nodes.
2. Start from the approved slugs.
3. Add a short numeric suffix until every Folder/resource/AirApp slug is unused.
4. Apply the same namespace consistently to related slugs.
5. Never overwrite, update, move, or reuse an existing matching node.

## Structure Gate

The user's explicit approval of the displayed blueprint authorizes the exact Folder/resource/schema/View structure. In target-first mode, the same approved blueprint and selected AirApp-first delivery path also authorize submitting the generated AirApp code as a pending, reviewable CR so UI acceptance can occur in Busabase. Neither mode authorizes content, records, external side effects, reviews, or merges.

After approval, structure may use `autoMerge: true`. Read every result back; do not assume the server auto-merged because the request included the flag. Write every canonical Folder/Node/Base/View/resource id into the approved blueprint before scaffolding; runtime data access is pinned to these ids.

Prefer the native resources described in `resource-model-and-security.md`. Use relation target slugs/ids supported by the live OpenAPI. If relation targets must exist first, create Bases in dependency order and add relation fields afterward. Create Vault requirements as documentation/readiness metadata only; never submit values in the blueprint or AirApp CR.

## AirApp Create CR

Submit the complete validated file tree through the AirApp create surface. In local-preview mode it
has local UI acceptance; in target-first mode it has passed deterministic checks and awaits UI
acceptance from merged HEAD in Busabase:

```json
{
  "parentNodeId": "<new-folder-node-id>",
  "slug": "<unique-airapp-slug>",
  "name": "<app-name>",
  "description": "<one-sentence-outcome>",
  "visibility": "workspace",
  "version": "0.1.0",
  "mergeMode": "replace",
  "files": [
    { "path": "package.json", "content": "..." }
  ]
}
```

`autoMerge` is deliberately absent: the write is permission-aware, so a credential that can write
to the Folder publishes the app outright and a weaker one yields a pending ChangeRequest. Read the
response to find out which happened — `materialized` true means it is live, false means there is a
CR id to report. Never assume one outcome. If live OpenAPI differs, follow it.

## Reinstalling An Already-Built Bundle

The section above is for a brand-new AirApp coming out of blueprint approval and scaffolding. A
different, more common case is a delegated App-in-Skill's already-built `<skill-root>/app/` —
reviewed once, unchanged — that needs to exist in a Space that has never had it, or needs its latest
local edits pushed to a Space that already has an older copy. Hand-constructing the CR above for that
case is what turned every reinstall into an agent session instead of a script (see the 2026-08-18
handoff report referenced in `busabase-sdk`'s `airapp.ts` changelog). Use `publishAirApp` instead:

```ts
import { provisionDeclaredResources, publishAirApp } from "busabase-sdk/airapp";

await provisionDeclaredResources(client, config); // Folder + Bases, autoMerge: true, unchanged
const result = await publishAirApp(client, config, files); // files: [{ path, content, mimeType? }]
// result.status is "created" (Space never had this AirApp) or "updated" (it already does);
// It omits autoMerge, like the raw CR above: `merged: true` means it is live, and
// `merged: false` carries the changeRequestId a weaker credential's write parked.
```

`files` is the caller's job to read from disk (the SDK module stays isomorphic, no `fs` access) —
walk `<skill-root>/app/`, excluding `node_modules`, lockfiles that are regenerated per-install, and
anything `.gitignore`d. `publishAirApp` diffs against the deployed node's file list (path only, not
content) to choose `create` vs `update` per file; it never deletes a remote-only path. It cannot skip
a no-op publish (no cheap way to compare content without a per-file fetch), so a rerun with nothing
changed still writes — landing as a no-op merge, or as a CR whose diff is empty for a reviewer to
merge or ignore. That is a noise cost, not a correctness one. Either way, report what actually
happened: the node id when it merged, the CR id when it did not, and never claim the reinstall is
done while a CR for it is still open.

## CR Review Summary

Report:

- CR id and target AirApp name;
- validation mode (`target-first` or `local-preview`) and any acceptance still deferred to target Run;
- number of files and exact SDK version;
- the Space the app targets;
- configured resource slugs;
- configured Folder/Node/Base/View/resource ids (sanitized, never secrets);
- declared Vault requirement names and trusted execution owners, never values;
- read procedures;
- data-access budgets for each screen/action, including record and ChangeRequest limits, server filters, and Load More behavior;
- ChangeRequest-producing procedures/actions;
- confirmation that no API key or direct canonical mutation exists;
- bridge privilege warning.

Wait for one of:

1. user merges in Busabase and says it is merged;
2. user explicitly authorizes the Agent to review and merge that named CR.

Do not infer merge permission from blueprint or Demo UI approval. Authorization is scoped to the named CR and expires after use.

## Seed ChangeRequests

Use three to five records from the approved blueprint. Before proposing:

1. list canonical records in the new Base;
2. list pending CRs;
3. skip duplicates by a stable business key;
4. write a human-readable primary field;
5. use an imperative review message and idempotency key.

Submit relation parents first. After explicit merge authorization or manual merge, read back `mergedRecordId`/canonical records before submitting children.

Never auto-merge seed records. The user may explicitly authorize a specific seed CR or a clearly enumerated finite group.

## Read Back And Target Run

After merge:

1. confirm AirApp status/version/files from canonical APIs;
2. confirm seed records from canonical record reads;
3. give the user the target AirApp URL;
4. Run merged HEAD in Busabase;
5. verify provider mode, Base count, record count, browser console, and responsive layout.

If target Run fails, separate:

- install/start failure;
- Service Worker/secure-context failure;
- bridge 404;
- session failure;
- wrong Cloud/Desktop path;
- Space failure;
- missing schema;
- projection/UI failure.

Do not silently switch to Demo data when the target provider fails.

## Completion Report

Include:

- target deployment and Space/workspace name;
- Folder, Base, View, artifact, and AirApp names/slugs/URLs;
- source directory;
- exact SDK version;
- merged/pending CR ids;
- seed records merged;
- target Run verification results and local Demo results only when local-preview was explicitly used;
- any remaining limitation.
