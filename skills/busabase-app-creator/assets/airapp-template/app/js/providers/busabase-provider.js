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
    const [pages, changeRequestPage] = await Promise.all([
      Promise.all(
        bases.map(async (base) => {
          return [base.key, await readPage(client, base)];
        }),
      ),
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
