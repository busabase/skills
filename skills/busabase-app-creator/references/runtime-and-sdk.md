# Runtime And SDK

Use this reference while generating the project and implementing the Busabase provider.

## Fixed Stack

- Hono server with `@hono/node-server`.
- Vanilla HTML/CSS/JavaScript browser code.
- No runtime build step, React, Vite, JSX, SWC, native binary, subprocess, browser automation, or server-side secret.
- `busabase-sdk` pinned to the exact latest version resolved during scaffolding.

AirApp runs inside Nodepod, a browser Worker/Service Worker Node runtime. Pure JavaScript generally works; native binaries and real OS processes do not.

These constraints are authoritative for higher-level App-in-Skill creators too. They may define the
product workflow and UI requirements, but must not replace this runtime with a conflicting language,
framework, package, authentication, or deployment model.

### Why "no Vite" is not a style preference

This was verified against real boots, not assumed — real `onServerReady` events and real 200
responses through the SW proxy, using Nodepod's own `examples/issue-44-react-dev-server` and
`examples/vite-dev-exit-1` regression pages run against the currently published `@scelar/nodepod`
(the exit-code-only check that page's own summary uses is a false-positive trap: a `npm run dev`
process can exit 0 *after* an unhandled rejection already killed the dev server before it bound a
port — check for a real `onServerReady`/200, not a clean exit code):

- **Unpinned or old Vite (5.x/6.x, and any fresh `npm create vite` scaffold)** throws
  `Cannot destructure property 'createServer' of '(intermediate value)'` out of its esbuild WASM
  init before the dev server binds a port. Confirmed broken.
- **Vite 8's default bundler, rolldown**, ships a native `.node`-class WASM binding Nodepod's
  browser-emulated npm cannot resolve (`Cannot find native binding`), traced back to
  `SharedArrayBuffer is not defined` breaking rolldown's own WASI random-data syscall. This is a
  structural mismatch (the "native binaries... do not [work]" line above), not something a config
  tweak fixes. Confirmed broken even with zero CSP/CORS restrictions on the host page.
- **The one exception: `vite@7.3.1` exactly**, esbuild JSX transform (no `@vitejs/plugin-react`
  Babel, or the Babel Fast Refresh variant — both real-boot; the SWC variant
  [`@vitejs/plugin-react-swc`] does not, same native-binary class of failure as rolldown). This is
  the exact pin `packages/busabase-core/src/logic/airapp-runnable.ts`'s `assertAirAppRunnable`
  write gate allows through as `KNOWN_RUNNABLE_BUNDLER_VERSIONS` — every other bundler version is
  rejected at write time with `AIRAPP_NOT_RUNNABLE`, precisely because it isn't runnable.
- **Even the verified `7.3.1` pin needs host cooperation**: Nodepod lazy-loads `esbuild-wasm` from
  `esm.sh` and (for the SQLite demo) `wa-sqlite`/`brotli-wasm` from `cdn.jsdelivr.net`. A host CSP
  without those origins in `script-src` blocks the fetch and produces the exact same
  `createServer` crash as an unpinned version — this is what actually broke it in production
  before `apps/busabase/next.config.mjs`'s `NODEPOD_TOOL_CDN_ORIGINS` allowlist was added.
  `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless` are
  not required for the `7.3.1` boot itself (it passed without them in testing) but are Nodepod's
  own documented recommendation for the full SharedArrayBuffer path.

This skill still scaffolds Hono plus vanilla JS by default — that default is about keeping
generated AirApps boring, reviewable as plain file diffs, and free of a build step the runtime
doesn't need, not about Vite being unable to run at all. If a blueprint has an explicit,
user-authorized reason to need Vite/React (e.g. porting an existing Vite app in `maintain` mode),
pin exactly `vite@7.3.1` with the esbuild JSX transform, and confirm the target Busabase's AirApp
CSP allows `esm.sh`/`cdn.jsdelivr.net` before promising it will run — do not scaffold `vite@8` or
an unpinned `vite` range on the assumption a newer version is safer.

## Canonical Local Source

There are two source-ownership modes:

