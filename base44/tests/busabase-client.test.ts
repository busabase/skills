import assert from "node:assert/strict";
import { test } from "node:test";
import { type BusabaseError, createBusabaseClient } from "../base44/shared/busabase-client.ts";

type Call = { url: string; init: RequestInit };
const scripted = (responses: Array<Response | Error>) => {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses.shift();
    if (!next) throw new Error("no scripted response left");
    if (next instanceof Error) throw next;
    return next;
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
};
const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

const make = (responses: Array<Response | Error>) => {
  const { calls, fetchImpl } = scripted(responses);
  const sleeps: number[] = [];
  const client = createBusabaseClient({
    baseUrl: "https://busabase.example/",
    apiKey: "bb_secret_key",
    spaceId: "spc_1",
    fetchImpl,
    sleep: async (ms) => void sleeps.push(ms),
  });
  return { client, calls, sleeps };
};

test("sends the bearer key and space header, and builds the lookup query", async () => {
  const { client, calls } = make([json({ id: "rec_1", baseId: "bse_1" })]);
  const rec = await client.findRecordBySource("bse_1", "base44_id", "o 1");
  assert.equal(rec?.id, "rec_1");
  assert.equal(
    calls[0].url,
    "https://busabase.example/api/v1/records/get?baseId=bse_1&fieldSlug=base44_id&valueText=o+1",
  );
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers.authorization, "Bearer bb_secret_key");
  assert.equal(headers["x-busabase-space"], "spc_1");
});

test("a 404 lookup means 'not there yet', not an error", async () => {
  const { client, calls } = make([json({ error: "not found" }, 404)]);
  assert.equal(await client.findRecordBySource("bse_1", "base44_id", "x"), null);
  assert.equal(calls.length, 1);
});

test("create sends the idempotency key and tells a merged record from a pending change request", async () => {
  const merged = make([json({ id: "rec_9", headCommitId: "cmt_1", materialized: true })]);
  const a = await merged.client.createRecord(
    "bse_1",
    { title: "t" },
    { idempotencyKey: "base44:Order:o1", message: "m" },
  );
  assert.deepEqual(a, { landed: true, recordId: "rec_9" });
  const sent = JSON.parse(String(merged.calls[0].init.body));
  assert.equal(sent.idempotencyKey, "base44:Order:o1");
  assert.equal(merged.calls[0].url, "https://busabase.example/api/v1/bases/bse_1/change-requests");

  const pending = make([json({ id: "crq_1", status: "in_review", materialized: false })]);
  const b = await pending.client.createRecord("bse_1", {}, { idempotencyKey: "k", message: "m" });
  assert.deepEqual(b, {
    landed: false,
    changeRequestId: "crq_1",
    changeRequestStatus: "in_review",
  });
});

test("retries 503 and network errors with backoff, honours Retry-After, then succeeds", async () => {
  const { client, calls, sleeps } = make([
    json({ error: "boom" }, 503),
    new Error("socket hang up"),
    json({ id: "rec_1", headCommitId: "c", materialized: true }),
  ]);
  const out = await client.updateRecord("rec_1", { status: "paid" }, { message: "m" });
  assert.equal(out.landed, true);
  assert.equal(calls.length, 3);
  assert.deepEqual(sleeps, [300, 900]);

  const limited = make([
    json({ error: "slow down" }, 429, { "retry-after": "2" }),
    json({ id: "r", headCommitId: "c", materialized: true }),
  ]);
  await limited.client.updateRecord("r", {}, { message: "m" });
  assert.deepEqual(limited.sleeps, [2000]);
});

test("gives up after three attempts, never retries a 400, and never leaks the body or the key", async () => {
  const down = make([
    json({ error: "x" }, 502),
    json({ error: "x" }, 502),
    json({ error: "x" }, 502),
  ]);
  await assert.rejects(
    down.client.updateRecord("r", {}, { message: "m" }),
    (e: BusabaseError) => e.retryable && e.status === 502,
  );
  assert.equal(down.calls.length, 3);

  const bad = make([json({ error: "Invalid fields", secretRecordData: "PII" }, 400)]);
  await assert.rejects(
    bad.client.createRecord("b", {}, { idempotencyKey: "k", message: "m" }),
    (e: BusabaseError) => {
      assert.equal(e.retryable, false);
      assert.doesNotMatch(e.message, /PII|bb_secret_key/);
      return true;
    },
  );
  assert.equal(bad.calls.length, 1);
});
