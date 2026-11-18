# Busabase for Base44

Connect a [Base44](https://base44.com) app to [Busabase](https://busabase.com) in both directions:
new and changed Base44 records land in a Busabase Base, and edits made in Busabase are written back
to the Base44 entity.

Base44 has no third-party connector catalog, so this kit uses the three mechanisms Base44 gives you
yourself. They are separate; use any of them.

| You want | Use | Where it runs |
| --- | --- | --- |
| Your app's code to read and write Busabase records through a safe, shared credential | [Custom integration](docs/import-guide.md) + [`openapi/busabase-openapi-subset.yaml`](openapi/busabase-openapi-subset.yaml) | Base44 proxies the call; the key never reaches the browser |
| Automatic two-way sync of entities such as Orders and Customers | [Backend functions + workflows](#two-way-sync) in [`base44/`](base44) | Base44 backend (Deno) |
| Base44's AI chat to read your Busabase Bases while it builds your app | [Busabase MCP](docs/mcp-guide.md) | **Build time only**, not in the published app |

> Docs referenced here were read on 2026-11-18. Every Base44 and Busabase call this kit makes is
> listed with its source page in [docs/doc-verification.md](docs/doc-verification.md), including what
> is **not** supported.

## What you need

- **Base44 Builder plan or higher.** Workspace integrations, workflows and custom MCP connections all
  require it. Only workspace **owners and admins** can create an integration; anyone in the workspace
  can then use it.
- A Busabase space and an **API key** with `write` level (Account → API Keys). `write` makes changes
  merge immediately. A `changeRequest` key also works, but every change then waits in the Busabase
  Inbox for a reviewer and Base44 shows it as `pending_review` until someone approves it.
- The [Base44 CLI](https://docs.base44.com/developers/references/cli/commands/create) for the
  backend-function route (`npm i -g base44`, then `base44 login`).

## Which kind of app do I have?

Base44 workflow steps call different things depending on the app, so pick the right folder first.
Per Base44's skill docs: a project with `src/routes/__root.*` and `src/routeTree.gen.ts` is
**TanStack Start** (the default for apps built in the Base44 editor today); otherwise it is a **Vite
SPA** (React Router) or a native mobile app.

| App | Server code is | Workflow step | Use |
| --- | --- | --- | --- |
| Vite SPA, mobile | backend functions (`base44/functions/…`) | `invoke_backend_function` | [`base44/`](base44) |
| TanStack Start | server routes (`src/routes/api/…`) | `invoke_server_route` | [`base44/shared`](base44/shared) + [`tanstack/`](tanstack) |

Everything below applies to both. Where it differs, the TanStack line is marked **TanStack:**. The
Vite/backend-function path is the one exercised in tests against a real Busabase server; the TanStack
adapters are thin and written from Base44's documented patterns, but have not run on a live Base44
app yet ([docs/test-record.md](docs/test-record.md)).

## Two-way sync

```
Base44 entity (Order)
   │  create / update
   ▼
workflow "Busabase Sync - Orders"  ──►  function sync-to-busabase  ──►  Busabase Base
                                                                            │  record.updated
Base44 entity ◄──  function receive-busabase-webhook  ◄──  signed webhook ──┘
```

### 1. Prepare Busabase

1. Create a Base per entity. Recommended layout for **Orders** (slugs matter, names do not):

   | Field slug | Type | Notes |
   | --- | --- | --- |
   | `base44_id` | text | Holds the Base44 record id. The dedupe key. Required for write-back. |
   | `order_number` | text | |
   | `customer` | text | |
   | `status` | select | choices `new`, `paid`, `shipped`, `cancelled` |
   | `total` | number | |
   | `currency` | text | |
   | `notes` | longtext | |

   **Customers**: `base44_id`, `name`, `email`, `company`, `phone`, `notes` (all text/email/longtext).
2. Copy each Base id (`GET /api/v1/bases`, or the Base's URL).
3. Create the API key.

### 2. Edit the mapping

Open [`base44/shared/mappings.ts`](base44/shared/mappings.ts). Replace the two `REPLACE_WITH_…`
Base ids, and rename fields so each Base44 field points at the Busabase slug you created. Add entries
for other entities the same way. `writeBack` lists the Base44 fields a Busabase edit may overwrite;
leave it out for one-way sync. Without a code change you can instead set the `BUSABASE_MAPPINGS`
secret to a JSON array of the same shape.

Select and date values are passed through unchanged, so make the Base44 value match the Busabase
choice name (`paid`) or date format.

### 3. Add the project files

Copy the contents of [`base44/`](base44) into your app's `base44/` directory
(`base44/functions`, `base44/shared`, `base44/entities/BusabaseSyncState.jsonc`). Do **not** copy the
`*.example.jsonc` entities unless you need example Order/Customer entities.

**TanStack:** copy `base44/shared/` to `src/lib/busabase-kit/`, `tanstack/src/routes/api/*.js` to
`src/routes/api/`, and `base44/entities/BusabaseSyncState.jsonc` as above. Skip `base44/functions`.

### 4. Set the secrets

```bash
base44 secrets set BUSABASE_API_KEY=bb_… BUSABASE_WEBHOOK_SECRET=<a long random string>
# optional
base44 secrets set BUSABASE_SPACE_ID=<space id> BUSABASE_BASE_URL=https://your-busabase.example
```

| Secret | Required | Purpose |
| --- | --- | --- |
| `BUSABASE_API_KEY` | yes | Busabase API key used by `sync-to-busabase` |
| `BUSABASE_WEBHOOK_SECRET` | yes | Shared secret that signs webhooks from Busabase; `receive-busabase-webhook` refuses to run without it |
| `BUSABASE_SPACE_ID` | if the key spans several spaces | Sent as `x-busabase-space` |
| `BUSABASE_BASE_URL` | self-hosted only | Defaults to `https://busabase.com` |
| `BUSABASE_MAPPINGS` | no | JSON replacing `mappings.ts` |

Or add them on the app dashboard's **Secrets** page. A new value reaches deployed functions at once, but a published app may keep the old one until you publish again. Secrets never go in code, in the workflows, or
in the frontend; the functions read them with `secrets.get()` inside the handler.

### 5. Deploy safely

```bash
base44 entities push        # only if you have ALL your entities locally, see warning
base44 functions deploy sync-to-busabase receive-busabase-webhook   # Vite apps
```

**TanStack:** server routes deploy with your app's code (publish), not with `functions deploy`.

> **`entities push` and `deploy` are full syncs.** Per Base44's docs, entities missing from your
> local `base44/entities/` are *removed from the app's schema* (existing data stays, but the entity
> stops being reachable). If you built your entities in the Base44 editor and your local folder does
> not hold all of them, do not run either command. Create the `BusabaseSyncState` entity by pasting
> the contents of `BusabaseSyncState.jsonc` into the AI chat ("create this entity exactly") instead.
> `functions deploy <names>` is safe: functions are never pruned unless you pass `--force`.
> A deployed function reads secrets from the app, so set them (step 4) before the first sync.

### 6. Create the workflows

New Base44 apps use **workflows**; the older `function.jsonc` "automations" can no longer be created
(and an app that has workflows cannot deploy them at all, HTTP 409). The workflow files in
[`base44/workflows/`](base44/workflows) (TanStack: [`tanstack/base44/workflows/`](tanstack/base44/workflows)) are the exact definitions to use. Two ways to get them in:

- **AI chat (works for everyone):** Dashboard → Workflows → Create workflow, then paste:

  > Create a workflow that triggers when an Order is created or updated and runs the backend
  > function `sync-to-busabase` (TanStack: calls the server route `POST /api/busabase-sync` with the same fields as the JSON body) with args `entity: "Order"`, `entity_id` from the trigger's entity id
  > and `event_type` from the trigger's event type. Do the same for Customer. Then create a scheduled
  > workflow every 30 minutes that runs `sync-to-busabase` with `{"mode":"retry"}` and then with
  > `{"mode":"reconcile","since_minutes":90}`.

- **Files:** in a project where the AI/CLI sandbox writes `base44/workflows/<Name>.jsonc`, drop the
  three files of your flavour in; per Base44's skill docs, writing the file creates and activates the workflow.
  `base44 deploy` does not list workflows among the resources it pushes, so do not rely on it.

Change `entity_name`/`entity` if your entities are not called `Order` and `Customer`.

### 7. Point Busabase at the receiver

In Busabase: space menu → **Settings → Webhooks → New rule**: event **Updated Record**, scope it to
the Base, action **Webhook**, URL `https://<your-app-domain>/functions/receive-busabase-webhook` (your published app's domain; **TanStack:** `https://<your-app-domain>/api/busabase-webhook`),
secret = the value you gave `BUSABASE_WEBHOOK_SECRET`. Use **Test now** to see a delivery.
(The same rule can be created with `POST /api/v1/webhooks`; the body is in the Busabase OpenAPI.)

## How it behaves

**Idempotent.** A Base44 record is recognised in Busabase by its id in the `base44_id` field, and a
create carries `idempotencyKey = base44:<Entity>:<id>`. Retries, double-fired events and even a lost
state row never make a second Busabase record. Unchanged content (same content hash as the last
sync) makes no Busabase call at all.

**Failures are kept, not lost.** A failed push is stored on the record's `BusabaseSyncState` row
(`status: failed`, `attempts`, `last_error`) and the function returns HTTP 200, so a Busabase outage
does not show up as repeated workflow failures (Base44's API lists `consecutive_failures` as a reason
it may switch a workflow off itself). The scheduled workflow retries rows up to 10 times; after that
the row waits for you. Transient HTTP errors (429, 5xx, network) are also retried inside one call
with backoff. Structured logs (ids and statuses only, never record contents or secrets) are in the
function logs: `base44 logs --function sync-to-busabase --env prod` (the default is the preview deployment).

**No ping-pong.** A Busabase edit → Base44 write fires the sync workflow again. The receiver stores
the new content hash *before* writing, so that run sees "unchanged" and stops. A Base44 edit that
reaches Busabase triggers a webhook, which the receiver ignores because Base44 already has the value.

**Webhook security.** Busabase signs the raw body with HMAC-SHA256 (hex, `X-Busabase-Signature`).
The receiver compares in constant time and refuses unsigned requests. Busabase's scheme has no
timestamp, so a captured request can be replayed; that is harmless here because applying the same
change twice is a no-op. The sync function checks it is being called by an app admin (a workflow
step), because a function URL is public.

## Limits, and what to do about them

| Limit | Effect | What this kit does |
| --- | --- | --- |
| Entity workflows fire only for **single-record** create/update/delete through the entities API. `bulkCreate`, `bulkUpdate`, `updateMany`, imports, restores do **not** fire them. | Bulk-written records never reach Busabase on their own. | The 30-minute schedule runs `mode: "reconcile"`, which re-checks records updated in the last 90 minutes. After a big import, raise `since_minutes` in the retry workflow (for example `1440`) and press **Run now** on it (a scheduled workflow can be run on demand), then lower it again. Or write records one at a time. |
| Recurring workflows run at most every 5 minutes and use credits (about 1 per 10 steps). | The 30-minute schedule is ~290 credits/month. | Lengthen the cron if needed. |
| A function runs at most 5 minutes, 128 MB, 10,000 outgoing requests. | Huge catch-ups stop early. | `reconcile` has a 500-record / 150-second budget and reports `truncated: true`; run again. |
| Busabase waits 5 s per webhook delivery and retries 3 times. | Slow receivers get duplicate deliveries. | The receiver is idempotent and does little work. |
| Deletes | Not synced either way. | Busabase keeps history; archive on the Busabase side by hand. |
| Records created in Busabase | **Not** created in Base44 (no Base44 id). Only edits of records that came from Base44 are written back. | By design for v0.1. |
| Files / attachments | Not synced. The Custom integration cannot upload (see the import guide). | Out of scope. |

## Development

```bash
cd base44 && pnpm install
pnpm typecheck
pnpm test           # unit tests, Node only, no Base44 account
pnpm build:spec     # regenerate openapi/ from busabase.com
BUSABASE_URL=http://127.0.0.1:15561 pnpm verify:local   # against a real Busabase
```

`base44/shared/` never imports `base44:runtime` or `npm:@base44/sdk`; only the two `entry.ts` files
do, which is what makes the logic testable without a Base44 account.

## License

MIT
