import assert from "node:assert/strict";
import { test } from "node:test";
import { BusabaseError } from "../base44/shared/busabase-client.ts";
import { ConfigError, reconcile, retryFailed, syncEntityRecord } from "../base44/shared/sync.ts";
import { makeDeps, ORDER_MAPPING } from "./helpers.ts";

const order = {
  id: "o1",
  order_number: "A-1",
  customer_name: "Ada",
  status: "new",
  total: 12.5,
  notes: "hi",
};

test("a new Order is created in Busabase with the Base44 id as the dedupe key", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  const out = await syncEntityRecord(deps, {
    entity: "Order",
    entityId: "o1",
    eventType: "create",
  });
  assert.equal(out.status, "created");
  const rec = [...busabase.records.values()][0];
  assert.deepEqual(rec.payload, {
    order_number: "A-1",
    customer: "Ada",
    status: "new",
    total: 12.5,
    notes: "hi",
    base44_id: "o1",
  });
  const row = [...state.rows.values()][0];
  assert.equal(row.status, "synced");
  assert.equal(row.busabase_record_id, rec.id);
});

test("the same event twice makes no second Busabase call", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  const before = busabase.calls.length;
  const again = await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  assert.equal(again.status, "unchanged");
  assert.equal(busabase.calls.length, before);
});

test("an edit updates the existing Busabase record instead of creating another", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  orders.seed({ ...order, status: "paid" });
  const out = await syncEntityRecord(deps, {
    entity: "Order",
    entityId: "o1",
    eventType: "update",
  });
  assert.equal(out.status, "updated");
  assert.equal(busabase.records.size, 1);
  assert.equal([...busabase.records.values()][0].payload.status, "paid");
});

test("losing the state row does not duplicate: the record is found by its Base44 id", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  state.rows.clear();
  const out = await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  assert.equal(out.status, "unchanged");
  assert.equal(busabase.records.size, 1);
  assert.equal(busabase.count("create"), 1);
});

test("a transient failure is stored, then retried without making a duplicate", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  busabase.failNextWrite = new BusabaseError("Busabase POST failed: HTTP 503", 503, true);
  const out = await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  assert.equal(out.status, "failed");
  const row = [...state.rows.values()][0];
  assert.equal(row.status, "failed");
  assert.equal(row.attempts, 1);
  assert.match(String(row.last_error), /503/);

  const retried = await retryFailed(deps);
  assert.deepEqual(retried.results, { created: 1 });
  assert.equal(busabase.records.size, 1);
  assert.equal([...state.rows.values()][0].status, "synced");
});

test("a permanent failure stops being retried", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  busabase.failNextWrite = new BusabaseError("Busabase POST failed: Invalid fields", 400, false);
  await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  const retried = await retryFailed(deps);
  assert.equal(retried.scanned, 0, "attempts is parked at the maximum, so the schedule skips it");
  assert.equal([...state.rows.values()][0].status, "failed");
});

test("a write waiting for review is pending, and settles once a reviewer merges it", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  busabase.holdForReview = true;
  const out = await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  assert.equal(out.status, "pending_review");
  assert.equal([...state.rows.values()][0].status, "pending_review");

  busabase.approvePending();
  const settled = await retryFailed(deps);
  assert.deepEqual(settled.results, { unchanged: 1 });
  assert.equal([...state.rows.values()][0].status, "synced");
  assert.equal(busabase.count("update"), 0, "identical content needs no extra change request");
});

test("deletes and unmapped entities are skipped, a placeholder Base id is a loud config error", async () => {
  const { deps, orders } = makeDeps();
  orders.seed(order);
  assert.equal(
    (await syncEntityRecord(deps, { entity: "Order", entityId: "o1", eventType: "delete" })).status,
    "skipped",
  );
  assert.equal((await syncEntityRecord(deps, { entity: "Nope", entityId: "x" })).status, "skipped");
  const placeholder = makeDeps([{ ...ORDER_MAPPING, base: "REPLACE_WITH_ORDERS_BASE_ID" }]);
  placeholder.orders.seed(order);
  await assert.rejects(
    syncEntityRecord(placeholder.deps, { entity: "Order", entityId: "o1" }),
    ConfigError,
  );
});

test("reconcile catches records written in bulk (which never fire workflows)", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  orders.seed({ ...order, id: "o2", order_number: "A-2" });
  const out = await reconcile(deps, { sinceMinutes: 60 });
  assert.equal(out.scanned, 2);
  assert.deepEqual(out.results, { created: 2 });
  assert.equal(busabase.records.size, 2);
  const second = await reconcile(deps, { sinceMinutes: 60 });
  assert.deepEqual(second.results, { unchanged: 2 });
});

test("an idempotent retry that returns only a merged Change Request still links the record", async () => {
  const { deps, orders, busabase, state } = makeDeps();
  orders.seed(order);
  // Busabase already holds the record from an earlier create, but the first lookup misses it
  // (the state is gone and the lookup raced). The create is then answered from the idempotency
  // key: a merged Change Request without the record id, exactly as the real server does.
  busabase.records.set("rec_existing", {
    id: "rec_existing",
    baseId: "bse_orders",
    payload: { base44_id: "o1" },
  });
  let lookups = 0;
  const realFind = busabase.findRecordBySource.bind(busabase);
  busabase.findRecordBySource = async (...args) => (lookups++ === 0 ? null : realFind(...args));
  busabase.createRecord = async () => ({
    landed: true,
    changeRequestId: "crq_1",
    changeRequestStatus: "merged",
  });

  const out = await syncEntityRecord(deps, { entity: "Order", entityId: "o1" });
  assert.deepEqual(out, { status: "created", recordId: "rec_existing" });
  const row = [...state.rows.values()][0];
  assert.equal(row.status, "synced");
  assert.equal(row.busabase_record_id, "rec_existing");
});
