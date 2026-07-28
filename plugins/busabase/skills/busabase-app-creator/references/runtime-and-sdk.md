# Runtime And SDK

Use this reference while generating the project and implementing the Busabase provider.

## Fixed Stack

- Hono server with `@hono/node-server`.
- Vanilla HTML/CSS/JavaScript browser code.
- No runtime build step, React, Vite, JSX, SWC, native binary, subprocess, browser automation, or server-side secret.
- `busabase-sdk` pinned to the exact latest version resolved during scaffolding.

AirApp runs inside Nodepod, a browser Worker/Service Worker Node runtime. Pure JavaScript generally works; native binaries and real OS processes do not.

## Two Authentication Contexts

Do not conflate deployment actions with runtime data access.

| Context | Client | Auth |
| --- | --- | --- |
| Agent creating Folder/Bases/AirApp/CRs | Busabase CLI, REST, or `createBusabaseClient` | Cloud API key or Desktop anonymous access |
| AirApp browser reading its Bases | `createBusabaseClient` against its own origin | ambient logged-in browser session |

Never pass the Agent's API key into generated AirApp files.

## One Path, Every Environment

The SDK ships a single client. The AirApp always calls `/api/v1/…` on its **own origin**, so the same source runs unchanged in four places:

| Where it runs | What serves `/api/v1` | What authenticates |
| --- | --- | --- |
| Deployed in Busabase (Nodepod) | Busabase itself; the service worker passes the path through | the viewer's session cookie |
| Deployed in Busabase (Local Node engine) | Busabase itself, via the same-origin reverse proxy | the viewer's session cookie |
| Public embed | the embed runtime relays it to a capability-scoped, read-only route | the embed's capability, never the viewer |
| Local `npm run dev` | this project's own dev proxy in `server.js` | a key from your shell, attached server-side |

There is no Cloud/Desktop path fork and no bridge prefix. Do not hard-code an absolute Busabase URL, and do not reintroduce `/__busabase_api__/` — that bridge prefix is gone, nothing serves it, and an AirApp that uses it works in none of the rows above.

## Browser Client

```js
import { createBusabaseClient } from "../vendor/busabase-sdk.js";
import { appConfig } from "./config.js";

export function createRuntimeClient() {
  return createBusabaseClient({
    baseUrl: window.location.origin,
    ...(appConfig.spaceId ? { spaceId: appConfig.spaceId } : {}),
  });
}
```

## Local Development Against Real Data

Use the connection already selected by `busabase-cli` or credential variables already present in
the local shell. Do not print them or ask the user to paste a key into chat. If Cloud authentication
is absent, require `busabase-cli login --device-code` before continuing.

`server.js` registers a `/api/v1/*` proxy only when `BUSABASE_BASE_URL` is set, so it is inert once deployed:

```bash
BUSABASE_BASE_URL=http://localhost:15419 npm run dev              # Desktop / OSS: open, no key
BUSABASE_BASE_URL=https://busabase.com \
  BUSABASE_API_KEY=… BUSABASE_SPACE_ID=… npm run dev              # Cloud
```

The key stays in the shell and is attached server-side. It must never appear in a committed file, and the browser must never see one — `npm run check` fails the project if it does.

**Asset references must be relative** (`./styles.css`, `./js/app.js`, `../vendor/busabase-sdk.js`). Under the Local Node engine the app is reverse-proxied onto a *sub-path* of busabase's origin, so an absolute `src="/js/app.js"` resolves against the origin root — busabase itself — and 404s. `npm run check` rejects absolute asset references. `/api/v1/…` is exempt: it is an API call, not an asset.

Without `BUSABASE_BASE_URL` the app still runs; only `?demo=1` has data.

The published `busabase-sdk` ESM file can contain bare imports such as `@orpc/client`; a browser cannot resolve those imports directly. During local scaffolding, exact-pinned `esbuild-wasm` bundles the exact-pinned SDK into `app/vendor/busabase-sdk.js`. Commit that generated file as reviewed AirApp source. `start` only runs `node server.js`, so Nodepod never invokes a build tool, native binary, or subprocess. This is a dependency bridge, not an application framework: the AirApp remains Hono plus vanilla HTML, CSS, and JavaScript. Never expose `node_modules` through a static route or replace this with a third-party CDN.

