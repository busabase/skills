import assert from "node:assert/strict";
import { test } from "node:test";
import { handleSyncRequest } from "../base44/shared/sync-request.ts";
import { makeDeps } from "./helpers.ts";

const order = {
  id: "o1",
  order_number: "A-1",
  customer_name: "Ada",
  status: "new",
  total: 1,
  notes: "",
};

test("the workflow step's args sync one record", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  const res = await handleSyncRequest(deps, {
    entity: "Order",
    entity_id: "o1",
    event_type: "create",
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.outcome, {
    status: "created",
    recordId: [...busabase.records.keys()][0],
  });
});

test("a sync failure is reported in the body with HTTP 200, so the workflow run is not marked failed", async () => {
  const { deps, orders, busabase } = makeDeps();
  orders.seed(order);
  busabase.failNextWrite = new Error("boom");
  const res = await handleSyncRequest(deps, { entity: "Order", entity_id: "o1" });
  assert.equal(res.status, 200);
  assert.equal(res.body.ok, false);
});

test("bad args get a 400 that lists the keys received (to debug a wrong workflow mapping)", async () => {
  const { deps } = makeDeps();
  const res = await handleSyncRequest(deps, { args: { entity: "Order" }, foo: 1 });
  assert.equal(res.status, 400);
  assert.deepEqual(res.body.received_keys, ["args", "foo"]);
  assert.equal((await handleSyncRequest(deps, null)).status, 400);
});

test("retry and reconcile modes run", async () => {
  const { deps, orders } = makeDeps();
  orders.seed(order);
  const reconciled = await handleSyncRequest(deps, { mode: "reconcile", since_minutes: 60 });
  assert.equal(reconciled.body.scanned, 1);
  assert.equal((await handleSyncRequest(deps, { mode: "retry" })).status, 200);
});
