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
| AirApp browser reading its Bases | `createBusabaseRpcClient` | ambient logged-in browser session |

Never pass the Agent's API key into generated AirApp files.

## RPC Mounts

Both deployments use the same SDK and RPC client. The chosen deployment controls one config value:

```js
const RPC_PATHS = {
  cloud: "/__busabase_api__/api/rpc/core",
  desktop: "/__busabase_api__/api/rpc",
};
```

Do not use `/api/v1` from an AirApp session client. The bridge forwards browser session cookies; it does not turn them into REST Bearer credentials.

## Browser Client

```js
import { createBusabaseRpcClient } from "/vendor/busabase-sdk.js";
import { appConfig } from "./config.js";

export function createRuntimeClient() {
  const apiBasePath = RPC_PATHS[appConfig.deployment];
  if (!apiBasePath) throw new Error(`Unsupported deployment: ${appConfig.deployment}`);
  return createBusabaseRpcClient({
    apiBasePath,
    headers: appConfig.spaceId ? { "x-busabase-space": appConfig.spaceId } : {},
  });
}
```

The published `busabase-sdk` ESM file can contain bare imports such as `@orpc/client`; a browser cannot resolve those imports directly. During local scaffolding, exact-pinned `esbuild-wasm` bundles the exact-pinned SDK into `app/vendor/busabase-sdk.js`. Commit that generated file as reviewed AirApp source. `start` only runs `node server.js`, so Nodepod never invokes a build tool, native binary, or subprocess. This is a dependency bridge, not an application framework: the AirApp remains Hono plus vanilla HTML, CSS, and JavaScript. Never expose `node_modules` through a static route or replace this with a third-party CDN.

The Demo provider is dynamically imported before the Busabase provider. Consequently `?demo=1` remains deterministic and can render even before the SDK bundle exists, while production mode loads the RPC dependency only when needed.

## Provider Boundary

Keep these files separate:

```text
app/js/providers/demo-provider.js
app/js/providers/busabase-provider.js
app/js/providers/index.js
app/js/rpc-client.js
app/js/config.js
```

The UI calls only the provider interface. The demo provider is deterministic. The Busabase provider uses only the procedures declared in `blueprint.json` and reads only the exact materialized resource ids written into generated config. Do not list the workspace at runtime to rediscover configured resources by slug.

Default read surface:

```text
records.listPaged
changeRequests.listPaged  # only when pending review data is rendered
```

Add narrowly scoped procedures only when a screen consumes them, for example native View metadata, one Doc/range, a bounded Drive directory, or one named file/asset. Vault has no browser procedure and must never be represented in the provider interface.

RPC uses POST internally for queries and mutations. Read-only safety therefore cannot be inferred from HTTP method. Keep an explicit procedure allowlist and static validation.

## Data Access Budget And Pagination Contract

- Define a budget for every interactive read path, not only the first screen. Lists, refreshes, navigation, search, filters, details, and Load More must each have a bounded query plan.
- Fetch one page per configured Base, with a default limit of 50 records, and fetch only one additional page for each continuation action.
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
| `BRIDGE_UNAVAILABLE` | local preview or bridge route did not reach Busabase |
| `SESSION_REQUIRED` | target browser session is missing/expired |
| `SPACE_UNAVAILABLE` | selected Space cannot be resolved |
| `RPC_PATH_INVALID` | Cloud/Desktop RPC mount mismatch |
| `SCHEMA_INCOMPLETE` | connection works but configured Base/field is missing |
| `PROCEDURE_DENIED` | requested procedure is outside the declared allowlist |
| `SETUP_REQUIRED` | a declared trusted integration is not ready; show requirement names only |

Show one full-screen provider gate with a concrete recovery action. Never show tokens, cookies, or raw private config.

## Platform Security Boundary

The current bridge inherits the Run user's Busabase privileges and is not platform-scoped to this app. The app's allowlist is an application invariant, not a platform security guarantee. State this in the AirApp CR review summary and keep code review mandatory unless the user explicitly authorizes that CR.

## Merged HEAD Limitation

Target Run executes merged HEAD only. A pending AirApp CR cannot be validated in the real session bridge. Local Demo validates UI, not Cloud/Desktop authentication. Always perform target Run after merge.
