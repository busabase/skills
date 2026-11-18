// Runs the kit's real Busabase client and webhook receiver against a REAL Busabase server, with
// only the Base44 side faked in memory (Base44 needs an account, see docs/test-record.md).
//
//   BUSABASE_URL=http://127.0.0.1:15561 [BUSABASE_API_KEY=… BUSABASE_SPACE_ID=…] \
//   RECEIVER_PORT=15562 node scripts/verify-local-busabase.ts
//
// For webhook delivery to a local receiver the Busabase server itself must be started with
// VITEST=1 BUSABASE_WEBHOOK_TEST_ALLOW_TARGETS=127.0.0.1:<RECEIVER_PORT> (its SSRF guard blocks
// loopback otherwise; that is Busabase's own test hook). Against a hosted space, point
// RECEIVER_URL at a public URL instead.
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createBusabaseClient } from "../base44/shared/busabase-client.ts";
import { syncEntityRecord } from "../base44/shared/sync.ts";
import type { EntityMapping, SyncDeps } from "../base44/shared/types.ts";
import { handleBusabaseWebhook } from "../base44/shared/webhook.ts";
import { FakeEntity, silentLog } from "../tests/helpers.ts";

const BASE_URL = process.env.BUSABASE_URL ?? "http://127.0.0.1:15561";
const API_KEY = process.env.BUSABASE_API_KEY ?? "local-no-key-needed";
const SPACE = process.env.BUSABASE_SPACE_ID;
const PORT = Number(process.env.RECEIVER_PORT ?? 15562);
const RECEIVER_URL = process.env.RECEIVER_URL ?? `http://127.0.0.1:${PORT}/hook`;
const SECRET = `whsec_${Math.random().toString(36).slice(2)}`;
const suffix = Date.now().toString(36);

const headers: Record<string, string> = {
  authorization: `Bearer ${API_KEY}`,
  "content-type": "application/json",
};
if (SPACE) headers["x-busabase-space"] = SPACE;
const api = async (method: string, path: string, body?: unknown) => {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
};
const step = (n: string) => console.log(`\n== ${n}`);
const waitFor = async (what: string, fn: () => boolean | Promise<boolean>, ms = 15000) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    if (await fn()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`timed out waiting for: ${what}`);
};

// --- a Busabase Base shaped like the README's recommended Orders layout
step("create the Orders Base in Busabase");
const choices = ["new", "paid", "shipped", "cancelled"].map((name) => ({ id: name, name }));
const base = await api("POST", "/api/v1/bases", {
  slug: `orders-${suffix}`,
  name: `Base44 Orders ${suffix}`,
  fields: [
    { slug: "base44_id", name: "Base44 ID", type: "text" },
    { slug: "order_number", name: "Order number", type: "text", required: true },
    { slug: "customer", name: "Customer", type: "text" },
    { slug: "status", name: "Status", type: "select", options: { choices } },
    { slug: "total", name: "Total", type: "number" },
    { slug: "notes", name: "Notes", type: "longtext" },
  ],
});
const baseId: string = base.base?.id ?? base.id;
console.log("base id:", baseId);

const mapping: EntityMapping = {
  entity: "Order",
  base: baseId,
  sourceIdField: "base44_id",
  fields: {
    order_number: "order_number",
    customer_name: "customer",
    status: "status",
    total: "total",
    notes: "notes",
  },
  writeBack: ["status", "notes"],
};

// --- fake Base44, real everything else
const orders = new FakeEntity("ord");
const state = new FakeEntity("st");
const apiCalls: string[] = [];
const countingFetch: typeof fetch = (input, init) => {
  apiCalls.push(`${init?.method ?? "GET"} ${new URL(String(input)).pathname}`);
  return fetch(input, init);
};
const deps: SyncDeps = {
  entities: { Order: orders, BusabaseSyncState: state },
  busabase: createBusabaseClient({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    spaceId: SPACE,
    fetchImpl: countingFetch,
  }),
  mappings: [mapping],
  log: silentLog,
};

// --- the receiver: the kit's real webhook handler behind a real HTTP socket
const deliveries: { signature: string | null; result: unknown }[] = [];
const receiver = createServer(async (req, res) => {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  const rawBody = Buffer.concat(chunks).toString("utf8");
  const signature = req.headers["x-busabase-signature"] as string | undefined;
  const result = await handleBusabaseWebhook(deps, {
    rawBody,
    signature: signature ?? null,
    secret: SECRET,
  });
  deliveries.push({ signature: signature ?? null, result: result.body });
  res
    .writeHead(result.status, { "content-type": "application/json" })
    .end(JSON.stringify(result.body));
});
await new Promise<void>((resolve) => receiver.listen(PORT, "127.0.0.1", resolve));

step("register a record.updated webhook rule pointing at the receiver");
const rule = await api("POST", "/api/v1/webhooks", {
  name: `base44-kit-${suffix}`,
  eventType: "record.updated",
  baseId,
  enabled: true,
  actionKind: "webhook",
  config: { targetUrl: RECEIVER_URL, secret: SECRET },
});
console.log("rule id:", rule.id);

