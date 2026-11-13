import { airAppRecordFields, createAirAppRecords } from "../../vendor/busabase-airapp.js";
import { createRuntimeClient } from "../busabase-client.js";
import { appConfig } from "../config.js";

const allowedReads = new Set(appConfig.permissions.read_procedures);
const allowedWrites = new Set(appConfig.permissions.change_request_procedures);

const requireProcedure = (procedure, allowed = allowedReads) => {
  if (!allowed.has(procedure)) throw new Error(`PROCEDURE_DENIED: ${procedure}`);
};

const PENDING_CHANGE_REQUEST_LIMIT = 20;
const PENDING_STATUSES = ["in_review", "changes_requested", "approved", "conflict"];

// The record plumbing is the SDK's (`createAirAppRecords`, busabase-sdk/airapp):
// one page per call, `fields` already pulled out of the head commit, and writes
// that never pass `autoMerge`. This provider keeps only what is the app's own:
// which procedures it allows itself and how a record maps onto the UI's row
// shape (a `baseKey` tag).
const withBaseKey = (record, baseKey) => ({ ...record, baseKey });

// One page per call, cursor returned to the caller -- never several pages in
// one function call. See "Reading Records At Scale" in
// references/runtime-and-sdk.md: a capped loop here (however high the cap)
// would still hide a multi-page scan behind a single loading state instead of
// fetching a page per user action.
const readPage = async (records, base, cursor) => {
  requireProcedure("records.list");
  const page = await records.readPage({
    baseId: base.baseId,
    limit: base.readLimit,
    cursor,
  });
  return {
    records: page.records.map((record) => withBaseKey(record, base.key)),
    nextCursor: page.nextCursor,
    limit: base.readLimit,
  };
};

// A real, exact total for a Base -- never `records.length` from whatever has
// been loaded so far. Returns null (not 0) on denial/failure so the UI can
// fall back to an honest "12+" style approximation instead of a made-up
// total.
const countRecords = async (client, base) => {
  if (!allowedReads.has("records.count")) return null;
  try {
    const { total } = await client.records.count({ baseId: base.baseId });
    return total;
  } catch {
    return null;
  }
};

const readChangeRequests = async (client) => {
  if (!allowedReads.has("changeRequests.list")) {
    return {
      changeRequests: [],
      changeRequestPageInfo: { nextCursor: null, limit: PENDING_CHANGE_REQUEST_LIMIT },
    };
  }
  const page = await client.changeRequests.list({
    limit: PENDING_CHANGE_REQUEST_LIMIT,
    status: PENDING_STATUSES,
  });
  return {
    changeRequests: page.changeRequests || [],
    changeRequestPageInfo: {
      nextCursor: page.nextCursor || null,
      limit: PENDING_CHANGE_REQUEST_LIMIT,
    },
  };
};

let runtimeClient;
let runtimeRecords;
let runtimeBases = new Map();

export const busabaseProvider = {
  name: "busabase",
  async getState() {
    const client = createRuntimeClient();
    const bases = appConfig.schema.bases;
    const missing = bases.filter((base) => !base.nodeId || !base.baseId);
    if (missing.length) {
      throw new Error(`SCHEMA_INCOMPLETE: ${missing.map((base) => base.slug).join(", ")}`);
    }
    runtimeClient = client;
    // `appId` is recorded on each write so a reviewer can see which app proposed it.
    runtimeRecords = createAirAppRecords(client, { appId: appConfig.appSlug });
    runtimeBases = new Map(bases.map((base) => [base.key, base]));
    const [pages, counts, changeRequests] = await Promise.all([
      Promise.all(bases.map(async (base) => [base.key, await readPage(runtimeRecords, base)])),
      Promise.all(bases.map(async (base) => [base.key, await countRecords(client, base)])),
      readChangeRequests(client),
    ]);
    return {
      provider: {
        ok: true,
        name: "busabase",
        mode: "busabase_sdk_openapi",
        deployment: appConfig.deployment,
        readOnly: appConfig.readOnly,
      },
      bases,
      records: pages.flatMap(([, page]) => page.records),
      pageInfo: Object.fromEntries(
        pages.map(([key, page]) => [key, { nextCursor: page.nextCursor, limit: page.limit }]),
      ),
      // Real total per Base from records.count, or null when denied/unavailable
      // -- the UI falls back to a "12+" style loaded-so-far approximation in
      // that case instead of presenting a made-up number.
      totalCount: Object.fromEntries(counts),
      ...changeRequests,
    };
  },
  async loadMore(baseKey, cursor) {
    const base = runtimeBases.get(baseKey);
    if (!runtimeRecords || !base || !cursor) throw new Error(`SCHEMA_INCOMPLETE: ${baseKey}`);
    return readPage(runtimeRecords, base, cursor);
  },
  async getRecord(baseKey, recordId) {
    requireProcedure("records.get");
    const base = runtimeBases.get(baseKey);
    if (!runtimeClient || !base) throw new Error(`SCHEMA_INCOMPLETE: ${baseKey}`);
    const record = await runtimeClient.records.get({ recordId });
    if (record.baseId !== base.baseId) throw new Error("RECORD_NOT_FOUND");
    return withBaseKey({ ...record, fields: airAppRecordFields(record) }, baseKey);
  },
  // Re-read the pending ChangeRequests, for the summary after a write that was
  // queued rather than saved.
  async refreshChangeRequests() {
    if (!runtimeClient) throw new Error("SCHEMA_INCOMPLETE: not loaded");
    return readChangeRequests(runtimeClient);
  },
  // Propose new values for one record. The SDK helper leaves `autoMerge` unset,
  // so the viewer's own permission decides the outcome: Busabase merges it for
  // someone with write access and opens a ChangeRequest for someone without.
  // Returns `{ status: "saved" | "queued", recordId?, changeRequestId?, ... }`
  // -- say which one happened (see `airAppWriteMessage` in app.js), never assume
  // either. Pass only the fields that changed; the rest keep their value.
  async updateRecord(baseKey, record, fields, message) {
    requireProcedure("records.changeRequest", allowedWrites);
    const base = runtimeBases.get(baseKey);
    if (!runtimeRecords || !base || record.baseId !== base.baseId) {
      throw new Error(`SCHEMA_INCOMPLETE: ${baseKey}`);
    }
    return runtimeRecords.updateRecord({
      recordId: record.id,
      baseCommitId: record.headCommitId,
      fields,
      message,
    });
  },
};
