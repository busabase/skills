# Deployment And Review

Use this reference after blueprint approval.

## Connect Safely

Read `../busabase/SKILL.md`. For Cloud, prefer `busabase-cli login`, confirm the selected Space, and sanitize all connection reporting. For Desktop, probe the configured local URL without assuming authentication.

Never print `~/.busabase/.env`, API keys, cookies, or authorization headers.

## Collision Policy

Every run creates an isolated workspace:

1. List existing nodes.
2. Start from the approved slugs.
3. Add a short numeric suffix until every Folder/resource/AirApp slug is unused.
4. Apply the same namespace consistently to related slugs.
5. Never overwrite, update, move, or reuse an existing matching node.

## Structure Gate

The user's explicit approval of the displayed blueprint authorizes only the exact Folder/resource/schema/View structure. It does not authorize AirApp code, content, records, external side effects, reviews, or merges.

After approval, structure may use `autoMerge: true`. Read every result back; do not assume the server auto-merged because the request included the flag. Write every canonical Folder/Node/Base/View/resource id into the approved blueprint before scaffolding; runtime data access is pinned to these ids.

Prefer the native resources described in `resource-model-and-security.md`. Use relation target slugs/ids supported by the live OpenAPI. If relation targets must exist first, create Bases in dependency order and add relation fields afterward. Create Vault requirements as documentation/readiness metadata only; never submit values in the blueprint or AirApp CR.

## AirApp Create CR

Submit the complete accepted file tree through the AirApp create surface:

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

Do not pass `autoMerge: true`. The response must be a pending CR/materialized-false result. If live OpenAPI differs, follow it and update the payload without weakening review-first behavior.

## CR Review Summary

Report:

- CR id and target AirApp name;
- number of files and exact SDK version;
- Cloud/Desktop RPC path;
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
5. verify provider mode, RPC path, Base count, record count, browser console, and responsive layout.

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
- local Demo and target Run verification results;
- any remaining limitation.