| Caller | Canonical project root | Local command |
| --- | --- | --- |
| Standalone AirApp creation | approved temporary or persistent directory | `pnpm dev` |
| Higher-level App-in-Skill creator | `<skill-root>/app/` | `cd <skill-root>/app && pnpm dev` |

The canonical project root is the complete generated Hono project: `package.json`, `server.js`,
`scripts/`, `airapp-blueprint.json`, and the browser `app/` subtree. For App-in-Skill packages this
means `<skill-root>/app/app/` contains browser assets; the repeated directory name is intentional.

AirApp deployment must serialize the same reviewed project tree. Exclude only local-only material
such as `.env*`, `node_modules/`, logs, and editor files. Do not rewrite the app into a remote-only
variant, generate a parallel implementation, or treat the merged AirApp as an independent source of
truth. Maintenance starts by comparing canonical local source with merged AirApp HEAD; any accepted
remote-only change is back-ported locally and verified before another deployment.

`pnpm` is the canonical local invocation for bundled skill apps. Package scripts stay conventional,
so AirApp/Nodepod can run `start` without a package-manager-specific application build. Scaffolding
may install and prebundle dependencies locally, but deployed `start` remains exactly
`node server.js`.

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
| Local `pnpm dev` | this project's own dev proxy in `server.js` | browser OAuth; owner-only per-AirApp token registration under `~/.busabase/airapps` |

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

## Which Runtime Am I? — `BUSABASE_AIRAPP_RUNTIME`

**Never classify the runtime from the URL.** Hostname tests fail in both directions:

- Busabase-hosted AirApps are served from `localhost` / `127.0.0.1` / a `.localhost` host all the
  time — Desktop and OSS run on `http://localhost:15419`. So "localhost ⇒ standalone" is wrong.
- A standalone `npm run dev` is routinely reached over a LAN IP or a signed dev tunnel such as
  `https://3111-t14e66e832aa5e6a.dev.budaapps.com`. So "not localhost ⇒ hosted" is wrong — and this
  direction is the damaging one. The app skips its own connection gate, calls `/api/v1` with no
  credential, and shows `Busabase connection required` with no action the user can take.

Busabase spawns the AirApp's own process in every hosted row, so it simply *tells* the app what it
is. `packages/busabase-core/src/domains/airapp/utils/airapp-runtime-env.ts` owns the contract; both
engines inject it (`local-runtime.ts`/`sandock-runtime.ts` into the spawned process env,
`nodepod-runner.ts` into `Nodepod.boot` + the `npm run dev` spawn). Only Busabase ever sets it, so **absence is the positive
fact "standalone"**.

| `BUSABASE_AIRAPP_RUNTIME` | Runtime | `/api/v1` is authenticated by |
| --- | --- | --- |
| `browser` | in-browser engine, dashboard preview | the viewer's session cookie |
| `local` / `remote` | server-side process, reverse-proxied onto a sub-path | the viewer's session cookie |
| `embed` | public embed | the embed's capability, never the viewer |
| *(unset)* | standalone `npm run dev` | this app's own dev proxy / OAuth registration |

The app's host (`server.js`, or `server.py` for a Python AirApp) re-exposes it to the browser, which
cannot read env vars, and `app/js/runtime.js` is the only module allowed to answer the question.
Both ship in the template; keep them. The contract is the same in either language — only the host
that serves it differs.

```js
import { describeBusabaseAirAppRuntime } from "busabase-sdk/airapp-node";

// The SDK owns the presence-based `hosted` decision and preserves unknown
// future engine names instead of treating them as standalone.
const airappRuntime = describeBusabaseAirAppRuntime();
app.get("/__airapp/runtime", (context) => context.json(airappRuntime));
```

