import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";

type Json = Record<string, unknown>;
const json = JSON.parse(
  readFileSync(new URL("../openapi/busabase-openapi-subset.json", import.meta.url), "utf8"),
) as Json;
const yaml = parse(
  readFileSync(new URL("../openapi/busabase-openapi-subset.yaml", import.meta.url), "utf8"),
) as Json;

test("the YAML and JSON files describe the same spec", () => {
  assert.deepEqual(yaml, json);
});

test("it fits a Base44 custom integration: 3.0.3, at most 30 operations, unique operationIds", () => {
  assert.equal(json.openapi, "3.0.3");
  const ops = Object.entries(json.paths as Record<string, Json>).flatMap(([path, item]) =>
    Object.entries(item).map(([method, op]) => ({
      key: `${method}:${path}`,
      id: (op as Json).operationId,
    })),
  );
  assert.ok(ops.length > 0 && ops.length <= 30, `${ops.length} operations`);
  assert.equal(new Set(ops.map((o) => o.id)).size, ops.length);
  // the keys are what apps pass to custom.call(), and what docs/import-guide.md lists
  assert.ok(ops.some((o) => o.key === "post:/bases/{baseId}/change-requests"));
  assert.ok(ops.some((o) => o.key === "get:/records/get"));
});

test("every $ref resolves, and no 3.1-only keyword is left", () => {
  const schemas = (json.components as { schemas: Json }).schemas;
  const text = JSON.stringify(json);
  for (const [, ref] of text.matchAll(/"\$ref":"#\/components\/schemas\/([^"]+)"/g)) {
    assert.ok(ref in schemas, `unresolved ${ref}`);
  }
  assert.doesNotMatch(text, /"const":|"type":"null"|"propertyNames":/);
});

test("the credential is never part of the spec", () => {
  const servers = (json.servers as { url: string }[]).map((s) => s.url);
  assert.deepEqual(servers, ["https://busabase.com/api/v1"]);
  assert.doesNotMatch(JSON.stringify(json), /bb_[A-Za-z0-9]{10,}|Bearer [A-Za-z0-9]/);
});
