---
name: ddd
description: Audit and refactor an app or package against the kapps DDD domain convention — domains/{domain}/{components, logic, contract.ts, router.ts, types, schema(PO only)}. Checks domain layering, contract purity (pure zod, no logic/db pulled into client bundle), VO/DTO/PO separation, oRPC (no tRPC), and the no-domain-index rule. Use when asked to "check DDD", "/ddd", align an app to the domain spec, or migrate tRPC→oRPC + tidy schema/types.
disable-model-invocation: false
allowed-tools: Bash(make:*), Bash(pnpm:*), Bash(npx:*), Bash(git:*), Bash(gh:*), Bash(grep:*), Bash(rg:*), Bash(find:*), Bash(ls:*), Read, Write, Edit, Grep, Glob, Agent
user-invocable: true
---

# /ddd — DDD convention auditor & refactorer

Audit (and optionally refactor) one app, several apps, or a package against the kapps
**Domain-Driven Design** convention. The canonical spec lives in `AGENTS.md` →
"Domain Standalone Pattern (oRPC + contract — canonical)". Golden references:
`apps/productready` and `apps/buda` (both fully migrated).

## Target

- `$ARGUMENTS` = the app/package path(s) or name(s), e.g. `apps/maildrone`, `npschimp`, `packages/foo`, or `all`.
- If none given, ask which app/package to audit (or default to the current app under `cwd`).
- For `all`, iterate over `apps/*` (skip ones with no `src/domains/`).

## The convention (what "correct" looks like)

```
src/domains/{domain}/
  # backend (server-only)
  logic/         pure (db, actor, input) → VO. No @trpc/*, no Better Auth, no ctx. Throws ORPCError.
                 Server-only helpers live HERE (logic/_helpers.ts), NOT in utils/.
  router.ts      implement(contract).$context<Context>() + middleware; thin handlers → logic
  router-demo.ts (optional) demo/mock router
  schema/{x}.ts  DB/PO ONLY: drizzle pgTable + $infer + createInsert/SelectSchema
  openapi/       (optional) public OpenAPI surface
  # frontend (client-only)
  components/     React UI (client)
  hooks/          (optional) React hooks (client): react + orpc client + ./contract/./types. NEVER ~/db / ~/server.
  # isomorphic (pure; client-safe)
  contract.ts    oRPC contract. imports ONLY zod + ./types (+ @orpc/contract). .input(DTOSchema).output(VOSchema).
  types/{x}.ts   DTO + VO Zod schemas CO-LOCATED with their z.infer types
  utils/          (optional) PURE isomorphic helpers (format/parse/url/mime/VO map). No react/db/server/node. *.test.ts co-located.
  shared/         (optional) isomorphic shared logic (e.g. permission predicate). Same purity as utils/.
  (NO index.ts at the domain root)
```

**Helper placement is by RUNTIME, not the word "helper":** touches db/actor/secrets/node → `logic/`;
React/client-only → `hooks/`; pure & isomorphic (the browser could import it without pulling `~/db`/`~/server`/drizzle) → `utils/` or `shared/`.

**oRPC vs tRPC — both fully supported, neither is wrong.** oRPC golden refs are `apps/buda` / `apps/productready`;
many apps are on tRPC and that is a **first-class, conformant choice — NOT legacy, NOT a "migration opportunity"**.
Treat tRPC as ✅. Do **not** convert tRPC→oRPC unless the user explicitly asks. Everything else (PO/DTO/VO split,
`schema/`=PO, DTO/VO in `types/`, `logic/` purity, DB funneled through `logic/`, helper placement, no domain-root
`index.ts`) applies equally to both; only the transport differs (`trpc/`+`TRPCError` vs `contract.ts`/`router.ts`+`ORPCError`).

**oRPC HTTP boundary convention (apps/productready, apps/buda, apps/busabase-cloud, apps/busabase):**
- `/api/v1` is the public REST/OpenAPI surface and is served by `OpenAPIHandler`. Public paths are written
  explicitly in contract `.route({ path })` values and must use REST-style kebab-case/plural resource names
  (`/api/v1/change-requests`, `/api/v1/audit-events`, `/api/v1/api-agents/{agentId}/sessions`).
- `/api/rpc` is the internal oRPC transport and is served by `RPCHandler`. It follows the TypeScript router-key
  path, so camelCase domain keys are expected (`POST /api/rpc/changeRequests/list`) and TS callers stay
  ergonomic (`orpc.changeRequests.list()`).
- `/api/mcp` is the AI/tool surface and is served by `sharelib/mcp`'s
  `createOpenApiMcpHandler({ contract, createClient, ... })`. It exposes selected `/api/v1` OpenAPI operations
  as MCP tools by recursively discovering contract procedures and calling the matching OpenAPI client operation.
  Do not hand-maintain a second business API in MCP; MCP is a projection of the public OpenAPI contract.
