// Builds openapi/busabase-openapi-subset.{yaml,json} from Busabase's live OpenAPI document.
//
//   node scripts/build-openapi-subset.ts                      # from https://busabase.com
//   node scripts/build-openapi-subset.ts --source http://127.0.0.1:15419 --server https://my.host
//   node scripts/build-openapi-subset.ts --keep-prefix        # keep /api/v1 in every path
//
// Why a subset: Base44 lets a workspace expose at most 30 operations per custom integration, and
// the full Busabase spec has 150+. Why 3.0.3: Busabase publishes 3.1 and Base44's docs only say
// "OpenAPI or Swagger", so the output is lowered to 3.0.3, the version every importer reads.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stringify } from "yaml";

type Json = Record<string, unknown>;
const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const source = (flag("--source") ?? "https://busabase.com").replace(/\/+$/, "");
const server = (flag("--server") ?? "https://busabase.com").replace(/\/+$/, "");
const keepPrefix = args.includes("--keep-prefix");
const out = resolve(dirname(fileURLToPath(import.meta.url)), "../openapi");

/** The operations a Base44 app needs, with the note the Base44 AI chat reads when it picks one. */
const OPERATIONS: Array<{
  method: "get" | "post";
  path: string;
  id: string;
  summary: string;
  description: string;
}> = [
  {
    method: "get",
    path: "/api/v1/auth",
    id: "verifyAuth",
    summary: "Check the connection",
    description:
      "Returns the space the key is working in and every space it can reach. Call this first to confirm the integration is wired to the right space.",
  },
  {
    method: "get",
    path: "/api/v1/bases",
    id: "listBases",
    summary: "List Bases (tables) and their fields",
    description:
      "Each Base lists its fields with their slugs and types. Record `fields` are keyed by these slugs.",
  },
  {
    method: "get",
    path: "/api/v1/bases/{baseId}",
    id: "getBase",
    summary: "Get one Base and its fields",
    description: "Use it to read a Base's field slugs and select options before writing records.",
  },
  {
    method: "get",
    path: "/api/v1/records",
    id: "listRecords",
    summary: "List records in a Base",
    description:
      "Pass baseId. Cursor-paginated: send nextCursor back as `cursor`. Current field values are in `headCommit.payload`.",
  },
  {
    method: "get",
    path: "/api/v1/records/get",
    id: "getRecord",
    summary: "Get one record by id, or by a field value",
    description:
      "Either recordId alone, or baseId + fieldSlug + valueText together (for example the field that holds your own app's id). 404 means no such record.",
  },
  {
    method: "get",
    path: "/api/v1/records/search",
    id: "searchRecordsByField",
    summary: "Find records whose field contains some text",
    description: "Requires baseId, fieldSlug and valueText.",
  },
  {
    method: "get",
    path: "/api/v1/records/count",
    id: "countRecords",
    summary: "Count records in a Base",
    description: "Exact count. Pass baseId.",
  },
  {
    method: "get",
    path: "/api/v1/search",
    id: "searchWorkspace",
    summary: "Search the whole workspace",
    description:
      "Full-text search across records, files and docs. Use `query`; narrow with `inNodeId` or `sources`.",
  },
  {
    method: "post",
    path: "/api/v1/bases/{baseId}/change-requests",
    id: "createRecord",
    summary: "Create a record in a Base",
    description:
      "Body: `fields` keyed by field slug. Send a stable `idempotencyKey` (for example `base44:Order:<id>`) so a retry returns the first result instead of creating a duplicate. With a write-level key the response is the new record (`materialized: true`); with a change-request-level key it is a Change Request waiting for review (`materialized: false`).",
  },
  {
    method: "post",
    path: "/api/v1/records/{recordId}/change-requests",
    id: "updateRecord",
    summary: "Update a record",
    description:
      'Body: `operation: "update"` and a partial `fields` patch (omitted fields stay, null clears one). Same response rule as createRecord: the record when merged, a Change Request when it waits for review.',
  },
  {
    method: "get",
    path: "/api/v1/change-requests/{changeRequestId}",
    id: "getChangeRequest",
    summary: "Check a Change Request",
    description:
      "Use it to see whether a write that was not merged immediately has been approved: `status` is `merged` once it landed.",
  },
];

