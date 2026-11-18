# Test record

## What has been run

### 1. Unit tests: `pnpm test` (Node 24, no Base44 account)

32 tests, all passing. They cover: create, update, duplicate event, lost state row, transient and
permanent failure with retry, a write held for review, deletes, unmapped entity, placeholder Base id,
bulk catch-up (`reconcile`), signature check (valid / tampered / missing / wrong secret / unset
secret), write-back and replay, the echo of a write-back, forged webhooks, retry/backoff/Retry-After
in the HTTP client, no body or key in error messages, the OpenAPI subset (3.0.3, ≤ 30 operations,
refs resolve), and the workflow files against Base44's documented authoring rules.

**Mutation check** (guards must go red when switched off). Each of these was applied alone and the
suite failed as expected, then reverted:

| Guard removed | Tests that went red |
| --- | --- |
| Store the hash before the write-back (loop guard) | write-back / echo test |
| Signature check always true | signature test, forged-request test |
| Unset secret no longer fails closed | unset-secret test |
| Lookup by Base44 id skipped (duplicate protection) | lost-state-row test, held-for-review test |

### 2. Against a real Busabase server: `pnpm verify:local`

Busabase v1.5.0 (`npx busabase@1.5.0 server`, local, PGLite), the kit's real `createBusabaseClient`
and real webhook receiver behind a real HTTP socket; **only the Base44 side is an in-memory fake**.
Run on 2026-11-18, output:

```
== create the Orders Base in Busabase
== register a record.updated webhook rule pointing at the receiver
== 1. new Order in Base44 -> record appears in Busabase
outcome: { status: 'created', recordId: 'rec…' }
stored fields: { notes: '', total: 42.5, status: 'new', customer: 'Ada', base44_id: 'o1', order_number: 'A-1001' }
== 2. same event again -> deduped, no second record, no write call
== 3. state lost -> found by Base44 id, still one record
== 4. create with the same idempotency key twice -> one record
first: { landed: true, recordId: 'rec…' } retry: { landed: true, changeRequestId: 'crq…', changeRequestStatus: 'merged' }
== 5. edit in Busabase -> signed webhook -> Base44 Order updated
delivery: {"signature":"<64 hex chars>","result":{"ok":true,"applied":["status","notes"]}}
== 6. the workflow echo of that write-back is a no-op
== 7. edit total in Base44 -> Busabase updated; resulting webhook is ignored (no ping-pong)
== 8. a forged request (no / wrong signature) is refused
ALL CHECKS PASSED
Busabase calls made: 6
```

What this proves: the Busabase half works as documented: lookup by field value, idempotent create,
partial update, real signed webhook delivery, constant-time verification, loop-free round trip.

Setup notes for anyone repeating it: the local server needs `BUSABASE_VAULT_ENCRYPTION_KEY` (or
`BETTER_AUTH_SECRET`) set or saving a webhook secret returns HTTP 500; and Busabase refuses webhook
targets on `127.0.0.1` unless the server is started with its test hook, so a hosted space needs a
public receiver URL instead.

## What has NOT been run

**The end-to-end run in a real Base44 test app has not been done.** It needs a Base44 account on a
Builder plan, a test app, and a Busabase test space with an API key, none of which the session that
built this kit had. Everything that touches Base44 itself (importing the spec, `call()`, workflows,
functions, the public function URL, the MCP sign-in) is checked against the documentation only.
No Base44 screenshots exist yet.

### Runbook (fill in when run)

Date: ____  Base44 app: ____  Plan: ____  Flavour (Vite / TanStack): ____  Busabase space: ____

| # | Step | Expected | Result | Screenshot |
| --- | --- | --- | --- | --- |
| 1 | Import the spec ([import guide](import-guide.md)) as slug `busabase`, Base URL `https://busabase.com/api/v1`, `Authorization` + `x-busabase-space` headers | Integration lists 11 endpoints | | `01-import-endpoints.png`, `02-import-configure.png` |
| 2 | In the app: `call("busabase", "get:/bases")` | `success: true`, your Bases | | `03-call-bases.png` |
| 3 | `call("busabase", "get:/records", { queryParams: { baseId, limit: 5 } })` | Proves Base URL + path joining | | |
| 4 | Create `BusabaseSyncState`, set secrets, deploy functions (or add routes), create the 3 workflows | Workflows listed as active; functions listed | | `04-workflows.png`, `05-secrets.png` |
| 5 | **Add an Order in Base44** | Within seconds a record with `base44_id` = the Order id appears in the Busabase Base; run history shows the step succeeded; `BusabaseSyncState` row `synced` | | `06-b44-order.png`, `07-busabase-record.png`, `08-run-history.png` |
| 6 | Create the Busabase webhook rule (Updated Record → Webhook → function URL + secret) and press **Test now** | Delivery log shows `200` (ignored: no Base44 id, for the synthetic record) | | `09-busabase-webhook-rule.png` |
| 7 | **Change the record's Status in Busabase** | Delivery log `200`; the Base44 Order's status changes | | `10-busabase-edit.png`, `11-b44-order-updated.png` |
| 8 | Look at workflow runs after step 7 | One extra run that ends `unchanged` (the echo); no further runs | | |
| 9 | Edit the Order's `total` in Base44 | Busabase record updates once; no write-back loop | | |
| 10 | Bulk-update two Orders with `updateMany` (or import) | No workflow fires; after the 30-minute schedule (or **Run now** on the retry workflow) both appear in Busabase | | |
| 11 | Set a wrong `BUSABASE_API_KEY`, edit an Order | Row `failed` with `last_error`; fix the key, run the retry workflow → `synced` | | |
| 12 | Add the Busabase MCP ([MCP guide](mcp-guide.md)) and ask the AI chat to list your Bases | Bases listed; the published app cannot call it | | `12-mcp-add.png` |

Save screenshots in `docs/screenshots/`.

### Things the first live run must settle

| Question | Why it matters | Result |
| --- | --- | --- |
| Is `https://busabase.com/api/v1` + `/records` joined correctly? | Spec uses a server URL with a path | |
| Does the importer accept the 3.0.3 YAML / JSON as is? | Importer version support is undocumented | |
| Does the workflow step's `args` / `body` arrive as the request body, with the keys `entity`, `entity_id`, `event_type`? | `handleSyncRequest` returns 400 with `received_keys` if not | |
| Does `entity_name` in the trigger want `Order` (as the SDK spells it) or another form? | Docs examples use both | |
| Does `createClientFromRequest` work on the public webhook call with no Base44 headers? | Docs say use `asServiceRole` for webhooks | |
| Do `filter({ entity, entity_id }, { limit: 1 })`, `$in`, `$lt`, `$gte` and cursor paging behave as the SDK reference says? | State lookups, retry, reconcile | |
| Does the TanStack adapter's `createFileRoute` import path resolve? | Not shown on Base44's page | |

### Differences found live (docs vs reality)

None recorded yet. Add rows here; live behaviour wins over the docs.