try {
  step("1. new Order in Base44 -> record appears in Busabase");
  orders.seed({
    id: "o1",
    order_number: "A-1001",
    customer_name: "Ada",
    status: "new",
    total: 42.5,
    notes: "",
  });
  const created = await syncEntityRecord(deps, {
    entity: "Order",
    entityId: "o1",
    eventType: "create",
  });
  console.log("outcome:", created);
  assert.equal(created.status, "created");
  const listed = await api("GET", `/api/v1/records?baseId=${baseId}`);
  assert.equal(listed.records.length, 1);
  const recordId: string = listed.records[0].id;
  console.log("stored fields:", listed.records[0].headCommit.payload);
  assert.equal(listed.records[0].headCommit.payload.base44_id, "o1");

  step("2. same event again -> deduped, no second record, no write call");
  const writesBefore = apiCalls.filter((c) => c.startsWith("POST")).length;
  assert.equal(
    (await syncEntityRecord(deps, { entity: "Order", entityId: "o1", eventType: "update" })).status,
    "unchanged",
  );
  assert.equal(apiCalls.filter((c) => c.startsWith("POST")).length, writesBefore);

  step("3. state lost -> found by Base44 id, still one record");
  state.rows.clear();
  assert.equal(
    (await syncEntityRecord(deps, { entity: "Order", entityId: "o1" })).status,
    "unchanged",
  );
  assert.equal((await api("GET", `/api/v1/records?baseId=${baseId}`)).records.length, 1);

  step("4. create with the same idempotency key twice -> one record");
  const k = { idempotencyKey: `base44:Order:dup-${suffix}`, message: "idempotency probe" };
  const a = await deps.busabase.createRecord(
    baseId,
    { order_number: "A-DUP", base44_id: "dup" },
    k,
  );
  const b = await deps.busabase.createRecord(
    baseId,
    { order_number: "A-DUP", base44_id: "dup" },
    k,
  );
  console.log("first:", a, "retry:", b);
  assert.equal(
    (await api("GET", `/api/v1/records?baseId=${baseId}`)).records.filter(
      (r: { headCommit: { payload: { base44_id?: string } } }) =>
        r.headCommit.payload.base44_id === "dup",
    ).length,
    1,
  );

  step("5. edit in Busabase -> signed webhook -> Base44 Order updated");
  await api("POST", `/api/v1/records/${recordId}/change-requests`, {
    operation: "update",
    fields: { status: "paid", notes: "paid by card" },
    message: "verify-local: edit in Busabase",
    submittedBy: "verify-local",
  });
  await waitFor(
    "webhook to write status back",
    async () => (await orders.get("o1")).status === "paid",
  );
  const delivered = deliveries.find((d) => (d.result as { applied?: string[] }).applied);
  console.log("delivery:", JSON.stringify(delivered));
  assert.match(String(delivered?.signature), /^[0-9a-f]{64}$/);
  assert.equal((await orders.get("o1")).notes, "paid by card");

  step("6. the workflow echo of that write-back is a no-op");
  const before = apiCalls.length;
  assert.equal(
    (await syncEntityRecord(deps, { entity: "Order", entityId: "o1", eventType: "update" })).status,
    "unchanged",
  );
  assert.equal(apiCalls.length, before, "no Busabase call at all");

  step("7. edit total in Base44 -> Busabase updated; resulting webhook is ignored (no ping-pong)");
  const deliveriesBefore = deliveries.length;
  orders.seed({ ...(await orders.get("o1")), total: 99 });
  assert.equal(
    (await syncEntityRecord(deps, { entity: "Order", entityId: "o1", eventType: "update" })).status,
    "updated",
  );
  const after = await api("GET", `/api/v1/records/get?recordId=${recordId}`);
  assert.equal(after.headCommit.payload.total, 99);
  await waitFor("webhook for the Base44-origin update", () => deliveries.length > deliveriesBefore);
  assert.deepEqual(deliveries.at(-1)?.result, { ok: true, ignored: "already in sync" });
  assert.equal((await orders.get("o1")).total, 99);

  step("8. a forged request (no / wrong signature) is refused");
  for (const sig of [undefined, "0".repeat(64)]) {
    const res = await fetch(RECEIVER_URL, {
      method: "POST",
      headers: sig ? { "x-busabase-signature": sig } : {},
      body: JSON.stringify({
        event: "record.updated",
        baseId,
        fields: { base44_id: "o1", status: "cancelled" },
      }),
    });
    assert.equal(res.status, 401);
  }
  assert.equal((await orders.get("o1")).status, "paid");

  console.log("\nALL CHECKS PASSED");
  console.log("Busabase calls made:", apiCalls.length);
} finally {
  await api("DELETE", `/api/v1/webhooks/${rule.id}`).catch(() => undefined);
  receiver.close();
}