The browser probe must use the **relative** path `__airapp/runtime` (no leading slash — under the
Local Node engine a leading slash resolves against busabase's origin root) and must verify the
response's `content-type` is JSON: a hosted origin's catch-all route can answer `200` with an HTML
shell, and `response.ok` alone would read that as a successful probe.

Resolve **three** states, never two — `hosted`, `standalone`, and `unknown` (the probe did not
answer). Keep "where am I running" separate from "do I have credentials" (`devProxy`, and the
`/api/v1` response itself). Collapsing the two axes into one boolean is what produces a UI that
states a fixed "authenticated" and is wrong the moment it isn't. `scripts/check.mjs` fails the build
on `location.hostname` use, on loopback-literal comparisons, and on a missing runtime probe.

## Local Development Against Real Data

Interactive apps authenticate through browser OAuth only when running standalone — that is, when
`BUSABASE_AIRAPP_RUNTIME` is unset, never because of what the hostname looks like. Use the setup UI
only for an independently opened local `npm run dev` process. That setup offers the canonical
Busabase Cloud origin and one custom-origin option, then submits to Hono's server-side OAuth start
route. Do not direct the user to `busabase-cli login`, device-code login, or an API-key field.

Use `createAirAppConnectGate()` from `busabase-sdk/airapp-gate` for the browser half of this
boundary — the connect screen, the Space-selection screen, and the state machine that decides which
one is owed. Do not hand-roll this UI per app; every App-in-Skill that did carried a duplicated
~160-line renderer plus a byte-identical stylesheet across dozens of apps before this existed. Pass
`shouldGate: () => !isDemo() && !runtime.hosted` explicitly — never let the gate infer whether it is
needed from a status probe, for the same reason hostname detection is banned below. Import
`busabase-sdk/airapp-gate.css` (or vendor it, matching how `busabase-sdk` itself is vendored) for the
default look; it is themed entirely through `--bb-gate-*` custom properties, so match `appConfig`'s
accent color by overriding them rather than forking the renderer. `gate.pass({ onReady })` returns
`true` once the app may load data; call `gate.status()` afterward if the UI needs to display the
connected Space (e.g. in a settings panel).

The Hono boundary must:

1. create a `busabase-airapp` OAuth request with PKCE S256 through `busabase-sdk`;
2. keep state and verifier server-side for at most five minutes;
3. accept only an exact loopback callback, then validate state and `iss` before code exchange;
3b. refuse to start at all when the request's own origin is not loopback, returning a concrete next
   step rather than redirecting into a callback that can never be accepted. This is the dev-tunnel
   case (`https://3111-….dev.budaapps.com`): detection now correctly reports `standalone` and shows
   the gate, but the flow still cannot complete, so say so — "OAuth callbacks only work on this
   machine's own address; open `http://localhost:<port>` to connect, or start the app with
   `BUSABASE_BASE_URL` set";
4. call `exchangeBusabaseOAuthCode()` on the server;
5. call the Node-only SDK credential helper to register the rotating token set at
   `~/.busabase/airapps/<app-id>.json`; the directory must be `0700` and the file `0600`;
6. keep this per-AirApp registration separate from the CLI's active `~/.busabase/.env` profile;
7. call `getBusabaseAirAppAccessToken()` server-side when proxying `/api/v1`; it refreshes and
   persists the token set when needed and never includes a credential in a browser response;
8. call `revokeBusabaseAirAppOAuthCredential()` on logout, then remove the local registration.

Use `createBusabaseAirAppLocalGateway()` from `busabase-sdk/airapp-node` for this boundary. It owns
the pending PKCE request, credential rotation, auth verification, validated Space persistence,
logout, and `/api/v1` proxy. Do not copy those mechanics into each app. The browser may request a
Space through `/auth/space`, but the gateway validates membership and ignores any browser-provided
`x-busabase-space` header on proxied requests.

Before redirecting the browser, issue the generated authorization GET from Hono with redirects
disabled and a short timeout. A redirect or successful response proves that the target recognizes
the public client; `invalid_request` means the selected server needs the local-app OAuth release.
Return that as a concise setup-page error. This compatibility probe is local onboarding only and
must not run inside AirApp.

The local OAuth registration is identity bootstrap, not domain configuration or a blueprint
`vault_requirement`. It must never be committed, synced into an AirApp, or represented as a normal
Busabase Vault item. Browser code must never receive access/refresh tokens, the PKCE verifier, or a
Vault value through JavaScript-visible cookies, storage, application state, logs, or errors.

Validate custom origins before any outbound request: accept HTTPS origins without userinfo, query,
fragment, or path; permit HTTP only for loopback development. Bind the selected origin, redirect URI,
resource audience, client id, and verifier to the pending state. Do not turn the local proxy into a
general URL fetcher.

Environment bootstrap remains supported only for explicit non-interactive CI/operator testing:

```bash
BUSABASE_BASE_URL=http://localhost:15419 pnpm dev              # Desktop / OSS: open, no key
BUSABASE_BASE_URL=https://busabase.com \
  BUSABASE_API_KEY=… BUSABASE_SPACE_ID=… pnpm dev              # Cloud
```

An environment key stays in the shell and is attached server-side. It must never appear in a
committed file, and the browser must never see one. It does not replace the OAuth setup flow in an
interactive generated app.

**Asset references must be relative** (`./styles.css`, `./js/app.js`, `../vendor/busabase-sdk.js`). Under the Local Node engine the app is reverse-proxied onto a *sub-path* of busabase's origin, so an absolute `src="/js/app.js"` resolves against the origin root — busabase itself — and 404s. `pnpm check` rejects absolute asset references. `/api/v1/…` is exempt: it is an API call, not an asset.

Without environment bootstrap the app still runs: standalone production mode shows the OAuth
connection gate and `?demo=1` renders deterministic Demo data. Once connected, authentication
readiness and resource readiness are separate states. A Busabase-hosted AirApp — recognized by
`BUSABASE_AIRAPP_RUNTIME`, never by hostname — never calls `/auth/status` or `/auth/start`,
skips the local OAuth gate, and constructs
`createBusabaseClient({ baseUrl: window.location.origin })` without a credential. Cloud's `/api/v1`
auth layer validates the same-origin browser request, resolves the Better Auth session, and scopes
the request to the viewer's active Space.

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

## Persistent Configuration And Native Nodes

The exact ids in generated config are deployment bootstrap, not a local product-settings database.
Persistent configuration, workflow state, and domain data live in Busabase and are read through
`busabase-sdk` from the most appropriate native node:

- Folder and Node identity define the app root, hierarchy, ownership, and resource map.
- Base and native View hold structured settings, policies, workflow rows, review queues, status, and
  relations that need filtering or sorting.
- Doc holds longer durable instructions or narrative configuration; read only the required range.
- Drive and File hold assets or larger artifacts; list bounded directories and fetch named files on
  demand.
- Vault holds secrets, but browser AirApps receive only requirement names/readiness. A trusted
  Workflow or Agent resolves values and exposes only sanitized results.

Do not persist product configuration in local JSON, SQLite, `app/.data/`, `localStorage`, or Demo
records. Local shell variables are connection bootstrap only. Demo data is deterministic preview
state and must never become a fallback after a Busabase provider failure.

Default read surface:

```text
records.list
records.count     # only when a screen renders an authoritative total, not a loaded-rows count
records.groupBy   # only when a screen renders per-bucket counts (board columns, a by-status chart)
records.listPage  # numbered pagination, or a date-windowed screen (see dateRange below)
changeRequests.list  # only when pending review data is rendered
```

Add narrowly scoped procedures only when a screen consumes them, for example native View metadata, one Doc/range, a bounded Drive directory, or one named file/asset. Vault has no browser procedure and must never be represented in the provider interface.

Reads are GET and writes are POST/PUT/DELETE on this surface, but do not lean on the verb for safety: keep the explicit procedure allowlist and the static validation in `pnpm check`.

## Data Access Budget And Pagination Contract

- Define a budget for every interactive read path, not only the first screen. Lists, refreshes, navigation, search, filters, details, and continuation reads must each have a bounded query plan.
- Fetch one page per configured Base using its blueprint `read_limit`/config `readLimit` (default 50, integer 1–50), and fetch only one additional page for each continuation action — never a loop that walks the cursor to the end during initial loading.
- Fetch at most 20 relevant pending ChangeRequests, using the server-side status filter, and omit this request when the UI does not render it.
- Start independent Base and ChangeRequest reads together with `Promise.all`.
- Preserve every `nextCursor` and choose the continuation UI by layout, not by habit — both of the following are compliant with "one page per user action"; the difference is purely interaction design:
  - **Load more (cumulative append)** — a button appends the next page to what's already showing. Fits a persistent list+detail split (the template's own shared shell: `list-panel` + `detail-panel` visible together) because paging away would silently orphan whatever the detail pane is showing — the selected row can vanish from a *replaced* list out from under an open detail. This is the template's default; `providers/busabase-provider.js`'s `loadMore()` and `app/js/app.js`'s `loadMore()` implement it.
  - **Numbered pager (Prev / 1 2 3 … / Next)** — replaces the displayed rows with exactly that page. Fits a screen where the list *is* the whole view and selecting a row navigates away to a separate detail screen (nothing next to the list to orphan) — `kelly-crm`'s Contacts/Deals pages (`mr-kelly/skills#131`) are the reference. Prefer `records.listPage` here: it takes `page`/`pageSize` directly and returns `total`/`totalPages`, so jumping to page 7 is one request and the page numbers have an honest total behind them. (`records.list` only exposes a forward keyset cursor with no offset/skip, so building a numbered pager on it means walking forward through intermediate pages once to learn their cursors and caching them — still valid if you are already on that path, but not the thing to reach for now.) Degrade to Prev/Next-only (no page numbers) when neither `records.listPage` nor `records.count` is available — there is no honest total to show numbers against.
  - Don't default to one pattern out of habit; pick the one that matches the screen actually being built, and say which one and why in the blueprint/review notes when it isn't obvious from the layout.
