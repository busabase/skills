import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { test } from "node:test";
import { hmacSha256Hex, verifyBusabaseSignature } from "../base44/shared/signature.ts";
import { syncEntityRecord } from "../base44/shared/sync.ts";
import { handleBusabaseWebhook } from "../base44/shared/webhook.ts";
import { makeDeps } from "./helpers.ts";

const SECRET = "whsec_test";
const order = {
  id: "o1",
  order_number: "A-1",
  customer_name: "Ada",
  status: "new",
  total: 12.5,
  notes: "",
};

const payload = (fields: Record<string, unknown>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    event: "record.updated",
    recordId: "rec_1",
    baseId: "bse_orders",
    changeRequestId: "crq_1",
    fields,
    ...extra,
  });

// Same construction as Busabase's dispatcher (packages/busabase-core/.../webhook/logic/dispatch.ts):
// HMAC-SHA256 over the raw body, hex, sent as X-Busabase-Signature.
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("hex");

test("signature check matches Node's HMAC and rejects tampering, missing headers and wrong secrets", async () => {
  const body = payload({ status: "paid" });
  assert.equal(await hmacSha256Hex(SECRET, body), sign(body));
  assert.equal(await verifyBusabaseSignature(body, sign(body), SECRET), true);
  assert.equal(await verifyBusabaseSignature(`${body} `, sign(body), SECRET), false);
  assert.equal(await verifyBusabaseSignature(body, null, SECRET), false);
  assert.equal(await verifyBusabaseSignature(body, sign(body), "other"), false);
  assert.equal(await verifyBusabaseSignature(body, "abc", SECRET), false);
});

test("unsigned or wrongly signed requests are refused and write nothing", async () => {
  const { deps, orders } = makeDeps();
  orders.seed(order);
  const body = payload({ base44_id: "o1", status: "paid" });
  assert.equal(
    (await handleBusabaseWebhook(deps, { rawBody: body, signature: null, secret: SECRET })).status,
    401,
  );
  assert.equal(
    (await handleBusabaseWebhook(deps, { rawBody: body, signature: "00", secret: SECRET })).status,
    401,
  );
  assert.equal(orders.writes.length, 0);
});

test("an unset secret fails closed instead of accepting everything", async () => {
  const { deps } = makeDeps();
  const body = payload({});
  assert.equal(
    (await handleBusabaseWebhook(deps, { rawBody: body, signature: sign(body), secret: undefined }))
      .status,
    500,
  );
});

test("a Busabase edit is written back, a replay is a no-op, and the follow-up sync stops", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  const callsAfterSync = busabase.calls.length;

  const body = payload({ base44_id: "o1", status: "shipped", notes: "left at door", total: 999 });
  const applied = await handleBusabaseWebhook(deps, {
    rawBody: body,
    signature: sign(body),
    secret: SECRET,
  });
  assert.equal(applied.status, 200);
  assert.deepEqual(applied.body.applied, ["status", "notes"]);
  const row = await orders.get("o1");
  assert.equal(row.status, "shipped");
  assert.equal(row.notes, "left at door");
  assert.equal(row.total, 12.5, "total is not in writeBack, so Busabase cannot change it");

  const replay = await handleBusabaseWebhook(deps, {
    rawBody: body,
    signature: sign(body),
    secret: SECRET,
  });
  assert.deepEqual(replay.body, { ok: true, ignored: "already in sync" });

  // The entity update fires the sync workflow in Base44; it must not bounce the change back.
  const echo = await syncEntityRecord(deps, {
    entity: "Order",
    entityId: "o1",
    eventType: "update",
  });
  assert.equal(echo.status, "unchanged");
  assert.equal(busabase.calls.length, callsAfterSync, "no Busabase call for the echo");
});

test("records without a Base44 id, other events and unmapped Bases are ignored", async () => {
  const { deps, orders } = makeDeps();
  orders.seed(order);
  const run = (body: string) =>
    handleBusabaseWebhook(deps, { rawBody: body, signature: sign(body), secret: SECRET });
  assert.match(String((await run(payload({ status: "paid" }))).body.ignored), /no Base44 id/);
  assert.match(
    String((await run(payload({ base44_id: "o1" }, { event: "ai_mention" }))).body.ignored),
    /event/,
  );
  assert.match(
    String(
      (await run(payload({ base44_id: "o1", status: "paid" }, { baseId: "bse_other" }))).body
        .ignored,
    ),
    /no mapping/,
  );
  assert.match(
    String((await run(payload({ base44_id: "gone", status: "paid" }))).body.ignored),
    /no longer exists/,
  );
  assert.equal(orders.writes.length, 0);
});
