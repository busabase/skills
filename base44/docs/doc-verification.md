# Documentation check: every call, with its source

Read on **2026-11-18**. Each row says where the behaviour is documented and how far this kit's code
has been checked against it:

- **Docs** = read in the official docs; no live check.
- **Live: Busabase** = also exercised against a real Busabase server (v1.5.0 local, and the
  `busabase.com` OpenAPI document) by `scripts/verify-local-busabase.ts`.
- **Not run on Base44** = needs a real Base44 app; see [test-record.md](test-record.md).

If a live Base44 run disagrees with a row, the live result wins and the difference goes in the
"Differences found live" table of [test-record.md](test-record.md).

## Base44

| What the kit relies on | Source | Status |
| --- | --- | --- |
| Custom (workspace) integration: import a spec by URL (JSON or YAML) or **Paste JSON**; up to **30** operations; Settings → Build tools → Custom integrations → Add integration; Slug / Name / Description / Base URL; custom headers stored as encrypted workspace secrets; `authorization` and `x-api-key` style headers are sensitive and never shown again; owners/admins on Builder+ create it, anyone in the workspace uses it | [Managing and using custom integrations](https://docs.base44.com/documentation/integrations/using-custom-integrations.md) | Docs. Not run on Base44 |
| Spec is copied at import; updating = same slug, new integration | same page, "Editing an integration" and FAQ | Docs |
| `base44.integrations.custom.call(slug, operationId, params)`, `operationId` = `method:path`, params `payload` / `pathParams` / `queryParams`, response has `success` and `data`, errors 404 / 502 / 504; also on `asServiceRole.integrations` | [Integrations module](https://docs.base44.com/developers/references/sdk/docs/type-aliases/integrations.md) | Docs |
| Whether a server URL with a path (`https://busabase.com/api/v1`) is joined with the spec paths (`/records`) | not stated | **Not documented.** Assumed standard OpenAPI. If calls 404, rebuild with `pnpm build:spec -- --keep-prefix` and set Base URL to the origin |
| Which OpenAPI version the importer accepts | not stated ("OpenAPI or Swagger") | **Not documented.** Output is 3.0.3 (Redocly lint: 0 errors) |
| **Entity automations in `function.jsonc` can no longer be created**; apps with workflows get HTTP 409 deploying them; workflows replaced them | [Automations](https://docs.base44.com/developers/backend/resources/backend-functions/automations.md), [Creating workflows](https://docs.base44.com/Building-your-app/Creating-workflows.md) | Docs. **This is why the kit ships workflows** (see differences below) |
| Workflows need a Builder plan; trigger `entity` (`entity_name`, `events`), payload `.trigger.entity_id`, `.event_type`, `.data`, `.changed_fields`; schedule trigger (cron, ≥ 5 min); `call` tasks need `then`; task names snake_case; `x-base44` titles; no secrets in workflows | [Creating workflows](https://docs.base44.com/Building-your-app/Creating-workflows.md); authoring guide at [base44/skills `base44-platform-workflows/references/backend-functions.md`](https://github.com/base44/skills/blob/main/skills/base44-platform-workflows/references/backend-functions.md) (the docs-site copy of that page returned 404, so the same text was read from Base44's skills repo, commit `df01a9c`) | Docs. Structure checked by `tests/workflows.test.ts` against the rules above. Not run on Base44 |
| `invoke_backend_function` (`function_name`, `args` = request body) for Vite/mobile apps; `invoke_server_route` (`path`, `method`, `body`) for TanStack Start apps | same authoring guide, and its TanStack variant `…/references/web-tanstack.md` | Docs. Not run on Base44 |
| A workflow step calls the function/route **as the workflow's creator, an app admin**, and the URL is public, so check `auth.me()` / role admin, then use `asServiceRole`; never a shared secret | authoring guide, "Important Notes" | Docs. Implemented in both adapters |
| Entity workflows fire only for **single-record** create/update/delete; `bulkUpdate`, `updateMany` and by-query writes, restores and permanent deletes do **not** | [Automations](https://docs.base44.com/developers/backend/resources/backend-functions/automations.md) (entity events warning) | Docs. Handled by `reconcile` mode |
| A Base44 API note lists `consecutive_failures` as a reason Base44 itself deactivates a workflow | [Apps API: workflows overview](https://docs.base44.com/developers/references/apps-api/sections/workflows.md) | Docs. Why sync errors return HTTP 200 and are stored |
| Backend function layout `base44/functions/<name>/entry.ts`, default export `(req: Request) => Response`, `createClientFromRequest(req)`, shared code in `base44/shared`, relative imports with extensions, limits (5 min, 128 MB, 10,000 requests), public URL `https://<app-domain>/functions/<name>`, no user on direct HTTP so use `asServiceRole` | [Backend functions overview](https://docs.base44.com/developers/backend/resources/backend-functions/overview.md) | Docs. Not run on Base44 |
| Secrets read with `secrets.get("NAME")` from `base44:runtime`, inside the handler (a top-level read is `undefined`); set with `base44 secrets set KEY=VALUE` or the dashboard **Secrets** page; reaches deployed functions at once, a published app may need a re-publish | [Backend functions overview](https://docs.base44.com/developers/backend/resources/backend-functions/overview.md#read-secrets), [secrets set](https://docs.base44.com/developers/references/cli/commands/secrets-set.md), [Managing app secrets](https://docs.base44.com/Integrations/managing-app-secrets.md) | Docs |
| Entities: `asServiceRole.entities.<Name>.get/filter/create/update`; `filter(query, { limit, cursor })` returns `{ items, next_cursor, has_more }`; Mongo-style operators (`$in`, `$lt`, `$gte`); `get` rejects with HTTP 404; no unique constraints, concurrent writes not atomic | [Entities SDK reference](https://docs.base44.com/developers/skills/base44-sdk/references/entities.md), [Entity schemas](https://docs.base44.com/developers/backend/resources/entities/entity-schemas.md) | Docs. The filter operators and cursor shape are exercised only by the in-memory fake, so check them on the first run |
| Entity schema file format and `rls` (`create`/`read`/`update`/`delete`, `user_condition`); service role bypasses RLS | [Entity schemas](https://docs.base44.com/developers/backend/resources/entities/entity-schemas.md), [Security](https://docs.base44.com/developers/backend/resources/entities/security.md) | Docs |
| `entities push` and `deploy` are **full syncs for entities** (missing local entity ⇒ removed from the schema); functions are not pruned without `--force` | [deploy](https://docs.base44.com/developers/references/cli/commands/deploy.md), [functions deploy](https://docs.base44.com/developers/references/cli/commands/functions-deploy.md) | Docs |
| `deploy` lists entities, functions, actors, connectors, agents, auth, site as what it pushes: **workflows are not listed** | [deploy](https://docs.base44.com/developers/references/cli/commands/deploy.md) | Docs. Hence "create workflows in the dashboard chat, or write the files where the sandbox picks them up" |
| `base44 logs --function <names> [--env preview\|prod]` | [logs](https://docs.base44.com/developers/references/cli/commands/logs.md) | Docs |
| TanStack Start server routes: `src/routes/api/<name>.js`, `createFileRoute("/api/<name>")({ server: { handlers } })`, `context.getBase44()`, `requireUserRoute` from `@/lib/auth-middleware`, secrets via `base44:runtime`, webhooks verify a signature instead of signing in | [base44/skills `base44-platform-backend-functions/references/web-tanstack.md`](https://github.com/base44/skills/blob/main/skills/base44-platform-backend-functions/references/web-tanstack.md) | Docs. The `@tanstack/react-router` import path is the standard TanStack one, not shown on that page. Not run on Base44 |
| Custom MCP: Account settings → Builder → MCP Connections → Add custom MCP; Name / URL / Authentication (**Not required** or **OAuth**) / custom headers; Test & Add or Authorize & Add; up to 20; per account; Builder+; **only the AI chat while building, not workflows, functions or the published app** | [Managing MCP connections](https://docs.base44.com/documentation/account-and-billing/setting-up-a-custom-mcp.md) | Docs. Not run on Base44 |

## Busabase

| What the kit relies on | Source | Status |
| --- | --- | --- |
| Operations in the subset (`GET /auth`, `/bases`, `/bases/{baseId}`, `/records`, `/records/get`, `/records/search`, `/records/count`, `/search`, `/change-requests/{id}`; `POST /bases/{baseId}/change-requests`, `/records/{recordId}/change-requests`) | `https://busabase.com/api/v1/openapi.json` (v1.3.0); docs [OpenAPI](https://busabase.com/docs/openapi), [REST API](https://busabase.com/docs/rest-api) | Live: spec fetched and regenerated by `build:spec`; Live: Busabase 1.5.0 for the calls the sync makes |
| `Authorization: Bearer <key>` and `x-busabase-space` | OpenAPI description; [OpenAPI docs page](https://busabase.com/docs/openapi) | Docs + Live |
| `GET /records/get` with `baseId` + `fieldSlug` + `valueText` finds a record by a field value; 404 when none | OpenAPI (`records.get` description) | Live (steps 1 and 3 of `verify:local`) |
| Create = `POST /bases/{baseId}/change-requests { fields, message, idempotencyKey }`; same key from the same submitter returns the first result (later as a *merged Change Request* without the record id) | OpenAPI; Busabase source `record-ops.ts` (idempotency check) | Live (step 4: retry returned `{ landed: true, status: "merged" }`, one record) |
| Update = `POST /records/{recordId}/change-requests { operation: "update", fields }`; partial patch; no idempotency key on this call | OpenAPI; Busabase `skill-doc.ts` | Live (steps 5 and 7) |
| `materialized: true` returns the record, `false` returns a Change Request; a write-level key merges at once, `changeRequest` level waits for review | [API keys](https://busabase.com/docs/api-keys), Busabase `skill-doc.ts` ("Don't choose a merge policy…") | Live for the merged case. The review-pending case is covered only by the fake in `tests/sync.test.ts` |
| Record fields are keyed by field **slug**; select values are the choice name | OpenAPI; observed | Live (`verify:local` creates a `select` field and reads `status: "new"` / `"paid"` back) |
| Webhook rule: event **Updated Record** (`record.updated`), scoped to a Base, action **Webhook** with `targetUrl` and `secret`, **Test now** | [Webhooks & Events](https://busabase.com/docs/webhooks-events); OpenAPI `POST /webhooks` | Live (rule created over the API) |
| Delivery body `{ "event", "recordId", "baseId", "changeRequestId", "fields" }`; header `X-Busabase-Signature` = hex HMAC-SHA256 of the **raw body** with the rule secret, only when a secret is set; up to 3 attempts on non-2xx, 5 s timeout; no timestamp (replayable) | Busabase source: `webhook/logic/dispatch.ts`, `logic/cr-lifecycle.ts` (the docs page does not spell out the signature) | Live (a real delivery verified by the kit's receiver; forged requests refused) |
| Busabase blocks webhook targets on private networks | Docs "Keeping it safe"; source `ssrf-guard.ts` | Live: the local run needs the server started with Busabase's own test hook (`VITEST=1` + `BUSABASE_WEBHOOK_TEST_ALLOW_TARGETS`) |
| MCP: `https://busabase.com/api/mcp`, Streamable HTTP, OAuth with discovery + dynamic client registration + PKCE; or `Authorization: Bearer <key>` | [MCP + OAuth](https://busabase.com/docs/mcp) | Live: unauthenticated POST returns `401` with `WWW-Authenticate … resource_metadata=…/oauth-protected-resource/api/mcp`. The Base44 sign-in itself not run |

## Not supported (and not faked)

| Capability | Why |
| --- | --- |
| File upload through a custom integration | Busabase uploads need a `PUT` to a presigned storage URL; `call()` only documents JSON `payload`, `pathParams`, `queryParams` |
| Per-end-user OAuth through a custom integration | The integration is a workspace credential |
| MCP at runtime (published app, workflows, functions) | Base44: MCP connections are build-time only |
| Creating new automations in `function.jsonc` | Base44 retired them in favour of workflows |
| Syncing deletes; creating Base44 records from Busabase-created records; files | Not built in v0.1 (documented in the README) |
| Deploying workflows with `base44 deploy` | Not in the documented resource list |

## Differences from the brief this kit was built from

| Brief said | Docs say | What the kit does |
| --- | --- | --- |
| Backend functions are triggered by **entity automations** | New automations cannot be created; workflows replace them (a function trigger is now a workflow step) | Ships workflow definitions; entity triggers still exist inside workflows, with the same single-record limitation |
| `sync-to-busabase` / `receive-busabase-webhook` as backend functions | True for Vite/mobile apps; **TanStack Start apps (the editor default) use server routes** | Ships both: functions, and TanStack route adapters over the same shared logic |
| MCP path "Account preferences → MCP connections" | Account settings → **Builder** → MCP Connections | Guide uses the documented path |
| Secrets "read as environment variables" | Read with `secrets.get()` from `base44:runtime`; never `process.env` in TanStack apps | Uses `secrets.get()` |