- Handler choice does **not** auto-convert naming. `OpenAPIHandler` uses the contract route path exactly as
  written; `RPCHandler` uses router keys exactly as named. Therefore: keep TS/router keys camelCase, hand-write
  public `/api/v1` paths as kebab-case, and let MCP tool names derive from the OpenAPI router key path
  (`changeRequests.list` → `change_requests_list`) unless an app has a strong product reason to override.

## Phase 1 — AUDIT (read-only; always do this first, then report)

Run these against the target's `src/` and report each violation with file:line. (Replace `<APP>` with the target dir.)

1. **Transport = oRPC OR tRPC (both ✅ — never a failure).**
   Detect which transport the app uses: `grep -rlE "@trpc/|trpc\.|createTRPCRouter" <APP>/src` and check for `<APP>/src/server/trpc.ts`, `server/routers/`, `app/api/trpc/`, `lib/trpc/`, `domains/*/trpc/`, `@trpc/*` in `package.json`. Report the transport as a fact (oRPC ✅ or tRPC ✅), **not** a violation — tRPC is a fully supported, conformant choice. Don't suggest migrating unless the user asked. (All the PO/DTO/VO + helper-placement rules below apply to tRPC apps with `trpc/`+`TRPCError` instead of `contract.ts`/`router.ts`+`ORPCError`.)
1b. **oRPC HTTP boundaries (for oRPC apps).**
   - `/api/rpc` route should use `RPCHandler` and pass the `/api/rpc` prefix: `grep -rnE "RPCHandler|prefix: \"/api/rpc\"" <APP>/src/app/api/rpc <APP>/src/lib/orpc <APP>/src/server/orpc` → present.
   - `/api/v1` route should use `OpenAPIHandler` for the public REST/OpenAPI surface: `grep -rn "OpenAPIHandler" <APP>/src/app/api/v1 <APP>/src/lib/orpc <APP>/src/domains/openapi` → present.
   - `/api/mcp` route, when present, should use `createOpenApiMcpHandler` from `sharelib/mcp` so MCP tools are generated from the same `/api/v1` OpenAPI contract rather than hand-written drift-prone tool callbacks: `grep -rnE "createOpenApiMcpHandler|registerOpenApiMcpTools|createMcpToolsFromOpenApiContract" <APP>/src/app/api/mcp <APP>/src/domains/mcp <APP>/src/lib/mcp`.
   - Public contract `.route({ path })` values under `/api/v1` should be REST-style kebab-case/plural where applicable, not router-key camelCase. Flag paths like `/api/v1/changeRequests`, `/api/v1/auditEvents`, or `/api/v1/agentTasks`; keep router keys such as `changeRequests.list` camelCase for `/api/rpc` and TS callers.
2. **No domain-root `index.ts`.**
   `find <APP>/src/domains -maxdepth 2 -name index.ts` → none directly under a domain (subdir index.ts like `components/index.ts` is OK).
3. **`schema/` = PO only.**
   `grep -rnE "VO\b|DTO|DTOSchema|VOSchema" <APP>/src/domains/*/schema/*.ts | grep -vE "createInsertSchema|createSelectSchema|\\\$infer"` → none. (schema may hold only: `pgTable`, `$inferSelect/$inferInsert` PO types, `createInsert/SelectSchema`, and jsonb column types the table itself references.)
4. **DTO/VO live in `types/`** (zod + inferred co-located), not in a `domains/*/schema/` dir used for DTO/VO. There should be NO `domains/*/schema/` that lacks a `pgTable`.
   For each `domains/*/schema/*.ts`: `grep -L pgTable` → any hit is a mis-placed DTO/VO schema dir to fold into `types/`.
