import { BusabaseError } from "../base44/shared/busabase-client.ts";
import type {
  BusabaseApi,
  BusabaseRecord,
  EntityHandler,
  EntityMap,
  EntityMapping,
  JsonObject,
  Logger,
  SyncDeps,
  WriteResult,
} from "../base44/shared/types.ts";

export const ORDER_MAPPING: EntityMapping = {
  entity: "Order",
  base: "bse_orders",
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

const matches = (item: JsonObject, query: JsonObject): boolean =>
  Object.entries(query).every(([key, cond]) => {
    const value = item[key];
    if (cond && typeof cond === "object") {
      const c = cond as JsonObject;
      if ("$in" in c) return (c.$in as unknown[]).includes(value);
      if ("$lt" in c) return Number(value ?? 0) < Number(c.$lt);
      if ("$gte" in c) return String(value ?? "") >= String(c.$gte);
    }
    return value === cond;
  });

/** In-memory stand-in for `base44.asServiceRole.entities.<Name>`. */
export class FakeEntity implements EntityHandler {
  rows = new Map<string, JsonObject>();
  writes: { op: "create" | "update"; id: string; data: JsonObject }[] = [];
  private seq = 0;
  private readonly prefix: string;
  constructor(prefix: string) {
    this.prefix = prefix;
  }

  seed(row: JsonObject) {
    this.rows.set(String(row.id), { updated_date: new Date().toISOString(), ...row });
  }
  async get(id: string) {
    const row = this.rows.get(id);
    if (!row) throw Object.assign(new Error("Entity not found"), { status: 404 });
    return { ...row };
  }
  async filter(query: JsonObject, options?: { limit?: number }) {
    const items = [...this.rows.values()]
      .filter((r) => matches(r, query))
      .slice(0, options?.limit ?? 100);
    return { items: items.map((r) => ({ ...r })), has_more: false, next_cursor: null };
  }
  async create(data: JsonObject) {
    const id = `${this.prefix}_${++this.seq}`;
    this.rows.set(id, { id, updated_date: new Date().toISOString(), ...data });
    this.writes.push({ op: "create", id, data });
    return { id, ...data };
  }
  async update(id: string, data: JsonObject) {
    const row = this.rows.get(id);
    if (!row) throw Object.assign(new Error("Entity not found"), { status: 404 });
    this.rows.set(id, { ...row, ...data, updated_date: new Date().toISOString() });
    this.writes.push({ op: "update", id, data });
    return { ...row, ...data };
  }
}

/** Mimics the slice of Busabase this kit calls, including create idempotency by key. */
export class FakeBusabase implements BusabaseApi {
  records = new Map<string, { id: string; baseId: string; payload: JsonObject }>();
  calls: string[] = [];
  /** Throw this once on the next write. */
  failNextWrite: Error | null = null;
  /** Writes wait for review instead of merging. */
  holdForReview = false;
  private keys = new Map<string, WriteResult>();
  private seq = 0;

  private asRecord(r: { id: string; payload: JsonObject }): BusabaseRecord {
    return { id: r.id, headCommit: { payload: { ...r.payload } } };
  }
  async findRecordBySource(baseId: string, slug: string, value: string) {
    this.calls.push("find");
    const hit = [...this.records.values()].find(
      (r) => r.baseId === baseId && r.payload[slug] === value,
    );
    return hit ? this.asRecord(hit) : null;
  }
  async createRecord(baseId: string, fields: JsonObject, options: { idempotencyKey: string }) {
    this.calls.push("create");
    if (this.failNextWrite) {
      const e = this.failNextWrite;
      this.failNextWrite = null;
      throw e;
    }
    const prior = this.keys.get(options.idempotencyKey);
    if (prior) return prior;
    const id = `rec_${++this.seq}`;
    let result: WriteResult;
    if (this.holdForReview) {
      result = { landed: false, changeRequestId: `crq_${id}`, changeRequestStatus: "in_review" };
      this.pending = { id, baseId, payload: { ...fields } };
    } else {
      this.records.set(id, { id, baseId, payload: { ...fields } });
      result = { landed: true, recordId: id };
    }
    this.keys.set(options.idempotencyKey, result);
    return result;
  }
  pending: { id: string; baseId: string; payload: JsonObject } | null = null;
  approvePending() {
    if (this.pending) this.records.set(this.pending.id, this.pending);
    this.pending = null;
  }
  async updateRecord(recordId: string, fields: JsonObject) {
    this.calls.push("update");
    if (this.failNextWrite) {
      const e = this.failNextWrite;
      this.failNextWrite = null;
      throw e;
    }
    const rec = this.records.get(recordId);
    if (!rec) throw new BusabaseError(`Busabase record ${recordId} not found`, 404, false);
    rec.payload = { ...rec.payload, ...fields };
    return { landed: true, recordId } as WriteResult;
  }
  count(call: string) {
    return this.calls.filter((c) => c === call).length;
  }
}

export const silentLog: Logger & { events: string[] } = {
  events: [],
  info(event) {
    this.events.push(event);
  },
  error(event) {
    this.events.push(`error:${event}`);
  },
};

export const makeDeps = (mappings: EntityMapping[] = [ORDER_MAPPING]) => {
  const orders = new FakeEntity("ord");
  const state = new FakeEntity("st");
  const busabase = new FakeBusabase();
  const entities: EntityMap = { Order: orders, BusabaseSyncState: state };
  const deps: SyncDeps = { entities, busabase, mappings, log: silentLog };
  return { deps, orders, state, busabase };
};