The Demo provider is dynamically imported before the Busabase provider. Consequently `?demo=1` remains deterministic and can render even before the SDK bundle exists, while production mode loads the SDK only when needed.

## Provider Boundary

Keep these files separate:

```text
app/js/providers/demo-provider.js
app/js/providers/busabase-provider.js
app/js/providers/index.js
app/js/busabase-client.js
app/js/config.js
```

The UI calls only the provider interface. The demo provider is deterministic. The Busabase provider uses only the procedures declared in `blueprint.json` and reads only the exact materialized resource ids written into generated config. Do not list the workspace at runtime to rediscover configured resources by slug.

Default read surface:

```text
records.listPaged
changeRequests.listPaged  # only when pending review data is rendered
```

Add narrowly scoped procedures only when a screen consumes them, for example native View metadata, one Doc/range, a bounded Drive directory, or one named file/asset. Vault has no browser procedure and must never be represented in the provider interface.

Reads are GET and writes are POST/PUT/DELETE on this surface, but do not lean on the verb for safety: keep the explicit procedure allowlist and the static validation in `npm run check`.

## Data Access Budget And Pagination Contract

- Define a budget for every interactive read path, not only the first screen. Lists, refreshes, navigation, search, filters, details, and Load More must each have a bounded query plan.
- Fetch one page per configured Base using its blueprint `read_limit`/config `readLimit` (default 50, integer 1–50), and fetch only one additional page for each continuation action.
- Fetch at most 20 relevant pending ChangeRequests, using the server-side status filter, and omit this request when the UI does not render it.
- Start independent Base and ChangeRequest reads together with `Promise.all`.
- Preserve every `nextCursor`; show a partial-count marker such as `50+` and a Load More control.
- Push supported filters and sorting into `records.listPaged` instead of fetching a broad page and pretending client-side filtering covers the full Base.
- Debounce replaceable queries such as text search, discard stale responses, and reuse already-loaded pages when inputs have not changed.
- Avoid per-record follow-up calls. Load related data in bounded parallel batches or from data already present in the record response.
- Never loop through cursors in an interactive request. Search, aggregates, full exports, and offline research require a separate deliberate design with bounded batches, progress, cancellation/retry behavior, and a clear user action.
- Do not request procedures or datasets that have no visible consumer.

These limits are page budgets, not claims about total record count. Loading another page must be a visible user action and must merge records without duplicates. A displayed count must say or signal when it covers only loaded rows; never present a partial window as a canonical total.

## Optional Actions

If the approved blueprint contains an action:

- implement only `kind: "change_request"`;
- show the proposed fields and message before submission;
- create a pending CR;
- never call review or merge from the AirApp;
- refresh pending CR state after submission;
- display the new CR id to the user.

## Error Taxonomy

Do not report every provider failure as missing Bases.

| Code | Meaning |
| --- | --- |
| `BRIDGE_UNAVAILABLE` | `/api/v1` did not reach Busabase (locally: `BUSABASE_BASE_URL` unset or the dev proxy is down) |
| `SESSION_REQUIRED` | target browser session is missing/expired |
| `SPACE_UNAVAILABLE` | selected Space cannot be resolved |
| `SPACE_HEADER_REJECTED` | the configured Space is not one the current session/key may target |
| `SCHEMA_INCOMPLETE` | connection works but configured Base/field is missing |
| `PROCEDURE_DENIED` | requested procedure is outside the declared allowlist |
| `SETUP_REQUIRED` | a declared trusted integration is not ready; show requirement names only |

Show one full-screen provider gate with a concrete recovery action. Never show tokens, cookies, or raw private config.

## Platform Security Boundary

A deployed AirApp inherits the Run user's Busabase privileges and is not platform-scoped to this app (a public embed is the exception — it is capability-scoped and read-only). The app's allowlist is an application invariant, not a platform security guarantee. State this in the AirApp CR review summary and keep code review mandatory unless the user explicitly authorizes that CR.

## Merged HEAD Limitation

Target Run executes merged HEAD only. A pending AirApp CR cannot be validated in the real session bridge. Local Demo validates UI only; local `BUSABASE_BASE_URL` development validates real reads but authenticates with your key rather than the deployed session. Always perform target Run after merge.
