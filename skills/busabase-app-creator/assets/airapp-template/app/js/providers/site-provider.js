import { appConfig } from "../config.js";

async function read(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error("SITE_DATA_UNAVAILABLE");
  return response.json();
}
const route = (kind, key) => `site/${kind}/${encodeURIComponent(key)}`;

// Public visitors only see the configured read-only projection. Editing remains
// available through the internal Node/Python application, with member identity.
export const siteProvider = {
  name: "site",
  async getState() {
    const bases = appConfig.schema.bases;
    const pages = await Promise.all(
      bases.map(async (base) => [base.key, await read(route("page", base.key))]),
    );
    const counts = await Promise.all(
      bases.map(async (base) => [
        base.key,
        await read(route("count", base.key))
          .then((value) => value.total)
          .catch(() => null),
      ]),
    );
    return {
      provider: { ok: true, name: "site", mode: "bounded_site_routes", readOnly: true },
      bases,
      records: pages.flatMap(([, page]) => page.records),
      pageInfo: Object.fromEntries(
        pages.map(([key, page]) => [key, { nextCursor: page.nextCursor, limit: page.limit }]),
      ),
      totalCount: Object.fromEntries(counts),
      changeRequests: [],
      changeRequestPageInfo: { nextCursor: null, limit: 20 },
    };
  },
  loadMore(baseKey, cursor) {
    return read(`${route("page", baseKey)}?cursor=${encodeURIComponent(cursor)}`);
  },
  getRecord(baseKey, recordId) {
    return read(`${route("record", baseKey)}/${encodeURIComponent(recordId)}`);
  },
};
