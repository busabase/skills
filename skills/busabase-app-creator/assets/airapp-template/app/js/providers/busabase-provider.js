import { createRuntimeClient } from "../busabase-client.js";
import { appConfig } from "../config.js";

const allowedReads = new Set(appConfig.permissions.read_procedures);

const requireProcedure = (procedure) => {
  if (!allowedReads.has(procedure)) throw new Error(`PROCEDURE_DENIED: ${procedure}`);
};

const PENDING_CHANGE_REQUEST_LIMIT = 20;
const PENDING_STATUSES = ["in_review", "changes_requested", "approved", "conflict"];

const normalizeRecords = (records, baseKey) =>
  (records || []).map((record) => ({
    ...record,
    baseKey,
    fields: record.headCommit?.payload || record.fields || {},
  }));

// One page per call, cursor returned to the caller -- never several pages in
// one function call. See "Reading Records At Scale" in
// references/runtime-and-sdk.md: a capped loop here (however high the cap)
// would still hide a multi-page scan behind a single loading state instead
// of fetching a page per user action.
const readPage = async (client, base, cursor) => {
  requireProcedure("records.list");
  const { baseId, key: baseKey } = base;
  const page = await client.records.list({
    baseId,
    limit: base.readLimit,
    ...(cursor ? { cursor } : {}),
  });
  return {
    records: normalizeRecords(page.records, baseKey),
    nextCursor: page.nextCursor || null,
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
    return { changeRequests: [], nextCursor: null };
  }
  const page = await client.changeRequests.list({
    limit: PENDING_CHANGE_REQUEST_LIMIT,
    status: PENDING_STATUSES,
  });
  return {
    changeRequests: page.changeRequests || [],
    nextCursor: page.nextCursor || null,
  };
};

let runtimeClient;
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
    runtimeBases = new Map(bases.map((base) => [base.key, base]));
    const [pages, counts, changeRequestPage] = await Promise.all([
      Promise.all(bases.map(async (base) => [base.key, await readPage(client, base)])),
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
      changeRequests: changeRequestPage.changeRequests,
      changeRequestPageInfo: {
        nextCursor: changeRequestPage.nextCursor,
        limit: PENDING_CHANGE_REQUEST_LIMIT,
      },
    };
  },
  async loadMore(baseKey, cursor) {
    const base = runtimeBases.get(baseKey);
    if (!runtimeClient || !base || !cursor) throw new Error(`SCHEMA_INCOMPLETE: ${baseKey}`);
    return readPage(runtimeClient, base, cursor);
  },
};