5. **The contract's exported I/O type graph must be CLIENT-RESOLVABLE.** `contract.ts` imports `types/`, and the **mobile/web oRPC client is generated from the contract's `.input`/`.output` types**. The failure mode (what forces a hand-written `.d.ts` on RN): the contract's exported types transitively reach a drizzle/`~/db`/server module the client package can't cheaply resolve. *Importing a VO type is NOT itself the problem — a VO is client-safe by definition.* Flag these specific leaks, not every import:
   - **Drizzle PO / non-plain types in the exported surface:** in `contract*.ts` + `types/*.ts`, no `$inferSelect`/`$inferInsert`, `createSelectSchema`/`createInsertSchema`, or `z.custom<ServerType>()` used as a contract input/output. `grep -rnE '\$infer(Select|Insert)|createSelectSchema|createInsertSchema|z\.custom<' <APP>/src/domains/*/contract*.ts <APP>/src/domains/*/types/*.ts` → none. (These drag drizzle's generic type machinery into the client.) VO/DTO = **standalone zod** (`export const XVOSchema = z.object({...}); export type XVO = z.infer<typeof XVOSchema>`).
   - **Client graph routed through `~/db` / server / drizzle** (the barrel mixes `pgTable` VALUES + `drizzle-orm`; `~/`-aliases aren't portable in emitted `.d.ts`): `grep -rnE 'from "~/(db|server)|from "(\.\./)*schema|from "share-domains/[a-z]*/(schema|logic)|drizzle-orm|from "(\.\./)*logic' <APP>/src/domains/*/contract*.ts <APP>/src/domains/*/types/*.ts` → none. **Even `import type`** counts here: a plain `*VO` interface is fine to *reference*, but it must not be reached via `~/db/schema` — it belongs in a `types/` file. (A type-only import *between* `types/` files, or of an external pure type pkg, is fine.)
   - `import type * as logic` / `out<R<typeof logic.*>>` / `Awaited<ReturnType<typeof logic.*>>` in type positions: `grep -rnE "import type \* as|out<R<|Awaited<ReturnType<typeof" <APP>/src/domains/*/contract*.ts <APP>/src/domains/*/types/*.ts` → none (JSDoc comments mentioning them are fine).
   - Contracts should use explicit `.output(SomeVOSchema)` (runtime-validated), not `z.custom<T>()` passthrough.
   - **Why this is usually already covered:** if rules 3+4 hold (schema = PO only, VOs live in `types/`), the `~/db/schema` imports vanish on their own — a `*VO` that was sitting in a schema file just moves to `types/`. **Golden ref:** `apps/productready` `types/` depend only on `zod` + sibling pure types. **Anti-pattern seen in buda:** `import type { RewardTransactionVO } from "~/db/schema"` — the VO was *defined in a schema file* and reached via the `~/db` barrel; move it to `billing/types/` and import from there.
6. **`logic/` purity:** `grep -rlE "@trpc/|better-auth|TRPCError|ctx\." <APP>/src/domains/*/logic` → none. Logic fns take `(db, actor, input)`; throw `ORPCError`.
7. **Router thinness:** handlers in `router.ts` should just call a `logic/` fn and return its result (no inline DB queries / business rules).
7b. **DB access funneled through `logic/` (service layer) — nothing else queries the db.** The db client may be used ONLY inside `logic/`. Find scattered raw db access everywhere else:
   - `grep -rlE 'db\.(select|insert|update|delete|query|transaction|execute)\b|\bfrom "drizzle-orm"' <APP>/src --include=*.ts --include=*.tsx | grep -vE '/domains/[^/]+/logic/|/domains/[^/]+/schema/|/db/|/server/orpc/|instrumentation|/scripts/|\.test\.'` → expect ZERO. Any hit in `router.ts`/`trpc/`, `app/**/route.ts`, server actions, `components/`, `hooks/`, `utils/`, or loose `helpers/` is a violation → that query belongs in a `logic/` fn the caller invokes.
   - Also flag domains that have a `controller`/`service`/`helpers` dir doing DB work that should be `logic/`.
   - Allowed to touch `db`: `domains/*/logic/`, `domains/*/schema/` (table defs), `src/db/` (client+seed+migrations), `server/orpc/*` middleware/context wiring, instrumentation/health, `scripts/`, tests.
8. **DB tables colocated:** local drizzle tables should live in `domains/<owner>/schema/`; `src/db/schema/index.ts` is just a re-export barrel. Shared-package (`share-domains/*`) + auth-generated tables stay put. (Soft check — report, don't force.)
9. **Helper placement by runtime** (catch mis-filed helpers/utils/hooks):
   - `utils/` & `shared/` must be PURE/isomorphic: `grep -rlE 'from "react|from "~/(db|server)|drizzle-orm|from "postgres|from "node:' <APP>/src/domains/*/utils <APP>/src/domains/*/shared` → none (a hit means it's really backend → move to `logic/`, or client-only → `hooks/`).
   - `hooks/` must not reach the server: `grep -rlE 'from "~/(db|server)|drizzle-orm' <APP>/src/domains/*/hooks` → none.
   - Generic dirs that are really one of the canonical buckets (`helpers/`, `lib/`, loose `server/`, `client/`) → flag to fold into `logic/`(backend) / `hooks/`(client) / `utils/`|`shared/`(pure). Co-locate `*.test.ts` next to its source.

Produce an **audit report**: per domain, ✅/❌ for each rule, with the offending files. If invoked only to "check", stop here.

## Phase 2 — REFACTOR (only if asked to fix/align/refactor)

Work **domain by domain** (independent units — parallelize with subagents via the Agent tool, one agent per domain or small group; keep the shared aggregation files — `server/orpc/{contract,router}.ts`, `server/routers/index.ts`, `drizzle.config.ts`, `src/db/schema/index.ts` — edited centrally by you to avoid conflicts). Mirror exactly how `apps/buda` / `apps/productready` were done:

1. **tRPC → oRPC** (if still on tRPC): build `server/orpc/{context,middleware,contract,router}.ts`, `app/api/rpc/[[...rest]]/route.ts`, `lib/orpc/{internal-client,provider}.tsx` (copy from buda/productready, adapt imports); add `@orpc/tanstack-query`. Per domain: extract `logic` `(db, actor, input)` (TRPCError→ORPCError) → `types/` (DTO+VO Zod + infer) → `contract.ts` (`.input/.output` explicit schemas) → `router.ts` (+`router-demo.ts` if the tRPC had `ctx.isDemo` branches) → register in aggregation → switch consumers (`trpc.X.useQuery`→`useQuery(orpc.X.queryOptions({input}))`, etc.) → `git rm` the domain `trpc/` + deregister. Then teardown (`git rm` trpc infra, remove `@trpc/*`, swap `TRPCProvider`→`ORPCProvider`).
2. **DTO/VO → `types/`**: fold any `domains/*/schema/*.ts` that holds DTO/VO into `types/<name>.ts` (co-locate `export const XSchema=...; export type X = z.infer<typeof XSchema>`), delete those `schema/` dirs, repoint contract + importers. (`import type`→`import` since zod becomes a value.)
3. **Contract + `types/` de-couple** (make the client-facing type graph self-contained — Phase-1 rule 5): remove `import type * as logic` + `out<R<typeof logic.fn>>`; define explicit Zod VO schemas in `types/`; `.output(VOSchema)`. Crucially, also kill **`import type` leaks in `types/*.ts`**: any `import type { Foo } from "~/db/schema"` (PO drizzle type or a VO re-exported from schema) re-used as a VO/DTO must be replaced by a **standalone zod schema** defined in `types/` (`export const FooVOSchema = z.object({...}); export type FooVO = z.infer<...>`), with a `// keep in sync with <schema file>` comment. This is what was forcing the extra `.d.ts` on the mobile oRPC client. Verify after: `grep -E 'from "(\.\./)*logic|~/db|~/server|drizzle-orm' <domain>/types/*.ts <domain>/contract*.ts` → empty.
4. **DB tables → domains** (optional, if asked): `git mv` local tables into `domains/<owner>/schema/`; keep `src/db/schema/index.ts` as a re-export barrel; extend `drizzle.config.ts` with `./src/domains/*/schema/*.ts`; repoint deep `~/db/schema/<file>` importers directly (NO re-export shims). Leave share-domains + auth-generated tables.
5. Then **purge VO/DTO from the moved table files** into `types/` (rule 3 again) so `schema/` is strictly PO.
6. **Funnel scattered db access into `logic/`** (Phase-1 rule 7b): for each raw `db.*` query found outside `logic/`, extract it into a `logic/<concept>-logic.ts` fn `(db, actor, input) → VO` (carry over any business rules / audit logs that surrounded it), then replace the call site with the logic fn. Routers/handlers/components/helpers end up with no `db` import. Re-run the rule-7b grep → empty. Fold any `controller`/`service`/`helpers` dir that was doing DB work into `logic/`.

Rules while refactoring: never modify `packages/kui`; no domain-root `index.ts`; no re-export shims (move + rewrite imports); `git mv` to preserve history; never hand-write drizzle migrations (use `pnpm db:generate`).

## Phase 3 — VERIFY (gates; must pass before declaring done)

- `pnpm --filter <app> exec tsc --noEmit` (or `make typecheck`) → clean. For big apps: `NODE_OPTIONS="--max-old-space-size=8192" ...` and filter spurious `\.source/` / `PageData` fumadocs noise.
- `pnpm --filter <app> build` → exit 0.
- `pnpm lint:err` (biome, error-level) → clean.
- If tables moved: `pnpm --filter <app> db:generate` → **zero schema diff** (delete any spurious/unrelated generated migration; investigate any real diff).
- Re-run the Phase-1 audit greps → all ✅.
- Write a changelog at `apps/<app>/content/changelog/YYYYMMDD-ddd-*.md`.

## Notes

- Scale to the ask: "check" = audit + report only; "fix/align/refactor" = Phase 2+3.
- For large apps (many domains / a big `systemadmin`), fan out per-domain subagents; reconcile the shared aggregation + run the gates yourself.
- Use `apps/buda` and `apps/productready` as the source of truth for every pattern (middleware, demo routers, contract shape, barrel, etc.).
