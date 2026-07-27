import { appConfig } from "../config.js";
import { createRuntimeClient } from "../rpc-client.js";

const allowedReads = new Set(appConfig.permissions.read_procedures);

const requireProcedure = (procedure) => {
  if (!allowedReads.has(procedure)) throw new Error(`PROCEDURE_DENIED: ${procedure}`);
};

const INITIAL_RECORD_LIMIT = 50;
const PENDING_CHANGE_REQUEST_LIMIT = 20;
const PENDING_STATUSES = ["in_review", "changes_requested", "approved", "conflict"];

const normalizeRecords = (records, baseKey) =>
  (records || []).map((record) => ({
    ...record,
    baseKey,
    fields: record.headCommit?.fields || record.fields || {},
  }));

const readPage = async (client, baseId, baseKey, cursor) => {
  requireProcedure("records.listPaged");
  const page = await client.records.listPaged({
    baseId,
    limit: INITIAL_RECORD_LIMIT,
    ...(cursor ? { cursor } : {}),
  });
  return {
    records: normalizeRecords(page.records, baseKey),
    nextCursor: page.nextCursor || null,
  };
};

const readChangeRequests = async (client) => {
  if (!allowedReads.has("changeRequests.listPaged")) {
    return { changeRequests: [], nextCursor: null };
  }
  const page = await client.changeRequests.listPaged({
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
    runtimeBases = new Map(bases.map((base) => [base.key, base.baseId]));
    const [pages, changeRequestPage] = await Promise.all([
      Promise.all(
        bases.map(async (base) => {
          return [base.key, await readPage(client, base.baseId, base.key)];
        }),
      ),
      readChangeRequests(client),
    ]);
    return {
      provider: {
        ok: true,
        name: "busabase",
        mode: "busabase_sdk_rpc",
        deployment: appConfig.deployment,
        readOnly: appConfig.readOnly,
      },
      bases,
      records: pages.flatMap(([, page]) => page.records),
      pageInfo: Object.fromEntries(
        pages.map(([key, page]) => [
          key,
          { nextCursor: page.nextCursor, limit: INITIAL_RECORD_LIMIT },
        ]),
      ),
      changeRequests: changeRequestPage.changeRequests,
      changeRequestPageInfo: {
        nextCursor: changeRequestPage.nextCursor,
        limit: PENDING_CHANGE_REQUEST_LIMIT,
      },
    };
  },
  async loadMore(baseKey, cursor) {
    const baseId = runtimeBases.get(baseKey);
    if (!runtimeClient || !baseId || !cursor) throw new Error(`SCHEMA_INCOMPLETE: ${baseKey}`);
    return readPage(runtimeClient, baseId, baseKey, cursor);
  },
};
