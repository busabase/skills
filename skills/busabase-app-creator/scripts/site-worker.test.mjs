import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const config = {
  permissions: { read_procedures: ["records.list", "records.count", "records.get"] },
  appSlug: "catalogue",
  schema: {
    bases: [
      { key: "products", baseId: "base-products", readLimit: 500, fields: [{ slug: "name" }] },
    ],
  },
};
const source = (
  await readFile(new URL("../assets/airapp-template/site-worker.js", import.meta.url), "utf8")
)
  .replace(/^import .*;$/gm, "")
  .replace("export default createSiteWorker();", "")
  .replace("config = appConfig, makeClient = createBusabaseClient", "config, makeClient");
const { createSiteWorker } = await import(
  `data:text/javascript,${encodeURIComponent(`const airAppRecordFields = record => record.fields; const createAirAppRecords = client => ({ readPage: client.readPage });\n${source}`)}`
);

function fixture() {
  const calls = [];
  const client = {
    records: {
      get: async ({ recordId }) => ({
        id: recordId,
        baseId: recordId === "foreign" ? "another-base" : "base-products",
        fields: { name: "Public", secret: "private" },
        internal: "hidden",
      }),
      count: async (input) => {
        calls.push(input);
        return { total: 3 };
      },
    },
    readPage: async (input) => {
      calls.push(input);
      return {
        records: [{ id: "one", fields: { name: "Public", secret: "private" } }],
        nextCursor: "next",
      };
    },
  };
  const worker = createSiteWorker(config, () => client);
  const env = { BUSABASE_API_KEY: "test-key", ASSETS: { fetch: () => new Response("asset") } };
  return {
    calls,
    fetch: (path, method = "GET") =>
      worker.fetch(new Request(`https://example.test${path}`, { method }), env),
  };
}

test("site Worker bounds pages and strips undeclared fields and metadata", async () => {
  const f = fixture();
  const response = await f.fetch("/site/page/products?limit=9999&baseId=foreign&cursor=next");
  const body = await response.json();
  assert.deepEqual(f.calls, [{ baseId: "base-products", limit: 50, cursor: "next" }]);
  assert.deepEqual(body.records, [{ id: "one", baseKey: "products", fields: { name: "Public" } }]);
  assert.equal(JSON.stringify(body).includes("test-key"), false);
});

test("site Worker rejects cross-base records, arbitrary API paths and writes", async () => {
  const f = fixture();
  assert.equal((await f.fetch("/site/record/products/foreign")).status, 404);
  assert.equal((await f.fetch("/site/page/foreign")).status, 404);
  assert.equal((await f.fetch("/api/v1/records")).status, 404);
  assert.equal((await f.fetch("/auth/status")).status, 404);
  assert.equal((await f.fetch("/site/page/products", "POST")).status, 405);
  assert.equal(f.calls.length, 0);
  assert.deepEqual(await (await f.fetch("/site/record/products/one")).json(), {
    id: "one",
    baseKey: "products",
    fields: { name: "Public" },
  });
});

test("site Worker exposes runtime and serves assets without credentials", async () => {
  const f = fixture();
  const runtime = await (await f.fetch("/__airapp/runtime")).json();
  assert.equal(runtime.runtime, "site");
  assert.equal(runtime.hosted, true);
  assert.equal(await (await f.fetch("/index.html")).text(), "asset");
});

test("site Worker honors blueprint read permissions", async () => {
  const worker = createSiteWorker({ ...config, permissions: { read_procedures: [] } }, () => {
    throw new Error("must not create client");
  });
  for (const route of ["page/products", "count/products", "record/products/one"]) {
    const response = await worker.fetch(new Request(`https://example.test/site/${route}`), {});
    assert.equal(response.status, 403);
  }
});