- Apply the same per-row normalization (field coercion, JSON-string-encoded array fields parsed into real arrays, defaulting) to every page fetched, first or Nth, via one named function per record shape — not a second copy re-derived (or skipped) for later pages, regardless of which continuation UI is used. A normalizer that only runs on page 1 fails silently until a user reaches page 2, and the failure is a render crash on whatever field it skipped, not a compile-time error.
- **Grouped counts** (a board column header, a "by status" bar chart, a pipeline stage breakdown) have an exact server-side answer: `records.groupBy`. One call returns every bucket's real count for a `select` or `checkbox` field, optionally scoped by `viewId`/`filters`, without reading a single record into the browser. Use it for any grouped *count*; never derive one by tallying loaded rows.
- **Sums and averages** (a revenue total, an average deal size) still have no cheap exact answer once a Base exceeds one page — `records.count` and `records.groupBy` cover counts, not `sum`/`avg` over a field. Compute those from whichever rows are currently loaded, keep every on-screen presentation of that number derived the same way, and do not present the result as a global total it isn't. A sum of exact per-Base *counts* (e.g. a "total records across every Base" tile) is not this problem — addition over numbers already known to be correct stays exact.
- `records.groupBy` is deliberately limited to `select` and `checkbox` fields, because their stored value *is* the grouping key. Grouping by a text field is rejected rather than approximated (the indexed projection truncates long values, so two distinct values could silently collide into one bucket), and so is grouping by a date (bucketing by day depends on the *viewer's* timezone, which the server never has). For a date-bucketed view, scope the read instead — see the calendar note below.

  In the provider, it follows the same shape as the existing `countRecords` helper — permission-gated, and returning `null` (never a fabricated empty result) so the UI can hide the breakdown rather than invent one:

  ```js
  // `groups` is [{ value, count }]. `value` is the raw choice id (or "true"/
  // "false" for a checkbox); `null` is the bucket of records with no value.
  // Zero-count buckets are OMITTED — render an empty column from the field's
  // own choice list, not from this response.
  const groupRecords = async (client, base, fieldSlug) => {
    if (!allowedReads.has("records.groupBy")) return null;
    try {
      return await client.records.groupBy({ baseId: base.baseId, fieldSlug });
    } catch {
      return null;
    }
  };
  ```
- Push supported filters and sorting into `records.list` instead of fetching a broad page and pretending client-side filtering covers the full Base.
- **A calendar/date-windowed screen scopes its read to the window it draws**, via `records.listPage`'s `dateRange` (`{ fieldSlug, gte, lt }` — a half-open `[gte, lt)` interval on a `date`/`created_time`/`updated_time` field). Compute the bounds from the grid you are about to render (a month view is typically a 42-day grid starting before the 1st, not just the calendar month) and send them as **absolute UTC instants** — `new Date(localMidnight).toISOString()` already does this conversion. The server compares real timestamps and has no idea what timezone the viewer is in, which is precisely why the bounds are the caller's job: send local-day boundaries converted to UTC, and each viewer gets their own correct grid. Do not fetch the whole Base and bucket by day in the browser.
- Debounce replaceable queries such as text search, discard stale responses, and reuse already-loaded pages when inputs have not changed.
- Avoid per-record follow-up calls. Load related data in bounded parallel batches or from data already present in the record response.
- Never loop through cursors in an interactive request to compute a total. Call `records.count` instead — it is a real, exact server-side count (optionally scoped by `baseId`, a saved `viewId`, and/or ad-hoc `filters`), not an approximation, and it is cheap for the filter shapes an AirApp typically needs (equality/contains text matches, presence checks, checkbox true/false). Full exports and offline research beyond a count still require a separate deliberate design with bounded batches, progress, cancellation/retry behavior, and a clear user action.
- Do not request procedures or datasets that have no visible consumer.

These limits are page budgets, not claims about total record count. Reading another page must be a visible user action; append without duplicates for load-more, replace for a numbered pager.

Three different questions need three different answers — do not conflate them:

- **"How many rows have I loaded so far?"** (a browsable list, a feed, a picker) — this is about the page budget above. A displayed count must say or signal when it covers only loaded rows; show `50+` (or similar), never present a partial window as a canonical total.
- **"What is the total?"** (a summary/stat tile — "Total PRs: 825", "Open issues: 57") — this is not a loaded-rows question at all. Call `records.count` and render its `total` directly. Never derive a summary-tile number from `records.list` page length, and never label a `50+`-style partial count as if it were this kind of total.
- **"How many in each bucket?"** (board column headers, a by-status chart, "Open 57 / In progress 12 / Done 340") — call `records.groupBy` once and render each bucket's `count`. This is the question that most often gets answered wrongly by draining the Base: a number that climbs while rows load is worse than no number, because the user cannot tell when it has stopped being wrong. The counts are exact from the first paint and do not depend on how many records the screen has fetched.

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
| `BRIDGE_UNAVAILABLE` | `/api/v1` did not reach the selected Busabase origin or the Hono proxy is down |
| `SESSION_REQUIRED` | local AirApp registration or deployed ambient browser session is missing/expired |
| `OAUTH_CALLBACK_INVALID` | state, issuer, code, redirect, client, or resource binding failed |
| `LOCAL_CREDENTIAL_REQUIRED` | the local OAuth token set was not registered, is expired, or was revoked |
| `SPACE_SELECTION_REQUIRED` | no Space is selected, including a multi-Space account awaiting explicit choice |
| `SPACE_NOT_ALLOWED` | the stored/requested Space is not one the current session/key may target |
| `SCHEMA_INCOMPLETE` | connection works but configured Base/field is missing |
| `PROCEDURE_DENIED` | requested procedure is outside the declared allowlist |
| `SETUP_REQUIRED` | a declared trusted integration is not ready; show requirement names only |

Show one full-screen provider gate with a concrete recovery action. Never show tokens, cookies, or raw private config.

## Platform Security Boundary

A deployed AirApp inherits the Run user's Busabase privileges and is not platform-scoped to this app (a public embed is the exception — it is capability-scoped and read-only). The app's allowlist is an application invariant, not a platform security guarantee. State this in the AirApp CR review summary and keep code review mandatory unless the user explicitly authorizes that CR.

## Merged HEAD Limitation

Target Run executes merged HEAD only. A pending AirApp CR cannot be validated in the real session
bridge. Local Demo validates UI only; local OAuth validates the delegated API grant and local
credential proxy, while deployed Run validates the distinct ambient viewer session. Environment-key testing is
an optional automation path and proves neither user flow. Always perform target Run after merge.