const res = await fetch(`${source}/api/v1/openapi.json`);
if (!res.ok) throw new Error(`could not fetch ${source}/api/v1/openapi.json: ${res.status}`);
const full = (await res.json()) as Json & {
  paths: Record<string, Record<string, Json>>;
  components: { schemas: Record<string, Json>; securitySchemes?: Json };
};

// --- 3.1 -> 3.0.3 for the parts Busabase's spec actually uses
const lower = (node: unknown): unknown => {
  if (Array.isArray(node)) return node.map(lower);
  if (!node || typeof node !== "object") return node;
  const o = { ...(node as Json) };
  if ("const" in o) {
    o.enum = [o.const];
    delete o.const;
  }
  delete o.propertyNames;
  delete o.examples;
  if (Array.isArray(o.anyOf)) {
    const rest = (o.anyOf as Json[]).filter((s) => s.type !== "null");
    if (rest.length !== (o.anyOf as Json[]).length) {
      if (rest.length === 1) {
        delete o.anyOf;
        // the merged-in member has not been lowered yet: run the whole node through again
        return lower({ ...o, ...rest[0], nullable: true });
      } else {
        o.anyOf = rest;
        o.nullable = true;
      }
    }
  }
  if (o.type === "null") {
    delete o.type;
    o.nullable = true;
  }
  if (typeof o.exclusiveMinimum === "number") {
    o.minimum = o.exclusiveMinimum;
    o.exclusiveMinimum = true;
  }
  return Object.fromEntries(Object.entries(o).map(([k, v]) => [k, lower(v)]));
};

const prefix = "/api/v1";
const pathKey = (p: string) => (keepPrefix ? p : p.slice(prefix.length));
const paths: Record<string, Json> = {};
for (const op of OPERATIONS) {
  const original = full.paths[op.path]?.[op.method];
  if (!original)
    throw new Error(
      `Busabase no longer has ${op.method.toUpperCase()} ${op.path}; update OPERATIONS`,
    );
  const keep = ["parameters", "requestBody", "responses"] as const;
  const slim: Json = {
    operationId: op.id,
    summary: op.summary,
    description: op.description,
    tags: ["Busabase"],
  };
  for (const k of keep) if (original[k] !== undefined) slim[k] = original[k];
  const key = pathKey(op.path);
  paths[key] = { ...paths[key], [op.method]: slim };
}

// --- keep only the component schemas the kept operations can reach
const schemas = full.components.schemas;
const needed = new Set<string>();
const visit = (node: unknown) => {
  if (Array.isArray(node)) return node.forEach(visit);
  if (!node || typeof node !== "object") return;
  for (const [k, v] of Object.entries(node)) {
    if (k === "$ref" && typeof v === "string" && v.startsWith("#/components/schemas/")) {
      const name = v.split("/").pop() as string;
      if (!needed.has(name)) {
        needed.add(name);
        visit(schemas[name]);
      }
    } else visit(v);
  }
};
visit(paths);

const spec = lower({
  openapi: "3.0.3",
  info: {
    title: "Busabase API (Base44 subset)",
    version: String((full.info as Json).version ?? "1"),
    description:
      "The Busabase operations a Base44 app needs: read Bases and records, search, and create or update records. Writes are Change Requests: merged at once with a write-level API key, queued for review otherwise. Generated from " +
      `${source}/api/v1/openapi.json by scripts/build-openapi-subset.ts.`,
  },
  servers: [{ url: keepPrefix ? server : `${server}/api/v1`, description: "Your Busabase origin" }],
  tags: [{ name: "Busabase" }],
  paths,
  components: {
    schemas: Object.fromEntries([...needed].sort().map((n) => [n, schemas[n]])),
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        description:
          "Busabase API key. In Base44 it goes in the integration's Authorization header, not here.",
      },
    },
  },
  security: [{ bearerAuth: [] }],
}) as Json;

mkdirSync(out, { recursive: true });
writeFileSync(`${out}/busabase-openapi-subset.json`, `${JSON.stringify(spec, null, 2)}\n`);
writeFileSync(`${out}/busabase-openapi-subset.yaml`, stringify(spec, { lineWidth: 0 }));
console.log(`${OPERATIONS.length} operations, ${needed.size} schemas -> ${out}`);
