# Import Busabase as a Base44 custom integration

A **custom integration** (Base44 calls them *workspace integrations*) registers an API once for the
whole Base44 workspace. Every app in the workspace then calls it with
`base44.integrations.custom.call()`. Base44 proxies the request from its servers, so the Busabase API
key is never sent to the browser.

**Who can do this:** a workspace **owner or admin** on a **Builder plan or higher** creates it.
Anyone in the workspace, even on a Free plan, can use an existing one.

## 1. Get the spec

| File | Use it for |
| --- | --- |
| [`openapi/busabase-openapi-subset.yaml`](../openapi/busabase-openapi-subset.yaml) | **From URL** (the importer accepts a JSON *or* YAML file at a public URL) |
| [`openapi/busabase-openapi-subset.json`](../openapi/busabase-openapi-subset.json) | **Paste JSON** (that option takes JSON only) |

Both hold the same 11 operations, trimmed from `https://busabase.com/api/v1/openapi.json` and lowered
to OpenAPI 3.0.3 (Base44's docs say "OpenAPI or Swagger" without naming a version). Base44 allows at
most 30 operations per integration. The URL must be reachable from the internet: a file behind a
sign-in, on `localhost`, or behind a redirect cannot be read. Use the raw file URL
(`https://raw.githubusercontent.com/busabase/skills/main/base44/openapi/busabase-openapi-subset.yaml`) or just paste the JSON.

| Operation | `operationId` to pass to `call()` | Does |
| --- | --- | --- |
| verifyAuth | `get:/auth` | Which space the key reaches |
| listBases | `get:/bases` | Bases and their field slugs |
| getBase | `get:/bases/{baseId}` | One Base |
| listRecords | `get:/records` | Records of a Base, cursor-paged |
| getRecord | `get:/records/get` | One record by id, or by a field value |
| searchRecordsByField | `get:/records/search` | Records whose field contains text |
| countRecords | `get:/records/count` | Exact count |
| searchWorkspace | `get:/search` | Full-text search across the space |
| createRecord | `post:/bases/{baseId}/change-requests` | Create a record |
| updateRecord | `post:/records/{recordId}/change-requests` | Update a record |
| getChangeRequest | `get:/change-requests/{changeRequestId}` | Did a held write get approved? |

## 2. Import it

1. Click your **workspace name** at the bottom left.
2. Click **Settings**.
3. Under **Build tools**, click **Custom integrations**.
4. Click **Add integration** (or **Create integration** if you have none).
5. Choose **From URL** and paste the YAML URL into **OpenAPI specification URL**, or choose
   **Paste JSON** and paste the contents of the `.json` file. Click **Continue**.
6. **Select endpoints to expose.** Tick all 11 (or only the `get:` ones for a read-only integration,
   see the warning below). Click **Continue**.
7. **Configure your integration:**

   | Field | Value |
   | --- | --- |
   | Slug | `busabase` (apps call the integration by this; keep it) |
   | Name | `Busabase` |
   | Description | `Read and write records in our Busabase workspace` |
   | Base URL | `https://busabase.com/api/v1` (self-hosted: `https://your-host/api/v1`) |

   Under **Custom headers** click **Add header** for each:

   | Header | Value | Notes |
   | --- | --- | --- |
   | `Authorization` | `Bearer <your Busabase API key>` | Treated as sensitive: stored as an encrypted workspace secret and never shown again. To change it, delete the header and add it again. |
   | `x-busabase-space` | `<space id>` | Needed when your key belongs to several spaces; harmless otherwise. `GET /api/v1/auth` lists the ids. |

8. Click **Create integration**. It now appears under **Custom integrations**; click the endpoint
   count (for example **11 endpoints**) to see what it exposes.

> **Use a key with only the access the apps need.** The credential is shared by every app in the
> workspace, and workspace headers take precedence so an app cannot swap them. A `write` key lets any
> app in the workspace write to your Busabase space. Create a `read` key for a read-only integration
> (slug `busabase-read`, tick only the `get:` operations). Base44 explicitly allows several
> integrations for the same API, so add a second `busabase-write` integration with a `write` or
> `changeRequest` key only where an app needs it. Per-end-user OAuth is **not** available for custom
> integrations: the key is the workspace's, not the signed-in person's.

## 3. Call it from an app

The AI chat picks up a workspace integration when you name the service:

> Add a page that lists the records of our Busabase "Orders" Base and lets me mark one as shipped.

Or write the call yourself. `call(slug, operationId, { pathParams, queryParams, payload })` returns a
response with `success` and `data`, and throws on 404 (unknown integration or operation), 502 (the
Busabase call failed) or 504 (timeout).

```ts
import { base44 } from "@/api/base44Client";

// Which Bases exist, and their field slugs
const bases = await base44.integrations.custom.call("busabase", "get:/bases");

// The newest orders
const page = await base44.integrations.custom.call("busabase", "get:/records", {
  queryParams: { baseId: "bse_…", limit: 20 },
});
if (page.success) console.log(page.data.records);

// Find a record by your own id (the field you keep it in)
const hit = await base44.integrations.custom.call("busabase", "get:/records/get", {
  queryParams: { baseId: "bse_…", fieldSlug: "base44_id", valueText: order.id },
});

// Create, safely retryable: same key = same result, never a duplicate
const created = await base44.integrations.custom.call("busabase", "post:/bases/{baseId}/change-requests", {
  pathParams: { baseId: "bse_…" },
  payload: {
    fields: { order_number: "A-1001", customer: "Ada", status: "new", total: 42.5, base44_id: order.id },
    message: "New order from the storefront",
    idempotencyKey: `base44:Order:${order.id}`,
  },
});
// created.data.materialized === true  -> the record exists (a write-level key)
// created.data.materialized === false -> a Change Request is waiting for review in Busabase

// Update
await base44.integrations.custom.call("busabase", "post:/records/{recordId}/change-requests", {
  pathParams: { recordId: "rec_…" },
  payload: { operation: "update", fields: { status: "shipped" }, message: "Shipped" },
});
```

From a **backend function** use `base44.asServiceRole.integrations.custom.call(...)` with the same
arguments. Prefer that for anything that writes: it keeps the write path out of the browser.

## 4. Updating the spec later

Base44 keeps the copy of the spec it read at import time; editing the integration does not refetch.
To pick up a new spec: rename the old integration's slug, create the new one from the updated spec
with the original slug `busabase`, then delete the old one. Apps call integrations by slug, so
nothing else changes. Regenerate the files with `pnpm build:spec`.

## Not supported through a custom integration

- **File upload.** Busabase uploads are a two-step presigned flow (`POST /assets/upload-urls`, then a
  `PUT` of the bytes to a storage URL, then `POST /assets/confirmations`). The `PUT` goes to a
  different host and `call()` documents JSON `payload`, `pathParams` and `queryParams` only, so the
  integration cannot carry it. Upload from a backend function with `fetch`, or leave files out.
- **More than 30 operations**, **per-user sign-in (OAuth)**, **automatic spec refresh**.
- **Calling Busabase from the browser with your own key.** Do not put the key in frontend code; use
  the integration.

## If something fails

| Symptom | Check |
| --- | --- |
| "parsing error" on import | The URL must point straight at the raw file and be public. Otherwise use **Paste JSON** with the `.json` file. |
| 404 from `call()` | `operationId` is `method:path` with a lowercase method and the path exactly as in the table above, including `{braces}` for path params. |
| 502 from `call()` | Busabase answered with an error: wrong or expired key, or a `read` key used on a write operation. |
| Writes return `materialized: false` | The key is `changeRequest` level; a Busabase reviewer must approve the change. |
| Calls reach the wrong space | Add or fix the `x-busabase-space` header. |
